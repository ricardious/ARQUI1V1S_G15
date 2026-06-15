_GPIO_AVAILABLE = False

try:
    import RPi.GPIO as GPIO

    _GPIO_AVAILABLE = True
except (ImportError, RuntimeError):
    pass


BUTTON_PINS = {
    "MODE": 19,
    "WATER": 26,
    "LIGHTS": 16,
    "ALARM": 20,
}

_EVENT_BY_PIN = {
    19: "TOGGLE_MODE",
    26: "TOGGLE_WATER",
    16: "TOGGLE_LIGHTS",
    20: "SILENCE_ALARM",
}


class Buttons:
    """Botones fisicos del panel local.

    Lee por polling en cada ciclo (poll() se llama desde el loop principal).
    No usa add_event_detect porque en Raspberry Pi OS reciente esa deteccion
    por interrupcion falla ('Failed to add edge detection'). El muestreo a 0.2s
    del loop ya filtra el rebote. Fuera de Raspberry queda como no-op.
    """

    def __init__(self) -> None:
        self._simulation = not _GPIO_AVAILABLE
        self._last_level: dict[int, int] = {}

        if not self._simulation:
            try:
                GPIO.setmode(GPIO.BCM)
                for pin in BUTTON_PINS.values():
                    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
                    self._last_level[pin] = GPIO.input(pin)  # reposo = HIGH (pull-up)
            except Exception as e:
                print(f"[PANEL] Botones en simulacion ({e})")
                self._simulation = True

    def poll(self) -> list[str]:
        if self._simulation:
            return []

        events: list[str] = []
        for pin in BUTTON_PINS.values():
            level = GPIO.input(pin)
            # flanco de bajada HIGH->LOW = presion; mientras se mantiene
            # presionado prev queda en LOW y no repite el evento
            if self._last_level[pin] == 1 and level == 0:
                events.append(_EVENT_BY_PIN[pin])
            self._last_level[pin] = level
        return events

    def cleanup(self) -> None:
        if not self._simulation:
            GPIO.cleanup(list(BUTTON_PINS.values()))
