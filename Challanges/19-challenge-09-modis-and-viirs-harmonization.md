---
title: "Challenge 09: Harmonization of MODIS and VIIRS Hot Spots"
page_id: c09
group: "The 14 challenges"
challenge_number: 9
tags: ["Thermal sensing & wildfires", "Advanced", "Intermediate"]
order: 19
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 09: Harmonization of MODIS and VIIRS Hot Spots

**Tags:** Thermal sensing & wildfires · Advanced · Intermediate

## Brief

### What the challenge asks

Combine and harmonise MODIS hotspot detections at one kilometre with VIIRS detections at 375 metres, so that wildfire activity can be tracked consistently across the whole record.

### The build

A harmonisation engine and a burning-activity calendar. The finer sensor detects more fires and smaller ones, so a raw count series shows a step change at the sensor transition that is an artefact of the instrument, not of the world. Cluster overlapping detections onto a common grid, model the detection difference, and produce a series you can actually compare across decades.

> **Killer demo**
>
> A single toggle: raw against harmonised, over South Asia from 2003 to 2026. In raw, counts appear to triple at the transition. In harmonised, the artefact disappears and the real seasonal signal is visible underneath.

### Where the points are

This is the most timely challenge on the board. Suomi-NPP data stops being available from NASA on 1 November 2026, with MODIS shutting down from late 2026 — so continuity between sensors stops being academic and becomes an operational problem. Say that in your video.

## 48-hour plan

- **Before the event:** Pull multi-year FIRMS archive CSVs for MODIS and for VIIRS over your region and write them to parquet. Mind the transaction limit: 5,000 per ten minutes is generous, but bulk archive downloads are the right route for long records.
- **Day 1 morning:** Grid the detections, cluster overlapping same-day detections, and build the raw and harmonised series. This is the project — get it right before anything else.
- **Day 1 afternoon:** The calendar view and the map. Make the toggle work by the 15:00 round.
- **Day 1 evening:** Seasonal baseline and the anomaly question: is today unusual for this place at this time of year? Record by 18:30.
- **Day 2 morning:** The methods panel, the sensor-overlap validation, and the responder-facing brief.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Multi-year FIRMS parquet for both sensors
- Overlap period identified for validation
- Grid definition agreed

**Cut in this order**

- One region instead of a subcontinent
- Five years instead of twenty
- Drop the anomaly engine, keep harmonisation

## Data

- **FIRMS area API** — MODIS and VIIRS active fire detections with confidence, brightness and acquisition time. Free key, 5,000 transactions per ten minutes.
- **VIIRS on NOAA-20 and NOAA-21** — the sensors that continue. Prefer these for anything forward-looking.
- **NASA POWER** — wind, temperature and humidity as the environmental context for an anomaly.
- **The overlap period** — where MODIS and VIIRS both observed the same fires is your validation set. Use it.

**Harmonisation, in the form a judge can check**

```python
import duckdb

def harmonise(parquet_glob, cell_km=5.5):
    """Collapse same-day detections onto a common grid so a finer sensor cannot
    inflate the count. One cell-day with any detection counts once."""
    deg = cell_km / 111.0
    return duckdb.sql(f"""
      SELECT acq_date,
             floor(latitude  / {deg}) AS cell_y,
             floor(longitude / {deg}) AS cell_x,
             count(*)                        AS raw_detections,
             count(DISTINCT satellite)       AS sensors_agreeing,
             max(frp)                        AS peak_frp
      FROM '{parquet_glob}'
      WHERE confidence >= 50
      GROUP BY 1,2,3
    """).df()

# Raw series  = count(*) per day across all detections
# Harmonised  = count of distinct cell-days per day
# Validate on the overlap period: harmonised MODIS and harmonised VIIRS should
# track each other far more closely than the raw counts do. Report that ratio.
```

## Architecture

```
FIRMS MODIS ──┐
              ├──► parquet (pre-event)
FIRMS VIIRS ──┘        │
   NOAA-20 / NOAA-21    │
                        ▼
              src/compute/harmonize.py
      grid · cluster · overlap validation · baseline
                        │
            ┌───────────┼────────────┐
            ▼           ▼            ▼
      raw series   harmonised    anomaly vs
                    series      seasonal baseline
            └───────────┼────────────┘
                        ▼
            map + burning calendar
              raw/harmonised toggle
                        │
                        ▼
         methods panel + responder brief
```

## Build prompt

**Paste into your coding agent**

```
Build a MODIS and VIIRS hotspot harmonisation tool with a burning-activity
calendar.

Data: pre-cached FIRMS detections in parquet for MODIS and for VIIRS on
NOAA-20 and NOAA-21, covering South Asia, filtered to confidence 50 or above.

src/compute/harmonize.py: assign detections to a common grid of configurable
cell size, default 5.5km; collapse same-day detections within a cell so a finer
sensor cannot inflate counts; produce a raw daily series and a harmonised daily
series; compute a day-of-year seasonal baseline with percentiles from the
harmonised record; and compute an anomaly score for a chosen date and area.

Validation: on the period where both sensors observed, report the correlation of
raw MODIS against raw VIIRS and of harmonised against harmonised. Display both
numbers in the interface — the improvement is the evidence that harmonisation
worked.

Frontend: a map of cells coloured by activity, a year-by-day calendar heatmap, a
single toggle switching every chart between raw and harmonised, and a question
box answering "is this unusual for this place and this time of year" with the
percentile and the baseline window.

Methods panel: cell size, confidence filter, the collapse rule, the validation
correlations, and a note that Suomi-NPP data ends on 1 November 2026 and MODIS
is being retired, which is why continuity matters.

Apache-2.0, public repo, FIRMS cited with the sensor product names.
```
