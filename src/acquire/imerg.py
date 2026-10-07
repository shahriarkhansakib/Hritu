"""GPM IMERG Final Daily V07 client via earthaccess.

dataset_id: GPM_3IMERGDF_07
source_url: https://gpm.nasa.gov/data/imerg
Note: V07 is current (supersedes V06). Cite DOI in UI.
"""
from __future__ import annotations

import pathlib

# Bangladesh bounding box
BD_BBOX = (88.0, 20.6, 92.7, 26.6)  # west, south, east, north


def download_imerg(
    start: str = "2000-01-01",
    end: str = "2026-10-01",
    output_dir: str = "cache/imerg",
    count: int = 200,
) -> list[pathlib.Path]:
    """Download GPM IMERG Final Daily V07 granules for Bangladesh.

    Args:
        start: Start date as ISO string.
        end: End date as ISO string.
        output_dir: Local directory to save HDF5 files.
        count: Maximum number of granules to download.

    Returns:
        List of downloaded file paths.

    Note:
        Requires Earthdata Login. Set EDL_USER and EDL_PASSWORD in .env,
        or configure ~/.netrc with earthdata.nasa.gov credentials.
    """
    import earthaccess  # type: ignore

    earthaccess.login(strategy="netrc")
    results = earthaccess.search_data(
        short_name="GPM_3IMERGDF",
        version="07",
        bounding_box=BD_BBOX,
        temporal=(start, end),
        count=count,
    )
    paths = earthaccess.download(results, output_dir)
    return paths


if __name__ == "__main__":
    paths = download_imerg()
    print(f"Downloaded {len(paths)} IMERG granules.")
