---
title: "Data sources"
page_id: data
group: "Shared build kit"
order: 3
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Data sources

*Verified endpoints, authentication, limits, and what to download before you travel.*

| Source | Base URL | Auth | Limits | Access | Cache before the event |
|---|---|---|---|---|---|
| Earthdata Login | `urs.earthdata.nasa.gov` | Free account, `.netrc` or bearer token | — | Auth for most Earth data | Make the account now |
| earthaccess | `pip install earthaccess` | EDL | — | Search, download, stream to xarray | Yes |
| CMR Search | `cmr.earthdata.nasa.gov/search` | None | 2,000 granules per page | REST: json, umm_json, echo10 | Metadata only |
| Harmony | `harmony.earthdata.nasa.gov` | EDL token | Server-side jobs | Subset, reproject, reformat | Yes — subset once |
| AppEEARS | `appeears.earthdatacloud.nasa.gov/api/` | EDL to bearer | — | Point and area sampling | Yes |
| FIRMS | `firms.modaps.eosdis.nasa.gov/api/` | Free MAP_KEY | 5,000 transactions per 10 min | Area CSV API | Yes — CSV to parquet |
| NASA POWER | `power.larc.nasa.gov/api/` | None | Throttled, one request per grid cell | Daily, hourly, monthly, climatology | Yes |
| api.nasa.gov | `api.nasa.gov` | `api_key` | DEMO_KEY 30/hr, 50/day · key 1,000/hr | APOD, EPIC, NeoWs, Mars Photos | Yes |
| GIBS | `gibs.earthdata.nasa.gov/wmts/` | None | — | WMTS and WMS tiles | Yes — to PMTiles |
| ASF (NISAR, Sentinel-1) | `api.daac.asf.alaska.edu` | EDL to download | — | SearchAPI and `asf_search` | Yes — pull scenes |
| IRSA / SPHEREx | `irsa.ipac.caltech.edu` | None | — | SIA v2, pyvo, astroquery, AWS | Yes — cutouts |
| PDS Search | `pds.nasa.gov/api/search/1/` | None | — | REST, `pds.peppi` | Metadata |
| Solar System Treks | `trek.nasa.gov/tiles/` | None | — | WMTS tiles, GetCapabilities | Yes — tiles |
| WebGeocalc | `wgc2.jpl.nasa.gov:8443/webgeocalc/api/` | None | Light use only | SPICE geometry online | Use SpiceyPy locally |
| SpiceyPy | `pip install spiceypy` | None | — | Local CSPICE geometry | Yes — kernels |
| OSDR / GeneLab | `osdr.nasa.gov/osdr/data/` | None | — | REST JSON and CSV | Yes |
| NTRS | `ntrs.nasa.gov/api/` | None | Not published | Citations, search, PDFs | Yes — PDFs |
| NASA ADS | `api.adsabs.harvard.edu/v1/` | Free bearer token | — | Literature search | Metadata |

## Three status notes that change what you build

> **Warning**
>
> **NISAR L-band is public but provisional.** The initial public release began 20 July 2026 and covers observations acquired on or after 17 June 2026; the full science record is expected by the end of 2026. Products are validated at a limited set of sites. Say "provisional" in your interface and in your video.

> **Warning**
>
> **SPHEREx is on QR2.** Public weekly releases through IRSA since July 2025. QR2 supersedes QR1. Cite the release DOI: QR2 is `10.26131/IRSA652`, QR1 is `10.26131/IRSA629`.

> **Warning**
>
> **MODIS and Suomi-NPP are winding down.** Suomi-NPP data stops being available from NASA on 1 November 2026, with Terra and Aqua MODIS shutting down from late 2026. Prefer VIIRS on NOAA-20 and NOAA-21 for anything new. This is exactly why challenge 9 exists this year.

## Partner and local data

Seventeen Space Agency Partners contribute data in 2026, including ESA, JAXA, ISRO, CSA, ASI and KASA. Copernicus and Sentinel data comes through the Copernicus Data Space Ecosystem and AWS; Landsat through USGS EarthExplorer or a STAC client. For Bangladesh framing, add Bangladesh Water Development Board river and flood records and Bangladesh Meteorological Department station data on top of the NASA layer — partner and third-party sources on top of NASA data is what a 5 out of 5 looks like on the NASA data usage criterion.

## The four datasets most Bangladesh projects will want

- **NASA POWER** — no key, small files, decades of daily climate for any point. The fastest path to a defensible trend.
- **FIRMS** — one free key, CSV in, parquet out, immediate fire and burning-season stories.
- **Sentinel-1 GRD through ASF** — radar sees through monsoon cloud, which optical sensors cannot.
- **GIBS tiles** — an instant, credible NASA basemap with no authentication.
