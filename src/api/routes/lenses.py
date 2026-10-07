"""Story lens API routes for Hritu.

Each endpoint computes a verdict for one story lens.
Routes call src/compute/lenses/* — they never compute themselves.
All data comes from cache/ or demo_fixtures/ (never live during demo).
"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OFFLINE = os.getenv("OFFLINE") == "1"

# District centroid lookup (subset — add all 64 for Story 3)
DISTRICT_COORDS = {
    "Rajshahi":    (24.37, 88.60),
    "Dhaka":       (23.81, 90.41),
    "Sylhet":      (24.90, 91.87),
    "Chittagong":  (22.36, 91.80),
    "Bhola":       (22.36, 90.64),
    "Barisal":     (22.70, 90.37),
    "Khulna":      (22.84, 89.54),
    "Rangpur":     (25.75, 89.25),
    "Cox's Bazar": (21.44, 92.01),
    "Mymensingh":  (24.75, 90.40),
}


class StoryRequest(BaseModel):
    district: str = "Rajshahi"
    lat: float | None = None
    lon: float | None = None


@router.get("/districts")
def list_districts():
    """Return the list of available districts with coordinates."""
    return [
        {"name": name, "lat": lat, "lon": lon}
        for name, (lat, lon) in DISTRICT_COORDS.items()
    ]


@router.post("/1/verdict")
def story1_winter_verdict(req: StoryRequest):
    """Story 1: The Winter Vacationer — cold day trend for a district.

    Returns the full trend report (provenance-ready JSON).
    """
    try:
        from src.compute.lenses.winter import analyze_winter_trend
        from src.acquire.power import fetch_power_daily

        lat, lon = _resolve_coords(req)
        df, source = fetch_power_daily(lat, lon)
        result = analyze_winter_trend(df, district=req.district)
        result["data_source"] = source
        result["story"] = 1
        result["offline_mode"] = OFFLINE
        return result
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Data not available. Run 'make cache' before the demo. ({e})"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/2/verdict")
def story2_monsoon_verdict(req: StoryRequest):
    """Story 2: The Rain-Lover — monsoon onset trend."""
    try:
        # TODO: Implement when IMERG data is cached
        # For now return a fixture stub
        return {
            "story": 2,
            "district": req.district,
            "verdict": "STUB",
            "message": "Story 2 (Monsoon) implementation in progress. Run 'make cache' first.",
            "offline_mode": OFFLINE,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/3/rankings")
def story3_district_rankings(top_n: int = 10):
    """Story 3: The Retirement Relocator — district heat index rankings."""
    try:
        # TODO: Implement full 64-district ranking
        return {
            "story": 3,
            "top_n": top_n,
            "message": "Story 3 (District Ranking) implementation in progress.",
            "offline_mode": OFFLINE,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/4/dhaka-correlation")
def story4_dhaka_correlation(start_year: int = 2012, end_year: int = 2025):
    """Story 4: The Urban Planner — LST vs nightlight correlation in Dhaka."""
    try:
        return {
            "story": 4,
            "start_year": start_year,
            "end_year": end_year,
            "message": "Story 4 (Urban Heat) implementation in progress. Requires MODIS + VIIRS cache.",
            "offline_mode": OFFLINE,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/5/verdict")
def story5_coastal_verdict(req: StoryRequest):
    """Story 5: The Coastal Defender — extreme event frequency trend."""
    try:
        from src.compute.lenses.coastal import analyze_extreme_trend
        from src.acquire.power import fetch_power_daily

        lat, lon = _resolve_coords(req)
        df, source = fetch_power_daily(lat, lon)
        result = analyze_extreme_trend(df, district=req.district)
        result["data_source"] = source
        result["story"] = 5
        result["offline_mode"] = OFFLINE
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=f"Data not available. ({e})")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _resolve_coords(req: StoryRequest) -> tuple[float, float]:
    """Resolve lat/lon from request or district name lookup."""
    if req.lat is not None and req.lon is not None:
        return req.lat, req.lon
    if req.district in DISTRICT_COORDS:
        return DISTRICT_COORDS[req.district]
    raise HTTPException(
        status_code=400,
        detail=f"District '{req.district}' not found. Provide lat/lon directly or use: {list(DISTRICT_COORDS.keys())}"
    )
