"""
Simulation Control and State API
"""
from typing import Optional, Literal
from fastapi import APIRouter, HTTPException
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
    preferred_pickup_time: Optional[str] = None
    arrival_deadline: Optional[str] = None
    special_requirements: Optional[str] = None

@router.post("/request")
async def create_ride_request(cmd: CreateRideRequestCommand):
    if cmd.party_size < 1 or cmd.party_size > 4:
        raise HTTPException(
            status_code=400,
            detail=f"Party size must be between 1 and 4 seats. Maximum vehicle capacity is 4. (Requested: {cmd.party_size})"
        )

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
            passenger_name=cmd.passenger_name or "Elena Vance (Rider)",
            preferred_pickup_time=cmd.preferred_pickup_time,
            arrival_deadline=cmd.arrival_deadline,
            special_requirements=cmd.special_requirements,
        )
    await sim_engine.broadcast_state()
    return {"status": "success", "request": req}

@router.post("/request/{request_id}/requeue")
async def requeue_request(request_id: str):
    async with sim_engine.lock:
        try:
            req = sim_engine.requeue_request(request_id)
        except KeyError:
            raise HTTPException(status_code=404, detail=f"Request {request_id} not found")
    await sim_engine.broadcast_state()
    return {"status": "success", "request": req}

@router.post("/request/{request_id}/solo-dispatch")
async def solo_dispatch_request(request_id: str):
    async with sim_engine.lock:
        try:
            req = sim_engine.dispatch_solo_ride(request_id)
        except KeyError:
            raise HTTPException(status_code=404, detail=f"Request {request_id} not found")
    await sim_engine.broadcast_state()
    return {"status": "success", "request": req}

class ConfigureBatchCommand(BaseModel):
    window_interval_sec: Optional[int] = None
    batch_threshold: Optional[int] = None

@router.post("/batch/configure")
async def configure_batch(cmd: ConfigureBatchCommand):
    async with sim_engine.lock:
        sim_engine.configure_batching(
            window_interval_sec=cmd.window_interval_sec,
            batch_threshold=cmd.batch_threshold
        )
    await sim_engine.broadcast_state()
    return {
        "status": "success",
        "windowIntervalSec": sim_engine.state.engine.windowIntervalSec,
        "batchThreshold": sim_engine.state.engine.batchThreshold
    }

@router.post("/batch/dispatch-now")
async def dispatch_batch_now():
    async with sim_engine.lock:
        sim_engine.lock_and_dispatch_batch(trigger_reason="manual_dispatch")
    await sim_engine.broadcast_state()
    return {
        "status": "success",
        "currentWindowId": sim_engine.state.engine.currentWindowId,
        "lastDispatchedWindowId": sim_engine.state.engine.lastDispatchedWindowId,
        "lastDispatchReason": sim_engine.state.engine.lastDispatchReason
    }

class GenerateDemandCommand(BaseModel):
    count: int = 1

@router.post("/batch/generate-demand")
async def generate_demand(cmd: GenerateDemandCommand):
    async with sim_engine.lock:
        created = sim_engine.generate_synthetic_demand(count=max(1, min(10, cmd.count)))
    await sim_engine.broadcast_state()
    return {
        "status": "success",
        "count": len(created),
        "generated_requests": created
    }

@router.get("/batches")
async def get_batches():
    engine = sim_engine.state.engine
    current_id = engine.currentWindowId
    pending = [r for r in sim_engine.state.requests.values() if r.status == "waiting_batch" and r.batch_id == current_id]
    admitted = [r for r in sim_engine.state.requests.values() if r.status != "waiting_batch"]
    return {
        "currentWindowId": current_id,
        "windowIntervalSec": engine.windowIntervalSec,
        "timeRemainingInWindowSec": engine.timeRemainingInWindowSec,
        "batchThreshold": engine.batchThreshold,
        "batchStatus": engine.batchStatus,
        "queuedRequestCount": len(pending),
        "pendingRequests": pending,
        "admittedCount": len(admitted)
    }

@router.get("/optimization")
async def get_optimization():
    if not sim_engine.state.optimizationResult:
        from app.services.route_optimizer import route_optimizer
        opt_res = route_optimizer.optimize_and_validate_routes(
            vehicles=list(sim_engine.state.vehicles.values()),
            requests=list(sim_engine.state.requests.values()),
            max_detour_pct=sim_engine.state.kpis.hardDetourCapPct
        )
        sim_engine.state.optimizationResult = opt_res
    return sim_engine.state.optimizationResult

@router.get("/detour-guarantees")
async def get_detour_guarantees():
    return {
        "hardDetourCapPct": sim_engine.state.kpis.hardDetourCapPct,
        "fleetDetourAveragePct": sim_engine.state.kpis.fleetDetourAveragePct,
        "audits": sim_engine.state.detourAudits,
        "compliantCount": len([a for a in sim_engine.state.detourAudits if a.is_compliant]),
        "rejectedCount": len([a for a in sim_engine.state.detourAudits if not a.is_compliant]),
    }

class SolveOptimizationCommand(BaseModel):
    max_detour_pct: Optional[float] = 15.0

@router.post("/optimization/solve")
async def solve_optimization(cmd: Optional[SolveOptimizationCommand] = None):
    from app.services.route_optimizer import route_optimizer
    cap = cmd.max_detour_pct if cmd and cmd.max_detour_pct else sim_engine.state.kpis.hardDetourCapPct
    async with sim_engine.lock:
        pending_requests = [
            r for r in sim_engine.state.requests.values()
            if r.status in ['waiting_batch', 'matched']
        ]
        opt_result = route_optimizer.optimize_and_validate_routes(
            vehicles=list(sim_engine.state.vehicles.values()),
            requests=pending_requests,
            max_detour_pct=cap
        )
        sim_engine.state.optimizationResult = opt_result
        sim_engine.state.detourAudits = opt_result.detour_audits + sim_engine.state.detourAudits
    await sim_engine.broadcast_state()
    return opt_result
