import time
from typing import Any

_LCD_AVAILABLE = False

try:
    from RPLCD.i2c import CharLCD

    _LCD_AVAILABLE = True
except ImportError:
    pass


class LCDDisplay:
    """LCD 16x2 por I2C.

    Si RPLCD no esta instalado, funciona como no-op para permitir pruebas
    locales sin hardware.
    """

    def __init__(self, address: int = 0x27, cols: int = 16, rows: int = 2) -> None:
        self._simulation = not _LCD_AVAILABLE
        self._lcd = None
        self._last_update_at = 0.0
        self._cycle_index = 0
        self._views = ("temp_hum", "soil", "light_gas", "actuators", "status")

        if not self._simulation:
            try:
                self._lcd = CharLCD(
                    i2c_expander="PCF8574",
                    address=address,
                    port=1,
                    cols=cols,
                    rows=rows,
                    auto_linebreaks=False,
                )
                self.show("GreenPi", "Iniciando...")
            except Exception:
                self._simulation = True

    def update(self, state: dict[str, Any], force: bool = False) -> None:
        if self._simulation:
            return

        estado = str(state.get("estado_global", "NORMAL"))
        if estado == "EMERGENCIA":
            self.show("! EMERGENCIA !", f"Gas {state.get('gas', 0)}")
            return

        now = time.monotonic()
        if not force and now - self._last_update_at < 3:
            return

        self._last_update_at = now
        view = self._views[self._cycle_index]
        self._cycle_index = (self._cycle_index + 1) % len(self._views)

        if view == "temp_hum":
            self.show(
                f"Temp {state.get('temperatura', 0):.1f}C",
                f"Hum {state.get('humedad_ambiente', 0):.1f}%",
            )
        elif view == "soil":
            self.show(
                f"S1 {state.get('humedad_suelo_area1', 0):.0f}%",
                f"S2 {state.get('humedad_suelo_area2', 0):.0f}%",
            )
        elif view == "light_gas":
            self.show(f"Luz {state.get('luz', 0)}", f"Gas {state.get('gas', 0)}")
        elif view == "actuators":
            self.show(
                f"R1 {state.get('riego_1', 0)} R2 {state.get('riego_2', 0)}",
                f"V {self._vent_short(state)} L {state.get('luces', 'OFF')}",
            )
        else:
            self.show("Estado global", estado[:16])

    @staticmethod
    def _vent_short(state: dict[str, Any]) -> str:
        mapping = {
            "VENTILACION_ON": "ON",
            "VENTILACION_OFF": "OFF",
            "VENTILACION_MANUAL": "MAN",
            "VENTILACION_EMERGENCIA": "EMG",
        }
        return mapping.get(str(state.get("ventilador", "")), "OFF")

    def show(self, line_1: str, line_2: str = "") -> None:
        if self._simulation or self._lcd is None:
            return
        self._lcd.clear()
        self._lcd.write_string(str(line_1)[:16])
        self._lcd.crlf()
        self._lcd.write_string(str(line_2)[:16])

    def cleanup(self) -> None:
        if not self._simulation and self._lcd is not None:
            self._lcd.clear()
            self._lcd.close(clear=True)
