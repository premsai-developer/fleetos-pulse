from pydantic import BaseModel
from typing import Optional, List

class IssueSchema(BaseModel):
    code: str
    tripId: str
    severity: str
    title: str
    why: str
    fix: str

class RecommendationSchema(BaseModel):
    id: str
    tripId: str
    blocked: bool
    issues: List[IssueSchema] = []
    demand: str
    action: str
    proposedFare: Optional[float] = None
    why: str
    assumptions: List[str] = []
    constraints: List[str] = []
    expectedRevenueDiff: float = 0.0
    expectedPaxDiff: int = 0
    status: str = "pending"
    creationTimestamp: Optional[str] = None

    class Config:
        from_attributes = True

class DecisionCreate(BaseModel):
    tripId: str
    action: str
    proposedFare: Optional[float] = None
    reason: Optional[str] = ""
    assumptions: Optional[List[str]] = []
    source: str = "recommendation"
    status: str = "accepted"  # accepted, rejected, override

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
