import random


class LuzSensor:
    """Sensor de luz.

    TODO: reemplazar por lectura real del LDR o sensor de luz usado.
    """

    def read(self) -> int:
        return random.randint(180, 700)
