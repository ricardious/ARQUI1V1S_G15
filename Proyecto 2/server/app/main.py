from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import close_mongo_connection, connect_to_mongo


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Abre MongoDB al iniciar la API y lo cierra al apagarla."""
    settings = get_settings()
    await connect_to_mongo(settings)
    yield
    await close_mongo_connection()


settings = get_settings()

app = FastAPI(
    title="GreenPi IoT Backend",
    version="1.0.0",
    description="API REST para dashboard, MongoDB Atlas y flujo ARM64.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
