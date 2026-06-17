from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_records_service
from app.schemas.commands import CommandCreate
from app.services.records import RecordsService

router = APIRouter(prefix="/commands", tags=["comandos"])


@router.get("")
async def list_commands(
    limit: int = Query(default=20, ge=1, le=200),
    service: RecordsService = Depends(get_records_service),
) -> list[dict[str, Any]]:
    return await service.list_commands(limit)


@router.post("", status_code=201)
async def create_command(
    command: CommandCreate,
    service: RecordsService = Depends(get_records_service),
) -> dict[str, Any]:
    return await service.create_command(command)
