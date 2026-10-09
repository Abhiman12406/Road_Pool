"""
RidePool AI - Global Simulation Service & State Manager
"""
import asyncio
import math
import time
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket
from app.models.simulation import (
    GlobalSimulationSnapshot, SimulationEngineState, SimulationKPIs,
    SelectionState, ActivePassengerSession, Vehicle, Location, RideRequest, RouteStop,
    DetourAuditEntry, VehicleRoutePlan, OptimizationResult
)
from app.services.route_optimizer import route_optimizer
from app.services.shapley_service import shapley_engine
from app.config import settings
import logging

logger = logging.getLogger(__name__)

PUNE_LANDMARKS = {
    "Shivajinagar": Location(lat=18.5314, lng=73.8446, name="Shivajinagar Hub"),
    "Swargate": Location(lat=18.5018, lng=73.8636, name="Swargate Junction"),
    "Kothrud": Location(lat=18.5074, lng=73.8077, name="Kothrud Stand"),
    "Hinjewadi": Location(lat=18.5913, lng=73.7389, name="Hinjewadi IT Park Phase 1"),
    "Viman Nagar": Location(lat=18.5679, lng=73.9143, name="Viman Nagar Town Centre"),
    "Baner": Location(lat=18.5590, lng=73.7868, name="Baner Road"),
    "Pune Station": Location(lat=18.5289, lng=73.8744, name="Pune Railway Station"),
    "Aundh": Location(lat=18.5580, lng=73.8075, name="Aundh Parihar Chowk"),
}

class SimulationEngine:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.lock = asyncio.Lock()
        self._task: asyncio.Task | None = None
        self.state = self._initialize_default_state()

    def _initialize_default_state(self) -> GlobalSimulationSnapshot:
        v1 = Vehicle(
            vehicle_id="V-101",
            name="Tata Nexon EV • Green Cab",
            capacity=4,
            occupied_seats=1,
            current_location=Location(lat=18.5204, lng=73.8567, name="FC Road, Pune"),
            status="en_route",
            heading_deg=45.0,
            battery_pct=88,
            route_polyline=[
                [18.5204, 73.8567],
                [18.5314, 73.8446],
                [18.5590, 73.7868]
            ],
            planned_stops=[
                RouteStop(
                    stop_id="S-1",
                    request_id="REQ-P101",
                    stop_type="pickup",
                    location=PUNE_LANDMARKS["Shivajinagar"],
                    passenger_name="Aarav Sharma",
                    eta_seconds_from_now=240,
                    completed=False
                ),
                RouteStop(
                    stop_id="S-2",
                    request_id="REQ-P101",
                    stop_type="dropoff",
                    location=PUNE_LANDMARKS["Baner"],
                    passenger_name="Aarav Sharma",
                    eta_seconds_from_now=780,
                    completed=False
                )
            ]
        )

        v2 = Vehicle(
            vehicle_id="V-102",
            name="MG ZS EV • Fleet Swift",
            capacity=4,
            occupied_seats=2,
            current_location=Location(lat=18.5080, lng=73.8350, name="Deccan Gymkhana"),
            status="en_route",
            heading_deg=110.0,
            battery_pct=76,
            route_polyline=[
                [18.5080, 73.8350],
                [18.5018, 73.8636],
                [18.5289, 73.8744]
            ],
            planned_stops=[
                RouteStop(
                    stop_id="S-3",
                    request_id="REQ-P102",
                    stop_type="pickup",
                    location=PUNE_LANDMARKS["Swargate"],
                    passenger_name="Pooja Patil",
                    eta_seconds_from_now=180,
                    completed=False
                ),
                RouteStop(
                    stop_id="S-4",
                    request_id="REQ-P102",
                    stop_type="dropoff",
                    location=PUNE_LANDMARKS["Pune Station"],
                    passenger_name="Pooja Patil",
                    eta_seconds_from_now=600,
                    completed=False
                )
            ]
        )

        v3 = Vehicle(
            vehicle_id="V-103",
            name="BYD e6 • City Shuttle",
            capacity=5,
            occupied_seats=0,
            current_location=Location(lat=18.5700, lng=73.9000, name="Kalyani Nagar"),
            status="idle",
            heading_deg=220.0,
            battery_pct=94,
            route_polyline=[[18.5700, 73.9000]],
            planned_stops=[]
        )

        initial_requests = {
            "REQ-P101": RideRequest(
                request_id="REQ-P101",
                passenger_id="PAX-01",
                passenger_name="Aarav Sharma",
                pickup=PUNE_LANDMARKS["Shivajinagar"],
                dropoff=PUNE_LANDMARKS["Baner"],
                batch_id=100,
                request_time="17:40:00",
                solo_eta_sec=720,
                solo_distance_km=7.8,
                solo_fare_inr=180.0,
                status="en_route_pickup",
                assigned_vehicle_id="V-101",
                pooled_eta_sec=780,
                detour_pct=8.33,
                shapley_fare_inr=132.50
            ),
            "REQ-P102": RideRequest(
                request_id="REQ-P102",
                passenger_id="PAX-02",
                passenger_name="Pooja Patil",
                pickup=PUNE_LANDMARKS["Swargate"],
                dropoff=PUNE_LANDMARKS["Pune Station"],
                batch_id=100,
                request_time="17:42:15",
                solo_eta_sec=540,
                solo_distance_km=4.6,
                solo_fare_inr=122.0,
                status="in_transit",
                assigned_vehicle_id="V-102",
                pooled_eta_sec=600,
                detour_pct=11.11,
                shapley_fare_inr=88.00
            ),
            "REQ-P103": RideRequest(
                request_id="REQ-P103",
                passenger_id="PAX-03",
                passenger_name="Rohan Joshi",
                pickup=PUNE_LANDMARKS["Kothrud"],
                dropoff=PUNE_LANDMARKS["Hinjewadi"],
                batch_id=101,
                request_time="17:45:10",
                solo_eta_sec=1200,
                solo_distance_km=16.4,
                solo_fare_inr=335.0,
                status="waiting_batch",
                assigned_vehicle_id=None,
                pooled_eta_sec=None,
                detour_pct=None,
                shapley_fare_inr=None
            )
        }

        # Initial Detour Guarantee Audits
        initial_audits = [
            DetourAuditEntry(
                request_id="REQ-P101",
                passenger_id="PAX-01",
                passenger_name="Aarav Sharma",
                vehicle_id="V-101",
                pickup_name="Shivajinagar Hub",
                dropoff_name="Baner Road",
                solo_eta_sec=720,
                solo_distance_km=7.8,
                pooled_eta_sec=780,
                pooled_distance_km=8.45,
                actual_detour_pct=8.33,
                max_allowable_detour_pct=15.0,
                is_compliant=True,
                status="compliant_accepted",
                violation_reason=None,
                mathematical_proof="T_solo = 720s (12.0m) | T_pooled = 780s (13.0m) | Detour = ((780 - 720) / 720) * 100% = +8.33% <= 15.00% [COMPLIANT: 48s margin remaining]",
                delay_margin_sec=48,
                timestamp="17:40:00"
            ),
            DetourAuditEntry(
                request_id="REQ-P102",
                passenger_id="PAX-02",
                passenger_name="Pooja Patil",
                vehicle_id="V-102",
                pickup_name="Swargate Junction",
                dropoff_name="Pune Railway Station",
                solo_eta_sec=540,
                solo_distance_km=4.6,
                pooled_eta_sec=600,
                pooled_distance_km=5.11,
                actual_detour_pct=11.11,
                max_allowable_detour_pct=15.0,
                is_compliant=True,
                status="compliant_accepted",
                violation_reason=None,
                mathematical_proof="T_solo = 540s (9.0m) | T_pooled = 600s (10.0m) | Detour = ((600 - 540) / 540) * 100% = +11.11% <= 15.00% [COMPLIANT: 21s margin remaining]",
                delay_margin_sec=21,
                timestamp="17:42:15"
            ),
            DetourAuditEntry(
                request_id="REQ-REJ-01",
                passenger_id="PAX-99",
                passenger_name="Vikram Sen",
                vehicle_id=None,
                pickup_name="Hadapsar Gadital",
                dropoff_name="Hinjewadi IT Park Phase 1",
                solo_eta_sec=1100,
                solo_distance_km=21.4,
                pooled_eta_sec=1350,
                pooled_distance_km=26.2,
                actual_detour_pct=22.73,
                max_allowable_detour_pct=15.0,
                is_compliant=False,
                status="violation_rejected",
                violation_reason="Detour 22.73% exceeds strict 15.0% cap (+7.73% excess)",
                mathematical_proof="T_solo = 1100s (18.3m) | T_pooled = 1350s (22.5m) | Detour = ((1350 - 1100) / 1100) * 100% = +22.73% > 15.00% [REJECTED: +7.73% (85s) excess over 15.0% cap]",
                delay_margin_sec=-85,
                timestamp="17:35:00"
            )
        ]

        initial_opt_result = OptimizationResult(
            vehicle_plans={
                "V-101": VehicleRoutePlan(
                    vehicle_id="V-101",
                    vehicle_name=v1.name,
                    capacity=v1.capacity,
                    current_occupancy=v1.occupied_seats,
                    peak_occupancy=2,
                    stops=v1.planned_stops,
                    route_polyline=v1.route_polyline,
                    total_distance_km=8.45,
                    total_duration_sec=780,
                    assigned_request_ids=["REQ-P101"]
                ),
                "V-102": VehicleRoutePlan(
                    vehicle_id="V-102",
                    vehicle_name=v2.name,
                    capacity=v2.capacity,
                    current_occupancy=v2.occupied_seats,
                    peak_occupancy=2,
                    stops=v2.planned_stops,
                    route_polyline=v2.route_polyline,
                    total_distance_km=5.11,
                    total_duration_sec=600,
                    assigned_request_ids=["REQ-P102"]
                ),
                "V-103": VehicleRoutePlan(
                    vehicle_id="V-103",
                    vehicle_name=v3.name,
                    capacity=v3.capacity,
                    current_occupancy=0,
                    peak_occupancy=0,
                    stops=[],
                    route_polyline=v3.route_polyline,
                    total_distance_km=0.0,
                    total_duration_sec=0,
                    assigned_request_ids=[]
                )
            },
            accepted_request_ids=["REQ-P101", "REQ-P102"],
            rejected_request_ids=["REQ-REJ-01"],
            detour_audits=initial_audits,
            average_detour_pct=9.72,
            max_detour_observed_pct=11.11,
            solver_used="Greedy-Insertion + Google OR-Tools Routing (Capacitated PDP)",
            timestamp="17:42:15"
        )

        # Precompute initial Shapley Fair-Fare pool for V-101 demo
        initial_shapley_pools: Dict[str, Any] = {}
        try:
            pool_v1_reqs = [
                initial_requests["REQ-P101"],
                RideRequest(
                    request_id="REQ-P104",
                    passenger_id="PAX-04",
                    passenger_name="Marcus Chen",
                    pickup=PUNE_LANDMARKS["Aundh"],
                    dropoff=PUNE_LANDMARKS["Baner"],
                    party_size=1,
                    request_time="17:41:00",
                    solo_eta_sec=510,
                    solo_distance_km=4.2,
                    solo_fare_inr=115.0,
                    status="in_transit",
                    assigned_vehicle_id="V-101",
                ),
                RideRequest(
                    request_id="REQ-P105",
                    passenger_id="PAX-05",
                    passenger_name="Sarah Kim",
                    pickup=PUNE_LANDMARKS["Shivajinagar"],
                    dropoff=PUNE_LANDMARKS["Hinjewadi"],
                    party_size=1,
                    request_time="17:42:00",
                    solo_eta_sec=1150,
                    solo_distance_km=14.5,
                    solo_fare_inr=345.0,
                    status="in_transit",
                    assigned_vehicle_id="V-101",
                ),
            ]
            initial_shapley_pools["V-101"] = shapley_engine.compute_shapley_for_pool(
                requests=pool_v1_reqs,
                vehicle=v1,
                batch_id=100,
            )
        except Exception as e:
            logger.error(f"Error computing initial Shapley pool for V-101: {e}")

        return GlobalSimulationSnapshot(
            engine=SimulationEngineState(
                status='running',
                currentWindowId=101,
                windowIntervalSec=settings.DEFAULT_WINDOW_INTERVAL_SEC,
                timeRemainingInWindowSec=settings.DEFAULT_WINDOW_INTERVAL_SEC,
                batchThreshold=settings.DEFAULT_BATCH_SIZE_THRESHOLD,
                batchStatus='intake_open',
                queuedRequestCount=1,
                queuedSeatsCount=1,
                tickSpeed='1x',
                isDemoMode=True,
                activeScenario="Pune Metro Corridor"
            ),
            kpis=SimulationKPIs(
                activePoolsCount=2,
                totalTripsInFlight=3,
                fleetDetourAveragePct=9.72,
                hardDetourCapPct=15.0,
                shapleySavingsPct=27.4,
                totalCoalitionSavingsInr=81.50,
                servedPassengersCount=2,
                rejectedPassengersCount=1
            ),
            selection=SelectionState(
                selectedVehicleId="V-101",
                selectedRequestId="REQ-P101",
                activeStopId="S-1"
            ),
            vehicles={"V-101": v1, "V-102": v2, "V-103": v3},
            requests=initial_requests,
            activePassengerSession=ActivePassengerSession(
                riderId="RIDER-PUNE-ME",
                activeTripRequestId="REQ-P101",
                assignedVehicleId="V-101",
                lifecycleStatus="en_route_pickup",
                guaranteedMaxDetourPct=15.0,
                actualDetourPct=8.33,
                fareSoloDirectInr=180.0,
                fareShapleyPooledInr=132.50
            ),
            optimizationResult=initial_opt_result,
            detourAudits=initial_audits,
            shapleyPools=initial_shapley_pools
        )

    async def register_connection(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send instant snapshot
        await websocket.send_text(self.state.model_dump_json())

    def unregister_connection(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_state(self):
        if not self.active_connections:
            return
        payload = self.state.model_dump_json()
        dead = set()
        for ws in self.active_connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active_connections.discard(ws)

    def set_engine_status(self, status: str):
        if status in ['running', 'paused', 'stepping', 'reset']:
            if status == 'reset':
                self.state = self._initialize_default_state()
            else:
                self.state.engine.status = status

    def set_tick_speed(self, speed: str):
        if speed in ['0.5x', '1x', '2x', '5x']:
            self.state.engine.tickSpeed = speed

    def step_forward(self, seconds: int = 10):
        # Step simulation window forward
        self._tick_step(seconds)

    def advance_vehicle_stop(self, vehicle_id: str):
        """Advances the vehicle to its next planned stop, marking it completed and updating occupancy."""
        veh = self.state.vehicles.get(vehicle_id)
        if not veh or not veh.planned_stops:
            return None
        next_stop = next((s for s in veh.planned_stops if not s.completed), None)
        if next_stop:
            next_stop.completed = True
            veh.current_location = next_stop.location
            req = self.state.requests.get(next_stop.request_id)
            party_count = req.party_size if req else 1
            if next_stop.stop_type == "pickup":
                veh.occupied_seats = min(veh.capacity, veh.occupied_seats + party_count)
                if req:
                    req.status = "in_transit"
                if self.state.activePassengerSession.activeTripRequestId == next_stop.request_id:
                    self.state.activePassengerSession.lifecycleStatus = "in_transit"
            else:
                veh.occupied_seats = max(0, veh.occupied_seats - party_count)
                if req:
                    req.status = "dropped_off"
                if self.state.activePassengerSession.activeTripRequestId == next_stop.request_id:
                    self.state.activePassengerSession.lifecycleStatus = "dropped_off"
            
            if all(s.completed for s in veh.planned_stops):
                veh.status = "idle"
            return next_stop
        return None

    def cancel_ride_request(self, request_id: str, reason: str = "passenger_cancelled") -> Optional[Dict[str, Any]]:
        """Cleanly cancels a passenger's ride request, releases reserved seats, re-optimizes vehicle route,
        and recalculates Shapley fair-fare shares for remaining passengers."""
        req = self.state.requests.get(request_id)
        if not req:
            return None

        # Mark request rejected / cancelled
        req.status = "rejected"
        req.rejection_reason = f"Cancelled ({reason})"

        # If user is the active passenger session rider, update lifecycle status
        if self.state.activePassengerSession.activeTripRequestId == request_id:
            self.state.activePassengerSession.lifecycleStatus = "cancelled"

        veh_id = req.assigned_vehicle_id
        veh = self.state.vehicles.get(veh_id) if veh_id else None
        remaining_pool_result = None
        remaining_requests: List[RideRequest] = []

        if veh:
            # Check if passenger had already been picked up (in transit)
            was_onboard = any(
                s.request_id == request_id and s.stop_type == "pickup" and s.completed
                for s in veh.planned_stops
            ) and not any(
                s.request_id == request_id and s.stop_type == "dropoff" and s.completed
                for s in veh.planned_stops
            )

            if was_onboard:
                party_count = req.party_size or 1
                veh.occupied_seats = max(0, veh.occupied_seats - party_count)

            # Filter out uncompleted stops for the cancelled passenger
            veh.planned_stops = [
                s for s in veh.planned_stops
                if not (s.request_id == request_id and not s.completed)
            ]

            # Re-update polyline for remaining uncompleted stops
            uncompleted_stops = [s for s in veh.planned_stops if not s.completed]
            if uncompleted_stops:
                coords = [[veh.current_location.lat, veh.current_location.lng]]
                for s in uncompleted_stops:
                    coords.append([s.location.lat, s.location.lng])
                veh.route_polyline = coords
            else:
                veh.status = "idle"
                veh.route_polyline = []

            # Find remaining active requests assigned to this vehicle
            remaining_requests = [
                r for r in self.state.requests.values()
                if r.assigned_vehicle_id == veh.vehicle_id
                and r.request_id != request_id
                and r.status in ["matched", "en_route_pickup", "in_transit"]
            ]

            if remaining_requests:
                try:
                    remaining_pool_result = shapley_engine.calculate_shapley_pool(
                        [r.request_id for r in remaining_requests],
                        vehicle_id=veh.vehicle_id,
                        batch_id=self.state.engine.currentWindowId
                    )
                    self.state.shapleyPools[veh.vehicle_id] = remaining_pool_result

                    # Update remaining requests' Shapley fares and detour percentages
                    for r in remaining_requests:
                        if r.request_id in remaining_pool_result.rider_explanations:
                            expl = remaining_pool_result.rider_explanations[r.request_id]
                            r.shapley_fare_inr = expl.reconciled_fare_inr

                    # Update active session fare if active rider is among remaining
                    active_sess_id = self.state.activePassengerSession.activeTripRequestId
                    if active_sess_id and active_sess_id in remaining_pool_result.rider_explanations:
                        active_expl = remaining_pool_result.rider_explanations[active_sess_id]
                        self.state.activePassengerSession.fareShapleyPooledInr = active_expl.reconciled_fare_inr

                except Exception as e:
                    logger.error(f"Error recalculating Shapley pool after cancellation: {e}")
            else:
                # No remaining passengers on this vehicle
                if veh.vehicle_id in self.state.shapleyPools:
                    del self.state.shapleyPools[veh.vehicle_id]

        return {
            "status": "cancelled",
            "request_id": request_id,
            "cancelled_passenger_name": req.passenger_name,
            "vehicle_id": veh.vehicle_id if veh else None,
            "remaining_request_ids": [r.request_id for r in remaining_requests],
            "recalculated_shapley_pool": remaining_pool_result,
            "message": f"{req.passenger_name} cancelled their booking. Vehicle route re-optimized and Shapley fares updated."
        }

    def simulate_corider_cancellation(self, vehicle_id: str, target_request_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Simulates an unexpected co-rider cancellation for evaluator / demo workflows."""
        veh = self.state.vehicles.get(vehicle_id)
        if not veh:
            return None

        active_user_req_id = self.state.activePassengerSession.activeTripRequestId

        # Identify candidate co-riders assigned to this vehicle
        assigned_reqs = [
            r for r in self.state.requests.values()
            if r.assigned_vehicle_id == vehicle_id and r.status in ["matched", "en_route_pickup", "in_transit"]
        ]

        if not assigned_reqs:
            # Check uncompleted planned stops to see if there is any candidate
            req_ids = list(dict.fromkeys(s.request_id for s in veh.planned_stops if not s.completed))
            assigned_reqs = [self.state.requests[rid] for rid in req_ids if rid in self.state.requests]

        if not assigned_reqs:
            return None

        chosen_req_id = target_request_id
        if not chosen_req_id:
            # Pick a co-rider that is NOT the active user if possible
            co_riders = [r for r in assigned_reqs if r.request_id != active_user_req_id]
            if co_riders:
                chosen_req_id = co_riders[-1].request_id
            else:
                chosen_req_id = assigned_reqs[-1].request_id

        return self.cancel_ride_request(chosen_req_id, reason="simulated_co_rider_cancellation")


    def configure_batching(self, window_interval_sec: Optional[int] = None, batch_threshold: Optional[int] = None):
        """Configures rolling window duration and request count threshold."""
        if window_interval_sec is not None and window_interval_sec > 0:
            self.state.engine.windowIntervalSec = window_interval_sec
            if self.state.engine.timeRemainingInWindowSec > window_interval_sec:
                self.state.engine.timeRemainingInWindowSec = window_interval_sec
        if batch_threshold is not None and batch_threshold > 0:
            self.state.engine.batchThreshold = batch_threshold

    def lock_and_dispatch_batch(self, trigger_reason: str = "timer_expired"):
        """
        Locks the current rolling window batch, prevents duplicate admissions,
        and dispatches all buffered requests into the optimization matching pipeline.
        """
        window_id = self.state.engine.currentWindowId
        self.state.engine.batchStatus = "locked_optimizing"
        self.state.engine.lastDispatchReason = trigger_reason
        self.state.engine.lastDispatchedWindowId = window_id

        # Aggregate requests waiting in this batch or earlier
        admitted_requests = [
            r for r in self.state.requests.values()
            if r.status == "waiting_batch" and (r.batch_id is None or r.batch_id <= window_id)
        ]

        # Run constrained route optimization and detour guarantee validation
        if admitted_requests:
            opt_result = route_optimizer.optimize_and_validate_routes(
                vehicles=list(self.state.vehicles.values()),
                requests=admitted_requests,
                max_detour_pct=self.state.kpis.hardDetourCapPct
            )
            self.state.optimizationResult = opt_result
            # Prepend new audits to preserve history
            self.state.detourAudits = opt_result.detour_audits + self.state.detourAudits

            for req in admitted_requests:
                if req.request_id in opt_result.accepted_request_ids:
                    req.status = "matched"
                    # Find assigned vehicle
                    assigned_v = None
                    for v_id, plan in opt_result.vehicle_plans.items():
                        if req.request_id in plan.assigned_request_ids:
                            assigned_v = self.state.vehicles.get(v_id)
                            break
                    if assigned_v:
                        req.assigned_vehicle_id = assigned_v.vehicle_id

                    audit = next((a for a in opt_result.detour_audits if a.request_id == req.request_id), None)
                    if audit and audit.pooled_eta_sec is not None:
                        req.pooled_eta_sec = audit.pooled_eta_sec
                        req.detour_pct = audit.actual_detour_pct
                    else:
                        req.pooled_eta_sec = int(round(req.solo_eta_sec * 1.08))
                        req.detour_pct = 8.0

                    req.shapley_fare_inr = round(req.solo_fare_inr * 0.74, 2)
                    self.state.kpis.servedPassengersCount += 1
                else:
                    req.status = "rejected"
                    req.assigned_vehicle_id = None
                    audit = next((a for a in opt_result.detour_audits if a.request_id == req.request_id), None)
                    if audit:
                        req.rejection_reason = audit.violation_reason
                    else:
                        req.rejection_reason = "Detour > 15% guarantee cap or capacity limit"
                    self.state.kpis.rejectedPassengersCount += 1

            # Update vehicle states from optimization plans
            for v_id, plan in opt_result.vehicle_plans.items():
                if v_id in self.state.vehicles:
                    veh = self.state.vehicles[v_id]
                    veh.planned_stops = plan.stops
                    veh.occupied_seats = plan.current_occupancy
                    if plan.route_polyline and len(plan.route_polyline) >= 2:
                        veh.route_polyline = plan.route_polyline
                    veh.status = "en_route" if len(plan.stops) > 0 else "idle"

            # Compute Combinatorial Shapley Fair-Fare allocations for all matched pools
            for v_id, plan in opt_result.vehicle_plans.items():
                assigned_req_objs = [
                    self.state.requests[rid] for rid in plan.assigned_request_ids
                    if rid in self.state.requests
                ]
                if assigned_req_objs:
                    veh = self.state.vehicles.get(v_id)
                    try:
                        shapley_res = shapley_engine.compute_shapley_for_pool(
                            requests=assigned_req_objs,
                            vehicle=veh,
                            batch_id=window_id,
                        )
                        self.state.shapleyPools[v_id] = shapley_res
                        for req_obj in assigned_req_objs:
                            exp = shapley_res.rider_explanations.get(req_obj.request_id)
                            if exp:
                                req_obj.shapley_fare_inr = exp.reconciled_fare_inr
                    except Exception as e:
                        logger.error(f"Error computing Shapley pool for {v_id}: {e}")

            # Update fleet average detour KPI
            if opt_result.average_detour_pct > 0:
                self.state.kpis.fleetDetourAveragePct = opt_result.average_detour_pct

            # Update KPI savings dynamically from active Shapley pools
            total_solo_sum = 0.0
            total_grand_sum = 0.0
            for pool in self.state.shapleyPools.values():
                if hasattr(pool, 'sum_solo_fares_inr'):
                    total_solo_sum += pool.sum_solo_fares_inr
                    total_grand_sum += pool.grand_coalition_cost_inr
                elif isinstance(pool, dict):
                    total_solo_sum += pool.get('sum_solo_fares_inr', 0.0)
                    total_grand_sum += pool.get('grand_coalition_cost_inr', 0.0)
            if total_solo_sum > 0:
                tot_sav = max(0.0, total_solo_sum - total_grand_sum)
                self.state.kpis.totalCoalitionSavingsInr = round(tot_sav, 2)
                self.state.kpis.shapleySavingsPct = round((tot_sav / total_solo_sum) * 100.0, 1)

        # Update KPIs
        self.state.kpis.activePoolsCount = len([v for v in self.state.vehicles.values() if len(v.planned_stops) > 0])
        self.state.kpis.totalTripsInFlight = len([
            r for r in self.state.requests.values()
            if r.status in ['waiting_batch', 'matched', 'en_route_pickup', 'in_transit']
        ])

        # If active session was in this batch, transition its lifecycle
        active_session = self.state.activePassengerSession
        if active_session.activeTripRequestId in [r.request_id for r in admitted_requests]:
            matched_req = self.state.requests[active_session.activeTripRequestId]
            if matched_req.status == "matched":
                active_session.lifecycleStatus = "matched"
                active_session.actualDetourPct = matched_req.detour_pct or 8.0
                active_session.assignedVehicleId = matched_req.assigned_vehicle_id
            else:
                active_session.lifecycleStatus = "no_match"
                active_session.assignedVehicleId = None

        # Advance rolling window cycle
        self.state.engine.currentWindowId += 1
        self.state.engine.timeRemainingInWindowSec = self.state.engine.windowIntervalSec
        self.state.engine.batchStatus = "intake_open"
        waiting_in_new_window = [
            r for r in self.state.requests.values()
            if r.status == 'waiting_batch' and r.batch_id == self.state.engine.currentWindowId
        ]
        self.state.engine.queuedRequestCount = len(waiting_in_new_window)
        self.state.engine.queuedSeatsCount = sum(r.party_size for r in waiting_in_new_window)

    def run_next_batch(self):
        self.lock_and_dispatch_batch(trigger_reason="manual_dispatch")

    def create_passenger_request(
        self,
        pickup_name: str,
        pickup_lat: float,
        pickup_lng: float,
        dropoff_name: str,
        dropoff_lat: float,
        dropoff_lng: float,
        party_size: int,
        solo_distance_km: float,
        solo_eta_sec: int,
        solo_fare_inr: float,
        passenger_name: str = "Elena Vance (Rider)",
        preferred_pickup_time: Optional[str] = None,
        arrival_deadline: Optional[str] = None,
        special_requirements: Optional[str] = None,
        is_user_request: bool = True,
    ) -> RideRequest:
        if party_size < 1 or party_size > 4:
            raise ValueError(f"Party size must be between 1 and 4 seats. Maximum vehicle capacity is 4. (Requested: {party_size})")

        req_id = f"REQ-P{100 + len(self.state.requests) + 1}"
        pax_id = f"PAX-{len(self.state.requests) + 1:02d}"
        now_str = time.strftime("%H:%M:%S")

        req = RideRequest(
            request_id=req_id,
            passenger_id=pax_id,
            passenger_name=passenger_name,
            pickup=Location(lat=pickup_lat, lng=pickup_lng, name=pickup_name),
            dropoff=Location(lat=dropoff_lat, lng=dropoff_lng, name=dropoff_name),
            party_size=party_size,
            batch_id=self.state.engine.currentWindowId,
            request_time=now_str,
            solo_eta_sec=solo_eta_sec,
            solo_distance_km=solo_distance_km,
            solo_fare_inr=solo_fare_inr,
            status="waiting_batch",
            assigned_vehicle_id=None,
            pooled_eta_sec=None,
            detour_pct=None,
            shapley_fare_inr=None,
            preferred_pickup_time=preferred_pickup_time,
            arrival_deadline=arrival_deadline,
            special_requirements=special_requirements,
        )
        self.state.requests[req_id] = req
        
        # Update queued request and seat counts for current active batch
        waiting_reqs = [
            r for r in self.state.requests.values() 
            if r.status == 'waiting_batch' and r.batch_id == self.state.engine.currentWindowId
        ]
        self.state.engine.queuedRequestCount = len(waiting_reqs)
        self.state.engine.queuedSeatsCount = sum(r.party_size for r in waiting_reqs)
        
        self.state.kpis.totalTripsInFlight = len([
            r for r in self.state.requests.values() 
            if r.status in ['waiting_batch', 'matched', 'en_route_pickup', 'in_transit']
        ])
        
        if is_user_request:
            self.state.activePassengerSession.activeTripRequestId = req_id
            self.state.activePassengerSession.lifecycleStatus = "waiting_batch"
            self.state.activePassengerSession.fareSoloDirectInr = solo_fare_inr
            self.state.activePassengerSession.fareShapleyPooledInr = round(solo_fare_inr * 0.75, 2)
        
        # Check if batch size threshold has been reached
        if self.state.engine.queuedRequestCount >= self.state.engine.batchThreshold:
            self.lock_and_dispatch_batch(trigger_reason="threshold_reached")
        
        return req

    def generate_synthetic_demand(self, count: int = 1) -> List[RideRequest]:
        """Generates realistic synthetic passenger requests along Pune corridors."""
        pune_sample_routes = [
            ("Swargate Junction", 18.5018, 73.8636, "Pune Railway Station", 18.5289, 73.8744, 4.6, 540, 122.0, "Pooja Patil"),
            ("Kothrud Stand", 18.5074, 73.8077, "Viman Nagar Town Centre", 18.5679, 73.9143, 14.5, 1500, 310.0, "Aditya Kulkarni"),
            ("Baner Road", 18.5590, 73.7868, "Hinjewadi IT Park Phase 1", 18.5913, 73.7389, 8.2, 840, 185.0, "Neha Deshmukh"),
            ("Aundh Parihar Chowk", 18.5580, 73.8075, "Magarpatta Cybercity", 18.5135, 73.9318, 16.8, 1800, 360.0, "Rahul Shinde"),
            ("Shivajinagar Hub", 18.5314, 73.8446, "Pune International Airport", 18.5822, 73.9197, 11.4, 1200, 260.0, "Vikram Sen"),
            ("Deccan Gymkhana", 18.5167, 73.8415, "Hadapsar Gadital", 18.4967, 73.9284, 10.2, 1100, 235.0, "Ananya Rao"),
        ]
        
        created = []
        for i in range(count):
            sample = pune_sample_routes[(len(self.state.requests) + i) % len(pune_sample_routes)]
            req = self.create_passenger_request(
                pickup_name=sample[0],
                pickup_lat=sample[1],
                pickup_lng=sample[2],
                dropoff_name=sample[3],
                dropoff_lat=sample[4],
                dropoff_lng=sample[5],
                party_size=1 if i % 3 != 2 else 2,
                solo_distance_km=sample[6],
                solo_eta_sec=sample[7],
                solo_fare_inr=sample[8],
                passenger_name=sample[9],
                is_user_request=False
            )
            created.append(req)
        return created

    def requeue_request(self, request_id: str) -> RideRequest:
        """
        Re-queues a request into the currently active batch window (e.g. after a no-match
        or when the rider chooses to wait longer for the next batch).
        """
        req = self.state.requests.get(request_id)
        if not req:
            raise KeyError(f"Request {request_id} not found")
        
        req.status = "waiting_batch"
        req.batch_id = self.state.engine.currentWindowId
        req.assigned_vehicle_id = None
        req.rejection_reason = None
        req.detour_pct = None
        req.pooled_eta_sec = None
        
        # Ensure the batch window has adequate time (at least 35-45s) for the user
        if self.state.engine.timeRemainingInWindowSec < 20:
            self.state.engine.timeRemainingInWindowSec = self.state.engine.windowIntervalSec
            
        waiting_reqs = [
            r for r in self.state.requests.values() 
            if r.status == 'waiting_batch' and r.batch_id == self.state.engine.currentWindowId
        ]
        self.state.engine.queuedRequestCount = len(waiting_reqs)
        self.state.engine.queuedSeatsCount = sum(r.party_size for r in waiting_reqs)
        
        if self.state.activePassengerSession.activeTripRequestId == request_id:
            self.state.activePassengerSession.lifecycleStatus = "waiting_batch"
            self.state.activePassengerSession.assignedVehicleId = None
            self.state.activePassengerSession.actualDetourPct = None
            
        return req

    def dispatch_solo_ride(self, request_id: str) -> RideRequest:
        """
        Directly dispatches a solo ride for the passenger when no shared match is found
        or when the rider opts for an immediate direct cab.
        """
        req = self.state.requests.get(request_id)
        if not req:
            raise KeyError(f"Request {request_id} not found")
            
        # Find an available or idle vehicle
        assigned_veh = None
        for v in self.state.vehicles.values():
            if v.status == "idle" or v.occupied_seats == 0:
                assigned_veh = v
                break
        if not assigned_veh:
            assigned_veh = list(self.state.vehicles.values())[0]
            
        req.status = "matched"
        req.assigned_vehicle_id = assigned_veh.vehicle_id
        req.detour_pct = 0.0
        req.pooled_eta_sec = req.solo_eta_sec
        req.shapley_fare_inr = req.solo_fare_inr
        req.rejection_reason = None
        
        # Assign stop sequence directly
        assigned_veh.status = "en_route"
        assigned_veh.occupied_seats = req.party_size
        assigned_veh.planned_stops = [
            RouteStop(
                stop_id=f"SOLO-P-{req.request_id}",
                request_id=req.request_id,
                stop_type="pickup",
                location=req.pickup,
                passenger_name=req.passenger_name,
                eta_seconds_from_now=120,
                completed=False
            ),
            RouteStop(
                stop_id=f"SOLO-D-{req.request_id}",
                request_id=req.request_id,
                stop_type="dropoff",
                location=req.dropoff,
                passenger_name=req.passenger_name,
                eta_seconds_from_now=120 + req.solo_eta_sec,
                completed=False
            )
        ]
        assigned_veh.route_polyline = [
            [req.pickup.lat, req.pickup.lng],
            [req.dropoff.lat, req.dropoff.lng]
        ]
        
        if self.state.activePassengerSession.activeTripRequestId == request_id:
            self.state.activePassengerSession.lifecycleStatus = "matched"
            self.state.activePassengerSession.assignedVehicleId = assigned_veh.vehicle_id
            self.state.activePassengerSession.actualDetourPct = 0.0
            self.state.activePassengerSession.fareShapleyPooledInr = req.solo_fare_inr
            
        self.state.kpis.servedPassengersCount += 1
        return req

    def get_shapley_explanation_for_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves or dynamically computes the exact Shapley fair-fare breakdown
        and 7-coalition matrix for a specific ride request.
        """
        req = self.state.requests.get(request_id)
        if not req:
            return None

        # 1. Check if request is part of an active calculated vehicle pool
        for v_id, pool in self.state.shapleyPools.items():
            if hasattr(pool, 'rider_explanations') and request_id in pool.rider_explanations:
                return {
                    "pool": pool,
                    "explanation": pool.rider_explanations[request_id],
                }
            elif isinstance(pool, dict) and request_id in pool.get('rider_explanations', {}):
                return {
                    "pool": pool,
                    "explanation": pool['rider_explanations'][request_id],
                }

        # 2. Dynamic evaluation for waiting / unpooled request:
        # Form a 3-rider coalition evaluation with other available commuters
        other_candidates = [
            r for r in self.state.requests.values()
            if r.request_id != request_id and r.status in ['waiting_batch', 'matched', 'en_route_pickup', 'in_transit']
        ][:2]

        eval_cohort = [req] + other_candidates
        assigned_v = None
        if req.assigned_vehicle_id and req.assigned_vehicle_id in self.state.vehicles:
            assigned_v = self.state.vehicles[req.assigned_vehicle_id]
        else:
            assigned_v = list(self.state.vehicles.values())[0]

        try:
            pool_res = shapley_engine.compute_shapley_for_pool(
                requests=eval_cohort,
                vehicle=assigned_v,
                batch_id=req.batch_id or self.state.engine.currentWindowId,
            )
            return {
                "pool": pool_res,
                "explanation": pool_res.rider_explanations.get(request_id),
            }
        except Exception as e:
            logger.error(f"Error computing dynamic Shapley breakdown for {request_id}: {e}")
            return None

    def _tick_step(self, elapsed: float):
        # Update timer
        remaining = self.state.engine.timeRemainingInWindowSec - elapsed
        if remaining <= 0:
            self.lock_and_dispatch_batch(trigger_reason="timer_expired")
        else:
            self.state.engine.timeRemainingInWindowSec = max(0, int(remaining))

        # In demo mode, if there is a passenger waiting and candidate count is low,
        # simulate natural commuter influx around mid-window (~25s remaining)
        if self.state.engine.isDemoMode and self.state.activePassengerSession.lifecycleStatus == "waiting_batch":
            waiting_reqs = [
                r for r in self.state.requests.values() 
                if r.status == 'waiting_batch' and r.batch_id == self.state.engine.currentWindowId
            ]
            if len(waiting_reqs) == 1 and 20 <= self.state.engine.timeRemainingInWindowSec <= 26:
                self.generate_synthetic_demand(count=1)

        # Vehicle micro-telemetry movement (subtle drift around Pune roads)
        drift_speed = 0.00015 * (elapsed / 1.0)
        for v in self.state.vehicles.values():
            if v.status == "en_route":
                # Small forward motion
                rad = math.radians(v.heading_deg)
                v.current_location.lat += math.cos(rad) * drift_speed
                v.current_location.lng += math.sin(rad) * drift_speed
                # Update first point in polyline to match current position
                if v.route_polyline:
                    v.route_polyline[0] = [v.current_location.lat, v.current_location.lng]

    async def run_loop(self):
        last_tick = time.time()
        while True:
            await asyncio.sleep(1.0)
            now = time.time()
            dt = now - last_tick
            last_tick = now

            if self.state.engine.status == 'running':
                speed_multiplier = {
                    '0.5x': 0.5,
                    '1x': 1.0,
                    '2x': 2.0,
                    '5x': 5.0
                }.get(self.state.engine.tickSpeed, 1.0)

                async with self.lock:
                    self._tick_step(dt * speed_multiplier)
                await self.broadcast_state()

sim_engine = SimulationEngine()
