from typing import List
from app.models.trips import TripModel
from app.models.financials import FinancialRecordModel
from app.schemas.profitability import ProfitabilityAnalysisSchema, RouteProfitItem

def calculate_profitability_metrics(trips: List[TripModel], records: List[FinancialRecordModel]) -> ProfitabilityAnalysisSchema:
    """
    Fleet Profit Twin Accounting Engine:
    Gross Ticket Revenue = sum of booked seats * current approved fare
    Net Revenue = Gross Revenue - Commissions - Refunds
    Trip Contribution = Net Revenue - Operating Costs
    Contribution Margin = Trip Contribution / Net Revenue
    """
    total_gross = 0.0
    total_refunds = 0.0
    total_commissions = 0.0
    total_operating_costs = 0.0

    route_stats = {}

    for trip in trips:
        route = trip.route or f"{trip.origin} → {trip.destination}"
        fare = trip.fare or trip.baseFare or 0.0
        gross = trip.booked * fare
        cost = trip.operatingCost or (trip.distanceKm * 42.0 if trip.distanceKm else 15000.0)
        
        # Estimate commissions (avg 12% across OTAs)
        commissions = gross * 0.12
        refunds = 0.0

        total_gross += gross
        total_commissions += commissions
        total_refunds += refunds
        total_operating_costs += cost

        if route not in route_stats:
            route_stats[route] = {
                "count": 0,
                "gross": 0.0,
                "cost": 0.0,
                "commissions": 0.0,
                "refunds": 0.0
            }
        
        route_stats[route]["count"] += 1
        route_stats[route]["gross"] += gross
        route_stats[route]["cost"] += cost
        route_stats[route]["commissions"] += commissions
        route_stats[route]["refunds"] += refunds

    # Include additional financial records if present
    for r in records:
        if r.recordType == "refund":
            total_refunds += r.amount
        elif r.recordType == "ota_settlement":
            pass

    total_net = total_gross - total_commissions - total_refunds
    total_contribution = total_net - total_operating_costs
    overall_margin = (total_contribution / total_net) if total_net > 0 else 0.0

    route_breakdown: List[RouteProfitItem] = []
    for route_name, stats in route_stats.items():
        net_rev = stats["gross"] - stats["commissions"] - stats["refunds"]
        contrib = net_rev - stats["cost"]
        margin = (contrib / net_rev) if net_rev > 0 else 0.0
        
        route_breakdown.append(RouteProfitItem(
            route=route_name,
            tripCount=stats["count"],
            grossRevenue=round(stats["gross"], 2),
            operatingCost=round(stats["cost"], 2),
            netContribution=round(contrib, 2),
            contributionMargin=round(margin, 4)
        ))

    return ProfitabilityAnalysisSchema(
        totalGrossRevenue=round(total_gross, 2),
        totalRefundsAndAdjustments=round(total_refunds, 2),
        totalCommissions=round(total_commissions, 2),
        totalOperatingCosts=round(total_operating_costs, 2),
        totalNetRevenue=round(total_net, 2),
        totalContribution=round(total_contribution, 2),
        overallContributionMargin=round(overall_margin, 4),
        routeBreakdown=route_breakdown
    )
