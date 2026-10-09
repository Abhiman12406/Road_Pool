# 06: Initial Buffer Window with Live Commuter Influx & Fast-Forward Solver

**What to build:** The 30–90 second initial batching window experience. While the 45-second circular countdown runs, the screen shows privacy-masked candidate passengers joining the candidate pool, dynamic seat availability, route previews, and a visible matching status (`Searching`, `Match Found`, `No Valid Match`). Includes a "Fast-Forward: Dispatch Batch Now" button for instant solver execution. If no valid match is found, provides clear options to wait longer, search another vehicle, or choose a solo ride.

**Blocked by:** 05: Booking Form Capacity Enforcement & Multi-Passenger Stepper

**Status:** ready-for-agent

- [ ] Visible circular countdown timer (default 45s) displaying remaining window duration and rolling batch ID.
- [ ] Candidate commuters list dynamically populating with privacy-safe identifiers (e.g. `Rider P-204`, `Rider P-318`).
- [ ] Matching status clearly distinguishes between `Searching`, `Match Found`, and `No Valid Match`.
- [ ] "Fast-Forward: Dispatch Batch Now" button instantly locks the batch and triggers the OR-Tools solver.
- [ ] Displays route summary, pickup/drop-off sequence, candidate detour percentages, and seat availability.
- [ ] In case of no match, offers user options to wait longer, search another vehicle, or switch to solo ride.
