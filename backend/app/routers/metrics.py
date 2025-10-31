from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import pandas as pd
from ..db import SessionLocal, engine
from ..models import Dataset, Metric, MetricPoint

router = APIRouter(prefix="/metrics", tags=["metrics"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("")
def create_metric(dataset_id: int, name: str, ts_column: str, value_column: str, db: Session = Depends(get_db)):
    if not db.query(Dataset).get(dataset_id):
        raise HTTPException(status_code=404, detail="Dataset not found")
    m = Metric(dataset_id=dataset_id, name=name, ts_column=ts_column, value_column=value_column)
    db.add(m); db.commit(); db.refresh(m)
    return {"id": m.id}

@router.post("/{metric_id}/backfill")
def backfill(metric_id: int, db: Session = Depends(get_db)):
    m = db.query(Metric).get(metric_id)
    if not m: raise HTTPException(status_code=404, detail="Metric not found")
    table = f"staging_{m.dataset_id}"
    with engine.connect() as conn:
        df = pd.read_sql(text(f'SELECT "{m.ts_column}" as ts, "{m.value_column}" as value FROM {table}'), conn)
    rows = [MetricPoint(metric_id=m.id, ts=pd.to_datetime(r.ts), value=float(r.value)) for r in df.itertuples(index=False)]
    if rows:
        db.bulk_save_objects(rows)
        db.commit()
    return {"inserted": len(rows)}

@router.get("/{metric_id}/series")
def series(metric_id: int, limit: int = 500, db: Session = Depends(get_db)):
    q = db.query(MetricPoint).filter(MetricPoint.metric_id == metric_id).order_by(MetricPoint.ts.asc()).limit(limit)
    points = [{"ts": mp.ts.isoformat(), "value": mp.value} for mp in q.all()]
    return {"points": points}
