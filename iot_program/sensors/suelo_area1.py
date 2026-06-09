import random


class SueloArea1Sensor:
    """Sensor de humedad de suelo del area 1.

    TODO: implementar lectura real del sensor de suelo del area 1.
    """

    def read(self) -> float:
        return round(random.uniform(28.0, 90.0), 1)
