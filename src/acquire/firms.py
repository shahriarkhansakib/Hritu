"""NASA FIRMS (Fire Information for Resource Management System) client.

Note: Suomi-NPP VIIRS ends 1 November 2026.
Prefer VIIRS_NOAA20_NRT or VIIRS_NOAA21_NRT for current data.
"""
from __future__ import annotations

import os
import pandas as pd

FIRMS_KEY = os.getenv("FIRMS_MAP_KEY", "")

# Bangladesh bounding box: west,south,east,north
BD_BBOX = "88,20,93,27"


def firms_area(
    sensor: str = "VIIRS_NOAA20_NRT",
    bbox: str = BD_BBOX,
    days: int = 1,
) -> tuple[pd.DataFrame, str]:
    """Fetch active fire/weather detections from NASA FIRMS.

    Args:
        sensor: FIRMS sensor product. Prefer VIIRS_NOAA20_NRT (Suomi-NPP ends Nov 2026).
        bbox: Bounding box as 'west,south,east,north'.
        days: Number of days back (1-10).

    Returns:
        Tuple of (DataFrame with detections, source label).
    """
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_KEY}/{sensor}/{bbox}/{days}"
    try:
        df = pd.read_csv(url)
        return df, "live"
    except Exception as e:
        print(f"FIRMS fetch failed: {e}")
        return pd.DataFrame(), "error"
