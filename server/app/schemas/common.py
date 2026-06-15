from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

EstadoRelacionado = Literal[
    "NORMAL",
    "ADVERTENCIA",
    "EMERGENCIA",
    "RIEGO_ACTIVO",
    "MODO_MANUAL",
    "PENDIENTE",
]

Origen = Literal["backend_fastapi", "dashboard", "iot_program", "arm64"]


class BaseRecord(BaseModel):
    timestamp: datetime
    tipo_dato: str
    valor: dict[str, Any] = Field(default_factory=dict)
    origen: Origen
    estado_relacionado: EstadoRelacionado


class ApiDocument(BaseRecord):
    id: str = Field(alias="_id")

    model_config = {"populate_by_name": True}


class MessageResponse(BaseModel):
    message: str
