---
title: "Challenge 04: CLPS Lunar Mission Browser"
page_id: c04
group: "The 14 challenges"
challenge_number: 4
tags: ["Lunar exploration & software", "Advanced", "Intermediate"]
order: 14
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 04: CLPS Lunar Mission Browser

**Tags:** Lunar exploration & software · Advanced · Intermediate

## Brief

### What the challenge asks

An interactive browser for NASA's Commercial Lunar Payload Services missions — the deliveries that carry NASA instruments to the Moon on commercial landers.

### The build

A lunar map where every CLPS mission is a landing site with its payload manifest, provider, target date and status, layered over real lunar terrain, with a filter by payload type and a timeline of the whole programme.

> **Killer demo**
>
> Filter to "instruments that measure volatiles", and the map redraws to show only the south-polar sites that carry them, with the lunar terrain and the landing ellipse underneath.

### Where the points are

Relevance and Validity: this is a data-faithfulness project. If a payload list is wrong, an expert judge will notice. Cite the source for every mission record and mark anything unconfirmed as unconfirmed rather than guessing.

## 48-hour plan

- **Before the event:** Compile the CLPS mission table — provider, lander, target site, payloads, dates, status, source URL for each row. This research is slow and must not happen on the night.
- **Day 1 morning:** Moon Trek WMTS rendering with the sites plotted and labelled.
- **Day 1 afternoon:** Mission detail panel and payload filter. Add the terrain and elevation layers.
- **Day 1 evening:** Programme timeline across the bottom, linked to the map. Record by 18:30.
- **Day 2 morning:** Compare mode for two sites, source links on every field, mobile layout.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Mission and payload table with citations
- Moon Trek tiles cached to PMTiles
- South-polar elevation subset

**Cut in this order**

- Fewer missions, fully sourced
- Drop the elevation layer
- Timeline becomes a static list
- Static basemap image

## Data

- **NASA Moon Trek** — WMTS basemap tiles, elevation and slope products for the south polar region.
- **PDS lunar holdings** — LRO-derived products and stable identifiers.
- **NTRS and NASA mission pages** — payload manifests and mission status.
- **SpiceyPy** — optional: compute Sun elevation at a landing site for a date, which turns a map into a planning tool.

> **Warning**
>
> **Geometry is computed, never guessed.** If you show illumination or Earth visibility, it comes out of SPICE kernels in `src/compute`. A language model must not estimate where the Sun is.

## Architecture

```
missions.json (cited)   Moon Trek WMTS ──► PMTiles
        │                        │
        └────────┬───────────────┘
                 ▼
           MapLibre lunar map
                 │
      ┌──────────┼───────────┐
      ▼          ▼           ▼
  payload    mission     timeline
   filter     panel       scrubber
                 │
                 ▼
      optional: SpiceyPy illumination
        src/compute/geometry.py
```

## Build prompt

**Paste into your coding agent**

```
Build a CLPS lunar mission browser.

Data: data/missions.json, one record per CLPS delivery with provider, lander,
target coordinates, landing ellipse, target date, status, payload array (each
with name, instrument type and purpose) and a source_url per record.

Map: MapLibre with a local PMTiles lunar basemap derived from NASA Moon Trek,
plus an optional hillshade layer. Plot each landing site with its ellipse.

Interactions: filter missions by payload instrument type and by status; click a
site for a detail panel listing every payload with its purpose and the source
link; a timeline along the bottom that filters the map by target date; a compare
mode that puts two sites side by side.

Optional: a src/compute/geometry.py using SpiceyPy to compute Sun elevation at a
site for a chosen date from local kernels. The value is computed in Python and
passed to the interface; never estimated.

Mark any unconfirmed field explicitly as unconfirmed. Apache-2.0, public repo,
README citing every mission source.
```
