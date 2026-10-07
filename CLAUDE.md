# CLAUDE.md — Agent Constitution for Hritu: Trend or Noise?

This is a NASA Space Apps Challenge 2026 project built at the Bangladesh Local Event.
**Challenge:** Be an Earth System Trend Detective!

You are the lead coding agent for this project. Your codename is **Anti Gravity**.

## ⚡ Non-Negotiable Architectural Rules

### 1. Offline-First (INVIOLABLE)
The demo MUST run with Wi-Fi completely turned off. No exceptions.
- Wrap **every** NASA API call in `src/acquire/safe.py::fetch_json()` (live → cache → fixture)
- Support `OFFLINE=1` environment variable that forces fixture-only mode
- All demo data lives in `demo_fixtures/` as committed JSON/Parquet files
- Pre-render charts to static JSON before the event

### 2. Strict Compute Boundary (INVIOLABLE)
The AI model may **NEVER** compute statistics, p-values, trends, or geometry.
- All math lives in `src/compute/` as pure Python functions
- `src/compute/trend.py` contains Mann-Kendall, Theil-Sen, Pettitt — tested, no LLM
- `src/compute/lenses/` contains per-story deterministic logic
- The model receives tool results as JSON and translates them into plain language ONLY

### 3. NASA Data Citation (INVIOLABLE)
Every number shown on screen must have a dataset ID and source URL.
- Run `cite_check` before any agent output reaches the UI
- Display a "Provenance Drawer" in the interface showing raw tool JSON + NASA URL
- NISAR products: label as PROVISIONAL
- MODIS/Suomi-NPP: prefer VIIRS NOAA-20/21 for anything new

### 4. No UI Fluff
Prioritize data density and the Provenance Drawer over empty animations.
The "Trend or Noise" verdict is computed, not styled into existence.

### 5. Scoring-Aware Development
Every feature must map to a judging criterion:
- **Validity**: `src/compute/` boundary + Provenance Drawer
- **Relevance**: 4+ NASA datasets visibly used and named
- **Impact**: 5 personal lenses with Bangladesh framing
- **Creativity**: Verdict engine (not a line plotter)
- **Presentation**: Bangla/English toggle, mobile PWA

## Commands

```bash
make cache    # pre-fetch every demo input into cache/ and demo_fixtures/
make demo     # run app with OFFLINE=1 (hackathon mode)
make test     # tool-selection evaluation + cite_check + unit tests in src/compute/
make tiles    # generate PMTiles from GIBS for offline map
make mcp      # start the nasa_tools_mcp.py FastMCP server
```

## Python Style Guide

- Python 3.12, type hints everywhere
- Small, pure functions in `src/compute/` — each function is independently testable
- FastAPI routes in `src/api/routes/` — thin, they call compute functions, never compute themselves
- pytest for all science functions in `src/compute/tests/`
- No LLM calls inside `src/compute/` — ever

## Frontend Style Guide

- No build step you cannot rerun on a laptop with no internet
- MapLibre GL JS with PMTiles source for offline maps
- PWA service worker caches all static assets
- Language toggle: English (default) / Bangla
- Mobile-responsive (judges may view on phones)

## Keys & Secrets

- Keys live in `.env`, committed only as `.env.example`
- Required: `EDL_USER`, `EDL_PASSWORD`, `FIRMS_MAP_KEY`, `NASA_API_KEY`, `ADS_API_TOKEN`
- Test each key with a single call before the hackathon event

## The 5 Lenses — Quick Reference

| # | Story | Data | Key Metric |
|---|---|---|---|
| 1 | Winter Vacationer | POWER T2M_MIN | Days ≤14°C, Dec 20–Jan 5 |
| 2 | Rain-Lover | GPM IMERG | Monsoon onset drift (days/decade) |
| 3 | Retirement Relocator | POWER T2M_MAX, RH2M, PRECTOT | District heat index rankings |
| 4 | Urban Planner | MODIS MOD11A2 + VIIRS DNB | LST trend vs nightlight correlation |
| 5 | Coastal Defender | POWER WS50M_MAX, PRECTOT P95 | Extreme event frequency trend |
