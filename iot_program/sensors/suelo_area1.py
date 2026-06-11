import random

_I2C_AVAILABLE = False

try:
    import adafruit_ads1x15.ads1115 as ADS
    from adafruit_ads1x15.analog_in import AnalogIn
    from sensors.i2c_bus import get_i2c, get_lock

    _I2C_AVAILABLE = True
except ImportError:
    pass


class SueloArea1Sensor:
    """Sensor de humedad de suelo del area 1 conectado a ADS1115 A0.

    Retorna porcentaje de humedad 0-100. En sensores resistivos comunes,
    valores crudos altos significan suelo seco y bajos suelo humedo.
    """

    _RAW_WET = 5000
    _RAW_DRY = 28000

    def __init__(self, channel: int = 0, address: int = 0x48) -> None:
        self._simulation = not _I2C_AVAILABLE
        self._analog_in = None
        self._lock = get_lock() if _I2C_AVAILABLE else None

        if not self._simulation:
            try:
                ads = ADS.ADS1115(get_i2c(), address=address)
                self._analog_in = AnalogIn(ads, channel)
            except Exception as e:
                self._simulation = True
                print(f"[Sensor] Suelo (ADS1115 A{channel}): fallo inicializacion, simulacion ({e})")

        if self._simulation:
            print(f"[Sensor] Suelo (ADS1115 A{channel}): simulacion (hardware no disponible)")
        else:
            print(f"[Sensor] Suelo (ADS1115 A{channel}): hardware (0x{address:02X})")

    def read(self) -> float:
        if self._simulation or self._analog_in is None:
            return round(random.uniform(40.0, 75.0), 1)

        try:
            with self._lock:
                raw = int(self._analog_in.value)
        except Exception as e:
            print(f"[Sensor] Suelo: error de lectura, usando simulacion ({e})")
            return round(random.uniform(40.0, 75.0), 1)

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
