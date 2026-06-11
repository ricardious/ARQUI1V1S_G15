import random
import time

_I2C_AVAILABLE = False

try:
    from adafruit_ads1x15.analog_in import AnalogIn
    from sensors.i2c_bus import get_ads, get_lock, channel_pin

    _I2C_AVAILABLE = True
except ImportError:
    pass


class GasSensor:
    """Sensor MQ-2/MQ-135 conectado a ADS1115 por I2C.

    Canal por defecto: A0. Retorna un valor normalizado 0-1000 para que
    las reglas existentes puedan usar el umbral de emergencia 600.
    """

    _RAW_CLEAN = 1200
    _RAW_DANGER = 21800

    _MAX_ERRORS = 3

    def __init__(self, channel: int = 2, address: int = 0x48) -> None:
        self._simulation = not _I2C_AVAILABLE
        self._analog_in = None
        self._lock = get_lock() if _I2C_AVAILABLE else None
        self._error_count = 0

        if not self._simulation:
            try:
                self._analog_in = AnalogIn(get_ads(address), channel_pin(channel))
            except Exception as e:
                self._simulation = True
                print(f"[Sensor] Gas (ADS1115 A{channel}): fallo inicializacion, simulacion ({e})")

        if self._simulation:
            print(f"[Sensor] Gas (ADS1115 A{channel}): simulacion (hardware no disponible)")
        else:
            print(f"[Sensor] Gas (ADS1115 A{channel}): hardware (0x{address:02X})")

    def read(self) -> int:
        if self._simulation or self._analog_in is None:
            return 99999

        try:
            with self._lock:
                raw = int(self._analog_in.value)
        except Exception as e:
            self._error_count += 1
            if self._error_count >= self._MAX_ERRORS:
                self._simulation = True
                print(f"[Sensor] Gas: multiples errores I2C, cambiando a simulacion")
            else:
                print(f"[Sensor] Gas: error de lectura ({e})")
            return 99999

        self._error_count = 0
        raw = max(self._RAW_CLEAN, min(self._RAW_DANGER, raw))
        value = (raw - self._RAW_CLEAN) / (self._RAW_DANGER - self._RAW_CLEAN) * 1000
        return int(round(value))
