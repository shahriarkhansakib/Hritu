---
title: "Challenge 11: Interplanetary Survival Guide: Martian Map"
page_id: c11
group: "The 14 challenges"
challenge_number: 11
tags: ["Mapping & survival science", "Intermediate"]
order: 21
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 11: Interplanetary Survival Guide: Martian Map

**Tags:** Mapping & survival science · Intermediate

## Brief

### What the challenge asks

Interactive maps and survival tools for future Mars explorers.

### The build

A traverse planner on real Mars terrain. Draw a route and the tool computes distance, slope profile, energy cost and the hazards along it, then produces a survival card: how long, how much power, where the safe stops are, and what to do if something fails.

> **Killer demo**
>
> Draw a line across Jezero. The elevation profile appears underneath with the steep sections marked in red, the energy estimate updates, and the route is rejected with a reason: one segment exceeds the rover slope limit. Redraw, and it passes.

### Where the points are

Best Mission Concept is a global category and this challenge is aimed straight at it. Plausibility is the criterion, so state your rover's assumed mass, power and slope limit up front and derive everything from them.

## 48-hour plan

- **Before the event:** Cache Mars Trek basemap tiles and a DEM subset for one region as a COG. One region done well beats the whole planet done thinly.
- **Day 1 morning:** Terrain sampling along a drawn line, elevation profile, slope computation.
- **Day 1 afternoon:** Energy and time model from stated rover parameters, and the slope-limit check.
- **Day 1 evening:** The survival card and the hazard overlay. Record by 18:30.
- **Day 2 morning:** Least-cost path suggestion between two points, and the contingency route.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Mars Trek tiles as PMTiles
- Regional DEM as COG
- Rover parameter set agreed and documented

**Cut in this order**

- Drawn routes only, drop automatic pathfinding
- Drop the contingency route
- Fixed demo route with a precomputed profile

## Data

- **NASA Mars Trek** — imagery and elevation for the region you choose, as tiles and downloadable products.
- **PDS Mars holdings** — the authoritative archive behind those products, with citable identifiers.
- **SpiceyPy** — optional communications windows, computed from kernels, never estimated.

**Route cost from terrain — one function, all assumptions visible**

```python
import numpy as np

ROVER = {"mass_kg": 900, "slope_limit_deg": 20, "speed_m_s": 0.04,
         "base_power_w": 120, "climb_cost_j_per_m_kg": 3.72}   # Mars gravity

def route_profile(elevations_m, spacing_m, rover=ROVER):
    dz = np.diff(elevations_m)
    slope = np.degrees(np.arctan2(dz, spacing_m))
    climb = dz[dz > 0].sum()
    distance = spacing_m * len(dz)
    time_s = distance / rover["speed_m_s"]
    energy_j = (rover["base_power_w"] * time_s
                + climb * rover["mass_kg"] * rover["climb_cost_j_per_m_kg"])
    return {"distance_m": float(distance), "max_slope_deg": float(np.abs(slope).max()),
            "total_climb_m": float(climb), "time_hours": float(time_s / 3600),
            "energy_wh": float(energy_j / 3600),
            "passes_slope_limit": bool(np.abs(slope).max() <= rover["slope_limit_deg"]),
            "assumptions": rover}
```

## Architecture

```
Mars Trek tiles ──► PMTiles       DEM ──► COG
        │                              │
        └───────────┬──────────────────┘
                    ▼
            MapLibre Mars map
            draw a route
                    │
                    ▼
        src/compute/route.py
  sample terrain · slope · energy · time · limits
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
   elevation    survival     hazard
    profile       card      overlay
                    │
                    ▼
         contingency route (least cost)
```

## Build prompt

**Paste into your coding agent**

```
Build a Mars traverse and survival planner for one region, default Jezero.

Data: a local PMTiles basemap from NASA Mars Trek and a regional DEM as a COG in
cache/mars/. All rendering and sampling is local.

src/compute/route.py: sample elevation along a drawn polyline at a fixed
spacing, compute the slope profile, total climb, distance, traverse time and
energy in watt-hours from a documented rover parameter set, and a boolean for
whether any segment exceeds the slope limit. Include a least-cost path between
two points over the DEM using Dijkstra with a cost of distance plus a slope
penalty. Unit-test on a synthetic ramp of known gradient.

Frontend: MapLibre with a draw tool, an elevation profile beneath the map with
over-limit segments highlighted, and a survival card showing distance, time,
energy, maximum slope, pass or fail, and the assumptions used.

If a route fails, say which segment failed and by how much, then offer a
contingency route from the least-cost path.

Every rover assumption is visible in the interface, not buried in code.
Apache-2.0, public repo, Mars Trek and PDS cited.
```
