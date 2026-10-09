# RidePool AI - Overall Application Shell & Architecture Specification

## 1. Executive Architecture Summary
RidePool AI is structured around a **single synchronized application state** powering two synchronized client archetypes:
1. **Operations Dashboard (`/ops/*`)**: For dispatchers, simulation engineers, and algorithmic researchers evaluating batch rolling heuristics, strict $\le 15\%$ detour constraints, and Shapley-value cooperative cost sharing.
2. **Passenger Experience (`/passenger/*`)**: For end-riders requesting on-demand shared mobility, tracking pooled vehicles, verifying fair fare splits, and monitoring personal detour margins.

---

## 2. Global Shared Application State Boundaries

Both portals bind to a singular reactive client state machine (`RidePoolSimulationStore` / `SharedSimulationService`). State changes triggered anywhere (e.g., clicking *Pause*, triggering *Run Next Batch*, or selecting Vehicle `V-12`) immediately cascade through all open views.

```typescript
interface GlobalSimulationState {
  // Engine & Clock Control
  engine: {
    status: 'running' | 'paused' | 'stepping' | 'reset';
    currentWindowId: number;        // e.g., 148
    windowIntervalSec: number;     // 30s rolling batches
    timeRemainingInWindowSec: number; // 10s
    tickSpeed: '0.5x' | '1x' | '2x' | '5x';
    isDemoMode: boolean;           // true (Synthetic Demo Dataset)
  };

  // Global Algorithmic Telemetry & KPIs
  kpis: {
    activePoolsCount: number;      // 4
    totalTripsInFlight: number;    // 184
    fleetDetourAveragePct: number; // +8.4%
    hardDetourCapPct: number;      // 15.0%
    shapleySavingsPct: number;     // -28.6%
    totalCoalitionSavingsUsd: number; // $20.20 per batch
  };

  // Shared Selection & Entity Registry (Syncs cross-screen drilldowns)
  selection: {
    selectedVehicleId: string | null;  // e.g., "V-12"
    selectedRequestId: string | null;  // e.g., "REQ-8041"
    activeStopId: string | null;       // e.g., "STOP-2"
  };

  // Canonical Requests & Pooling Coalitions
  requests: Record<string, RideRequest>; // REQ-8041, REQ-8042, REQ-8043, REQ-8044
  vehicles: Record<string, FleetVehicle>; // V-12 (Ford E-Transit, 6 seats, 91% SoC)

  // Passenger Session Mirror
  activePassengerSession: {
    riderId: string;                   // "RIDER-ELENA"
    activeTripRequestId: string;       // "REQ-8041"
    assignedVehicleId: string;         // "V-12"
    lifecycleStatus: 'en_route_pickup' | 'in_transit' | 'dropped_off';
    guaranteedMaxDetourPct: number;    // 11.1% (<= 15.0% cap)
    fareSoloDirect: number;            // $24.50
    fareShapleyPooled: number;         // $17.80
  };
}
```

---

## 3. Shell Routing Table & Shell Placeholders

| Route | View Name | Archetype | Shell Placeholder | Description & Persistent Controls |
|---|---|---|---|---|
| `/ops/overview` | Overview | Operations | `{{DATA:SHELL:SHELL_7}}` | High-level system vitals, throughput metrics, batch countdown, quick fleet status. |
| `/ops/live-map` | Live Map | Operations | `{{DATA:SHELL:SHELL_8}}` | Full-screen GIS tracking of V-12 and active fleet, pickup/drop-off stops, route polylines. |
| `/ops/batches` | Request & Batch Manager | Operations | `{{DATA:SHELL:SHELL_9}}` | Rolling 30s intake window queue, pending riders, admitted batches, flagged detours. |
| `/ops/optimization` | Route Optimization | Operations | `{{DATA:SHELL:SHELL_10}}` | Ordered stop sequence solver ($1 \to 2 \to 3$), delay margins, vehicle capacity assignment. |
| `/ops/detour-guarantees` | Detour Guarantees | Operations | `{{DATA:SHELL:SHELL_11}}` | Mathematical proof inspector verifying $\frac{T_{\text{pooled}}(i) - T_{\text{direct}}(i)}{T_{\text{direct}}(i)} \le 0.15$. |
| `/ops/fair-fares` | Fair Fare Engine | Operations | `{{DATA:SHELL:SHELL_12}}` | Game-theoretic Shapley value decomposition, subadditivity audits, marginal contribution trees. |
| `/ops/benchmarks` | Benchmark & Analytics | Operations | `{{DATA:SHELL:SHELL_13}}` | Solo-ride vs. pooled comparison metrics, VMT reductions, deadhead optimization curves. |
| `/ops/settings` | Simulation Settings | Operations | `{{DATA:SHELL:SHELL_14}}` | Detour cap threshold adjustments (5%–25%), batch interval sliders, synthetic seed config. |
| `/passenger/home` | Passenger Home | Passenger | `{{DATA:SHELL:SHELL_15}}` | Ride hailing & estimate simulator, pickup/destination selection with pooled discount preview. |
| `/passenger/my-ride` | Passenger My Ride | Passenger | `{{DATA:SHELL:SHELL_16}}` | Real-time pooled trip telemetry, vehicle arrival countdown, in-transit detour guarantee badge. |
| `/passenger/trips` | Passenger Trips | Passenger | `{{DATA:SHELL:SHELL_17}}` | Historical trips record, cumulative Shapley savings breakdown, carbon offset metrics. |
| `/passenger/profile` | Passenger Profile | Passenger | `{{DATA:SHELL:SHELL_18}}` | Rider preferences (walking tolerance, max detour comfort level, payment methods). |
| `/*` (Not Found) | 404 Not Found | Fallback | `{{DATA:SHELL:SHELL_19}}` | Clean fallback screen with instant routing back to `/ops/overview` or `/passenger/home`. |

---

## 4. Key Shell Capabilities Implemented

1. **Persistent Top Controls & Simulation State**:
   - Both portals feature the **Global Portal Switcher** (`[Ops Console | Passenger Preview]`) allowing immediate context switching without resetting or reloading the algorithmic run.
   - Global simulation controls (`Start`, `Pause`, `Run Next Batch #148`, `Reset`) and window timer (`00:10s`) remain persistently docked.
2. **Deep-linking & Synchronized Selection**:
   - Selecting Request `REQ-8041` on `/ops/batches` automatically maintains that selection when navigating to `/ops/detour-guarantees` or `/ops/fair-fares`.
   - The same request is instantly reflected in the passenger view `/passenger/my-ride` without state dissonance.
3. **Demo & Synthetic Mode Indicator**:
   - Persistent glowing status pill clearly signifies `Synthetic Demo Dataset • SF Mission/SOMA` with real-time algorithm state tags (`Solving`, `Standby`, `Batch Admitted`).
