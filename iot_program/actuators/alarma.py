_GPIO_AVAILABLE = False

try:
    import RPi.GPIO as GPIO

    _GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    pass


class AlarmaActuator:
    """Control de alarma/buzzer en GPIO24."""

    _DEFAULT_PIN = 24

    def __init__(self, pin: int = _DEFAULT_PIN, active_high: bool = True) -> None:
        self._pin = pin
        self._active_high = active_high
        self._simulation = not _GPIO_AVAILABLE
        self._active = False

        if not self._simulation:
            try:
                GPIO.setmode(GPIO.BCM)
                GPIO.setup(self._pin, GPIO.OUT)
                GPIO.output(self._pin, self._off_level)
            except Exception:
                self._simulation = True

    @property
    def _on_level(self) -> int:
        return GPIO.HIGH if self._active_high else GPIO.LOW

    @property
    def _off_level(self) -> int:
        return GPIO.LOW if self._active_high else GPIO.HIGH

    def activar(self) -> dict[str, str]:
        self._active = True
        if not self._simulation:
            GPIO.output(self._pin, self._on_level)
        return {"alarma": "ON"}

    def silenciar(self) -> dict[str, str]:
        self._active = False
        if not self._simulation:
            GPIO.output(self._pin, self._off_level)
        return {"alarma": "OFF"}

    def limpiar(self) -> None:
        if not self._simulation:
            GPIO.output(self._pin, self._off_level)
            GPIO.cleanup(self._pin)
