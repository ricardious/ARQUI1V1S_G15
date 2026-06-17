from fastapi import APIRouter

from app.api.endpoints import actuator_logs, arm64, commands, events, health, readings, status

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(readings.router)
api_router.include_router(events.router)
api_router.include_router(commands.router)
api_router.include_router(status.router)
api_router.include_router(actuator_logs.router)
api_router.include_router(arm64.router)
