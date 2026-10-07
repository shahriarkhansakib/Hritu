"""MODIS MOD11A2 Land Surface Temperature client via earthaccess.

dataset_id: MOD11A2.061
source_url: https://lpdaac.usgs.gov/products/mod11a2v061/
Note: Terra MODIS is winding down late 2026. Frame as historical record.
"""
from __future__ import annotations

import pathlib

# Dhaka bounding box for urban heat analysis
DHAKA_BBOX = (90.25, 23.65, 90.55, 23.95)  # west, south, east, north


def download_modis_lst(
    start: str = "2000-01-01",
    end: str = "2026-10-01",
    output_dir: str = "cache/modis_lst",
    bbox: tuple = DHAKA_BBOX,
    count: int = 100,
) -> list[pathlib.Path]:
    """Download MODIS MOD11A2 v061 LST 8-day composites.

    Args:
        start: Start date as ISO string.
        end: End date as ISO string.
        output_dir: Local directory for HDF files.
        bbox: Bounding box (west, south, east, north).
        count: Maximum granule count.

    Returns:
        List of downloaded file paths.

    Note:
        Requires Earthdata Login credentials.
        MODIS Terra sensor winding down late 2026 — frame as 2000-2025 record.
    """
    import earthaccess  # type: ignore

    earthaccess.login(strategy="netrc")
    results = earthaccess.search_data(
        short_name="MOD11A2",
        version="061",
        bounding_box=bbox,
        temporal=(start, end),
        count=count,
    )
    paths = earthaccess.download(results, output_dir)
    return paths


if __name__ == "__main__":
    paths = download_modis_lst()
    print(f"Downloaded {len(paths)} MODIS LST granules.")
