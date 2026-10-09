"""
Backend Tests for Health and Simulation Engine
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.simulation_engine import sim_engine

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Pune" in data["city"]
    assert data["currency"] == "₹"

@pytest.mark.asyncio
async def test_simulation_state_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/simulation/state")
    assert response.status_code == 200
    data = response.json()
    assert "engine" in data
    assert "vehicles" in data
    assert "V-101" in data["vehicles"]
    assert "kpis" in data
    assert data["kpis"]["hardDetourCapPct"] == 15.0

@pytest.mark.asyncio
async def test_simulation_control_actions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Pause
        resp_pause = await ac.post("/api/v1/simulation/control", json={"action": "pause"})
        assert resp_pause.status_code == 200
        assert resp_pause.json()["engine"]["status"] == "paused"

        # Resume
        resp_resume = await ac.post("/api/v1/simulation/control", json={"action": "resume", "speed": "2x"})
        assert resp_resume.status_code == 200
        assert resp_resume.json()["engine"]["status"] == "running"
        assert resp_resume.json()["engine"]["tickSpeed"] == "2x"

        # Step
        initial_remaining = sim_engine.state.engine.timeRemainingInWindowSec
        resp_step = await ac.post("/api/v1/simulation/control", json={"action": "step", "step_seconds": 5})
        assert resp_step.status_code == 200

        # Reset
        resp_reset = await ac.post("/api/v1/simulation/control", json={"action": "reset"})
        assert resp_reset.status_code == 200
        assert resp_reset.json()["engine"]["status"] == "running"

def test_websocket_endpoint():
    from starlette.testclient import TestClient
    with TestClient(app) as client:
        with client.websocket_connect("/ws/live") as websocket:
            data = websocket.receive_json()
            assert "engine" in data
            assert "vehicles" in data
            assert data["engine"]["status"] in ["running", "paused"]
