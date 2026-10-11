import uuid, json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.trips import TripModel
from app.models.recommendations import RecommendationModel
from app.models.audit import AuditEventModel
from app.schemas.recommendations import RecommendationSchema, DecisionCreate, DecisionSchema
from app.services.pricing_guard import generate_recommendation, validate_trip_data, clamp

router = APIRouter()

@router.get("/recommendations", response_model=List[RecommendationSchema])
def get_recommendations(status: Optional[str] = Query(None), db: Session = Depends(get_db)):
    trips = db.query(TripModel).all()
    recs = [generate_recommendation(t) for t in trips]
    if status:
        recs = [r for r in recs if r.status == status]
    return recs

@router.post("/trips/{trip_id}/recommendations", response_model=RecommendationSchema)
def generate_trip_recommendation(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(TripModel).filter(TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{trip_id}' not found")
    return generate_recommendation(trip)

@router.post("/recommendations/{recommendation_id}/decision", response_model=DecisionSchema)
def process_recommendation_decision(recommendation_id: str, payload: DecisionCreate, db: Session = Depends(get_db)):
    trip = db.query(TripModel).filter(TripModel.id == payload.tripId).first()
    if not trip:
        raise HTTPException(status_code=404, detail=f"Trip '{payload.tripId}' not found")

    # Server-Side Guardrail Validation
    issues = validate_trip_data(trip)
    if issues and payload.status == "accepted":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve recommendation: FairFare Guard flagged critical data health issue '{issues[0].title}'."
        )

    previous_fare = trip.fare
    decision_id = f"DEC-{uuid.uuid4().hex[:6].upper()}"
    timestamp_str = datetime.utcnow().isoformat() + "Z"

    if payload.status == "accepted" and payload.proposedFare is not None:
        # Enforce server-side min/max clamping
        sanitized_fare = clamp(payload.proposedFare, trip.minFare, trip.maxFare)
        trip.fare = sanitized_fare
        db.commit()

        # Audit Event Logging
        audit = AuditEventModel(
            id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
            timestamp=timestamp_str,
            eventType="decision_accepted",
            associatedRecordId=trip.id,
            previousValue=previous_fare,
            newValue=sanitized_fare,
            explanation=payload.reason or f"Operator accepted recommendation: {payload.action}",
            operatorId="Operator-Main",
            hash=f"SHA256-{uuid.uuid4().hex[:12]}"
        )
        db.add(audit)
        db.commit()
    elif payload.status == "rejected":
        audit = AuditEventModel(
            id=f"AUD-{uuid.uuid4().hex[:6].upper()}",
            timestamp=timestamp_str,
            eventType="decision_rejected",
            associatedRecordId=trip.id,
            previousValue=previous_fare,
            newValue=previous_fare,
            explanation=payload.reason or f"Operator rejected recommendation for {trip.id}",
            operatorId="Operator-Main",
            hash=f"SHA256-{uuid.uuid4().hex[:12]}"
        )
        db.add(audit)
        db.commit()

    decision = DecisionSchema(
        id=decision_id,
        tripId=trip.id,
        route=trip.route or f"{trip.origin} → {trip.destination}",
        status=payload.status,
        action=payload.action,
        previousFare=previous_fare,
        proposedFare=payload.proposedFare,
        reason=payload.reason or "Operator action",
        timestamp=timestamp_str,
        source=payload.source
    )
    return decision

@router.get("/decisions", response_model=List[DecisionSchema])
def get_decisions(db: Session = Depends(get_db)):
    audits = db.query(AuditEventModel).filter(AuditEventModel.eventType.in_(["decision_accepted", "decision_rejected"])).order_by(AuditEventModel.timestamp.desc()).all()
    
    out: List[DecisionSchema] = []
    for a in audits:
        trip = db.query(TripModel).filter(TripModel.id == a.associatedRecordId).first()
        route = trip.route if trip else a.associatedRecordId
        status = "accepted" if a.eventType == "decision_accepted" else "rejected"
        out.append(DecisionSchema(
            id=a.id,
            tripId=a.associatedRecordId,
            route=route,
            status=status,
            action="Fare Adjustment" if status == "accepted" else "Hold Fare",
            previousFare=a.previousValue,
            proposedFare=a.newValue,
            reason=a.explanation,
            timestamp=a.timestamp,
            source="recommendation"
        ))
    return out

@router.post("/decisions", response_model=DecisionSchema)
def create_decision(payload: DecisionCreate, db: Session = Depends(get_db)):
    return process_recommendation_decision(f"REC-{payload.tripId}", payload, db)
