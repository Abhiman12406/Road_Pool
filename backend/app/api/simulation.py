"""
Simulation Control and State API
"""
from typing import Optional, Literal, List, Dict, Any
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

class CancelRideCommand(BaseModel):
    request_id: str
    reason: Optional[str] = "passenger_cancelled"

class SimulateCancellationCommand(BaseModel):
    target_request_id: Optional[str] = None

@router.post("/vehicle/{vehicle_id}/advance-stop")
async def advance_vehicle_stop_endpoint(vehicle_id: str):
    async with sim_engine.lock:
        stop = sim_engine.advance_vehicle_stop(vehicle_id)
    await sim_engine.broadcast_state()
    return {"status": "success", "completed_stop": stop, "vehicle": sim_engine.state.vehicles.get(vehicle_id)}

@router.post("/ride/cancel")
async def cancel_ride_endpoint(cmd: CancelRideCommand):
    async with sim_engine.lock:
        res = sim_engine.cancel_ride_request(cmd.request_id, reason=cmd.reason or "passenger_cancelled")
        if not res:
            raise HTTPException(status_code=404, detail=f"Request {cmd.request_id} not found")
    await sim_engine.broadcast_state()
    return {"status": "success", "cancellation": res, "state": sim_engine.state}

@router.post("/vehicle/{vehicle_id}/simulate-cancellation")
async def simulate_cancellation_endpoint(vehicle_id: str, cmd: Optional[SimulateCancellationCommand] = None):
    target_req_id = cmd.target_request_id if cmd else None
    async with sim_engine.lock:
        res = sim_engine.simulate_corider_cancellation(vehicle_id, target_request_id=target_req_id)
        if not res:
            raise HTTPException(status_code=400, detail=f"No eligible co-riders to cancel on vehicle {vehicle_id}")
    await sim_engine.broadcast_state()
    return {"status": "success", "cancellation": res, "vehicle": sim_engine.state.vehicles.get(vehicle_id)}

@router.post("/session/reset")
async def reset_session_endpoint():
    async with sim_engine.lock:
        sim_engine.state.activePassengerSession.activeTripRequestId = None
        sim_engine.state.activePassengerSession.assignedVehicleId = None
        sim_engine.state.activePassengerSession.lifecycleStatus = "idle"
        sim_engine.state.activePassengerSession.actualDetourPct = None
    await sim_engine.broadcast_state()
    return {"status": "success", "session": sim_engine.state.activePassengerSession}

class EvaluateMidTripCommand(BaseModel):
    vehicle_id: str
    simulate_violating: Optional[bool] = False
    candidate_name: Optional[str] = "Vikram Sen"
    party_size: Optional[int] = 1

@router.post("/mid-trip/evaluate")
async def evaluate_mid_trip_endpoint(cmd: EvaluateMidTripCommand):
    async with sim_engine.lock:
        candidate = sim_engine.evaluate_mid_trip_join(
            vehicle_id=cmd.vehicle_id,
            simulate_violating=cmd.simulate_violating or False,
            candidate_name=cmd.candidate_name or "Vikram Sen",
            party_size=cmd.party_size or 1,
        )
    await sim_engine.broadcast_state()
    return {"status": "success", "candidate": candidate}

class MidTripConsentCommand(BaseModel):
    vehicle_id: str
    candidate_data: Dict[str, Any]
    driver_consent: Literal['accepted', 'rejected']
    passenger_consent: Literal['accepted', 'rejected']

@router.post("/mid-trip/consent")
async def process_mid_trip_consent_endpoint(cmd: MidTripConsentCommand):
    async with sim_engine.lock:
        res = sim_engine.process_mid_trip_consent(
            vehicle_id=cmd.vehicle_id,
            candidate_data=cmd.candidate_data,
            driver_consent=cmd.driver_consent,
            passenger_consent=cmd.passenger_consent,
        )
    await sim_engine.broadcast_state()
    return {"status": "success", "consent_result": res}

@router.post("/scenario/{scenario_id}")
async def load_scenario_endpoint(scenario_id: int):
    if scenario_id < 1 or scenario_id > 12:
        raise HTTPException(status_code=400, detail=f"Scenario ID must be between 1 and 12 (Received: {scenario_id})")
    async with sim_engine.lock:
        res = sim_engine.load_acceptance_scenario(scenario_id)
    await sim_engine.broadcast_state()
    return {"status": "success", "scenario": res, "state": sim_engine.state}


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

@router.get("/shapley/matrix")
async def get_shapley_matrices():
    """
    Returns all active 7-coalition matrices, marginal contribution decompositions,
    and fleet-wide game-theoretic cost allocations.
    """
    return {
        "status": "success",
        "active_pools": sim_engine.state.shapleyPools,
        "kpis": {
            "shapleySavingsPct": sim_engine.state.kpis.shapleySavingsPct,
            "totalCoalitionSavingsInr": sim_engine.state.kpis.totalCoalitionSavingsInr,
            "activePoolsCount": sim_engine.state.kpis.activePoolsCount,
        }
    }

@router.get("/shapley/request/{request_id}")
async def get_shapley_for_request(request_id: str):
    """
    Returns the explainable Shapley breakdown, 7-coalition cost matrix,
    marginal contribution tree, and penny reconciliation for a specific request.
    """
    bundle = sim_engine.get_shapley_explanation_for_request(request_id)
    if not bundle or not bundle.get("explanation"):
        raise HTTPException(
            status_code=404,
            detail=f"Shapley allocation for request '{request_id}' not found."
        )
    return {
        "status": "success",
        "request_id": request_id,
        "explanation": bundle["explanation"],
        "pool": bundle["pool"],
    }

@router.get("/shapley/pool/{vehicle_id}")
async def get_shapley_for_vehicle_pool(vehicle_id: str):
    """
    Returns the Shapley pool result for an assigned vehicle.
    """
    pool = sim_engine.state.shapleyPools.get(vehicle_id)
    if not pool:
        raise HTTPException(
            status_code=404,
            detail=f"Active Shapley pool for vehicle '{vehicle_id}' not found."
        )
    return {
        "status": "success",
        "vehicle_id": vehicle_id,
        "pool": pool,
    }

class EvaluateShapleyCommand(BaseModel):
    request_ids: Optional[List[str]] = None
    vehicle_id: Optional[str] = None

@router.post("/shapley/evaluate")
async def evaluate_custom_shapley(cmd: EvaluateShapleyCommand):
    """
    Evaluates combinatorial Shapley values for an arbitrary set of request IDs or current batch.
    """
    from app.services.shapley_service import shapley_engine
    target_reqs = []
    if cmd.request_ids:
        for rid in cmd.request_ids:
            if rid in sim_engine.state.requests:
                target_reqs.append(sim_engine.state.requests[rid])
    else:
        # Default to first 3 requests
        target_reqs = list(sim_engine.state.requests.values())[:3]

    if not target_reqs:
        raise HTTPException(status_code=400, detail="No valid ride requests provided to evaluate.")

    veh = sim_engine.state.vehicles.get(cmd.vehicle_id) if cmd.vehicle_id else list(sim_engine.state.vehicles.values())[0]
    pool_res = shapley_engine.compute_shapley_for_pool(
        requests=target_reqs,
        vehicle=veh,
        batch_id=sim_engine.state.engine.currentWindowId,
    )
    return {
        "status": "success",
        "pool": pool_res,
    }
