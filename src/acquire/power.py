"""NASA POWER daily climate data client.

Dataset: NASA POWER AG Daily
dataset_id: NASA_POWER_AG_DAILY
source_url: https://power.larc.nasa.gov
Note: MERRA-2 model-reanalysis, not station observations. Resolution: 0.5°x0.625°.
"""
from __future__ import annotations

import pandas as pd

from src.acquire.safe import fetch_json

# Bangladesh district centroids (lat, lon)
DISTRICT_COORDS: dict[str, tuple[float, float]] = {
    "Dhaka": (23.81, 90.41),
    "Rajshahi": (24.37, 88.60),
    "Bhola": (22.36, 90.64),
    "Barisal": (22.70, 90.37),
    "Cox's Bazar": (21.44, 92.01),
    "Khulna": (22.83, 89.55),
    "Sylhet": (24.90, 91.87),
    "Chittagong": (22.34, 91.84),
}

DEFAULT_PARAMS = "T2M_MIN,T2M_MAX,T2M,RH2M,PRECTOTCORR,WS50M_MAX"
ALL_POWER_PARAMS = DEFAULT_PARAMS  # exported alias used by data.py and aggregation.py


def power_daily(
    lat: float,
    lon: float,
    start: str = "19810101",
    end: str = "20261231",
    params: str = DEFAULT_PARAMS,
) -> tuple[pd.DataFrame, str]:
    """Fetch NASA POWER daily climate data for a single point.

    Args:
        lat: Latitude in decimal degrees.
        lon: Longitude in decimal degrees.
        start: Start date as YYYYMMDD string.
        end: End date as YYYYMMDD string.
        params: Comma-separated POWER parameter names.

    Returns:
        Tuple of (DataFrame with date index and parameter columns, source label).

    Example:
        df, source = power_daily(24.37, 88.60)  # Rajshahi
        cold_days = df[df['T2M_MIN'] <= 14.0]
    """
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    q = dict(
        parameters=params,
        community="AG",
        latitude=lat,
        longitude=lon,
        start=start,
        end=end,
        format="JSON",
    )
    data, source = fetch_json(
        url, params=q, name=f"power_{lat}_{lon}_{start}_{end}"
    )
    df = pd.DataFrame(data["properties"]["parameter"])
    df.index = pd.to_datetime(df.index, format="%Y%m%d")
    df.index.name = "date"
    # Replace POWER fill value -999 with NaN
    df = df.replace(-999.0, float("nan"))
    return df, source


if __name__ == "__main__":
    """Pre-fetch POWER data for all key districts."""
    for name, (lat, lon) in DISTRICT_COORDS.items():
        print(f"Fetching POWER data for {name} ({lat}, {lon})...")
        df, source = power_daily(lat, lon)
        out = f"cache/power_{lat}_{lon}.parquet"
        df.to_parquet(out)
        print(f"  → {len(df)} rows saved to {out} [{source}]")
