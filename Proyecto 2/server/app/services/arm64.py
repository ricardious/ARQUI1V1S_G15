import csv
import re
import subprocess
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import Settings
from app.repositories.mongo_repository import MongoRepository
from app.services.records import base_record

# Columna analizable -> indice 1-based dentro del CSV (ID=1, TEMP=2, ...).
# Coincide con el argumento argv[1] que leen los modulos ARM64 (get_column_arg).
COLUMN_INDEX = {
    "temp": 2,
    "hum_aire": 3,
    "hum_suelo_1": 4,
    "hum_suelo_2": 5,
    "luz": 6,
    "gas": 7,
}

# Modulo -> target del Makefile que lo compila y ejecuta con COL=<indice>.
MODULE_TARGETS = {
    "media": "run-media",
    "varianza": "run-varianza",
    "anomalias": "run-anomalias",
    "prediccion": "run-prediccion",
    "tendencia": "run-tendencia",
}

CSV_HEADER = [
    "ID",
    "TEMP",
    "HUM_AIRE",
    "HUM_SUELO_1",
    "HUM_SUELO_2",
    "LUZ",
    "GAS",
    "RIEGO_1",
    "RIEGO_2",
]

CSV_VALUE_KEYS = [
    "temp",
    "hum_aire",
    "hum_suelo_1",
    "hum_suelo_2",
    "luz",
    "gas",
    "riego_1",
    "riego_2",
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

    async def generate_csv(self) -> dict[str, Any]:
        """Genera data/lecturas.csv con los ultimos 30 registros."""
        readings = await self.readings.list_recent(30)
        rows = list(reversed(readings))

        self.data_dir.mkdir(parents=True, exist_ok=True)
        with self.csv_path.open("w", newline="", encoding="utf-8") as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(CSV_HEADER)
            for index, reading in enumerate(rows, start=1):
                valor = reading.get("valor") or {}
                # Python solo adapta datos al formato CSV.
                writer.writerow(
                    [
                        index,
                        *[self._int_part(valor.get(key, 0)) for key in CSV_VALUE_KEYS],
                    ]
                )

            csv_file.write("$\n")

        return {
            "message": "lecturas.csv generado correctamente",
            "path": str(self.csv_path),
            "rows": len(rows),
        }

    async def run(self, col: str, module: str | None = None) -> dict[str, Any]:
        """Ejecuta uno o todos los modulos ARM64 sobre la columna elegida.

        - col: nombre de columna (temp, hum_aire, luz, ...).
        - module: clave de un modulo (media, varianza, ...) o None para todos.
        Cada modulo recibe la columna como argv[1] via `make ... COL=<indice>`.
        """
        col_key = col.lower()
        if col_key not in COLUMN_INDEX:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Columna invalida: {col}. Use una de {list(COLUMN_INDEX)}.",
            )
        col_index = COLUMN_INDEX[col_key]

        if module is not None and module.lower() not in MODULE_TARGETS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Modulo invalido: {module}. Use uno de {list(MODULE_TARGETS)}.",
            )

        if not self.csv_path.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No existe lecturas.csv. Ejecuta primero /api/arm64/generate-csv.",
            )
        if not self.arm64_dir.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No existe el directorio ARM64: {self.arm64_dir}",
            )
        if not (self.arm64_dir / "Makefile").exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No existe Makefile en la carpeta arm64. Agrega los modulos ARM64 antes de ejecutar.",
            )

        if module is None:
            ran = list(MODULE_TARGETS)
            self._run_command(["make", "run-all", f"COL={col_index}"], self.arm64_dir)
        else:
            module_key = module.lower()
            ran = [module_key]
            self._run_command(
                ["make", MODULE_TARGETS[module_key], f"COL={col_index}"], self.arm64_dir
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
                mod["column"] = col_key
            else:
                prev_mod = prev_valor.get(key)
                mod["column"] = prev_mod.get("column") if isinstance(prev_mod, dict) else None

        valor: dict[str, Any] = {"column": col_key, "ran": ran, **parsed}
        stored = await self.results.insert_one(
            base_record(
                tipo_dato="resultado_arm64",
                valor=valor,
                origen="arm64",
                estado_relacionado="NORMAL",
            )
        )
        label = "Modulo " + ran[0] if module is not None else "Modulos ARM64"
        return {
            "message": f"{label} ejecutado sobre columna {col_key}",
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

    def _read_all_results(self) -> dict[str, dict[str, Any]]:
        """Lee y parsea los .txt existentes (los que no existan se omiten)."""
        output: dict[str, dict[str, Any]] = {}
        for key, filename in EXPECTED_RESULT_FILES.items():
            path = self.results_dir / filename
            if not path.exists():
                continue
            text = path.read_text(encoding="utf-8", errors="replace").strip()
            output[key] = self._parse_module(key, text)
        return output

    def _parse_module(self, key: str, text: str) -> dict[str, Any]:
        """Convierte la salida cruda en {raw, fields} para el dashboard.

        Los modulos 1/2/4/5 emiten lineas KEY=VALUE. Anomalias usa texto libre
        multi-columna, del que se extrae el total como campo TOTAL.
        """
        fields: dict[str, str] = {}
        for line in text.splitlines():
            stripped = line.strip()
            if "=" in stripped:
                name, value = stripped.split("=", 1)
                fields[name.strip()] = value.strip()

        if key == "anomalias":
            match = re.search(r"[Tt]otal de anomalias detectadas:\s*(\d+)", text)
            if match:
                fields["TOTAL"] = match.group(1)

        return {"raw": text, "fields": fields}

    def _int_part(self, value: Any) -> int:
        """Toma solo la parte entera requerida por el CSV de ARM64."""
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return 0
