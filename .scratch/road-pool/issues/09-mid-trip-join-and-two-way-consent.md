# 09: Dynamic Mid-Trip Join Injection & In-Context Two-Way Consent Workflow

**What to build:** Dynamic mid-trip matching when a vehicle is en route, complete with simulation triggers and two-way consent. Provides buttons on the active trip screen to "Inject Compatible Joiner" and "Inject Violating Detour Joiner (>15%)". If violating, immediately displays the mathematical constraint rejection. If valid, pops up dual in-context consent cards: Driver Card (`Accept`/`Reject`) and Existing Passenger Card (`Accept`/`Decline`). Only upon dual approval does the route update, revising ETAs, seat occupancy, and Shapley fares.

**Blocked by:** 08: Active Trip Dashboard with Live 4-Seat Cabin Layout & Vehicle Telematics

**Status:** completed

- [x] On-screen demo triggers: "Simulate Compatible Joiner" and "Simulate Incompatible Joiner (>15% Detour)".
- [x] Routing engine verifies capacity, time windows, and hard 15% detour cap before initiating consent; rejecting violating requests with explicit explanation.
- [x] Dual in-context consent overlay displays:
  - Driver Notification: pickup/drop-off, extra duration, proposed fare, and `[Accept Request]` / `[Reject Request]` buttons.
  - Existing Passenger Notification: revised route, arrival ETA delta, fare impact, and `[Accept Updated Plan]` / `[Decline Updated Plan]` buttons.
- [x] If either party declines, the existing route and fares remain unchanged and the candidate is rejected.
- [x] If both accept, route polyline updates, reserved seat is booked in the 4-seat cabin grid, and remaining Shapley fares are recomputed.
