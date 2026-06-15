from __future__ import annotations

from dataclasses import dataclass, asdict
from threading import RLock
from typing import Any


@dataclass
class StateSnapshot:
    temperatura: float = 0.0
    humedad_ambiente: float = 0.0
    humedad_suelo_area1: float = 0.0
    humedad_suelo_area2: float = 0.0
    luz: int = 0
    gas: int = 0
    riego_1: int = 0
    riego_2: int = 0
    ventilador: str = "VENTILACION_OFF"
    luces: str = "OFF"
    alarma: str = "OFF"
    modo: str = "AUTOMATICO"
    estado_global: str = "NORMAL"
    last_error: str = ""


class GlobalState:
    """Singleton con los ultimos valores conocidos del invernadero.

    Esto permite que cualquier parte del iot_program consulte el estado
    actual aunque una lectura puntual de sensores falle.
    """

    _instance: GlobalState | None = None
    _instance_lock = RLock()

    def __new__(cls) -> GlobalState:
        with cls._instance_lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._snapshot = StateSnapshot()
                cls._instance._lock = RLock()
            return cls._instance

    def update(self, **values: Any) -> None:
        with self._lock:
            for key, value in values.items():
                if hasattr(self._snapshot, key):
                    setattr(self._snapshot, key, value)

    def get(self, key: str, default: Any = None) -> Any:
        with self._lock:
            return getattr(self._snapshot, key, default)

    def as_dict(self) -> dict[str, Any]:
        with self._lock:
            return asdict(self._snapshot)
