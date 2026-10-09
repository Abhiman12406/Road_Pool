import type { Vehicle, RideRequest, RouteStop, Location } from '../types/simulation';

export type SeatPosition = 'driver' | 'front_passenger' | 'rear_left' | 'rear_middle' | 'rear_right';
export type SeatStatus = 'driver' | 'onboard' | 'reserved' | 'available';

export interface CabinSeat {
  seatId: string;
  position: SeatPosition;
  seatLabel: string;
  status: SeatStatus;
  isDriver: boolean;
  passengerName?: string;
  passengerId?: string;
  requestId?: string;
  partySize?: number;
  pickupName?: string;
  dropoffName?: string;
  shapleyFareInr?: number;
  soloFareInr?: number;
  detourPct?: number;
  etaSeconds?: number;
}

export interface CabinLayoutState {
  driverSeat: CabinSeat;
  passengerSeats: CabinSeat[];
  occupiedCount: number;
  reservedCount: number;
  availableCount: number;
  totalCapacity: number;
}

export interface TimelineStop {
  stop_id: string;
  request_id: string;
  stop_type: 'pickup' | 'dropoff';
  location: Location;
  passenger_name: string;
  eta_seconds_from_now: number;
  completed: boolean;
  isNextUp: boolean;
  dynamicOccupancy: number;
  shapley_fare_inr?: number;
}

export interface RouteTimelineState {
  stops: TimelineStop[];
  nextStop: TimelineStop | null;
  completedCount: number;
  remainingCount: number;
  allCompleted: boolean;
  routeVisualState: 'proposed' | 'confirmed' | 'completed';
}

/**
 * Derives the interactive 4-seat cabin occupancy layout (Driver + 4 passenger seats)
 * distinguishing onboard riders, reserved upcoming riders, and available seats.
 */
export function deriveCabinOccupancy(
  vehicle: Vehicle,
  requests: Record<string, RideRequest>,
  _plannedStops?: RouteStop[]
): CabinLayoutState {
  const driverSeat: CabinSeat = {
    seatId: 'SEAT-DRV',
    position: 'driver',
    seatLabel: 'Driver',
    status: 'driver',
    isDriver: true,
    passengerName: 'Kailash Deshmukh (Verified Pilot)',
  };

  const passengerSeatPositions: { id: string; position: SeatPosition; label: string }[] = [
    { id: 'SEAT-FP', position: 'front_passenger', label: 'Front Co-Passenger' },
    { id: 'SEAT-RL', position: 'rear_left', label: 'Rear Window (Left)' },
    { id: 'SEAT-RM', position: 'rear_middle', label: 'Rear Center' },
    { id: 'SEAT-RR', position: 'rear_right', label: 'Rear Window (Right)' },
  ];

  // Find requests assigned to this vehicle
  const assignedRequests = Object.values(requests).filter(
    (r) => r.assigned_vehicle_id === vehicle.vehicle_id && r.status !== 'rejected' && r.status !== 'dropped_off'
  );

  // Separate onboard riders and confirmed upcoming reservations
  const onboardRequests: RideRequest[] = [];
  const reservedRequests: RideRequest[] = [];

  for (const req of assignedRequests) {
    if (req.status === 'in_transit') {
      onboardRequests.push(req);
    } else if (req.status === 'en_route_pickup' || req.status === 'matched') {
      reservedRequests.push(req);
    }
  }

  // Also verify against planned stops if available
  const stops = vehicle.planned_stops || [];
  const completedPickups = new Set(
    stops.filter((s) => s.stop_type === 'pickup' && s.completed).map((s) => s.request_id)
  );
  const completedDropoffs = new Set(
    stops.filter((s) => s.stop_type === 'dropoff' && s.completed).map((s) => s.request_id)
  );

  // Any request with completed pickup but not completed dropoff is onboard
  for (const req of assignedRequests) {
    if (completedPickups.has(req.request_id) && !completedDropoffs.has(req.request_id)) {
      if (!onboardRequests.some((r) => r.request_id === req.request_id)) {
        onboardRequests.push(req);
        const idx = reservedRequests.findIndex((r) => r.request_id === req.request_id);
        if (idx !== -1) reservedRequests.splice(idx, 1);
      }
    }
  }

  const passengerSeats: CabinSeat[] = [];
  let seatIdx = 0;

  // 1. Assign Onboard Riders first (solid indicator)
  for (const req of onboardRequests) {
    const partyCount = Math.max(1, req.party_size || 1);
    for (let p = 0; p < partyCount && seatIdx < passengerSeatPositions.length; p++) {
      const posMeta = passengerSeatPositions[seatIdx];
      passengerSeats.push({
        seatId: `${posMeta.id}-${req.request_id}`,
        position: posMeta.position,
        seatLabel: posMeta.label,
        status: 'onboard',
        isDriver: false,
        passengerName: p === 0 ? req.passenger_name : `${req.passenger_name} (Guest ${p + 1})`,
        passengerId: req.passenger_id,
        requestId: req.request_id,
        partySize: req.party_size,
        pickupName: req.pickup?.name,
        dropoffName: req.dropoff?.name,
        shapleyFareInr: req.shapley_fare_inr ? req.shapley_fare_inr / partyCount : undefined,
        soloFareInr: req.solo_fare_inr ? req.solo_fare_inr / partyCount : undefined,
        detourPct: req.detour_pct ?? 0,
        etaSeconds: req.pooled_eta_sec ?? undefined,
      });
      seatIdx++;
    }
  }

  // 2. Assign Reserved Upcoming Riders next (reserved indicator)
  for (const req of reservedRequests) {
    const partyCount = Math.max(1, req.party_size || 1);
    for (let p = 0; p < partyCount && seatIdx < passengerSeatPositions.length; p++) {
      const posMeta = passengerSeatPositions[seatIdx];
      passengerSeats.push({
        seatId: `${posMeta.id}-${req.request_id}`,
        position: posMeta.position,
        seatLabel: posMeta.label,
        status: 'reserved',
        isDriver: false,
        passengerName: p === 0 ? req.passenger_name : `${req.passenger_name} (Guest ${p + 1})`,
        passengerId: req.passenger_id,
        requestId: req.request_id,
        partySize: req.party_size,
        pickupName: req.pickup?.name,
        dropoffName: req.dropoff?.name,
        shapleyFareInr: req.shapley_fare_inr ? req.shapley_fare_inr / partyCount : undefined,
        soloFareInr: req.solo_fare_inr ? req.solo_fare_inr / partyCount : undefined,
        detourPct: req.detour_pct ?? 0,
        etaSeconds: req.pooled_eta_sec ?? undefined,
      });
      seatIdx++;
    }
  }

  // 3. Fill remaining seats with Available status (open indicator)
  while (seatIdx < passengerSeatPositions.length) {
    const posMeta = passengerSeatPositions[seatIdx];
    passengerSeats.push({
      seatId: posMeta.id,
      position: posMeta.position,
      seatLabel: posMeta.label,
      status: 'available',
      isDriver: false,
    });
    seatIdx++;
  }

  const occupiedCount = passengerSeats.filter((s) => s.status === 'onboard').length;
  const reservedCount = passengerSeats.filter((s) => s.status === 'reserved').length;
  const availableCount = passengerSeats.filter((s) => s.status === 'available').length;

  return {
    driverSeat,
    passengerSeats,
    occupiedCount,
    reservedCount,
    availableCount,
    totalCapacity: 4,
  };
}

/**
 * Derives ordered stops timeline, marking completed checkmarks, the next-up active stop,
 * and dynamically computing live cabin occupancy and route visual state.
 */
export function deriveRouteTimeline(
  vehicle: Vehicle,
  requests: Record<string, RideRequest>
): RouteTimelineState {
  const rawStops = vehicle.planned_stops || [];
  let currentOccupancy = 0;
  let nextFound = false;

  const stops: TimelineStop[] = rawStops.map((stop) => {
    // Dynamic occupancy estimation along the timeline
    if (stop.stop_type === 'pickup') {
      currentOccupancy += 1;
    } else {
      currentOccupancy = Math.max(0, currentOccupancy - 1);
    }

    const isNextUp = !stop.completed && !nextFound;
    if (isNextUp) {
      nextFound = true;
    }

    const matchedReq = requests[stop.request_id];

    return {
      stop_id: stop.stop_id,
      request_id: stop.request_id,
      stop_type: stop.stop_type,
      location: stop.location,
      passenger_name: stop.passenger_name,
      eta_seconds_from_now: stop.eta_seconds_from_now,
      completed: !!stop.completed,
      isNextUp,
      dynamicOccupancy: currentOccupancy,
      shapley_fare_inr: matchedReq?.shapley_fare_inr ?? undefined,
    };
  });

  const nextStop = stops.find((s) => s.isNextUp) || null;
  const completedCount = stops.filter((s) => s.completed).length;
  const remainingCount = stops.length - completedCount;
  const allCompleted = stops.length > 0 && remainingCount === 0;

  // Determine visual route state
  let routeVisualState: 'proposed' | 'confirmed' | 'completed' = 'confirmed';
  if (allCompleted) {
    routeVisualState = 'completed';
  } else if (vehicle.status === 'idle' || stops.length === 0) {
    routeVisualState = 'proposed';
  } else {
    routeVisualState = 'confirmed';
  }

  return {
    stops,
    nextStop,
    completedCount,
    remainingCount,
    allCompleted,
    routeVisualState,
  };
}
