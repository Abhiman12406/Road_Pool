"""
Simulation and Entity Models for RidePool AI
"""
from typing import List, Dict, Optional, Literal, Any
from pydantic import BaseModel, Field

class Location(BaseModel):
    lat: float
    lng: float
    name: str = "Pune Location"

class RideRequest(BaseModel):
    request_id: str
    passenger_id: str
    passenger_name: str = "Passenger"
    pickup: Location
    dropoff: Location
    party_size: int = 1
    request_time: str
    solo_eta_sec: int = 600
    solo_distance_km: float = 5.2
    solo_fare_inr: float = 120.0
    status: Literal['waiting_batch', 'matched', 'en_route_pickup', 'in_transit', 'dropped_off', 'rejected'] = 'waiting_batch'
    assigned_vehicle_id: Optional[str] = None
    batch_id: Optional[int] = None
    pooled_eta_sec: Optional[int] = None
    detour_pct: Optional[float] = None
    shapley_fare_inr: Optional[float] = None
    rejection_reason: Optional[str] = None
    preferred_pickup_time: Optional[str] = None
    arrival_deadline: Optional[str] = None
    special_requirements: Optional[str] = None

class RouteStop(BaseModel):
    stop_id: str
    request_id: str
    stop_type: Literal['pickup', 'dropoff']
    location: Location
    passenger_name: str
    eta_seconds_from_now: int
    completed: bool = False

class Vehicle(BaseModel):
    vehicle_id: str
    name: str
    capacity: int = 4
    occupied_seats: int = 0
    current_location: Location
    status: Literal['idle', 'en_route', 'full'] = 'idle'
    heading_deg: float = 0.0
    battery_pct: int = 90
    route_polyline: List[List[float]] = Field(default_factory=list) # [[lat, lng], ...]
    planned_stops: List[RouteStop] = Field(default_factory=list)

class DetourAuditEntry(BaseModel):
    request_id: str
    passenger_id: str
    passenger_name: str
    vehicle_id: Optional[str] = None
    pickup_name: str
    dropoff_name: str
    solo_eta_sec: int
    solo_distance_km: float
    pooled_eta_sec: Optional[int] = None
    pooled_distance_km: Optional[float] = None
    actual_detour_pct: Optional[float] = None
    max_allowable_detour_pct: float = 15.0
    is_compliant: bool
    status: Literal['compliant_accepted', 'violation_rejected', 'capacity_rejected']
    violation_reason: Optional[str] = None
    mathematical_proof: str
    delay_margin_sec: Optional[int] = None
    timestamp: str

class VehicleRoutePlan(BaseModel):
    vehicle_id: str
    vehicle_name: str
    capacity: int
    current_occupancy: int
    peak_occupancy: int
    stops: List[RouteStop]
    route_polyline: List[List[float]] = Field(default_factory=list)
    total_distance_km: float
    total_duration_sec: int
    assigned_request_ids: List[str]

class OptimizationResult(BaseModel):
    vehicle_plans: Dict[str, VehicleRoutePlan] = Field(default_factory=dict)
    accepted_request_ids: List[str] = Field(default_factory=list)
    rejected_request_ids: List[str] = Field(default_factory=list)
    detour_audits: List[DetourAuditEntry] = Field(default_factory=list)
    average_detour_pct: float = 0.0
    max_detour_observed_pct: float = 0.0
    solver_used: str = "Greedy-Insertion + Google OR-Tools Routing (Capacitated PDP)"
    timestamp: str = ""

class SimulationKPIs(BaseModel):
    activePoolsCount: int = 0
    totalTripsInFlight: int = 0
    fleetDetourAveragePct: float = 0.0
    hardDetourCapPct: float = 15.0
    shapleySavingsPct: float = 0.0
    totalCoalitionSavingsInr: float = 0.0
    servedPassengersCount: int = 0
    rejectedPassengersCount: int = 0

class SimulationEngineState(BaseModel):
    status: Literal['running', 'paused', 'stepping', 'reset'] = 'running'
    currentWindowId: int = 101
    windowIntervalSec: int = 45
    timeRemainingInWindowSec: int = 45
    batchThreshold: int = 6
    batchStatus: Literal['intake_open', 'locked_optimizing', 'dispatched'] = 'intake_open'
    queuedRequestCount: int = 0
    queuedSeatsCount: int = 0
    lastDispatchReason: Optional[str] = None
    lastDispatchedWindowId: Optional[int] = None
    tickSpeed: Literal['0.5x', '1x', '2x', '5x'] = '1x'
    isDemoMode: bool = True
    activeScenario: str = "default_pune"

class SelectionState(BaseModel):
    selectedVehicleId: Optional[str] = None
    selectedRequestId: Optional[str] = None
    activeStopId: Optional[str] = None

class ActivePassengerSession(BaseModel):
    riderId: str = "RIDER-PUNE-01"
    activeTripRequestId: Optional[str] = None
    assignedVehicleId: Optional[str] = None
    lifecycleStatus: Literal['idle', 'waiting_batch', 'matched', 'en_route_pickup', 'in_transit', 'dropped_off', 'no_match', 'rejected', 'solo_dispatched'] = 'idle'
    guaranteedMaxDetourPct: float = 15.0
    actualDetourPct: Optional[float] = None
    fareSoloDirectInr: float = 0.0
    fareShapleyPooledInr: float = 0.0

class GlobalSimulationSnapshot(BaseModel):
    engine: SimulationEngineState
    kpis: SimulationKPIs
    selection: SelectionState
    vehicles: Dict[str, Vehicle]
    requests: Dict[str, RideRequest]
    activePassengerSession: ActivePassengerSession
    optimizationResult: Optional[OptimizationResult] = None
    detourAudits: List[DetourAuditEntry] = Field(default_factory=list)
    shapleyPools: Dict[str, Any] = Field(default_factory=dict)

class MidTripJoinCandidate(BaseModel):
    request_id: str
    passenger_name: str
    pickup: Location
    dropoff: Location
    party_size: int = 1
    solo_fare_inr: float
    proposed_fare_inr: float
    extra_duration_sec: int
    extra_distance_km: float
    affected_passenger_fare_before: float
    affected_passenger_fare_after: float
    affected_passenger_eta_delta_sec: int
    detour_pct: float
    is_valid: bool
    rejection_reason: Optional[str] = None
    mathematical_proof: Optional[str] = None

class MidTripConsentStatus(BaseModel):
    candidate: MidTripJoinCandidate
    driver_consent: Optional[Literal['pending', 'accepted', 'rejected']] = 'pending'
    passenger_consent: Optional[Literal['pending', 'accepted', 'rejected']] = 'pending'
    status: Literal['pending', 'accepted_both', 'rejected_driver', 'rejected_passenger', 'violation_rejected'] = 'pending'
    message: str = ""
