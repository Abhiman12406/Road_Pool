# 03: Sliding-Window Dynamic Batching & Intake Queue

**What to build:** Implement the dynamic sliding-window request buffer that groups incoming requests into rolling optimization batches instead of greedy instant dispatch. From the user's perspective, when a rider confirms their request, they see a real-time matching countdown screen. Meanwhile, in the Operations Console, the dispatcher views the Request & Batch Manager queue showing incoming requests buffered in the current rolling window, remaining countdown time, and instant triggering when the timer expires or the batch-size threshold is reached.

**Blocked by:** 02: Pune Hybrid Router & Passenger Solo Ride Estimator

**Status:** ready-for-agent

- [ ] Backend sliding-window buffer aggregates incoming requests with configurable window duration (default 15s–30s) and request-count threshold.
- [ ] Requests arriving mid-window remain queued without being dropped or double-processed.
- [ ] Window expiration or threshold trigger locks the current batch and dispatches it to the optimization pipeline.
- [ ] Operations Request & Batch Manager screen (`/ops/batches`) lists pending and admitted requests with live countdown clock and vehicle load indicators.
- [ ] Passenger Matching Waiting screen (`/passenger/waiting`) displays an animated countdown and batch window status.
