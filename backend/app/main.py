from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .routers import datasets, ingest, metrics, anomalies, ai

app = FastAPI()

# --- CORS: allow the Vite dev server to call your API ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
app.include_router(datasets.router)
app.include_router(ingest.router)
app.include_router(metrics.router)
app.include_router(anomalies.router)
app.include_router(ai.router)


@app.get("/health")
def health():
    return {"status": "ok"}

# --- Serve the built frontend *only in production* ---
# When you run `npm run build` in /frontend, Vite outputs to /frontend/dist.
# We mount that folder so FastAPI can serve the SPA in production.
project_root = Path(__file__).resolve().parents[2]
vite_dist = project_root / "frontend" / "dist"
if vite_dist.exists():
    app.mount("/", StaticFiles(directory=str(vite_dist), html=True), name="frontend")
