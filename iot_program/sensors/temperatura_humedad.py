import random


class TemperaturaHumedadSensor:
    """Sensor combinado de temperatura y humedad ambiente.

    TODO: conectar aqui el DHT22/DHT11 u otro sensor real equivalente.
    """

    def leer_temperatura(self) -> float:
        return round(random.uniform(24.0, 36.5), 1)

    def leer_humedad(self) -> float:
        return round(random.uniform(55.0, 82.0), 1)
