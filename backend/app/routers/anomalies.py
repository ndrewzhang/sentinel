# backend/app/routers/anomalies.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from ..db import SessionLocal
from .. import models
import math
from datetime import datetime

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/zscore")
def zscore(metric_id: int, window: int = 24, threshold: float = 3.0, db: Session = Depends(get_db)):
    # Pull series ordered by ts
    q = select(models.MetricPoint).where(models.MetricPoint.metric_id == metric_id).order_by(models.MetricPoint.ts.asc())
    rows = db.execute(q).scalars().all()
    if not rows:
        return {"anomalies": []}

    # rolling mean/std (simple, O(n*window), fine for demo scale)
    vals = [r.value for r in rows]
    ts = [r.ts for r in rows]
    anomalies = []

    for i in range(len(vals)):
        j0 = max(0, i - window + 1)
        window_vals = vals[j0:i+1]
        if len(window_vals) < 2:
            continue
        mean = sum(window_vals) / len(window_vals)
        var = sum((v - mean) ** 2 for v in window_vals) / (len(window_vals) - 1)
        std = math.sqrt(var) if var > 0 else 0.0
        if std == 0:
            continue
        z = abs((vals[i] - mean) / std)
        if z >= threshold:
            anomalies.append({"ts": ts[i], "value": vals[i], "z": z})

    return {"anomalies": anomalies}
