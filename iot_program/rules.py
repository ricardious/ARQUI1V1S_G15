from typing import Any


def _as_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def evaluate_readings(readings: dict[str, Any], state: dict[str, Any]) -> tuple[str, list[tuple[str, str]]]:
    """Evalua reglas basicas del invernadero.

    Esto no reemplaza ARM64 ni calcula estadisticas. Solo clasifica estado
    operativo inmediato para alertas y actuadores.
    """
    events: list[tuple[str, str]] = []
    has_emergency = False
    has_warning = False

    gas = _as_float(readings.get("gas"))
    temperatura = _as_float(readings.get("temperatura"))
    humedad_suelo_area1 = _as_float(readings.get("humedad_suelo_area1"))
    humedad_suelo_area2 = _as_float(readings.get("humedad_suelo_area2"))
    luz = _as_float(readings.get("luz"))

    if gas >= 600:
        has_emergency = True
        events.append(("gas en emergencia", "EMERGENCIA"))

    if temperatura >= 34:
        has_warning = True
        events.append(("temperatura alta", "ADVERTENCIA"))

    if humedad_suelo_area1 < 35 or humedad_suelo_area2 < 35:
        has_warning = True
        events.append(("suelo seco", "ADVERTENCIA"))

    if luz < 250:
        has_warning = True
        events.append(("luz baja", "ADVERTENCIA"))

    if humedad_suelo_area1 > 85 or humedad_suelo_area2 > 85:
        has_warning = True
        events.append(("suelo saturado", "ADVERTENCIA"))

    if has_emergency:
        estado = "EMERGENCIA"
    elif state.get("riego_1") == 1 or state.get("riego_2") == 1:
        estado = "RIEGO_ACTIVO"
    elif state.get("modo") == "MANUAL":
        estado = "MODO_MANUAL"
    elif has_warning:
        estado = "ADVERTENCIA"
    else:
        estado = "NORMAL"

    return estado, events


def estado_for_command(action: str, state: dict[str, Any]) -> str:
    if action in {"ACTIVAR_RIEGO", "ACTIVAR_RIEGO_1", "ACTIVAR_RIEGO_2"}:
        return "RIEGO_ACTIVO"
    if action in {"DESACTIVAR_RIEGO", "DESACTIVAR_RIEGO_1", "DESACTIVAR_RIEGO_2"}:
        if int(state.get("riego_1", 0)) == 1 or int(state.get("riego_2", 0)) == 1:
            return "RIEGO_ACTIVO"
        if state.get("modo") == "MANUAL":
            return "MODO_MANUAL"
        return "NORMAL"
    if action == "ACTIVAR_ALARMA":
        return "EMERGENCIA"
    if action == "CAMBIAR_MODO_MANUAL":
        return "MODO_MANUAL"
    if action == "CAMBIAR_MODO_AUTOMATICO":
        return "NORMAL"
    return str(state.get("estado_global", "NORMAL"))


def event_description_for_command(action: str) -> str:
    descriptions = {
        "ACTIVAR_RIEGO": "riego activado",
        "ACTIVAR_RIEGO_1": "riego activado area 1",
        "ACTIVAR_RIEGO_2": "riego activado area 2",
        "DESACTIVAR_RIEGO": "riego desactivado",
        "DESACTIVAR_RIEGO_1": "riego desactivado area 1",
        "DESACTIVAR_RIEGO_2": "riego desactivado area 2",
        "ACTIVAR_VENTILADOR": "ventilador activado",
        "DESACTIVAR_VENTILADOR": "ventilador desactivado",
        "ENCENDER_LUCES": "luces encendidas",
        "APAGAR_LUCES": "luces apagadas",
        "ACTIVAR_ALARMA": "alarma activada",
        "SILENCIAR_ALARMA": "alarma silenciada",
        "CAMBIAR_MODO_AUTOMATICO": "cambio de modo automatico",
        "CAMBIAR_MODO_MANUAL": "cambio de modo manual",
    }
    return descriptions.get(action, f"comando ejecutado: {action}")
