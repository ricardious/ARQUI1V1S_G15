from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuracion central del backend cargada desde variables de entorno."""

    mongodb_uri: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")
    mongodb_db: str = Field(default="greenpi_iot", alias="MONGODB_DB")
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    arm64_dir: str = Field(default="../arm64", alias="ARM64_DIR")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("mongodb_uri", mode="before")
    @classmethod
    def default_mongodb_uri_when_empty(cls, value: str | None) -> str:
        """Evita que una variable vacia rompa el arranque local del servidor."""
        if not value:
            return "mongodb://localhost:27017"
        return value

    @property
    def server_dir(self) -> Path:
        """Ruta absoluta de la carpeta server/."""
        return Path(__file__).resolve().parents[2]

    @property
    def arm64_path(self) -> Path:
        """Ruta absoluta donde estan el Makefile y los modulos ARM64."""
        path = Path(self.arm64_dir)
        if path.is_absolute():
            return path
        return (self.server_dir / path).resolve()

    @property
    def project_root(self) -> Path:
        """Ruta absoluta de la raiz del repositorio."""
        return self.server_dir.parent

    @property
    def arm64_results_path(self) -> Path:
        """Ruta absoluta donde ARM64 deja los archivos resultado_*.txt."""
        return (self.project_root / "resultados_arm64").resolve()


@lru_cache
def get_settings() -> Settings:
    """Devuelve una sola instancia de configuracion para toda la app."""
    return Settings()
