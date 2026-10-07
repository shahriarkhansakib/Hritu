# Hritu: Trend or Noise?
**NASA Space Apps Challenge 2026 - Bangladesh Local Event**
**Challenge:** Be an Earth System Trend Detective!

Hritu Detective is an offline-first, online-capable Earth system investigation tool that translates decades of NASA climate data into hyper-local, personal stories for Bangladesh. Instead of showing generic temperature graphs, we use deterministic statistical models (Modified Mann-Kendall, Theil-Sen, Pettitt change-point) to answer a single question: *Is this seasonal shift real, or is it just noise?*

## The 5 Human Lenses (Our Stories)

### 1. 🥶 The Winter Vacationer (The Missing Cold)
A teenager visiting Rajshahi in late December finds the winter gone.
- **Data:** NASA POWER `T2M_MIN` (1981–2026)
- **Metric:** Count of days ≤14°C between Dec 20 – Jan 5
- **Verdict:** Has Rajshahi's "cold season" statistically disappeared?

### 2. 🌧️ The Rain-Lover (The Delayed Monsoon)
A student/farmer waits for the Asharh rains that used to arrive reliably.
- **Data:** GPM IMERG Final V07 (2000–2026)
- **Metric:** Monsoon onset drift — first 7-day window with >25mm rain, no dry spell
- **Verdict:** Is the monsoon arriving later? By how many days per decade?

### 3. 🏡 The Retirement Relocator (The Microclimate Scout)
An elderly couple seeks to escape Dhaka's heat for a quiet, climate-resilient district.
- **Data:** NASA POWER `T2M_MAX`, `RH2M`, `PRECTOTCORR`
- **Metric:** Regional trend rankings for heat index and rainfall
- **Verdict:** Which of Bangladesh's 64 districts has the most favorable climate trend?

### 4. 🏙️ The Urban Planner (Dhaka Heat vs. Lights)
Are the fastest-warming areas of Dhaka the exact same areas developing the fastest?
- **Data:** MODIS `MOD11A2` (Land Surface Temp) vs. VIIRS Day/Night Band (Nightlights)
- **Metric:** Spatial correlation of LST warming trends vs. nightlight illumination trends
- **Verdict:** Does urban expansion causally predict local temperature rise?

### 5. 🌊 The Coastal Defender (Extreme Extremes)
A resident of Bhola notices cyclones and cloudbursts feel more violent each year.
- **Data:** NASA POWER `WS50M_MAX` (wind) and `PRECTOTCORR` (95th percentile rain events)
- **Metric:** Frequency and intensity trend of extreme weather days
- **Verdict:** Are extreme events becoming more frequent or more intense — or both?

## The "Trend or Noise" Verdict Engine

Every story ends with one of three verdicts:
- 🔴 **REAL TREND** — Mann-Kendall p < 0.05, statistically significant
- 🟡 **WEAK SIGNAL** — Trend exists but p ≥ 0.05 (noise cannot be ruled out)
- ⚪ **NOISE** — No detectable trend in the data

The verdict is **never invented by the AI**. It is computed deterministically by `src/compute/trend.py` and the AI only translates the JSON result into plain language.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend compute | Python 3.12, FastAPI, `pymannkendall`, `scipy`, `numpy` |
| Data storage | DuckDB (Parquet), Xarray (Zarr) |
| Frontend | React/Vite (or Vanilla TS), MapLibre GL JS, Chart.js, Tailwind CSS |
| Offline maps | PMTiles (generated from NASA GIBS tiles) |
| AI narration | Claude claude-sonnet-4-6 via Anthropic API (explanation only) |
| MCP | FastMCP (`nasa_tools_mcp.py`) for POWER, FIRMS, CMR |

## Repository Structure

```
hritu/
├── LICENSE                     # Apache-2.0
├── README.md
├── CLAUDE.md                   # Agent constitution
├── AGENTS.md                   # AI orchestration rules
├── Makefile
├── .env.example                # EDL_USER, FIRMS_MAP_KEY, NASA_API_KEY, ADS_API_TOKEN
├── .claude/
│   └── skills/
│       ├── trend-detective/SKILL.md
│       ├── nasa-data-access/SKILL.md
│       ├── evidence-provenance/SKILL.md
│       ├── offline-first/SKILL.md
│       └── judging-ready-submission/SKILL.md
├── cache/                      # gitignored: downloaded NASA data
├── demo_fixtures/              # committed: exact bytes for demo
├── docs/
│   └── AI_USE.md               # AI disclosure (mandatory)
├── src/
│   ├── acquire/                # Data fetching modules
│   │   ├── __init__.py
│   │   ├── safe.py             # Universal fetch wrapper (live→cache→fixture)
│   │   ├── power.py            # NASA POWER client
│   │   ├── firms.py            # FIRMS fire/weather client
│   │   ├── imerg.py            # GPM IMERG via earthaccess
│   │   ├── modis.py            # MODIS MOD11A2 via earthaccess
│   │   ├── viirs.py            # VIIRS DNB via earthaccess
│   │   └── tiles.py            # GIBS → PMTiles downloader
│   ├── compute/                # Deterministic science — NO LLM EVER
│   │   ├── __init__.py
│   │   ├── trend.py            # Mann-Kendall, Theil-Sen, Pettitt
│   │   ├── lenses/             # Per-story computation modules
│   │   │   ├── winter.py       # Story 1: cold day counter
│   │   │   ├── monsoon.py      # Story 2: onset drift
│   │   │   ├── relocator.py    # Story 3: district ranking
│   │   │   ├── urban.py        # Story 4: LST vs nightlight correlation
│   │   │   └── coastal.py      # Story 5: extreme event frequency
│   │   └── tests/
│   │       └── test_trend.py
│   ├── agents/                 # LLM orchestration
│   │   ├── __init__.py
│   │   ├── loop.py             # Orchestrator (6-step cap)
│   │   ├── tools.json          # Tool schemas
│   │   └── prompts/
│   │       └── explain.md      # The explanation agent's prompt
│   └── api/                    # FastAPI app
│       ├── __init__.py
│       ├── main.py
│       └── routes/
│           ├── lenses.py
│           └── provenance.py
├── web/                        # Frontend (static PWA)
│   ├── index.html
│   ├── public/
│   │   └── bd.pmtiles
│   └── src/
│       ├── main.ts
│       ├── components/
│       └── stories/
└── nasa_tools_mcp.py           # FastMCP server (3 tools)
```

## Setup & Offline Run

```bash
# 1. Register: earthdata.nasa.gov + firms.modaps.eosdis.nasa.gov/api/map_key/
# 2. Copy env file
cp .env.example .env
# (fill in your keys)

# 3. Install dependencies
pip install -r requirements.txt

# 4. Pre-fetch all NASA data (run before the hackathon)
make cache

# 5. Run in offline mode (hackathon demo mode)
make demo  # runs with OFFLINE=1

# 6. Run tests
make test
```

## Judging Criteria Mapping

| Criterion | Our Strategy | Points |
|---|---|---|
| **Validity** | Modified Mann-Kendall (autocorrelation-corrected) + Provenance Drawer | 20 |
| **Relevance** | 4 distinct NASA datasets (POWER, IMERG, MODIS, VIIRS) | 20 |
| **Impact** | 5 personal stories → real Bangladeshi decisions | 20 |
| **Creativity** | "Trend or Noise" verdict engine, not a line plotter | 20 |
| **Presentation** | English/Bangla toggle, mobile PWA, offline | 20 |

## NASA Datasets Used

| Dataset | Source | Used For |
|---|---|---|
| NASA POWER (T2M_MIN, T2M_MAX, RH2M, PRECTOTCORR, WS50M_MAX) | `power.larc.nasa.gov` | Stories 1, 3, 5 |
| GPM IMERG Final V07 | `earthaccess` / CMR | Story 2 (monsoon onset) |
| MODIS MOD11A2 (LST) | `earthaccess` / CMR | Story 4 (urban heat) |
| VIIRS Day/Night Band | `earthaccess` / CMR | Story 4 (nightlights) |
| NASA GIBS Tiles | `gibs.earthdata.nasa.gov` | Basemap (all stories) |

## Disclaimer

NASA does not endorse this project. Dataset recommendations are from the team and follow the Space Apps 2026 Bangladesh Build Guide. NISAR products are provisional. SPHEREx QR2 not used in this project. Verify all dates at spaceappschallenge.org.
