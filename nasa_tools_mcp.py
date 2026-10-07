"""NASA Tools MCP Server for Hritu.

Provides three tools to the agent orchestrator:
- firms_fire: active fire detections from NASA FIRMS
- power_climate: daily climate data from NASA POWER  
- cmr_search: granule discovery from NASA CMR

Install: pip install "mcp[cli]" fastmcp requests pandas
Test: npx @modelcontextprotocol/inspector python nasa_tools_mcp.py
Run: python nasa_tools_mcp.py
"""
from mcp.server.fastmcp import FastMCP
import requests, os, pandas as pd

mcp = FastMCP("nasa-tools")

FIRMS_KEY = os.getenv("FIRMS_MAP_KEY", "")
NASA_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")


@mcp.tool()
def firms_fire(sensor: str, bbox: str, days: int = 1) -> list[dict]:
    """Fetch active-fire detections from NASA FIRMS.
    
    Args:
        sensor: One of 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT', 'MODIS_NRT'
        bbox: Bounding box as 'west,south,east,north' (e.g. '88,20,93,27')
        days: Number of days (1-10). One call = one transaction.
    
    Returns:
        List of fire detection records with lat, lon, brightness, frp, confidence.
    Note:
        Suomi-NPP ends 1 Nov 2026. Prefer VIIRS_NOAA20_NRT or VIIRS_NOAA21_NRT.
    """
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{FIRMS_KEY}/{sensor}/{bbox}/{days}"
    try:
        df = pd.read_csv(url)
        return df.to_dict(orient="records")
    except Exception as e:
        return [{"error": str(e), "source": "firms", "sensor": sensor}]


@mcp.tool()
def power_climate(lat: float, lon: float, start: str, end: str,
                  parameters: str = "T2M_MIN,T2M_MAX,RH2M,PRECTOTCORR,WS50M_MAX") -> dict:
    """Fetch NASA POWER daily climate data for a single geographic point.
    
    Args:
        lat: Latitude (e.g. 23.81 for Dhaka, 24.37 for Rajshahi)
        lon: Longitude (e.g. 90.41 for Dhaka)
        start: Start date as YYYYMMDD (e.g. '19810101')
        end: End date as YYYYMMDD (e.g. '20261231')
        parameters: Comma-separated POWER parameters.
                    T2M_MIN=min temp, T2M_MAX=max temp, RH2M=humidity,
                    PRECTOTCORR=precipitation, WS50M_MAX=max wind speed at 50m
    
    Returns:
        Dict of parameter -> {date -> value} mappings.
    Note:
        POWER is MERRA-2 model-reanalysis, not station observations. Resolution: 0.5°x0.625°.
        dataset_id: 'NASA_POWER_AG_DAILY', source_url: 'https://power.larc.nasa.gov'
    """
    url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    q = dict(parameters=parameters, community="AG", latitude=lat, longitude=lon,
             start=start, end=end, format="JSON")
    try:
        r = requests.get(url, params=q, timeout=60)
        r.raise_for_status()
        return r.json()["properties"]["parameter"]
    except Exception as e:
        return {"error": str(e), "lat": lat, "lon": lon}


@mcp.tool()
def cmr_search(short_name: str, bbox: str, t0: str, t1: str, page_size: int = 50) -> dict:
    """Search NASA CMR (Common Metadata Repository) for dataset granules.
    
    Args:
        short_name: Dataset short name (e.g. 'GPM_3IMERGDF', 'MOD11A2', 'VNP46A1')
        bbox: Bounding box as 'west,south,east,north'
        t0: Start datetime as ISO string (e.g. '2000-01-01T00:00:00Z')
        t1: End datetime as ISO string
        page_size: Number of granules to return (max 2000)
    
    Returns:
        CMR search results with granule metadata and download URLs.
    """
    url = "https://cmr.earthdata.nasa.gov/search/granules.json"
    q = {"short_name": short_name, "bounding_box": bbox,
         "temporal": f"{t0},{t1}", "page_size": page_size}
    try:
        r = requests.get(url, params=q, timeout=30)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        return {"error": str(e), "short_name": short_name}


if __name__ == "__main__":
    mcp.run(transport="stdio")
