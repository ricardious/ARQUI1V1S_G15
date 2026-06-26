import csv
import subprocess
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import Settings
from app.repositories.mongo_repository import MongoRepository
from app.services.records import base_record

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
    "varianza": "run-varianza",
    "anomalias": "run-anomalias",
    "prediccion": "run-prediccion",
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
    "varianza": "resultado_varianza.txt",
    "anomalias": "resultado_anomalias.txt",
    "prediccion": "resultado_prediccion.txt",
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

        generated = await self.generate_csv(count)
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

        make_args = [
            f"LEC={self.csv_path}",
            f"INI={line_start}",
            f"FIN={line_end}",
            f"COL={col_name}",
        ]
        if module is None:
            ran = list(MODULE_TARGETS)
            self._run_command(["make", "run-all", *make_args], self.arm64_dir)
        else:
            module_key = module.lower()
            ran = [module_key]
            self._run_command(
                ["make", MODULE_TARGETS[module_key], *make_args], self.arm64_dir
            )

        previous = await self.results.list_recent(1)
        prev_valor = previous[0].get("valor") if previous else None
        prev_valor = prev_valor if isinstance(prev_valor, dict) else {}

        parsed = self._read_all_results()
        missing = [key for key in ran if key not in parsed]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se genero salida ARM64 para: " + ", ".join(missing),
            )

        # Cada modulo recuerda con que columna se calculo: los recien ejecutados
        # usan la columna actual; los demas conservan la de su corrida anterior.
        for key, mod in parsed.items():
            if key in ran:
                mod["column"] = result_col_key
            else:
                prev_mod = prev_valor.get(key)
                mod["column"] = (
                    prev_mod.get("column") if isinstance(prev_mod, dict) else None
                )

        valor: dict[str, Any] = {
            "column": result_col_key,
            "ran": ran,
            "count": count,
            "line_start": line_start,
            "line_end": line_end,
            "csv_rows": generated["rows"],
            **parsed,
        }
        stored = await self.results.insert_one(
            base_record(
                tipo_dato="resultado_arm64",
                valor=parsed_results,
                origen="arm64",
                estado_relacionado="NORMAL",
            )
        )
        return {
            "message": (
                f"{label} ejecutado sobre columna {result_col_key}, "
                f"lineas {line_start}-{line_end}, ultimos {count} datos"
            ),
            "results": valor,
            "stored": stored,
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

    def _detect_run_target(self) -> str | None:
        """Busca un target de ejecucion conocido dentro del Makefile."""
        makefile_text = (self.arm64_dir / "Makefile").read_text(
            encoding="utf-8", errors="ignore"
        )
        for target in ("run", "ejecutar", "all-run"):
            if f"{target}:" in makefile_text:
                return target
        return None

    def _run_detected_binaries(self) -> None:
        """Ejecuta binarios esperados cuando el Makefile no tiene target run."""
        binary_names = [
            "modulo_1_media",
            "modulo_2_varianza",
            "modulo_3_anomalias",
            "modulo_4_prediccion",
            "modulo_5_tendencia",
        ]
        missing: list[str] = []
        for name in binary_names:
            binary_path = self.arm64_dir / name
            if not binary_path.exists():
                missing.append(name)
                continue
            self._run_command([f"./{name}"], self.arm64_dir)
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Makefile no define target de ejecucion y faltan binarios: "
                    + ", ".join(missing)
                ),
            )

    def _read_results(self) -> dict[str, str]:
        """Lee los archivos .txt que deben generar los modulos ARM64."""
        output: dict[str, str] = {}
        missing: list[str] = []
        for key, filename in EXPECTED_RESULT_FILES.items():
            path = self.results_dir / filename
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
