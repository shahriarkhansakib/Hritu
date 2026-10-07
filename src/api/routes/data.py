"""Unified /api/data endpoint — the backbone of Hritu.

This single endpoint powers all 4 views:
  - Single region explorer
  - Multi-region comparison (called N times, one per region)
  - Before/After split (called once, split on change_point_year)
  - Trend table (called once per cell)

Request:
  GET /api/data?lat=23.81&lon=90.41&metric=T2M_MIN&start_year=1981&end_year=2026

  OR for a bbox (region average):
  GET /api/data?bbox=88.0,20.6,92.7,26.6&metric=T2M_MIN&start_year=1981&end_year=2026

Response:
  Full trend report + annual_series + slope_line + provenance fields

OFFLINE=1: reads from cache/ or demo_fixtures/ — never calls NASA
"""
from __future__ import annotations

import os
import numpy as np
from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from src.acquire.power import power_daily, ALL_POWER_PARAMS
from src.compute.aggregation import (
    aggregate_metric,
    build_slope_line,
    METRIC_REGISTRY,
)
from src.compute.trend import full_trend_report

router = APIRouter()

OFFLINE = os.getenv("OFFLINE") == "1"

DATASET_ID = "NASA_POWER_AG_DAILY"
SOURCE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
RESOLUTION_NOTE = "NASA POWER MERRA-2 reanalysis. Grid resolution: ~0.5°×0.625° (~55km×70km). Not station observations."


@router.get("/data")
def get_trend_data(
    metric: str = Query(..., description=f"Metric to analyze. Options: {list(METRIC_REGISTRY.keys())}"),
    lat: Optional[float] = Query(None, description="Latitude (single point mode)"),
    lon: Optional[float] = Query(None, description="Longitude (single point mode)"),
    bbox: Optional[str] = Query(None, description="Bounding box: 'west,south,east,north' (region average mode)"),
    start_year: int = Query(1981, description="Start year (POWER available from 1981)"),
    end_year: int = Query(2026, description="End year"),
    location_name: Optional[str] = Query(None, description="Human-readable location name for display"),
    interval: str = Query("annual", description="Aggregation interval (annual or monthly)"),
):
    """Unified trend data endpoint. Supports single-point and bbox region modes."""
    # ── Validate metric ───────────────────────────────────────────────────────
    if metric not in METRIC_REGISTRY:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown metric '{metric}'. Available: {list(METRIC_REGISTRY.keys())}"
        )
    if interval not in ["annual", "monthly"]:
        raise HTTPException(status_code=400, detail="Interval must be 'annual' or 'monthly'")
    if start_year < 1981:
        raise HTTPException(
            status_code=400, 
            detail="NASA POWER (MERRA-2) climate data is only available from 1981 onwards."
        )

    # ── Resolve coordinates ───────────────────────────────────────────────────
    if bbox is not None:
        try:
            west, south, east, north = [float(v) for v in bbox.split(",")]
        except Exception:
            raise HTTPException(status_code=400, detail="bbox must be 'west,south,east,north'")
        points = _bbox_to_grid_points(west, south, east, north)
        mode = "bbox"
    elif lat is not None and lon is not None:
        points = [(lat, lon)]
        mode = "point"
    else:
        raise HTTPException(status_code=400, detail="Provide either lat+lon or bbox")

    # ── Fetch POWER data ──────────────────────────────────────────────────────
    start_str = f"{start_year}0101"
    end_str = f"{end_year}1231"

    try:
        annual_series, data_source, n_points = _fetch_and_aggregate(
            points, metric, start_str, end_str, interval
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if len(annual_series) < (24 if interval == "monthly" else 4):
        raise HTTPException(
            status_code=422,
            detail=f"Insufficient data: only {len(annual_series)} points available."
        )

    # ── Build exact NASA URL for Provenance ───────────────────────────────────
    req_params = ",".join(METRIC_REGISTRY[metric]["params"])
    if mode == "point":
        exact_source_url = f"https://power.larc.nasa.gov/api/temporal/daily/point?parameters={req_params}&community=AG&latitude={lat}&longitude={lon}&start={start_str}&end={end_str}&format=JSON"
    else:
        exact_source_url = f"https://power.larc.nasa.gov/api/temporal/daily/regional?parameters={req_params}&community=AG&bbox={bbox}&start={start_str}&end={end_str}&format=JSON"

    # ── Run trend analysis ────────────────────────────────────────────────────
    years_or_months = list(annual_series.index)
    values = list(annual_series.values)

    report = full_trend_report(
        values=values,
        years=years_or_months if interval == "annual" else None,
        metric=metric,
        district=location_name or _describe_location(lat, lon, bbox),
        dataset_id=DATASET_ID,
        source_url=exact_source_url,
        interval=interval
    )

    # ── Build slope line for chart ────────────────────────────────────────────
    # For annual data, ci_low is used as the intercept returned by theilsen. For monthly, intercept is returned explicitly.
    intercept = report.get("intercept", report.get("ci_low", 0.0)) 
    slope = report.get("slope_per_year", 0.0)
    if interval == "monthly":
        slope = slope / 12  # slope_per_year back to slope_per_step
        
    slope_line = build_slope_line(annual_series, slope, intercept)

    # ── Before/After split (using Pettitt change point) ───────────────────────
    before_after = None
    if report.get("change_point_significant") and report.get("change_point_year"):
        cp_year = report["change_point_year"]
        before_vals = [v for y, v in zip(years_or_months, values) if y <= cp_year]
        after_vals = [v for y, v in zip(years_or_months, values) if y > cp_year]
        before_after = {
            "change_point_year": cp_year,
            "before": {
                "period": f"{years_or_months[0]}–{cp_year}",
                "mean": round(float(np.nanmean(before_vals)), 3) if before_vals else None,
                "n": len(before_vals),
            },
            "after": {
                "period": f"{cp_year + 1}–{years_or_months[-1]}",
                "mean": round(float(np.nanmean(after_vals)), 3) if after_vals else None,
                "n": len(after_vals),
            },
        }

    # ── Compose response ──────────────────────────────────────────────────────
    metric_info = METRIC_REGISTRY[metric]
    
    valid_values = [v for v in values if not np.isnan(v)]
    baseline_mean = float(np.mean(valid_values)) if valid_values else 0.0
    
    series_with_anomalies = []
    for y, v in zip(years_or_months, values):
        val = round(float(v), 4) if not np.isnan(v) else None
        anom = round(float(v - baseline_mean), 4) if val is not None else None
        series_with_anomalies.append({"year": str(y), "value": val, "anomaly": anom})

    return {
        **report,
        "annual_series": series_with_anomalies,
        "baseline_mean": round(baseline_mean, 4),
        "slope_line": slope_line,
        "before_after": before_after,
        "metric_label": metric_info["label"],
        "metric_unit": metric_info["unit"],
        "metric_description": metric_info["description"],
        "location_name": location_name or _describe_location(lat, lon, bbox),
        "period": f"{start_year}–{end_year}",
        "interval": interval,
        "mode": mode,
        "n_grid_points": n_points,
        "data_source": data_source,
        "resolution_note": RESOLUTION_NOTE,
        "offline_mode": OFFLINE,
    }


@router.get("/metrics")
def list_metrics():
    """Return all available metrics with labels and units."""
    return [
        {
            "id": k,
            "label": v["label"],
            "unit": v["unit"],
            "description": v["description"],
            "power_params": v["params"],
        }
        for k, v in METRIC_REGISTRY.items()
    ]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _bbox_to_grid_points(
    west: float, south: float, east: float, north: float,
    step: float = 0.5,
) -> list[tuple[float, float]]:
    """Generate a grid of POWER sample points within a bounding box.

    Uses 0.5° step (matching POWER grid resolution) to avoid redundant calls.
    Caps at 25 points to prevent API abuse.
    """
    lats = np.arange(south, north + step, step)
    lons = np.arange(west, east + step, step)
    points = [(round(float(la), 2), round(float(lo), 2)) for la in lats for lo in lons]
    return points[:25]  # cap at 25 grid points


def _fetch_and_aggregate(
    points: list[tuple[float, float]],
    metric: str,
    start: str,
    end: str,
    interval: str = "annual",
) -> tuple:
    """Fetch POWER data for all points and return averaged series."""
    import pandas as pd
    from src.compute.aggregation import METRIC_REGISTRY

    required_params = ",".join(METRIC_REGISTRY[metric]["params"])
    fetch_params = ALL_POWER_PARAMS

    series_list = []
    last_source = "live"

    for lat, lon in points:
        df, source = power_daily(lat, lon, start, end, fetch_params)
        last_source = source
        annual = aggregate_metric(df, metric, interval)
        series_list.append(annual)

    if not series_list:
        raise ValueError("No data points returned")

    if len(series_list) == 1:
        combined = series_list[0]
    else:
        combined_df = pd.concat(series_list, axis=1)
        combined = combined_df.mean(axis=1)

    return combined.dropna(), last_source, len(points)


def _describe_location(
    lat: Optional[float], lon: Optional[float], bbox: Optional[str]
) -> str:
    if bbox:
        return f"Region ({bbox})"
    if lat is not None and lon is not None:
        return f"({lat:.2f}°N, {lon:.2f}°E)"
    return "Unknown"
