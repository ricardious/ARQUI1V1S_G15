import random

_I2C_AVAILABLE = False

try:
    from adafruit_ads1x15.analog_in import AnalogIn
    from sensors.i2c_bus import get_ads, get_lock, channel_pin

    _I2C_AVAILABLE = True
except ImportError:
    pass


class LuzSensor:
    """Sensor LDR conectado a ADS1115 A3.

    Retorna una escala 0-1000 compatible con las reglas automaticas:
    valores bajos significan poca luz y valores altos suficiente luz.
    """

    # Modulo LDR: mucha luz -> voltaje (raw) bajo; sombra/oscuridad -> raw alto
    _RAW_BRIGHT = 800
    _RAW_DARK = 26000

    def __init__(self, channel: int = 3, address: int = 0x48) -> None:
        self._simulation = not _I2C_AVAILABLE
        self._analog_in = None
        self._lock = get_lock() if _I2C_AVAILABLE else None
        self._error_logged = False

        if not self._simulation:
            try:
                self._analog_in = AnalogIn(get_ads(address), channel_pin(channel))
            except Exception as e:
                self._simulation = True
                print(f"[Sensor] Luz (ADS1115 A{channel}): fallo inicializacion, simulacion ({e})")

        if self._simulation:
            print(f"[Sensor] Luz (ADS1115 A{channel}): simulacion (hardware no disponible)")
        else:
            print(f"[Sensor] Luz (ADS1115 A{channel}): hardware (0x{address:02X})")

    def read(self) -> int:
        if self._simulation or self._analog_in is None:
            return 99999

        try:
            with self._lock:
                raw = int(self._analog_in.value)
        except Exception as e:
            if not self._error_logged:
                print(f"[Sensor] Luz: error de lectura ({e})")
                self._error_logged = True
            return 99999

        self._error_logged = False
        raw = max(self._RAW_BRIGHT, min(self._RAW_DARK, raw))
        value = (self._RAW_DARK - raw) / (self._RAW_DARK - self._RAW_BRIGHT) * 1000
        return int(round(value))
