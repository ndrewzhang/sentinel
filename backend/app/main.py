from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .routers import datasets
from .routers import ingest 
from .routers import metrics
from .routers import anomalies

app = FastAPI()
app.include_router(datasets.router)
app.include_router(ingest.router)
app.include_router(metrics.router)
app.include_router(anomalies.router)

@app.get("/health")
def health():
    return {"status": "ok"}

# Serve frontend if folder exists
frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
