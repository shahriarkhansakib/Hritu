---
title: "Challenge 07: Field Shift: Adapting Farms with NASA Data"
page_id: c07
group: "The 14 challenges"
challenge_number: 7
tags: ["Agriculture & climate adaptation", "Advanced", "Intermediate"]
order: 17
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 07: Field Shift: Adapting Farms with NASA Data

**Tags:** Agriculture & climate adaptation · Advanced · Intermediate

## Brief

### What the challenge asks

Help farmers adapt their practices using satellite observations and predictive climate data.

### The build

A planting-window advisory for Bangladeshi rice. Pick a district and a crop, and the tool shows how the onset of usable rainfall and the accumulation of growing degree days have shifted over twenty-five years, then states the recommended window shift in days with the evidence behind it.

> **Killer demo**
>
> A farmer in Rajshahi selects Aman rice. The tool says the usable-rain onset has moved eleven days later since 2001, shows the two distributions that prove it, and gives the revised transplanting window — in Bangla, on a phone.

### Where the points are

Impact, if the output is a decision a real farmer could act on. The failure mode is a dashboard that shows data and leaves the farmer to work it out. End on a sentence, not a chart.

## 48-hour plan

- **Before the event:** Cache POWER daily series for your districts, NDVI for the same areas, and SMAP soil moisture. Agree the agronomic definitions — what counts as onset, which degree-day base — with someone who knows farming.
- **Day 1 morning:** Onset detection and degree-day accumulation in src/compute, with tests.
- **Day 1 afternoon:** District map, crop selector, and the two-period distribution comparison.
- **Day 1 evening:** The advisory sentence and its assumptions. Record by 18:30.
- **Day 2 morning:** Bangla interface, phone layout, SMS-length summary. Test it with someone outside the team.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- POWER, NDVI and SMAP for every district
- Crop calendar and degree-day bases agreed
- Bangla strings drafted

**Cut in this order**

- One crop instead of three
- One district, told properly
- Drop SMAP, keep rainfall and temperature
- Drop the map, keep the advisory

## Data

- **NASA POWER** — daily rainfall, temperature and solar radiation per district. The backbone of the whole advisory.
- **IMERG** — gridded precipitation when you need spatial detail rather than a point.
- **SMAP** — soil moisture, which is what actually determines whether a field is workable.
- **MODIS or VIIRS NDVI** — observed greenness, so you can check your predicted window against what farmers actually did.

**Monsoon onset — one definition, stated openly**

```python
def rain_onset(daily_mm, window=7, threshold_mm=20, dry_spell_max=7):
    """First day of a 7-day window with 20mm or more that is not followed by a
    dry spell longer than 7 days. State this definition in the interface."""
    import numpy as np
    r = np.asarray(daily_mm, float)
    for i in range(len(r) - window - dry_spell_max):
        if r[i:i + window].sum() >= threshold_mm:
            after = r[i + window:i + window + dry_spell_max]
            if (after > 1.0).any():
                return i
    return None
```

> **Note**
>
> **Say the definition out loud.** Onset has a dozen definitions in the literature. Naming yours, and showing the result is stable if you shift the threshold a little, is the difference between a 10 and a 20 on validity.

## Architecture

```
POWER · IMERG · SMAP · NDVI
            │ (pre-event)
            ▼
     cache: parquet per district
            │
            ▼
  src/compute/agro.py
  onset · degree days · shift test
            │
            ▼
     FastAPI /advisory
            │
   ┌────────┴────────┐
   ▼                 ▼
 map + charts   advisory sentence
                Bangla + English
            │
            ▼
   assumptions + dataset citations
```

## Build prompt

**Paste into your coding agent**

```
Build a planting-window advisory for Bangladeshi farmers.

Data: pre-cached NASA POWER daily parquet per district (rainfall, T2M, solar),
plus SMAP soil moisture and NDVI series. OFFLINE=1 forces cache reads.

src/compute/agro.py: monsoon onset detection with a stated, configurable
definition; growing-degree-day accumulation with a crop-specific base; a
comparison of the onset distribution for 2001-2012 against 2013-2025 using a
Mann-Whitney test; and a recommended window shift in whole days. Unit-test each
function, including a sensitivity check that reports how the shift changes when
the onset threshold moves by plus or minus 5mm.

API: GET /advisory?district=&crop= returning the shift in days, the two
distributions, the test statistic, the assumptions, and a provenance block.

Frontend: mobile-first, Bangla and English. A district map, the two-period
distribution chart, and a single clear advisory sentence at the top. Include an
SMS-length version of the advice, under 160 characters, that a farmer could be
sent.

Show the onset definition and every assumption on screen. Apache-2.0, public
repo, README listing each dataset with its URL.
```
