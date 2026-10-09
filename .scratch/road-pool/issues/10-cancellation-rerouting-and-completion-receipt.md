# 10: Cancellation Re-Routing, Seat Release & Trip Completion Receipt

**What to build:** Dynamic handling of cancellations before and during trips, paired with final trip receipt generation. Active riders can cancel their booking with a confirmation dialog. Evaluators can also trigger "Simulate Co-Rider Cancellation" (e.g. Passenger C cancels), which immediately removes the passenger, releases the reserved seat in the 4-seat grid, re-optimizes the route, recalculates Shapley fare shares for remaining passengers, and displays an explanatory toast. When the vehicle reaches the final drop-off, renders the official Trip Completion Receipt.

**Blocked by:** 09: Dynamic Mid-Trip Join Injection & In-Context Two-Way Consent Workflow

**Status:** closed

- [x] "Cancel My Ride" button provides confirmation dialog and cleanly cancels the active rider's booking.
- [x] "Simulate Co-Rider Cancellation" trigger removes co-riders (e.g. Passenger C), updates vehicle stops, and releases the reserved cabin seat.
- [x] Shared route cost and Shapley shares automatically recalculate for remaining passengers with a visible toast explaining the change.
- [x] Drop-off of completed passengers updates occupancy without retroactively changing completed fares.
- [x] When final destination is reached, displays Trip Completion Receipt with final Shapley fare paid, carbon offset, actual vs solo duration, and "Book Another Ride" action.
