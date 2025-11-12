# backend/app/routers/ai.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from pydantic import BaseModel
import json

from ..db import SessionLocal
from .. import models
from ..services.ai import llm_complete, AINotConfigured

router = APIRouter(prefix="/ai", tags=["ai"])

# --- deps ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------
# GET /ai/suggest_rules
# ----------------------
@router.get("/suggest_rules")
def suggest_rules(
    dataset_id: int = Query(..., ge=1),
    sample_rows: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    ds = db.execute(
        select(models.Dataset).where(models.Dataset.id == dataset_id)
    ).scalar_one_or_none()
    if not ds:
        raise HTTPException(404, f"Dataset {dataset_id} not found")

    prompt = f"""
You are a data quality assistant. For a dataset named '{ds.name}', propose practical data quality checks:
- suggest reasonable null percentage limits for likely nullable columns,
- value ranges for numeric-looking columns,
- uniqueness candidates (like id, email),
- simple type/format checks (e.g., timestamp format).
Return STRICT JSON with this shape:
{{
  "rules": [
    {{"rule": "...", "rationale": "...", "suggested_threshold": "..."}}
  ]
}}
Keep it to 5–8 concise rules.
"""

    try:
        text = llm_complete(prompt)  # MUST be a string
        # Try to parse JSON
        import json
        try:
            parsed = json.loads(text)
            # Make sure we always return a predictable object
            if isinstance(parsed, dict) and "rules" in parsed:
                return {"rules": parsed["rules"]}
            # If model returned a list, wrap it
            if isinstance(parsed, list):
                return {"rules": parsed}
            # Fallback: wrap whatever dict it sent
            return {"rules_text": text}
        except Exception:
            # If not JSON, send back as text so UI shows something
            return {"rules_text": text}

    except AINotConfigured as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        # LLM error path
        raise HTTPException(502, str(e))

# -------------------------
# GET /ai/explain_anomaly
# -------------------------
@router.get("/explain_anomaly")
def explain_anomaly(
    metric_id: int = Query(..., ge=1),
    index: int = Query(..., ge=0),
    db: Session = Depends(get_db),
):
    """
    Explain an anomaly around a specific point INDEX (0-based) in the ordered series.
    Returns a short explanation and a small context window.
    """
    m = db.execute(
        select(models.Metric).where(models.Metric.id == metric_id)
    ).scalar_one_or_none()
    if not m:
        raise HTTPException(404, f"Metric {metric_id} not found")

    points = db.execute(
        select(models.MetricPoint)
        .where(models.MetricPoint.metric_id == metric_id)
        .order_by(models.MetricPoint.ts.asc())
    ).scalars().all()

    if not points:
        raise HTTPException(404, "No points found for this metric")
    if index < 0 or index >= len(points):
        raise HTTPException(400, "Index out of range")

    start = max(0, index - 5)
    end = min(len(points), index + 6)
    neighborhood = [{"ts": p.ts.isoformat(), "value": p.value} for p in points[start:end]]
    center = {"ts": points[index].ts.isoformat(), "value": points[index].value}
    prev = {"ts": points[index - 1].ts.isoformat(), "value": points[index - 1].value} if index - 1 >= 0 else None
    nxt = {"ts": points[index + 1].ts.isoformat(), "value": points[index + 1].value} if index + 1 < len(points) else None

    prompt = f"""
We have a time series metric with a suspicious point at index {index}.
Neighborhood (prev/center/next): prev={json.dumps(prev)}, center={json.dumps(center)}, next={json.dumps(nxt)}.
Nearby window: {json.dumps(neighborhood)}
Explain concisely (2–4 sentences) why this point might be anomalous, plausible causes, and 1–2 next steps to validate.
Only return plain text.
"""
    try:
        text = llm_complete(prompt) or ""
        return {"explanation": text.strip(), "point": center, "window": neighborhood}
    except AINotConfigured as e:
        raise HTTPException(400, str(e))


# ----------------------------
# POST /ai/generate_metric
# ----------------------------
class MetricPrompt(BaseModel):
    dataset_id: int
    prompt: str


@router.post("/generate_metric")
def generate_metric(
    body: MetricPrompt,
    db: Session = Depends(get_db),
):
    """
    Ask the LLM to suggest a metric spec (name, ts_column, value_column), then create it in DB.
    Returns the created metric fields.
    """
    ds = db.execute(
        select(models.Dataset).where(models.Dataset.id == body.dataset_id)
    ).scalar_one_or_none()
    if not ds:
        raise HTTPException(404, "Dataset not found")

    meta_prompt = f"""
User prompt: "{body.prompt}"
Dataset name: "{ds.name}"

Return STRICT JSON ONLY with keys:
  "metric_name" (string),
  "ts_column" (string),
  "value_column" (string)
No extra prose.
"""
    try:
        text = llm_complete(meta_prompt) or ""
        try:
            spec = json.loads(text)
        except Exception:
            raise HTTPException(400, "AI spec parse failed (not valid JSON)")

        name = spec.get("metric_name")
        ts_col = spec.get("ts_column")
        val_col = spec.get("value_column")
        if not name or not ts_col or not val_col:
            raise HTTPException(400, "AI spec missing required fields")

        m = models.Metric(
            dataset_id=body.dataset_id,
            name=name,
            ts_column=ts_col,
            value_column=val_col,
        )
        db.add(m)
        db.commit()
        db.refresh(m)
        return {
            "id": m.id,
            "name": m.name,
            "ts_column": m.ts_column,
            "value_column": m.value_column,
        }
    except AINotConfigured as e:
        raise HTTPException(400, str(e))


@router.get("/health")
def ai_health():
    from ..config import settings
    return {
        "provider": getattr(settings, "AI_PROVIDER", None),
        "openai_model": getattr(settings, "OPENAI_MODEL", None),
        "has_key": bool(getattr(settings, "OPENAI_API_KEY", "")),
    }

