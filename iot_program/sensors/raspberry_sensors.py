from models import SensorReading
from sensors.base import SensorReader


class RaspberrySensors(SensorReader):
    """Placeholder para sensores reales conectados a Raspberry Pi."""

    def read_all(self) -> SensorReading:
        raise NotImplementedError("Sensores reales pendientes de integrar con GPIO/I2C/SPI.")
