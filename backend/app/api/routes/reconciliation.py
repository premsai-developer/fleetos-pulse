from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.financials import DiscrepancyModel
from app.schemas.reconciliation import DiscrepancySchema, ImportResultSchema
from app.services.reconciliation import process_settlements_csv

router = APIRouter()

@router.get("/analytics/reconciliation", response_model=List[DiscrepancySchema])
def get_reconciliation_discrepancies(db: Session = Depends(get_db)):
    return db.query(DiscrepancyModel).all()

@router.post("/import/settlements", response_model=ImportResultSchema)
async def import_settlements(file: UploadFile = File(...)):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    contents = await file.read()
    return process_settlements_csv(contents, file.filename)

@router.post("/discrepancies/{discrepancy_id}/resolve")
def resolve_discrepancy(discrepancy_id: str, db: Session = Depends(get_db)):
    disc = db.query(DiscrepancyModel).filter(DiscrepancyModel.id == discrepancy_id).first()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy record not found")
    disc.status = "Resolved"
    db.commit()
    return {"status": "success", "id": discrepancy_id, "state": "Resolved"}
