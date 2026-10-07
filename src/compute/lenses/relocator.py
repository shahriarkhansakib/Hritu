"""Story 3: The Retirement Relocator — The Microclimate Scout.

Question: Which of Bangladesh's 64 districts has the most favorable climate trend?
Data: NASA POWER T2M_MAX, RH2M, PRECTOTCORR for all district centroids
Metric: Heat Index trend ranking — green = improving, red = worsening

NO LLM CALLS IN THIS FILE.

Heat Index formula: Rothfusz (1990), standard NWS formula.
Valid for T >= 27°C and RH >= 40%.
"""
import numpy as np
import pandas as pd
from src.compute.trend import full_trend_report

DATASET_ID = "NASA_POWER_AG_DAILY"
SOURCE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# All 64 Bangladesh district centroids (lat, lon)
BD_DISTRICT_COORDS = {
    "Dhaka":           (23.81, 90.41),
    "Rajshahi":        (24.37, 88.60),
    "Sylhet":          (24.90, 91.87),
    "Chittagong":      (22.36, 91.80),
    "Khulna":          (22.84, 89.54),
    "Barisal":         (22.70, 90.37),
    "Rangpur":         (25.75, 89.25),
    "Mymensingh":      (24.75, 90.40),
    "Comilla":         (23.46, 91.18),
    "Jessore":         (23.17, 89.21),
    "Bhola":           (22.36, 90.64),
    "Cox's Bazar":     (21.44, 92.01),
    "Gazipur":         (24.00, 90.42),
    "Narayanganj":     (23.62, 90.50),
    "Tangail":         (24.25, 89.92),
    "Faridpur":        (23.61, 89.84),
    "Pabna":           (24.00, 89.25),
    "Bogra":           (24.85, 89.37),
    "Dinajpur":        (25.63, 88.63),
    "Kurigram":        (25.81, 89.64),
    # ... remaining 44 districts to be added
}


def rothfusz_heat_index(T_c: float, RH: float) -> float:
    """Compute Rothfusz heat index (°C).

    The NWS standard formula. Valid for T >= 27°C and RH >= 40%.
    For cooler/drier conditions, use simpler T + 0.33*e - 0.70*ws - 4.00.

    Args:
        T_c: Air temperature in °C.
        RH: Relative humidity in %.

    Returns:
        Heat index in °C.

    Note:
        This is a deterministic formula. The AI never computes this.
    """
    T_f = T_c * 9 / 5 + 32  # convert to Fahrenheit for the Rothfusz formula
    HI_f = (
        -42.379
        + 2.04901523 * T_f
        + 10.14333127 * RH
        - 0.22475541 * T_f * RH
        - 0.00683783 * T_f**2
        - 0.05481717 * RH**2
        + 0.00122874 * T_f**2 * RH
        + 0.00085282 * T_f * RH**2
        - 0.00000199 * T_f**2 * RH**2
    )
    HI_c = (HI_f - 32) * 5 / 9  # back to Celsius
    return float(HI_c)


def compute_annual_heat_index(df: pd.DataFrame) -> pd.Series:
    """Compute annual mean heat index from daily POWER data.

    Args:
        df: DataFrame with DatetimeIndex and columns T2M_MAX, RH2M.

    Returns:
        Series indexed by year with annual mean heat index in °C.
    """
    if not isinstance(df.index, pd.DatetimeIndex):
        df = df.copy()
        df.index = pd.to_datetime(df.index.astype(str), format="%Y%m%d")

    # Only compute HI for hot/humid days (valid range)
    mask = (df["T2M_MAX"] >= 27) & (df["RH2M"] >= 40)
    valid = df[mask].copy()
    valid["heat_index"] = valid.apply(
        lambda row: rothfusz_heat_index(row["T2M_MAX"], row["RH2M"]), axis=1
    )
    return valid.groupby(valid.index.year)["heat_index"].mean()


def analyze_district_heat_trend(
    df: pd.DataFrame,
    district: str,
) -> dict:
    """Full trend analysis for one district's heat index.

    Args:
        df: NASA POWER DataFrame for this district.
        district: District name.

    Returns:
        Trend report with slope_per_decade (positive = worsening).
    """
    annual_hi = compute_annual_heat_index(df)
    return full_trend_report(
        values=list(annual_hi.values),
        years=list(annual_hi.index),
        metric="annual_mean_heat_index_c",
        district=district,
        dataset_id=DATASET_ID,
        source_url=SOURCE_URL,
    )


def rank_districts(results: list[dict]) -> list[dict]:
    """Rank districts from most improving (rank 1) to most worsening.

    Args:
        results: List of trend reports from analyze_district_heat_trend().

    Returns:
        Sorted list with rank, district, slope_per_decade, verdict.
    """
    # Negative slope = cooling = improving → sort ascending
    sorted_results = sorted(results, key=lambda r: r.get("slope_per_decade", 0))
    for i, r in enumerate(sorted_results):
        r["rank"] = i + 1
        r["improving"] = r.get("slope_per_decade", 0) < 0
    return sorted_results
