from collections import deque

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


class Buttons:
    """Botones fisicos del panel local.

    En una Raspberry configura interrupciones GPIO. Fuera de Raspberry queda
    como no-op para que el programa pueda probarse en simulacion.
    """

    def __init__(self) -> None:
        self._events: deque[str] = deque()
        self._simulation = not _GPIO_AVAILABLE

        if not self._simulation:
            try:
                GPIO.setmode(GPIO.BCM)
                for pin in BUTTON_PINS.values():
                    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
                    GPIO.add_event_detect(
                        pin,
                        GPIO.FALLING,
                        callback=self._handle_press,
                        bouncetime=300,
                    )
            except Exception:
                self._simulation = True

    def poll(self) -> list[str]:
        events = list(self._events)
        self._events.clear()
        return events

    def _handle_press(self, channel: int) -> None:
        if channel == BUTTON_PINS["MODE"]:
            self._events.append("TOGGLE_MODE")
        elif channel == BUTTON_PINS["WATER"]:
            self._events.append("TOGGLE_WATER")
        elif channel == BUTTON_PINS["LIGHTS"]:
            self._events.append("TOGGLE_LIGHTS")
        elif channel == BUTTON_PINS["ALARM"]:
            self._events.append("SILENCE_ALARM")

    def cleanup(self) -> None:
        if not self._simulation:
            GPIO.cleanup(list(BUTTON_PINS.values()))
