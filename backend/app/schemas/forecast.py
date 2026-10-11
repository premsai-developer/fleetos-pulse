from pydantic import BaseModel
from typing import List, Optional

class DemandForecastSchema(BaseModel):
    tripId: str
    observedBookings: int
    totalCapacity: int
    expectedAdditionalDemand: int
    lowerBoundDemand: int
    upperBoundDemand: int
    forecastExplanation: str
    baselineEstimate: int
    feedAgeMinutes: int
    dataFreshnessStatus: str  # Fresh, Stale, Missing
    modelLimitations: List[str]
    recommendationEligible: bool
    unservedDemandObserved: bool
    signalConfidence: float
