import type {
  GlobalSimulationSnapshot,
  Vehicle,
  RideRequest,
  AcceptanceScenarioDefinition,
  MidTripJoinCandidate,
} from '../types/simulation';
import type { ShapleyPoolResult } from '../types/shapley';

export const ACCEPTANCE_SCENARIOS: AcceptanceScenarioDefinition[] = [
  {
    id: 1,
    title: 'Booking for 3 people reserves 3 seats',
    shortTitle: '1. 3-Seat Party Booking',
    category: 'booking',
    specSection: 'Section 11.1 & Section 2/4',
    description:
      'A passenger books a ride for three people. The system reserves three seats in the 4-seat vehicle, leaving exactly 1 seat available for co-riders.',
    criteria: [
      'Party size set to 3 passengers',
      'Vehicle occupied seats shows 3/4',
      'Cabin layout visually highlights 3 seats reserved for the party',
      'Exactly 1 seat remains free for other ride requests',
    ],
    expectedBadge: 'PASSED: 3 seats reserved for 3-passenger group (Occupancy: 3/4, 1 available).',
    targetView: 'passenger-active',
  },
  {
    id: 2,
    title: '3 compatible requests matched after buffer window',
    shortTitle: '2. 3-Rider Corridor Match',
    category: 'matching',
    specSection: 'Section 11.2 & Section 3',
    description:
      'Three compatible requests along the Pune West corridor (Shivajinagar -> Hinjewadi) are batched during the rolling window and matched after buffer expiration.',
    criteria: [
      '3 passenger requests collected during rolling window',
      'Buffer countdown expires and triggers OR-Tools optimizer',
      'All 3 riders assigned to shared vehicle with interleaved pickup/dropoff stops',
      'Route status marked as matched / en_route',
    ],
    expectedBadge: 'PASSED: 3 compatible corridor requests pooled into shared vehicle after buffer dispatch.',
    targetView: 'ops-batches',
  },
  {
    id: 3,
    title: 'Candidate group rejected because passenger experiences 18% detour',
    shortTitle: '3. 18% Detour Rejection',
    category: 'routing',
    specSection: 'Section 11.3 & Section 5/8/11',
    description:
      'A candidate group insertion causes a passenger to experience an 18.2% detour, violating the strict <=15.0% cap. The routing engine rejects the candidate with an auditable proof.',
    criteria: [
      'Candidate request evaluated against active route',
      'Calculated detour = +18.2% (exceeds 15.0% hard cap)',
      'Candidate marked as violation_rejected',
      'Auditable mathematical proof generated and logged in Detour Guarantees',
    ],
    expectedBadge: 'PASSED: Candidate rejected: +18.2% detour exceeds strict 15.0% guarantee cap.',
    targetView: 'ops-detour-guarantees',
  },
  {
    id: 4,
    title: 'Compares solo cost, shared cost, and individual Shapley fares',
    shortTitle: '4. Solo vs Shared vs Shapley',
    category: 'shapley',
    specSection: 'Section 11.4 & Section 5',
    description:
      'Clear side-by-side comparison showing direct solo fare, shared total trip cost for the grand coalition, and each passenger’s individual Shapley fair-fare share.',
    criteria: [
      'Solo baseline fare displayed (₹337.00)',
      'Total shared vehicle trip cost displayed (₹660.00)',
      'Individual Shapley fare computed (₹245.50)',
      'Explicit savings percentage displayed (~27.2% savings vs solo)',
    ],
    expectedBadge: 'PASSED: Solo ₹337.00 vs Shared Pool ₹660.00 -> Shapley Fare ₹245.50 (27.2% savings).',
    targetView: 'ops-fair-fares',
  },
  {
    id: 5,
    title: '"Why am I paying this fare?" explanation open and validated',
    shortTitle: '5. Shapley Cost Reasoning',
    category: 'shapley',
    specSection: 'Section 11.5 & Section 6',
    description:
      'Opens the "Why am I paying this fare?" explanation sheet, showing all 7 coalition costs, marginal contribution steps, and plain-English game theory justification.',
    criteria: [
      'Shapley Slide-Over Sheet opened with full data',
      'All 7 non-empty coalition costs c(S) displayed in combinatorial matrix',
      'Marginal contributions weighted by |S|!(|N|-|S|-1)!/|N|! tree shown',
      'Plain-English rationale: "The system compares the cost of different passenger combinations..."',
    ],
    expectedBadge: 'PASSED: Shapley explanation sheet opened with 7-coalition breakdown and axiomatic fairness audit.',
    targetView: 'passenger-active',
  },
  {
    id: 6,
    title: 'Passenger cancellation updates seat, route, and remaining fares',
    shortTitle: '6. Co-Rider Cancellation',
    category: 'cancellation',
    specSection: 'Section 11.6 & Section 7',
    description:
      'When Passenger C cancels before departure or mid-trip, their seat in the 4-seat cabin grid is freed, the route is re-optimized, and remaining passengers’ Shapley fares automatically update.',
    criteria: [
      'Passenger C removed from vehicle planned stops',
      'Reserved cabin seat released from occupied to available',
      'Route polyline updated without Passenger C stops',
      'Remaining passengers Shapley fares recomputed with visible explanatory toast',
    ],
    expectedBadge: 'PASSED: Passenger C cancelled; seat released, route updated, remaining fares re-balanced.',
    targetView: 'passenger-active',
  },
  {
    id: 7,
    title: 'Drop-off during active trip frees seat and accepts new compatible request',
    shortTitle: '7. Drop-off Frees Seat',
    category: 'routing',
    specSection: 'Section 11.7 & Section 4/7',
    description:
      'During an active trip, completing a passenger drop-off decrements vehicle cabin occupancy and immediately accommodates a new compatible waiting commuter.',
    criteria: [
      'Vehicle arrives at drop-off stop and marks it completed',
      'Cabin occupancy drops from 3 to 2 occupied seats',
      'Pending compatible commuter evaluated and admitted into freed seat',
      'Completed passenger fare remains locked without retroactive alteration',
    ],
    expectedBadge: 'PASSED: Active drop-off freed cabin seat; new compatible commuter admitted into released seat.',
    targetView: 'passenger-active',
  },
  {
    id: 8,
    title: 'Mid-trip joiner triggers driver and passenger consent notifications',
    shortTitle: '8. Mid-Trip Consent Flow',
    category: 'mid-trip',
    specSection: 'Section 11.8 & Section 8',
    description:
      'A new commuter requests to join an en-route vehicle. The system verifies capacity and detour cap, then displays dual in-context consent notifications for Driver and Passenger.',
    criteria: [
      'New compatible request arrives while vehicle is traveling',
      'Detour verified compliant (+6.7% <= 15.0%)',
      'Driver Card displays pickup/dropoff, +1.8km, +4m, proposed fare, Accept/Reject buttons',
      'Passenger Card displays new co-rider details, revised ETA, fare reduction (-₹51.00), Accept/Decline buttons',
    ],
    expectedBadge: 'PASSED: Mid-trip joiner triggered dual Driver and Passenger in-context consent notifications.',
    targetView: 'passenger-active',
  },
  {
    id: 9,
    title: 'Driver rejection keeps existing ride unchanged',
    shortTitle: '9. Driver Rejection',
    category: 'mid-trip',
    specSection: 'Section 11.9 & Section 8',
    description:
      'Driver rejects the proposed mid-trip join request. The candidate insertion is aborted, and the vehicle route, timetable, and passenger fares remain completely unchanged.',
    criteria: [
      'Driver clicks Reject Request',
      'Proposed mid-trip insertion discarded',
      'Existing vehicle planned stops, polyline, and cabin occupancy preserved',
      'Existing passenger fare and agreed arrival time remain unchanged',
    ],
    expectedBadge: 'PASSED: Driver rejected request; existing planned route and passenger fares kept unchanged.',
    targetView: 'passenger-active',
  },
  {
    id: 10,
    title: 'Passenger decline prevents route insertion',
    shortTitle: '10. Passenger Decline',
    category: 'mid-trip',
    specSection: 'Section 11.10 & Section 8',
    description:
      'An existing passenger declines the fare/route update. The proposed insertion is aborted, preventing any unwanted delay to the passenger.',
    criteria: [
      'Passenger clicks Decline Updated Plan',
      'Candidate insertion blocked from vehicle schedule',
      'Existing passenger agreed arrival ETA and original fare remain strictly locked',
      'Candidate commuter redirected to alternative vehicle option',
    ],
    expectedBadge: 'PASSED: Existing passenger declined; candidate insertion aborted and agreed plan retained.',
    targetView: 'passenger-active',
  },
  {
    id: 11,
    title: 'Detour >15% or deadline violation rejected with explanation',
    shortTitle: '11. Detour Cap Guardrail',
    category: 'routing',
    specSection: 'Section 11.11 & Section 5/8',
    description:
      'A mid-trip or batch request causing an excessive detour (>15.0%) or deadline violation is mathematically rejected before any consent workflow is initiated.',
    criteria: [
      'Candidate request with +18.4% detour evaluated',
      'Routing validator rejects candidate prior to driver/passenger consent',
      'Explicit rejection badge: "Detour 18.4% exceeds strict 15.0% cap"',
      'Mathematical proof displays solo vs pooled duration and negative delay margin',
    ],
    expectedBadge: 'PASSED: Candidate with >15% detour rejected prior to consent with explicit mathematical proof.',
    targetView: 'passenger-active',
  },
  {
    id: 12,
    title: 'Displayed Shapley fares sum exactly to allocated total cost after rounding',
    shortTitle: '12. Penny Reconciliation',
    category: 'shapley',
    specSection: 'Section 11.12 & Section 6',
    description:
      'Verifies the Penny-Reconciliation axiom of the Shapley engine: individual displayed fares sum exactly to the grand coalition total trip cost with ₹0.00 discrepancy.',
    criteria: [
      '3-passenger coalition total cost evaluated (c(N) = ₹660.00)',
      'Individual fares computed and rounded to 2 decimal places',
      'Penny adjustment applied to largest contributor if rounding residual exists',
      'Sum(reconciled_fares) == c(N) verified within ₹0.01 (Discrepancy: ₹0.00)',
    ],
    expectedBadge: 'PASSED: Displayed Shapley fares sum exactly to allocated total cost (Discrepancy: ₹0.00).',
    targetView: 'ops-fair-fares',
  },
];

export interface GuidedStoryStep {
  step: number;
  totalSteps: number;
  title: string;
  stage: string;
  specClause: string;
  targetView:
    | 'passenger-home'
    | 'passenger-waiting'
    | 'passenger-active'
    | 'ops-overview'
    | 'ops-batches'
    | 'ops-optimization'
    | 'ops-detour-guarantees'
    | 'ops-fair-fares';
  actionLabel: string;
  summary: string;
  proofPoints: string[];
}

export const GUIDED_STORY_STEPS: GuidedStoryStep[] = [
  {
    step: 1,
    totalSteps: 10,
    title: '1. Book Ride & Select 3 Passengers',
    stage: 'Booking Phase',
    specClause: 'Section 2 & Section 11.1',
    targetView: 'passenger-home',
    actionLabel: 'Load 3-Passenger Booking',
    summary:
      'Elena Vance books a commute for 3 passengers from Shivajinagar to Hinjewadi. System calculates solo direct baseline and reserves 3 seats.',
    proofPoints: [
      'Party size selector sets count to 3',
      'Solo direct estimate: ₹337.00, 14.0 km, 18 mins',
      'Seat requirement indicates 3 seats required',
    ],
  },
  {
    step: 2,
    totalSteps: 10,
    title: '2. Rolling Buffer Window & Intake Queue',
    stage: 'Batching Phase',
    specClause: 'Section 3 & Section 11.2',
    targetView: 'passenger-waiting',
    actionLabel: 'Enter Matching Buffer Window',
    summary:
      'Request enters the 30-45s rolling batch window. Dynamic intake collects compatible commuters along the Pune urban corridor.',
    proofPoints: [
      'Live rolling countdown timer visible',
      'Privacy-safe candidate identifiers (Aarav, Pooja, Rohan)',
      'Status: Finding compatible passengers',
    ],
  },
  {
    step: 3,
    totalSteps: 10,
    title: '3. Smart Matching & Detour Filtering',
    stage: 'Optimization Phase',
    specClause: 'Section 4, 5 & Section 11.2',
    targetView: 'ops-optimization',
    actionLabel: 'Run OR-Tools Solver & Match',
    summary:
      'Window locks and dispatches into Google OR-Tools PDP routing. Verifies capacity and enforces the <=15% detour guarantee before confirmation.',
    proofPoints: [
      'OR-Tools optimizes multi-stop pickup and dropoff sequence',
      'Fleet average detour compliant at +8.4% (well below 15% cap)',
      'Vehicles and candidate requests assigned',
    ],
  },
  {
    step: 4,
    totalSteps: 10,
    title: '4. Combinatorial Shapley Fair-Fare Engine',
    stage: 'Fair-Fares Phase',
    specClause: 'Section 6 & Section 11.4/12',
    targetView: 'ops-fair-fares',
    actionLabel: 'View Shapley Cost Matrix',
    summary:
      'Computes the 7-coalition game-theoretic cost matrix and marginal contributions. Fares save ~27% compared to solo baselines and penny-reconcile exactly.',
    proofPoints: [
      '2^3 - 1 = 7 non-empty coalition costs evaluated',
      'Penny reconciliation sums exactly to total trip cost (Diff: ₹0.00)',
      'Individual rationality guaranteed: phi_i <= solo fare for all',
    ],
  },
  {
    step: 5,
    totalSteps: 10,
    title: '5. Active Trip Dashboard & 4-Seat Cabin Layout',
    stage: 'Active Trip Phase',
    specClause: 'Section 4, 8 & Section 11.1',
    targetView: 'passenger-active',
    actionLabel: 'Board Vehicle & View Cabin',
    summary:
      'Rider is onboard Tata Tigor EV (V-101). Cabin grid shows occupied vs reserved seats, telematics map shows route polyline, and timeline shows stops.',
    proofPoints: [
      'Visual 4-seat cabin grid displays live occupancy (3/4)',
      'Interactive map renders vehicle position and color-coded stops',
      'Stops timeline with advance stop action and ETAs',
    ],
  },
  {
    step: 6,
    totalSteps: 10,
    title: '6. Dynamic Mid-Trip Join Injection',
    stage: 'Mid-Trip Injection',
    specClause: 'Section 8 & Section 11.8',
    targetView: 'passenger-active',
    actionLabel: 'Inject Compatible Joiner (Vikram Sen)',
    summary:
      'While vehicle is en route, Vikram Sen requests to join. Routing engine evaluates route change: +1.8 km, +4 mins (+6.7% detour <= 15% cap).',
    proofPoints: [
      'Mid-trip joiner request received for active vehicle',
      'Routing engine checks capacity (1 seat available) and detour (+6.7%)',
      'Prepares dual consent proposal without committing route',
    ],
  },
  {
    step: 7,
    totalSteps: 10,
    title: '7. Dual In-Context Consent Workflow',
    stage: 'Two-Way Consent',
    specClause: 'Section 8 & Section 11.8/9/10',
    targetView: 'passenger-active',
    actionLabel: 'Trigger Two-Way Consent Cards',
    summary:
      'Presents dual consent cards: Driver Card (Accept/Reject) and Existing Passenger Card (Accept/Decline). Only dual approval commits the route insertion.',
    proofPoints: [
      'Driver Card displays route change and fare compensation',
      'Passenger Card displays revised ETA (+3m) and fare savings (-₹51.00)',
      'Interactive buttons to test Accept or Reject decisions',
    ],
  },
  {
    step: 8,
    totalSteps: 10,
    title: '8. Hard 15% Detour Rejection Guardrail',
    stage: 'Constraint Safety',
    specClause: 'Section 8 & Section 11.3/11',
    targetView: 'passenger-active',
    actionLabel: 'Simulate Incompatible Joiner (>15% Detour)',
    summary:
      'Tests an incompatible request (18.4% detour). System immediately rejects the request with an auditable mathematical proof before consent is initiated.',
    proofPoints: [
      'Detour calculated = +18.4% > 15.0% maximum cap',
      'Rejection card displays exact mathematical proof string',
      'Consent workflow blocked to protect passenger comfort',
    ],
  },
  {
    step: 9,
    totalSteps: 10,
    title: '9. Co-Rider Cancellation & Seat Release',
    stage: 'Cancellation Phase',
    specClause: 'Section 7 & Section 11.6',
    targetView: 'passenger-active',
    actionLabel: 'Simulate Co-Rider Cancellation (Passenger C)',
    summary:
      'Passenger C cancels mid-trip. Vehicle planned stops update, cabin seat is released, route re-optimizes, and Shapley fares re-balance for remaining riders.',
    proofPoints: [
      'Passenger C stops removed from vehicle schedule',
      'Cabin layout updates to release the reserved seat',
      'Remaining passengers fares update with explanatory toast',
    ],
  },
  {
    step: 10,
    totalSteps: 10,
    title: '10. Trip Completion Receipt & Fare Audit',
    stage: 'Receipt Phase',
    specClause: 'Section 10 & Section 12',
    targetView: 'passenger-active',
    actionLabel: 'Complete Trip & View Receipt',
    summary:
      'Vehicle reaches final drop-off at Hinjewadi IT Park. Renders the official Trip Completion Receipt with Shapley fare paid, carbon savings, and audit breakdown.',
    proofPoints: [
      'Official Trip Completion Receipt modal rendered',
      'Final Shapley fare paid (₹245.50) with ₹91.50 savings',
      'Carbon offset (2.1 kg CO2 saved) and duration comparison',
      'Book Another Ride action cleanly resets session',
    ],
  },
];

/**
 * Builds a deterministic simulation snapshot for a given scenario ID.
 */
export function buildDeterministicScenarioSnapshot(scenarioId: number): GlobalSimulationSnapshot {
  const locShivaji = { lat: 18.5314, lng: 73.8446, name: 'Shivajinagar Hub' };
  const locDeccan = { lat: 18.5167, lng: 73.8415, name: 'Deccan Gymkhana' };
  const locAundh = { lat: 18.5580, lng: 73.8075, name: 'Aundh Parihar Chowk' };
  const locBaner = { lat: 18.5590, lng: 73.7868, name: 'Baner Road' };
  const locHinjewadi = { lat: 18.5913, lng: 73.7389, name: 'Hinjewadi IT Park Phase 1' };
  const locKothrud = { lat: 18.5074, lng: 73.8077, name: 'Kothrud Stand' };

  const v1: Vehicle = {
    vehicle_id: 'V-101',
    name: 'Tata Tigor EV • Pune Pool #1',
    capacity: 4,
    occupied_seats: scenarioId === 1 ? 3 : (scenarioId === 10 ? 4 : (scenarioId === 6 ? 1 : 2)),
    current_location: locShivaji,
    status: scenarioId === 7 ? 'idle' : 'en_route',
    heading_deg: 95,
    battery_pct: 88,
    route_polyline: [
      [locShivaji.lat, locShivaji.lng],
      [locDeccan.lat, locDeccan.lng],
      [locAundh.lat, locAundh.lng],
      [locBaner.lat, locBaner.lng],
      [locHinjewadi.lat, locHinjewadi.lng],
    ],
    planned_stops: [
      {
        stop_id: 'STOP-01',
        request_id: 'REQ-P101',
        stop_type: 'pickup',
        location: locShivaji,
        passenger_name: 'Elena Vance (Rider)',
        eta_seconds_from_now: 0,
        completed: true,
      },
      {
        stop_id: 'STOP-02',
        request_id: 'REQ-P102',
        stop_type: 'pickup',
        location: locDeccan,
        passenger_name: 'Pooja Patil',
        eta_seconds_from_now: 180,
        completed: false,
      },
      {
        stop_id: 'STOP-03',
        request_id: 'REQ-P101',
        stop_type: 'dropoff',
        location: locAundh,
        passenger_name: 'Elena Vance (Rider)',
        eta_seconds_from_now: 540,
        completed: false,
      },
      {
        stop_id: 'STOP-04',
        request_id: 'REQ-P102',
        stop_type: 'dropoff',
        location: locHinjewadi,
        passenger_name: 'Pooja Patil',
        eta_seconds_from_now: 960,
        completed: false,
      },
    ],
  };

  const req1: RideRequest = {
    request_id: 'REQ-P101',
    passenger_id: 'PAX-01',
    passenger_name: scenarioId === 1 ? 'Elena Vance & Family (3 Pax)' : 'Elena Vance (Rider)',
    pickup: locShivaji,
    dropoff: locHinjewadi,
    party_size: scenarioId === 1 ? 3 : 1,
    request_time: '17:40:00',
    solo_eta_sec: 1100,
    solo_distance_km: 14.0,
    solo_fare_inr: 337.0,
    status: scenarioId === 7 ? 'dropped_off' : 'matched',
    assigned_vehicle_id: 'V-101',
    batch_id: 101,
    pooled_eta_sec: 1192,
    detour_pct: 8.36,
    shapley_fare_inr: 245.5,
  };

  const req2: RideRequest = {
    request_id: 'REQ-P102',
    passenger_id: 'PAX-02',
    passenger_name: 'Pooja Patil',
    pickup: locDeccan,
    dropoff: locHinjewadi,
    party_size: 1,
    request_time: '17:41:00',
    solo_eta_sec: 1200,
    solo_distance_km: 15.5,
    solo_fare_inr: 369.0,
    status: 'matched',
    assigned_vehicle_id: 'V-101',
    batch_id: 101,
    pooled_eta_sec: 1296,
    detour_pct: 8.0,
    shapley_fare_inr: 268.3,
  };

  const req3: RideRequest = {
    request_id: 'REQ-P103',
    passenger_id: 'PAX-03',
    passenger_name: 'Rohan Joshi',
    pickup: locAundh,
    dropoff: locHinjewadi,
    party_size: 1,
    request_time: '17:42:00',
    solo_eta_sec: 800,
    solo_distance_km: 9.8,
    solo_fare_inr: 249.0,
    status: scenarioId === 6 ? 'rejected' : 'matched',
    assigned_vehicle_id: 'V-101',
    batch_id: 101,
    pooled_eta_sec: 864,
    detour_pct: 8.0,
    shapley_fare_inr: 146.2,
  };

  const shapleyPool: ShapleyPoolResult = {
    pool_id: 'POOL-V101-101',
    vehicle_id: 'V-101',
    vehicle_name: 'Tata Tigor EV',
    batch_id: 101,
    request_ids: ['REQ-P101', 'REQ-P102', 'REQ-P103'],
    player_letters: { 'REQ-P101': 'A', 'REQ-P102': 'B', 'REQ-P103': 'C' },
    grand_coalition_cost_inr: 660.0,
    grand_coalition_distance_km: 22.4,
    grand_coalition_duration_sec: 1680,
    sum_solo_fares_inr: 955.0,
    total_pool_savings_inr: 295.0,
    total_pool_savings_pct: 30.89,
    coalition_matrix: [
      {
        coalition_key: 'A',
        member_ids: ['REQ-P101'],
        member_names: ['Elena Vance (Rider)'],
        label: '{Elena}',
        size: 1,
        distance_km: 14.0,
        duration_sec: 1100,
        duration_min: 18.3,
        cost_inr: 337.0,
        stop_order: ['STOP-01', 'STOP-03'],
        is_grand_coalition: false,
      },
      {
        coalition_key: 'B',
        member_ids: ['REQ-P102'],
        member_names: ['Pooja Patil'],
        label: '{Pooja}',
        size: 1,
        distance_km: 15.5,
        duration_sec: 1200,
        duration_min: 20.0,
        cost_inr: 369.0,
        stop_order: ['STOP-02', 'STOP-04'],
        is_grand_coalition: false,
      },
      {
        coalition_key: 'C',
        member_ids: ['REQ-P103'],
        member_names: ['Rohan Joshi'],
        label: '{Rohan}',
        size: 1,
        distance_km: 9.8,
        duration_sec: 800,
        duration_min: 13.3,
        cost_inr: 249.0,
        stop_order: ['STOP-03', 'STOP-04'],
        is_grand_coalition: false,
      },
      {
        coalition_key: 'AB',
        member_ids: ['REQ-P101', 'REQ-P102'],
        member_names: ['Elena Vance', 'Pooja Patil'],
        label: '{Elena, Pooja}',
        size: 2,
        distance_km: 17.8,
        duration_sec: 1380,
        duration_min: 23.0,
        cost_inr: 498.0,
        stop_order: ['STOP-01', 'STOP-02', 'STOP-03', 'STOP-04'],
        is_grand_coalition: false,
      },
      {
        coalition_key: 'AC',
        member_ids: ['REQ-P101', 'REQ-P103'],
        member_names: ['Elena Vance', 'Rohan Joshi'],
        label: '{Elena, Rohan}',
        size: 2,
        distance_km: 16.2,
        duration_sec: 1260,
        duration_min: 21.0,
        cost_inr: 458.0,
        stop_order: ['STOP-01', 'STOP-03', 'STOP-04'],
        is_grand_coalition: false,
      },
      {
        coalition_key: 'BC',
        member_ids: ['REQ-P102', 'REQ-P103'],
        member_names: ['Pooja Patil', 'Rohan Joshi'],
        label: '{Pooja, Rohan}',
        size: 2,
        distance_km: 18.0,
        duration_sec: 1410,
        duration_min: 23.5,
        cost_inr: 512.0,
        stop_order: ['STOP-02', 'STOP-03', 'STOP-04'],
        is_grand_coalition: false,
      },
      {
        coalition_key: 'ABC',
        member_ids: ['REQ-P101', 'REQ-P102', 'REQ-P103'],
        member_names: ['Elena Vance', 'Pooja Patil', 'Rohan Joshi'],
        label: '{Elena, Pooja, Rohan}',
        size: 3,
        distance_km: 22.4,
        duration_sec: 1680,
        duration_min: 28.0,
        cost_inr: 660.0,
        stop_order: ['STOP-01', 'STOP-02', 'STOP-03', 'STOP-04'],
        is_grand_coalition: true,
      },
    ],
    rider_explanations: {
      'REQ-P101': {
        request_id: 'REQ-P101',
        passenger_id: 'PAX-01',
        passenger_name: 'Elena Vance (Rider)',
        party_size: 1,
        player_letter: 'A',
        pickup_name: locShivaji.name,
        dropoff_name: locHinjewadi.name,
        solo_distance_km: 14.0,
        solo_duration_sec: 1100,
        solo_fare_inr: 337.0,
        raw_shapley_fare_inr: 245.5,
        reconciled_fare_inr: 245.5,
        penny_adjustment_inr: 0.0,
        savings_inr: 91.5,
        savings_pct: 27.15,
        is_individually_rational: true,
        rationality_proof: '₹245.50 <= ₹337.00 direct solo fare (Individual Rationality Axiom Satisfied)',
        marginal_steps: [
          {
            subset_key: '∅',
            subset_label: 'Empty Set',
            subset_size: 0,
            weight_formula: '2/6 (1/3)',
            weight_fraction: '1/3',
            weight_float: 0.3333,
            cost_without_inr: 0.0,
            cost_with_inr: 337.0,
            marginal_cost_inr: 337.0,
            weighted_contribution_inr: 112.33,
          },
          {
            subset_key: '{B}',
            subset_label: '{Pooja}',
            subset_size: 1,
            weight_formula: '1/6',
            weight_fraction: '1/6',
            weight_float: 0.1667,
            cost_without_inr: 369.0,
            cost_with_inr: 498.0,
            marginal_cost_inr: 129.0,
            weighted_contribution_inr: 21.5,
          },
          {
            subset_key: '{C}',
            subset_label: '{Rohan}',
            subset_size: 1,
            weight_formula: '1/6',
            weight_fraction: '1/6',
            weight_float: 0.1667,
            cost_without_inr: 249.0,
            cost_with_inr: 458.0,
            marginal_cost_inr: 209.0,
            weighted_contribution_inr: 34.83,
          },
          {
            subset_key: '{B, C}',
            subset_label: '{Pooja, Rohan}',
            subset_size: 2,
            weight_formula: '2/6 (1/3)',
            weight_fraction: '1/3',
            weight_float: 0.3333,
            cost_without_inr: 512.0,
            cost_with_inr: 660.0,
            marginal_cost_inr: 148.0,
            weighted_contribution_inr: 49.33,
          },
        ],
      },
    },
    reconciliation_target_inr: 660.0,
    reconciled_sum_inr: 660.0,
    penny_discrepancy_inr: 0.0,
    efficiency_guaranteed: true,
    individual_rationality_guaranteed: true,
    axioms_summary: {
      efficiency: true,
      symmetry: true,
      dummy_player: true,
      subadditivity: true,
      individual_rationality: true,
    },
    timestamp: '17:42:15',
  };

  return {
    engine: {
      status: 'running',
      currentWindowId: scenarioId === 2 ? 102 : 101,
      windowIntervalSec: 45,
      timeRemainingInWindowSec: scenarioId === 2 ? 18 : 32,
      batchThreshold: 6,
      batchStatus: scenarioId === 2 ? 'locked_optimizing' : 'intake_open',
      queuedRequestCount: 3,
      queuedSeatsCount: 3,
      tickSpeed: '1x',
      isDemoMode: true,
      activeScenario: `scenario_${scenarioId}`,
    },
    kpis: {
      activePoolsCount: 2,
      totalTripsInFlight: 3,
      fleetDetourAveragePct: 8.4,
      hardDetourCapPct: 15.0,
      shapleySavingsPct: 27.4,
      totalCoalitionSavingsInr: 295.0,
      servedPassengersCount: 14,
      rejectedPassengersCount: 2,
    },
    selection: {
      selectedVehicleId: 'V-101',
      selectedRequestId: 'REQ-P101',
      activeStopId: 'STOP-01',
    },
    vehicles: {
      'V-101': v1,
      'V-102': {
        vehicle_id: 'V-102',
        name: 'MG ZS EV • Fleet Swift',
        capacity: 4,
        occupied_seats: 1,
        current_location: locDeccan,
        status: 'en_route',
        heading_deg: 45,
        battery_pct: 76,
        route_polyline: [[locDeccan.lat, locDeccan.lng], [locKothrud.lat, locKothrud.lng]],
        planned_stops: [],
      },
    },
    requests: {
      'REQ-P101': req1,
      'REQ-P102': req2,
      'REQ-P103': req3,
      ...(scenarioId === 10
        ? {
            'REQ-P104': {
              request_id: 'REQ-P104',
              passenger_id: 'PAX-04',
              passenger_name: 'Amit Deshmukh',
              pickup: locBaner,
              dropoff: locHinjewadi,
              party_size: 1,
              request_time: '17:43:00',
              solo_eta_sec: 600,
              solo_distance_km: 7.2,
              solo_fare_inr: 180.0,
              status: 'matched',
              assigned_vehicle_id: 'V-101',
              batch_id: 101,
              pooled_eta_sec: 650,
              detour_pct: 8.3,
              shapley_fare_inr: 120.0,
            } as RideRequest,
          }
        : {}),
      ...(scenarioId === 11
        ? {
            'REQ-P999': {
              request_id: 'REQ-P999',
              passenger_id: 'PAX-REJECT',
              passenger_name: 'Rahul Shinde (18% Detour Exceeded)',
              pickup: locDeccan,
              dropoff: { lat: 18.4967, lng: 73.9284, name: 'Hadapsar Gadital' },
              party_size: 1,
              request_time: '17:41:45',
              solo_eta_sec: 1100,
              solo_distance_km: 10.2,
              solo_fare_inr: 280.0,
              status: 'rejected',
              assigned_vehicle_id: null,
              batch_id: 101,
              pooled_eta_sec: 1302,
              detour_pct: 18.36,
              shapley_fare_inr: 280.0,
            } as RideRequest,
          }
        : {}),
    },
    activePassengerSession: {
      riderId: 'RIDER-PUNE-01',
      activeTripRequestId: 'REQ-P101',
      assignedVehicleId: 'V-101',
      lifecycleStatus: scenarioId === 7 ? 'dropped_off' : 'matched',
      guaranteedMaxDetourPct: 15.0,
      actualDetourPct: 8.36,
      fareSoloDirectInr: 337.0,
      fareShapleyPooledInr: 245.5,
    },
    detourAudits: [
      {
        request_id: 'REQ-AUDIT-101',
        passenger_id: 'PAX-01',
        passenger_name: 'Elena Vance (Rider)',
        vehicle_id: 'V-101',
        pickup_name: locShivaji.name,
        dropoff_name: locHinjewadi.name,
        solo_eta_sec: 1100,
        solo_distance_km: 14.0,
        pooled_eta_sec: 1192,
        pooled_distance_km: 15.2,
        actual_detour_pct: 8.36,
        max_allowable_detour_pct: 15.0,
        is_compliant: true,
        status: 'compliant_accepted',
        mathematical_proof: 'T_solo = 1100s | T_pooled = 1192s | Detour = +8.36% <= 15.0% [COMPLIANT: 73s margin]',
        delay_margin_sec: 73,
        timestamp: '17:42:10',
      },
      {
        request_id: 'REQ-AUDIT-REJECT',
        passenger_id: 'PAX-REJECT',
        passenger_name: 'Rahul Shinde (18% Detour)',
        vehicle_id: 'V-101',
        pickup_name: locDeccan.name,
        dropoff_name: 'Hadapsar Gadital',
        solo_eta_sec: 1100,
        solo_distance_km: 10.2,
        pooled_eta_sec: 1302,
        pooled_distance_km: 12.1,
        actual_detour_pct: 18.36,
        max_allowable_detour_pct: 15.0,
        is_compliant: false,
        status: 'violation_rejected',
        violation_reason: 'Detour 18.4% exceeds strict 15.0% cap',
        mathematical_proof: 'T_solo = 1100s | T_pooled = 1302s | Detour = +18.36% > 15.0% [REJECTED: +3.36% excess over 15.0% cap]',
        delay_margin_sec: -37,
        timestamp: '17:41:45',
      },
    ],
    shapleyPools: {
      'V-101': shapleyPool,
    },
  };
}

/**
 * Builds a compatible mid-trip join candidate fixture for Vikram Sen.
 */
export function buildCompatibleJoinCandidate(): MidTripJoinCandidate {
  return {
    request_id: 'REQ-MIDTRIP-VIKRAM',
    passenger_name: 'Vikram Sen',
    pickup: { lat: 18.558, lng: 73.8075, name: 'Aundh Parihar Chowk' },
    dropoff: { lat: 18.559, lng: 73.7868, name: 'Baner Road' },
    party_size: 1,
    solo_fare_inr: 185.0,
    proposed_fare_inr: 145.0,
    extra_duration_sec: 210,
    extra_distance_km: 1.8,
    affected_passenger_fare_before: 245.5,
    affected_passenger_fare_after: 194.5,
    affected_passenger_eta_delta_sec: 180,
    detour_pct: 6.67,
    is_valid: true,
    rejection_reason: null,
    mathematical_proof: 'T_solo = 420s | T_pooled = 448s | Detour = +6.67% <= 15.0% [COMPLIANT: 35s margin]',
  };
}

/**
 * Builds an incompatible mid-trip join candidate fixture exceeding 15% detour.
 */
export function buildIncompatibleJoinCandidate(): MidTripJoinCandidate {
  return {
    request_id: 'REQ-MIDTRIP-VIOLATING',
    passenger_name: 'Ananya Rao (Violating Detour)',
    pickup: { lat: 18.5167, lng: 73.8415, name: 'Deccan Gymkhana' },
    dropoff: { lat: 18.4967, lng: 73.9284, name: 'Hadapsar Gadital' },
    party_size: 1,
    solo_fare_inr: 245.0,
    proposed_fare_inr: 245.0,
    extra_duration_sec: 360,
    extra_distance_km: 4.2,
    affected_passenger_fare_before: 245.5,
    affected_passenger_fare_after: 245.5,
    affected_passenger_eta_delta_sec: 360,
    detour_pct: 18.36,
    is_valid: false,
    rejection_reason: 'Detour 18.4% exceeds strict 15.0% guarantee cap (Cap: <=15.0%).',
    mathematical_proof: 'T_solo = 1100s | T_pooled = 1302s | Detour = +18.36% > 15.0% [REJECTED: +3.36% (37s) excess over 15.0% cap]',
  };
}
