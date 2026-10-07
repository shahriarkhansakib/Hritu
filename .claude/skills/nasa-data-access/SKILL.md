---
name: nasa-data-access
description: Access NASA and partner data for the Hritu project — earthaccess, CMR, POWER, FIRMS, IMERG, MODIS, VIIRS, GIBS — with caching and offline fallback. Use whenever the project needs to fetch, cache, or serve NASA data.
allowed-tools: Read, Bash
license: Apache-2.0
---

# NASA Data Access

Use the verified endpoints below. Do NOT invent base URLs.

## The Universal Fetch Wrapper (`src/acquire/safe.py`)

Every single NASA API call MUST go through this wrapper:

```python
import json, os, pathlib, hashlib, requests

CACHE = pathlib.Path("cache"); CACHE.mkdir(exist_ok=True)
FIXTURES = pathlib.Path("demo_fixtures")
OFFLINE = os.getenv("OFFLINE") == "1"

def fetch_json(url, params=None, name=None, timeout=25):
    """Live first, cache second, committed fixture last. Never raises during a demo."""
    key = name or hashlib.md5(f"{url}{sorted((params or {}).items())}".encode()).hexdigest()
    cached = CACHE / f"{key}.json"
    fixture = FIXTURES / f"{key}.json"

    if not OFFLINE:
        try:
            r = requests.get(url, params=params, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            cached.write_text(json.dumps(data))
            return data, "live"
        except Exception:
            pass
    if cached.exists():
        return json.loads(cached.read_text()), "cache"
    if fixture.exists():
        return json.loads(fixture.read_text()), "fixture"
    raise FileNotFoundError(f"No live, cache or fixture data for {key}")
```

Always show the returned source label ("live" / "cache" / "fixture") in the UI.

## NASA POWER (Stories 1, 3, 5)

```python
def power_daily(lat, lon, start, end, params="T2M_MIN,T2M_MAX,RH2M,PRECTOTCORR,WS50M_MAX"):
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    q = dict(parameters=params, community="AG", latitude=lat, longitude=lon,
             start=start, end=end, format="JSON")
    data, source = fetch_json(url, params=q, name=f"power_{lat}_{lon}_{start}_{end}")
    df = pd.DataFrame(data["properties"]["parameter"])
    df.to_parquet(f"cache/power_{lat}_{lon}.parquet")
    return df, source

# Bangladesh districts: start=19810101, end=20261231
# Dhaka centroid: lat=23.81, lon=90.41
# Rajshahi: lat=24.37, lon=88.60
# Bhola: lat=22.36, lon=90.64
```

## GPM IMERG (Story 2 — Monsoon)

```python
import earthaccess
earthaccess.login(strategy="netrc")  # ~/.netrc with earthdata.nasa.gov credentials

# Short name for GPM IMERG Final Daily V07
results = earthaccess.search_data(
    short_name="GPM_3IMERGDF",
    version="07",
    bounding_box=(88.0, 20.6, 92.7, 26.6),  # Bangladesh bbox
    temporal=("2000-01-01", "2026-10-01"),
    count=200
)
paths = earthaccess.download(results, "cache/imerg")
```

## MODIS MOD11A2 (Story 4 — Urban Heat)

```python
results = earthaccess.search_data(
    short_name="MOD11A2",
    version="061",
    bounding_box=(90.25, 23.65, 90.55, 23.95),  # Dhaka bbox
    temporal=("2000-01-01", "2026-10-01"),
    count=100
)
paths = earthaccess.download(results, "cache/modis_lst")
```

## VIIRS DNB (Story 4 — Nightlights)

```python
results = earthaccess.search_data(
    short_name="VNP46A1",  # VIIRS/NPP Daily Gridded Day Night Band
    version="001",
    bounding_box=(90.25, 23.65, 90.55, 23.95),
    temporal=("2012-01-01", "2026-10-01"),
    count=100
)
# Prefer NOAA-20 (VJ146A1) if available
```

## NASA GIBS Tiles (Basemap)

```javascript
// MapLibre GL JS — no authentication required
map.addSource('gibs_modis', {
  type: 'raster',
  tileSize: 256,
  tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/' +
          'MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-06-15/' +
          'GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg']
});
// For offline: pre-download to PMTiles using src/acquire/tiles.py
```

## Status Notes (Display in UI)

- NASA POWER is MERRA-2 reanalysis (model-based, not station observations). Resolution: 0.5°×0.625°.
- GPM IMERG Final V07 supersedes V06. Cite the dataset DOI in the interface.
- MODIS Terra is winding down (late 2026). Frame as historical record.
- Suomi-NPP VIIRS ends **1 November 2026**. Use NOAA-20 (VNP/VJ1 products).

## Keys Required (collect before the event)

| Key | Where to Get | Used For |
|---|---|---|
| Earthdata Login | earthdata.nasa.gov | IMERG, MODIS, VIIRS download |
| FIRMS MAP_KEY | firms.modaps.eosdis.nasa.gov/api/map_key/ | Fire/extreme weather |
| NASA_API_KEY | api.nasa.gov | APOD, NEO (bonus features) |
| ADS_API_TOKEN | ui.adsabs.harvard.edu | Literature search (optional) |
