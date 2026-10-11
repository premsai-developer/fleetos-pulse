import math
from typing import List, Dict, Any
from app.models.trips import TripModel
from app.schemas.recommendations import RecommendationSchema, IssueSchema
from app.core.config import settings

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))

def round5(val: float) -> float:
    return round(val / 5.0) * 5.0

def validate_trip_data(trip: TripModel) -> List[IssueSchema]:
    issues: List[IssueSchema] = []
    
    # 1. Stale Data Check
    if trip.feedAgeMin > settings.STALE_THRESHOLD_MINUTES:
        issues.append(IssueSchema(
            code="STALE_FEED",
            tripId=trip.id,
            severity="critical",
            title=f"Booking feed is {trip.feedAgeMin} min old",
            why=f"Feed exceeds safety threshold of {settings.STALE_THRESHOLD_MINUTES} minutes. Seats may have sold out.",
            fix="Re-sync booking feed to obtain real-time telemetry."
        ))

    # 2. Missing Fare Check
    if trip.fare is None:
        issues.append(IssueSchema(
            code="MISSING_FARE",
            tripId=trip.id,
            severity="critical",
            title="Current approved fare is missing",
            why="Pricing engine requires a baseline fare to evaluate yield sensitivity.",
            fix="Specify a base fare in the source inventory record."
        ))

    # 3. Invalid Inventory Check
    if trip.capacity <= 0 or trip.booked < 0 or trip.booked > trip.capacity:
        issues.append(IssueSchema(
            code="INVALID_INVENTORY",
            tripId=trip.id,
            severity="critical",
            title=f"Invalid seat count ({trip.booked} booked of {trip.capacity} capacity)",
            why="Booked seats cannot exceed capacity or be negative.",
            fix="Correct inventory seat counts in the reservation system."
        ))

    # 4. Out of Bounds Fare Check
    if trip.fare is not None and (trip.fare < trip.minFare or trip.fare > trip.maxFare):
        issues.append(IssueSchema(
            code="FARE_BOUNDARY",
            tripId=trip.id,
            severity="critical",
            title=f"Current fare ₹{trip.fare} is outside range ₹{trip.minFare}–₹{trip.maxFare}",
            why="Fares must remain within configured operational safety limits.",
            fix="Adjust current fare back inside the min/max operational limits."
        ))

    return issues

def generate_recommendation(trip: TripModel) -> RecommendationSchema:
    issues = validate_trip_data(trip)
    occ = trip.booked / trip.capacity if trip.capacity > 0 else 0.0
    occ_pct = round(occ * 100)
    
    demand = "High" if occ >= 0.75 else "Low" if occ < 0.40 else "Normal"
    
    base_assumptions = [
        f"Expected further bookings at current fare: {trip.expectedAdditional} seats",
        "High demand ≥ 75% occupancy; Low demand < 40%",
        f"FairFare Guard caps step adjustments to ±{settings.MAX_STEP_CHANGE_PERCENT}%"
    ]
    base_constraints = [
        f"Allowed fare bounds: ₹{trip.minFare} – ₹{trip.maxFare}",
        f"Feed age must be under {settings.STALE_THRESHOLD_MINUTES} mins",
        "Booked seats must not exceed capacity"
    ]

    # If any critical issues exist or current fare is null -> Withhold Recommendation
    if issues or trip.fare is None:
        return RecommendationSchema(
            id=f"REC-{trip.id}",
            tripId=trip.id,
            blocked=True,
            issues=issues,
            demand=demand,
            action="Hold fare",
            proposedFare=None,
            why="Recommendation withheld: booking feed failed FairFare Guard validation. See Data Health.",
            assumptions=base_assumptions,
            constraints=base_constraints,
            expectedRevenueDiff=0.0,
            expectedPaxDiff=0,
            status="withheld"
        )

    current_fare = trip.fare

    if demand == "High":
        # Calculate +8% fare increase capped by maxStepChange and fare limits
        raw_increase = current_fare * 1.08
        step_cap = current_fare * (1.0 + settings.MAX_STEP_CHANGE_PERCENT / 100.0)
        target = min(raw_increase, step_cap)
        proposed = clamp(round5(target), trip.minFare, trip.maxFare)
        rev_diff = round((proposed - current_fare) * max(0, trip.capacity - trip.booked) * 0.5)
        
        return RecommendationSchema(
            id=f"REC-{trip.id}",
            tripId=trip.id,
            blocked=False,
            issues=[],
            demand="High",
            action="Raise fare",
            proposedFare=proposed,
            why=f"{occ_pct}% of seats are sold with {trip.hoursToDeparture}h to departure. High latent demand observed.",
            assumptions=base_assumptions,
            constraints=base_constraints,
            expectedRevenueDiff=rev_diff,
            expectedPaxDiff=-1,
            status="pending"
        )

    elif demand == "Low":
        # Calculate -10% fare reduction capped by maxStepChange and fare limits
        raw_decrease = current_fare * 0.90
        step_floor = current_fare * (1.0 - settings.MAX_STEP_CHANGE_PERCENT / 100.0)
        target = max(raw_decrease, step_floor)
        proposed = clamp(round5(target), trip.minFare, trip.maxFare)
        rev_diff = round(proposed * 4 - current_fare * 2)

        return RecommendationSchema(
            id=f"REC-{trip.id}",
            tripId=trip.id,
            blocked=False,
            issues=[],
            demand="Low",
            action="Lower fare",
            proposedFare=proposed,
            why=f"Only {occ_pct}% of seats sold with {trip.hoursToDeparture}h left. Promotional fare suggested to fill unsold seats.",
            assumptions=base_assumptions,
            constraints=base_constraints,
            expectedRevenueDiff=rev_diff,
            expectedPaxDiff=4,
            status="pending"
        )

    else:
        return RecommendationSchema(
            id=f"REC-{trip.id}",
            tripId=trip.id,
            blocked=False,
            issues=[],
            demand="Normal",
            action="Hold fare",
            proposedFare=current_fare,
            why=f"Occupancy is at normal rate ({occ_pct}%). Current fare ₹{current_fare} is optimal.",
            assumptions=base_assumptions,
            constraints=base_constraints,
            expectedRevenueDiff=0.0,
            expectedPaxDiff=0,
            status="pending"
        )
