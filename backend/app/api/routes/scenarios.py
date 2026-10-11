from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.trips import TripModel
from app.schemas.scenarios import ScenarioInputSchema, ScenarioResultSchema
from app.services.scenarios import run_scenario_simulation

router = APIRouter()

@router.get("/scenarios")
def get_supported_scenarios():
    return [
        {"id": "valid", "name": "Normal Demand & Clean Telematics", "description": "All data integrity checks pass cleanly."},
        {"id": "stale", "name": "Stale Booking Feed (>30m)", "description": "Triggers automated TrustGuard pricing freeze."},
        {"id": "missing", "name": "Missing Base Fare", "description": "Simulates record missing current approved fare field."},
        {"id": "invalid", "name": "Overbooking / Boundary Violation", "description": "Simulates invalid seat counts or out-of-bounds fare rates."}
    ]

@router.post("/scenarios/run", response_model=ScenarioResultSchema)
def run_scenario(payload: ScenarioInputSchema, db: Session = Depends(get_db)):
    trip = db.query(TripModel).filter(TripModel.id == payload.tripId).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{payload.tripId}' not found")
    return run_scenario_simulation(trip, payload)
