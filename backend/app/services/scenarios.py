import math
from app.models.trips import TripModel
from app.schemas.scenarios import ScenarioInputSchema, ScenarioResultSchema, SimResultDetail
from app.services.pricing_guard import clamp

PROMO_DISCOUNT = 0.05
PROMO_LIFT = 1.05

def run_scenario_simulation(trip: TripModel, payload: ScenarioInputSchema) -> ScenarioResultSchema:
    current = trip.fare if trip.fare is not None else trip.baseFare
    seats_left = max(0, trip.capacity - trip.booked)
    
    proposed = clamp(payload.proposedFare, trip.minFare, trip.maxFare)
    effective_price = math.max(trip.minFare, round(proposed * (1.0 - PROMO_DISCOUNT))) if payload.policy == "promo" else proposed
    policy_lift = PROMO_LIFT if payload.policy == "promo" else 1.0

    # Baseline calculation
    base_demand = trip.expectedAdditional
    base_new_bookings = clamp(round(base_demand), 0, seats_left)
    base_occupied = trip.booked + base_new_bookings
    base_revenue = trip.booked * current + base_new_bookings * current
    base_cost = trip.operatingCost or (trip.distanceKm * 42.0 if trip.distanceKm else 15000.0)

    baseline_detail = SimResultDetail(
        fare=current,
        newBookings=base_new_bookings,
        occupied=base_occupied,
        occupancy=round(base_occupied / trip.capacity, 4) if trip.capacity > 0 else 0.0,
        revenue=round(base_revenue, 2),
        unsold=trip.capacity - base_occupied,
        operatingCost=base_cost,
        netContribution=round(base_revenue - base_cost, 2)
    )

    # Scenario calculation with price elasticity
    price_ratio = (effective_price / current) if current > 0 else 1.0
    simulated_demand = trip.expectedAdditional * math.pow(price_ratio, payload.elasticity) * policy_lift
    scenario_new_bookings = clamp(round(simulated_demand), 0, seats_left)
    scenario_occupied = trip.booked + scenario_new_bookings
    scenario_revenue = trip.booked * current + scenario_new_bookings * effective_price

    scenario_detail = SimResultDetail(
        fare=effective_price,
        newBookings=scenario_new_bookings,
        occupied=scenario_occupied,
        occupancy=round(scenario_occupied / trip.capacity, 4) if trip.capacity > 0 else 0.0,
        revenue=round(scenario_revenue, 2),
        unsold=trip.capacity - scenario_occupied,
        operatingCost=base_cost,
        netContribution=round(scenario_revenue - base_cost, 2)
    )

    assumptions = [
        f"Price elasticity assumed at e = {payload.elasticity} (standard intercity route range -2.5 to -0.5)",
        f"Policy mode: {payload.policy.capitalize()} ({'5% promo discount applied' if payload.policy == 'promo' else 'Standard baseline'})",
        f"Seating capacity hard cap at {trip.capacity} seats"
    ]
    constraints = [
        f"Fare range: ₹{trip.minFare} – ₹{trip.maxFare}",
        f"Current fare baseline: ₹{current}"
    ]
    warnings = []
    if trip.feedAgeMin > 30:
        warnings.append(f"Warning: Trip feed age is {trip.feedAgeMin} mins old (> 30 min limit).")
    if proposed != payload.proposedFare:
        warnings.append(f"Notice: Proposed fare ₹{payload.proposedFare} was clamped to allowed bound ₹{proposed}.")

    rev_diff = scenario_revenue - base_revenue
    rec_action = f"Apply fare ₹{effective_price}" if rev_diff > 0 else "Maintain current fare"
    explanation = f"Projected revenue change of {'+' if rev_diff >= 0 else ''}₹{round(rev_diff)} ({scenario_new_bookings - base_new_bookings} seat delta)."

    return ScenarioResultSchema(
        tripId=trip.id,
        baseline=baseline_detail,
        scenario=scenario_detail,
        assumptions=assumptions,
        constraints=constraints,
        warnings=warnings,
        recommendedAction=rec_action,
        explanation=explanation
    )
