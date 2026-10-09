# 02: Pune Hybrid Router & Passenger Solo Ride Estimator

**What to build:** Provide travel-time routing across Pune and an interactive Passenger Home screen. From the user's perspective, a rider opens the Passenger view, enters or clicks pickup and drop-off locations across Pune (e.g. Swargate, Shivajinagar, Kothrud, Hinjewadi, Viman Nagar), previews the direct road route polyline on the Leaflet map, and receives instant calculated solo metrics: estimated direct travel time, distance in km, and a transparent solo fare estimate in Indian Rupees (₹).

**Blocked by:** 01: Foundation Scaffold & End-to-End Shell Tracer Bullet

**Status:** ready-for-agent

- [ ] Backend routing engine queries live OSRM with in-memory caching and falls back gracefully to a calibrated Pune urban road network model if offline or rate-limited.
- [ ] Direct routing endpoint returns accurate distance (km), duration (seconds), and road geometry polylines.
- [ ] Passenger Home screen (`/passenger/home`) provides searchable/clickable Pune landmark selection and party size selector.
- [ ] Calculated solo route displays as a clean blue polyline on the Leaflet map.
- [ ] Solo reference fare in ₹ is computed and displayed alongside estimated travel time before pooling.
