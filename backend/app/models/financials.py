from sqlalchemy import Column, String, Float, Text
from app.db.session import Base

class FinancialRecordModel(Base):
    __tablename__ = "financial_records"

    id = Column(String, primary_key=True, index=True)
    tripId = Column(String, nullable=False, index=True)
    txRef = Column(String, nullable=False, unique=True)
    recordType = Column(String, nullable=False)  # ota_settlement, ticket_sale, refund, operating_cost
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    source = Column(String, nullable=False)  # RedBus, AbhiBus, Paytm, Direct, Terminal
    reconciliationStatus = Column(String, default="reconciled")  # reconciled, discrepancy, pending

class DiscrepancyModel(Base):
    __tablename__ = "discrepancies"

    id = Column(String, primary_key=True, index=True)
    txRef = Column(String, nullable=False)
    tripId = Column(String, nullable=False)
    expectedAmount = Column(Float, nullable=False)
    settledAmount = Column(Float, nullable=False)
    discrepancy = Column(Float, nullable=False)
    category = Column(String, nullable=False)  # OTA Commission, Refund Mismatch, Duplicate Tx, Expense Outlier
    status = Column(String, default="Unresolved")  # Unresolved, Investigating, Resolved
    notes = Column(Text, nullable=True)
