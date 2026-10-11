from sqlalchemy import Column, String, Float, Boolean, Integer
from app.db.session import Base

class PricingRuleModel(Base):
    __tablename__ = "pricing_rules"

    id = Column(String, primary_key=True, index=True)
    ruleName = Column(String, nullable=False)
    minPermittedMultiplier = Column(Float, default=0.75)
    maxPermittedMultiplier = Column(Float, default=1.35)
    maxStepChangePercent = Column(Float, default=15.0)
    staleFeedThresholdMinutes = Column(Integer, default=30)
    requiresHumanApproval = Column(Boolean, default=True)
    isActive = Column(Boolean, default=True)
