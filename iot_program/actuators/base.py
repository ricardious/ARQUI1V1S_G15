from typing import Protocol


class ActuatorController(Protocol):
    """Interfaz esperada para actuadores simulados o reales."""

    def apply_command(self, command: str) -> dict[str, str | int]:
        ...
