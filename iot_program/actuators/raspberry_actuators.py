from actuators.base import ActuatorController


class RaspberryActuators(ActuatorController):
    """Placeholder para actuadores reales conectados a reles/GPIO."""

    def apply_command(self, command: str) -> dict[str, str | int]:
        raise NotImplementedError("Actuadores reales pendientes de integrar con GPIO.")
