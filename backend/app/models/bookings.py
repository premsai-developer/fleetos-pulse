from sqlalchemy import Column, String, Integer, Float
from app.db.session import Base

class BookingModel(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, index=True)
    tripId = Column(String, nullable=False, index=True)
    bookingRef = Column(String, nullable=False, unique=True)
    seats = Column(Integer, nullable=False, default=1)
    actualFarePaid = Column(Float, nullable=False)
    bookingTimestamp = Column(String, nullable=False)
    status = Column(String, default="confirmed")  # confirmed, cancelled, refunded
    cancellationReason = Column(String, nullable=True)
