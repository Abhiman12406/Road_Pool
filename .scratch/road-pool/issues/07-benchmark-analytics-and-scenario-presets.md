# 07: Comparative Benchmark Analytics vs. Baseline & Scenario Presets

**What to build:** Provide objective benchmark validation comparing RidePool AI against a traditional nearest-vehicle greedy matching baseline, and integrate 3 one-click judge demo scenarios. From the user's perspective, operators can open `/ops/benchmarks` to compare total vehicle kilometres, passenger detours, average fare savings, and Gini equity metrics between both approaches under the exact same demand seed. In the header bar, users can select curated 1-click demo presets to immediately demonstrate feasible pooling, detour rejection, or peak-hour stress testing.

**Blocked by:** 06: Live Pooled Fleet Telematics & Rider Trip Tracking

**Status:** ready-for-agent

- [ ] Baseline engine runs nearest-vehicle greedy matching and distance-proportional fare splitting on identical demand seeds.
- [ ] Operations Benchmark & Analytics screen (`/ops/benchmarks`) renders comparative bar and area charts for Vehicle Kilometres Traveled (VMT), service rate, average detour, and cost savings.
- [ ] 3 Curated demo presets implemented in the header switcher:
  - Preset 1: Feasible 3-Rider Pool (compliant <12% detour, high savings)
  - Preset 2: Infeasible Detour Rejection (demonstrates algorithmic integrity by rejecting a >15% detour candidate)
  - Preset 3: Peak-Hour Stress Test (multiple vehicles and rolling batches)
- [ ] Operations Settings screen (`/ops/settings`) allows configuring detour threshold (5%–25%), batch window duration, and fleet capacity parameters.
