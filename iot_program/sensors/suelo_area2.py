import random


class SueloArea2Sensor:
    """Sensor de humedad de suelo del area 2.

    TODO: implementar lectura real del sensor de suelo del area 2.
    """

    def read(self) -> float:
        return round(random.uniform(28.0, 90.0), 1)
