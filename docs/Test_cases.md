# Fair Taxi Fare Sharing Using Shapley Value & Cooperative Game Theory

## 1. Executive Overview

This document provides the authoritative mathematical framework, pricing policy rules, and canonical benchmark test cases for ride-pooling fare allocation in RoadPool. It rigorously formalizes the relationship between segment-based cost splitting and cooperative game theory (Shapley Value), resolves policy decisions for edge cases, defines deterministic rounding reconciliation, and bridges the benchmark models with the real-time production pricing engine.

---

## 2. Mathematical Framework

### 2.1 The Ride-Pooling Cooperative Game $(N, v)$

Let $N = \{1, 2, \dots, n\}$ denote the grand coalition of booked ride requests assigned to a shared vehicle route.

A cooperative game with transferable utility (TU-game) is defined by the pair $(N, v)$, where:
- $N$ is the finite set of players (individual bookings).
- $v: 2^N \to \mathbb{R}_{\ge 0}$ is the **characteristic coalition cost function**, mapping each coalition subset $S \subseteq N$ to the minimum monetary cost required to service all passengers in $S$, with $v(\emptyset) = 0$.

### 2.2 Cheapest Feasible Service Plan (CFSP) Formulation

To prevent inefficient routing externalities and guarantee mathematical subadditivity, $v(S)$ is defined via the **Cheapest Feasible Service Plan (CFSP)**:

$$
v(S) = \min_{\mathcal{P}(S)} \sum_{K \in \mathcal{P}(S)} \text{Cost}(K)
$$

where $\mathcal{P}(S)$ is a partition of $S$ into one or more vehicle dispatches, subject to:
1. **Detour Constraint:** For every rider $i \in K$, the pooled distance $D_{\text{pooled}}(i)$ and duration $T_{\text{pooled}}(i)$ must satisfy:
   $$
   D_{\text{pooled}}(i) \le (1 + \delta) \cdot D_{\text{solo}}(i), \quad \text{with } \delta \le 0.15 \text{ (15% maximum detour)}
   $$
2. **Pickup/Drop Delay Window:** Arrival times at origin $o_i$ and destination $d_i$ must remain within promised pickup and drop time buffers ($\Delta T \le 10 \text{ min}$).
3. **Vehicle Capacity Constraint:** Concurrent passenger occupancy at any point on vehicle route $K$ cannot exceed capacity $C_{\text{veh}}$ (e.g., 4 seats).

#### Consequence of CFSP: Subadditivity
Because the system can always choose to serve disjoint sub-groups via separate vehicle dispatches rather than forcing an inefficient combined detour, CFSP guarantees that $v$ is **subadditive**:

$$
v(S \cup T) \le v(S) + v(T) \quad \forall S, T \subseteq N, \; S \cap T = \emptyset
$$

---

### 2.3 The Shapley Value Allocation

The Shapley Value distributes the total vehicle cost $v(N)$ by assigning each player $i \in N$ their average marginal contribution across all possible arrival permutations $\pi \in \Pi(N)$:

$$
\phi_i(v) = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|!(|N| - |S| - 1)!}{|N|!} \Big[ v(S \cup \{i\}) - v(S) \Big]
$$

#### Axiomatic Guarantees
1. **Efficiency (Budget Balance):** $\sum_{i \in N} \phi_i(v) = v(N)$ (the sum of passenger fares exactly equals the vehicle fare).
2. **Symmetry:** If $v(S \cup \{i\}) = v(S \cup \{j\})$ for all $S \subseteq N \setminus \{i, j\}$, then $\phi_i(v) = \phi_j(v)$.
3. **Dummy Player:** If $v(S \cup \{i\}) = v(S) + v(\{i\})$ for all $S$, then $\phi_i(v) = v(\{i\})$.
4. **Additivity (Linearity):** For any two cost functions $u$ and $w$, $\phi_i(u + w) = \phi_i(u) + \phi_i(w)$.

---

### 2.4 Theorem: Shapley Base Fee Linearity

**Theorem:**  
*Let the total trip cost be decomposed as $v(S) = v_{\text{base}}(S) + v_{\text{dist}}(S)$. If every non-empty coalition $S \ne \emptyset$ incurs the vehicle starting fee $F_{\text{base}}$ exactly once:*
$$
v_{\text{base}}(S) = \begin{cases} 0 & \text{if } S = \emptyset \\ F_{\text{base}} & \text{if } S \ne \emptyset \end{cases}
$$
*then the Shapley value allocation of the base fee is identically equal for all players:*
$$
\phi_i(v_{\text{base}}) = \frac{F_{\text{base}}}{|N|} \quad \forall i \in N
$$

**Proof:**  
Consider player $i$'s marginal contribution to $v_{\text{base}}$:
- If $S = \emptyset$: $v_{\text{base}}(\{i\}) - v_{\text{base}}(\emptyset) = F_{\text{base}} - 0 = F_{\text{base}}$.
- If $S \ne \emptyset$: $v_{\text{base}}(S \cup \{i\}) - v_{\text{base}}(S) = F_{\text{base}} - F_{\text{base}} = 0$.

In a random permutation $\pi$ of $N$, player $i$ appears in the first position with probability $\frac{1}{|N|}$. Therefore:
$$
\phi_i(v_{\text{base}}) = \frac{1}{|N|} \cdot F_{\text{base}} + \left(1 - \frac{1}{|N|}\right) \cdot 0 = \frac{F_{\text{base}}}{|N|}
$$
By the Linearity axiom, the base fee is always divided equally among all pooled participants, rigorously justifying segment-based starting fee rules under cooperative game theory. $\blacksquare$

---

### 2.5 Equivalence with Segment-Based Cost Splitting (Airport Game Isomorphism)

When a single vehicle travels a linear ordered sequence of route segments $M = \{m_1, m_2, \dots, m_k\}$, where each segment $m_j$ has distance cost $c_j$ and is traversed by passenger subset $P_j \subseteq N$:

1. Total vehicle distance cost is $v_{\text{dist}}(N) = \sum_{j=1}^k c_j$.
2. For each segment $m_j$, define the simple game $v_j(S) = c_j$ if $S \cap P_j \ne \emptyset$, and $0$ otherwise.
3. By the Airport Game theorem (Littlechild & Owen, 1973), the Shapley value of game $v_j$ splits cost $c_j$ equally among players present on that segment:
   $$
   \phi_i(v_j) = \begin{cases} \frac{c_j}{|P_j|} & \text{if } i \in P_j \\ 0 & \text{if } i \notin P_j \end{cases}
   $$
4. By linearity, the total distance fare for passenger $i$ is:
   $$
   \phi_i(v_{\text{dist}}) = \sum_{j: i \in P_j} \frac{c_j}{|P_j|}
   $$

Thus, on linear routes with no off-route detours, **segment-based proportional splitting is mathematically identical to the Shapley Value**.

---

## 3. Policy Decisions

### 3.1 Party Bookings: Booking-as-Player Model (Case 3)

When a single booking request includes multiple seats (e.g., rider A books for 2 passengers, A1 and A2):
* **Policy Standard:** The cooperative game $(N, v)$ operates on **Booking Entities**, not individual physical seats. Player $A \in N$ represents the entire party booking.
* **Solo Reference Fare:** $v(\{A\})$ represents the cost of serving party $A$ in a private vehicle (which accommodates both seats for one starting fee and trip distance).
* **Party Member Apportionment:** Once $\phi_A(v)$ is computed, the booking fare is charged directly to booking account $A$, or split equally per seat:
  $$
  \text{Fare}(A_k) = \frac{\phi_A(v)}{\text{seats}_A}
  $$

### 3.2 Solo-Fare Ceiling & Constrained Rebalancing (Case 5)

Under certain detour configurations, a pure Shapley allocation can violate individual rationality ($\phi_i(v) > v(\{i\})$). RoadPool resolves this via a two-stage mechanism:

#### 1. Hard Matching Prefilter
The dispatch engine strictly rejects pool candidates unless the pooled trip produces strict total cost savings:
$$
v(N) < \sum_{i \in N} v(\{i\})
$$
If $v(N) \ge \sum v(\{i\})$, the request is dispatched as separate solo vehicles.

#### 2. Constrained Rebalancing Algorithm
If any passenger's preliminary Shapley value $\phi_i$ exceeds their solo fare $v(\{i\})$:
1. Clamp the overcharged rider's fare: $\phi_i' = v(\{i\})$.
2. Calculate the total budget shortfall:
   $$
   \Delta = \sum_{i: \phi_i > v(\{i\})} (\phi_i - v(\{i\}))
   $$
3. Identify unconstrained riders $U = \{j \in N \mid \phi_j < v(\{j\})\}$.
4. Compute each unconstrained rider's headroom: $H_j = v(\{j\}) - \phi_j$.
5. Reallocate $\Delta$ across $U$ proportional to headroom:
   $$
   \phi_j' = \phi_j + \Delta \cdot \frac{H_j}{\sum_{k \in U} H_k}
   $$
This preserves budget balance ($\sum \phi_i' = v(N)$) while guaranteeing $\phi_i' \le v(\{i\})$ for all riders.

---

### 3.3 Financial Rounding: Largest Remainder Method (Hare-Niemeyer)

To reconcile fractional paise without arbitrariness:
1. Convert each continuous allocation $\phi_i'$ into integer paise:
   $$
   P_i = \lfloor 100 \cdot \phi_i' \rfloor, \quad R_i = (100 \cdot \phi_i') - P_i
   $$
2. Determine total paise required: $P_{\text{total}} = \text{round}(100 \cdot v(N))$.
3. Compute the unallocated paise remainder:
   $$
   K = P_{\text{total}} - \sum_{i \in N} P_i
   $$
4. Sort riders by descending fractional remainder $R_i$. Break ties deterministically by passenger booking ID.
5. Add $1$ paisa to the top $K$ riders.
6. Set final payable fare: $\text{Fare}_i = \frac{P_i + \mathbf{1}_{\{i \text{ in top } K\}}}{100}$.

---

## 4. Canonical Benchmark Rate Model

For Cases 1 through 5, the canonical benchmark tariff is:
* **Starting Base Fee ($F_{\text{base}}$):** ₹20.00
* **Distance Rate ($r_{\text{dist}}$):** ₹10.00 per km
* **Vehicle Meter Formula:** $\text{Fare} = 20 + (10 \times \text{Distance in km})$

---

## 5. Canonical Benchmark Test Cases

---

### Case 1: Sequential Boarding, Common Destination (A, B, C $\to$ Z)

#### Route Topology
```text
A ----4 km---- B ----3 km---- C ----5 km---- Z
```

* **Passenger A:** Boards at km 0, exits at km 12 (Travels 12 km). Solo Fare: $20 + (10 \times 12) = \mathbf{₹140.00}$.
* **Passenger B:** Boards at km 4, exits at km 12 (Travels 8 km). Solo Fare: $20 + (10 \times 8) = \mathbf{₹100.00}$.
* **Passenger C:** Boards at km 7, exits at km 12 (Travels 5 km). Solo Fare: $20 + (10 \times 5) = \mathbf{₹70.00}$.
* **Vehicle Total Distance:** $4 + 3 + 5 = 12 \text{ km}$.
* **Total Vehicle Fare:** $20 + (10 \times 12) = \mathbf{₹140.00}$.

#### Segment Allocation Breakdown
| Segment | Length | Cost | Onboard Riders | Cost per Rider | Allocation |
|---|---:|---:|---|---:|---|
| Base Fee | — | ₹20.00 | A, B, C | ₹6.6667 | A: ₹6.6667, B: ₹6.6667, C: ₹6.6667 |
| A $\to$ B | 4 km | ₹40.00 | A | ₹40.0000 | A: ₹40.0000 |
| B $\to$ C | 3 km | ₹30.00 | A, B | ₹15.0000 | A: ₹15.0000, B: ₹15.0000 |
| C $\to$ Z | 5 km | ₹50.00 | A, B, C | ₹16.6667 | A: ₹16.6667, B: ₹16.6667, C: ₹16.6667 |
| **Sum** | **12 km** | **₹140.00** | — | — | **A: ₹78.3333, B: ₹38.3333, C: ₹23.3333** |

#### Hare-Niemeyer Rounding Reconciliation
1. Floor paise: A: 7833 paise ($R_A = 0.333$), B: 3833 paise ($R_B = 0.333$), C: 2333 paise ($R_C = 0.333$).
2. Sum of floors = $13999$ paise. Target = $14000$ paise. Remainder $K = 1$ paisa.
3. Tie-breaking by longest solo distance ($A > B > C$): A receives the $+1$ paisa.

#### Final Reconciled Settlement
| Passenger | Continuous Share | Reconciled Fare | Solo Fare | Total Savings | % Saved |
|---|---:|---:|---:|---:|---:|
| **A** | ₹78.3333 | **₹78.34** | ₹140.00 | ₹61.66 | 44.04% |
| **B** | ₹38.3333 | **₹38.33** | ₹100.00 | ₹61.67 | 61.67% |
| **C** | ₹23.3333 | **₹23.33** | ₹70.00 | ₹46.67 | 66.67% |
| **Total** | **₹140.00** | **₹140.00** | **₹310.00** | **₹170.00** | **54.84%** |

---

### Case 2: Interior Overlapping Segments (A Exits Before B)

#### Route Topology
```text
A ----3 km---- B ----5 km---- A' ----4 km---- B'
```

* **Passenger A:** Origin $A$ (km 0) to Destination $A'$ (km 8). Distance = 8 km. Solo Fare: $20 + (8 \times 10) = \mathbf{₹100.00}$.
* **Passenger B:** Origin $B$ (km 3) to Destination $B'$ (km 12). Distance = 9 km. Solo Fare: $20 + (9 \times 10) = \mathbf{₹110.00}$.
* **Vehicle Total Distance:** $3 + 5 + 4 = 12 \text{ km}$.
* **Total Vehicle Fare:** $20 + (12 \times 10) = \mathbf{₹140.00}$.

#### Characteristic Coalition Function Values
* $v(\emptyset) = 0$
* $v(\{A\}) = 20 + (8 \times 10) = \mathbf{₹100.00}$
* $v(\{B\}) = 20 + (9 \times 10) = \mathbf{₹110.00}$
* $v(\{A, B\}) = 20 + (12 \times 10) = \mathbf{₹140.00}$

#### Exact Shapley Value Derivation
$$
\phi_A(v) = \frac{1}{2} [v(\{A\}) - v(\emptyset)] + \frac{1}{2} [v(\{A, B\}) - v(\{B\})] = \frac{1}{2}(100) + \frac{1}{2}(140 - 110) = 50 + 15 = \mathbf{₹65.00}
$$
$$
\phi_B(v) = \frac{1}{2} [v(\{B\}) - v(\emptyset)] + \frac{1}{2} [v(\{A, B\}) - v(\{A\})] = \frac{1}{2}(110) + \frac{1}{2}(140 - 100) = 55 + 20 = \mathbf{₹75.00}
$$

#### Segment Allocation Check
* Base fee: ₹20 $\div 2 =$ ₹10 each.
* Segment $A \to B$ (3 km, ₹30): Borne solely by A ($₹30$).
* Segment $B \to A'$ (5 km, ₹50): Shared by A & B ($₹25$ each).
* Segment $A' \to B'$ (4 km, ₹40): Borne solely by B ($₹40$).
* Total A: $10 + 30 + 25 = \mathbf{₹65.00}$. Total B: $10 + 25 + 40 = \mathbf{₹75.00}$.

#### Final Reconciled Settlement
| Passenger | Distance | Reconciled Fare | Solo Fare | Total Savings | % Saved |
|---|---:|---:|---:|---:|---:|
| **A** | 8 km | **₹65.00** | ₹100.00 | ₹35.00 | 35.00% |
| **B** | 9 km | **₹75.00** | ₹110.00 | ₹35.00 | 31.82% |
| **Total** | **12 km** | **₹140.00** | **₹210.00** | **₹70.00** | **33.33%** |

---

### Case 3: Multi-Passenger Party Bookings (A & C Travel Together, B Joins)

#### Route Topology
```text
km 0                      km 3                        km 8                      km 11
|-------------------------|---------------------------|-------------------------|
Party AC Boards           B Boards                    Party AC Exits            B Exits
```

* **Party AC (2 Seats, 1 Booking):** Origin km 0 to Destination km 8 (8 km). Solo Party Fare: $20 + (8 \times 10) = \mathbf{₹100.00}$.
* **Passenger B (1 Seat):** Origin km 3 to Destination km 11 (8 km). Solo Fare: $20 + (8 \times 10) = \mathbf{₹100.00}$.
* **Vehicle Total Distance:** 11 km.
* **Total Vehicle Fare:** $20 + (11 \times 10) = \mathbf{₹130.00}$.

#### Characteristic Function under Booking-as-Player Model: $N = \{\text{Party}_{AC}, B\}$
* $v(\{\text{Party}_{AC}\}) = ₹100.00$
* $v(\{B\}) = ₹100.00$
* $v(\{\text{Party}_{AC}, B\}) = ₹130.00$

#### Shapley Allocation to Bookings
$$
\phi_{\text{Party}_{AC}} = \frac{1}{2}(100) + \frac{1}{2}(130 - 100) = 50 + 15 = \mathbf{₹65.00}
$$
$$
\phi_B = \frac{1}{2}(100) + \frac{1}{2}(130 - 100) = 50 + 15 = \mathbf{₹65.00}
$$

#### Intra-Party Seat Apportionment
* Rider A (Seat 1): $65.00 \div 2 = \mathbf{₹32.50}$
* Rider C (Seat 2): $65.00 \div 2 = \mathbf{₹32.50}$

#### Comparison with Seat-as-Player Alternative
| Metric | Policy 1: Booking-as-Player (Standard) | Policy 2: Seat-as-Player |
|---|---:|---:|
| **Rider A** | **₹32.50** | ₹38.33 |
| **Rider C** | **₹32.50** | ₹38.33 |
| **Combined AC Party** | **₹65.00** | **₹76.67** |
| **Passenger B** | **₹65.00** | **₹53.33** |
| **Total** | **₹130.00** | **₹130.00** |

*Rationale:* The Booking-as-Player model prevents penalizing party travelers for riding together and mirrors commercial cab pooling policies where a 2-seat party booking is treated as a unified commercial party.

---

### Case 4: Staggered Boarding and Exits (A $\to$ B $\to$ A' $\to$ C $\to$ Z)

#### Route Topology
```text
A ----4 km---- B ----3 km---- A' ----2 km---- C ----5 km---- Z
```

* **Passenger A:** Boards at km 0, exits at km 7 (7 km). Solo Fare: $20 + (7 \times 10) = \mathbf{₹90.00}$.
* **Passenger B:** Boards at km 4, exits at km 14 (10 km). Solo Fare: $20 + (10 \times 10) = \mathbf{₹120.00}$.
* **Passenger C:** Boards at km 9, exits at km 14 (5 km). Solo Fare: $20 + (5 \times 10) = \mathbf{₹70.00}$.
* **Vehicle Total Distance:** $4 + 3 + 2 + 5 = 14 \text{ km}$.
* **Total Vehicle Fare:** $20 + (14 \times 10) = \mathbf{₹160.00}$.

#### Segment Allocation Breakdown
By the Shapley Base Fee Linearity Theorem, the ₹20 base fee is split equally among all 3 participating riders ($₹20 \div 3 = ₹6.6667$ each):

| Segment | Distance | Cost | Onboard Riders | Allocation |
|---|---:|---:|---|---|
| Base Fee | — | ₹20.00 | A, B, C | A: ₹6.6667, B: ₹6.6667, C: ₹6.6667 |
| A $\to$ B | 4 km | ₹40.00 | A | A: ₹40.0000 |
| B $\to$ A' | 3 km | ₹30.00 | A, B | A: ₹15.0000, B: ₹15.0000 |
| A' $\to$ C | 2 km | ₹20.00 | B | B: ₹20.0000 |
| C $\to$ Z | 5 km | ₹50.00 | B, C | B: ₹25.0000, C: ₹25.0000 |
| **Sum** | **14 km** | **₹160.00** | — | **A: ₹61.6667, B: ₹66.6667, C: ₹31.6667** |

#### Hare-Niemeyer Rounding Reconciliation
* Floor paise: A: 6166 paise ($R_A = 0.667$), B: 6666 paise ($R_B = 0.667$), C: 3166 paise ($R_C = 0.667$).
* Sum of floors = $15998$ paise. Target = $16000$ paise. Remainder $K = 2$ paise.
* Remainder distribution by solo distance priority ($B: 10\text{km} > A: 7\text{km} > C: 5\text{km}$): B and A each receive $+1$ paisa.

#### Final Reconciled Settlement
| Passenger | Continuous Share | Reconciled Fare | Solo Fare | Total Savings | % Saved |
|---|---:|---:|---:|---:|---:|
| **A** | ₹61.6667 | **₹61.67** | ₹90.00 | ₹28.33 | 31.48% |
| **B** | ₹66.6667 | **₹66.68** | ₹120.00 | ₹53.32 | 44.43% |
| **C** | ₹31.6667 | **₹31.65** | ₹70.00 | ₹38.35 | 54.79% |
| **Total** | **₹160.00** | **₹160.00** | **₹280.00** | **₹120.00** | **42.86%** |

---

### Case 5: Pathological Detour & Constrained Rebalancing

#### Scenario Description
Consider three passengers where Passenger B has an origin and destination completely disjoint from A and C:
* **Passenger B:** km 0 to km 5. Solo: $20 + (5 \times 10) = \mathbf{₹70.00}$.
* **Passenger A:** km 10 to km 16. Solo: $20 + (6 \times 10) = \mathbf{₹80.00}$.
* **Passenger C:** km 10 to km 13. Solo: $20 + (3 \times 10) = \mathbf{₹50.00}$.
* $\sum v(\{i\}) = 70 + 80 + 50 = \mathbf{₹200.00}$.

#### The Pathological Single-Car Routing Trap
If a naive dispatcher forces all three passengers into one vehicle driving from km 0 to km 16 (16 km):
* Forced single vehicle cost = $20 + (16 \times 10) = \mathbf{₹180.00}$.
* Under unconstrained sub-coalition routing, Passenger B incurs immense deadhead travel:
  * Coalition costs: $v(A) = 80, v(B) = 70, v(C) = 50, v(AC) = 80, v(AB) = 180, v(BC) = 150, v(ABC) = 180$.
  * Pure Shapley values evaluate to:
    $$\phi_A = \mathbf{₹61.67}, \quad \phi_B = \mathbf{₹86.67}, \quad \phi_C = \mathbf{₹31.67}$$
* **Violation of Individual Rationality:** $\phi_B = ₹86.67 > v(\{B\}) = ₹70.00$! Passenger B is charged ₹16.67 *more* than their private solo ride.

#### CFSP & RoadPool Safeguard Resolution

##### Stage 1: CFSP Multi-Vehicle Partitioning
Under CFSP, the system evaluates partitioned service:
$$
\text{Cost}(\{B\} \cup \{A, C\}) = v(\{B\}) + v(\{A, C\}) = 70 + 80 = \mathbf{₹150.00} < ₹180.00
$$
The CFSP optimization chooses **two separate vehicles**: Car 1 serves B for ₹70, and Car 2 serves A and C for ₹80. Pooling B with A and C is automatically discarded as suboptimal.

##### Stage 2: Constrained Rebalancing Demonstration
Suppose an operational constraint temporarily forced vehicle cost $v(N) = ₹180.00$ with preliminary Shapley allocations $\phi = [A: 61.67, B: 86.67, C: 31.67]$:
1. **Solo Ceilings:** $v(A) = 80, v(B) = 70, v(C) = 50$.
2. **Cap Violation:** $\phi_B = 86.67 > 70.00$. Clamped fare $\phi_B' = \mathbf{₹70.00}$.
3. **Shortfall:** $\Delta = 86.67 - 70.00 = \mathbf{₹16.67}$.
4. **Headroom in Unconstrained Set $\{A, C\}$:**
   * $H_A = 80.00 - 61.67 = ₹18.33$
   * $H_C = 50.00 - 31.67 = ₹18.33$
   * Total Headroom $= 18.33 + 18.33 = ₹36.66$.
5. **Reallocation:**
   * Proportional share for A: $16.67 \times \frac{18.33}{36.66} = ₹8.335 \implies \phi_A' = 61.67 + 8.335 = \mathbf{₹70.005}$
   * Proportional share for C: $16.67 \times \frac{18.33}{36.66} = ₹8.335 \implies \phi_C' = 31.67 + 8.335 = \mathbf{₹39.995}$
6. **Hare-Niemeyer Reconciled Settlement:**
   * Passenger A: **₹70.01** (Saving ₹9.99 vs solo ₹80)
   * Passenger B: **₹70.00** (Zero penalty vs solo ₹70)
   * Passenger C: **₹39.99** (Saving ₹10.01 vs solo ₹50)
   * Total: $70.01 + 70.00 + 39.99 = \mathbf{₹180.00}$.

---

## 6. General Production Cost Model (Pune Real-World Architecture)

In the production backend (`backend/app/services/router_service.py`), fare estimation incorporates distance, duration, traffic congestion, and surge pricing:

### 6.1 Tariff Parameters
| Parameter | Symbol | Production Value |
|---|---|---:|
| Base Flag-Drop Fare | $F_{\text{base}}$ | ₹40.00 |
| Distance Tariff | $r_{\text{dist}}$ | ₹18.00 / km |
| Travel Time Tariff | $r_{\text{time}}$ | ₹2.50 / min |
| Surge Multiplier | $\lambda_{\text{surge}}$ | $\ge 1.00$ |

### 6.2 Solo Reference Fare Function
For any rider $i$ with solo road distance $d_i$ (km) and estimated uncongested transit time $t_i$ (min):
$$
v(\{i\}) = \lambda_{\text{surge}} \cdot \Big[ F_{\text{base}} + (r_{\text{dist}} \cdot d_i) + (r_{\text{time}} \cdot t_i) \Big]
$$

### 6.3 Pooled Vehicle Route Cost Function
For a vehicle route servicing coalition $S$ with total distance $D(S)$ and total trip duration $T(S)$:
$$
v(S) = \lambda_{\text{surge}} \cdot \Big[ F_{\text{base}} + (r_{\text{dist}} \cdot D(S)) + (r_{\text{time}} \cdot T(S)) \Big]
$$

Because both distance and time are linear metrics across route segments, the Shapley Linearity Theorem ensures that both the distance fare component and time fare component decompose additively:
$$
\phi_i(v) = \frac{\lambda_{\text{surge}} F_{\text{base}}}{|S|} + \phi_i(v_{\text{dist}}) + \phi_i(v_{\text{time}})
$$

---

## 7. Automated Test Verification Matrix

This matrix provides the exact numerical reference values required for the backend pytest test suite (`backend/tests/test_fare_allocation.py`):

| Test Case | Players $N$ | Total Pooled Fare $v(N)$ | Sum of Solo Fares | Final Reconciled Fares (INR) | Budget Balance Check | Individual Rationality Check |
|---|---|---:|---:|---|:---:|:---:|
| **Case 1** | A, B, C | ₹140.00 | ₹310.00 | A: ₹78.34, B: ₹38.33, C: ₹23.33 | $\sum = ₹140.00$ | All save $> 44\%$ |
| **Case 2** | A, B | ₹140.00 | ₹210.00 | A: ₹65.00, B: ₹75.00 | $\sum = ₹140.00$ | Both save $\ge 31.8\%$ |
| **Case 3** | AC (party), B | ₹130.00 | ₹200.00 | A: ₹32.50, C: ₹32.50, B: ₹65.00 | $\sum = ₹130.00$ | All save $\ge 35\%$ |
| **Case 4** | A, B, C | ₹160.00 | ₹280.00 | A: ₹61.67, B: ₹66.68, C: ₹31.65 | $\sum = ₹160.00$ | All save $> 31\%$ |
| **Case 5 (Rebalanced)** | A, B, C | ₹180.00 | ₹200.00 | A: ₹70.01, B: ₹70.00, C: ₹39.99 | $\sum = ₹180.00$ | All $\le$ Solo Fare |
