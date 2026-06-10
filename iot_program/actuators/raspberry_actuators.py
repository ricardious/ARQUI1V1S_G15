from actuators.base import ActuatorController
from actuators.alarma import AlarmaActuator
from actuators.leds_estado import LedsEstadoActuator
from actuators.luces import LucesActuator
from actuators.riego_area1 import RiegoArea1Actuator
from actuators.riego_area2 import RiegoArea2Actuator
from actuators.ventilador import VentiladorActuator


class RaspberryActuators(ActuatorController):
    """Integra actuadores reales conectados a reles/GPIO.

    Cada actuador vive en su propio archivo. Esta clase solo traduce comandos
    MQTT a llamadas concretas cuando SIMULATION_MODE=false.
    """

    def __init__(self) -> None:
        self.riego_area1 = RiegoArea1Actuator()
        self.riego_area2 = RiegoArea2Actuator(self.riego_area1)
        self.ventilador = VentiladorActuator()
        self.luces = LucesActuator()
        self.alarma = AlarmaActuator()
        self.leds_estado = LedsEstadoActuator()

    def apply_command(self, command: str) -> dict[str, str | int]:
        action = command.strip().upper()

        if action == "ACTIVAR_RIEGO":
            return {**self.riego_area1.activar(), **self.riego_area2.activar()}
        if action == "DESACTIVAR_RIEGO":
            return {**self.riego_area1.desactivar(), **self.riego_area2.desactivar()}
        if action == "ACTIVAR_RIEGO_1":
            return self.riego_area1.activar()
        if action == "ACTIVAR_RIEGO_2":
            return self.riego_area2.activar()
        if action == "DESACTIVAR_RIEGO_1":
            return self.riego_area1.desactivar()
        if action == "DESACTIVAR_RIEGO_2":
            return self.riego_area2.desactivar()
        if action == "ENCENDER_LUCES":
            return self.luces.encender()
        if action == "APAGAR_LUCES":
            return self.luces.apagar()
        if action == "ACTIVAR_VENTILADOR":
            return self.ventilador.activar()
        if action == "DESACTIVAR_VENTILADOR":
            return self.ventilador.desactivar()
        if action == "ACTIVAR_ALARMA":
            return self.alarma.activar()
        if action == "SILENCIAR_ALARMA":
            return self.alarma.silenciar()
        if action == "CAMBIAR_MODO_AUTOMATICO":
            return self.leds_estado.modo_automatico()
        if action == "CAMBIAR_MODO_MANUAL":
            return self.leds_estado.modo_manual()

        return {"last_error": f"Comando no reconocido: {command}"}
