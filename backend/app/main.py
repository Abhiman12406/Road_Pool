import asyncio
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.services.simulation_engine import sim_engine
from app.api.health import router as health_router
from app.api.simulation import router as simulation_router
from app.api.routing import router as routing_router
from app.api.fares import router as fares_router
from app.api.database import router as database_router

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

# Enable CORS for Vite frontend and deployed Render domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API Routers
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(simulation_router, prefix=settings.API_V1_PREFIX)
app.include_router(routing_router, prefix=settings.API_V1_PREFIX)
app.include_router(fares_router, prefix=settings.API_V1_PREFIX)
app.include_router(database_router, prefix=settings.API_V1_PREFIX)

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

# ---------------------------------------------------------------------------
# Optional Single-Service Fullstack Deployment Support on Render
# If the compiled frontend 'dist' directory is present, serve it directly.
# ---------------------------------------------------------------------------
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if not frontend_dist.exists():
    # Also check local dist/ or static/
    frontend_dist = Path(__file__).resolve().parent.parent / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa_frontend(full_path: str):
        # Don't intercept API or WebSocket paths
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            return None
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
