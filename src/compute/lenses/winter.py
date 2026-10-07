"""Story 1: The Winter Vacationer — The Missing Cold.

Question: Has the cold season (days ≤ 14°C in Dec20-Jan5) disappeared?
Data: NASA POWER T2M_MIN, 1981–2026
Metric: Annual count of days with T2M_MIN ≤ 14°C in the Dec 20 – Jan 5 window

NO LLM CALLS IN THIS FILE.
"""
import pandas as pd
import numpy as np
from src.compute.trend import full_trend_report

COLD_THRESHOLD = 14.0  # °C — Bangladesh Meteorological Dept cold wave threshold
DATASET_ID = "NASA_POWER_AG_DAILY"
SOURCE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"


def count_cold_days_annual(
    df: pd.DataFrame,
    cold_threshold: float = COLD_THRESHOLD,
) -> pd.Series:
    """Count days with T2M_MIN ≤ threshold in the Dec20-Jan5 window each year.

    Args:
        df: DataFrame with DatetimeIndex (or YYYYMMDD string index) and 'T2M_MIN' column.
        cold_threshold: Cold day threshold in °C.

    Returns:
        Series indexed by year (of December), values = cold day count.
    """
    df = df.copy()
    # Parse index — POWER returns YYYYMMDD integer strings
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index.astype(str), format="%Y%m%d")

    if "T2M_MIN" not in df.columns:
        raise ValueError("DataFrame must have a 'T2M_MIN' column")

    annual_counts = {}
    years = sorted(df.index.year.unique())

    for year in years[:-1]:  # skip last year (Jan window crosses into next year)
        dec_slice = df.loc[
            pd.Timestamp(year, 12, 20):pd.Timestamp(year, 12, 31), "T2M_MIN"
        ]
        jan_slice = df.loc[
            pd.Timestamp(year + 1, 1, 1):pd.Timestamp(year + 1, 1, 5), "T2M_MIN"
        ]
        window = pd.concat([dec_slice, jan_slice])
        annual_counts[year] = int((window <= cold_threshold).sum())

    return pd.Series(annual_counts, name="cold_day_count")


def analyze_winter_trend(
    df: pd.DataFrame,
    district: str = "Rajshahi",
    cold_threshold: float = COLD_THRESHOLD,
) -> dict:
    """Full trend analysis for the Winter Vacationer story.

    Args:
        df: DataFrame from NASA POWER with T2M_MIN column.
        district: District name for report metadata.
        cold_threshold: Cold day threshold in °C.

    Returns:
        Full trend report dict (provenance-ready for the Explanation Agent).
    """
    annual = count_cold_days_annual(df, cold_threshold)
    years = list(annual.index)
    values = list(annual.values)

    report = full_trend_report(
        values=values,
        years=years,
        metric=f"cold_days_lte{cold_threshold}C_dec20_jan5",
        district=district,
        dataset_id=DATASET_ID,
        source_url=SOURCE_URL,
    )

    # Attach the annual series for charting
    report["annual_series"] = [
        {"year": y, "cold_day_count": v} for y, v in zip(years, values)
    ]
    report["cold_threshold_c"] = cold_threshold
    return report
