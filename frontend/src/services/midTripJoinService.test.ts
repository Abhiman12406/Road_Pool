import { describe, it, expect } from 'vitest';
import {
  evaluateMidTripJoin,
  resolveMidTripConsent,
  type CandidateJoinRequest,
} from './midTripJoinService';
import type { Vehicle, RideRequest } from '../types/simulation';

describe('midTripJoinService - TDD Seam Tests', () => {
  const activeVehicle: Vehicle = {
    vehicle_id: 'V-101',
    name: 'Tata Tigor EV • Pune Pool #1',
    capacity: 4,
    occupied_seats: 1,
    current_location: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar Station' },
    status: 'en_route',
    heading_deg: 90,
    battery_pct: 85,
    route_polyline: [
      [18.5204, 73.8567],
      [18.5314, 73.8446],
      [18.5590, 73.7868],
    ],
    planned_stops: [
      {
        stop_id: 'STOP-01',
        request_id: 'REQ-P101',
        stop_type: 'pickup',
        location: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar Station' },
        passenger_name: 'Aarav Sharma',
        eta_seconds_from_now: 0,
        completed: true,
      },
      {
        stop_id: 'STOP-02',
        request_id: 'REQ-P101',
        stop_type: 'dropoff',
        location: { lat: 18.5590, lng: 73.7868, name: 'Baner Hub' },
        passenger_name: 'Aarav Sharma',
        eta_seconds_from_now: 720,
        completed: false,
      },
    ],
  };

  const existingRequests: Record<string, RideRequest> = {
    'REQ-P101': {
      request_id: 'REQ-P101',
      passenger_id: 'PAX-01',
      passenger_name: 'Aarav Sharma',
      pickup: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar Station' },
      dropoff: { lat: 18.5590, lng: 73.7868, name: 'Baner Hub' },
      party_size: 1,
      request_time: '17:40:00',
      solo_eta_sec: 720,
      solo_distance_km: 7.8,
      solo_fare_inr: 180.0,
      status: 'in_transit',
      assigned_vehicle_id: 'V-101',
      pooled_eta_sec: 720,
      detour_pct: 0.0,
      shapley_fare_inr: 132.5,
    },
  };

  // 1. Compatible candidate: Rahul Shinde along same corridor (Aundh Parihar Chowk)
  const compatibleCandidate: CandidateJoinRequest = {
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

  // 2. Incompatible candidate: Vikram Sen with extreme detour to Hadapsar
  const incompatibleCandidate: CandidateJoinRequest = {
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

  it('rejects an incompatible joiner whose detour exceeds the 15% cap with a mathematical explanation', () => {
    const evalResult = evaluateMidTripJoin(activeVehicle, existingRequests, incompatibleCandidate, 15.0);

    expect(evalResult.isCompatible).toBe(false);
    expect(evalResult.isDetourViolation).toBe(true);
    expect(evalResult.violationReason).toBeDefined();
    expect(evalResult.violationReason).toContain('15.0% cap');
    expect(evalResult.mathematicalProof).toBeDefined();
    expect(evalResult.mathematicalProof).toContain('> 15.00%');
  });

  it('approves a compatible joiner and prepares dual driver & passenger consent details', () => {
    const evalResult = evaluateMidTripJoin(activeVehicle, existingRequests, compatibleCandidate, 15.0);

    expect(evalResult.isCompatible).toBe(true);
    expect(evalResult.isDetourViolation).toBe(false);
    expect(evalResult.driverNotification).toBeDefined();
    expect(evalResult.driverNotification.pickupName).toBe('Deccan Gymkhana');
    expect(evalResult.driverNotification.dropoffName).toBe('Aundh Parihar Chowk');
    expect(evalResult.driverNotification.incrementalPayoutInr).toBeGreaterThan(0);

    // Existing passenger notification should show reduced fare and minor delay
    expect(evalResult.passengerNotification).toBeDefined();
    expect(evalResult.passengerNotification.existingPassengerName).toBe('Aarav Sharma');
    expect(evalResult.passengerNotification.detourPct).toBeLessThanOrEqual(15.0);
    expect(evalResult.passengerNotification.revisedFareInr).toBeLessThan(
      evalResult.passengerNotification.previousFareInr
    );
    expect(evalResult.passengerNotification.additionalSavingsInr).toBeGreaterThan(0);
  });

  it('cancels mid-trip join when either the driver rejects or the passenger declines', () => {
    const evalResult = evaluateMidTripJoin(activeVehicle, existingRequests, compatibleCandidate, 15.0);

    // Scenario A: Driver rejects, passenger accepts
    const resDriverReject = resolveMidTripConsent(
      activeVehicle,
      existingRequests,
      evalResult,
      'rejected',
      'accepted'
    );
    expect(resDriverReject.outcome).toBe('rejected');
    expect(resDriverReject.reason).toContain('Driver');
    expect(resDriverReject.updatedVehicle.planned_stops).toHaveLength(2);

    // Scenario B: Driver accepts, passenger declines
    const resPassengerDecline = resolveMidTripConsent(
      activeVehicle,
      existingRequests,
      evalResult,
      'accepted',
      'declined'
    );
    expect(resPassengerDecline.outcome).toBe('rejected');
    expect(resPassengerDecline.reason).toContain('Passenger');
    expect(resPassengerDecline.updatedVehicle.planned_stops).toHaveLength(2);
  });

  it('updates vehicle route, adds stops, updates cabin occupancy and recomputes fares upon dual acceptance', () => {
    const evalResult = evaluateMidTripJoin(activeVehicle, existingRequests, compatibleCandidate, 15.0);

    const resApproved = resolveMidTripConsent(
      activeVehicle,
      existingRequests,
      evalResult,
      'accepted',
      'accepted'
    );

    expect(resApproved.outcome).toBe('approved');
    // Two stops added: pickup & dropoff for Rahul Shinde
    expect(resApproved.updatedVehicle.planned_stops).toHaveLength(4);
    expect(
      resApproved.updatedVehicle.planned_stops.some((s) => s.passenger_name === 'Rahul Shinde')
    ).toBe(true);

    // Candidate request created and assigned
    expect(resApproved.candidateRequest).toBeDefined();
    expect(resApproved.candidateRequest.status).toBe('en_route_pickup');
    expect(resApproved.candidateRequest.assigned_vehicle_id).toBe('V-101');

    // Existing passenger Aarav Sharma fare was recomputed lower
    const updatedAarav = resApproved.updatedRequests['REQ-P101'];
    expect(updatedAarav.shapley_fare_inr).toBeLessThan(132.5);
  });

  it('rejects candidate if vehicle capacity would be exceeded (>4 seats)', () => {
    const fullVehicle: Vehicle = {
      ...activeVehicle,
      occupied_seats: 4,
    };
    const evalResult = evaluateMidTripJoin(fullVehicle, existingRequests, compatibleCandidate);

    expect(evalResult.isCompatible).toBe(false);
    expect(evalResult.violationReason?.toLowerCase()).toContain('capacity');
    expect(evalResult.isDetourViolation).toBe(false);
  });
});

