---
title: "Challenge 06: Dancing with the SARs"
page_id: c06
group: "The 14 challenges"
challenge_number: 6
tags: ["SAR & remote sensing", "Advanced", "Intermediate"]
order: 16
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 06: Dancing with the SARs

**Tags:** SAR & remote sensing · Advanced · Intermediate

## Brief

### What the challenge asks

Use synthetic aperture radar to detect environmental change, disaster impact or ground motion. Radar sees through cloud and at night, which is precisely why it matters here.

### The build

Flood extent and river-bank erosion on the Jamuna or the Padma. Two radar acquisitions before and after a monsoon flood, a computed change mask, and an inundated-area figure in square kilometres. This is the single strongest local-impact project on the board: during the monsoon, optical satellites see cloud and radar sees the water.

> **Killer demo**
>
> Drag the swipe handle across the river. Dry channel on one side, flood on the other, and a number on screen: this many square kilometres inundated between these two dates, from these two Sentinel-1 scenes.

### Where the points are

Impact and Relevance are almost free if you pick a real Bangladesh flood. Protect Validity by stating the processing steps, the threshold you used and its uncertainty — and by saying "provisional" if any NISAR product is involved.

## 48-hour plan

- **Before the event:** Download two to four Sentinel-1 GRD scenes over one river reach, before and after a known flood. Preprocess to calibrated backscatter and save as COGs. These are large files — this step cannot happen on venue wifi.
- **Day 1 morning:** Change detection: difference, threshold, clean up speckle, produce a water mask. Validate against what you can see in the imagery.
- **Day 1 afternoon:** Serve the COGs, build the map with the before-and-after swipe.
- **Day 1 evening:** Area computation in square kilometres, with the assumptions written on screen. Record by 18:30.
- **Day 2 morning:** Add a second date pair, the erosion line comparison, and the methods panel.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Scenes downloaded and calibrated
- COGs written and tiling tested
- A known flood date pair chosen

**Cut in this order**

- One event, one river reach
- Pre-rendered PNG overlays instead of live tiling
- Drop erosion, keep flood extent

## Data

- **Sentinel-1 GRD through ASF** — the workhorse. Free, long archive, well documented, and it works in monsoon cloud.
- **NISAR L-band through ASF** — public since 20 July 2026 for acquisitions from 17 June 2026 onward, with the full record expected by the end of 2026. Products are provisional and validated at a limited set of sites. Use it if your area and dates are covered, and label it.
- **GIBS** — optical context tiles for the same dates, useful for showing what optical sensors could not see.
- **Bangladesh Water Development Board** — gauge records to sanity-check your flood dates. Partner data on top of NASA data is what lifts the NASA data usage score.

**Change detection that you can defend in a question**

```python
import numpy as np, rasterio
from scipy import ndimage

def water_mask(db_array, threshold_db=-16.0, min_pixels=50):
    """Low backscatter means smooth water. Threshold, then remove specks."""
    mask = db_array < threshold_db
    labels, n = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, n + 1))
    keep = np.isin(labels, np.flatnonzero(sizes >= min_pixels) + 1)
    return keep

def inundated_km2(before_mask, after_mask, pixel_m=10.0):
    new_water = np.logical_and(after_mask, ~before_mask)
    return float(new_water.sum() * (pixel_m ** 2) / 1e6)
```

## Architecture

```
asf_search ──► Sentinel-1 GRD (pre-event)
                    │
        calibration · speckle filter · geocode
                    │
                    ▼
            COGs in cache/sar/
                    │
      ┌─────────────┼─────────────┐
      ▼             ▼             ▼
 rio-tiler      src/compute    area stats
 tile server   change.py       km² + assumptions
      └─────────────┼─────────────┘
                    ▼
        MapLibre before/after swipe
                    │
                    ▼
             methods panel
   threshold · dates · scene ids · provisional flag
```

## Build prompt

**Paste into your coding agent**

```
Build a SAR flood and river-erosion change detector for a Bangladesh river reach.

Input: two pre-downloaded, calibrated Sentinel-1 GRD scenes as COGs in
cache/sar/, one before and one after a known flood, plus their metadata
(scene id, acquisition date, orbit, polarisation).

src/compute/change.py: convert to dB, apply a water threshold with a
configurable value, remove connected components below a minimum size, produce
before and after water masks, a new-water mask, and an inundated area in square
kilometres from the pixel spacing. Unit-test the area function against a
synthetic mask of known size.

Serving: rio-tiler or titiler over the COGs so the map renders from local files
with no network.

Frontend: MapLibre with a draggable before/after swipe, the new-water mask as a
coloured overlay, and a persistent readout of inundated area with the two dates
and both scene ids.

Methods panel: list every processing step, the threshold used, the pixel
spacing, and an uncertainty note. If any NISAR product is used, label it
PROVISIONAL and say it is validated at a limited set of sites.

Apache-2.0, public repo, README citing ASF and the scene identifiers.
```
