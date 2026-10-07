"""Story 4: The Urban Planner — Dhaka Heat vs. Lights.

Question: Are the fastest-warming areas of Dhaka the exact same areas developing fastest?
Data: MODIS MOD11A2 (LST, 1km) + VIIRS Day/Night Band (nightlights, 500m)
Metric: Spatial correlation of per-pixel Theil-Sen LST slope vs. DNB slope

NO LLM CALLS IN THIS FILE.

Note: Requires MODIS and VIIRS data downloaded to cache/ via earthaccess.
The correlation is computed between two spatial trend-slope maps.
"""
import numpy as np
from scipy import stats
from src.compute.trend import theil_sen_slope

DATASET_ID_LST = "MOD11A2.061"
DATASET_ID_DNB = "VNP46A1.001"
SOURCE_URL_LST = "https://lpdaac.usgs.gov/products/mod11a2v061/"
SOURCE_URL_DNB = "https://ladsweb.modaps.eosdis.nasa.gov"

DHAKA_BBOX = (90.25, 23.65, 90.55, 23.95)  # (west, south, east, north)


def compute_pixel_trend_slopes(
    time_stack: np.ndarray,
    years: list[int],
) -> np.ndarray:
    """Compute per-pixel Theil-Sen slope for a 3D time stack.

    Args:
        time_stack: 3D array of shape (n_years, height, width).
        years: List of years corresponding to the time dimension.

    Returns:
        2D array of slope per year, same (height, width) as spatial dims.
    """
    h, w = time_stack.shape[1], time_stack.shape[2]
    slope_map = np.full((h, w), np.nan)

    for i in range(h):
        for j in range(w):
            pixel_series = time_stack[:, i, j]
            valid_mask = ~np.isnan(pixel_series)
            if valid_mask.sum() >= 5:  # need at least 5 valid obs
                valid_years = np.array(years)[valid_mask]
                valid_vals = pixel_series[valid_mask]
                result = theil_sen_slope(valid_vals, valid_years)
                slope_map[i, j] = result["slope_per_year"]

    return slope_map


def compute_lst_dnb_correlation(
    lst_slope_map: np.ndarray,
    dnb_slope_map: np.ndarray,
) -> dict:
    """Compute Spearman correlation between LST and DNB slope maps.

    Pixels where either slope is NaN are excluded.

    Args:
        lst_slope_map: Per-pixel LST trend slope (2D array).
        dnb_slope_map: Per-pixel DNB trend slope (2D array, resampled to same grid).

    Returns:
        Dict with r_value, p_value, n_pixels, hot_spot_count, and provenance fields.
    """
    # Flatten to 1D, exclude NaN
    lst_flat = lst_slope_map.flatten()
    dnb_flat = dnb_slope_map.flatten()
    valid = ~np.isnan(lst_flat) & ~np.isnan(dnb_flat)

    if valid.sum() < 10:
        return {
            "error": "Insufficient valid pixels for correlation (need >= 10)",
            "dataset_id_lst": DATASET_ID_LST,
            "dataset_id_dnb": DATASET_ID_DNB,
        }

    r, p = stats.spearmanr(lst_flat[valid], dnb_flat[valid])

    # Hot spots: pixels where BOTH LST and DNB are increasing (both slopes > 0)
    hot_spot_count = int(((lst_flat[valid] > 0) & (dnb_flat[valid] > 0)).sum())

    return {
        "r_value":        float(r),
        "p_value":        float(p),
        "n_pixels":       int(valid.sum()),
        "hot_spot_count": hot_spot_count,
        "hot_spot_pct":   float(hot_spot_count / valid.sum() * 100),
        "correlation_type": "Spearman rank correlation",
        "metric":         "per_pixel_theil_sen_slope",
        "district":       "Dhaka",
        "dataset_id_lst": DATASET_ID_LST,
        "dataset_id_dnb": DATASET_ID_DNB,
        "source_url_lst": SOURCE_URL_LST,
        "source_url_dnb": SOURCE_URL_DNB,
        "caveat": (
            "Correlation does not imply causation. "
            "MODIS LST is Land Surface Temperature, not air temperature. "
            "DNB radiance is a proxy for human activity, not economic output."
        ),
    }
