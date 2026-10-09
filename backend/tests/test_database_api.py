"""
Unit and Integration Tests for Database & Supabase API Endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings

@pytest.mark.asyncio
async def test_database_status_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"{settings.API_V1_PREFIX}/database/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "provider" in data
        assert data["provider"] == "Supabase PostgreSQL"
        assert "tables" in data
        assert "ride_requests" in data["tables"]
        assert "vehicles" in data["tables"]
        assert "detour_audits" in data["tables"]

@pytest.mark.asyncio
async def test_database_requests_fallback():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"{settings.API_V1_PREFIX}/database/requests?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "source" in data
        assert "data" in data

@pytest.mark.asyncio
async def test_database_vehicles_fallback():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get(f"{settings.API_V1_PREFIX}/database/vehicles")
        assert response.status_code == 200
        data = response.json()
        assert "source" in data
        assert "data" in data
        assert len(data["data"]) >= 3

@pytest.mark.asyncio
async def test_database_sync_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(f"{settings.API_V1_PREFIX}/database/sync")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
