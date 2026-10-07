"""Metric aggregation: raw NASA POWER daily data → clean annual series.

CRITICAL: No LLM calls in this file. Ever.
All functions are pure Python / Pandas / NumPy.

Each metric_aggregator() function takes a DataFrame from power_daily()
and returns a pd.Series indexed by year with one value per year.
The Series is then passed to full_trend_report() in trend.py.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


# ── Metric registry ───────────────────────────────────────────────────────────
# Maps metric name → (POWER parameter(s), aggregation function, unit label)

METRIC_REGISTRY: dict[str, dict] = {
    "T2M_MIN": {
        "params": ["T2M_MIN"],
        "label": "Annual Mean Daily Min Temperature",
        "unit": "°C",
        "description": "Annual mean of daily minimum temperatures",
        "aggregation": "annual_mean",
    },
    "T2M_MAX": {
        "params": ["T2M_MAX"],
        "label": "Annual Mean Daily Max Temperature",
        "unit": "°C",
        "description": "Annual mean of daily maximum temperatures",
        "aggregation": "annual_mean",
    },
    "T2M": {
        "params": ["T2M"],
        "label": "Annual Mean Temperature",
        "unit": "°C",
        "description": "Annual mean of daily mean temperatures",
        "aggregation": "annual_mean",
    },
    "PRECTOTCORR": {
        "params": ["PRECTOTCORR"],
        "label": "Annual Total Precipitation",
        "unit": "mm",
        "description": "Annual total precipitation (corrected)",
        "aggregation": "annual_sum",
    },
    "RH2M": {
        "params": ["RH2M"],
        "label": "Annual Mean Relative Humidity",
        "unit": "%",
        "description": "Annual mean relative humidity at 2m",
        "aggregation": "annual_mean",
    },
    "WS50M_MAX": {
        "params": ["WS50M_MAX"],
        "label": "Annual Mean Max Wind Speed (50m)",
        "unit": "m/s",
        "description": "Annual mean of daily max wind speed at 50m",
        "aggregation": "annual_mean",
    },
    "HEAT_INDEX": {
        "params": ["T2M_MAX", "RH2M"],
        "label": "Annual Mean Heat Index",
        "unit": "°C",
        "description": "Rothfusz heat index (valid for T≥27°C, RH≥40%)",
        "aggregation": "heat_index",
    },
    "EXTREME_RAIN_DAYS": {
        "params": ["PRECTOTCORR"],
        "label": "Annual Extreme Rain Days (P95)",
        "unit": "days/year",
        "description": "Count of days exceeding 95th percentile precipitation",
        "aggregation": "extreme_count_p95",
    },
    "WARM_NIGHTS": {
        "params": ["T2M_MIN"],
        "label": "Annual Warm Nights (T90)",
        "unit": "days/year",
        "description": "Count of nights exceeding 90th percentile T_min",
        "aggregation": "extreme_count_p90",
    },
}

# POWER parameters required for all metrics combined
ALL_POWER_PARAMS = "T2M_MIN,T2M_MAX,T2M,RH2M,PRECTOTCORR,WS50M_MAX"


# ── Aggregation functions ─────────────────────────────────────────────────────

def _group(df: pd.DataFrame, param: str, interval: str):
    if interval == "monthly":
        s = df[param].groupby([df.index.year, df.index.month]).mean()
        s.index = [f"{y}-{m:02d}" for y, m in s.index]
        return s
    return df[param].groupby(df.index.year).mean()

def _group_sum(df: pd.DataFrame, param: str, interval: str):
    if interval == "monthly":
        s = df[param].groupby([df.index.year, df.index.month]).sum()
        s.index = [f"{y}-{m:02d}" for y, m in s.index]
        return s
    return df[param].groupby(df.index.year).sum()

def annual_mean(df: pd.DataFrame, param: str, interval: str = "annual") -> pd.Series:
    return _group(df, param, interval)

def annual_sum(df: pd.DataFrame, param: str, interval: str = "annual") -> pd.Series:
    return _group_sum(df, param, interval)

def _rothfusz_heat_index(T_c: float, RH: float) -> float:
    T_f = T_c * 9 / 5 + 32
    HI_f = -42.379 + 2.04901523*T_f + 10.14333127*RH - 0.22475541*T_f*RH - 0.00683783*T_f**2 - 0.05481717*RH**2 + 0.00122874*T_f**2*RH + 0.00085282*T_f*RH**2 - 0.00000199*T_f**2*RH**2
    return (HI_f - 32) * 5 / 9

def annual_heat_index(df: pd.DataFrame, interval: str = "annual") -> pd.Series:
    mask = (df["T2M_MAX"] >= 27) & (df["RH2M"] >= 40)
    valid = df[mask].copy()
    if len(valid) == 0:
        return _group(df, "T2M_MAX", interval) * float("nan")
    valid["_hi"] = valid.apply(lambda r: _rothfusz_heat_index(r["T2M_MAX"], r["RH2M"]), axis=1)
    return _group(valid, "_hi", interval)

def annual_extreme_count(df: pd.DataFrame, param: str, percentile: float, interval: str = "annual") -> pd.Series:
    threshold = float(np.nanpercentile(df[param].values, percentile))
    valid = df.copy()
    valid["_ext"] = (valid[param] > threshold).astype(float)
    return _group_sum(valid, "_ext", interval)

# ── Main entry point ──────────────────────────────────────────────────────────

def aggregate_metric(df: pd.DataFrame, metric: str, interval: str = "annual") -> pd.Series:
    if metric not in METRIC_REGISTRY:
        raise ValueError(f"Unknown metric '{metric}'")

    spec = METRIC_REGISTRY[metric]
    agg = spec["aggregation"]

    if not isinstance(df.index, pd.DatetimeIndex):
        df = df.copy()
        df.index = pd.to_datetime(df.index.astype(str), format="%Y%m%d")

    if agg == "annual_mean":
        return annual_mean(df, spec["params"][0], interval)
    elif agg == "annual_sum":
        return annual_sum(df, spec["params"][0], interval)
    elif agg == "heat_index":
        return annual_heat_index(df, interval)
    elif agg == "extreme_count_p95":
        return annual_extreme_count(df, spec["params"][0], 95.0, interval)
    elif agg == "extreme_count_p90":
        return annual_extreme_count(df, spec["params"][0], 90.0, interval)
    else:
        raise ValueError(f"Unknown aggregation type: {agg}")

def build_slope_line(series: pd.Series, slope: float, intercept: float) -> list[dict]:
    # Returns raw slope calculation points (if any charts need them)
    return [{"year": str(y), "fitted": round(intercept + slope * i, 4)} for i, y in enumerate(series.index)]

