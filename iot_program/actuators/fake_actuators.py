from actuators.base import ActuatorController
from actuators.manager import ActuatorManager


class FakeActuators(ActuatorController):
    """Compatibilidad: usa ActuatorManager con actuadores simulados."""

    def __init__(self, manager: ActuatorManager) -> None:
        self.manager = manager

    def apply_command(self, command: str) -> dict[str, str | int]:
        return self.manager.apply_command(command)
