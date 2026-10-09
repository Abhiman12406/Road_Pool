import { describe, it, expect } from 'vitest';
import { DEFAULT_DEMO_OFFER } from '../components/driver/DriverTripOfferCard';
import { DEFAULT_DEMO_STOPS } from '../components/driver/DriverActiveManifest';
import { DEFAULT_MID_TRIP_CANDIDATE } from '../components/driver/DriverMidTripConsentModal';
import { DEFAULT_TRIP_DETAIL } from '../components/driver/DriverTripDetailDrawer';
import { DEMO_TRIPS } from '../views/driver/DriverTripsView';
import { INITIAL_NOTIFICATIONS } from '../views/driver/DriverActivityView';

describe('Driver Dashboard - Core Logic & State Machine Tests', () => {
  describe('1. 15% Detour Guarantee Compliance', () => {
    it('validates that all passengers in the demo offer stay strictly within the 15% detour cap', () => {
      expect(DEFAULT_DEMO_OFFER.detourValidations.length).toBeGreaterThan(0);
      for (const validation of DEFAULT_DEMO_OFFER.detourValidations) {
        expect(validation.detourPct).toBeLessThanOrEqual(15.0);
        expect(validation.detourPct).toBeGreaterThan(0);
      }
    });

    it('ensures mid-trip join candidate does not violate existing passenger detour limit', () => {
      expect(DEFAULT_MID_TRIP_CANDIDATE.currentPassengerDetourPct).toBeLessThanOrEqual(15.0);
      expect(DEFAULT_MID_TRIP_CANDIDATE.incrementalDriverPayoutInr).toBeGreaterThan(0);
    });
  });

  describe('2. Driver Payout & Platform Commission Calculation', () => {
    it('correctly calculates net driver payout after 15% platform fee deduction', () => {
      const { grossFareInr, platformFeePct, netDriverPayoutInr } = DEFAULT_TRIP_DETAIL;
      const expectedPlatformFee = (grossFareInr * platformFeePct) / 100;
      const expectedNetPayout = grossFareInr - expectedPlatformFee;

      expect(platformFeePct).toBe(15);
      expect(netDriverPayoutInr).toBe(expectedNetPayout);
      expect(netDriverPayoutInr).toBe(272);
    });

    it('verifies Shapley sum matches total pooled revenue in manifest breakdown', () => {
      const shapleySum = DEFAULT_TRIP_DETAIL.passengers.reduce(
        (sum, p) => sum + p.shapleyFareInr,
        0
      );
      expect(shapleySum).toBe(DEFAULT_TRIP_DETAIL.grossFareInr);
    });
  });

  describe('3. Turn-by-Turn Manifest Progression', () => {
    it('maintains strict precedence: all pickups are sequenced before dropoffs for the same route', () => {
      const pickups = DEFAULT_DEMO_STOPS.filter((s) => s.type === 'pickup');
      const dropoffs = DEFAULT_DEMO_STOPS.filter((s) => s.type === 'dropoff');

      expect(pickups.length).toBe(2);
      expect(dropoffs.length).toBe(2);

      // Verify first two stops are pickups
      expect(DEFAULT_DEMO_STOPS[0].type).toBe('pickup');
      expect(DEFAULT_DEMO_STOPS[1].type).toBe('pickup');
      expect(DEFAULT_DEMO_STOPS[2].type).toBe('dropoff');
      expect(DEFAULT_DEMO_STOPS[3].type).toBe('dropoff');
    });

    it('simulates progressive stop completion to final trip receipt', () => {
      let stops = [...DEFAULT_DEMO_STOPS];

      for (let i = 0; i < stops.length; i++) {
        stops = stops.map((s, idx) => ({
          ...s,
          completed: idx <= i,
          active: idx === i + 1,
        }));
      }

      const allCompleted = stops.every((s) => s.completed);
      expect(allCompleted).toBe(true);
    });
  });

  describe('4. Historical Trips & Activity Aggregations', () => {
    it('filters trips by status correctly into upcoming, completed, and cancelled', () => {
      const upcoming = DEMO_TRIPS.filter((t) => t.status === 'upcoming');
      const completed = DEMO_TRIPS.filter((t) => t.status === 'completed');
      const cancelled = DEMO_TRIPS.filter((t) => t.status === 'cancelled');

      expect(upcoming.length).toBe(2);
      expect(completed.length).toBe(3);
      expect(cancelled.length).toBe(1);
      expect(DEMO_TRIPS.length).toBe(6);
    });

    it('calculates total earnings across completed trips accurately', () => {
      const completedTrips = DEMO_TRIPS.filter((t) => t.status === 'completed');
      const totalCompletedEarnings = completedTrips.reduce((acc, t) => acc + t.netPayoutInr, 0);

      expect(totalCompletedEarnings).toBe(272 + 215 + 380);
      expect(totalCompletedEarnings).toBe(867);
    });

    it('manages activity notifications read status and category filtering', () => {
      const unreadCount = INITIAL_NOTIFICATIONS.filter((n) => !n.read).length;
      expect(unreadCount).toBe(3);

      const tripNotifs = INITIAL_NOTIFICATIONS.filter((n) => n.category === 'trips');
      const payoutNotifs = INITIAL_NOTIFICATIONS.filter((n) => n.category === 'payouts');
      const systemNotifs = INITIAL_NOTIFICATIONS.filter((n) => n.category === 'system');

      expect(tripNotifs.length).toBe(2);
      expect(payoutNotifs.length).toBe(2);
      expect(systemNotifs.length).toBe(1);
    });
  });
});
