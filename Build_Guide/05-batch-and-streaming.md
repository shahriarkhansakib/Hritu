---
title: "Batch and streaming"
page_id: pipeline
group: "Shared build kit"
order: 5
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Batch and streaming

*What to download, what to query live, and which storage format to use for each shape of data.*

## The decision

**Download in batch**

- Any raster time series
- Anything over a few hundred megabytes
- Anything that appears in the demo
- Anything you will run statistics over more than once

**Query live**

- Small, fresh point queries — POWER for one location
- Last-24-hour FIRMS for one box
- A single APOD or NEO call
- Anything where "right now" is the point of the feature

Every live response still gets written to `cache/` with a content-hash key. Live and cached are not two modes; live is how the cache gets filled.

## Storage format by data shape

| Shape of data | Format | Read it with | Why |
|---|---|---|---|
| Gridded, many time steps | Zarr | xarray | Chunked, lazy, slices by time and space without loading everything |
| Imagery you pan and zoom | Cloud-optimised GeoTIFF | rio-tiler or titiler | Serves tiles from one file, no tile pyramid on disk |
| Points and tables | Parquet | DuckDB or pandas | Columnar, compressed, queryable with SQL and no server |
| Vectors for the map | GeoParquet then PMTiles | tippecanoe, MapLibre | One file, one HTTP range request, works offline |
| Relational with spatial joins | PostGIS | psycopg, GeoAlchemy | Only when you genuinely need joins; otherwise it is a dependency to install at 2am |

**Build the local cache — one script, run it before you travel**

```
# make cache
import xarray as xr, pandas as pd, duckdb

# 1. Gridded series to zarr, chunked by time
ds = xr.open_mfdataset("cache/data/*.nc", combine="by_coords")
ds.sel(lat=slice(20, 27), lon=slice(88, 93)).chunk({"time": 64}) \
  .to_zarr("cache/bd.zarr", mode="w")

# 2. Point data to parquet, then query it with SQL and no server
duckdb.sql("""
  COPY (SELECT * FROM 'cache/firms.parquet' WHERE confidence > 50)
  TO 'cache/firms_clean.parquet' (FORMAT PARQUET)
""")

# 3. Precompute the exact series the demo shows — a chart must never wait on a query
series = (duckdb.sql("SELECT acq_date, count(*) n FROM 'cache/firms_clean.parquet' "
                     "GROUP BY 1 ORDER BY 1").df())
series.to_json("web/public/demo_series.json", orient="records")
```

**Tiles to a single offline file**

```
# Vectors: GeoJSON to PMTiles
tippecanoe -o web/public/bd.pmtiles -z12 --drop-densest-as-needed cache/features.geojson

# Rasters: a GIBS or Treks region to local tiles, then package
# (run once, on good internet, before the event)
python -m src.acquire.tiles --layer MODIS_Terra_CorrectedReflectance_TrueColor \
  --bbox 88,20,93,27 --zoom 4-9 --date 2024-06-15 --out cache/tiles
```

## Streaming, when you really need it

Only two challenges genuinely want a stream: astronaut health monitoring, where the point is a live vitals feed, and any near-real-time fire view. Use a websocket from FastAPI feeding from a replayed fixture. A replayed fixture looks identical to a live feed on camera and cannot fail.

**A stream you can trust — replay a fixture at real-time speed**

```python
import asyncio, json
from fastapi import FastAPI, WebSocket

app = FastAPI()
FRAMES = json.load(open("demo_fixtures/vitals.json"))   # 600 rows, 1 per second

@app.websocket("/stream")
async def stream(ws: WebSocket):
    await ws.accept()
    for frame in FRAMES:
        await ws.send_json(frame)
        await asyncio.sleep(1.0)   # or 0.2 to compress a 10-minute story into 2 minutes
```
