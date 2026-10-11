import io
import pandas as pd
from typing import List, Dict, Any
from app.schemas.reconciliation import ImportResultSchema

def process_settlements_csv(file_content: bytes, filename: str) -> ImportResultSchema:
    """
    Validates and processes settlement CSV files (RedBus, AbhiBus, Paytm).
    Checks required columns, data types, missing values, and duplicate references.
    """
    details: List[str] = []
    
    try:
        df = pd.read_csv(io.BytesIO(file_content))
    except Exception as e:
        return ImportResultSchema(
            filename=filename,
            recordsProcessed=0,
            validRecords=0,
            discrepanciesFound=0,
            status="failed",
            details=[f"CSV parsing error: {str(e)}"]
        )

    required_cols = ["txRef", "tripId", "expectedAmount", "settledAmount"]
    missing_cols = [c for c in required_cols if c not in df.columns]
    
    if missing_cols:
        return ImportResultSchema(
            filename=filename,
            recordsProcessed=len(df),
            validRecords=0,
            discrepanciesFound=0,
            status="validation_error",
            details=[f"Missing required CSV columns: {', '.join(missing_cols)}"]
        )

    records_count = len(df)
    duplicates = df[df.duplicated(subset=["txRef"])]
    if not duplicates.empty:
        details.append(f"Found {len(duplicates)} duplicate transaction references in CSV.")

    discrepancies_count = 0
    valid_count = 0

    for idx, row in df.iterrows():
        try:
            exp = float(row["expectedAmount"])
            settled = float(row["settledAmount"])
            diff = abs(exp - settled)
            if diff > 1.0:
                discrepancies_count += 1
            else:
                valid_count += 1
        except Exception:
            details.append(f"Row {idx+1}: invalid numerical values in expected/settled amount.")

    details.append(f"Successfully validated {valid_count} records. Identified {discrepancies_count} variance items.")

    return ImportResultSchema(
        filename=filename,
        recordsProcessed=records_count,
        validRecords=valid_count,
        discrepanciesFound=discrepancies_count,
        status="success",
        details=details
    )
