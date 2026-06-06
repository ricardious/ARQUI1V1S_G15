from typing import Protocol

from models import SensorReading


class SensorReader(Protocol):
    """Interfaz esperada para sensores simulados o reales."""

    def read_all(self) -> SensorReading:
        ...
