import threading

_i2c = None
_lock = threading.Lock()


def get_i2c():
    global _i2c
    if _i2c is None:
        import board
        _i2c = board.I2C()
    return _i2c


def get_lock() -> threading.Lock:
    return _lock
