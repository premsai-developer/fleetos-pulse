from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.audit import AuditEventModel
from app.schemas.audit import AuditEventSchema

router = APIRouter()

@router.get("/audit", response_model=List[AuditEventSchema])
def get_audit_events(
    recordId: Optional[str] = Query(None),
    eventType: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(AuditEventModel)
    if recordId:
        query = query.filter(AuditEventModel.associatedRecordId == recordId)
    if eventType:
        query = query.filter(AuditEventModel.eventType == eventType)
    
    return query.order_by(AuditEventModel.timestamp.desc()).all()
