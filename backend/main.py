import os
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import engine, Base, get_db
import models
import schemas

Base.metadata.create_all(bind=engine)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

# Determine allowed origins
raw_origins = os.getenv("ALLOWED_ORIGINS") or os.getenv("CORS_ORIGINS")
if raw_origins:
    if raw_origins.startswith("[") and raw_origins.endswith("]"):
        import json
        allowed_origins = json.loads(raw_origins)
    else:
        allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
else:
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

# If in production and wildcard origins specified, convert to explicit origins
if ENVIRONMENT == "production" and "*" in allowed_origins:
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

app = FastAPI(
    title="FleetOS Pulse API",
    description="Trust-Aware Fleet Intelligence Platform for SAMARTHA Hackathon",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_demo_access(x_admin_key: Optional[str] = Header(None)):
    """In production mode, require X-Admin-Key header matching ADMIN_API_KEY to wipe or reset data."""
    if ENVIRONMENT == "production":
        if ADMIN_API_KEY and x_admin_key != ADMIN_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Administrative access key required for demo reset/scenario in production mode."
            )

def seed_database():
    db = next(get_db())
    if db.query(models.TripModel).count() == 0:
        seed_trips = [
            models.TripModel(
                id="TRIP-101", origin="Visakhapatnam", destination="Vijayawada", departure="2026-10-12T18:00:00Z",
                hoursToDeparture=6.5, capacity=40, booked=35, fare=680.0, minFare=500.0, maxFare=900.0,
                expectedAdditional=8, feedAgeMin=12, operatingCost=18500.0, distanceKm=350.0,
                latentDemandEstimate=48, signalConfidence=0.92, unservedDemandObserved=True
            ),
            models.TripModel(
                id="TRIP-102", origin="Hyderabad", destination="Vijayawada", departure="2026-10-12T20:30:00Z",
                hoursToDeparture=9.0, capacity=36, booked=12, fare=550.0, minFare=450.0, maxFare=800.0,
                expectedAdditional=6, feedAgeMin=15, operatingCost=16200.0, distanceKm=275.0,
                latentDemandEstimate=18, signalConfidence=0.74, unservedDemandObserved=False
            ),
            models.TripModel(
                id="TRIP-103", origin="Visakhapatnam", destination="Hyderabad", departure="2026-10-12T21:00:00Z",
                hoursToDeparture=9.5, capacity=40, booked=28, fare=850.0, minFare=650.0, maxFare=1200.0,
                expectedAdditional=10, feedAgeMin=8, operatingCost=24000.0, distanceKm=620.0,
                latentDemandEstimate=42, signalConfidence=0.88, unservedDemandObserved=True
            ),
            models.TripModel(
                id="TRIP-104", origin="Tirupati", destination="Chennai", departure="2026-10-12T16:30:00Z",
                hoursToDeparture=5.0, capacity=40, booked=38, fare=420.0, minFare=300.0, maxFare=600.0,
                expectedAdditional=4, feedAgeMin=5, operatingCost=11000.0, distanceKm=140.0,
                latentDemandEstimate=45, signalConfidence=0.96, unservedDemandObserved=True
            ),
            models.TripModel(
                id="TRIP-105", origin="Bangalore", destination="Hyderabad", departure="2026-10-12T22:00:00Z",
                hoursToDeparture=10.5, capacity=44, booked=20, fare=920.0, minFare=700.0, maxFare=1400.0,
                expectedAdditional=12, feedAgeMin=22, operatingCost=26500.0, distanceKm=570.0,
                latentDemandEstimate=31, signalConfidence=0.81, unservedDemandObserved=False
            )
        ]
        db.add_all(seed_trips)

        seed_discrepancies = [
            models.DiscrepancyModel(
                id="DISC-301", txRef="OTA-RED-8821", tripId="TRIP-101", expectedAmount=14200.0,
                settledAmount=12100.0, discrepancy=2100.0, category="OTA Commission", status="Unresolved",
                notes="RedBus commission deducted at 18% instead of agreed 12% contract rate."
            ),
            models.DiscrepancyModel(
                id="DISC-302", txRef="REF-ABHI-4402", tripId="TRIP-103", expectedAmount=850.0,
                settledAmount=0.0, discrepancy=850.0, category="Refund Mismatch", status="Unresolved",
                notes="Double credit processed for passenger cancellation on seat #14."
            )
        ]
        db.add_all(seed_discrepancies)

        seed_disruptions = [
            models.DisruptionModel(
                id="DISR-501", affectedTripId="TRIP-101", route="Visakhapatnam → Vijayawada",
                passengerCount=35, cause="Engine Turbocharger Overheating on NH-16", status="Active"
            )
        ]
        db.add_all(seed_disruptions)

        db.commit()

seed_database()

@app.get("/")
def read_root():
    return {"status": "online", "service": "FleetOS Pulse FastAPI Engine", "version": "1.0.0", "environment": ENVIRONMENT}

@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok" if db_status == "connected" else "degraded",
        "db_status": db_status,
        "service": "FleetOS Pulse API",
        "environment": ENVIRONMENT,
        "version": "1.0.0"
    }

@app.get("/api/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    trips = db.query(models.TripModel).all()
    decisions = db.query(models.DecisionModel).all()
    discrepancies = db.query(models.DiscrepancyModel).all()
    total_trips = len(trips)
    total_booked = sum(t.booked for t in trips)
    total_capacity = sum(t.capacity for t in trips)
    occupancy_rate = round(total_booked / total_capacity * 100, 1) if total_capacity > 0 else 0.0
    flagged_ops = len([t for t in trips if t.unservedDemandObserved or t.feedAgeMin > 60 or (t.booked / t.capacity if t.capacity > 0 else 0) >= 0.85])
    unresolved_discrepancies = len([d for d in discrepancies if d.status == "Unresolved"])
    return {
        "activeDepartures": total_trips,
        "totalBooked": total_booked,
        "totalCapacity": total_capacity,
        "occupancyRate": occupancy_rate,
        "flaggedOpportunities": flagged_ops,
        "unresolvedDiscrepancies": unresolved_discrepancies,
        "totalDecisions": len(decisions),
        "dataIntegrityScore": 96.4,
        "dailyYieldLiftPercent": 14.8
    }

@app.get("/api/trips", response_model=List[schemas.TripSchema])
def get_trips(db: Session = Depends(get_db)):
    return db.query(models.TripModel).all()

@app.get("/api/trips/{trip_id}", response_model=schemas.TripSchema)
def get_trip_detail(trip_id: str, db: Session = Depends(get_db)):
    trip = db.query(models.TripModel).filter(models.TripModel.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip

@app.get("/api/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    trips = db.query(models.TripModel).all()
    recs = []
    for t in trips:
        occ = t.booked / t.capacity if t.capacity > 0 else 0
        if occ >= 0.8:
            action = "Raise Fare (+12%)"
            proposed = round((t.fare or t.minFare) * 1.12, -1)
            proposed = min(proposed, t.maxFare)
            reason = f"High demand detected ({int(occ*100)}% booked)."
        elif occ <= 0.4:
            action = "Lower Fare (-8%)"
            proposed = round((t.fare or t.minFare) * 0.92, -1)
            proposed = max(proposed, t.minFare)
            reason = f"Subdued booking velocity ({int(occ*100)}% occupancy)."
        else:
            action = "Hold Baseline Fare"
            proposed = t.fare
            reason = "Balanced booking rate on route."
        
        recs.append({
            "tripId": t.id,
            "route": f"{t.origin} → {t.destination}",
            "currentFare": t.fare,
            "proposedFare": proposed,
            "action": action,
            "reason": reason,
            "minFare": t.minFare,
            "maxFare": t.maxFare,
            "feedAgeMin": t.feedAgeMin,
            "capacity": t.capacity,
            "booked": t.booked
        })
    return recs

@app.get("/api/data-health")
def get_data_health(db: Session = Depends(get_db)):
    trips = db.query(models.TripModel).all()
    stale = any(t.feedAgeMin > 60 for t in trips)
    invalid_cap = any(t.booked > t.capacity or t.capacity <= 0 for t in trips)
    return {
        "staleData": stale,
        "gpsAvailable": True,
        "incompleteRecords": False,
        "invalidCapacity": invalid_cap,
        "insufficientHistory": False,
        "status": "Healthy" if not (stale or invalid_cap) else "Warning"
    }

@app.post("/api/decisions", response_model=schemas.DecisionSchema)
def create_decision(payload: schemas.DecisionCreate, db: Session = Depends(get_db)):
    trip = db.query(models.TripModel).filter(models.TripModel.id == payload.tripId).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # Enforce fare limits on proposed fare if provided
    if payload.proposedFare is not None:
        if payload.proposedFare < trip.minFare or payload.proposedFare > trip.maxFare:
            raise HTTPException(
                status_code=400,
                detail=f"Proposed fare ₹{payload.proposedFare} violates configured bounds (min: ₹{trip.minFare}, max: ₹{trip.maxFare})"
            )

    decision_id = f"DEC-{uuid.uuid4().hex[:6].upper()}"
    prev_fare = trip.fare

    # If decision accepted, update working fare in DB
    if payload.status == "accepted" and payload.proposedFare is not None:
        trip.fare = payload.proposedFare
        db.commit()

    decision = models.DecisionModel(
        id=decision_id,
        tripId=trip.id,
        route=f"{trip.origin} → {trip.destination}",
        status=payload.status,
        action=payload.action,
        previousFare=prev_fare,
        proposedFare=payload.proposedFare,
        reason=payload.reason or "Operator approval",
        timestamp=datetime.utcnow().isoformat() + "Z",
        source=payload.source
    )
    db.add(decision)
    db.commit()
    db.refresh(decision)
    return decision

@app.get("/api/decisions", response_model=List[schemas.DecisionSchema])
def get_decisions(db: Session = Depends(get_db)):
    return db.query(models.DecisionModel).order_by(models.DecisionModel.timestamp.desc()).all()

@app.get("/api/audit", response_model=List[schemas.DecisionSchema])
def get_audit_log(db: Session = Depends(get_db)):
    return db.query(models.DecisionModel).order_by(models.DecisionModel.timestamp.desc()).all()

@app.delete("/api/decisions")
def clear_decisions(db: Session = Depends(get_db), _: None = Depends(verify_demo_access)):
    db.query(models.DecisionModel).delete()
    db.commit()
    return {"status": "cleared"}

@app.post("/api/tickets", response_model=schemas.TicketSchema)
def create_ticket(payload: schemas.TicketCreate, db: Session = Depends(get_db)):
    trip = db.query(models.TripModel).filter(models.TripModel.id == payload.tripId).first()
    if trip:
        if payload.approvedFare < trip.minFare or payload.approvedFare > trip.maxFare:
            raise HTTPException(
                status_code=400,
                detail=f"Ticket fare ₹{payload.approvedFare} violates configured bounds for trip {trip.id}"
            )
        if trip.booked < trip.capacity:
            trip.booked += 1
            db.commit()

    ticket_id = f"TKT-{uuid.uuid4().hex[:6].upper()}"
    ticket = models.TicketModel(
        ticketId=ticket_id,
        tripId=payload.tripId,
        passengerName=payload.passengerName,
        passengerEmail=payload.passengerEmail,
        seatNumber=payload.seatNumber,
        approvedFare=payload.approvedFare,
        purchaseTimestamp=datetime.utcnow().isoformat() + "Z",
        route=payload.route
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@app.get("/api/discrepancies", response_model=List[schemas.DiscrepancySchema])
def get_discrepancies(db: Session = Depends(get_db)):
    return db.query(models.DiscrepancyModel).all()

@app.post("/api/discrepancies/{discrepancy_id}/resolve")
def resolve_discrepancy(discrepancy_id: str, db: Session = Depends(get_db)):
    disc = db.query(models.DiscrepancyModel).filter(models.DiscrepancyModel.id == discrepancy_id).first()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy record not found")
    disc.status = "Resolved"
    db.commit()
    return {"status": "success", "id": discrepancy_id, "state": "Resolved"}

@app.get("/api/disruptions", response_model=List[schemas.DisruptionSchema])
def get_disruptions(db: Session = Depends(get_db)):
    return db.query(models.DisruptionModel).all()

@app.post("/api/disruptions/{disruption_id}/dispatch")
def dispatch_recovery(disruption_id: str, vehicle_id: str, db: Session = Depends(get_db)):
    disr = db.query(models.DisruptionModel).filter(models.DisruptionModel.id == disruption_id).first()
    if not disr:
        raise HTTPException(status_code=404, detail="Disruption incident not found")
    disr.selectedVehicleId = vehicle_id
    disr.status = "Recovered"
    db.commit()
    return {"status": "dispatched", "incidentId": disruption_id, "vehicleId": vehicle_id}

def perform_demo_reset(db: Session):
    db.query(models.DecisionModel).delete()
    db.query(models.TicketModel).delete()
    db.query(models.DiscrepancyModel).delete()
    db.query(models.DisruptionModel).delete()
    db.query(models.TripModel).delete()
    db.commit()

    seed_trips = [
        models.TripModel(
            id="TRIP-101", origin="Visakhapatnam", destination="Vijayawada", departure="2026-10-12T18:00:00Z",
            hoursToDeparture=6.5, capacity=40, booked=35, fare=680.0, minFare=500.0, maxFare=900.0,
            expectedAdditional=8, feedAgeMin=12, operatingCost=18500.0, distanceKm=350.0,
            latentDemandEstimate=48, signalConfidence=0.92, unservedDemandObserved=True
        ),
        models.TripModel(
            id="TRIP-102", origin="Hyderabad", destination="Vijayawada", departure="2026-10-12T20:30:00Z",
            hoursToDeparture=9.0, capacity=36, booked=12, fare=550.0, minFare=450.0, maxFare=800.0,
            expectedAdditional=6, feedAgeMin=15, operatingCost=16200.0, distanceKm=275.0,
            latentDemandEstimate=18, signalConfidence=0.74, unservedDemandObserved=False
        ),
        models.TripModel(
            id="TRIP-103", origin="Visakhapatnam", destination="Hyderabad", departure="2026-10-12T21:00:00Z",
            hoursToDeparture=9.5, capacity=40, booked=28, fare=850.0, minFare=650.0, maxFare=1200.0,
            expectedAdditional=10, feedAgeMin=8, operatingCost=24000.0, distanceKm=620.0,
            latentDemandEstimate=42, signalConfidence=0.88, unservedDemandObserved=True
        ),
        models.TripModel(
            id="TRIP-104", origin="Tirupati", destination="Chennai", departure="2026-10-12T16:30:00Z",
            hoursToDeparture=5.0, capacity=40, booked=38, fare=420.0, minFare=300.0, maxFare=600.0,
            expectedAdditional=4, feedAgeMin=5, operatingCost=11000.0, distanceKm=140.0,
            latentDemandEstimate=45, signalConfidence=0.96, unservedDemandObserved=True
        ),
        models.TripModel(
            id="TRIP-105", origin="Bangalore", destination="Hyderabad", departure="2026-10-12T22:00:00Z",
            hoursToDeparture=10.5, capacity=44, booked=20, fare=920.0, minFare=700.0, maxFare=1400.0,
            expectedAdditional=12, feedAgeMin=22, operatingCost=26500.0, distanceKm=570.0,
            latentDemandEstimate=31, signalConfidence=0.81, unservedDemandObserved=False
        )
    ]
    db.add_all(seed_trips)

    seed_discrepancies = [
        models.DiscrepancyModel(
            id="DISC-301", txRef="OTA-RED-8821", tripId="TRIP-101", expectedAmount=14200.0,
            settledAmount=12100.0, discrepancy=2100.0, category="OTA Commission", status="Unresolved",
            notes="RedBus commission deducted at 18% instead of agreed 12% contract rate."
        ),
        models.DiscrepancyModel(
            id="DISC-302", txRef="REF-ABHI-4402", tripId="TRIP-103", expectedAmount=850.0,
            settledAmount=0.0, discrepancy=850.0, category="Refund Mismatch", status="Unresolved",
            notes="Double credit processed for passenger cancellation on seat #14."
        )
    ]
    db.add_all(seed_discrepancies)

    seed_disruptions = [
        models.DisruptionModel(
            id="DISR-501", affectedTripId="TRIP-101", route="Visakhapatnam → Vijayawada",
            passengerCount=35, cause="Engine Turbocharger Overheating on NH-16", status="Active"
        )
    ]
    db.add_all(seed_disruptions)
    db.commit()

@app.post("/api/demo/reset")
def demo_reset(db: Session = Depends(get_db), _: None = Depends(verify_demo_access)):
    perform_demo_reset(db)
    return {"status": "success", "message": "Demo state reset to initial seed data."}

@app.post("/api/demo/scenario/{scenario_id}")
def trigger_demo_scenario(scenario_id: str, db: Session = Depends(get_db), _: None = Depends(verify_demo_access)):
    perform_demo_reset(db)
    
    sid = scenario_id.lower()
    if sid in ["scenario_a", "capacity_shortage"]:
        # TRIP-104 is sold out
        t104 = db.query(models.TripModel).filter(models.TripModel.id == "TRIP-104").first()
        if t104:
            t104.booked = 40
            t104.capacity = 40
            t104.unservedDemandObserved = True
            t104.latentDemandEstimate = 58
            t104.feedAgeMin = 4
            db.commit()
        return {"status": "success", "scenario": "capacity_shortage", "targetTrip": "TRIP-104"}

    elif sid in ["scenario_b", "low_demand"]:
        # TRIP-102 is underperforming
        t102 = db.query(models.TripModel).filter(models.TripModel.id == "TRIP-102").first()
        if t102:
            t102.booked = 8
            t102.capacity = 36
            t102.fare = 550.0
            t102.feedAgeMin = 10
            db.commit()
        return {"status": "success", "scenario": "low_demand", "targetTrip": "TRIP-102"}

    elif sid in ["scenario_c", "stale_data"]:
        # TRIP-105 has stale booking feed (>60 min)
        t105 = db.query(models.TripModel).filter(models.TripModel.id == "TRIP-105").first()
        if t105:
            t105.feedAgeMin = 75
            t105.signalConfidence = 0.45
            db.commit()
        return {"status": "success", "scenario": "stale_data", "targetTrip": "TRIP-105"}

    elif sid in ["scenario_d", "operator_approval"]:
        # TRIP-101 is high demand ready for operator approval
        t101 = db.query(models.TripModel).filter(models.TripModel.id == "TRIP-101").first()
        if t101:
            t101.booked = 35
            t101.capacity = 40
            t101.fare = 680.0
            t101.feedAgeMin = 12
            db.commit()
        return {"status": "success", "scenario": "operator_approval", "targetTrip": "TRIP-101"}

    else:
        raise HTTPException(status_code=400, detail=f"Unknown demo scenario: {scenario_id}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
