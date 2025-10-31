import pandas as pd
from sqlalchemy import text
from ..db import engine

def zscore_flags(metric_id: int, window: int = 24, threshold: float = 3.0):
    q = text("SELECT ts, value FROM metric_points WHERE metric_id=:mid ORDER BY ts")
    with engine.connect() as conn:
        df = pd.read_sql(q, conn, params={"mid": metric_id})
    if df.empty:
        return []
    df["mean"] = df["value"].rolling(window, min_periods=window).mean()
    df["std"]  = df["value"].rolling(window, min_periods=window).std()
    df["z"] = (df["value"] - df["mean"]) / df["std"]
    flags = df[(df["std"] > 0) & (df["z"].abs() >= threshold)]
    return [{"ts": str(r.ts), "value": float(r.value), "z": float(r.z)} for r in flags.itertuples(index=False)]
