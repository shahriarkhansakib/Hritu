---
title: "Shared architecture"
page_id: arch
group: "Shared build kit"
order: 2
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Shared architecture

*One platform, fourteen science modules. Build the spine once and swap the middle.*

```
                          FRONTEND  (static, offline capable)
              MapLibre GL / deck.gl / Three.js  +  service worker cache
                                     │
                                     ▼
                            APP API  (FastAPI)
              REST endpoints ── cache: parquet / zarr / COG on disk
                                     │
                          agent orchestrator (optional)
                                     │  tools
                                     ▼
                             MCP SERVERS
        nasa/earthdata-mcp   ·   custom FastMCP   ·   pds-mcp-server
                                     │
                                     ▼
                  DATA ACQUISITION  (pre-event, and live when it can)
   earthaccess · CMR · Harmony · FIRMS · POWER · asf_search · api.nasa.gov
   GIBS tiles  · IRSA / SPHEREx · PDS Search · Solar System Treks
```

## The layer rule

Read the diagram top to bottom and the discipline falls out of it. The frontend never calls NASA directly. The API layer never calls NASA during a demo — it reads the local cache. The acquisition layer runs before the event and, when the network allows, in the background. Agents sit beside the API and reach data only through tools.

## Repository layout

**Project skeleton — same for all fourteen**

```
project/
├─ LICENSE                 # Apache-2.0 unless you choose another OSI license
├─ README.md               # what it does, how to run, datasets used
├─ CLAUDE.md               # project rules for coding agents
├─ AGENTS.md               # portable agent instructions
├─ .claude/skills/         # SKILL.md folders (see the Skill files tab)
├─ .env.example            # EDL_USER, FIRMS_MAP_KEY, NASA_API_KEY, ADS_API_TOKEN
├─ cache/                  # gitignored: downloaded NASA data
├─ demo_fixtures/          # committed: the exact bytes your demo needs
├─ docs/AI_USE.md          # every AI tool, the prompts, and your own work
├─ src/
│  ├─ acquire/             # one module per data source
│  ├─ compute/             # deterministic science — no LLM in here
│  ├─ agents/              # orchestrator + tool schemas
│  └─ api/                 # FastAPI app
└─ web/                    # frontend, builds to static files
```

> **Note**
>
> **Why `src/compute` is a separate folder.** It is a physical boundary you can point at during judging. Validity asks whether the method is scientifically grounded. "Our statistics live here, in tested functions, and the model never computes a number" is a twenty-second answer that earns points.

## The offline demo safety net

1. Pre-fetch every demo input into `cache/` and copy the minimum set into `demo_fixtures/` .
2. Wrap every fetch: try live, and on timeout or error read the fixture.
3. Add an `OFFLINE=1` environment flag that forces fixture mode.
4. Pre-render map tiles to a single PMTiles file and serve it locally. Pre-compute charts to static JSON.
5. Rehearse and record the 240-second demo with wifi switched off. That recording is your last line of defence.

**src/acquire/safe.py — the wrapper every fetch goes through**

```python
import json, os, pathlib, hashlib, requests

CACHE = pathlib.Path("cache"); CACHE.mkdir(exist_ok=True)
FIXTURES = pathlib.Path("demo_fixtures")
OFFLINE = os.getenv("OFFLINE") == "1"

def fetch_json(url, params=None, name=None, timeout=25):
    """Live first, cache second, committed fixture last. Never raises during a demo."""
    key = name or hashlib.md5(f"{url}{sorted((params or {}).items())}".encode()).hexdigest()
    cached = CACHE / f"{key}.json"
    fixture = FIXTURES / f"{key}.json"

    if not OFFLINE:
        try:
            r = requests.get(url, params=params, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            cached.write_text(json.dumps(data))
            return data, "live"
        except Exception:
            pass
    if cached.exists():
        return json.loads(cached.read_text()), "cache"
    if fixture.exists():
        return json.loads(fixture.read_text()), "fixture"
    raise FileNotFoundError(f"No live, cache or fixture data for {key}")
```

Show the returned source label in the interface. A small "cache" badge next to a number is honest, and judges read it as rigour rather than as a failure.
