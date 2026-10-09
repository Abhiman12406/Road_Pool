# 04: Route Optimization & Strict <=15% Detour Validator

**What to build:** Implement the core constrained route solver and detour guarantee validator. From the user's perspective, the system automatically finds the optimal pickup-and-delivery stop sequence for available fleet vehicles while mathematically verifying that every accepted passenger's detour does not exceed 15%. On the Operations Route Optimization and Detour Guarantees screens, operators can inspect the ordered stop sequence, delay margins, and an auditable mathematical proof verifying that any passenger with >15% detour was rejected with an explicit constraint explanation.

**Blocked by:** 03: Sliding-Window Dynamic Batching & Intake Queue

**Status:** ready-for-agent

- [ ] Solver implements greedy insertion followed by Google OR-Tools routing with vehicle capacity limits and strict pickup-before-dropoff precedence.
- [ ] Detour for each passenger i is computed using consistent travel time: Detour = ((T_pooled - T_solo) / T_solo) * 100%.
- [ ] Route is accepted only if Detour <= 15% for all riders in the vehicle; candidate insertions violating 15% are rejected.
- [ ] Route Optimization screen (`/ops/optimization`) displays the ordered sequence of stops (1 -> 2 -> 3) with vehicle capacity utilization.
- [ ] Detour Guarantees screen (`/ops/detour-guarantees`) shows green badges for compliant detours and red badges with audited violation reasons for rejected candidates.
