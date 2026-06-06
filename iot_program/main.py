import signal
import time
from threading import Event
from typing import Any

from actuators.manager import ActuatorManager
from config import Settings, load_settings
from global_state import GlobalState
from mongo_repository import MongoRepository
from mqtt_client import MQTTClient
from rules import evaluate_readings, event_description_for_command, estado_for_command
from sensors.manager import SensorManager

VALID_COMMANDS = {
    "ACTIVAR_RIEGO",
    "DESACTIVAR_RIEGO",
    "ACTIVAR_RIEGO_1",
    "ACTIVAR_RIEGO_2",
    "ENCENDER_LUCES",
    "APAGAR_LUCES",
    "ACTIVAR_VENTILADOR",
    "DESACTIVAR_VENTILADOR",
    "SILENCIAR_ALARMA",
    "CAMBIAR_MODO_AUTOMATICO",
    "CAMBIAR_MODO_MANUAL",
}


class IoTProgram:
    """Base de integracion IoT: MQTT, sensores, actuadores y MongoDB."""

    def __init__(self) -> None:
        self.settings: Settings = load_settings()
        self.state = GlobalState()
        self.sensors = SensorManager(self.state)
        self.actuators = ActuatorManager(self.state)
        self.mongo = MongoRepository(
            self.settings.mongodb_uri, self.settings.mongodb_db
        )
        self.mqtt = MQTTClient(self.settings, self._handle_mqtt_command)
        self.stop_event = Event()
        self.last_publish_at = 0.0

        signal.signal(signal.SIGINT, self._signal_shutdown)
        signal.signal(signal.SIGTERM, self._signal_shutdown)

    def run(self) -> None:
        self.run_mqtt_task()
        self.run_main_task()

    def run_main_task(self) -> None:
        """Loop principal: lee sensores, guarda historico y publica MQTT."""
        print("[IoT] Iniciando loop principal")
        while not self.stop_event.is_set():
            try:
                readings = self.read_sensors()
                estado = self.update_status(readings)
                readings["estado_global"] = estado
                self.state.update(**readings)

                self.mongo.insert_sensor_reading(readings, estado)
                self.mongo.update_system_status(self.state.as_dict())

                now = time.monotonic()
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
        """Conecta al broker MQTT y deja paho trabajando en segundo plano."""
        self.mqtt.connect()

    def read_sensors(self) -> dict[str, Any]:
        """Lee sensores simulados o futuros sensores reales."""
        if not self.settings.simulation_mode:
            print("[IoT] SIMULATION_MODE=false, pero todavia se usa FakeSensors.")
        return self.sensors.read_all()

    def publish_sensor_values(self, readings: dict[str, Any]) -> None:
        self.mqtt.publish_sensor_values(readings)

    def publish_actuator_values(self, state: dict[str, Any]) -> None:
        self.mqtt.publish_actuator_states(state)

    def update_status(self, readings: dict[str, Any]) -> str:
        """Aplica reglas basicas."""
        estado, events = evaluate_readings(readings, self.state.as_dict())
        if estado == "EMERGENCIA":
            self.state.update(alarma="ON")

        for description, event_state in events:
            self.mongo.insert_event(description, event_state, {"lectura": readings})
        return estado

    def _handle_mqtt_command(self, topic: str, payload: str) -> None:
        """Recibe comandos MQTT en texto plano."""
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

        changes = self.actuators.apply_command(action)
        estado = estado_for_command(action, self.state.as_dict())
        self.state.update(estado_global=estado)

        self.mongo.insert_command(action, payload, estado)
        self.mongo.insert_actuator_log(action, changes, estado)
        self.mongo.insert_event(
            event_description_for_command(action),
            estado,
            {"topic": topic, "cambios": changes},
        )
        self.mongo.update_system_status(self.state.as_dict())
        self.publish_actuator_values(self.state.as_dict())

    def _signal_shutdown(self, signum: int, frame: object) -> None:
        print(f"[IoT] Senal de apagado recibida: {signum}")
        self.stop_event.set()

    def handle_shutdown(self) -> None:
        print("[IoT] Cerrando iot_program")
        self.mqtt.disconnect()
        self.mongo.close()


def main() -> None:
    program = IoTProgram()
    program.run()


if __name__ == "__main__":
    main()
