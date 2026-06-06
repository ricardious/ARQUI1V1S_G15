import random


class GasSensor:
    """Sensor de gas.

    TODO: reemplazar por lectura real del sensor de gas.
    """

    def read(self) -> int:
        return random.randint(90, 680)
