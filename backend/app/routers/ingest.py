from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
from ..db import SessionLocal, engine
from ..models import Dataset
from ..services.quality import null_percent_rule, range_rule, unique_rule 

router = APIRouter(prefix="/ingest", tags=["ingest"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/upload")
async def upload_csv(dataset_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    ds = db.query(Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file")

    content = await file.read()
    try:
        df = pd.read_csv(pd.io.common.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="CSV contains no rows")

    table_name = f"staging_{ds.id}"
    df.to_sql(table_name, con=engine, if_exists="replace", index=False)

    with engine.connect() as conn:
        count = conn.execute(text(f'SELECT COUNT(*) FROM {table_name}')).scalar()

    return {"rows": int(count), "table": table_name, "columns": list(df.columns)}


@router.post("/dq/null_percent")
def run_null_percent(
    dataset_id: int,
    column: str = Body(...),
    max_null_ratio: float = Body(...),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    table = f"staging_{ds.id}"
    passed, details = null_percent_rule(table, column, max_null_ratio)
    severity = "ok" if passed else ("high" if details["null_ratio"] > 0.20 else "medium")
    return {"passed": passed, "severity": severity, "details": details}

@router.post("/dq/range")
def run_range(
    dataset_id: int,
    column: str = Body(...),
    min_value: float | None = Body(None),
    max_value: float | None = Body(None),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    table = f"staging_{ds.id}"
    passed, details = range_rule(table, column, min_value, max_value)
    severity = "ok" if passed else ("high" if details["violation_ratio"] > 0.1 else "medium")
    return {"passed": passed, "severity": severity, "details": details}

@router.post("/dq/unique")
def run_unique(
    dataset_id: int,
    column: str = Body(...),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    table = f"staging_{ds.id}"
    passed, details = unique_rule(table, column)
    severity = "ok" if passed else ("medium" if details["duplicates"] < 10 else "high")
    return {"passed": passed, "severity": severity, "details": details}