import random

_I2C_AVAILABLE = False

try:
    import board
    import busio
    import adafruit_ads1x15.ads1115 as ADS
    from adafruit_ads1x15.analog_in import AnalogIn

    _I2C_AVAILABLE = True
except ImportError:
    pass


class SueloArea1Sensor:
    """Sensor de humedad de suelo del area 1 conectado a ADS1115 A1.

    Retorna porcentaje de humedad 0-100. En sensores resistivos comunes,
    valores crudos altos significan suelo seco y bajos suelo humedo.
    """

    _RAW_WET = 5000
    _RAW_DRY = 28000

    def __init__(self, channel: int = 1, address: int = 0x48) -> None:
        self._simulation = not _I2C_AVAILABLE
        self._analog_in = None

        if not self._simulation:
            try:
                i2c = busio.I2C(board.SCL, board.SDA)
                ads = ADS.ADS1115(i2c, address=address)
                ads_channels = [ADS.P0, ADS.P1, ADS.P2, ADS.P3]
                self._analog_in = AnalogIn(ads, ads_channels[channel])
            except Exception:
                self._simulation = True

    def read(self) -> float:
        if self._simulation or self._analog_in is None:
            return round(random.uniform(28.0, 90.0), 1)

        try:
            raw = int(self._analog_in.value)
        except Exception:
            return round(random.uniform(28.0, 90.0), 1)

        raw = max(self._RAW_WET, min(self._RAW_DRY, raw))
        humidity = (self._RAW_DRY - raw) / (self._RAW_DRY - self._RAW_WET) * 100
        return round(humidity, 1)

    def obtener_estado(self) -> dict[str, float | str]:
        humedad = self.read()
        if humedad < 30:
            clasificacion = "SECO"
        elif humedad > 70:
            clasificacion = "SATURADO"
        else:
            clasificacion = "NORMAL"
        return {"valor": humedad, "clasificacion": clasificacion}
