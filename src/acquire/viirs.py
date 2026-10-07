"""VIIRS Day/Night Band client via earthaccess.

dataset_id: VNP46A1.001 (Suomi-NPP) / VJ146A1 (NOAA-20, preferred)
source_url: https://ladsweb.modaps.eosdis.nasa.gov
Note: Suomi-NPP VIIRS ends 1 November 2026. Prefer NOAA-20 (VJ1) products.
"""
from __future__ import annotations

import pathlib

# Dhaka bounding box
DHAKA_BBOX = (90.25, 23.65, 90.55, 23.95)


def download_viirs_dnb(
    start: str = "2012-01-01",
    end: str = "2026-10-01",
    output_dir: str = "cache/viirs_dnb",
    bbox: tuple = DHAKA_BBOX,
    count: int = 100,
    prefer_noaa20: bool = True,
) -> list[pathlib.Path]:
    """Download VIIRS Day/Night Band granules.

    Args:
        start: Start date as ISO string.
        end: End date as ISO string.
        output_dir: Local directory for HDF5 files.
        bbox: Bounding box (west, south, east, north).
        count: Maximum granule count.
        prefer_noaa20: If True, use NOAA-20 (VJ146A1). Else use Suomi-NPP (VNP46A1).

    Returns:
        List of downloaded file paths.

    Note:
        Suomi-NPP ends 1 November 2026. Always set prefer_noaa20=True for current data.
    """
    import earthaccess  # type: ignore

    earthaccess.login(strategy="netrc")
    short_name = "VJ146A1" if prefer_noaa20 else "VNP46A1"
    results = earthaccess.search_data(
        short_name=short_name,
        version="001",
        bounding_box=bbox,
        temporal=(start, end),
        count=count,
    )
    paths = earthaccess.download(results, output_dir)
    return paths


if __name__ == "__main__":
    paths = download_viirs_dnb()
    print(f"Downloaded {len(paths)} VIIRS DNB granules.")
