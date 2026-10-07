---
name: trend-detective
description: Science logic, statistical methods, dataset mappings, and story architecture for Hritu — the Earth System Trend Detective app for NASA Space Apps 2026 Bangladesh. Use when building any of the 5 story lenses, choosing statistical methods, mapping datasets, or designing the verdict engine.
license: Apache-2.0
metadata:
  author: SpaceApps-Bangladesh-2026
  version: "1.0"
  challenge: "Challenge 02 — Be an Earth System Trend Detective!"
---

# Trend Detective Domain Knowledge

## The Core Question

Every story in the app answers exactly one question: **"Is this seasonal shift real, or is it just noise?"**

The answer is always one of:
- 🔴 **REAL TREND** — p < 0.05 (Modified Mann-Kendall)
- 🟡 **WEAK SIGNAL** — trend direction exists but p ≥ 0.05
- ⚪ **NOISE** — no detectable monotonic trend

This verdict is computed deterministically. The AI never decides it.

## Statistical Methods (`src/compute/trend.py`)

### Why Standard Mann-Kendall Fails for Climate Data

Climate time series have **Lag-1 autocorrelation** (today's temperature is correlated with yesterday's). Standard Mann-Kendall assumes IID samples. Applying it to autocorrelated data inflates the test statistic and produces **false positives** — trends that look significant but aren't.

**The solution: Modified Mann-Kendall**

### Method 1: Modified Mann-Kendall (Required)
```python
import pymannkendall as mk

# Use Hamed & Rao (1998) or Yue & Wang (2004) modification
result = mk.hamed_rao_modification_test(series)  # preferred
# OR
result = mk.yue_wang_modification_test(series)  # alternative

# result.trend: 'increasing' | 'decreasing' | 'no trend'
# result.p: p-value (use < 0.05 threshold)
# result.slope: Sen's slope (magnitude)
```

### Method 2: Theil-Sen Slope (Required for magnitude)
```python
from scipy import stats

slope, intercept, low_slope, high_slope = stats.theilslopes(values, x=years, alpha=0.95)
# Returns: slope per year, 95% CI bounds
# Report as: slope * 10 = change per decade
```

### Method 3: Pettitt Change-Point Detection (Optional, Story 1 & 2)
```python
# Use pettitt test to find WHEN the shift occurred
import pettitt  # or implement from scratch
# Returns: change-point year, p-value for the break
# Answers: "The cold season started disappearing around [year]"
```

### Autocorrelation Note
Always report the **modified** test result, not the standard one. In the provenance drawer, show:
- Which modification was used (Hamed-Rao or Yue-Wang)
- The lag-1 autocorrelation coefficient (ACF at lag=1)
- The corrected variance factor (n/S)

## The 5 Story Lenses — Implementation Guide

### Story 1: The Winter Vacationer (The Missing Cold)

**Goal:** Count how many "cold days" (T_min ≤ 14°C) occurred each year in the Dec 20 – Jan 5 window.

**Data:** NASA POWER `T2M_MIN`, district centroid coordinates, 1981–2026

**Algorithm (`src/compute/lenses/winter.py`):**
```python
def cold_day_count(t2m_min_series: pd.DataFrame, district_lat: float, district_lon: float) -> dict:
    """
    Count days with T2M_MIN <= 14°C in the Dec20-Jan5 window each year.
    Returns annual cold_day_count series + Mann-Kendall result.
    """
    # 1. Filter to Dec 20 – Jan 5 window
    # 2. Count days <= 14°C per year
    # 3. Run Modified Mann-Kendall on the annual counts
    # 4. Run Theil-Sen to get slope (cold days lost per decade)
    # 5. Optionally: Pettitt test to find the break year
    pass
```

**Killer Demo Moment:** "Rajshahi had 12 cold days per winter in 1985. It has 3 now. The trend is statistically real (p = 0.003). The season lost ~2 cold days per decade."

**Cut version (if behind):** One district (Rajshahi), POWER data only, static parquet.

---

### Story 2: The Rain-Lover (The Delayed Monsoon)

**Goal:** Find the monsoon onset date each year and test if it is shifting later.

**Data:** GPM IMERG Final V07, 0.1° resolution, 2000–2026

**Algorithm (`src/compute/lenses/monsoon.py`):**
```python
def monsoon_onset_doy(imerg_daily: xr.DataArray, lat: float, lon: float) -> pd.Series:
    """
    For each year: find first 7-day rolling window where daily precip > 25mm
    with no subsequent dry spell (< 5mm) for 5 days. Returns Day-of-Year.
    """
    # 1. Load IMERG precipitation for Bangladesh bbox
    # 2. For each year, compute rolling 7-day sum
    # 3. Find first window exceeding threshold
    # 4. Check for subsequent dry-spell break
    # 5. Return onset DOY
    pass
```

**Killer Demo Moment:** Toggle a map from 2000–2010 avg onset vs 2015–2026 avg onset. Watch the monsoon arrive later in northern Bangladesh.

**Fallback:** NASA POWER `PRECTOTCORR` for onset proxy if IMERG download fails.

---

### Story 3: The Retirement Relocator

**Goal:** Rank Bangladesh's 64 districts by "climate livability trend" — combining heat, rain, and humidity.

**Data:** NASA POWER `T2M_MAX`, `RH2M`, `PRECTOTCORR` for all 64 district centroids

**Algorithm (`src/compute/lenses/relocator.py`):**
```python
def district_climate_rank(power_data: pd.DataFrame) -> pd.DataFrame:
    """
    For each district:
    1. Compute Heat Index = -8.78469 + 1.61139*T + 2.33855*RH - 0.14612*T*RH - ...
       (use Rothfusz formula — NO LLM computes this)
    2. Run Modified MK on annual Heat Index series
    3. Rank districts by slope (most improving = rank 1)
    Returns: DataFrame with district, slope, p_value, trend_direction, rank
    """
    pass
```

**Killer Demo Moment:** Show a choropleth map of Bangladesh where green = improving, red = worsening. Let the user click a district to see the full trend chart.

---

### Story 4: The Urban Planner (Dhaka Heat vs. Lights)

**Goal:** Correlate LST warming trend spatially with nightlight brightening trend within Dhaka.

**Data:**
- MODIS `MOD11A2` (8-day LST composite, 1km, 2000–2026)
- VIIRS Day/Night Band (monthly avg radiance, 500m, 2012–2026)

**Algorithm (`src/compute/lenses/urban.py`):**
```python
def lst_nightlight_correlation(lst_zarr: xr.DataArray, dnb_zarr: xr.DataArray,
                               dhaka_bbox: tuple) -> dict:
    """
    1. Compute per-pixel Theil-Sen slope for LST (2012-2026) across Dhaka
    2. Compute per-pixel Theil-Sen slope for DNB (2012-2026) across Dhaka
    3. Compute Pearson/Spearman spatial correlation of the two slope maps
    4. Return: r_value, p_value, n_pixels, hot_spot_pixels (where both slopes > 0)
    """
    pass
```

**Killer Demo Moment:** Side-by-side map: left = LST trend slope map, right = DNB trend slope map. The same neighborhoods are hot in both.

**Caveat:** MODIS ends late 2026. Frame this as a 2000–2025 story. Use VIIRS for the more recent window.

---

### Story 5: The Coastal Defender (Extreme Extremes)

**Goal:** Count annual extreme weather days and test if the frequency/intensity is increasing.

**Data:** NASA POWER `WS50M_MAX` and `PRECTOTCORR` for coastal districts (Bhola, Barisal, Cox's Bazar, Khulna)

**Algorithm (`src/compute/lenses/coastal.py`):**
```python
def extreme_event_trend(power_data: pd.DataFrame, wind_threshold: float = None,
                        precip_percentile: float = 95.0) -> dict:
    """
    1. Compute 95th percentile of PRECTOTCORR for each district (climatological baseline)
    2. Count days per year exceeding that percentile (extreme rain)
    3. Count days per year with WS50M_MAX > threshold (extreme wind)
    4. Run Modified MK on each annual count series
    5. Return trend, slope, p_value for both intensity and frequency
    """
    pass
```

**Killer Demo Moment:** "Bhola experienced 8 extreme rain days per year in the 1990s. It now experiences 14. The trend is statistically significant."

## Dataset Reference & Caveats

| Dataset | Endpoint | Resolution | Period | Caveat |
|---|---|---|---|---|
| NASA POWER T2M, RH2M, PRECTOT, WS50M | `power.larc.nasa.gov/api/temporal/daily/point` | 0.5°×0.625° | 1981–now | MERRA-2 based (model, not observation). State this. |
| GPM IMERG Final V07 | `earthaccess` via CMR | 0.1°×0.1° | 2000–now | V07 is current. Cite DOI in UI. |
| MODIS MOD11A2 | `earthaccess` via CMR | 1km | 2000–late 2026 | Terra MODIS winding down late 2026. Say so. |
| VIIRS DNB (NOAA-20) | `earthaccess` via CMR | 500m | 2012–now | Preferred over Suomi-NPP (ends Nov 2026). |
| NASA GIBS Tiles | `gibs.earthdata.nasa.gov/wmts/` | Varies | Current | No auth needed. Use for basemap. |

## Bangladesh Geographic Context

- **Bounding box:** `(88.0, 20.6, 92.7, 26.6)` (lon_min, lat_min, lon_max, lat_max)
- **Dhaka bbox (urban analysis):** `(90.25, 23.65, 90.55, 23.95)`
- **District centroids:** Pre-cache for all 64 districts in `cache/bd_districts.parquet`
- **Coastal districts:** Bhola (22.36N, 90.64E), Barisal (22.70N, 90.37E), Cox's Bazar (21.44N, 92.01E)
- **Winter story district:** Rajshahi (24.37N, 88.60E) — northernmost major city, traditional cold season
- **Monsoon entry point:** Northwest Bangladesh, typically Rangpur division

## MCP Server (`nasa_tools_mcp.py`)

Three tools exposed via FastMCP:
1. `firms_fire(sensor, bbox, days)` — active fire / extreme weather detection
2. `power_climate(lat, lon, start, end, parameters)` — daily climate for one point
3. `cmr_search(short_name, bbox, t0, t1)` — NASA CMR granule discovery

Install: `pip install "mcp[cli]" fastmcp requests pandas`
Test: `npx @modelcontextprotocol/inspector uv run nasa_tools_mcp.py`

## Scoring Strategy

| Score Area | How This Skill Earns It |
|---|---|
| **Validity (20)** | Modified MK (not standard) — autocorrelation correction is explicitly shown in provenance drawer |
| **Relevance (20)** | 4 distinct NASA datasets, each named on screen with dataset ID |
| **Impact (20)** | 5 stories tied to real Bangladeshi decisions (travel, farming, relocation, planning, safety) |
| **Creativity (20)** | Verdict engine returns REAL/WEAK/NOISE — rejects fake trends |
| **Presentation (20)** | English+Bangla, mobile PWA, offline capable |
