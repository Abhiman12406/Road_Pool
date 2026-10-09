"""
Simulation Control and State API
"""
from typing import Optional, Literal
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.simulation_engine import sim_engine

router = APIRouter(prefix="/simulation", tags=["Simulation"])

class ControlCommand(BaseModel):
    action: Literal['start', 'pause', 'resume', 'reset', 'step', 'next_batch']
    speed: Optional[Literal['0.5x', '1x', '2x', '5x']] = None
    step_seconds: Optional[int] = 10

class SelectionCommand(BaseModel):
    selectedVehicleId: Optional[str] = None
    selectedRequestId: Optional[str] = None
    activeStopId: Optional[str] = None

@router.get("/state")
async def get_simulation_state():
    return sim_engine.state

@router.post("/control")
async def control_simulation(cmd: ControlCommand):
    async with sim_engine.lock:
        if cmd.action in ['start', 'resume']:
            sim_engine.set_engine_status('running')
        elif cmd.action == 'pause':
            sim_engine.set_engine_status('paused')
        elif cmd.action == 'reset':
            sim_engine.set_engine_status('reset')
        elif cmd.action == 'step':
            sim_engine.step_forward(cmd.step_seconds or 10)
        elif cmd.action == 'next_batch':
            sim_engine.run_next_batch()
            
        if cmd.speed:
            sim_engine.set_tick_speed(cmd.speed)
            
    await sim_engine.broadcast_state()
    return {"status": "success", "engine": sim_engine.state.engine}

@router.post("/select")
async def update_selection(cmd: SelectionCommand):
    async with sim_engine.lock:
        if cmd.selectedVehicleId is not None:
            sim_engine.state.selection.selectedVehicleId = cmd.selectedVehicleId
        if cmd.selectedRequestId is not None:
            sim_engine.state.selection.selectedRequestId = cmd.selectedRequestId
        if cmd.activeStopId is not None:
            sim_engine.state.selection.activeStopId = cmd.activeStopId
    await sim_engine.broadcast_state()
    return {"status": "success", "selection": sim_engine.state.selection}
