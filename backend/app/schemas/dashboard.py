from pydantic import BaseModel
from typing import List, Dict, Any

class OpportunityQueueItem(BaseModel):
    id: str
    tripId: str
    route: str
    type: str  # Yield Opportunity, Capacity Risk, Settlement Audit
    title: str
    description: str
    actionLabel: str
    targetPath: str

class DashboardMetricsSchema(BaseModel):
    activeTrips: int
    totalCapacity: int
    bookedSeats: int
    occupancyPercentage: float
    pendingRecommendationsCount: int
    tripsNeedingAttentionCount: int
    dataReliabilityScore: float
    dailyOpportunityQueue: List[OpportunityQueueItem]
    routeBreakdown: List[Dict[str, Any]]
