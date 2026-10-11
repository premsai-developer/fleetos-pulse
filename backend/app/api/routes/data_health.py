from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.trips import TripModel
from app.schemas.data_health import DataHealthStatusSchema
from app.services.pricing_guard import validate_trip_data

router = APIRouter()

@router.get("/data-health", response_model=DataHealthStatusSchema)
def get_data_health(db: Session = Depends(get_db)):
    trips = db.query(TripModel).all()

    stale_count = 0
    incomplete_count = 0
    invalid_inventory_count = 0
    missing_fields_count = 0
    gps_unavailable_count = 0
    review_required_count = 0

    detailed_trips = []

    for t in trips:
        issues = validate_trip_data(t)
        has_issues = len(issues) > 0
        if has_issues:
            review_required_count += 1
        
        if t.feedAgeMin > 30:
            stale_count += 1
        if t.fare is None:
            missing_fields_count += 1
        if t.booked < 0 or t.booked > t.capacity:
            invalid_inventory_count += 1

        detailed_trips.append({
            "tripId": t.id,
            "route": t.route or f"{t.origin} → {t.destination}",
            "feedAgeMin": t.feedAgeMin,
            "hasIssues": has_issues,
            "issueCount": len(issues),
            "issues": [i.dict() for i in issues]
        })

    total = len(trips) if trips else 1
    health_score = round(max(0.0, 100.0 - (review_required_count / total * 100.0)), 1)

    return DataHealthStatusSchema(
        staleRecordsCount=stale_count,
        incompleteRecordsCount=incomplete_count,
        invalidInventoryCount=invalid_inventory_count,
        missingRequiredFieldsCount=missing_fields_count,
        gpsUnavailableCount=gps_unavailable_count,
        tripsRequiringReviewCount=review_required_count,
        overallHealthScore=health_score,
        detailedTrips=detailed_trips
    )
