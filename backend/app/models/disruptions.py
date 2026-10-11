from sqlalchemy import Column, String, Integer, Float, Text
from app.db.session import Base

class DisruptionModel(Base):
    __tablename__ = "disruptions"

    id = Column(String, primary_key=True, index=True)
    affectedTripId = Column(String, nullable=False)
    route = Column(String, nullable=False)
    passengerCount = Column(Integer, nullable=False)
    cause = Column(String, nullable=False)
    status = Column(String, default="Active")  # Active, Recovered
    candidatesJson = Column(Text, nullable=True)
    selectedVehicleId = Column(String, nullable=True)

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
