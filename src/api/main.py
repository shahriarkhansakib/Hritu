"""Hritu FastAPI Application.

ALL routes read from cache/ (or demo_fixtures/ when OFFLINE=1).
No route calls NASA APIs directly during a demo.

Run: uvicorn src.api.main:app --reload --port 8000
Demo: OFFLINE=1 uvicorn src.api.main:app --port 8000
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

OFFLINE = os.getenv("OFFLINE") == "1"

app = FastAPI(
    title="Hritu: Trend or Noise?",
    description="Earth System Trend Detective — NASA Space Apps 2026 Bangladesh",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "offline_mode": OFFLINE, "project": "Hritu"}


@app.get("/api/mode")
def mode():
    return {
        "offline": OFFLINE,
        "message": "📦 Running in OFFLINE=1 demo mode — reading from demo_fixtures/" if OFFLINE
        else "🌐 Live mode — fetching from NASA APIs (writing to cache/)",
    }


# Routes
from src.api.routes import lenses, provenance, data  # noqa: E402
app.include_router(data.router, prefix="/api", tags=["data"])          # /api/data, /api/metrics
app.include_router(lenses.router, prefix="/api/story", tags=["stories"])
app.include_router(provenance.router, prefix="/api/provenance", tags=["provenance"])

# Serve frontend static files (if built)
if os.path.exists("web/dist"):
    app.mount("/", StaticFiles(directory="web/dist", html=True), name="frontend")
elif os.path.exists("web"):
    app.mount("/static", StaticFiles(directory="web"), name="web")
