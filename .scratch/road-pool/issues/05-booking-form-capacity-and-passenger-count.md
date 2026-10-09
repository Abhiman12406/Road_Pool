# 05: Booking Form Capacity Enforcement & Multi-Passenger Stepper

**What to build:** Upgrade the booking flow so passengers can select 1 to 4 riders using `+`/`-` controls, specify optional preferred pickup times and arrival deadlines, view real-time solo trip estimates (₹ fare, km, duration, ETA), and enforce validation preventing bookings from exceeding vehicle capacity (4 seats). Admitting a booking with 3 passengers immediately reserves 3 seats in the intake queue.

**Blocked by:** 04: Route Optimization & Strict <=15% Detour Validator

**Status:** ready-for-agent

- [ ] Stepper controls (`+` / `-`) enforce 1 to 4 passengers with a visible seat requirement indicator (e.g., "3 passengers").
- [ ] Input fields for preferred pickup time and optional arrival deadline.
- [ ] Instant validation rejects party sizes that exceed available vehicle seats, displaying a clear explanation.
- [ ] Booking containing $N$ passengers reserves $N$ seats in the intake pool rather than a single seat.
- [ ] Submitting dispatches the ride request to the backend batch intake queue with full party and timing metadata.
