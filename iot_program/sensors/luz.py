import random

_I2C_AVAILABLE = False

try:
    from adafruit_ads1x15.analog_in import AnalogIn
    from sensors.i2c_bus import get_ads, get_lock

    _I2C_AVAILABLE = True
except ImportError:
    pass


class LuzSensor:
    """Sensor LDR conectado a ADS1115 A3.

    Retorna una escala 0-1000 compatible con las reglas automaticas:
    valores bajos significan poca luz y valores altos suficiente luz.
    """

    _RAW_DARK = 2000
    _RAW_BRIGHT = 26000

    _MAX_ERRORS = 3

    def __init__(self, channel: int = 3, address: int = 0x48) -> None:
        self._simulation = not _I2C_AVAILABLE
        self._analog_in = None
        self._lock = get_lock() if _I2C_AVAILABLE else None
        self._error_count = 0

        if not self._simulation:
            try:
                self._analog_in = AnalogIn(get_ads(address), channel)
            except Exception as e:
                self._simulation = True
                print(f"[Sensor] Luz (ADS1115 A{channel}): fallo inicializacion, simulacion ({e})")

        if self._simulation:
            print(f"[Sensor] Luz (ADS1115 A{channel}): simulacion (hardware no disponible)")
        else:
            print(f"[Sensor] Luz (ADS1115 A{channel}): hardware (0x{address:02X})")

    def read(self) -> int:
        if self._simulation or self._analog_in is None:
            return random.randint(350, 600)

        try:
            with self._lock:
                raw = int(self._analog_in.value)
            self._error_count = 0
        except Exception as e:
            self._error_count += 1
            if self._error_count >= self._MAX_ERRORS:
                self._simulation = True
                print(f"[Sensor] Luz: canal sin sensor fisico, cambiando a simulacion")
            else:
                print(f"[Sensor] Luz: error de lectura ({e})")
            return random.randint(350, 600)

        raw = max(self._RAW_DARK, min(self._RAW_BRIGHT, raw))
        value = (raw - self._RAW_DARK) / (self._RAW_BRIGHT - self._RAW_DARK) * 1000
        return int(round(value))
