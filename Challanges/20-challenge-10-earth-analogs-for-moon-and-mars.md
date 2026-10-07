---
title: "Challenge 10: Earth Locations that Analog Moon and Mars Bases"
page_id: c10
group: "The 14 challenges"
challenge_number: 10
tags: ["Planetary science & Earth analogs", "Advanced", "Intermediate", "Youth"]
order: 20
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 10: Earth Locations that Analog Moon and Mars Bases

**Tags:** Planetary science & Earth analogs · Advanced · Intermediate · Youth

## Brief

### What the challenge asks

Find places on Earth that mirror the geology or environment of a permanent Moon base site or a Mars location — the places where crews can train and hardware can be tested.

### The build

A similarity search over Earth. Choose a target — the lunar south pole, Jezero Crater — and the tool scores every Earth grid cell against it on aridity, temperature range, elevation, slope, surface roughness and thermal behaviour, then ranks the best analogues with a rationale for each.

> **Killer demo**
>
> Pick Jezero. The globe lights up in a handful of places, and the top result comes with its scores broken down criterion by criterion, so you can see exactly which dimensions matched and which did not.

### Where the points are

Creativity, because the framing is genuinely unusual, and Validity, because similarity must be computed with weights you can show rather than asserted by a model. Expose the weights as sliders and the whole thing becomes defensible and interactive at once.

## 48-hour plan

- **Before the event:** Assemble coarse global layers — climate from POWER or a gridded product, elevation and slope from a DEM, land surface temperature range from MODIS — on a common grid, and save as zarr. Coarse is correct here; you are ranking regions, not surveying sites.
- **Day 1 morning:** Build the feature vector, normalise every dimension, implement weighted similarity with tests.
- **Day 1 afternoon:** Globe or map with the similarity surface and a ranked list.
- **Day 1 evening:** Per-criterion breakdown for the top results, and the weight sliders. Record by 18:30.
- **Day 2 morning:** Target profiles for a second body, the rationale text, and the citation panel.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Global predictor stack as zarr
- Target profiles for two planetary sites
- Normalisation ranges fixed

**Cut in this order**

- Four criteria instead of eight
- One target instead of several
- Continental resolution instead of fine grid

## Data

- **NASA POWER** — global climate normals, aridity and temperature range on a regular grid.
- **DEM products through USGS or Earthdata** — elevation, from which you derive slope and roughness.
- **MODIS land surface temperature** — diurnal range, which is the dimension that makes deserts and polar deserts behave like other worlds.
- **Moon Trek, Mars Trek and PDS** — the target-side characteristics for the planetary site you are matching.

**Similarity with visible weights — never a model's opinion**

```python
import numpy as np

CRITERIA = ["aridity", "temp_range_c", "elevation_m", "slope_deg",
            "roughness", "lst_diurnal_c"]

def similarity(earth_stack, target_vector, weights, ranges):
    """Weighted normalised distance. Returns a 0-1 score per cell plus the
    per-criterion contribution, so the interface can explain any result."""
    contrib = {}
    total = np.zeros(earth_stack[CRITERIA[0]].shape)
    wsum = sum(weights[c] for c in CRITERIA)
    for c in CRITERIA:
        lo, hi = ranges[c]
        d = np.abs(earth_stack[c] - target_vector[c]) / (hi - lo)
        contrib[c] = np.clip(1 - d, 0, 1)
        total += weights[c] * contrib[c]
    return total / wsum, contrib
```

## Architecture

```
POWER · DEM · MODIS LST ──► global predictor stack (zarr)
                                      │
Moon Trek / Mars Trek / PDS ──► target vector
                                      │
                                      ▼
                        src/compute/similarity.py
                   normalise · weight · score · rank
                                      │
                       ┌──────────────┼──────────────┐
                       ▼              ▼              ▼
                 globe surface   ranked list   per-criterion
                                                breakdown
                                      │
                                      ▼
                          weight sliders (live re-rank)
```

## Build prompt

**Paste into your coding agent**

```
Build an Earth-analogue finder for Moon and Mars base locations.

Data: a pre-cached global predictor stack in zarr on a coarse regular grid, with
aridity, annual temperature range, elevation, slope, surface roughness and
land-surface-temperature diurnal range. Target profiles in data/targets.json for
at least the lunar south pole and Jezero Crater, each with a source_url.

src/compute/similarity.py: normalise each criterion using fixed stored ranges,
compute a weighted similarity score per grid cell, and return both the score
surface and the per-criterion contribution. Unit-test that an exact match scores
1.0 and that changing a weight changes the ranking as expected. No language
model computes similarity.

Frontend: a globe or world map shaded by similarity, a ranked list of the top
twenty locations with their names, and a breakdown panel showing each
criterion's contribution as a bar. A slider per criterion that re-ranks live.

For each top result, a short rationale generated from the per-criterion numbers,
naming which dimensions matched and which did not, with the target's source URL.

Apache-2.0, public repo, README listing every layer and its source.
```
