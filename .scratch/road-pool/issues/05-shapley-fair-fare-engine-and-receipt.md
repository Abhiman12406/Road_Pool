# 05: Exact Shapley Fair-Fare Engine & Explainable Fare Receipt

**What to build:** Implement the cooperative game-theory cost-sharing engine and explainable rider fare breakdown. From the user's perspective, accepted passengers receive an explainable fare receipt proving that sharing the ride saves them money compared to a solo ride, with an itemized marginal contribution breakdown. In the Operations Console, dispatchers can view the Shapley cost matrix, verifying efficiency, symmetry, and subadditivity across all passenger coalitions.

**Blocked by:** 04: Route Optimization & Strict <=15% Detour Validator

**Status:** ready-for-agent

- [ ] Backend computes exact permutation-based Shapley values for small passenger coalitions (n <= 5) using the minimum routing cost function.
- [ ] Enforces individual-rationality price ceiling: adjusted payable fare never exceeds direct solo fare ceiling.
- [ ] Fare reconciliation ensures the sum of payable fares reconciles with declared target route recovery cost within ₹0.01.
- [ ] Operations Fair Fare screen (`/ops/fair-fares`) displays the coalition cost breakdown, marginal contribution tree, and subadditivity audit.
- [ ] Passenger Offer and Receipt screens (`/passenger/offer`, `/passenger/receipt`) show solo fare, pooled fair fare, savings in ₹ and %, detour percentage, and transparent mathematical explanation.
