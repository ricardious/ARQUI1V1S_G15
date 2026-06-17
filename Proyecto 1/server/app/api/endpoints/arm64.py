from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_arm64_service
from app.services.arm64 import Arm64Service

router = APIRouter(prefix="/arm64", tags=["arm64"])


@router.get("/results")
async def list_arm64_results(
    limit: int = Query(default=10, ge=1, le=100),
    service: Arm64Service = Depends(get_arm64_service),
) -> list[dict[str, Any]]:
    return await service.list_results(limit)


@router.post("/generate-csv", status_code=201)
async def generate_csv(service: Arm64Service = Depends(get_arm64_service)) -> dict[str, Any]:
    return await service.generate_csv()


@router.post("/run")
async def run_arm64(service: Arm64Service = Depends(get_arm64_service)) -> dict[str, Any]:
    return await service.run_modules()
