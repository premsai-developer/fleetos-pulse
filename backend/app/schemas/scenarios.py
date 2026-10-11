from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ScenarioInputSchema(BaseModel):
    tripId: str
    proposedFare: float
    policy: str = "baseline"  # baseline, promo
    elasticity: float = -1.2

class SimResultDetail(BaseModel):
    fare: float
    newBookings: int
    occupied: int
    occupancy: float
    revenue: float
    unsold: int
    operatingCost: Optional[float] = None
    netContribution: Optional[float] = None

class ScenarioResultSchema(BaseModel):
    tripId: str
    baseline: SimResultDetail
    scenario: SimResultDetail
    assumptions: List[str]
    constraints: List[str]
    warnings: List[str]
    recommendedAction: str
    explanation: str

class RouteProfitItem(BaseModel):
    route: str
    tripCount: int
    grossRevenue: float
    operatingCost: float
    netContribution: float
    contributionMargin: float

class ProfitabilityAnalysisSchema(BaseModel):
    totalGrossRevenue: float
    totalRefundsAndAdjustments: float
    totalCommissions: float
    totalOperatingCosts: float
    totalNetRevenue: float
    totalContribution: float
    overallContributionMargin: float
    routeBreakdown: List[RouteProfitItem]

class DataHealthStatusSchema(BaseModel):
    staleRecordsCount: int
    incompleteRecordsCount: int
    invalidInventoryCount: int
    missingRequiredFieldsCount: int
    gpsUnavailableCount: int
    tripsRequiringReviewCount: int
    overallHealthScore: float
    detailedTrips: List[Dict[str, Any]]

class DiscrepancySchema(BaseModel):
    id: str
    txRef: str
    tripId: str
    expectedAmount: float
    settledAmount: float
    discrepancy: float
    category: str
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ImportResultSchema(BaseModel):
    filename: str
    recordsProcessed: int
    validRecords: int
    discrepanciesFound: int
    status: str
    details: List[str]

class AuditEventSchema(BaseModel):
    id: str
    timestamp: str
    eventType: str
    associatedRecordId: str
    previousValue: Optional[float] = None
    newValue: Optional[float] = None
    explanation: str
    operatorId: str
    hash: Optional[str] = None

    class Config:
        from_attributes = True

class DisruptionSchema(BaseModel):
    id: str
    affectedTripId: str
    route: str
    passengerCount: int
    cause: str
    status: str
    selectedVehicleId: Optional[str] = None

    class Config:
        from_attributes = True

class TicketCreate(BaseModel):
    tripId: str
    passengerName: str
    passengerEmail: str
    seatNumber: int
    approvedFare: float
    route: str

class TicketSchema(BaseModel):
    ticketId: str
    tripId: str
    passengerName: str
    passengerEmail: str
    seatNumber: int
    approvedFare: float
    purchaseTimestamp: str
    route: str

    class Config:
        from_attributes = True
