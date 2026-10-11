from sqlalchemy import Column, String, Integer, Float, Boolean, Text
from app.db.session import Base

class TripModel(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    route = Column(String, nullable=False)
    departure = Column(String, nullable=False)
    hoursToDeparture = Column(Float, nullable=False)
    vehicleType = Column(String, default="Volvo B11R Multi-Axle")
    driverName = Column(String, default="Rajesh Kumar")
    capacity = Column(Integer, nullable=False)
    booked = Column(Integer, nullable=False)
    fare = Column(Float, nullable=True)  # Current approved fare (null if missing field)
    baseFare = Column(Float, nullable=False)
    minFare = Column(Float, nullable=False)
    maxFare = Column(Float, nullable=False)
    trendJson = Column(Text, nullable=True)  # JSON array of trend numbers
    expectedAdditional = Column(Integer, nullable=False)
    feedAgeMin = Column(Integer, nullable=False)
    operatingCost = Column(Float, nullable=True)
    distanceKm = Column(Float, nullable=True)
    latentDemandEstimate = Column(Integer, nullable=True)
    signalConfidence = Column(Float, nullable=True)
    unservedDemandObserved = Column(Boolean, default=False)
    status = Column(String, default="active")  # active, completed, cancelled, disrupted
