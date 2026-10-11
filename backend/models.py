from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from datetime import datetime
from database import Base

class TripModel(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, index=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    departure = Column(String, nullable=False)
    hoursToDeparture = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    booked = Column(Integer, nullable=False)
    fare = Column(Float, nullable=True)
    minFare = Column(Float, nullable=False)
    maxFare = Column(Float, nullable=False)
    expectedAdditional = Column(Integer, nullable=False)
    feedAgeMin = Column(Integer, nullable=False)
    operatingCost = Column(Float, nullable=True)
    distanceKm = Column(Float, nullable=True)
    latentDemandEstimate = Column(Integer, nullable=True)
    signalConfidence = Column(Float, nullable=True)
    unservedDemandObserved = Column(Boolean, default=False)

class DecisionModel(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, index=True)
    tripId = Column(String, nullable=False)
    route = Column(String, nullable=False)
    status = Column(String, nullable=False)
    action = Column(String, nullable=False)
    previousFare = Column(Float, nullable=True)
    proposedFare = Column(Float, nullable=True)
    reason = Column(Text, nullable=True)
    timestamp = Column(String, nullable=False)
    source = Column(String, nullable=False)

class TicketModel(Base):
    __tablename__ = "tickets"

    ticketId = Column(String, primary_key=True, index=True)
    tripId = Column(String, nullable=False)
    passengerName = Column(String, nullable=False)
    passengerEmail = Column(String, nullable=False)
    seatNumber = Column(Integer, nullable=False)
    approvedFare = Column(Float, nullable=False)
    purchaseTimestamp = Column(String, nullable=False)
    route = Column(String, nullable=False)

class DiscrepancyModel(Base):
    __tablename__ = "discrepancies"

    id = Column(String, primary_key=True, index=True)
    txRef = Column(String, nullable=False)
    tripId = Column(String, nullable=False)
    expectedAmount = Column(Float, nullable=False)
    settledAmount = Column(Float, nullable=False)
    discrepancy = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)

class DisruptionModel(Base):
    __tablename__ = "disruptions"

    id = Column(String, primary_key=True, index=True)
    affectedTripId = Column(String, nullable=False)
    route = Column(String, nullable=False)
    passengerCount = Column(Integer, nullable=False)
    cause = Column(String, nullable=False)
    status = Column(String, nullable=False)
    selectedVehicleId = Column(String, nullable=True)
