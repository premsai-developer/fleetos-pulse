from sqlalchemy import Column, String, Float, Boolean, Text
from app.db.session import Base

class RecommendationModel(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True, index=True)
    tripId = Column(String, nullable=False, index=True)
    recommendationType = Column(String, nullable=False)  # fare_change, hold, add_vehicle, reroute
    blocked = Column(Boolean, default=False)
    demand = Column(String, nullable=False)  # High, Normal, Low
    action = Column(String, nullable=False)  # Raise fare, Lower fare, Hold fare
    proposedFare = Column(Float, nullable=True)
    why = Column(Text, nullable=False)
    assumptionsJson = Column(Text, nullable=True)
    constraintsJson = Column(Text, nullable=True)
    expectedRevenueDiff = Column(Float, default=0.0)
    expectedPaxDiff = Column(Integer, default=0)
    status = Column(String, default="pending")  # pending, approved, rejected, withheld
    creationTimestamp = Column(String, nullable=False)
    decisionTimestamp = Column(String, nullable=True)
    operatorReason = Column(Text, nullable=True)
