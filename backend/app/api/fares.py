"""
Fares and Shapley Fair-Fare Receipt API Endpoints
Provides explainable game-theoretic cost allocations and receipts for individual requests.
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from app.services.simulation_engine import sim_engine

router = APIRouter(prefix="/fares", tags=["Fares & Receipts"])

@router.get("/{request_id}")
async def get_fare_explanation_and_receipt(request_id: str):
    """
    Returns the complete game-theoretic Shapley value breakdown, 7-coalition matrix,
    marginal contribution tree, and penny-level reconciliation receipt for a passenger.
    """
    explanation_bundle = sim_engine.get_shapley_explanation_for_request(request_id)
    if not explanation_bundle or not explanation_bundle.get("explanation"):
        raise HTTPException(
            status_code=404,
            detail=f"Fare explanation for request '{request_id}' not found. Please ensure request exists."
        )

    return {
        "status": "success",
        "request_id": request_id,
        "explanation": explanation_bundle["explanation"],
        "pool": explanation_bundle["pool"],
    }
