from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_records_service
from app.services.records import RecordsService

router = APIRouter(prefix="/events", tags=["eventos"])


@router.get("")
async def list_events(
    limit: int = Query(default=20, ge=1, le=200),
    service: RecordsService = Depends(get_records_service),
) -> list[dict[str, Any]]:
    return await service.list_events(limit)


@router.post("/test", status_code=201)
async def create_test_event(service: RecordsService = Depends(get_records_service)) -> dict[str, Any]:
    return await service.create_test_event()
