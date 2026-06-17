from datetime import datetime
from typing import Any, Literal, TypedDict


EstadoGlobal = Literal["NORMAL", "ADVERTENCIA", "RIEGO_ACTIVO", "MODO_MANUAL", "EMERGENCIA"]


class BaseRecord(TypedDict):
    timestamp: datetime
    tipo_dato: str
    valor: dict[str, Any]
    origen: str
    estado_relacionado: str


class SensorReading(TypedDict):
    temperatura: float
    humedad_ambiente: float
    humedad_suelo_area1: float
    humedad_suelo_area2: float
    luz: int
    gas: int
    riego_1: int
    riego_2: int
    estado_global: str
