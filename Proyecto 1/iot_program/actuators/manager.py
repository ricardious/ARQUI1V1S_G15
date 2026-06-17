from actuators.alarma import AlarmaActuator
from actuators.leds_estado import LedsEstadoActuator
from actuators.luces import LucesActuator
from actuators.riego_area1 import RiegoArea1Actuator
from actuators.riego_area2 import RiegoArea2Actuator
from actuators.ventilador import VentiladorActuator
from global_state import GlobalState


class ActuatorManager:
    """Integra actuadores individuales y aplica comandos del sistema."""

    def __init__(self, state: GlobalState) -> None:
        self.state = state
        self.riego_area1 = RiegoArea1Actuator()
        self.riego_area2 = RiegoArea2Actuator(self.riego_area1)
        self.ventilador = VentiladorActuator()
        self.luces = LucesActuator()
        self.alarma = AlarmaActuator()
        self.leds_estado = LedsEstadoActuator()

    def apply_command(self, command: str) -> dict[str, str | int]:
        action = command.strip().upper()
        changes: dict[str, str | int]

        if action == "ACTIVAR_RIEGO":
            changes = {**self.riego_area1.activar(), **self.riego_area2.activar()}
        elif action == "ACTIVAR_RIEGO_MANUAL":
            changes = {**self.riego_area1.activar_manual(), **self.riego_area2.activar_manual()}
        elif action == "DESACTIVAR_RIEGO":
            changes = {**self.riego_area1.desactivar(), **self.riego_area2.desactivar()}
        elif action == "ACTIVAR_RIEGO_1":
            changes = self.riego_area1.activar()
        elif action == "ACTIVAR_RIEGO_2":
            changes = self.riego_area2.activar()
        elif action == "DESACTIVAR_RIEGO_1":
            changes = self.riego_area1.desactivar()
        elif action == "DESACTIVAR_RIEGO_2":
            changes = self.riego_area2.desactivar()
        elif action == "ENCENDER_LUCES":
            changes = self.luces.encender()
        elif action == "APAGAR_LUCES":
            changes = self.luces.apagar()
        elif action == "ACTIVAR_VENTILADOR":
            changes = self.ventilador.activar_manual()
        elif action == "DESACTIVAR_VENTILADOR":
            changes = self.ventilador.desactivar()
        elif action == "ACTIVAR_ALARMA":
            changes = self.alarma.activar()
        elif action == "SILENCIAR_ALARMA":
            changes = self.alarma.silenciar()
        elif action == "CAMBIAR_MODO_AUTOMATICO":
            changes = self.leds_estado.modo_automatico()
        elif action == "CAMBIAR_MODO_MANUAL":
            changes = self.leds_estado.modo_manual()
        else:
            changes = {"last_error": f"Comando no reconocido: {command}"}

        self.state.update(**changes)
        return changes
