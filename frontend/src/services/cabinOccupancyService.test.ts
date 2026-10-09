import { describe, it, expect } from 'vitest';
import {
  deriveCabinOccupancy,
  deriveRouteTimeline,
} from './cabinOccupancyService';
import type { Vehicle, RideRequest } from '../types/simulation';

describe('cabinOccupancyService - TDD Seam Tests', () => {
  const sampleVehicle: Vehicle = {
    vehicle_id: 'V-101',
    name: 'Tata Tigor EV • Pune Pool #1',
    capacity: 4,
    occupied_seats: 1,
    current_location: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar' },
    status: 'en_route',
    heading_deg: 90,
    battery_pct: 82,
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
        location: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar' },
        passenger_name: 'Aarav Sharma',
        eta_seconds_from_now: 0,
        completed: true,
      },
      {
        stop_id: 'STOP-02',
        request_id: 'REQ-P102',
        stop_type: 'pickup',
        location: { lat: 18.5314, lng: 73.8446, name: 'Aundh Chowk' },
        passenger_name: 'Pooja Patil',
        eta_seconds_from_now: 360,
        completed: false,
      },
      {
        stop_id: 'STOP-03',
        request_id: 'REQ-P101',
        stop_type: 'dropoff',
        location: { lat: 18.5590, lng: 73.7868, name: 'Baner Hub' },
        passenger_name: 'Aarav Sharma',
        eta_seconds_from_now: 720,
        completed: false,
      },
      {
        stop_id: 'STOP-04',
        request_id: 'REQ-P102',
        stop_type: 'dropoff',
        location: { lat: 18.5913, lng: 73.7389, name: 'Hinjewadi' },
        passenger_name: 'Pooja Patil',
        eta_seconds_from_now: 1100,
        completed: false,
      },
    ],
  };

  const sampleRequests: Record<string, RideRequest> = {
    'REQ-P101': {
      request_id: 'REQ-P101',
      passenger_id: 'PAX-01',
      passenger_name: 'Aarav Sharma',
      pickup: { lat: 18.5204, lng: 73.8567, name: 'Shivajinagar' },
      dropoff: { lat: 18.5590, lng: 73.7868, name: 'Baner Hub' },
      party_size: 1,
      request_time: '17:40:00',
      solo_eta_sec: 720,
      solo_distance_km: 7.8,
      solo_fare_inr: 180.0,
      status: 'in_transit',
      assigned_vehicle_id: 'V-101',
      pooled_eta_sec: 780,
      detour_pct: 8.33,
      shapley_fare_inr: 132.5,
    },
    'REQ-P102': {
      request_id: 'REQ-P102',
      passenger_id: 'PAX-02',
      passenger_name: 'Pooja Patil',
      pickup: { lat: 18.5314, lng: 73.8446, name: 'Aundh Chowk' },
      dropoff: { lat: 18.5913, lng: 73.7389, name: 'Hinjewadi' },
      party_size: 1,
      request_time: '17:42:00',
      solo_eta_sec: 900,
      solo_distance_km: 10.2,
      solo_fare_inr: 220.0,
      status: 'en_route_pickup',
      assigned_vehicle_id: 'V-101',
      pooled_eta_sec: 980,
      detour_pct: 8.89,
      shapley_fare_inr: 165.0,
    },
  };

  it('correctly maps Driver + 4 Passenger seats distinguishing onboard, reserved, and available seats', () => {
    const layout = deriveCabinOccupancy(sampleVehicle, sampleRequests);

    // 1. Driver Seat Check
    expect(layout.driverSeat.isDriver).toBe(true);
    expect(layout.driverSeat.status).toBe('driver');
    expect(layout.driverSeat.seatLabel).toBe('Driver');

    // 2. Exactly 4 Passenger Seats in grid
    expect(layout.passengerSeats).toHaveLength(4);

    // Seat 1: Front Passenger -> should have onboard rider Aarav Sharma
    const onboardSeat = layout.passengerSeats.find((s) => s.status === 'onboard');
    expect(onboardSeat).toBeDefined();
    expect(onboardSeat?.passengerName).toBe('Aarav Sharma');
    expect(onboardSeat?.requestId).toBe('REQ-P101');
    expect(onboardSeat?.shapleyFareInr).toBe(132.5);

    // Seat 2: Reserved upcoming rider Pooja Patil
    const reservedSeat = layout.passengerSeats.find((s) => s.status === 'reserved');
    expect(reservedSeat).toBeDefined();
    expect(reservedSeat?.passengerName).toBe('Pooja Patil');
    expect(reservedSeat?.requestId).toBe('REQ-P102');
    expect(reservedSeat?.shapleyFareInr).toBe(165.0);

    // Available seats (2 seats left)
    const availableSeats = layout.passengerSeats.filter((s) => s.status === 'available');
    expect(availableSeats).toHaveLength(2);
    expect(layout.occupiedCount).toBe(1);
    expect(layout.reservedCount).toBe(1);
    expect(layout.availableCount).toBe(2);
    expect(layout.totalCapacity).toBe(4);
  });

  it('derives ordered stops timeline, marking completed, next up, and dynamic live occupancy', () => {
    const timeline = deriveRouteTimeline(sampleVehicle, sampleRequests);

    expect(timeline.stops).toHaveLength(4);
    expect(timeline.stops[0].completed).toBe(true);
    expect(timeline.stops[0].isNextUp).toBe(false);

    // STOP-02 is the first uncompleted stop, so it must be next up
    expect(timeline.stops[1].completed).toBe(false);
    expect(timeline.stops[1].isNextUp).toBe(true);
    expect(timeline.nextStop?.stop_id).toBe('STOP-02');

    // Dynamic occupancy check:
    // After STOP-01 (pickup Aarav): occupancy = 1
    // After STOP-02 (pickup Pooja): occupancy = 2
    // After STOP-03 (dropoff Aarav): occupancy = 1
    // After STOP-04 (dropoff Pooja): occupancy = 0
    expect(timeline.stops[0].dynamicOccupancy).toBe(1);
    expect(timeline.stops[1].dynamicOccupancy).toBe(2);
    expect(timeline.stops[2].dynamicOccupancy).toBe(1);
    expect(timeline.stops[3].dynamicOccupancy).toBe(0);

    // Route visual state: active vehicle with en_route stops is Confirmed
    expect(timeline.routeVisualState).toBe('confirmed');
  });

  it('marks route visual state as completed when all stops are done', () => {
    const completedVehicle: Vehicle = {
      ...sampleVehicle,
      planned_stops: sampleVehicle.planned_stops.map((s) => ({ ...s, completed: true })),
    };
    const timeline = deriveRouteTimeline(completedVehicle, sampleRequests);
    expect(timeline.routeVisualState).toBe('completed');
    expect(timeline.allCompleted).toBe(true);
  });

  it('releases seat when co-rider cancels (status becomes rejected)', () => {
    // Passenger C (REQ-P102) cancels -> status rejected and stops removed
    const cancelledRequests: Record<string, RideRequest> = {
      ...sampleRequests,
      'REQ-P102': {
        ...sampleRequests['REQ-P102'],
        status: 'rejected',
      },
    };
    const vehicleAfterCancel: Vehicle = {
      ...sampleVehicle,
      planned_stops: sampleVehicle.planned_stops.filter((s) => s.request_id !== 'REQ-P102'),
    };

    const layout = deriveCabinOccupancy(vehicleAfterCancel, cancelledRequests);

    // REQ-P102 should no longer hold a reserved seat
    const reservedSeat = layout.passengerSeats.find((s) => s.requestId === 'REQ-P102');
    expect(reservedSeat).toBeUndefined();

    // Available seats increase from 2 to 3
    expect(layout.occupiedCount).toBe(1);
    expect(layout.reservedCount).toBe(0);
    expect(layout.availableCount).toBe(3);
  });

  it('updates cabin occupancy on passenger drop-off without affecting completed fares', () => {
    // Both passengers dropped off
    const completedRequests: Record<string, RideRequest> = {
      ...sampleRequests,
      'REQ-P101': {
        ...sampleRequests['REQ-P101'],
        status: 'dropped_off',
      },
      'REQ-P102': {
        ...sampleRequests['REQ-P102'],
        status: 'dropped_off',
      },
    };
    const emptyVehicle: Vehicle = {
      ...sampleVehicle,
      occupied_seats: 0,
      planned_stops: sampleVehicle.planned_stops.map((s) => ({ ...s, completed: true })),
    };

    const layout = deriveCabinOccupancy(emptyVehicle, completedRequests);

    // All 4 passenger seats are now available
    expect(layout.occupiedCount).toBe(0);
    expect(layout.reservedCount).toBe(0);
    expect(layout.availableCount).toBe(4);

    // Completed fares remain intact
    expect(completedRequests['REQ-P101'].shapley_fare_inr).toBe(132.5);
    expect(completedRequests['REQ-P102'].shapley_fare_inr).toBe(165.0);
  });
});
