from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import EstadoRelacionado


class StatusUpdate(BaseModel):
    valor: dict[str, Any] = Field(default_factory=dict)
    estado_relacionado: EstadoRelacionado = "NORMAL"
