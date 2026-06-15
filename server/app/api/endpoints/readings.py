from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_records_service
from app.services.records import RecordsService

router = APIRouter(prefix="/readings", tags=["lecturas"])


@router.get("/latest")
async def latest_reading(service: RecordsService = Depends(get_records_service)) -> dict[str, Any] | None:
    return await service.latest_reading()


@router.get("/history")
async def reading_history(
    limit: int = Query(default=30, ge=1, le=200),
    service: RecordsService = Depends(get_records_service),
) -> list[dict[str, Any]]:
    return await service.reading_history(limit)


@router.post("/test", status_code=201)
async def create_test_reading(service: RecordsService = Depends(get_records_service)) -> dict[str, Any]:
    return await service.create_test_reading()
