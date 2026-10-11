from sqlalchemy import Column, String, Float, Text
from app.db.session import Base

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(String, nullable=False)
    eventType = Column(String, nullable=False)  # decision_accepted, decision_rejected, pricing_withheld, override_applied
    associatedRecordId = Column(String, nullable=False)  # tripId or recId
    previousValue = Column(Float, nullable=True)
    newValue = Column(Float, nullable=True)
    explanation = Column(Text, nullable=False)
    operatorId = Column(String, default="Operator-Main")
    hash = Column(String, nullable=True)
