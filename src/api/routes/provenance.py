"""Provenance API routes for Hritu.

The Provenance Drawer endpoint returns the raw tool JSON behind any displayed figure.
This is the cite_check gate exposed as an API.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class CiteCheckRequest(BaseModel):
    claims: list[dict]


class ProvenanceRequest(BaseModel):
    dataset_id: str
    source_url: str
    method_used: str | None = None
    period_start: str | None = None
    period_end: str | None = None
    caveats: list[str] = []


@router.post("/cite-check")
def cite_check(req: CiteCheckRequest):
    """Validate that all claims have dataset_id and source_url.

    Returns {"valid": true} if all claims pass, or {"valid": false, "failed_claim": "..."}.
    Blocks UI output when valid=false.
    """
    for claim in req.claims:
        if not claim.get("source_url") or not claim.get("dataset_id"):
            return {
                "valid": False,
                "failed_claim": claim.get("text", "unknown"),
                "message": "⚠️ Citation Required: This claim is missing a dataset_id or source_url.",
            }
    return {"valid": True, "message": "All claims are properly cited."}


@router.post("/drawer")
def provenance_drawer(req: ProvenanceRequest):
    """Return the full provenance record for a Provenance Drawer display.

    This endpoint is called when the user clicks "Open Provenance Drawer"
    under any chart or verdict card.
    """
    # Dataset landing page URLs
    landing_pages = {
        "NASA_POWER_AG_DAILY": "https://power.larc.nasa.gov/",
        "GPM_3IMERGDF_07":     "https://gpm.nasa.gov/data/imerg",
        "MOD11A2.061":         "https://lpdaac.usgs.gov/products/mod11a2v061/",
        "VNP46A1.001":         "https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP46A1/",
        "NASA_GIBS_WMTS":      "https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs",
    }

    return {
        "dataset_id":   req.dataset_id,
        "source_url":   req.source_url,
        "landing_page": landing_pages.get(req.dataset_id, req.source_url),
        "method_used":  req.method_used or "Modified Mann-Kendall (Hamed-Rao 1998) + Theil-Sen",
        "period_start": req.period_start,
        "period_end":   req.period_end,
        "caveats":      req.caveats or _default_caveats(req.dataset_id),
        "library":      "pymannkendall>=1.4.3, scipy>=1.13.0",
    }


def _default_caveats(dataset_id: str) -> list[str]:
    caveats = {
        "NASA_POWER_AG_DAILY": [
            "MERRA-2 reanalysis (model-based, not station observations)",
            "Spatial resolution: 0.5° × 0.625°",
            "Daily values are grid-cell averages, not point measurements",
        ],
        "GPM_3IMERGDF_07": [
            "Satellite-based precipitation estimate (V07)",
            "Spatial resolution: 0.1° × 0.1°",
            "Availability: June 2000 – present",
        ],
        "MOD11A2.061": [
            "Land Surface Temperature (not air temperature)",
            "Terra MODIS sensor winding down late 2026",
            "8-day composite — cloud gaps possible during monsoon",
        ],
        "VNP46A1.001": [
            "Suomi-NPP VIIRS ends 1 November 2026 — prefer NOAA-20",
            "Monthly average DNB radiance",
            "Nightlights proxy for human activity (not economic output)",
        ],
    }
    return caveats.get(dataset_id, ["No additional caveats."])
