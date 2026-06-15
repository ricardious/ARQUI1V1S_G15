import time
from typing import Any

_LCD_AVAILABLE = False

try:
    from RPLCD.i2c import CharLCD
    _LCD_AVAILABLE = True
except ImportError:
    pass

# Custom 5x8 bitmaps para HD44780 (slots 0-7)
_BITMAPS = [
    [0x0E, 0x0A, 0x0A, 0x0A, 0x1F, 0x1F, 0x0E, 0x00],  # 0: termometro
    [0x04, 0x04, 0x0E, 0x1F, 0x1F, 0x1F, 0x0E, 0x00],  # 1: gota de agua
    [0x15, 0x0E, 0x1F, 0x0E, 0x15, 0x00, 0x00, 0x00],  # 2: sol
    [0x00, 0x01, 0x03, 0x16, 0x1C, 0x08, 0x04, 0x02],  # 3: planta / suelo
    [0x04, 0x0E, 0x0E, 0x1F, 0x1F, 0x00, 0x04, 0x00],  # 4: campana / alarma
    [0x0A, 0x1F, 0x0E, 0x1F, 0x0A, 0x00, 0x00, 0x00],  # 5: ventilador
    [0x00, 0x0A, 0x1F, 0x1F, 0x0E, 0x04, 0x00, 0x00],  # 6: corazon
    [0x00, 0x04, 0x0E, 0x1F, 0x0E, 0x04, 0x00, 0x00],  # 7: diamante
]

# Atajos de caracteres especiales
_THERMO = "\x00"
_DROP   = "\x01"
_SUN    = "\x02"
_PLANT  = "\x03"
_BELL   = "\x04"
_FAN    = "\x05"
_HEART  = "\x06"
_DIAM   = "\x07"
_BLOCK  = "\xff"  # bloque solido (built-in HD44780)
_DEG    = "\xdf"  # simbolo de grado (built-in HD44780)


def _bar(value: float, max_val: float, width: int) -> str:
    """Barra horizontal de bloques solidos."""
    if max_val <= 0:
        return " " * width
    filled = max(0, min(width, int(round(value / max_val * width))))
    return _BLOCK * filled + " " * (width - filled)


class LCDDisplay:
    """LCD 16x2 por I2C con iconos, barras de progreso y animaciones."""

    _VIEWS = ("temp_hum", "soil", "light_gas", "actuators", "status")
    _VIEW_INTERVAL = 3.0

    def __init__(self, address: int = 0x27, cols: int = 16, rows: int = 2) -> None:
        self._simulation = not _LCD_AVAILABLE
        self._lcd = None
        self._last_update_at = 0.0
        self._cycle_index = 0
        self._emerg_blink = False

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
                self._load_chars()
                self._animate_boot()
            except Exception as e:
                print(f"[LCD] Error al inicializar: {e}")
                self._simulation = True

    def _load_chars(self) -> None:
        for i, bitmap in enumerate(_BITMAPS):
            self._lcd.create_char(i, bitmap)

    def _animate_boot(self) -> None:
        """Barra de carga animada al encender."""
        self._write("  GreenPi  G-15 ", "                ")
        self._lcd.cursor_pos = (1, 0)
        for _ in range(16):
            self._lcd.write_string(_BLOCK)
            time.sleep(0.05)
        time.sleep(0.2)
        self._write(
            f"{_HEART} GreenPi  G-15 ",
            f"{_DIAM}  Iniciando...  ",
        )
        time.sleep(0.8)

    def update(self, state: dict[str, Any], force: bool = False) -> None:
        if self._simulation or self._lcd is None:
            return

        if str(state.get("estado_global", "NORMAL")) == "EMERGENCIA":
            self._show_emergency(state)
            return

        now = time.monotonic()
        if not force and now - self._last_update_at < self._VIEW_INTERVAL:
            return
        self._last_update_at = now

        view = self._VIEWS[self._cycle_index]
        self._cycle_index = (self._cycle_index + 1) % len(self._VIEWS)

        {
            "temp_hum":  self._show_temp_hum,
            "soil":      self._show_soil,
            "light_gas": self._show_light_gas,
            "actuators": self._show_actuators,
            "status":    self._show_status,
        }[view](state)

    # ── vistas ──────────────────────────────────────────────────────────────

    def _show_temp_hum(self, state: dict[str, Any]) -> None:
        # θ 25.5°C [█████]   (16 chars)
        # 💧 55.5%  [███  ]
        temp = float(state.get("temperatura", 0))
        hum  = float(state.get("humedad_ambiente", 0))
        self._write(
            f"{_THERMO} {temp:4.1f}{_DEG}C [{_bar(temp, 50.0, 5)}]",
            f"{_DROP} {hum:4.1f}%  [{_bar(hum, 100.0, 5)}]",
        )

    def _show_soil(self, state: dict[str, Any]) -> None:
        # 🌱 Suelo: 45.0%
        # [██████████████]   barra ancha
        s = float(state.get("humedad_suelo_area1", 0))
        self._write(
            f"{_PLANT} Suelo:{s:5.1f}%  ",
            f"[{_bar(s, 100.0, 14)}]",
        )

    def _show_light_gas(self, state: dict[str, Any]) -> None:
        # ☀Luz: 850 [████]
        # 💨Gas: 120 [█   ]
        luz = int(state.get("luz", 0))
        gas = int(state.get("gas", 0))
        self._write(
            f"{_SUN}Luz:{luz:4d} [{_bar(luz, 1000.0, 4)}]",
            f"{_FAN}Gas:{gas:4d} [{_bar(gas, 1000.0, 4)}]",
        )

    def _show_actuators(self, state: dict[str, Any]) -> None:
        # 💧R1:ON  R2:OFF
        # 💨V:OFF ☀L:ON
        r1  = "ON " if state.get("riego_1", 0)       else "OFF"
        r2  = "ON " if state.get("riego_2", 0)       else "OFF"
        vent = self._vent_short(state)
        luz  = "ON " if state.get("luces", "OFF") == "ON" else "OFF"
        self._write(
            f"{_DROP}R1:{r1} R2:{r2}  ",
            f"{_FAN}V:{vent}  {_SUN}L:{luz}  ",
        )

    def _show_status(self, state: dict[str, Any]) -> None:
        estado = str(state.get("estado_global", "NORMAL"))
        icon = _HEART if estado == "NORMAL" else _BELL
        self._write(
            f"{icon} Estado Global  ",
            f"  {estado[:14]}",
        )

    def _show_emergency(self, state: dict[str, Any]) -> None:
        """Pantalla de emergencia parpadeante."""
        gas = int(state.get("gas", 0))
        self._emerg_blink = not self._emerg_blink
        if self._emerg_blink:
            self._write(
                f"{_BELL} !EMERGENCIA! {_BELL}",
                f"{_FAN} Gas:{gas:5d}     ",
            )
        else:
            self._write(
                "!! EMERGENCIA !!",
                f"   Gas:{gas:5d}    ",
            )

    # ── helpers ─────────────────────────────────────────────────────────────

    def _write(self, line1: str, line2: str) -> None:
        try:
            self._lcd.clear()
            self._lcd.write_string(line1[:16])
            self._lcd.crlf()
            self._lcd.write_string(line2[:16])
        except OSError:
            pass  # ruido I2C transitorio: no tumbar el loop principal

    def show(self, line_1: str, line_2: str = "") -> None:
        if self._simulation or self._lcd is None:
            return
        self._write(line_1, line_2)

    @staticmethod
    def _vent_short(state: dict[str, Any]) -> str:
        return {
            "VENTILACION_ON":        "ON ",
            "VENTILACION_OFF":       "OFF",
            "VENTILACION_MANUAL":    "MAN",
            "VENTILACION_EMERGENCIA":"EMG",
        }.get(str(state.get("ventilador", "")), "OFF")

    def cleanup(self) -> None:
        if not self._simulation and self._lcd is not None:
            self._lcd.clear()
            self._lcd.close(clear=True)
