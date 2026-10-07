---
title: "Challenge 02: Be an Earth System Trend Detective!"
page_id: c02
group: "The 14 challenges"
challenge_number: 2
tags: ["Earth science & data analysis", "Advanced"]
order: 12
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 02: Be an Earth System Trend Detective!

**Tags:** Earth science & data analysis · Advanced

## Brief

### What the challenge asks

Identify, visualise and explain environmental and climate trends in Earth-observation data. The word that matters is *trend*: not a pretty time series, but a claim about direction, magnitude and significance.

### The build

A trend investigation tool for Bangladesh. Pick a district and a variable — land surface temperature, rainfall, vegetation — and the tool runs a real Mann-Kendall test and a Theil-Sen slope over two decades of NASA data, then explains the result in plain language with the statistics attached.

> **Killer demo**
>
> Two districts side by side. One shows rising temperature with p = 0.003; the other shows no significant trend at all. The explanation says so honestly, and the provenance drawer shows the dataset and the raw numbers behind both.

### Where the points are

Validity is the whole challenge. A tested statistical function and a visible p-value beat a smooth animation. The judges' question for this criterion is whether it would work if deployed tomorrow — so show the test, the confidence interval, and the gaps in the record.

## 48-hour plan

- **Before the event:** Download POWER daily series for eight district centroids, 2001 to 2025, and one gridded product through earthaccess or AppEEARS. Write them to parquet and zarr. This is a few hundred megabytes at most.
- **Day 1 morning:** Load the cache, confirm the series are clean, and write the trend functions with unit tests. Science first, interface second.
- **Day 1 afternoon:** Build the map, the district selector and the chart. Show a real p-value on screen by the 15:00 mentor round.
- **Day 1 evening:** Add the comparison view and the provenance drawer. Record the 240-second video by 18:30.
- **Day 2 morning:** Wire the explanation agent — narration only, reading tool results. Add the cite_check gate.
- **Day 2 noon:** Freeze, record the 30-second video, submit.

**Pre-build**

- POWER parquet for every district
- One gridded variable as zarr
- Trend functions with tests passing

**Cut in this order**

- One variable instead of three
- One district instead of eight
- Drop the agent, keep static explanations
- Chart only, no map

## Data

- **NASA POWER** — daily temperature, precipitation and solar radiation for any point, no key, decades deep. Your fastest defensible series.
- **MODIS and VIIRS land surface temperature and NDVI** — through earthaccess or AppEEARS area sampling.
- **IMERG** — gridded precipitation for the monsoon story.
- **GRACE and GRACE-FO** — groundwater and total water storage, which is a strong Bangladesh angle.

**The result object your interface renders**

```json
{
  "district": "Rajshahi",
  "variable": "T2M",
  "period": "2001-01-01 to 2025-12-31",
  "n_observations": 9131,
  "trend": {"S": 41230, "Z": 3.61, "p_value": 0.0003,
            "direction": "increasing", "significant_at_0.05": true},
  "slope": {"slope_per_year": 0.031, "ci_low": 0.014, "ci_high": 0.048,
            "units": "degC per year"},
  "provenance": {"dataset_id": "NASA POWER daily point",
                 "source_url": "https://power.larc.nasa.gov/api/temporal/daily/point",
                 "retrieved": "2026-11-02T09:14:00Z", "mode": "cache"}
}
```

## Architecture

```
POWER / MODIS / IMERG / GRACE
             │  (pre-event)
             ▼
    cache: parquet + zarr
             │
             ▼
   src/compute/trend.py          ◄── tested, deterministic, no model
   Mann-Kendall · Theil-Sen · CI
             │
             ▼
        FastAPI /trend
             │
   ┌─────────┴──────────┐
   ▼                    ▼
map + chart        narration agent
                   (explains only)
   │                    │
   └────────┬───────────┘
            ▼
    provenance drawer
```

## Build prompt

**Paste into your coding agent**

```
Build an offline-first Earth-system trend investigation tool for Bangladesh.

Data layer: read pre-cached NASA POWER daily series (parquet, one file per
district centroid) and one gridded variable (zarr). Never call the network
during a request; add an OFFLINE=1 mode that forces cache reads.

Science layer in src/compute: implement Mann-Kendall (S, Z, p-value, direction)
and Theil-Sen slope with a 95 percent confidence interval, plus seasonal
decomposition. Unit-test them against a known increasing series, a known flat
series and a series with missing values. No language model may compute these.

API: FastAPI with GET /trend?district=&variable=&start=&end= returning the
result object including a provenance block with dataset_id, source_url,
retrieved timestamp and whether the value came from live, cache or fixture.

Frontend: a district map, a time-series chart with the fitted Theil-Sen line and
confidence band, a two-district comparison view, and a provenance drawer showing
the raw JSON behind every number.

Optional agent: a narration step that turns the result object into two sentences
of plain English and Bangla. It receives only the tool result, and output is
blocked if any stated number is absent from that result.

Apache-2.0, public repo, README listing every dataset with its URL.
```
