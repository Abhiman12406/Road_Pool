export interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface RouteStop {
  stop_id: string;
  request_id: string;
  stop_type: 'pickup' | 'dropoff';
  location: Location;
  passenger_name: string;
  eta_seconds_from_now: number;
  completed: boolean;
}

export interface Vehicle {
  vehicle_id: string;
  name: string;
  capacity: number;
  occupied_seats: number;
  current_location: Location;
  status: 'idle' | 'en_route' | 'full';
  heading_deg: number;
  battery_pct: number;
  route_polyline: [number, number][];
  planned_stops: RouteStop[];
}

export interface RideRequest {
  request_id: string;
  passenger_id: string;
  passenger_name: string;
  pickup: Location;
  dropoff: Location;
  party_size: number;
  request_time: string;
  solo_eta_sec: number;
  solo_distance_km: number;
  solo_fare_inr: number;
  status: 'waiting_batch' | 'matched' | 'en_route_pickup' | 'in_transit' | 'dropped_off' | 'rejected';
  assigned_vehicle_id: string | null;
  pooled_eta_sec: number | null;
  detour_pct: number | null;
  shapley_fare_inr: number | null;
  rejection_reason?: string;
}

export interface SimulationKPIs {
  activePoolsCount: number;
  totalTripsInFlight: number;
  fleetDetourAveragePct: number;
  hardDetourCapPct: number;
  shapleySavingsPct: number;
  totalCoalitionSavingsInr: number;
  servedPassengersCount: number;
  rejectedPassengersCount: number;
}

export interface SimulationEngineState {
  status: 'running' | 'paused' | 'stepping' | 'reset';
  currentWindowId: number;
  windowIntervalSec: number;
  timeRemainingInWindowSec: number;
  tickSpeed: '0.5x' | '1x' | '2x' | '5x';
  isDemoMode: boolean;
  activeScenario: string;
}

export interface SelectionState {
  selectedVehicleId: string | null;
  selectedRequestId: string | null;
  activeStopId: string | null;
}

export interface ActivePassengerSession {
  riderId: string;
  activeTripRequestId: string | null;
  assignedVehicleId: string | null;
  lifecycleStatus: 'idle' | 'waiting_batch' | 'matched' | 'en_route_pickup' | 'in_transit' | 'dropped_off';
  guaranteedMaxDetourPct: number;
  actualDetourPct: number | null;
  fareSoloDirectInr: number;
  fareShapleyPooledInr: number;
}

export interface GlobalSimulationSnapshot {
  engine: SimulationEngineState;
  kpis: SimulationKPIs;
  selection: SelectionState;
  vehicles: Record<string, Vehicle>;
  requests: Record<string, RideRequest>;
  activePassengerSession: ActivePassengerSession;
}
