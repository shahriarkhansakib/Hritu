---
name: offline-first
description: Enforce offline-first data access for all NASA API calls in Hritu. Use whenever adding a new data fetch, building a new story lens, or preparing for the hackathon demo.
allowed-tools: Read, Bash
license: Apache-2.0
---

# Offline-First Architecture

## The Three-Level Fallback

Every data fetch follows this priority chain:
1. **Live** — call the NASA API (writes result to `cache/`)
2. **Cache** — read from `cache/{hash}.json` or `cache/{name}.parquet`
3. **Fixture** — read from `demo_fixtures/{hash}.json` (committed to git)

This is enforced by `src/acquire/safe.py::fetch_json()`. No fetch bypasses this.

## OFFLINE=1 Mode

Set `OFFLINE=1` to force fixture-only mode:
```bash
export OFFLINE=1
python -m src.api.main  # demo mode: never calls NASA
```

The UI shows a small badge: `📦 fixture` or `💾 cache` or `🌐 live` next to each data source.

## Pre-Event Checklist

Run these commands **before traveling to the venue** (requires internet):

```bash
make cache      # downloads all 5 story datasets into cache/
make fixtures   # copies demo-critical files to demo_fixtures/
make tiles      # generates bd.pmtiles for offline MapLibre basemap
make demo       # rehearse full demo with OFFLINE=1
```

Verify: `make demo` must succeed with no network requests. Test with:
```bash
# Block all network (Windows)
netsh advfirewall firewall add rule name="BLOCK_TEST" dir=out action=block protocol=tcp
make demo
netsh advfirewall firewall delete rule name="BLOCK_TEST"
```

## PMTiles for Offline Maps

```bash
# Download GIBS tiles for Bangladesh (zoom 4-10) and package
python src/acquire/tiles.py \
  --layer MODIS_Terra_CorrectedReflectance_TrueColor \
  --bbox 88.0,20.6,92.7,26.6 \
  --zoom 4-10 \
  --date 2024-06-15 \
  --out cache/tiles/

# Package into single PMTiles file
# (requires go-pmtiles or equivalent)
pmtiles convert cache/tiles/ web/public/bd.pmtiles
```

MapLibre config for offline PMTiles:
```javascript
map.addSource('bd_tiles', {
  type: 'raster',
  url: 'pmtiles://bd.pmtiles',
  tileSize: 256
});
```

## Streaming — Fixture Replay (Story 5, astronaut-style)

For the coastal extreme event "live" view:
```python
import asyncio, json
from fastapi import FastAPI, WebSocket

app = FastAPI()
FRAMES = json.load(open("demo_fixtures/coastal_extremes.json"))  # annual frames

@app.websocket("/stream/coastal")
async def stream(ws: WebSocket):
    await ws.accept()
    for frame in FRAMES:
        await ws.send_json(frame)
        await asyncio.sleep(0.5)  # compressed playback
```

## Rehearsal Protocol

1. Run `make demo` (OFFLINE=1) the night before the event
2. Record the 240-second video with wifi **physically off**
3. That recording is the last line of defense if everything fails at the venue
4. Store the recording in `demo_fixtures/video_backup.mp4`
