"""Story 2: The Rain-Lover — The Delayed Monsoon.

Question: Is the monsoon arriving later each year in Bangladesh?
Data: GPM IMERG Final V07, 2000–2026
Metric: Monsoon onset day-of-year (DOY) — first 7-day rolling window
        with daily avg > 25mm AND no subsequent 5-day dry spell

NO LLM CALLS IN THIS FILE.
"""
import numpy as np
import pandas as pd
from src.compute.trend import full_trend_report

ONSET_THRESHOLD_MM = 25.0   # mm/day — minimum 7-day average for onset
ONSET_WINDOW_DAYS = 7        # rolling window
DRY_SPELL_THRESHOLD_MM = 5.0 # mm/day — dry spell threshold
DRY_SPELL_DAYS = 5           # consecutive days = false onset
SEARCH_START_DOY = 120       # May 1
SEARCH_END_DOY = 220         # Aug 8

DATASET_ID = "GPM_3IMERGDF_07"
SOURCE_URL = "https://gpm.nasa.gov/data/imerg"


def find_monsoon_onset_doy(
    precip_series: pd.Series,
    year: int,
    search_start_doy: int = SEARCH_START_DOY,
    search_end_doy: int = SEARCH_END_DOY,
) -> int | None:
    """Find monsoon onset day-of-year for a single year.

    Algorithm:
    1. Compute 7-day rolling mean precipitation
    2. Find first window where rolling mean > 25mm/day
    3. Verify: no subsequent 5-day dry spell within 15 days (false onset check)
    4. Return that window's start DOY, or None if no clear onset

    Args:
        precip_series: Daily precipitation Series with DatetimeIndex.
        year: Year to analyze.
        search_start_doy: Start of search window (DOY).
        search_end_doy: End of search window (DOY).

    Returns:
        Onset DOY (1-365), or None if no onset detected.
    """
    year_data = precip_series[precip_series.index.year == year].copy()
    if len(year_data) < 60:
        return None

    rolling = year_data.rolling(window=ONSET_WINDOW_DAYS, center=False).mean()
    candidates = rolling[
        (rolling > ONSET_THRESHOLD_MM) &
        (rolling.index.dayofyear >= search_start_doy) &
        (rolling.index.dayofyear <= search_end_doy)
    ]

    for idx in candidates.index:
        # Check for false onset (dry spell within 15 days)
        post_start = idx
        post_end = idx + pd.Timedelta(days=15)
        post_onset = year_data.loc[post_start:post_end]
        if len(post_onset) >= DRY_SPELL_DAYS:
            dry_run = (post_onset < DRY_SPELL_THRESHOLD_MM).rolling(DRY_SPELL_DAYS).sum()
            if (dry_run >= DRY_SPELL_DAYS).any():
                continue  # false onset — keep searching
        return int(idx.dayofyear)

    return None  # no clear onset detected


def analyze_monsoon_trend(
    precip_series: pd.Series,
    district: str = "Bangladesh",
) -> dict:
    """Full trend analysis for the Monsoon Onset story.

    Args:
        precip_series: Daily precipitation Series with DatetimeIndex.
                       Can come from IMERG or NASA POWER PRECTOTCORR (fallback).
        district: District or region name.

    Returns:
        Full trend report dict with annual_series attached.
    """
    years = sorted(precip_series.index.year.unique())
    onsets: dict[int, int] = {}
    for year in years:
        doy = find_monsoon_onset_doy(precip_series, year)
        if doy is not None:
            onsets[year] = doy

    if len(onsets) < 5:
        return {
            "error": "Insufficient onset detections for trend analysis (need >= 5 years).",
            "district": district,
            "dataset_id": DATASET_ID,
            "source_url": SOURCE_URL,
            "onsets_found": len(onsets),
        }

    onset_series = pd.Series(onsets)
    report = full_trend_report(
        values=list(onset_series.values),
        years=list(onset_series.index),
        metric="monsoon_onset_doy",
        district=district,
        dataset_id=DATASET_ID,
        source_url=SOURCE_URL,
    )

    report["annual_series"] = [
        {"year": y, "onset_doy": v,
         "onset_approx_date": pd.Timestamp(year=y, month=1, day=1) + pd.Timedelta(days=v - 1)}.update(  # type: ignore
            {}) or {"year": y, "onset_doy": v}
        for y, v in onsets.items()
    ]
    return report
