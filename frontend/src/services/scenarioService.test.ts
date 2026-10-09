import { describe, it, expect } from 'vitest';
import {
  ACCEPTANCE_SCENARIOS,
  GUIDED_STORY_STEPS,
  buildDeterministicScenarioSnapshot,
  buildCompatibleJoinCandidate,
  buildIncompatibleJoinCandidate,
} from './scenarioService';

describe('scenarioService', () => {
  it('defines all 12 hackathon acceptance test scenarios per Section 11', () => {
    expect(ACCEPTANCE_SCENARIOS).toHaveLength(12);
    ACCEPTANCE_SCENARIOS.forEach((scenario, index) => {
      expect(scenario.id).toBe(index + 1);
      expect(scenario.title).toBeTruthy();
      expect(scenario.description).toBeTruthy();
      expect(scenario.targetView).toBeTruthy();
      expect(scenario.expectedBadge).toBeTruthy();
    });
  });

  it('defines all 10 steps of the Guided Story Mode wizard per Section 12', () => {
    expect(GUIDED_STORY_STEPS).toHaveLength(10);
    GUIDED_STORY_STEPS.forEach((step, index) => {
      expect(step.step).toBe(index + 1);
      expect(step.stage).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.summary).toBeTruthy();
      expect(step.proofPoints.length).toBeGreaterThan(0);
      expect(step.actionLabel).toBeTruthy();
      expect(step.targetView).toBeTruthy();
    });
  });

  describe('buildDeterministicScenarioSnapshot for all 12 scenarios', () => {
    it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])(
      'builds valid snapshot for Scenario %i',
      (scenarioId) => {
        const snap = buildDeterministicScenarioSnapshot(scenarioId);
        expect(snap).toBeDefined();
        expect(snap.kpis).toBeDefined();
        expect(snap.vehicles).toBeDefined();
        expect(snap.requests).toBeDefined();
        expect(snap.engine).toBeDefined();
        expect(Object.keys(snap.vehicles).length).toBeGreaterThan(0);
      }
    );

    it('Scenario 1: reserves 3 seats for a party of 3', () => {
      const snap = buildDeterministicScenarioSnapshot(1);
      expect(snap.requests['REQ-P101'].party_size).toBe(3);
      expect(snap.vehicles['V-101'].occupied_seats).toBe(3);
      expect(snap.vehicles['V-101'].capacity).toBe(4);
    });

    it('Scenario 2: creates rolling batch window with active countdown', () => {
      const snap = buildDeterministicScenarioSnapshot(2);
      expect(snap.engine.currentWindowId).toBe(102);
      expect(snap.engine.timeRemainingInWindowSec).toBe(18);
      expect(snap.engine.batchStatus).toBe('locked_optimizing');
    });

    it('Scenario 4 & 5: verifies Shapley fair fares matrix and savings', () => {
      const snap = buildDeterministicScenarioSnapshot(4);
      const r1 = snap.requests['REQ-P101'];
      expect(r1.shapley_fare_inr).toBeLessThan(r1.solo_fare_inr);
      expect(snap.kpis.shapleySavingsPct).toBeGreaterThan(0);

      const snap5 = buildDeterministicScenarioSnapshot(5);
      const pool = snap5.shapleyPools!['V-101'];
      expect(pool).toBeDefined();
      expect(pool.coalition_matrix).toHaveLength(7);
      expect(pool.efficiency_guaranteed).toBe(true);
      expect(pool.individual_rationality_guaranteed).toBe(true);
    });

    it('Scenario 6: reflects co-rider cancellation and seat release', () => {
      const snap = buildDeterministicScenarioSnapshot(6);
      expect(snap.requests['REQ-P103'].status).toBe('rejected');
      expect(snap.vehicles['V-101'].occupied_seats).toBe(1);
    });

    it('Scenario 7: reflects completed trip and receipt', () => {
      const snap = buildDeterministicScenarioSnapshot(7);
      expect(snap.vehicles['V-101'].status).toBe('idle');
      expect(snap.requests['REQ-P101'].status).toBe('dropped_off');
      expect(snap.activePassengerSession?.lifecycleStatus).toBe('dropped_off');
    });

    it('Scenario 10: reflects vehicle capacity full condition (4/4)', () => {
      const snap = buildDeterministicScenarioSnapshot(10);
      expect(snap.vehicles['V-101'].capacity).toBe(4);
      expect(snap.vehicles['V-101'].occupied_seats).toBe(4);
      expect(snap.requests['REQ-P104']).toBeDefined();
    });

    it('Scenario 11: reflects detour cap violated (>15%)', () => {
      const snap = buildDeterministicScenarioSnapshot(11);
      expect(snap.requests['REQ-P999']).toBeDefined();
      expect(snap.requests['REQ-P999'].status).toBe('rejected');
      expect(snap.requests['REQ-P999'].detour_pct).toBeGreaterThan(15);
      expect(snap.detourAudits![1].is_compliant).toBe(false);
      expect(snap.detourAudits![1].actual_detour_pct).toBeGreaterThan(15);
    });

    it('Scenario 12: guarantees Shapley penny reconciliation with ₹0 discrepancy', () => {
      const snap = buildDeterministicScenarioSnapshot(12);
      const pool = snap.shapleyPools!['V-101'];
      const r1 = snap.requests['REQ-P101']!;
      const r2 = snap.requests['REQ-P102']!;
      const r3 = snap.requests['REQ-P103']!;
      const sumFares =
        (r1.shapley_fare_inr || 0) +
        (r2.shapley_fare_inr || 0) +
        (r3.shapley_fare_inr || 0);

      const target = pool.reconciliation_target_inr;
      const discrepancy = Math.abs(sumFares - target);

      expect(discrepancy).toBeLessThanOrEqual(0.01);
      expect(pool.penny_discrepancy_inr).toBe(0.0);
      expect(pool.reconciled_sum_inr).toBe(target);
    });
  });

  describe('Mid-trip join candidate builders', () => {
    it('buildCompatibleJoinCandidate produces compliant candidate (detour <= 15%)', () => {
      const candidate = buildCompatibleJoinCandidate();
      expect(candidate.is_valid).toBe(true);
      expect(candidate.detour_pct).toBeLessThanOrEqual(15);
      expect(candidate.rejection_reason).toBeNull();
      expect(candidate.proposed_fare_inr).toBeGreaterThan(0);
      expect(candidate.affected_passenger_fare_before - candidate.affected_passenger_fare_after).toBeGreaterThan(0);
    });

    it('buildIncompatibleJoinCandidate produces non-compliant candidate (detour > 15%)', () => {
      const candidate = buildIncompatibleJoinCandidate();
      expect(candidate.is_valid).toBe(false);
      expect(candidate.detour_pct).toBeGreaterThan(15);
      expect(candidate.rejection_reason).toContain('exceeds');
    });
  });
});
