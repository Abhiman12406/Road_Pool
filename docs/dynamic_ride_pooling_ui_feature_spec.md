# Dynamic Ride-Pooling UI — Feature Specification

## 1. Overall Instruction

We already have a rough UI for a dynamic ride-pooling application. Inspect the existing codebase, understand its current structure, and extend the existing UI to implement the features described below.

**Important:**
- Do not replace the entire project or unnecessarily redesign the UI.
- Preserve the current framework, routing, components, design choices and working functionality wherever possible.
- First inspect the existing files and identify which components can be reused.
- Make features interactive and connected to application state. Do not create static mockup screens with buttons that do nothing.
- If backend APIs are not implemented yet, use a clearly structured mock service with sample data so that the complete flow can be demonstrated. Keep the service layer replaceable by real APIs.
- Keep passenger, driver and ride information synchronised.
- Make the interface professional, clean, minimal and easy to understand during a hackathon demonstration.

## 2. Booking Form with Passenger Count

When a user books a ride, allow them to enter:
- Pickup location
- Destination
- Preferred pickup time
- Arrival deadline, if applicable
- Number of passengers included in the booking
- Optional special requirements, if supported

### UI requirements
- Pickup and destination fields
- A passenger-count selector with plus and minus controls
- A visible seat requirement, such as “3 passengers”
- A search-for-shared-ride button

### Validation
- Passenger count must be at least one.
- Do not allow a booking to exceed the available vehicle capacity.
- If a suitable shared ride is unavailable, explain that clearly.
- Treat a booking containing three people as three occupied seats, not one.

## 3. Initial Buffer Window and Smart Matching

After a passenger submits a request, do not immediately confirm the final passenger group or final shared fare.

Introduce an initial batching window of approximately **30–90 seconds**. During this window, collect other compatible ride requests.

### What the system should calculate
1. Road distance for the relevant routes.
2. Estimated travel time.
3. Pickup and drop-off sequence.
4. Vehicle capacity and seat availability.
5. Individual passenger detour distance and detour percentage.
6. Estimated pickup and arrival times.
7. Estimated total trip cost.
8. Individual fare allocation using Shapley Value.

### UI requirements
- A visible countdown timer.
- A status such as “Finding compatible passengers”.
- A list of candidate passengers or bookings, using privacy-safe identifiers.
- A map showing pickup and destination locations.
- A route summary showing distance and estimated duration.
- A seat-availability indicator.
- A clear matching status: Searching, Match Found, or No Valid Match.

Example:

> **Finding your shared ride**
> - Matching window: 45 seconds remaining
> - Your booking: 2 passengers
> - Compatible requests found: 2
> - Vehicle capacity: 4 seats

Do not display an assumed final passenger count until matching and route validation have finished.

When the buffer window ends, select a valid group only if it satisfies the routing constraints. If no valid group is found, offer the user the option to wait longer, search another vehicle, or choose a solo ride if supported.

## 4. Vehicle Capacity and Live Occupancy

Show vehicle capacity and the number of passengers currently inside the vehicle.

### UI requirements
Display:
- Vehicle capacity: 4 seats
- Passengers currently onboard: 2
- Seats currently occupied: 2/4
- Available seats: 2
- Confirmed upcoming pickups: 1

Represent occupied and available seats visually using small seat icons or a simple occupancy bar.

Clearly distinguish between:
- Passengers currently onboard.
- Passengers who have confirmed but are waiting for pickup.
- Seats reserved for confirmed upcoming passengers.
- Seats actually available for new bookings.

A passenger who has not yet boarded may still have a reserved seat. Do not treat that seat as free simply because the passenger is not currently inside the vehicle.

When someone boards or is dropped off, update occupancy and route status.

## 5. Three Types of Cost Calculation

The system must support three distinct fare scenarios.

### A. Solo ride cost
Calculate the estimated cost if the passenger travels alone.

Show:
- Solo distance
- Estimated solo travel time
- Estimated solo fare
- Estimated arrival time

Label this clearly as the solo-trip estimate.

### B. Shared ride cost
When multiple compatible passengers are matched, calculate the cost of serving the group.

Show:
- Total shared route distance and duration.
- Total estimated trip cost.
- Each passenger's individual fare.
- Each passenger's detour percentage.
- Estimated savings compared with the solo fare, if applicable.

The individual fare must not be calculated by simply dividing the total cost equally among all passengers. Use Shapley Value to allocate the shared cost based on the calculated costs of the relevant passenger groups.

### C. Cost recalculation when a new passenger joins mid-trip
When a new request arrives while the vehicle is already travelling, evaluate whether that passenger can be added to the current route.

Calculate:
- The current route and its cost.
- The proposed route including the new passenger.
- The updated total trip cost.
- The new passenger's fare.
- The revised fares for affected existing passengers.
- Updated distance, travel time, detour percentages and arrival estimates.

Only propose the insertion if the updated route satisfies capacity, time-window and maximum 15% detour constraints. If the insertion is invalid, reject it for that vehicle and, if possible, evaluate another vehicle.

Do not automatically accept a passenger just because a seat is empty.

## 6. Shapley-Based Fare Breakdown and Cost Reasoning

Every passenger should be able to understand why they are paying the displayed amount.

Create an expandable section called **“Why am I paying this fare?”**

Display:
- Solo-trip estimated fare.
- Total shared-trip cost.
- Passenger's Shapley-based fare share.
- Distance and route contribution.
- Effect of joining the existing passenger group.
- Any applicable fixed charges or other cost components.
- Estimated savings or additional cost compared with the solo estimate.

Explain Shapley Value in simple words:

> “The system compares the cost of different passenger combinations and averages how much each passenger adds to the total cost. This helps distribute the shared fare according to each passenger's contribution.”

### Calculation requirements
The routing and cost engine must calculate the cost for each relevant passenger combination. The Shapley engine then uses those coalition costs to calculate individual shares.

For a small group of three passengers A, B and C, the relevant non-empty combinations are:
- A
- B
- C
- A + B
- A + C
- B + C
- A + B + C

Use the same cost model and feasibility rules consistently for all combinations. Do not invent arbitrary coalition costs or label an equal split as Shapley Value.

Display currency to two decimal places, and ensure the displayed fare shares add up to the total allocated trip cost after rounding. If the system cannot compute a valid route or cost, show a clear error rather than displaying a fabricated fare.

## 7. Cancellation and Automatic Fare Recalculation

When a passenger cancels, the application must update the remaining ride rather than simply changing the booking status.

### Before the trip begins
1. Mark the booking as cancelled.
2. Release the relevant seat reservation.
3. Remove the passenger from the proposed group.
4. Recalculate the route and remaining travel times.
5. Recalculate the shared trip cost and Shapley shares for the remaining group.
6. Update the total cost and individual fares.
7. Notify affected passengers if their proposed fare or arrival time changes.

### During an active trip
If a passenger is already onboard and cancels or requests an early drop-off, treat this as a trip change. Recalculate the remaining route and determine whether pending requests can now be accommodated.

Do not recalculate completed passengers' fares as though they were still travelling. Handle any adjustment or refund according to the stated fare policy.

### UI requirements
Provide:
- A Cancel Ride action.
- Confirmation before cancellation.
- Updated seat availability.
- Updated route and ETA.
- Updated fare breakdown.
- A visible message explaining what changed.

Example:

> “Passenger C cancelled. One seat reservation has been released. The route and remaining fare allocation have been recalculated.”

If the fare changes for remaining passengers, show the revised amount and obtain any required consent before applying it.

## 8. Dynamic Mid-Trip Matching and Two-Way Consent

When a new ride request arrives while a vehicle is active, check whether the new passenger can join without breaking existing route constraints. If the insertion is valid, initiate a consent workflow involving the driver and affected existing passengers.

### A. Notification for the driver

**New Ride Request**
- Pickup and destination.
- Number of passengers requesting the ride.
- Pickup distance and estimated additional time.
- Proposed route change.
- Effect on existing passengers' arrival times.
- Proposed fare for the new passenger.

Actions:
- Accept Request
- Reject Request

The driver should never be asked to accept a request that already violates mandatory routing constraints.

### B. Notification for existing passengers

**You Have a New Ride-Share Opportunity**
- A new passenger wants to join your vehicle.
- Proposed additional pickup.
- Revised route and arrival estimate.
- Current fare versus proposed fare, if it changes.
- Explanation of the change.

Actions:
- Accept Updated Plan
- Decline Updated Plan

Only ask passengers for consent when their agreement is required by the product's policy, especially when their fare or agreed trip conditions change.

### C. Final decision

The system should:
1. Validate the proposed route.
2. Notify the driver and affected passengers.
3. Collect the required responses.
4. Accept the insertion only when all mandatory approvals are obtained.
5. Recalculate and confirm the final route and fares.
6. Update occupancy, reservations and ETAs.

If the driver rejects the request, an affected passenger declines, or the response deadline expires, keep the existing valid trip unchanged and offer the new passenger another available option.

Do not silently change an existing passenger's accepted fare.

## 9. Dashboard and Map

Create a central trip dashboard containing:
- Interactive map with vehicle position and planned route.
- Colour-coded pickup and drop-off markers.
- Current vehicle capacity and occupancy.
- Passenger group and booking statuses.
- Current route distance and duration.
- Per-passenger detour percentages.
- Total trip cost and individual fare allocations.
- New-request and cancellation notifications.
- Route recalculation status.

Use distinct visual states for:
- Proposed route.
- Confirmed route.
- Rejected route.
- Completed pickup or drop-off.

The map should update when the route changes. If live location tracking is not implemented, use a clearly labelled simulated vehicle position for the demonstration.

## 10. Data and State Management

Keep UI state consistent across all related components.

### Ride Request
- Request ID
- Passenger ID
- Pickup and destination
- Requested time and arrival deadline
- Number of passengers
- Booking status

### Vehicle
- Vehicle ID
- Total capacity
- Current onboard passengers
- Reserved seats
- Available seats
- Current location

### Route
- Ordered stops
- Estimated distance and duration
- Arrival times
- Per-passenger detour metrics
- Validation status

### Fare Allocation
- Solo cost estimate
- Coalition cost table
- Total shared cost
- Individual Shapley shares
- Rounding adjustment
- Fare acceptance status

### Consent Request
- Request ID
- Driver response
- Responses from affected passengers
- Expiration status
- Final decision

Use one consistent source of truth for the current ride, passenger group, route and fare state. Prevent double-booking of seats and duplicate confirmation actions.

## 11. Essential Test Scenarios

Implement and test these UI flows:

1. A passenger books a ride for three people. The system reserves three seats.
2. Three compatible requests are matched after the buffer window.
3. A candidate group is rejected because one passenger would experience an 18% detour.
4. The application shows solo cost, shared cost and individual Shapley fares.
5. A passenger opens the fare explanation and sees why they pay the displayed amount.
6. A passenger cancels before departure. The seat, route and fare allocations update.
7. A passenger is dropped off during an active trip. Occupancy updates and a new request is evaluated.
8. A new passenger requests to join. The driver and affected passengers receive appropriate consent notifications.
9. The driver rejects the new request. The existing ride remains unchanged.
10. An affected passenger declines a fare-changing proposal. The proposed insertion is not committed.
11. A new request violates a time window or the 15% detour rule. It is rejected with an explanation.
12. The displayed Shapley fare shares add up to the allocated total cost after rounding.

## 12. Final Acceptance Criteria

The updated UI should allow a judge to demonstrate this complete sequence:

**Book a ride → Select passenger count → Wait through the batching window → Match compatible requests → View route and constraints → Compare solo and shared costs → Understand individual Shapley fares → Confirm the ride → Receive a mid-trip request → Obtain driver and passenger consent → Update the route and fares → Cancel a passenger and recalculate.**

Prioritise correctness and clear state transitions over decorative design. Make sure every major action has a visible outcome, every invalid request has a reason, and no route or fare is presented as confirmed before the relevant checks and approvals are complete.

## Implementation Reminder

Shapley Value determines fare allocation; it does not decide whether a new passenger is allowed to join. The routing engine must first verify capacity, time windows and the 15% detour constraint. Only a valid proposed route should proceed to fare calculation and the consent workflow.
