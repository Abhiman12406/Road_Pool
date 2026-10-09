"""
RidePool AI - Global Simulation Service & State Manager
"""
import asyncio
import math
import time
from typing import Dict, List, Set, Any
from fastapi import WebSocket
from app.models.simulation import (
    GlobalSimulationSnapshot, SimulationEngineState, SimulationKPIs,
    SelectionState, ActivePassengerSession, Vehicle, Location, RideRequest, RouteStop
)
from app.config import settings

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

        return GlobalSimulationSnapshot(
            engine=SimulationEngineState(
                status='running',
                currentWindowId=101,
                windowIntervalSec=settings.DEFAULT_WINDOW_INTERVAL_SEC,
                timeRemainingInWindowSec=22,
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
                rejectedPassengersCount=0
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
            )
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

    def run_next_batch(self):
        # Advance window and trigger solver
        self.state.engine.currentWindowId += 1
        self.state.engine.timeRemainingInWindowSec = self.state.engine.windowIntervalSec
        # Simulate batch admission of waiting request
        if "REQ-P103" in self.state.requests:
            req = self.state.requests["REQ-P103"]
            req.status = "matched"
            req.assigned_vehicle_id = "V-103"
            req.pooled_eta_sec = 1320
            req.detour_pct = 10.0
            req.shapley_fare_inr = 245.0
            self.state.vehicles["V-103"].status = "en_route"
            self.state.vehicles["V-103"].occupied_seats = 1
            self.state.kpis.servedPassengersCount += 1
            self.state.kpis.activePoolsCount = 3

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
        passenger_name: str = "Elena Vance (Rider)"
    ) -> RideRequest:
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
            request_time=now_str,
            solo_eta_sec=solo_eta_sec,
            solo_distance_km=solo_distance_km,
            solo_fare_inr=solo_fare_inr,
            status="waiting_batch",
            assigned_vehicle_id=None,
            pooled_eta_sec=None,
            detour_pct=None,
            shapley_fare_inr=None,
        )
        self.state.requests[req_id] = req
        self.state.kpis.totalTripsInFlight = len([
            r for r in self.state.requests.values() 
            if r.status in ['waiting_batch', 'matched', 'en_route_pickup', 'in_transit']
        ])
        
        self.state.activePassengerSession.activeTripRequestId = req_id
        self.state.activePassengerSession.lifecycleStatus = "waiting_batch"
        self.state.activePassengerSession.fareSoloDirectInr = solo_fare_inr
        self.state.activePassengerSession.fareShapleyPooledInr = round(solo_fare_inr * 0.75, 2)
        
        return req

    def _tick_step(self, elapsed: float):
        # Update timer
        remaining = self.state.engine.timeRemainingInWindowSec - elapsed
        if remaining <= 0:
            self.state.engine.currentWindowId += 1
            self.state.engine.timeRemainingInWindowSec = self.state.engine.windowIntervalSec
        else:
            self.state.engine.timeRemainingInWindowSec = max(0, int(remaining))

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
