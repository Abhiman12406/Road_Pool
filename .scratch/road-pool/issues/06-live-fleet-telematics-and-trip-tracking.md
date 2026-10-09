# 06: Live Pooled Fleet Telematics & Rider Trip Tracking

**What to build:** Provide dynamic trip execution simulation across Pune for both dispatchers and passengers. From the user's perspective, as the simulation clock advances, vehicles physically progress along their multi-stop routes on the Leaflet map, picking up riders, updating seat occupancy, and completing drop-offs. In the Passenger App (`/passenger/my-ride`), a rider tracks their pooled vehicle in real time, sees an arrival ETA countdown, and views a verified detour badge confirming their trip stays within the 15% limit.

**Blocked by:** 05: Exact Shapley Fair-Fare Engine & Explainable Fare Receipt

**Status:** ready-for-agent

- [ ] Simulation engine models continuous vehicle progression along Pune road polylines with realistic speed scaling and stop execution.
- [ ] Active vehicles transition through stop sequences, updating occupied seats and passenger lifecycle states (queued -> en_route_pickup -> in_transit -> completed).
- [ ] Operations Live Map (`/ops/live-map`) displays real-time vehicle markers, pickup/drop-off pins, and multi-passenger route polylines.
- [ ] Passenger Active Ride screen (`/passenger/my-ride`) displays vehicle telemetry, pickup/arrival countdowns, and a persistent guaranteed detour indicator badge.
- [ ] Completed trips transition cleanly to Trip History (`/passenger/history`).
