# 11: Guided Story Mode & 12 Hackathon Acceptance Test Scenarios

**What to build:** An interactive step-by-step wizard overlay and quick scenario bar that allows evaluators to verify the complete sequence and test cases defined in Section 11 & 12 of `docs/dynamic_ride_pooling_ui_feature_spec.md`. Evaluators can step through the story mode or jump directly to any of the 12 scenarios (3-passenger party, 18% detour rejection, Shapley cost breakdown, consent rejections, cancellations) with one click.

**Blocked by:** 10: Cancellation Re-Routing, Seat Release & Trip Completion Receipt

**Status:** closed

- [x] Collapsible Guided Story Mode wizard overlay walks evaluators sequentially through the complete journey (Book -> Batch -> Match -> Shapley -> Active Trip -> Mid-Trip Join -> Two-Way Consent -> Cancellation -> Receipt).
- [x] Quick-runner controls for all 12 test scenarios:
  1. Booking for 3 people reserves 3 seats.
  2. 3 compatible requests matched after buffer window.
  3. Candidate group rejected because passenger experiences 18% detour.
  4. Compares solo cost, shared cost, and individual Shapley fares.
  5. "Why am I paying this fare?" explanation open and validated.
  6. Passenger cancellation updates seat, route, and remaining fares.
  7. Drop-off during active trip frees seat and accepts new compatible request.
  8. Mid-trip joiner triggers driver and passenger consent notifications.
  9. Driver rejection keeps existing ride unchanged.
  10. Passenger decline prevents route insertion.
  11. Detour >15% or deadline violation rejected with explanation.
  12. Displayed Shapley fares sum exactly to allocated total cost after rounding.
- [x] Each test scenario sets the application state deterministically and displays a visual verification badge.
