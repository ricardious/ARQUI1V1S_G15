import csv
import os
import subprocess
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import Settings
from app.repositories.mongo_repository import MongoRepository, now_utc

# Columna analizable -> nombre exacto en el encabezado CSV.
COLUMN_NAMES = {
    "temp": "TEMP",
    "hum_aire": "HUM_AIRE",
    "soil1": "SOIL1",
    "soil2": "SOIL2",
    "hum_suelo_1": "SOIL1",
    "hum_suelo_2": "SOIL2",
    "luz": "LUZ",
    "gas": "GAS",
}

COLUMN_ALIASES = {
    "hum_suelo_1": "soil1",
    "hum_suelo_2": "soil2",
}

# Modulo -> target del Makefile que lo compila y ejecuta.
MODULE_TARGETS = {
    "media": "run-media",
    "rmse": "run-rmse",
    "varianza": "run-varianza",
    "regresion": "run-regresion",
    "anomalias": "run-anomalias",
    "prediccion_reg": "run-prediccion-futura",
    "prediccion": "run-prediccion",
    "integral": "run-integral",
    "derivada": "run-derivada",
    "tendencia": "run-tendencia",
}

CSV_HEADER = [
    "TEMP",
    "HUM_AIRE",
    "SOIL1",
    "SOIL2",
    "LUZ",
    "GAS",
    "MODO",
]

CSV_VALUE_KEYS = [
    "temp",
    "hum_aire",
    "hum_suelo_1",
    "hum_suelo_2",
    "luz",
    "gas",
    "modo",
]

EXPECTED_RESULT_FILES = {
    "media": "resultado_media.txt",
    "rmse": "resultado_rmse.txt",
    "varianza": "resultado_varianza.txt",
    "regresion": "resultado_regresion.txt",
    "anomalias": "resultado_anomalias.txt",
    "prediccion_reg": "resultado_prediccion_futura.txt",
    "prediccion": "resultado_prediccion.txt",
    "integral": "resultado_integral_error.txt",
    "derivada": "resultado_derivada_local.txt",
    "tendencia": "resultado_tendencia.txt",
}


class Arm64Service:
    """Coordina CSV, ejecucion ARM64 y guardado de resultados."""

    def __init__(self, db: AsyncDatabase[Any], settings: Settings) -> None:
        self.settings = settings
        self.arm64_dir = settings.arm64_path
        self.data_dir = settings.data_path
        self.csv_path = self.data_dir / "lecturas.csv"
        self.results_dir = settings.arm64_results_path
        self.readings = MongoRepository(db, "sensor_readings")
        self.results = MongoRepository(db, "arm64_results")

    async def list_results(self, limit: int) -> list[dict[str, Any]]:
        return await self.results.list_recent(limit)

    async def generate_csv(self, count: int = 30) -> dict[str, Any]:
        """Genera data/lecturas.csv con los ultimos N registros."""
        readings = await self.readings.list_recent(count)
        rows = list(reversed(readings))

        self.data_dir.mkdir(parents=True, exist_ok=True)
        with self.csv_path.open("w", newline="", encoding="utf-8") as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(CSV_HEADER)
            for reading in rows:
                valor = reading.get("valor") or {}
                # Python solo adapta datos al formato CSV.
                writer.writerow(
                    [
                        *[
                            self._int_part(self._value_for_key(valor, key))
                            for key in CSV_VALUE_KEYS
                        ],
                    ]
                )

        return {
            "message": "lecturas.csv generado correctamente",
            "path": str(self.csv_path),
            "rows": len(rows),
            "requested_rows": count,
        }

    async def run(
        self,
        col: str,
        module: str | None = None,
        *,
        count: int = 30,
        line_start: int = 1,
        line_end: int | None = None,
    ) -> dict[str, Any]:
        """Ejecuta uno o todos los modulos ARM64 sobre la columna elegida.

        - col: nombre de columna (temp, hum_aire, luz, ...).
        - module: clave de un modulo (media, varianza, ...) o None para todos.
        - count: cantidad de lecturas recientes tomadas desde MongoDB para el CSV.
        - line_start/line_end: rango 1-based dentro del CSV generado.
        Cada modulo recibe archivo, rango y columna via Makefile.
        """
        col_key = col.lower()
        if col_key not in COLUMN_NAMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Columna invalida: {col}. Use una de {list(COLUMN_NAMES)}.",
            )
        col_name = COLUMN_NAMES[col_key]
        result_col_key = COLUMN_ALIASES.get(col_key, col_key)

        if line_end is None:
            line_end = count
        if line_start < 1 or line_end < line_start:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rango invalido: line_start debe ser >= 1 y line_end >= line_start.",
            )

        if module is not None and module.lower() not in MODULE_TARGETS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Modulo invalido: {module}. Use uno de {list(MODULE_TARGETS)}.",
            )

        await self.generate_csv(count)
        if not self.arm64_dir.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No existe el directorio ARM64: {self.arm64_dir}",
            )
        makefile = self.arm64_dir / "Makefile"
        if not makefile.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No existe Makefile en la carpeta arm64. Agrega los modulos ARM64 antes de ejecutar.",
            )

        lec_path = os.path.relpath(self.csv_path, self.arm64_dir)
        make_args = [
            f"LEC={lec_path}",
            f"INI={line_start}",
            f"FIN={line_end}",
            f"COL={col_name}",
        ]
        if module is None:
            ran = list(MODULE_TARGETS)
            label = "todos los modulos"
            self._run_command(["make", "run-all", *make_args], self.arm64_dir)
        else:
            module_key = module.lower()
            ran = [module_key]
            label = module_key
            self._run_command(
                ["make", MODULE_TARGETS[module_key], *make_args], self.arm64_dir
            )

        raw_results = self._read_results(ran)

        # Se guarda un documento por módulo.
        range_info = {"line_start": line_start, "line_end": line_end}
        input_desc = f"{self.csv_path.name} {line_start} {line_end} {col_name}"
        stored: list[dict[str, Any]] = []
        for key in ran:
            text = raw_results[key]
            stored.append(
                await self.results.insert_one(
                    {
                        "timestamp": now_utc(),
                        "source": "historical_analyzer",
                        "module": key,
                        "input": input_desc,
                        "range": range_info,
                        "column": result_col_key,
                        "result": {"raw": text, "fields": self._parse_fields(text)},
                        "decision": None,
                        "risk": None,
                        "status": "OK",
                        "error_detail": None,
                    }
                )
            )

        return {
            "message": (
                f"{label} ejecutado sobre columna {result_col_key}, "
                f"lineas {line_start}-{line_end}, ultimos {count} datos"
            ),
            "results": stored,
        }

    def _run_command(self, command: list[str], cwd: Path) -> None:
        """Ejecuta comandos externos y convierte fallos en errores HTTP claros."""
        try:
            subprocess.run(command, cwd=cwd, check=True, capture_output=True, text=True)
        except FileNotFoundError as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se encontro el comando requerido: {command[0]}",
            ) from exc
        except subprocess.CalledProcessError as exc:
            detail = (
                exc.stderr.strip()
                or exc.stdout.strip()
                or "El comando ARM64 fallo sin salida."
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error ejecutando {' '.join(command)}: {detail}",
            ) from exc

    def _read_results(self, keys: list[str]) -> dict[str, str]:
        """Lee los .txt generados."""
        output: dict[str, str] = {}
        missing: list[str] = []
        for key in keys:
            path = self.results_dir / EXPECTED_RESULT_FILES[key]
            if not path.exists():
                missing.append(str(path))
                continue
            output[key] = path.read_text(encoding="utf-8", errors="replace").strip()

        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se encontraron archivos de salida ARM64: "
                + ", ".join(missing),
            )
        return output

    @staticmethod
    def _parse_fields(text: str) -> dict[str, str]:
        """Pasa KEY=VALUE a diccionario."""
        fields: dict[str, str] = {}
        for line in text.splitlines():
            key, sep, value = line.partition("=")
            if sep:
                fields[key.strip()] = value.strip()
        return fields

    def _int_part(self, value: Any) -> int:
        """Toma solo la parte entera requerida por el CSV de ARM64."""
        if isinstance(value, str):
            mode = value.strip().upper()
            if mode in {"MANUAL", "MODO_MANUAL"}:
                return 1
            if mode in {"AUTOMATICO", "AUTOMÁTICO", "AUTO", "NORMAL"}:
                return 0
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return 0

    def _value_for_key(self, valor: dict[str, Any], key: str) -> Any:
        """Lee valores con las claves actuales y las aliases usadas por sensores."""
        aliases = {
            "temp": ("temp", "temperatura"),
            "hum_aire": ("hum_aire", "humedad_ambiente"),
            "hum_suelo_1": ("hum_suelo_1", "humedad_suelo_area1"),
            "hum_suelo_2": ("hum_suelo_2", "humedad_suelo_area2"),
            "luz": ("luz",),
            "gas": ("gas",),
            "modo": ("modo", "mode"),
        }
        for alias in aliases[key]:
            if alias in valor:
                return valor[alias]
        return 0
