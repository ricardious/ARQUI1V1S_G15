from typing import Any

from fastapi import Depends
from pymongo.asynchronous.database import AsyncDatabase

from app.core.config import Settings, get_settings
from app.core.database import get_database
from app.services.arm64 import Arm64Service
from app.services.records import RecordsService


def get_records_service(db: AsyncDatabase[Any] = Depends(get_database)) -> RecordsService:
    """Inyecta el servicio principal para endpoints de registros."""
    return RecordsService(db)


def get_arm64_service(
    db: AsyncDatabase[Any] = Depends(get_database),
    settings: Settings = Depends(get_settings),
) -> Arm64Service:
    """Inyecta el servicio que coordina el flujo ARM64."""
    return Arm64Service(db, settings)
