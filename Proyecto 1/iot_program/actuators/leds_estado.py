_GPIO_AVAILABLE = False

try:
    import RPi.GPIO as GPIO

    _GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    pass


class LedsEstadoActuator:
    """Control de LEDs de estado.

    Pines BCM por defecto: verde=5, amarillo=6, rojo=13.
    """

    _PINS = {
        "NORMAL": 5,
        "ADVERTENCIA": 6,
        "RIEGO_ACTIVO": 6,
        "MODO_MANUAL": 6,
        "EMERGENCIA": 13,
    }

    def __init__(self) -> None:
        self._simulation = not _GPIO_AVAILABLE
        self._current_state = ""

        if not self._simulation:
            try:
                GPIO.setmode(GPIO.BCM)
                for pin in set(self._PINS.values()):
                    GPIO.setup(pin, GPIO.OUT)
                    GPIO.output(pin, GPIO.LOW)
            except Exception:
                self._simulation = True

    def modo_automatico(self) -> dict[str, str]:
        self.set_estado("NORMAL")
        return {"modo": "AUTOMATICO", "estado_global": "NORMAL"}

    def modo_manual(self) -> dict[str, str]:
        self.set_estado("MODO_MANUAL")
        return {"modo": "MANUAL", "estado_global": "MODO_MANUAL"}

    def set_estado(self, estado: str) -> None:
        self._current_state = estado
        if self._simulation:
            return

        target_pin = self._PINS.get(estado)
        for pin in set(self._PINS.values()):
            GPIO.output(pin, GPIO.HIGH if pin == target_pin else GPIO.LOW)

    def limpiar(self) -> None:
        if not self._simulation:
            for pin in set(self._PINS.values()):
                GPIO.output(pin, GPIO.LOW)
            GPIO.cleanup(list(set(self._PINS.values())))
