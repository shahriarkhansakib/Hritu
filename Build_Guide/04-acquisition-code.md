---
title: "Acquisition code"
page_id: code
group: "Shared build kit"
order: 4
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Acquisition code

*Paste, run, cache. Every snippet below writes to disk so the second run is free.*

**Earthdata Login and earthaccess**

```
# ~/.netrc  (chmod 600):
# machine urs.earthdata.nasa.gov login YOUR_USER password YOUR_PASS
import earthaccess, pathlib
CACHE = pathlib.Path("cache"); CACHE.mkdir(exist_ok=True)

def login():
    # reads .netrc, or EARTHDATA_USERNAME / EARTHDATA_PASSWORD, or prompts
    return earthaccess.login(strategy="netrc")

def search_download(short_name, bbox, temporal, out="cache/data"):
    login()
    results = earthaccess.search_data(short_name=short_name,
        bounding_box=bbox, temporal=temporal, count=20)
    return earthaccess.download(results, out)   # returns local file paths

# Bangladesh bbox = (88, 20, 93, 27)
```

**CMR granule search — no authentication, cached**

```python
import requests, json, hashlib, os

def cmr_granules(short_name, bbox, t0, t1, page_size=100):
    url = "https://cmr.earthdata.nasa.gov/search/granules.json"
    params = {"short_name": short_name,
              "bounding_box": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
              "temporal": f"{t0},{t1}", "page_size": page_size}   # max 2000
    key = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()
    fp = f"cache/cmr_{key}.json"
    if os.path.exists(fp):
        return json.load(open(fp))
    r = requests.get(url, params=params, timeout=30); r.raise_for_status()
    js = r.json(); json.dump(js, open(fp, "w")); return js
```

**Harmony — subset once, download small**

```python
from harmony import Client, Collection, Request

c = Client()  # EDL token from ~/.netrc or environment
req = Request(collection=Collection(id="C1234-PROV"),
              spatial={"bbox": [88, 20, 93, 27]},
              temporal={"start": "2024-06-01", "stop": "2024-06-30"},
              format="application/x-netcdf4")
job = c.submit(req)
c.wait_for_processing(job, show_progress=True)
paths = list(c.download_all(job, directory="cache", overwrite=False))
```

**NASA POWER — daily climate for a point, straight to parquet**

```python
import requests, pandas as pd

def power_daily(lat, lon, start, end,
                params="T2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN", community="AG"):
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    q = dict(parameters=params, community=community, latitude=lat, longitude=lon,
             start=start, end=end, format="JSON")
    d = requests.get(url, params=q, timeout=60).json()["properties"]["parameter"]
    df = pd.DataFrame(d); df.index.name = "date"
    df.to_parquet(f"cache/power_{lat}_{lon}.parquet")
    return df

# Dhaka, ten years of daily weather in one call:
# power_daily(23.81, 90.41, "20150101", "20241231")
```

**FIRMS active fire — Bangladesh box to parquet**

```python
import pandas as pd
MAP_KEY = "YOUR_FIRMS_MAP_KEY"   # firms.modaps.eosdis.nasa.gov/api/map_key/

def firms_area(sensor="VIIRS_NOAA20_NRT", bbox="88,20,93,27", days=3):
    """bbox = west,south,east,north. days 1-10. One call is one transaction."""
    u = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{sensor}/{bbox}/{days}"
    df = pd.read_csv(u)
    df.to_parquet("cache/firms.parquet")
    return df

# Limit: 5,000 transactions per 10 minutes.
# Prefer VIIRS_NOAA20_NRT or VIIRS_NOAA21_NRT — Suomi-NPP ends 1 Nov 2026.
```

**api.nasa.gov — APOD, near-Earth objects, Mars imagery**

```python
import requests, os
KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
# DEMO_KEY: 30 requests/hour, 50/day. A free registered key: 1,000/hour.

apod = requests.get("https://api.nasa.gov/planetary/apod",
                    params={"api_key": KEY}).json()

neo = requests.get("https://api.nasa.gov/neo/rest/v1/feed",
                   params={"api_key": KEY, "start_date": "2026-11-14",
                           "end_date": "2026-11-15"}).json()

mars = requests.get("https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/photos",
                    params={"api_key": KEY, "earth_date": "2026-09-01"}).json()
```

**GIBS tiles in MapLibre — no key, instant NASA basemap**

```
map.addSource('modis', {
  type: 'raster', tileSize: 256,
  tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/' +
          'MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-06-15/' +
          'GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg']
});
map.addLayer({ id: 'modis', type: 'raster', source: 'modis' });

// Template: /wmts/epsg{EPSG}/best/{Layer}/default/{Time}/{TileMatrixSet}/{z}/{y}/{x}.{ext}
// Pass an explicit YYYY-MM-DD. The "current" keyword is not supported.
```

**ASF — Sentinel-1 and NISAR scenes**

```python
import asf_search as asf

res = asf.search(platform=[asf.PLATFORM.SENTINEL1A], processingLevel="GRD_HD",
                 intersectsWith="POLYGON((88 20,93 20,93 27,88 27,88 20))",
                 start="2024-06-01", end="2024-07-01", maxResults=10)

session = asf.ASFSession().auth_with_creds("EDL_USER", "EDL_PASS")
res.download(path="cache/sar", session=session)

# NISAR products are PROVISIONAL — validated at a limited set of sites. Say so.
```

**SPHEREx through IRSA, PDS, SPICE, OSDR, NTRS, ADS**

```python
from astroquery.ipac.irsa import Irsa
imgs = Irsa.query_sia(pos=(202.48, 47.23), collection="spherex_qr")   # cite 10.26131/IRSA652

import requests, os
pds = requests.get("https://pds.nasa.gov/api/search/1/products",
    params={"limit": 10,
            "q": '(pds:Primary_Result_Summary.pds:processing_level eq "Raw")'}).json()

import spiceypy as spice
spice.furnsh("kernels/meta.tm")
et = spice.str2et("2026-11-14T00:00:00")
pos, lt = spice.spkpos("MARS", et, "J2000", "NONE", "EARTH")   # geometry, not guesswork

osdr = requests.get("https://osdr.nasa.gov/osdr/data/osd/files/87.1").json()

ntrs = requests.get("https://ntrs.nasa.gov/api/citations/search",
                    params={"q": "microgravity combustion"}).json()

ads = requests.get("https://api.adsabs.harvard.edu/v1/search/query",
    headers={"Authorization": f"Bearer {os.getenv('ADS_API_TOKEN')}"},
    params={"q": "SPHEREx", "fl": "title,bibcode,year", "rows": 10}).json()
```

> **Note**
>
> **Keys to collect this week.** Earthdata Login account, a FIRMS MAP_KEY, a free api.nasa.gov key, and an ADS token. Put them in `.env`, commit only `.env.example`, and test each with a single call before the event.
