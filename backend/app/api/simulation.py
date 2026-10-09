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

class CreateRideRequestCommand(BaseModel):
    pickup_name: str
    pickup_lat: float
    pickup_lng: float
    dropoff_name: str
    dropoff_lat: float
    dropoff_lng: float
    party_size: int = 1
    solo_distance_km: float
    solo_eta_sec: int
    solo_fare_inr: float
    passenger_name: Optional[str] = "Elena Vance (Rider)"

@router.post("/request")
async def create_ride_request(cmd: CreateRideRequestCommand):
    async with sim_engine.lock:
        req = sim_engine.create_passenger_request(
            pickup_name=cmd.pickup_name,
            pickup_lat=cmd.pickup_lat,
            pickup_lng=cmd.pickup_lng,
            dropoff_name=cmd.dropoff_name,
            dropoff_lat=cmd.dropoff_lat,
            dropoff_lng=cmd.dropoff_lng,
            party_size=cmd.party_size,
            solo_distance_km=cmd.solo_distance_km,
            solo_eta_sec=cmd.solo_eta_sec,
            solo_fare_inr=cmd.solo_fare_inr,
            passenger_name=cmd.passenger_name or "Elena Vance (Rider)"
        )
    await sim_engine.broadcast_state()
    return {"status": "success", "request": req}
