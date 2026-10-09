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
  batch_id?: number | null;
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
  batchThreshold: number;
  batchStatus: 'intake_open' | 'locked_optimizing' | 'dispatched';
  queuedRequestCount: number;
  lastDispatchReason?: string | null;
  lastDispatchedWindowId?: number | null;
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

export interface DetourAuditEntry {
  request_id: string;
  passenger_id: string;
  passenger_name: string;
  vehicle_id: string | null;
  pickup_name: string;
  dropoff_name: string;
  solo_eta_sec: number;
  solo_distance_km: number;
  pooled_eta_sec: number | null;
  pooled_distance_km: number | null;
  actual_detour_pct: number | null;
  max_allowable_detour_pct: number;
  is_compliant: boolean;
  status: 'compliant_accepted' | 'violation_rejected' | 'capacity_rejected';
  violation_reason?: string | null;
  mathematical_proof: string;
  delay_margin_sec?: number | null;
  timestamp: string;
}

export interface VehicleRoutePlan {
  vehicle_id: string;
  vehicle_name: string;
  capacity: number;
  current_occupancy: number;
  peak_occupancy: number;
  stops: RouteStop[];
  route_polyline: [number, number][];
  total_distance_km: number;
  total_duration_sec: number;
  assigned_request_ids: string[];
}

export interface OptimizationResult {
  vehicle_plans: Record<string, VehicleRoutePlan>;
  accepted_request_ids: string[];
  rejected_request_ids: string[];
  detour_audits: DetourAuditEntry[];
  average_detour_pct: number;
  max_detour_observed_pct: number;
  solver_used: string;
  timestamp: string;
}

export interface GlobalSimulationSnapshot {
  engine: SimulationEngineState;
  kpis: SimulationKPIs;
  selection: SelectionState;
  vehicles: Record<string, Vehicle>;
  requests: Record<string, RideRequest>;
  activePassengerSession: ActivePassengerSession;
  optimizationResult?: OptimizationResult | null;
  detourAudits?: DetourAuditEntry[];
}
