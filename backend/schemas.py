from pydantic import BaseModel
from typing import Optional, List

class TripSchema(BaseModel):
    id: str
    origin: str
    destination: str
    departure: str
    hoursToDeparture: float
    capacity: int
    booked: int
    fare: Optional[float] = None
    minFare: float
    maxFare: float
    expectedAdditional: int
    feedAgeMin: int
    operatingCost: Optional[float] = None
    distanceKm: Optional[float] = None
    latentDemandEstimate: Optional[int] = None
    signalConfidence: Optional[float] = None
    unservedDemandObserved: Optional[bool] = False

    class Config:
        from_attributes = True

class DecisionCreate(BaseModel):
    tripId: str
    action: str
    proposedFare: Optional[float] = None
    reason: Optional[str] = ""
    assumptions: Optional[List[str]] = []
    source: str = "recommendation"
    status: str = "accepted"

class DecisionSchema(BaseModel):
    id: str
    tripId: str
    route: str
    status: str
    action: str
    previousFare: Optional[float] = None
    proposedFare: Optional[float] = None
    reason: Optional[str] = None
    timestamp: str
    source: str

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
