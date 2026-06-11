import threading

_i2c = None
_ads_instances: dict = {}
_lock = threading.Lock()


def get_i2c():
    global _i2c
    if _i2c is None:
        import board
        _i2c = board.I2C()
    return _i2c


def get_ads(address: int = 0x48):
    if address not in _ads_instances:
        import adafruit_ads1x15.ads1115 as ADS
        _ads_instances[address] = ADS.ADS1115(get_i2c(), address=address)
    return _ads_instances[address]


def get_lock() -> threading.Lock:
    return _lock
