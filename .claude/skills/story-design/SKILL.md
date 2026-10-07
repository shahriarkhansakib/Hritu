---
name: story-design
description: Narrative and UX design principles for Hritu's 5 human story lenses. Use when designing the user flow, choosing narrative framing, writing UI copy, or deciding how to present a verdict. Ensures the science stays personal and accessible.
license: Apache-2.0
metadata:
  author: SpaceApps-Bangladesh-2026
  version: "1.0"
---

# Story Design Principles for Hritu

## The Core Narrative Philosophy

Hritu is NOT a "climate data dashboard." It is a detective story where the user is the detective.

Every interaction follows this arc:
1. **The Personal Hook** — A relatable character notices something is off
2. **The Data Question** — We translate that feeling into a measurable metric
3. **The Verdict** — Our engine answers: REAL TREND / WEAK SIGNAL / NOISE
4. **The Evidence** — Show the raw data + provenance so the user trusts the verdict
5. **The So What** — What does this mean for the character's decision?

## The 5 Characters — Narrative Details

### 1. 🌨️ The Winter Vacationer
**Character:** Imran, 17, from Dhaka. His family travels to Rajshahi every December to experience winter.
**The moment:** "Baba, it's December 28th and I'm sweating. Where's the cold?"
**The metric:** Cold days (≤14°C) in the Dec 20 – Jan 5 window
**The verdict moment:** "Rajshahi had X cold days per winter in the 1980s. It has Y now."
**Their decision:** Whether to bother packing sweaters

**UI Note:** Show a "sweater counter" — how many cold days did Rajshahi have vs. now?
The comparison should be the first thing on screen, not a chart with axes.

---

### 2. 🌧️ The Rain-Lover
**Character:** Fatema, a student and daughter of a farmer in Sylhet.
**The moment:** "Baba says Asharh used to start on schedule. Now we wait and wait."
**The metric:** Monsoon onset day-of-year (DOY), 2000–2026
**The verdict moment:** "The Sylhet monsoon now arrives X days later per decade."
**Their decision:** When to plant rice / whether to irrigate early

**UI Note:** Show a calendar visualization. Color each year's onset dot. Let the user see
the dots drifting right (later in the year) over time. This is more powerful than a line chart.

---

### 3. 🏡 The Retirement Relocator
**Character:** Rahim and Nasrin, 60s, Dhaka. They want to escape to somewhere cooler.
**The moment:** "We want to retire somewhere green and breezy. Which district is getting better, not worse?"
**The metric:** Heat Index trend ranking for all 64 districts
**The verdict moment:** A choropleth map of Bangladesh — green = improving, red = worsening
**Their decision:** Which district to retire to

**UI Note:** The map IS the story. Click a district → see its full trend chart.
Default view: "Top 5 most climate-resilient districts" ranked.
Add a "Compare districts" toggle.

---

### 4. 🏙️ The Urban Planner
**Character:** A municipal planner in Dhaka City Corporation, 35.
**The moment:** "The new developments in Uttara and Bashundhara — they're the hottest spots in the city. Coincidence?"
**The metric:** Spatial correlation of MODIS LST trend vs. VIIRS nightlight trend
**The verdict moment:** The side-by-side slope map where the same neighborhoods are hot in both
**Their decision:** Where to mandate tree cover / green buffers in building codes

**UI Note:** This is the most visually striking story. Two satellite-derived trend maps,
side by side, showing the same heat islands where development has surged.
Add a correlation coefficient badge: "r = X.XX (p < 0.01)"

---

### 5. 🌊 The Coastal Defender
**Character:** Karim, 45, from Bhola. His family has lived on the coast for generations.
**The moment:** "The cyclones feel stronger. The rains come all at once now, not spread out."
**The metric:** Annual count of extreme rain days (P95) and extreme wind days
**The verdict moment:** "Bhola experienced X extreme days per year in the 1990s vs. Y today."
**Their decision:** Whether to invest in flood-resistant housing / when to evacuate

**UI Note:** Show a bar chart with years on the x-axis. Each bar = number of extreme days.
Overlay the trend line. The Pettitt change-point should be highlighted as a vertical line.

## UX Design Rules

### The Verdict Card
Every story ends with a verdict card:
```
┌─────────────────────────────────────────┐
│  🔴 REAL TREND                          │
│  Rajshahi's cold days: decreasing       │
│  Slope: -2.1 cold days per decade      │
│  Confidence: p = 0.003 (≥95%)          │
│  ────────────────────────────────────── │
│  [NASA POWER · 1981–2026 · MERRA-2]    │
│  [▼ Open Provenance Drawer]            │
└─────────────────────────────────────────┘
```

### Color Coding
- 🔴 **REAL_TREND**: Bold red/orange card (the story has an answer)
- 🟡 **WEAK_SIGNAL**: Yellow card (inconclusive — be honest about this)
- ⚫ **NOISE**: Grey card (no trend detected — this is also a valid scientific result)

**Important:** NOISE is not a failure. "The data shows no significant trend" is an honest, valid, scientifically important result. Frame it as: "The data says this is noise — which means the pattern you noticed might have another explanation."

### Language Toggle
- Default: English
- Toggle: বাংলা (Bangla)
- The 2-sentence AI caption is generated in both simultaneously
- Metric labels, numbers, and p-values stay in English even in Bangla mode
- The "Trend or Noise?" question renders as "প্রবণতা না গোলমাল?"

### Data Source Badge
Every chart has a small badge in the corner: `📡 NASA POWER` or `🛰️ MODIS` etc.
Clicking the badge opens the Provenance Drawer.

## Accessibility & Offline UX

- No animation that requires more than 100ms CPU
- Maps work without WebGL (fallback to static PNG if canvas unavailable)
- Color choices pass WCAG AA contrast
- The "data source" badge shows "📦 fixture" when in OFFLINE=1 mode
- Every chart has an accessible data table hidden below it

## Demo Flow (240-second prescreening)

**0–15s:** "Bangladesh has 6 distinct seasons. They're disappearing. We built a tool to prove it — or disprove it."

**15–60s:** Open Story 1 (Winter Vacationer). Show Rajshahi. Click "Analyze." See the verdict: REAL TREND. "The cold season has lost 2.1 days per decade. p=0.003."

**60–90s:** Open Story 2 (Monsoon). Show the calendar dots drifting right. "The monsoon is arriving 1.8 days later each decade."

**90–120s:** Open Story 3 map. Show the choropleth. "We ranked all 64 districts. Here's where to retire."

**120–150s:** Open Provenance Drawer. "Every number traces to a NASA dataset. Here's the raw JSON."

**150–180s:** Switch to Bangla. "The same app, for farmers who don't read English."

**180–210s:** OFFLINE=1 badge visible. "We built this to run without wifi, because Bangladesh's venue wifi is unreliable."

**210–240s:** "We're Hritu — meaning 'season' in Bengali. Built in 48 hours at NASA Space Apps Bangladesh 2026."
