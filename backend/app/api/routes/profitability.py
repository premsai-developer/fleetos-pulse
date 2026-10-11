from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.trips import TripModel
from app.models.financials import FinancialRecordModel
from app.schemas.profitability import ProfitabilityAnalysisSchema
from app.services.profitability import calculate_profitability_metrics

router = APIRouter()

@router.get("/analytics/profitability", response_model=ProfitabilityAnalysisSchema)
def get_profitability_analytics(db: Session = Depends(get_db)):
    trips = db.query(TripModel).all()
    records = db.query(FinancialRecordModel).all()
    return calculate_profitability_metrics(trips, records)
