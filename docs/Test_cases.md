# Fair Taxi Fare Sharing Using Shapley Value

## Overview

This document explains five cases for sharing a taxi fare when passengers board and leave at different points. It compares a simple segment-based fare split with Shapley value and describes safeguards for a ride-pooling system.

## 1. Base fare and sharing rules

Assume the meter charges:

- **Starting fee:** ₹20
- **Rate:** ₹10 per kilometre

The total fare for the car is:

```text
Trip cost = Starting fee + (Rate per km × Total distance driven)
```

The car's fare depends on the route driven, not directly on the number of passengers.

### Segment-based rules

1. Split the starting fee equally among the passengers included in the ride-sharing arrangement.
2. Split each road segment's distance cost equally among the passengers travelling in the car on that segment.
3. Ensure all passenger shares add up to the actual car fare.

**Important:** Segment-based splitting is a transparent cost-allocation policy. It is not automatically identical to Shapley value for every possible cost function. A Shapley calculation depends on how the cost of every possible passenger coalition is defined.

---

## Case 1: A, B and C board one after another and all get off at Z

### Route

```text
A ----4 km---- B ----3 km---- C ----5 km---- Z
```

Total distance = 4 + 3 + 5 = **12 km**

Total car fare = ₹20 + (12 × ₹10) = **₹140**

### Segment allocation

| Segment | Segment cost | Passengers present | Allocation |
|---|---:|---|---|
| A → B (4 km) | ₹40 | A | A pays ₹40 |
| B → C (3 km) | ₹30 | A, B | ₹15 each |
| C → Z (5 km) | ₹50 | A, B, C | ₹16.67 each, approximately |
| Starting fee | ₹20 | A, B, C | ₹6.67 each, approximately |

### Final fares

| Passenger | Calculation | Fare (approx.) | Solo fare | Saving (approx.) |
|---|---|---:|---:|---:|
| A | 40 + 15 + 16.67 + 6.67 | ₹78.33 | ₹140 | ₹61.67 |
| B | 15 + 16.67 + 6.67 | ₹38.33 | ₹100 | ₹61.67 |
| C | 16.67 + 6.67 | ₹23.33 | ₹70 | ₹46.67 |
| **Total** | | **₹140** | | |

The displayed passenger amounts are rounded to paise, so an implementation should assign any rounding remainder to one passenger to ensure the collected total is exactly ₹140.

### Why the split is intuitive

- A travels the longest distance and pays the most.
- C joins latest and pays the least.
- Each distance segment is shared only by the passengers riding on that segment.

### Shapley-value note

For a formal Shapley proof, define the coalition cost function explicitly, including whether passengers in a coalition can use separate cars. Do not claim that segment splitting and Shapley are identical without checking that the coalition-cost definition produces the same allocation.

---

## Case 2: A gets off before B

### Route

```text
A ----3 km---- B ----5 km---- A' ----4 km---- B'
```

- A travels 8 km.
- B travels 9 km.
- The shared car travels 12 km.

Total car fare = ₹20 + (12 × ₹10) = **₹140**

Solo fares:
- A: ₹20 + (8 × ₹10) = **₹100**
- B: ₹20 + (9 × ₹10) = **₹110**
- Separate cars would cost ₹210 in total.

### Segment allocation

| Segment | Segment cost | Passengers present | Allocation |
|---|---:|---|---|
| A → B (3 km) | ₹30 | A | A pays ₹30 |
| B → A' (5 km) | ₹50 | A, B | ₹25 each |
| A' → B' (4 km) | ₹40 | B | B pays ₹40 |
| Starting fee | ₹20 | A, B | ₹10 each |

### Final fares

| Passenger | Calculation | Fare | Solo fare | Saving |
|---|---|---:|---:|---:|
| A | 30 + 25 + 10 | **₹65** | ₹100 | ₹35 |
| B | 25 + 40 + 10 | **₹75** | ₹110 | ₹35 |
| **Total** | | **₹140** | **₹210** | **₹70** |

### Two-player Shapley calculation under the stated coalition costs

If the coalition costs are defined as `v(A) = ₹100`, `v(B) = ₹110`, and `v(A,B) = ₹140`, then:

```text
Shapley(A) = ½ × [100 − 0] + ½ × [140 − 110]
           = 50 + 15
           = ₹65

Shapley(B) = ½ × [110 − 0] + ½ × [140 − 100]
           = 55 + 20
           = ₹75
```

This matches the segment-based split for these coalition costs.

---

## Case 3: A and C travel together, then B joins

### Route

```text
km 0          km 3             km 8          km 11
|-------------|----------------|-------------|
A and C board  B boards         A and C exit  B exits
```

- A and C travel together from km 0 to km 8.
- B travels from km 3 to km 11.
- The car travels 11 km total.
- Total car fare = ₹20 + (11 × ₹10) = **₹130**.

A and C form a party travelling in the same car. Two different policies are possible.

### Policy 1: Allocate by trip or party

Treat A and C as one trip for the first allocation step, then split that party's share equally between A and C.

| Segment | Cost | Trips present | Allocation |
|---|---:|---|---|
| km 0 → 3 | ₹30 | AC party | AC party pays ₹30 |
| km 3 → 8 | ₹50 | AC party, B | ₹25 each |
| km 8 → 11 | ₹30 | B | B pays ₹30 |
| Starting fee | ₹20 | AC party, B | ₹10 each |

- AC party pays ₹30 + ₹25 + ₹10 = **₹65**.
- B pays ₹25 + ₹30 + ₹10 = **₹65**.
- Split the AC party's ₹65 equally: A pays **₹32.50**, C pays **₹32.50**.

| Passenger | Fare | Reference solo fare | Difference |
|---|---:|---:|---:|
| A | ₹32.50 | ₹50 (half of the AC party's ₹100 solo-car cost) | ₹17.50 saved |
| C | ₹32.50 | ₹50 (half of the AC party's ₹100 solo-car cost) | ₹17.50 saved |
| B | ₹65.00 | ₹100 | ₹35 saved |
| **Total** | **₹130** | | |

### Policy 2: Allocate by individual seat

Treat A, B and C as three separate passengers for each segment.

| Segment | Cost | Passengers present | Allocation |
|---|---:|---|---|
| km 0 → 3 | ₹30 | A, C | ₹15 each |
| km 3 → 8 | ₹50 | A, C, B | ₹16.67 each, approximately |
| km 8 → 11 | ₹30 | B | B pays ₹30 |
| Starting fee | ₹20 | A, C, B | ₹6.67 each, approximately |

Approximate fares:
- A = **₹38.33**
- C = **₹38.33**
- B = **₹53.33**

The rounded amounts should be reconciled so the total equals ₹130 exactly.

### Policy comparison

| Measure | Policy 1: per trip | Policy 2: per seat |
|---|---:|---:|
| A | ₹32.50 | ₹38.33 approx. |
| C | ₹32.50 | ₹38.33 approx. |
| A + C total | ₹65.00 | ₹76.67 approx. |
| B | ₹65.00 | ₹53.33 approx. |
| **Total** | **₹130.00** | **₹130.00** |

Neither policy is universally correct. **Per-trip allocation** treats the AC party as one customer; **per-seat allocation** treats each person as a separate customer. Choose the policy that matches the product's pricing promise and explain it before booking.

---

## Case 4: A boards, B joins, A exits, C joins, then B and C exit together

### Route

```text
A ----4 km---- B ----3 km---- A' ----2 km---- C ----5 km---- Z
```

- A travels 7 km.
- B travels 10 km.
- C travels 5 km.
- The car travels 14 km total.

Total car fare = ₹20 + (14 × ₹10) = **₹160**

### Segment allocation

| Segment | Cost | Passengers present | Allocation |
|---|---:|---|---|
| A → B (4 km) | ₹40 | A | A pays ₹40 |
| B → A' (3 km) | ₹30 | A, B | ₹15 each |
| A' → C (2 km) | ₹20 | B | B pays ₹20 |
| C → Z (5 km) | ₹50 | B, C | ₹25 each |
| Starting fee | ₹20 | A, B, C | See note below |

For consistency with the segment rule, the starting fee should be divided equally among the passengers included in the pricing arrangement. If all three passengers are included, each share is ₹20 ÷ 3 = approximately ₹6.67.

### Final fares with an equal three-way starting-fee split

| Passenger | Calculation | Fare (approx.) | Solo fare | Saving (approx.) |
|---|---|---:|---:|---:|
| A | 40 + 15 + 6.67 | ₹61.67 | ₹90 | ₹28.33 |
| B | 15 + 20 + 25 + 6.67 | ₹66.67 | ₹120 | ₹53.33 |
| C | 25 + 6.67 | ₹31.67 | ₹70 | ₹38.33 |
| **Total** | | **₹160** | **₹280** | **₹120** |

**Alternative policy:** If the starting fee is split according to who is in the car at the first pickup, A could pay all ₹20. Then the fares would be A ₹75, B ₹60, C ₹25, totaling ₹160. This is a different policy and should be stated explicitly.

---

## Case 5: Can Shapley charge someone more than their solo fare?

### Short answer

Yes, a Shapley allocation can exceed a passenger's solo fare if the coalition cost function is poorly designed or forces an inefficient pooled route. A properly defined cost function that allows separate cars can avoid this issue in the cost model described below.

### Example of a bad coalition-cost definition

Assume a starting fee of ₹20 and a rate of ₹10/km.

| Passenger | Route | Solo fare |
|---|---|---:|
| B | km 0 → 5 | ₹70 |
| A | km 10 → 16 | ₹80 |
| C | km 10 → 13 | ₹50 |
| **Total of solo fares** | | **₹200** |

B's route is far from A and C's routes. Forcing all three into one car would require driving from km 0 to km 16:

- Forced pooled fare = ₹20 + (16 × ₹10) = **₹180**.
- Under one possible coalition-cost definition, Shapley may allocate **A ₹60, B ₹90, C ₹30**.
- In that allocation, B pays ₹90 even though B's solo fare is only ₹70.

This illustrates a bad outcome when the model forces unrelated trips together. The exact Shapley values depend on the complete coalition-cost table, so they should be verified before being presented as a formal calculation.

### Better fix: define coalition cost as the cheapest feasible service plan

Define:

```text
v(S) = minimum total cost to serve all passengers in group S,
       allowing one shared car or multiple separate cars,
       subject to the service's route, timing, capacity, and detour constraints.
```

For the example, the best plan is:
- B travels alone: ₹70.
- A and C share a car for the 6 km route from km 10 to km 16: ₹80.
- Best total cost = **₹150**, rather than ₹180.

This cost function permits the system to separate trips when pooling is inefficient.

### Important mathematical qualification

Allowing separate cars ensures the **coalition cost** is no more than the cost of serving the existing group and a new passenger separately:

```text
v(S ∪ {i}) ≤ v(S) + v({i})
```

This is a subadditivity property. However, **subadditivity alone does not guarantee that every individual Shapley payment is at most that individual's solo fare**. It bounds the marginal cost of adding a passenger to a coalition, but Shapley averages marginal costs across coalitions, including potentially negative marginal costs. A separate proof or a pricing cap is needed to guarantee an individual fare ceiling.

### Recommended safeguards

| Safeguard | Purpose |
|---|---|
| Shareability prefilter | Avoid matching trips that do not overlap sufficiently in route or time. |
| Detour limit | Reject a match if a passenger's added travel distance or time exceeds the chosen threshold, such as 15%. |
| Solo-fare ceiling | Display a passenger's solo fare and guarantee that the passenger will not pay more than that amount. |
| Reconciliation rule | If a fare cap changes an allocation, redistribute the difference only under a clearly defined rule that preserves the total fare and does not violate other riders' caps. |
| Monitoring and logs | Track how often caps or fallback rules trigger; frequent triggers may indicate a cost-model or matching problem. |

**Implementation note:** A simple `min(Shapley fare, solo fare)` cap can make the passenger amounts sum to less than the actual pooled cost. The system must specify who covers the shortfall or solve a constrained allocation problem that respects all fare caps and the total-cost requirement. It may be impossible to satisfy both requirements for every arbitrary cost model without changing the ride plan or subsidizing the fare.

---

## Final recommendation

For a real ride-pooling application:

1. Calculate the actual vehicle fare from the route driven.
2. Define the pricing policy clearly: per segment, per seat, per trip, or Shapley-based.
3. Define coalition costs using the cheapest feasible plan, including separate cars where appropriate.
4. Apply route, time, capacity, and detour constraints before accepting a match.
5. Guarantee the advertised solo-fare ceiling through a constrained allocation or subsidy policy.
6. Round to paise and reconcile rounding differences so passenger payments equal the amount charged.

The most important principle is that a fare-sharing method should be **transparent, individually rational where promised, and consistent with the real total cost**.
