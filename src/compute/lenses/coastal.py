"""Story 5: The Coastal Defender — Extreme Extremes.

Question: Are extreme weather events becoming more frequent or intense in coastal Bangladesh?
Data: NASA POWER WS50M_MAX (wind), PRECTOTCORR (precipitation)
Metric: Annual count of extreme rain days (P95) and extreme wind days

NO LLM CALLS IN THIS FILE.

Extreme event definition:
- Rain: daily PRECTOTCORR > 95th percentile of the historical baseline (1981-2010)
- Wind: daily WS50M_MAX > climatological 95th percentile
"""
import numpy as np
import pandas as pd
from src.compute.trend import full_trend_report

DATASET_ID = "NASA_POWER_AG_DAILY"
SOURCE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# Coastal districts for this story
COASTAL_DISTRICTS = {
    "Bhola":       (22.36, 90.64),
    "Barisal":     (22.70, 90.37),
    "Cox's Bazar": (21.44, 92.01),
    "Khulna":      (22.84, 89.54),
    "Patuakhali":  (22.36, 90.33),
}


def compute_extreme_thresholds(
    df: pd.DataFrame,
    baseline_start: int = 1981,
    baseline_end: int = 2010,
    percentile: float = 95.0,
) -> dict[str, float]:
    """Compute P95 thresholds from a historical baseline period.

    Args:
        df: DataFrame with DatetimeIndex and PRECTOTCORR, WS50M_MAX columns.
        baseline_start: Start year of baseline period.
        baseline_end: End year of baseline period.
        percentile: Percentile threshold (default 95).

    Returns:
        Dict with 'precip_threshold' and 'wind_threshold' in original units.
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        df = df.copy()
        df.index = pd.to_datetime(df.index.astype(str), format="%Y%m%d")

    baseline = df[(df.index.year >= baseline_start) & (df.index.year <= baseline_end)]

    thresholds = {}
    if "PRECTOTCORR" in baseline.columns:
        thresholds["precip_threshold"] = float(
            np.nanpercentile(baseline["PRECTOTCORR"].values, percentile)
        )
    if "WS50M_MAX" in baseline.columns:
        thresholds["wind_threshold"] = float(
            np.nanpercentile(baseline["WS50M_MAX"].values, percentile)
        )

    thresholds["percentile"] = percentile
    thresholds["baseline_period"] = f"{baseline_start}–{baseline_end}"
    return thresholds


def count_extreme_days_annual(
    df: pd.DataFrame,
    precip_threshold: float | None = None,
    wind_threshold: float | None = None,
) -> pd.DataFrame:
    """Count extreme rain and wind days per year.

    Args:
        df: POWER DataFrame with DatetimeIndex.
        precip_threshold: P95 threshold for PRECTOTCORR (mm/day).
        wind_threshold: P95 threshold for WS50M_MAX (m/s).

    Returns:
        DataFrame with columns: year, extreme_rain_days, extreme_wind_days.
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        df = df.copy()
        df.index = pd.to_datetime(df.index.astype(str), format="%Y%m%d")

    records = []
    for year, group in df.groupby(df.index.year):
        rain_days = 0
        wind_days = 0
        if precip_threshold is not None and "PRECTOTCORR" in group.columns:
            rain_days = int((group["PRECTOTCORR"] > precip_threshold).sum())
        if wind_threshold is not None and "WS50M_MAX" in group.columns:
            wind_days = int((group["WS50M_MAX"] > wind_threshold).sum())
        records.append({"year": year, "extreme_rain_days": rain_days, "extreme_wind_days": wind_days})

    return pd.DataFrame(records).set_index("year")


def analyze_extreme_trend(
    df: pd.DataFrame,
    district: str = "Bhola",
    percentile: float = 95.0,
) -> dict:
    """Full trend analysis for the Coastal Defender story.

    Runs Modified Mann-Kendall on both rain and wind extreme day counts.

    Args:
        df: NASA POWER DataFrame with PRECTOTCORR and WS50M_MAX columns.
        district: Coastal district name.
        percentile: Threshold percentile for extreme event definition.

    Returns:
        Dict with both rain_trend and wind_trend sub-reports.
    """
    thresholds = compute_extreme_thresholds(df, percentile=percentile)
    annual = count_extreme_days_annual(
        df,
        precip_threshold=thresholds.get("precip_threshold"),
        wind_threshold=thresholds.get("wind_threshold"),
    )

    years = list(annual.index)

    rain_report = full_trend_report(
        values=list(annual["extreme_rain_days"].values),
        years=years,
        metric=f"extreme_rain_days_p{int(percentile)}",
        district=district,
        dataset_id=DATASET_ID,
        source_url=SOURCE_URL,
    )
    rain_report["annual_series"] = [
        {"year": y, "extreme_rain_days": v}
        for y, v in zip(years, annual["extreme_rain_days"].values)
    ]

    wind_report = full_trend_report(
        values=list(annual["extreme_wind_days"].values),
        years=years,
        metric=f"extreme_wind_days_p{int(percentile)}",
        district=district,
        dataset_id=DATASET_ID,
        source_url=SOURCE_URL,
    )
    wind_report["annual_series"] = [
        {"year": y, "extreme_wind_days": v}
        for y, v in zip(years, annual["extreme_wind_days"].values)
    ]

    return {
        "district":    district,
        "dataset_id":  DATASET_ID,
        "source_url":  SOURCE_URL,
        "thresholds":  thresholds,
        "rain_trend":  rain_report,
        "wind_trend":  wind_report,
        "caveat": "NASA POWER MERRA-2 reanalysis. WS50M_MAX = max wind speed at 50m above surface.",
    }
