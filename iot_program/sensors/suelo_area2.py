from sensors.suelo_area1 import SueloArea1Sensor

class SueloArea2Sensor:
    """
    Sensor de humedad para el suelo del area 2,
    Comparte hardware con area 1.
    Recibe la instancia ya creada para evitar
    doble conexión I2C al mismo ADS1115.
    """
    def __init__(self, sensor_area1: SueloArea1Sensor = None):
        # Si nos pasan la instancia existente, la reutilizamos
        # Si no, creamos una nueva (para compatibilidad)
        self._sensor_fisico = sensor_area1 or SueloArea1Sensor()

    def read(self) -> float:
        return self._sensor_fisico.read()

    def obtener_estado(self) -> dict:
        return self._sensor_fisico.obtener_estado()