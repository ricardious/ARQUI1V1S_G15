from typing import Any


def estado_for_command(action: str, state: dict[str, Any]) -> str:
    if action in {"ACTIVAR_RIEGO", "ACTIVAR_RIEGO_MANUAL", "ACTIVAR_RIEGO_1", "ACTIVAR_RIEGO_2"}:
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
        "ACTIVAR_RIEGO_MANUAL": "riego manual activado",
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
