from fastapi import APIRouter
from ..services.anomalies import zscore_flags

router = APIRouter(prefix="/anomalies", tags=["anomalies"])

@router.get("/zscore")
def detect_zscore(metric_id: int, window: int = 24, threshold: float = 3):
    return {"anomalies": zscore_flags(metric_id, window, float(threshold))}
