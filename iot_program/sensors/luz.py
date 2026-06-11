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


class LuzSensor:
    """Sensor LDR conectado a ADS1115 A3.

    Retorna una escala 0-1000 compatible con las reglas automaticas:
    valores bajos significan poca luz y valores altos suficiente luz.
    """

    _RAW_DARK = 2000
    _RAW_BRIGHT = 26000

    def __init__(self, channel: int = 3, address: int = 0x48) -> None:
        self._simulation = not _I2C_AVAILABLE
        self._analog_in = None

        if not self._simulation:
            try:
                i2c = busio.I2C(board.SCL, board.SDA)
                ads = ADS.ADS1115(i2c, address=address)
                ads_channels = [ADS.P0, ADS.P1, ADS.P2, ADS.P3]
                self._analog_in = AnalogIn(ads, ads_channels[channel])
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
            raw = int(self._analog_in.value)
        except Exception as e:
            print(f"[Sensor] Luz: error de lectura, usando simulacion ({e})")
            return random.randint(350, 600)

        raw = max(self._RAW_DARK, min(self._RAW_BRIGHT, raw))
        value = (raw - self._RAW_DARK) / (self._RAW_BRIGHT - self._RAW_DARK) * 1000
        return int(round(value))
