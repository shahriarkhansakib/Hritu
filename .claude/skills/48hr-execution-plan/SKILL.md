---
name: 48hr-execution-plan
description: Hour-by-hour execution blueprint for the Hritu hackathon build (Nov 13–14 2026). Use when planning sprints, deciding what to cut, or checking progress against the timeline.
license: Apache-2.0
metadata:
  author: SpaceApps-Bangladesh-2026
  version: "1.0"
---

# 48-Hour Execution Blueprint

## Pre-Event (Before Nov 13)

### By October 1 (DONE)
- [ ] Shortlist challenge (Challenge 02 selected ✅)
- [ ] Record 240-second prescreening video (concept only)
- [ ] Collect all API keys:
  - Earthdata Login account
  - FIRMS MAP_KEY
  - NASA_API_KEY
  - ADS_API_TOKEN

### By October 28 (Full Statements Day)
- [ ] Compare NASA's named datasets vs. our dataset plan
- [ ] Update cache targets if NASA names different datasets
- [ ] Lock scope (which of the 5 stories to prioritize)

### Nov 2–12 (Pre-Build Sprint)
- [ ] `make cache` — download all 5 story datasets
- [ ] Verify `src/compute/tests/` all pass
- [ ] Wire MCP server (`nasa_tools_mcp.py`)
- [ ] Build Story 1 (Winter) end-to-end as proof of concept
- [ ] Build PMTiles for offline map
- [ ] **CRITICAL: Full dry run with OFFLINE=1 must succeed by Nov 12**
- [ ] Record backup 240-sec video with wifi off

---

## Day 1 — November 13

### 07:00 — Registration Opens
- Submit team registration immediately
- Set up laptops, verify OFFLINE=1 mode works on venue laptop

### 08:00–10:30 — Setup Sprint
- `git clone` on venue machine
- `make demo` — verify it works offline
- Team roles confirmed:
  - **Backend:** Python, FastAPI, `src/compute/`, `src/acquire/`
  - **Frontend:** React/MapLibre, Chart.js, Tailwind
  - **Data:** NASA APIs, cache management, `make cache`
  - **Demo:** Video recording, project page writing

### 10:30 — Opening Ceremony

### 11:30 — First Mentor Round
- **Pitch in 60 seconds:** "5 personal stories, one statistical verdict engine, 4 NASA datasets, offline-first"
- **Ask mentors:** Which story resonates most? Which district should we demo?

### 12:00–18:00 — Core Build Sprint (6 hours)

**Priority order (highest impact first):**

1. **Story 1 (Winter) — Hour 1–2**
   - `src/compute/lenses/winter.py` complete
   - FastAPI route `/api/story/1/verdict`
   - Frontend: Rajshahi card with verdict badge
   - Test: `pytest src/compute/tests/` passes

2. **Story 2 (Monsoon) — Hour 2–4**
   - `src/compute/lenses/monsoon.py` complete
   - FastAPI route `/api/story/2/verdict`
   - Frontend: Calendar dot visualization

3. **Map (All Stories) — Hour 3–4**
   - PMTiles basemap working in MapLibre
   - Bangladesh district layer from GeoParquet
   - Click-to-select district interaction

4. **Provenance Drawer — Hour 4–5**
   - Collapsible drawer showing raw JSON
   - Dataset ID links to NASA dataset pages
   - `cite_check` integrated into API routes

5. **Story 3 (Relocator Map) — Hour 5–6**
   - Choropleth map with district rankings
   - Green/red color scale
   - Click district → show trend chart

### 18:00–18:30 — Local Judging Video
- Record 240-second video with running app
- **Name every NASA dataset out loud on camera**
- Show the Provenance Drawer opening
- Show the OFFLINE=1 mode indicator

### 18:30 — Upload 240-second video to event portal

### 19:00–23:00 — Evening Build Sprint (4 hours)

1. **Story 4 (Urban Heat) — Hour 1–2**
   - Side-by-side MODIS LST vs VIIRS map
   - Correlation coefficient badge
   - Dhaka bbox visualization

2. **Story 5 (Coastal) — Hour 2–3**
   - Bar chart with extreme day counts
   - Pettitt change-point line overlay
   - Bhola, Barisal, Cox's Bazar

3. **Bangla Language Toggle — Hour 3–4**
   - All 5 story captions in Bangla
   - Language toggle in header
   - Keep metrics in English within Bangla text

### 23:00 — End Day 1
- Commit all working code
- Run `make demo` one more time (OFFLINE=1)
- Note what's working vs. cut list

---

## Day 2 — November 14

### 08:00–10:00 — Polish Sprint (2 hours)

- Mobile responsiveness (CSS fixes)
- PWA service worker (cache all static assets)
- Error states ("Data unavailable for X year due to sensor gap")
- Loading states with data source badge (live/cache/fixture)

### 10:00–12:00 — FREEZE FEATURES (Hard Deadline)

**After 12:00 noon, NO new features. Only:**
- Fix bugs in existing features
- Record videos
- Write project page
- Publish repository

### 12:00–14:00 — 30-Second Global Video
- **English subtitles required**
- Content: Team name, problem, demo clip, NASA data used, impact
- 30 seconds = 3 shots: problem → solution → impact

### 14:00–16:00 — Project Page

Fill every field:
1. High-Level Summary (include both video links + GitHub link)
2. Project Demo (30-sec video)
3. Final Project (repo link + docs)
4. Project Details (why/what/how + all datasets listed)
5. GitHub access (test in private window)
6. Use of AI (point to `docs/AI_USE.md`)
7. NASA data sources (all 5 datasets + GIBS)
8. References

### 16:00 — Make Repository Public
- Verify link opens without login
- Test in a private/incognito browser window
- Push final commit

### 17:00–18:00 — Buffer
- Fix project page fields if anything is wrong
- Check that all 3 points (category named, repo public, page submitted) are secured

---

## The Cut List (What to Drop When Behind)

Drop in this order (keep the most impactful story):

1. **Drop first:** Story 4 (Urban Heat) — requires MODIS+VIIRS spatial processing, most complex
2. **Drop second:** Story 5 (Coastal) — POWER data is simpler but the extreme percentile logic takes time
3. **Drop third:** Geographic scope — one district instead of all 64 for Story 3
4. **Drop fourth:** Live queries — serve fixture-only for all stories
5. **NEVER drop:** Story 1 (Winter) + Story 2 (Monsoon) — these are the killer demo moments
6. **NEVER drop:** Provenance Drawer — this is the Validity score
7. **NEVER drop:** The 3 single-point submissions (category, repo, page)

## The Killer Demo Moment (Protect at All Costs)

For Story 1: "Rajshahi had **12 cold days** per winter in 1985. It has **3 now**. The Mann-Kendall test says: 🔴 REAL TREND (p = 0.003)."

This one moment, done convincingly, scores higher than five stories done halfway.

## Team Communication Protocol

- **Check-ins:** Every 2 hours during build sprints
- **Blocker rule:** If stuck for >30 minutes, switch to the cut version and move on
- **Git discipline:** Commit every working increment (even small ones)
- **Demo laptop:** One laptop is ALWAYS kept in demo state (OFFLINE=1, never editing)
