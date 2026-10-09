# 08: Active Trip Dashboard with Live 4-Seat Cabin Layout & Vehicle Telematics

**What to build:** The centralized active trip tracking experience (`passenger-active`). Displays the vehicle moving along the Pune road network, an ordered stops timeline with arrival ETAs and completed checkmarks, and an interactive 4-Seat Cabin Layout Grid (Driver + 4 passenger seats) that visually distinguishes between seats currently occupied by onboard riders, seats reserved for confirmed upcoming pickups, and free seats available for booking.

**Blocked by:** 07: Combinatorial Shapley Fair-Fare Engine & Explainable Slide-Over Sheet

**Status:** completed

- [x] Dedicated active trip dashboard view renders when a ride is confirmed and vehicle departs.
- [x] Leaflet map shows moving vehicle marker, planned route polyline, and color-coded pickup/drop-off pins.
- [x] Interactive 4-Seat Cabin Layout Grid renders Driver + 4 passenger seats with clear visual distinction:
  - Currently onboard passengers (solid indicator).
  - Confirmed upcoming reservations (reserved indicator).
  - Available seats for new bookings (open indicator).
- [x] Stops timeline checks off completed pickups and drop-offs, dynamically updating live occupancy and ETAs.
- [x] Distinguishes route visual states: Proposed, Confirmed, and Completed.
