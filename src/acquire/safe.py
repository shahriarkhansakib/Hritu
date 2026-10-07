"""Universal fetch wrapper for all NASA API calls.

Priority chain: live → cache → demo_fixture → raise FileNotFoundError
Never raises during a demo if OFFLINE=1 is set and fixtures exist.
"""
import json
import os
import pathlib
import hashlib
import requests
from typing import Any

CACHE = pathlib.Path("cache")
CACHE.mkdir(exist_ok=True)
FIXTURES = pathlib.Path("demo_fixtures")
FIXTURES.mkdir(exist_ok=True)
OFFLINE = os.getenv("OFFLINE") == "1"


def fetch_json(
    url: str,
    params: dict | None = None,
    name: str | None = None,
    timeout: int = 25,
) -> tuple[Any, str]:
    """Fetch JSON from a URL with live→cache→fixture fallback.

    Args:
        url: The API endpoint URL.
        params: Optional query parameters dict.
        name: Optional cache key name. Auto-generated from URL+params if not provided.
        timeout: Request timeout in seconds.

    Returns:
        Tuple of (data, source) where source is 'live', 'cache', or 'fixture'.

    Raises:
        FileNotFoundError: If no live, cache, or fixture data is available.

    Note:
        Always display the source label in the UI.
        'fixture' = committed demo data (offline-safe)
        'cache' = previously fetched live data (offline-safe once filled)
        'live' = freshly fetched from NASA API
    """
    key = name or hashlib.md5(
        f"{url}{sorted((params or {}).items())}".encode()
    ).hexdigest()
    cached = CACHE / f"{key}.json"
    fixture = FIXTURES / f"{key}.json"

    last_err = ""
    if not OFFLINE:
        try:
            r = requests.get(url, params=params, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            cached.write_text(json.dumps(data))
            return data, "live"
        except requests.exceptions.HTTPError as e:
            # Capture NASA's specific error message if available
            try:
                last_err = f"NASA API rejected request ({e.response.status_code}): {e.response.json().get('detail', e.response.text)}"
            except:
                last_err = str(e)
        except Exception as e:
            last_err = str(e)

    if cached.exists():
        return json.loads(cached.read_text()), "cache"

    if fixture.exists():
        return json.loads(fixture.read_text()), "fixture"

    err_msg = f"Data not available locally."
    if last_err:
        err_msg += f" Live fetch also failed: {last_err}"
    
    raise FileNotFoundError(err_msg)
