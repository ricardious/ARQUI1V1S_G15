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


class GasSensor:
    """Sensor MQ-2/MQ-135 conectado a ADS1115 por I2C.

    Canal por defecto: A0. Retorna un valor normalizado 0-1000 para que
    las reglas existentes puedan usar el umbral de emergencia 600.
    """

    _RAW_CLEAN = 2800
    _RAW_DANGER = 21800

    def __init__(self, channel: int = 0, address: int = 0x48) -> None:
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

    def read(self) -> int:
        if self._simulation or self._analog_in is None:
            return random.randint(90, 680)

        try:
            raw = int(self._analog_in.value)
        except Exception:
            return random.randint(90, 680)

        raw = max(self._RAW_CLEAN, min(self._RAW_DANGER, raw))
        value = (raw - self._RAW_CLEAN) / (self._RAW_DANGER - self._RAW_CLEAN) * 1000
        return int(round(value))
