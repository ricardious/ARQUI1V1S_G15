import csv
import subprocess
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import Settings
from app.repositories.mongo_repository import MongoRepository
from app.services.records import base_record

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

        return {
            "message": "lecturas.csv generado correctamente",
            "path": str(self.csv_path),
            "rows": len(rows),
        }

    async def run_modules(self) -> dict[str, Any]:
        """Ejecuta make, corre los modulos ARM64 y persiste sus salidas."""
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
        makefile = self.arm64_dir / "Makefile"
        if not makefile.exists():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No existe Makefile en la carpeta arm64. Agrega los modulos ARM64 antes de ejecutar.",
            )

        self._run_command(["make"], self.arm64_dir)
        run_target = self._detect_run_target()
        if run_target is not None:
            self._run_command(["make", run_target], self.arm64_dir)
        else:
            self._run_detected_binaries()

        parsed_results = self._read_results()
        stored = await self.results.insert_one(
            base_record(
                tipo_dato="resultado_arm64",
                valor=parsed_results,
                origen="arm64",
                estado_relacionado="NORMAL",
            )
        )
        return {
            "message": "Modulos ARM64 ejecutados",
            "results": parsed_results,
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
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return 0
