import random

_I2C_AVAILABLE = False

try:
    from adafruit_ads1x15.analog_in import AnalogIn
    from sensors.i2c_bus import get_ads, get_lock

    _I2C_AVAILABLE = True
except ImportError:
    pass


class GasSensor:
    """Sensor MQ-2/MQ-135 conectado a ADS1115 por I2C.

    Canal por defecto: A0. Retorna un valor normalizado 0-1000 para que
    las reglas existentes puedan usar el umbral de emergencia 600.
    """

    _RAW_CLEAN = 2800
    _RAW_DANGER = 21800

    def __init__(self, channel: int = 2, address: int = 0x48) -> None:
        self._simulation = not _I2C_AVAILABLE
        self._analog_in = None
        self._lock = get_lock() if _I2C_AVAILABLE else None

        if not self._simulation:
            try:
                self._analog_in = AnalogIn(get_ads(address), channel)
            except Exception as e:
                self._simulation = True
                print(f"[Sensor] Gas (ADS1115 A{channel}): fallo inicializacion, simulacion ({e})")

        if self._simulation:
            print(f"[Sensor] Gas (ADS1115 A{channel}): simulacion (hardware no disponible)")
        else:
            print(f"[Sensor] Gas (ADS1115 A{channel}): hardware (0x{address:02X})")

    def read(self) -> int:
        if self._simulation or self._analog_in is None:
            return random.randint(90, 400)

        try:
            with self._lock:
                raw = int(self._analog_in.value)
        except Exception as e:
            print(f"[Sensor] Gas: error de lectura, usando simulacion ({e})")
            return random.randint(90, 400)

        raw = max(self._RAW_CLEAN, min(self._RAW_DANGER, raw))
        value = (raw - self._RAW_CLEAN) / (self._RAW_DANGER - self._RAW_CLEAN) * 1000
        return int(round(value))
