from typing import Any

from pymongo.asynchronous.database import AsyncDatabase

from app.repositories.mongo_repository import MongoRepository, now_utc
from app.schemas.commands import CommandCreate
from app.schemas.status import StatusUpdate


def base_record(
    *,
    tipo_dato: str,
    valor: dict[str, Any],
    origen: str,
    estado_relacionado: str = "NORMAL",
) -> dict[str, Any]:
    """Construye la estructura base que se guarda en las colecciones."""
    return {
        "timestamp": now_utc(),
        "tipo_dato": tipo_dato,
        "valor": valor,
        "origen": origen,
        "estado_relacionado": estado_relacionado,
    }


class RecordsService:
    """Agrupa operaciones de lecturas, eventos, comandos, estado y logs."""

    def __init__(self, db: AsyncDatabase[Any]) -> None:
        self.readings = MongoRepository(db, "sensor_readings")
        self.events = MongoRepository(db, "events")
        self.commands = MongoRepository(db, "commands")
        self.status = MongoRepository(db, "system_status")
        self.actuator_logs = MongoRepository(db, "actuator_logs")

    async def latest_reading(self) -> dict[str, Any] | None:
        return await self.readings.latest()

    async def reading_history(self, limit: int) -> list[dict[str, Any]]:
        return await self.readings.list_recent(limit)

    async def create_test_reading(self) -> dict[str, Any]:
        """Inserta una lectura artificial para probar MongoDB sin sensores."""
        return await self.readings.insert_one(
            base_record(
                tipo_dato="lectura_sensor_prueba",
                valor={
                    "temp": 28.9,
                    "hum_aire": 70.4,
                    "hum_suelo_1": 45.8,
                    "hum_suelo_2": 48.2,
                    "luz": 320.0,
                    "gas": 120.5,
                    "riego_1": 0,
                    "riego_2": 0,
                },
                origen="backend_fastapi",
            )
        )

    async def list_events(self, limit: int) -> list[dict[str, Any]]:
        return await self.events.list_recent(limit)

    async def create_test_event(self) -> dict[str, Any]:
        return await self.events.insert_one(
            base_record(
                tipo_dato="evento_prueba",
                valor={"descripcion": "Evento de prueba generado desde FastAPI"},
                origen="backend_fastapi",
                estado_relacionado="NORMAL",
            )
        )

    async def list_commands(self, limit: int) -> list[dict[str, Any]]:
        return await self.commands.list_recent(limit)

    async def create_command(self, command: CommandCreate) -> dict[str, Any]:
        """Registra comandos del dashboard sin publicarlos por MQTT."""
        return await self.commands.insert_one(
            base_record(
                tipo_dato="comando_actuador",
                valor=command.model_dump(),
                origen=command.origen,
                estado_relacionado="PENDIENTE",
            )
        )

    async def get_status(self) -> dict[str, Any]:
        """Devuelve el estado actual; si no existe, entrega uno pendiente."""
        current = await self.status.get_by_id("current")
        if current is not None:
            return current
        return {
            "_id": "current",
            **base_record(
                tipo_dato="estado_sistema",
                valor={"mensaje": "Sin estado registrado"},
                origen="backend_fastapi",
                estado_relacionado="PENDIENTE",
            ),
        }

    async def update_status(self, status_update: StatusUpdate) -> dict[str, Any]:
        """Actualiza el documento unico de estado con _id='current'."""
        return await self.status.upsert_by_id(
            "current",
            base_record(
                tipo_dato="estado_sistema",
                valor=status_update.valor,
                origen="backend_fastapi",
                estado_relacionado=status_update.estado_relacionado,
            ),
        )

    async def list_actuator_logs(self, limit: int) -> list[dict[str, Any]]:
        return await self.actuator_logs.list_recent(limit)

    async def create_test_actuator_log(self) -> dict[str, Any]:
        return await self.actuator_logs.insert_one(
            base_record(
                tipo_dato="log_actuador_prueba",
                valor={"actuador": "riego_1", "accion": "SIN_CAMBIO", "area": 1},
                origen="backend_fastapi",
                estado_relacionado="NORMAL",
            )
        )
