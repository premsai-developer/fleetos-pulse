from pydantic import BaseModel
from typing import Optional, List

class TripSchema(BaseModel):
    id: str
    origin: str
    destination: str
    route: str
    departure: str
    hoursToDeparture: float
    vehicleType: Optional[str] = "Volvo B11R Multi-Axle"
    driverName: Optional[str] = "Rajesh Kumar"
    capacity: int
    booked: int
    fare: Optional[float] = None
    baseFare: float
    minFare: float
    maxFare: float
    trend: Optional[List[int]] = []
    expectedAdditional: int
    feedAgeMin: int
    operatingCost: Optional[float] = None
    distanceKm: Optional[float] = None
    latentDemandEstimate: Optional[int] = None
    signalConfidence: Optional[float] = None
    unservedDemandObserved: Optional[bool] = False
    status: Optional[str] = "active"

    class Config:
        from_attributes = True

class TripCreate(BaseModel):
    id: str
    origin: str
    destination: str
    route: str
    departure: str
    hoursToDeparture: float
    capacity: int
    booked: int
    fare: Optional[float] = None
    baseFare: float
    minFare: float
    maxFare: float
    expectedAdditional: int
    feedAgeMin: int
    operatingCost: Optional[float] = None
    distanceKm: Optional[float] = None
