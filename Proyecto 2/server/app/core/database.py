from typing import Any

from pymongo import AsyncMongoClient
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import Settings

_client: AsyncMongoClient[Any] | None = None
_database: AsyncDatabase[Any] | None = None


async def connect_to_mongo(settings: Settings) -> None:
    """Crea el cliente asincrono de PyMongo y selecciona la base de datos."""
    global _client, _database
    _client = AsyncMongoClient(settings.mongodb_uri)
    _database = _client[settings.mongodb_db]


async def close_mongo_connection() -> None:
    """Cierra el cliente de MongoDB al apagar FastAPI."""
    global _client, _database
    if _client is not None:
        await _client.close()
    _client = None
    _database = None


def get_database() -> AsyncDatabase[Any]:
    """Entrega la base de datos activa a las dependencias y servicios."""
    if _database is None:
        raise RuntimeError("MongoDB no esta conectado")
    return _database
