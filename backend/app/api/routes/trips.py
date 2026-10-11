import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.trips import TripModel
from app.schemas.trips import TripSchema
from app.schemas.forecast import DemandForecastSchema
from app.services.forecast import calculate_forecast

router = APIRouter()

def parse_trip(t: TripModel) -> TripSchema:
    trend = []
    if t.trendJson:
        try:
            trend = json.loads(t.trendJson)
        except Exception:
            trend = [10, 15, 20, 25, t.booked]
    else:
        trend = [10, 15, 20, 25, t.booked]

    return TripSchema(
        id=t.id,
        origin=t.origin,
        destination=t.destination,
        route=t.route,
        departure=t.departure,
        hoursToDeparture=t.hoursToDeparture,
        vehicleType=t.vehicleType or "Volvo B11R Multi-Axle",
        driverName=t.driverName or "Rajesh Kumar",
        capacity=t.capacity,
        booked=t.booked,
        fare=t.fare,
        baseFare=t.baseFare,
        minFare=t.minFare,
        maxFare=t.maxFare,
        trend=trend,
        expectedAdditional=t.expectedAdditional,
        feedAgeMin=t.feedAgeMin,
        operatingCost=t.operatingCost,
        distanceKm=t.distanceKm,
        latentDemandEstimate=t.latentDemandEstimate,
        signalConfidence=t.signalConfidence or 0.85,
        unservedDemandObserved=t.unservedDemandObserved,
        status=t.status or "active"
    )

@router.get("/trips", response_model=List[TripSchema])
def get_trips(
    search: Optional[str] = Query(None),
    origin: Optional[str] = Query(None),
    destination: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(TripModel)
    if search:
        s = f"%{search}%"
        query = query.filter(TripModel.id.ilike(s) | TripModel.route.ilike(s) | TripModel.origin.ilike(s) | TripModel.destination.ilike(s))
    if origin:
        query = query.filter(TripModel.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(TripModel.destination.ilike(f"%{destination}%"))
    if status:
        query = query.filter(TripModel.status == status)

    trips = query.all()
    return [parse_trip(t) for t in trips]

@router.get("/trips/{trip_id}", response_model=TripSchema)
def get_trip_detail(trip_id: str, db: Session = Depends(get_db)):
    t = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found")
    return parse_trip(t)

@router.get("/trips/{trip_id}/forecast", response_model=DemandForecastSchema)
def get_trip_forecast(trip_id: str, db: Session = Depends(get_db)):
    t = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not t:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found")
    return calculate_forecast(t)
