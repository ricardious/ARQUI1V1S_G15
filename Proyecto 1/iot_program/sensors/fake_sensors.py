from models import SensorReading
from sensors.base import SensorReader
from sensors.manager import SensorManager


class FakeSensors(SensorReader):
    """Compatibilidad: usa SensorManager con sensores simulados individuales."""

    def __init__(self, manager: SensorManager) -> None:
        self.manager = manager

    def read_all(self) -> SensorReading:
        return self.manager.read_all()
