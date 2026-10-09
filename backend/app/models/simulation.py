"""
Simulation and Entity Models for RidePool AI
"""
from typing import List, Dict, Optional, Literal
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
    windowIntervalSec: int = 30
    timeRemainingInWindowSec: int = 30
    batchThreshold: int = 6
    batchStatus: Literal['intake_open', 'locked_optimizing', 'dispatched'] = 'intake_open'
    queuedRequestCount: int = 0
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
    lifecycleStatus: Literal['idle', 'waiting_batch', 'matched', 'en_route_pickup', 'in_transit', 'dropped_off'] = 'idle'
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
