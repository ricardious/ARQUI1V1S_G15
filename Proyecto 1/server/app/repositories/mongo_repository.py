from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase


def serialize_document(document: dict[str, Any] | None) -> dict[str, Any] | None:
    """Convierte ObjectId a string para poder responder documentos como JSON."""
    if document is None:
        return None
    serialized = dict(document)
    if isinstance(serialized.get("_id"), ObjectId):
        serialized["_id"] = str(serialized["_id"])
    return serialized


def now_utc() -> datetime:
    """Genera timestamps consistentes en UTC para los documentos."""
    return datetime.now(timezone.utc)


class MongoRepository:
    """Repositorio pequeño para operaciones comunes de MongoDB."""

    def __init__(self, db: AsyncDatabase[Any], collection_name: str) -> None:
        self.collection: AsyncCollection[Any] = db[collection_name]

    async def insert_one(self, document: dict[str, Any]) -> dict[str, Any]:
        """Inserta un documento y devuelve la version serializable."""
        result = await self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return serialize_document(document) or {}

    async def latest(self) -> dict[str, Any] | None:
        """Obtiene el documento mas reciente segun timestamp."""
        document = await self.collection.find_one(sort=[("timestamp", -1)])
        return serialize_document(document)

    async def list_recent(self, limit: int = 20) -> list[dict[str, Any]]:
        """Lista documentos recientes en orden descendente."""
        cursor = self.collection.find().sort("timestamp", -1).limit(limit)
        return [serialize_document(document) or {} async for document in cursor]

    async def upsert_by_id(self, document_id: str, document: dict[str, Any]) -> dict[str, Any]:
        """Actualiza o crea un documento con _id fijo."""
        await self.collection.update_one(
            {"_id": document_id},
            {"$set": document},
            upsert=True,
        )
        stored = await self.collection.find_one({"_id": document_id})
        return serialize_document(stored) or {}

    async def get_by_id(self, document_id: str) -> dict[str, Any] | None:
        """Busca un documento por _id."""
        document = await self.collection.find_one({"_id": document_id})
        return serialize_document(document)
