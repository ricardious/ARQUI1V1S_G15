import signal
import time
from threading import Event
from typing import Any

from arm64_bridge import Arm64Bridge
from actuators.manager import ActuatorManager
from actuators.raspberry_actuators import RaspberryActuators
from config import Settings, load_settings
from global_state import GlobalState
from mongo_repository import MongoRepository
from mqtt_client import MQTTClient
from rules import event_description_for_command, estado_for_command
from local_panel.buttons import Buttons
from local_panel.lcd_display import LCDDisplay
from sensors.manager import SensorManager
from sensors.raspberry_sensors import RaspberrySensors

VALID_COMMANDS = {
    "ACTIVAR_RIEGO",
    "ACTIVAR_RIEGO_MANUAL",
    "DESACTIVAR_RIEGO",
    "ACTIVAR_RIEGO_1",
    "ACTIVAR_RIEGO_2",
    "DESACTIVAR_RIEGO_1",
    "DESACTIVAR_RIEGO_2",
    "ENCENDER_LUCES",
    "APAGAR_LUCES",
    "ACTIVAR_VENTILADOR",
    "DESACTIVAR_VENTILADOR",
    "ACTIVAR_ALARMA",
    "SILENCIAR_ALARMA",
    "CAMBIAR_MODO_AUTOMATICO",
    "CAMBIAR_MODO_MANUAL",
}


class IoTProgram:
    """Programa principal del IoT."""

    def __init__(self) -> None:
        self.settings: Settings = load_settings()
        self.state = GlobalState()
        if self.settings.simulation_mode:
            self.sensors = SensorManager(self.state)
            self.actuators = ActuatorManager(self.state)
            print("[IoT] Modo simulacion activo")
        else:
            self.sensors = RaspberrySensors(self.state)
            self.actuators = RaspberryActuators()
            print("[IoT] Modo Raspberry activo")
        self.buttons = Buttons()
        self.lcd = LCDDisplay()
        self.mongo = MongoRepository(
            self.settings.mongodb_uri, self.settings.mongodb_db
        )
        self.mqtt = MQTTClient(self.settings, self._handle_mqtt_command)
        # ARM64 decide
        self.arm64 = Arm64Bridge()
        self.stop_event = Event()
        self.last_publish_at = 0.0
        self.last_mongo_at = 0.0

        signal.signal(signal.SIGINT, self._signal_shutdown)
        signal.signal(signal.SIGTERM, self._signal_shutdown)

    def run(self) -> None:
        self.run_mqtt_task()
        self.run_main_task()

    def run_main_task(self) -> None:
        """Loop principal."""
        print("[IoT] Iniciando loop principal")
        while not self.stop_event.is_set():
            try:
                for button_event in self.buttons.poll():
                    self._handle_button_event(button_event)

                readings = self.read_sensors()
                self.state.update(**readings)
                estado = self.run_arm64_decision(readings)
                readings["riego_1"] = self.state.get("riego_1", 0)
                readings["riego_2"] = self.state.get("riego_2", 0)
                readings["estado_global"] = estado
                if hasattr(self.actuators, "leds_estado"):
                    self.actuators.leds_estado.set_estado(estado)
                self.lcd.update(self.state.as_dict())

                now = time.monotonic()
                if (
                    now - self.last_mongo_at
                    >= self.settings.mqtt_publish_interval_seconds
                ):
                    self.mongo.insert_sensor_reading(readings, estado)
                    self.mongo.update_system_status(self.state.as_dict())
                    self.last_mongo_at = now

                if (
                    now - self.last_publish_at
                    >= self.settings.mqtt_publish_interval_seconds
                ):
                    self.publish_sensor_values(readings)
                    self.publish_actuator_values(self.state.as_dict())
                    self.last_publish_at = now
            except Exception as exc:
                self.state.update(last_error=str(exc))
                self.mongo.insert_event(
                    "error de lectura de sensor", "ADVERTENCIA", {"error": str(exc)}
                )
                print(f"[IoT] Error en loop principal: {exc}")

            self.stop_event.wait(self.settings.sensor_interval_seconds)

        self.handle_shutdown()

    def run_mqtt_task(self) -> None:
        """Arranca MQTT."""
        self.mqtt.connect()

    def read_sensors(self) -> dict[str, Any]:
        """Lee los sensores activos."""
        return self.sensors.read_all()

    def publish_sensor_values(self, readings: dict[str, Any]) -> None:
        self.mqtt.publish_sensor_values(readings)

    def publish_actuator_values(self, state: dict[str, Any]) -> None:
        self.mqtt.publish_actuator_states(state)

    def run_arm64_decision(self, readings: dict[str, Any]) -> str:
        """Pasa la lectura por ARM64 y aplica la acción si toca."""
        previous = self.state.get("estado_global", "NORMAL")
        modo = 1 if self.state.get("modo") == "MANUAL" else 0
        outcome = self.arm64.decide(readings, modo)
        if outcome is None:
            self.state.update(last_error="motor ARM64 no respondió")
            self.mongo.insert_event("motor ARM64 sin respuesta", "ADVERTENCIA")
            return previous

        line, fields = outcome
        action = fields.get("ACTION")
        status = fields.get("STATUS", "OK")

        # El RISK de ARM64 define el estado y el LED.
        risk = fields.get("RISK", "LOW").upper()
        if risk == "CRITICAL":
            estado = "EMERGENCIA"
        elif modo == 1:
            estado = "MODO_MANUAL"
        elif risk in ("MEDIUM", "HIGH"):
            estado = "ADVERTENCIA"
        else:
            estado = "NORMAL"

        self.mongo.insert_arm64_result(
            source="live_engine",
            module="motor",
            input_data=line,
            result=fields,
            decision=action,
            risk=fields.get("RISK"),
            status=status,
            error_detail=fields.get("DETAIL") if status == "ERROR" else None,
        )

        self.state.update(estado_global=estado)
        if estado != previous:
            self.mongo.insert_event(
                f"estado {previous} -> {estado} (ARM64)", estado, {"arm64": fields}
            )

        if status == "ERROR":
            self.state.update(
                last_error=f"ARM64 {fields.get('ERROR', '')}: {fields.get('DETAIL', '')}"
            )
            return estado

        # En manual solo se deja pasar la alarma.
        if modo == 1 and action != "ALARM_ON":
            return estado

        command = self.arm64.command_for(fields)
        if command is None:
            return estado  # nada físico que hacer

        if command not in VALID_COMMANDS:
            self.state.update(last_error=f"acción ARM64 no permitida: {action}")
            return estado

        changes = self.actuators.apply_command(command)
        self.state.update(**changes)
        self.mongo.insert_actuator_log(command, changes, estado)
        self.mongo.insert_event(
            f"acción ARM64 ejecutada: {action}",
            estado,
            {"arm64": fields, "comando": command, "cambios": changes},
        )
        return estado

    def _handle_mqtt_command(self, topic: str, payload: str) -> None:
        """Recibe comandos MQTT."""
        action = payload.strip().upper()
        print(f"[MQTT] Comando recibido topic={topic} payload={payload}")

        if action not in VALID_COMMANDS:
            self.state.update(last_error=f"Comando no reconocido: {payload}")
            self.mongo.insert_event(
                "comando mqtt no reconocido",
                "ADVERTENCIA",
                {"payload": payload, "topic": topic},
            )
            return

        self._execute_command(action, payload, {"topic": topic})

    def _handle_button_event(self, event: str) -> None:
        action_by_event = {
            "TOGGLE_MODE": (
                "CAMBIAR_MODO_AUTOMATICO"
                if self.state.get("modo") == "MANUAL"
                else "CAMBIAR_MODO_MANUAL"
            ),
            "TOGGLE_WATER": (
                "DESACTIVAR_RIEGO"
                if int(self.state.get("riego_1", 0)) == 1
                or int(self.state.get("riego_2", 0)) == 1
                else "ACTIVAR_RIEGO_MANUAL"
            ),
            "TOGGLE_LIGHTS": (
                "APAGAR_LUCES" if self.state.get("luces") == "ON" else "ENCENDER_LUCES"
            ),
            "SILENCE_ALARM": "SILENCIAR_ALARMA",
        }
        action = action_by_event.get(event)
        if not action:
            self.state.update(last_error=f"Evento de boton no reconocido: {event}")
            return

        print(f"[PANEL] Evento={event} accion={action}")
        self._execute_command(action, event, {"origen": "panel_local", "evento": event})

    def _execute_command(
        self,
        action: str,
        original_payload: str,
        extra: dict[str, Any],
    ) -> None:
        changes = self.actuators.apply_command(action)
        estado = estado_for_command(action, self.state.as_dict())
        self.state.update(**{**changes, "estado_global": estado})

        self.mongo.insert_command(action, original_payload, estado)
        self.mongo.insert_actuator_log(action, changes, estado)
        self.mongo.insert_event(
            event_description_for_command(action),
            estado,
            {**extra, "cambios": changes},
        )
        self.mongo.update_system_status(self.state.as_dict())
        self.publish_actuator_values(self.state.as_dict())

    def _signal_shutdown(self, signum: int, frame: object) -> None:
        print(f"[IoT] Senal de apagado recibida: {signum}")
        self.stop_event.set()

    def handle_shutdown(self) -> None:
        print("[IoT] Cerrando iot_program")
        for component in (self.lcd, self.buttons):
            cleanup = getattr(component, "cleanup", None)
            if callable(cleanup):
                cleanup()
        if isinstance(self.actuators, RaspberryActuators):
            self.actuators.ventilador.desactivar()
            self.actuators.riego_area1.desactivar()
            self.actuators.ventilador.limpiar()
            self.actuators.riego_area1.limpiar()
        self.arm64.close()
        self.mqtt.disconnect()
        self.mongo.close()


def main() -> None:
    program = IoTProgram()
    program.run()


if __name__ == "__main__":
    main()
