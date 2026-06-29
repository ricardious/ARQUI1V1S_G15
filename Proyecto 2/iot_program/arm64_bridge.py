from __future__ import annotations

import os
import select
import subprocess
from pathlib import Path
from typing import Any

# Binario del motor
MOTOR_BIN = Path(__file__).resolve().parent.parent / "arm64" / "build" / "motor"

# Acción de ARM64
ACTION_TO_COMMAND: dict[str, str | None] = {
    "RIEGO_1_ON": "ACTIVAR_RIEGO_1",
    "RIEGO_2_ON": "ACTIVAR_RIEGO_2",
    "FAN_ON": "ACTIVAR_VENTILADOR",
    "LIGHT_ON": "ENCENDER_LUCES",
    "ALARM_ON": "ACTIVAR_ALARMA",
    "LED_GREEN": None,
    "NO_ACTION": None,
}


class Arm64Bridge:
    """Puente simple con el motor ARM64."""

    def __init__(self, binary: Path = MOTOR_BIN) -> None:
        self.binary = binary
        self.proc: subprocess.Popen[bytes] | None = None
        self._build_failed = False
        self._stdout_buf = b""
        self.last_raw = ""  # última respuesta cruda

    def _ensure_built(self) -> bool:
        """Compila el motor si hace falta."""
        if self.binary.exists():
            return True
        if self._build_failed:
            return False
        arm64_dir = self.binary.parent.parent  # arm64/
        print("[ARM64] Compilando motor (make motor)...")
        try:
            result = subprocess.run(
                ["make", "motor"],
                cwd=arm64_dir,
                capture_output=True,
                text=True,
                timeout=120,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            print(f"[ARM64] No se pudo compilar el motor: {exc}")
            self._build_failed = True
            return False
        if result.returncode != 0 or not self.binary.exists():
            print(f"[ARM64] 'make motor' falló:\n{result.stderr.strip()}")
            self._build_failed = True
            return False
        print("[ARM64] Motor compilado.")
        return True

    def _ensure_running(self) -> bool:
        if self.proc is not None and self.proc.poll() is None:
            return True
        if not self._ensure_built():
            return False
        try:
            self.proc = subprocess.Popen(
                [str(self.binary)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,  # lectura directa con timeout
            )
        except OSError as exc:
            print(f"[ARM64] No se pudo iniciar el motor: {exc}")
            self.proc = None
            return False
        self._stdout_buf = b""
        return True

    @staticmethod
    def build_line(readings: dict[str, Any], modo: int) -> str:
        """Arma la línea que espera ARM64."""
        campos = [
            readings.get("temperatura", 0),
            readings.get("humedad_ambiente", 0),
            readings.get("humedad_suelo_area1", 0),
            readings.get("humedad_suelo_area2", 0),
            readings.get("luz", 0),
            readings.get("gas", 0),
            modo,  # 0 = automático, 1 = manual
        ]
        return ",".join(str(int(float(v))) for v in campos)

    def _read_line(self, timeout: float) -> str | None:
        """Devuelve una línea (ya sin '\\n') o None si hubo timeout/EOF."""
        assert self.proc is not None and self.proc.stdout is not None
        fd = self.proc.stdout.fileno()
        while True:
            nl = self._stdout_buf.find(b"\n")
            if nl >= 0:  # ya hay una línea completa en el buffer
                line = self._stdout_buf[:nl]
                self._stdout_buf = self._stdout_buf[nl + 1 :]
                return line.decode("utf-8", "replace").strip()
            ready, _, _ = select.select([fd], [], [], timeout)
            if not ready:
                return None  # timeout: el motor no respondió a tiempo
            chunk = os.read(fd, 4096)
            if not chunk:
                return None  # EOF: el motor murió
            self._stdout_buf += chunk

    def _read_block(self, timeout: float = 3.0) -> dict[str, str] | None:
        """Lee el bloque de respuesta línea por línea (clave=valor)."""
        fields: dict[str, str] = {}
        raw_lines: list[str] = []
        while True:
            # Esperamos completo al inicio; luego solo un margen por la última línea.
            line = self._read_line(timeout if not fields else 0.1)
            if line is None:
                break  # timeout/EOF: devolvemos lo que haya
            if line == "":
                if fields:
                    break  # línea en blanco = fin del bloque
                continue  # ignora blancos al inicio
            raw_lines.append(line)
            key, sep, value = line.partition("=")
            if sep:
                fields[key.strip()] = value.strip()
        self.last_raw = "\n".join(raw_lines)
        return fields or None

    def decide(
        self, readings: dict[str, Any], modo: int
    ) -> tuple[str, dict[str, str]] | None:
        """Manda una lectura y devuelve la respuesta."""
        if not self._ensure_running():
            return None
        assert self.proc is not None and self.proc.stdin is not None
        line = self.build_line(readings, modo)
        try:
            self.proc.stdin.write((line + "\n").encode("utf-8"))
            self.proc.stdin.flush()
            fields = self._read_block()
        except (BrokenPipeError, ValueError):
            fields = None
        if fields is None:
            self.close()
            return None
        return line, fields

    @staticmethod
    def command_for(fields: dict[str, str]) -> str | None:
        """Devuelve el comando físico, si aplica."""
        if fields.get("STATUS") == "ERROR":
            return None
        return ACTION_TO_COMMAND.get(fields.get("ACTION", "NO_ACTION"))

    def close(self) -> None:
        if self.proc is None:
            return
        try:
            if self.proc.stdin:
                self.proc.stdin.close()
            self.proc.wait(timeout=2)
        except Exception:
            self.proc.kill()
        finally:
            self.proc = None
            self._stdout_buf = b""
