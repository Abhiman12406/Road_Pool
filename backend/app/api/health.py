"""
Health Check API
"""
from fastapi import APIRouter
from app.config import settings
from app.services.simulation_engine import sim_engine

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "city": settings.CITY_NAME,
        "currency": settings.CURRENCY_SYMBOL,
        "active_ws_connections": len(sim_engine.active_connections),
        "engine_status": sim_engine.state.engine.status
    }
