from datetime import datetime, timezone
from typing import Any

from pymongo import MongoClient
from pymongo.errors import PyMongoError

from models import BaseRecord


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def base_record(
    *,
    tipo_dato: str,
    valor: dict[str, Any],
    origen: str,
    estado_relacionado: str,
) -> BaseRecord:
    return {
        "timestamp": now_utc(),
        "tipo_dato": tipo_dato,
        "valor": valor,
        "origen": origen,
        "estado_relacionado": estado_relacionado,
    }


class MongoRepository:
    """Repositorio MongoDB del iot_program.

    Si MongoDB falla, el programa no se detiene. MQTT y simulacion siguen
    funcionando para poder probar integracion sin base de datos.
    """

    def __init__(self, mongodb_uri: str, database_name: str) -> None:
        self.enabled = False
        self.client: MongoClient[Any] | None = None
        self.db: Any = None

        if not mongodb_uri.strip():
            print("[MongoDB] MONGODB_URI vacio. Continuando sin persistencia.")
            return

        try:
            self.client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=3000)
            self.db = self.client[database_name]
            self.client.admin.command("ping")
            self.enabled = True
            print(f"[MongoDB] Conectado a base de datos: {database_name}")
        except PyMongoError as exc:
            print(f"[MongoDB] No se pudo conectar. Continuando sin MongoDB: {exc}")

    def close(self) -> None:
        if self.client is not None:
            self.client.close()

    def insert_sensor_reading(self, values: dict[str, Any], estado: str) -> None:
        self._insert(
            "sensor_readings",
            base_record(
                tipo_dato="lectura_sensores",
                valor={
                    "temperatura": values["temperatura"],
                    "humedad_ambiente": values["humedad_ambiente"],
                    "humedad_suelo_area1": values["humedad_suelo_area1"],
                    "humedad_suelo_area2": values["humedad_suelo_area2"],
                    "luz": values["luz"],
                    "gas": values["gas"],
                    "riego_1": values["riego_1"],
                    "riego_2": values["riego_2"],
                },
                origen="iot_program",
                estado_relacionado=estado,
            ),
        )

    def insert_command(self, action: str, original_payload: str, estado: str) -> None:
        self._insert(
            "commands",
            base_record(
                tipo_dato="comando_mqtt",
                valor={"accion": action, "payload_original": original_payload},
                origen="dashboard_mqtt",
                estado_relacionado=estado,
            ),
        )

    def insert_event(self, description: str, estado: str, extra: dict[str, Any] | None = None) -> None:
        valor = {"descripcion": description}
        if extra:
            valor.update(extra)
        self._insert(
            "events",
            base_record(
                tipo_dato="evento_iot",
                valor=valor,
                origen="iot_program",
                estado_relacionado=estado,
            ),
        )

    def insert_actuator_log(self, action: str, changes: dict[str, Any], estado: str) -> None:
        self._insert(
            "actuator_logs",
            base_record(
                tipo_dato="log_actuador",
                valor={"accion": action, "cambios": changes},
                origen="iot_program",
                estado_relacionado=estado,
            ),
        )

    def update_system_status(self, state: dict[str, Any]) -> None:
        if not self.enabled:
            return
        document = base_record(
            tipo_dato="estado_sistema",
            valor=state,
            origen="iot_program",
            estado_relacionado=state.get("estado_global", "NORMAL"),
        )
        try:
            self.db["system_status"].update_one({"_id": "current"}, {"$set": document}, upsert=True)
        except PyMongoError as exc:
            print(f"[MongoDB] Error actualizando system_status: {exc}")

    def _insert(self, collection: str, document: BaseRecord) -> None:
        if not self.enabled:
            return
        try:
            self.db[collection].insert_one(document)
        except PyMongoError as exc:
            print(f"[MongoDB] Error insertando en {collection}: {exc}")
