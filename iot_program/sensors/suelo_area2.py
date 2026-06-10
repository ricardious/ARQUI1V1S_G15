from sensors.suelo_area1 import SueloArea1Sensor


class SueloArea2Sensor(SueloArea1Sensor):
    """Sensor de humedad de suelo del area 2 conectado a ADS1115 A2."""

    def __init__(self, channel: int = 2, address: int = 0x48) -> None:
        super().__init__(channel=channel, address=address)
