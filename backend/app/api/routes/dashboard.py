import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.trips import TripModel
from app.models.recommendations import RecommendationModel
from app.models.financials import DiscrepancyModel
from app.schemas.dashboard import DashboardMetricsSchema, OpportunityQueueItem

router = APIRouter()

@router.get("/dashboard", response_model=DashboardMetricsSchema)
def get_dashboard_metrics(db: Session = Depends(get_db)):
    trips = db.query(TripModel).all()
    recs = db.query(RecommendationModel).filter(RecommendationModel.status == "pending").all()
    discrepancies = db.query(DiscrepancyModel).filter(DiscrepancyModel.status == "Unresolved").all()

    active_trips = len(trips)
    total_capacity = sum(t.capacity for t in trips) if trips else 0
    booked_seats = sum(t.booked for t in trips) if trips else 0
    occ_pct = round((booked_seats / total_capacity * 100), 1) if total_capacity > 0 else 0.0

    stale_count = sum(1 for t in trips if t.feedAgeMin > 30)
    data_reliability = round(100.0 - (stale_count / active_trips * 100) if active_trips > 0 else 100.0, 1)

    # Opportunity Queue
    opportunity_items = [
        OpportunityQueueItem(
            id="OPP-101",
            tripId="TBS-VJ-101",
            route="Visakhapatnam → Vijayawada",
            type="Yield Opportunity",
            title="High Latent Demand on TBS-VJ-101",
            description="Occupancy at 83% with 14 seats remaining. Expected unserved demand observed.",
            actionLabel="Review Dynamic Pricing",
            targetPath="/recommendations"
        ),
        OpportunityQueueItem(
            id="OPP-102",
            tripId="TBS-VJ-102",
            route="Visakhapatnam → Vijayawada",
            type="Capacity Risk",
            title="Low Booking Velocity on TBS-VJ-102",
            description="Only 15/40 seats booked with 59h remaining.",
            actionLabel="Evaluate Promo Fare",
            targetPath="/scenarios"
        ),
        OpportunityQueueItem(
            id="OPP-103",
            tripId="TRIP-101",
            route="Visakhapatnam → Vijayawada",
            type="Settlement Audit",
            title="Settlement Discrepancy DISC-301 (₹2,100)",
            description="OTA commission rate mismatch detected on transaction OTA-RED-8821.",
            actionLabel="Open Leakage Investigator",
            targetPath="/leakage"
        )
    ]

    # Route Breakdown for Recharts
    route_map = {}
    for t in trips:
        r = t.route or f"{t.origin} → {t.destination}"
        if r not in route_map:
            route_map[r] = {"capacity": 0, "booked": 0, "trips": 0}
        route_map[r]["capacity"] += t.capacity
        route_map[r]["booked"] += t.booked
        route_map[r]["trips"] += 1

    route_breakdown = [
        {
            "route": name,
            "occupancy": round(data["booked"] / data["capacity"] * 100) if data["capacity"] > 0 else 0,
            "booked": data["booked"],
            "capacity": data["capacity"]
        }
        for name, data in route_map.items()
    ]

    return DashboardMetricsSchema(
        activeTrips=active_trips,
        totalCapacity=total_capacity,
        bookedSeats=booked_seats,
        occupancyPercentage=occ_pct,
        pendingRecommendationsCount=len(recs),
        tripsNeedingAttentionCount=stale_count + len(discrepancies),
        dataReliabilityScore=data_reliability,
        dailyOpportunityQueue=opportunity_items,
        routeBreakdown=route_breakdown
    )
