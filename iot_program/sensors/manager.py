from global_state import GlobalState
from models import SensorReading
from sensors.gas import GasSensor
from sensors.luz import LuzSensor
from sensors.suelo_area1 import SueloArea1Sensor
from sensors.temperatura_humedad import TemperaturaHumedadSensor


class SensorManager:
    """Integra sensores individuales y entrega una lectura unificada."""

    def __init__(self, state: GlobalState) -> None:
        self.state = state
        self.temperatura_humedad = TemperaturaHumedadSensor()
        self.suelo_area1 = SueloArea1Sensor()
        self.luz = LuzSensor()
        self.gas = GasSensor()

    def read_all(self) -> SensorReading:
        suelo = self.suelo_area1.read()
        return {
            "temperatura": self.temperatura_humedad.leer_temperatura(),
            "humedad_ambiente": self.temperatura_humedad.leer_humedad(),
            "humedad_suelo_area1": suelo,
            "humedad_suelo_area2": suelo,
            "luz": self.luz.read(),
            "gas": self.gas.read(),
            "riego_1": self.state.get("riego_1", 0),
            "riego_2": self.state.get("riego_2", 0),
            "estado_global": "NORMAL",
        }
