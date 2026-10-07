---
title: "MCP servers"
page_id: mcp
group: "Shared build kit"
order: 7
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# MCP servers

*Existing servers you can install today, and a complete NASA server you can write in twenty minutes.*

## Servers that already exist

| Server | What it exposes | Install |
|---|---|---|
| **nasa/earthdata-mcp** | NASA's own CMR server: collections, granules, keywords, services, variables, citations. Streamable HTTP. | Remote server |
| **datalayer/earthdata-mcp-server** | Earthdata discovery with Jupyter integration | `docker run datalayer/earthdata-mcp-server:latest` |
| **podaac/cmr-mcp** | CMR through earthaccess | `uv` project, Claude Desktop config supplied |
| **NASA-PDS/pds-mcp-server** | Official Planetary Data System registry. FastMCP, Python 3.13+ | Clone and `python src/main.py` |
| **ProgramComputer/NASA-MCP-server** | Twenty-plus NASA APIs in one server | `npx @programcomputer/nasa-mcp-server` |
| **eo-mcp** | Copernicus, Landsat, Sentinel-1 and DEMs across clouds | See repo |
| **Official infra servers** | filesystem, fetch, git and GitHub, Postgres and SQLite | `modelcontextprotocol/servers` |

## Your own NASA server

Three tools cover most of what an agent needs on the weekend: fire detections, climate for a point, and a catalogue search. This is the whole server.

**nasa_tools_mcp.py — pip install "mcp[cli]" fastmcp requests pandas**

```python
from mcp.server.fastmcp import FastMCP
import requests, os, pandas as pd

mcp = FastMCP("nasa-tools")
FIRMS_KEY = os.getenv("FIRMS_MAP_KEY", "")

@mcp.tool()
def firms_fire(sensor: str, bbox: str, days: int = 1) -> list[dict]:
    """Active fire detections from NASA FIRMS.
    bbox is 'west,south,east,north'. days is 1 to 10."""
    u = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_KEY}/{sensor}/{bbox}/{days}"
    return pd.read_csv(u).to_dict(orient="records")

@mcp.tool()
def power_climate(lat: float, lon: float, start: str, end: str,
                  parameters: str = "T2M,PRECTOTCORR") -> dict:
    """NASA POWER daily climate for one point. start and end are YYYYMMDD."""
    u = "https://power.larc.nasa.gov/api/temporal/daily/point"
    q = dict(parameters=parameters, community="AG", latitude=lat, longitude=lon,
             start=start, end=end, format="JSON")
    return requests.get(u, params=q, timeout=60).json()["properties"]["parameter"]

@mcp.tool()
def cmr_search(short_name: str, bbox: str, t0: str, t1: str) -> dict:
    """Search NASA CMR for granules. bbox is 'w,s,e,n'; t0 and t1 are ISO datetimes."""
    u = "https://cmr.earthdata.nasa.gov/search/granules.json"
    q = {"short_name": short_name, "bounding_box": bbox,
         "temporal": f"{t0},{t1}", "page_size": 50}
    return requests.get(u, params=q, timeout=30).json()

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

**claude_desktop_config.json — absolute paths, then restart the client**

```json
{
  "mcpServers": {
    "nasa-tools": {
      "command": "uv",
      "args": ["--directory", "/ABSOLUTE/PATH/project", "run", "nasa_tools_mcp.py"],
      "env": { "FIRMS_MAP_KEY": "your_key_here" }
    }
  }
}
```

**Test it before you rely on it**

```
npx @modelcontextprotocol/inspector uv run nasa_tools_mcp.py
```

> **Note**
>
> **Two things that break MCP setups on the night.** Relative paths in the config, and forgetting to restart the client after editing it. Use absolute paths, restart, and confirm the tools appear in the inspector before you write any agent code.

## The Model Context Protocol itself

Official SDKs exist for Python — `pip install "mcp[cli]"`, which bundles FastMCP — and TypeScript. FastMCP's decorator pattern shown above is how most Python MCP servers are written. Your tool docstrings become the tool descriptions the model reads, so write them for the model: say what the tool returns, what the units are, and what the arguments mean.
