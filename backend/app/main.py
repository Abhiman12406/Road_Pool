"""
RidePool AI - Main FastAPI Application
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.simulation_engine import sim_engine
from app.api.health import router as health_router
from app.api.simulation import router as simulation_router
from app.api.routing import router as routing_router
from app.api.fares import router as fares_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background simulation ticking loop
    sim_task = asyncio.create_task(sim_engine.run_loop())
    yield
    # Shutdown: cancel task
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Algorithmic Ride-Pooling, Dynamic Batching & Shapley Fair-Fare Engine Backend",
    lifespan=lifespan
)

# Enable CORS for Vite frontend (typically localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation_router, prefix=settings.API_V1_PREFIX)
app.include_router(routing_router, prefix=settings.API_V1_PREFIX)
app.include_router(fares_router, prefix=settings.API_V1_PREFIX)

@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await sim_engine.register_connection(websocket)
    try:
        while True:
            # Keep alive and receive any client messages/commands
            data = await websocket.receive_text()
            # Client can send simple ping or action
    except WebSocketDisconnect:
        sim_engine.unregister_connection(websocket)
    except Exception:
        sim_engine.unregister_connection(websocket)
