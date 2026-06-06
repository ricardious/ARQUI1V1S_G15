from typing import Literal

from pydantic import BaseModel, Field


class CommandCreate(BaseModel):
    accion: str = Field(min_length=1)
    area: int | None = Field(default=None, ge=1)
    origen: Literal["dashboard", "backend_fastapi"] = "dashboard"
