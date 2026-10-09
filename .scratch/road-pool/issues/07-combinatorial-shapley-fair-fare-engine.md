# 07: Combinatorial Shapley Fair-Fare Engine & Explainable Slide-Over Sheet

**What to build:** The cooperative game-theoretic cost allocation engine and explainable rider breakdown. The backend calculates true vehicle routing costs for all non-empty coalitions ($\{A\}, \{B\}, \{C\}, \{AB\}, \{AC\}, \{BC\}, \{ABC\}$) and computes exact marginal contributions using the axiomatic Shapley formula. In the UI, riders can open an expandable "Why am I paying this fare?" sheet featuring plain-English explanation, the 7-coalition cost matrix, marginal contribution tree, penny-level reconciliation ($\sum \phi_i = c(N)$), and savings vs. solo fare.

**Blocked by:** 06: Initial Buffer Window with Live Commuter Influx & Fast-Forward Solver

**Status:** closed

- [x] Backend computes minimum routing cost $c(S)$ for all non-empty subsets $S \subseteq \{A, B, C\}$ using consistent OSRM/Pune road distance and duration functions.
- [x] Computes exact Shapley values $\phi_i = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|!(|N|-|S|-1)!}{|N|!} [c(S \cup \{i\}) - c(S)]$.
- [x] Reconciles individual fares to ensure the sum of displayed fares equals the total allocated trip cost within ₹0.01.
- [x] Individual Shapley fare is strictly less than or equal to solo fare (individual rationality guaranteed).
- [x] Expandable "Why am I paying this fare?" slide-over sheet displays simple explanation, 7-row coalition matrix, marginal contributions, and savings in ₹ and %.
