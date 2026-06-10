import random
import time

_DHT_AVAILABLE = False
_DHT_PIN = None
_DHT_SENSOR_TYPE = ""

try:
    import board
    import adafruit_dht

    _DHT_AVAILABLE = True
    _DHT_PIN = board.D4
    _DHT_SENSOR_TYPE = "adafruit"
except (ImportError, NotImplementedError):
    try:
        import Adafruit_DHT

        _DHT_AVAILABLE = True
        _DHT_PIN = 4
        _DHT_SENSOR_TYPE = "legacy"
    except ImportError:
        pass


class TemperaturaHumedadSensor:
    """Sensor DHT22/DHT11 de temperatura y humedad ambiente.

    Pin por defecto: GPIO4. Si las librerias de Raspberry no estan
    disponibles, usa simulacion para permitir pruebas locales.
    """

    _CACHE_SECONDS = 2.0

    def __init__(self, pin=None) -> None:
        self._simulation = not _DHT_AVAILABLE
        self._pin = pin if pin is not None else _DHT_PIN
        self._device = None
        self._cached_temp = 25.0
        self._cached_humidity = 60.0
        self._last_read_at = 0.0

        if not self._simulation and _DHT_SENSOR_TYPE == "adafruit":
            try:
                self._device = adafruit_dht.DHT22(self._pin)
            except Exception:
                self._simulation = True

    def leer_temperatura(self) -> float:
        temperatura, _ = self._read_sensor()
        return temperatura

    def leer_humedad(self) -> float:
        _, humedad = self._read_sensor()
        return humedad

    def _read_sensor(self) -> tuple[float, float]:
        now = time.monotonic()
        if now - self._last_read_at < self._CACHE_SECONDS:
            return self._cached_temp, self._cached_humidity

        if self._simulation:
            self._cached_temp = round(random.uniform(24.0, 36.5), 1)
            self._cached_humidity = round(random.uniform(55.0, 82.0), 1)
            self._last_read_at = now
            return self._cached_temp, self._cached_humidity

        temperatura = None
        humedad = None
        try:
            if _DHT_SENSOR_TYPE == "legacy":
                humedad, temperatura = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, self._pin)
            else:
                temperatura = self._device.temperature
                humedad = self._device.humidity
        except Exception:
            pass

        if temperatura is not None:
            self._cached_temp = round(float(temperatura), 1)
        if humedad is not None:
            self._cached_humidity = round(float(humedad), 1)

        self._last_read_at = now
        return self._cached_temp, self._cached_humidity
