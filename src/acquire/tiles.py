"""NASA GIBS tile downloader and PMTiles packager.

Downloads raster tiles from NASA GIBS WMTS for offline MapLibre basemap.
dataset_id: NASA_GIBS_WMTS
source_url: https://gibs.earthdata.nasa.gov
Note: No authentication required for GIBS tiles.
"""
from __future__ import annotations

import argparse
import pathlib
import urllib.request
from itertools import product

GIBS_BASE = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best"

# Bangladesh bbox in WGS84
BD_BBOX_WGS84 = (88.0, 20.6, 92.7, 26.6)  # west, south, east, north


def deg_to_tile(lat: float, lon: float, zoom: int) -> tuple[int, int]:
    """Convert WGS84 coordinates to tile x,y at given zoom level."""
    import math
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2.0 * n)
    return x, y


def download_gibs_tiles(
    layer: str = "MODIS_Terra_CorrectedReflectance_TrueColor",
    bbox: tuple = BD_BBOX_WGS84,
    zoom_range: range = range(4, 11),
    date: str = "2024-06-15",
    output_dir: str = "cache/tiles",
) -> int:
    """Download GIBS WMTS tiles for a bounding box and zoom range.

    Args:
        layer: GIBS layer name.
        bbox: Bounding box (west, south, east, north) in WGS84.
        zoom_range: Range of zoom levels to download.
        date: Date string for the tile request (YYYY-MM-DD).
        output_dir: Directory to write tile files.

    Returns:
        Number of tiles downloaded.
    """
    out = pathlib.Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    west, south, east, north = bbox
    count = 0

    for zoom in zoom_range:
        x_min, y_max = deg_to_tile(north, west, zoom)
        x_max, y_min = deg_to_tile(south, east, zoom)
        tile_dir = out / str(zoom)
        tile_dir.mkdir(exist_ok=True)

        for x, y in product(range(x_min, x_max + 1), range(y_min, y_max + 1)):
            url = (f"{GIBS_BASE}/{layer}/default/{date}/"
                   f"GoogleMapsCompatible_Level9/{zoom}/{y}/{x}.jpg")
            tile_path = tile_dir / f"{x}_{y}.jpg"
            if not tile_path.exists():
                try:
                    urllib.request.urlretrieve(url, tile_path)
                    count += 1
                except Exception as e:
                    print(f"  Failed {url}: {e}")
    return count


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download NASA GIBS tiles")
    parser.add_argument("--layer", default="MODIS_Terra_CorrectedReflectance_TrueColor")
    parser.add_argument("--bbox", default="88.0,20.6,92.7,26.6")
    parser.add_argument("--zoom", default="4-10")
    parser.add_argument("--date", default="2024-06-15")
    parser.add_argument("--out", default="cache/tiles")
    args = parser.parse_args()

    west, south, east, north = map(float, args.bbox.split(","))
    zoom_min, zoom_max = map(int, args.zoom.split("-"))
    n = download_gibs_tiles(
        layer=args.layer,
        bbox=(west, south, east, north),
        zoom_range=range(zoom_min, zoom_max + 1),
        date=args.date,
        output_dir=args.out,
    )
    print(f"Downloaded {n} tiles to {args.out}")
    print("Run: pmtiles convert cache/tiles/ web/public/bd.pmtiles")
