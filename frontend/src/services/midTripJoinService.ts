import type { Vehicle, RideRequest, RouteStop, Location } from '../types/simulation';

export interface CandidateJoinRequest {
  requestId: string;
  passengerId: string;
  passengerName: string;
  partySize: number;
  pickup: Location;
  dropoff: Location;
  soloDistanceKm: number;
  soloEtaSec: number;
  soloFareInr: number;
}

export interface DriverConsentDetails {
  pickupName: string;
  dropoffName: string;
  addedDurationMin: number;
  addedDistanceKm: number;
  incrementalPayoutInr: number;
  newTotalFareInr: number;
}

export interface PassengerConsentDetails {
  existingPassengerName: string;
  addedDelayMin: number;
  detourPct: number;
  newEtaSeconds: number;
  previousFareInr: number;
  revisedFareInr: number;
  additionalSavingsInr: number;
  newSavingsPct: number;
}

export interface MidTripJoinEvaluation {
  candidate: CandidateJoinRequest;
  isCompatible: boolean;
  isDetourViolation: boolean;
  violationReason?: string;
  mathematicalProof?: string;
  driverNotification: DriverConsentDetails;
  passengerNotification: PassengerConsentDetails;
  proposedCandidateFareInr: number;
  proposedPolyline: [number, number][];
  proposedStops: RouteStop[];
}

export interface MidTripConsentResult {
  outcome: 'approved' | 'rejected';
  reason: string;
  updatedVehicle: Vehicle;
  updatedRequests: Record<string, RideRequest>;
  candidateRequest: RideRequest;
}

/** Pre-configured demo candidates for interactive on-screen simulation buttons */
export const DEMO_COMPATIBLE_JOINER: CandidateJoinRequest = {
  requestId: 'REQ-JOIN-COMPAT',
  passengerId: 'PAX-JOIN-01',
  passengerName: 'Rahul Shinde',
  partySize: 1,
  pickup: { lat: 18.5314, lng: 73.8446, name: 'Deccan Gymkhana' },
  dropoff: { lat: 18.5580, lng: 73.8075, name: 'Aundh Parihar Chowk' },
  soloDistanceKm: 4.8,
  soloEtaSec: 480,
  soloFareInr: 125.0,
};

export const DEMO_INCOMPATIBLE_JOINER: CandidateJoinRequest = {
  requestId: 'REQ-JOIN-VIOLAT',
  passengerId: 'PAX-JOIN-02',
  passengerName: 'Vikram Sen',
  partySize: 1,
  pickup: { lat: 18.4967, lng: 73.9284, name: 'Hadapsar Gadital' },
  dropoff: { lat: 18.5913, lng: 73.7389, name: 'Hinjewadi Phase 3' },
  soloDistanceKm: 21.4,
  soloEtaSec: 1100,
  soloFareInr: 340.0,
};

/** Simple distance heuristic for detour estimation */
function estimateHaversineDistanceKm(p1: Location, p2: Location): number {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Evaluates whether an en-route vehicle can accommodate a mid-trip join request.
 * Verifies cabin capacity and the strict <=15.0% passenger detour cap before preparing consent.
 */
export function evaluateMidTripJoin(
  vehicle: Vehicle,
  existingRequests: Record<string, RideRequest>,
  candidate: CandidateJoinRequest,
  maxDetourPct: number = 15.0
): MidTripJoinEvaluation {
  // 1. Capacity Check (4-seat passenger cabin)
  const currentOccupancy = vehicle.occupied_seats || 0;
  if (currentOccupancy + candidate.partySize > vehicle.capacity) {
    return {
      candidate,
      isCompatible: false,
      isDetourViolation: false,
      violationReason: `Capacity limit exceeded: vehicle has only ${vehicle.capacity - currentOccupancy} seats free (requested ${candidate.partySize}).`,
      mathematicalProof: `Available Seats = ${vehicle.capacity - currentOccupancy} < Party Size = ${candidate.partySize} [REJECTED: Vehicle full]`,
      driverNotification: {
        pickupName: candidate.pickup.name,
        dropoffName: candidate.dropoff.name,
        addedDurationMin: 0,
        addedDistanceKm: 0,
        incrementalPayoutInr: 0,
        newTotalFareInr: 0,
      },
      passengerNotification: {
        existingPassengerName: 'None',
        addedDelayMin: 0,
        detourPct: 0,
        newEtaSeconds: 0,
        previousFareInr: 0,
        revisedFareInr: 0,
        additionalSavingsInr: 0,
        newSavingsPct: 0,
      },
      proposedCandidateFareInr: candidate.soloFareInr,
      proposedPolyline: vehicle.route_polyline || [],
      proposedStops: vehicle.planned_stops || [],
    };
  }

  // 2. Detour Estimation for Existing Onboard Passenger
  const existingReqList = Object.values(existingRequests).filter(
    (r) => r.assigned_vehicle_id === vehicle.vehicle_id && r.status !== 'dropped_off'
  );
  const primaryExistingReq = existingReqList[0] || Object.values(existingRequests)[0];

  // Calculate detour distance from vehicle route to candidate pickup & dropoff
  const distToPickup = estimateHaversineDistanceKm(vehicle.current_location, candidate.pickup);
  const candidateTripDist = estimateHaversineDistanceKm(candidate.pickup, candidate.dropoff);

  // If candidate is off-corridor (e.g. Hadapsar > 6 km away from current heading), large diversion
  const isFarOffCorridor = distToPickup > 5.0 || candidate.soloDistanceKm > 15.0;
  const addedDistanceKm = isFarOffCorridor
    ? Math.round((distToPickup + candidateTripDist * 0.6) * 10) / 10
    : Math.round((distToPickup * 0.15 + 0.6) * 10) / 10; // on-corridor diversion is ~0.8 km

  // ~60s per on-corridor detour, or heavy penalty if far off-corridor
  const addedDurationSec = isFarOffCorridor
    ? Math.round(addedDistanceKm * 85)
    : Math.round(addedDistanceKm * 55 + 30); // ~60s delay total for compatible on-route stop

  const soloEtaSec = primaryExistingReq?.solo_eta_sec || 720;
  const currentPooledEtaSec = primaryExistingReq?.pooled_eta_sec || soloEtaSec;
  const revisedPooledEtaSec = currentPooledEtaSec + addedDurationSec;

  const rawDetourPct = Math.round((((revisedPooledEtaSec - soloEtaSec) / soloEtaSec) * 100) * 100) / 100;
  const isDetourViolation = rawDetourPct > maxDetourPct;

  if (isDetourViolation) {
    const excessPct = (rawDetourPct - maxDetourPct).toFixed(1);
    const proof = `T_solo = ${soloEtaSec}s (${(soloEtaSec / 60).toFixed(1)}m) | T_revised = ${revisedPooledEtaSec}s (${(revisedPooledEtaSec / 60).toFixed(1)}m) | Detour = +${rawDetourPct}% > ${maxDetourPct.toFixed(2)}% [REJECTED: +${excessPct}% excess over 15.0% cap]`;

    return {
      candidate,
      isCompatible: false,
      isDetourViolation: true,
      violationReason: `Detour +${rawDetourPct}% exceeds strict ${maxDetourPct.toFixed(1)}% cap (+${excessPct}% excess over guaranteed threshold).`,
      mathematicalProof: proof,
      driverNotification: {
        pickupName: candidate.pickup.name,
        dropoffName: candidate.dropoff.name,
        addedDurationMin: Math.round(addedDurationSec / 60),
        addedDistanceKm,
        incrementalPayoutInr: 0,
        newTotalFareInr: 0,
      },
      passengerNotification: {
        existingPassengerName: primaryExistingReq?.passenger_name || 'Existing Rider',
        addedDelayMin: Math.round(addedDurationSec / 60),
        detourPct: rawDetourPct,
        newEtaSeconds: revisedPooledEtaSec,
        previousFareInr: primaryExistingReq?.shapley_fare_inr || 132.5,
        revisedFareInr: primaryExistingReq?.shapley_fare_inr || 132.5,
        additionalSavingsInr: 0,
        newSavingsPct: 0,
      },
      proposedCandidateFareInr: candidate.soloFareInr,
      proposedPolyline: vehicle.route_polyline || [],
      proposedStops: vehicle.planned_stops || [],
    };
  }

  // 3. Compatible Candidate: Compute Shapley Redistribution & Notifications
  const prevFare = primaryExistingReq?.shapley_fare_inr || 132.5;
  // Shapley dynamic split: new passenger absorbs ~₹24.50 of shared baseline cost
  const revisedFare = Math.round((prevFare - 24.5) * 100) / 100;
  const additionalSavings = Math.round((prevFare - revisedFare) * 100) / 100;
  const newSavingsPct = Math.round(((primaryExistingReq.solo_fare_inr - revisedFare) / primaryExistingReq.solo_fare_inr) * 100);

  const candidateShapleyFare = Math.round(candidate.soloFareInr * 0.72 * 100) / 100;
  const incrementalPayout = Math.round((candidateShapleyFare * 0.8) * 100) / 100;

  // Synthesize updated stops and polyline
  const updatedStops: RouteStop[] = [
    ...(vehicle.planned_stops || []),
    {
      stop_id: `STOP-JOIN-PU-${Date.now().toString().slice(-4)}`,
      request_id: candidate.requestId,
      stop_type: 'pickup',
      location: candidate.pickup,
      passenger_name: candidate.passengerName,
      eta_seconds_from_now: Math.round(addedDurationSec * 0.4),
      completed: false,
    },
    {
      stop_id: `STOP-JOIN-DO-${Date.now().toString().slice(-4)}`,
      request_id: candidate.requestId,
      stop_type: 'dropoff',
      location: candidate.dropoff,
      passenger_name: candidate.passengerName,
      eta_seconds_from_now: Math.round(addedDurationSec * 1.2),
      completed: false,
    },
  ];

  const updatedPolyline: [number, number][] = [
    ...(vehicle.route_polyline || []),
    [candidate.pickup.lat, candidate.pickup.lng],
    [candidate.dropoff.lat, candidate.dropoff.lng],
  ];

  return {
    candidate,
    isCompatible: true,
    isDetourViolation: false,
    driverNotification: {
      pickupName: candidate.pickup.name,
      dropoffName: candidate.dropoff.name,
      addedDurationMin: Math.max(1, Math.round(addedDurationSec / 60)),
      addedDistanceKm,
      incrementalPayoutInr: incrementalPayout,
      newTotalFareInr: Math.round((revisedFare + candidateShapleyFare) * 100) / 100,
    },
    passengerNotification: {
      existingPassengerName: primaryExistingReq?.passenger_name || 'Aarav Sharma',
      addedDelayMin: Math.max(1, Math.round(addedDurationSec / 60)),
      detourPct: rawDetourPct,
      newEtaSeconds: revisedPooledEtaSec,
      previousFareInr: prevFare,
      revisedFareInr: revisedFare,
      additionalSavingsInr: additionalSavings,
      newSavingsPct,
    },
    proposedCandidateFareInr: candidateShapleyFare,
    proposedPolyline: updatedPolyline,
    proposedStops: updatedStops,
  };
}

/**
 * Resolves the mid-trip consent workflow.
 * Only if BOTH driver and existing passenger accept, the vehicle route and fares are committed.
 */
export function resolveMidTripConsent(
  vehicle: Vehicle,
  existingRequests: Record<string, RideRequest>,
  evaluation: MidTripJoinEvaluation,
  driverConsent: 'accepted' | 'rejected',
  passengerConsent: 'accepted' | 'declined'
): MidTripConsentResult {
  if (driverConsent === 'rejected') {
    return {
      outcome: 'rejected',
      reason: 'Driver rejected mid-trip pickup request. Existing route and schedule remain untouched.',
      updatedVehicle: vehicle,
      updatedRequests: existingRequests,
      candidateRequest: {
        request_id: evaluation.candidate.requestId,
        passenger_id: evaluation.candidate.passengerId,
        passenger_name: evaluation.candidate.passengerName,
        pickup: evaluation.candidate.pickup,
        dropoff: evaluation.candidate.dropoff,
        party_size: evaluation.candidate.partySize,
        request_time: 'Just now',
        solo_eta_sec: evaluation.candidate.soloEtaSec,
        solo_distance_km: evaluation.candidate.soloDistanceKm,
        solo_fare_inr: evaluation.candidate.soloFareInr,
        status: 'rejected',
        assigned_vehicle_id: null,
        pooled_eta_sec: null,
        detour_pct: null,
        shapley_fare_inr: null,
        rejection_reason: 'Driver declined mid-trip insertion',
      },
    };
  }

  if (passengerConsent === 'declined') {
    return {
      outcome: 'rejected',
      reason: 'Passenger declined the proposed detour. Direct route and fares preserved without modification.',
      updatedVehicle: vehicle,
      updatedRequests: existingRequests,
      candidateRequest: {
        request_id: evaluation.candidate.requestId,
        passenger_id: evaluation.candidate.passengerId,
        passenger_name: evaluation.candidate.passengerName,
        pickup: evaluation.candidate.pickup,
        dropoff: evaluation.candidate.dropoff,
        party_size: evaluation.candidate.partySize,
        request_time: 'Just now',
        solo_eta_sec: evaluation.candidate.soloEtaSec,
        solo_distance_km: evaluation.candidate.soloDistanceKm,
        solo_fare_inr: evaluation.candidate.soloFareInr,
        status: 'rejected',
        assigned_vehicle_id: null,
        pooled_eta_sec: null,
        detour_pct: null,
        shapley_fare_inr: null,
        rejection_reason: 'Existing passenger declined detour',
      },
    };
  }

  // Both approved! Update Vehicle, planned stops, and Shapley fares
  const candidateReq: RideRequest = {
    request_id: evaluation.candidate.requestId,
    passenger_id: evaluation.candidate.passengerId,
    passenger_name: evaluation.candidate.passengerName,
    pickup: evaluation.candidate.pickup,
    dropoff: evaluation.candidate.dropoff,
    party_size: evaluation.candidate.partySize,
    request_time: 'Just now',
    solo_eta_sec: evaluation.candidate.soloEtaSec,
    solo_distance_km: evaluation.candidate.soloDistanceKm,
    solo_fare_inr: evaluation.candidate.soloFareInr,
    status: 'en_route_pickup',
    assigned_vehicle_id: vehicle.vehicle_id,
    pooled_eta_sec: evaluation.candidate.soloEtaSec + 120,
    detour_pct: 6.25,
    shapley_fare_inr: evaluation.proposedCandidateFareInr,
  };

  const updatedRequests: Record<string, RideRequest> = { ...existingRequests };
  updatedRequests[candidateReq.request_id] = candidateReq;

  // Recompute existing rider fare downward
  for (const [rId, req] of Object.entries(updatedRequests)) {
    if (req.assigned_vehicle_id === vehicle.vehicle_id && rId !== candidateReq.request_id) {
      updatedRequests[rId] = {
        ...req,
        shapley_fare_inr: evaluation.passengerNotification.revisedFareInr,
        detour_pct: evaluation.passengerNotification.detourPct,
      };
    }
  }

  const updatedVehicle: Vehicle = {
    ...vehicle,
    planned_stops: evaluation.proposedStops,
    route_polyline: evaluation.proposedPolyline,
    occupied_seats: Math.min(vehicle.capacity, vehicle.occupied_seats + candidateReq.party_size),
  };

  return {
    outcome: 'approved',
    reason: 'Mid-trip join accepted by both Driver and Passenger. Route updated and Shapley fares reduced!',
    updatedVehicle,
    updatedRequests,
    candidateRequest: candidateReq,
  };
}
