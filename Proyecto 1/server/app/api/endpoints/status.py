from typing import Any

from fastapi import APIRouter, Depends

from app.api.dependencies import get_records_service
from app.schemas.status import StatusUpdate
from app.services.records import RecordsService

router = APIRouter(prefix="/status", tags=["estado"])


@router.get("")
async def get_status(service: RecordsService = Depends(get_records_service)) -> dict[str, Any]:
    return await service.get_status()


@router.put("")
async def update_status(
    status_update: StatusUpdate,
    service: RecordsService = Depends(get_records_service),
) -> dict[str, Any]:
    return await service.update_status(status_update)
