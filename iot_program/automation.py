import time
from dataclasses import dataclass, field
from typing import Any

from actuators.base import ActuatorController
from global_state import GlobalState
from mongo_repository import MongoRepository


DRY_SOIL_THRESHOLD = 35.0
SOIL_RECOVERY_THRESHOLD = 55.0
SATURATED_SOIL_THRESHOLD = 85.0
LOW_LIGHT_THRESHOLD = 250.0
LIGHT_RECOVERY_THRESHOLD = 320.0
HIGH_TEMPERATURE_THRESHOLD = 34.0
TEMPERATURE_RECOVERY_THRESHOLD = 31.0
GAS_EMERGENCY_THRESHOLD = 600.0
GAS_RECOVERY_THRESHOLD = 520.0
IRRIGATION_MAX_SECONDS = 8.0
IRRIGATION_COOLDOWN_SECONDS = 20.0


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


@dataclass
class IrrigationRuntime:
    started_at: float | None = None
    next_allowed_at: float = 0.0
    blocked_by_saturation: bool = False


@dataclass
class AutomationController:
    """Ejecuta acciones automaticas por umbrales.

    Los sensores y actuadores siguen viviendo en sus archivos individuales.
    Esta clase solo conecta lecturas con acciones cuando el modo es automatico,
    y mantiene protecciones basicas para no dejar bombas encendidas.
    """

    state: GlobalState
    actuators: ActuatorController
    mongo: MongoRepository
    irrigation: dict[int, IrrigationRuntime] = field(
        default_factory=lambda: {1: IrrigationRuntime(), 2: IrrigationRuntime()}
    )

    def apply(self, readings: dict[str, Any]) -> dict[str, dict[str, str | int]]:
        actions: dict[str, dict[str, str | int]] = {}
        mode = self.state.get("modo", "AUTOMATICO")
        gas = _as_float(readings.get("gas"))

        if gas >= GAS_EMERGENCY_THRESHOLD:
            actions.update(self._apply_gas_emergency())
            return actions

        if gas < GAS_RECOVERY_THRESHOLD and self.state.get("alarma") == "ON":
            actions.update(self._execute("SILENCIAR_ALARMA", "gas normalizado", "NORMAL"))

        if gas < GAS_RECOVERY_THRESHOLD and self.state.get("ventilador") == "VENTILACION_EMERGENCIA":
            temp = _as_float(readings.get("temperatura"))
            if temp < HIGH_TEMPERATURE_THRESHOLD:
                actions.update(self._run_action(
                    self.actuators.ventilador.desactivar,
                    "DESACTIVAR_VENTILADOR",
                    "ventilador desactivado, gas normalizado",
                    "NORMAL",
                ))

        if mode != "AUTOMATICO":
            return actions

        actions.update(self._apply_irrigation(readings))
        actions.update(self._apply_lighting(readings))
        actions.update(self._apply_ventilation(readings))
        return actions

    def _apply_irrigation(self, readings: dict[str, Any]) -> dict[str, dict[str, str | int]]:
        actions: dict[str, dict[str, str | int]] = {}
        actions.update(self._apply_irrigation_area(1, _as_float(readings.get("humedad_suelo_area1"))))
        actions.update(self._apply_irrigation_area(2, _as_float(readings.get("humedad_suelo_area2"))))
        return actions

    def _apply_irrigation_area(self, area: int, humidity: float) -> dict[str, dict[str, str | int]]:
        runtime = self.irrigation[area]
        now = time.monotonic()
        state_key = f"riego_{area}"
        is_on = int(self.state.get(state_key, 0)) == 1
        actions: dict[str, dict[str, str | int]] = {}

        if is_on and runtime.started_at is None:
            runtime.started_at = now

        if is_on and runtime.started_at is not None:
            if now - runtime.started_at >= IRRIGATION_MAX_SECONDS:
                actions.update(
                    self._stop_irrigation_area(
                        area,
                        "riego detenido por duracion maxima",
                        "RIEGO_ACTIVO",
                    )
                )
                return actions

        if humidity >= SATURATED_SOIL_THRESHOLD:
            if is_on:
                runtime.blocked_by_saturation = True
                actions.update(
                    self._stop_irrigation_area(
                        area,
                        "riego bloqueado por suelo saturado",
                        "ADVERTENCIA",
                    )
                )
            elif not runtime.blocked_by_saturation:
                runtime.blocked_by_saturation = True
                self.mongo.insert_event(
                    f"riego area {area} bloqueado por suelo saturado",
                    "ADVERTENCIA",
                    {"humedad_suelo": humidity, "area": area},
                )
            return actions

        if humidity < SATURATED_SOIL_THRESHOLD:
            runtime.blocked_by_saturation = False

        if is_on and humidity >= SOIL_RECOVERY_THRESHOLD:
            actions.update(
                self._stop_irrigation_area(
                    area,
                    "riego detenido por humedad recuperada",
                    "NORMAL",
                )
            )
            return actions

        if humidity < DRY_SOIL_THRESHOLD and not is_on and now >= runtime.next_allowed_at:
            action = f"ACTIVAR_RIEGO_{area}"
            actions.update(
                self._execute(
                    action,
                    f"riego automatico activado area {area}",
                    "RIEGO_ACTIVO",
                    {"humedad_suelo": humidity, "area": area},
                )
            )
            runtime.started_at = now
            return actions

        return actions

    def _stop_irrigation_area(
        self,
        area: int,
        description: str,
        estado: str,
    ) -> dict[str, dict[str, str | int]]:
        runtime = self.irrigation[area]
        runtime.started_at = None
        runtime.next_allowed_at = time.monotonic() + IRRIGATION_COOLDOWN_SECONDS
        return self._execute(
            f"DESACTIVAR_RIEGO_{area}",
            f"{description} area {area}",
            estado,
            {"area": area},
        )

    def _apply_lighting(self, readings: dict[str, Any]) -> dict[str, dict[str, str | int]]:
        light = _as_float(readings.get("luz"))
        lights_on = self.state.get("luces") == "ON"

        if light < LOW_LIGHT_THRESHOLD and not lights_on:
            return self._execute(
                "ENCENDER_LUCES",
                "luces automaticas encendidas por luz baja",
                "ADVERTENCIA",
                {"luz": light},
            )

        if light >= LIGHT_RECOVERY_THRESHOLD and lights_on:
            return self._execute(
                "APAGAR_LUCES",
                "luces automaticas apagadas por luz suficiente",
                "NORMAL",
                {"luz": light},
            )

        return {}

    def _apply_ventilation(self, readings: dict[str, Any]) -> dict[str, dict[str, str | int]]:
        temperature = _as_float(readings.get("temperatura"))
        ventilador_state = self.state.get("ventilador", "VENTILACION_OFF")
        fan_active = ventilador_state != "VENTILACION_OFF"

        if temperature >= HIGH_TEMPERATURE_THRESHOLD and not fan_active:
            return self._run_action(
                self.actuators.ventilador.activar,
                "ACTIVAR_VENTILADOR",
                "ventilador automatico activado por temperatura alta",
                "ADVERTENCIA",
                {"temperatura": temperature},
            )

        if temperature <= TEMPERATURE_RECOVERY_THRESHOLD and ventilador_state == "VENTILACION_ON":
            return self._run_action(
                self.actuators.ventilador.desactivar,
                "DESACTIVAR_VENTILADOR",
                "ventilador automatico desactivado por temperatura normal",
                "NORMAL",
                {"temperatura": temperature},
            )

        return {}

    def _apply_gas_emergency(self) -> dict[str, dict[str, str | int]]:
        actions: dict[str, dict[str, str | int]] = {}
        if self.state.get("ventilador") == "VENTILACION_OFF":
            actions.update(self._run_action(
                self.actuators.ventilador.activar_emergencia,
                "ACTIVAR_VENTILADOR",
                "ventilador activado por emergencia de gas",
                "EMERGENCIA",
            ))
        if self.state.get("alarma") != "ON":
            actions.update(
                self._execute(
                    "ACTIVAR_ALARMA",
                    "alarma activada por emergencia de gas",
                    "EMERGENCIA",
                )
            )
        return actions

    def _run_action(
        self,
        action_fn: Any,
        command_name: str,
        description: str,
        estado: str,
        extra: dict[str, Any] | None = None,
    ) -> dict[str, dict[str, str | int]]:
        changes = action_fn()
        self.state.update(**changes)
        self.mongo.insert_actuator_log(command_name, changes, estado)
        event_extra: dict[str, Any] = {"cambios": changes}
        if extra:
            event_extra.update(extra)
        self.mongo.insert_event(description, estado, event_extra)
        print(f"[AUTO] {description}: {changes}")
        return {command_name: changes}

    def _execute(
        self,
        action: str,
        description: str,
        estado: str,
        extra: dict[str, Any] | None = None,
    ) -> dict[str, dict[str, str | int]]:
        changes = self.actuators.apply_command(action)
        self.state.update(**changes)
        self.mongo.insert_actuator_log(action, changes, estado)
        event_extra = {"cambios": changes}
        if extra:
            event_extra.update(extra)
        self.mongo.insert_event(description, estado, event_extra)
        print(f"[AUTO] {description}: {changes}")
        return {action: changes}
