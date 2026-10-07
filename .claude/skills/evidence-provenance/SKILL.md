---
name: evidence-provenance
description: Attach a dataset_id and source_url to every numeric claim and validate citations before any agent output reaches the UI. Use whenever an agent explains or narrates a trend result in Hritu.
allowed-tools: Read
license: Apache-2.0
---

# Evidence and Provenance

## The Rule

Every number shown on screen must originate from a tool-result JSON object that carries:
- `source_url` — the NASA endpoint URL that returned the data
- `dataset_id` — the NASA CMR short_name or DOI (e.g., `GPM_3IMERGDF_07`, `MOD11A2.061`)

## The Provenance Gate

Before ANY agent output reaches the UI, run `cite_check`:

```python
def cite_check(claims: list[dict]) -> bool:
    """
    Each claim must have: text, source_url, dataset_id.
    Returns True only if ALL claims pass. Blocks output otherwise.
    """
    for claim in claims:
        if not claim.get("source_url") or not claim.get("dataset_id"):
            return False
    return True
```

If `cite_check` returns False: block the agent output and show "⚠️ Citation Required" in the UI.

## The Provenance Drawer

Every chart and verdict card has a collapsible Provenance Drawer that shows:
1. The raw JSON returned by the compute tool
2. The dataset ID (as a clickable link to the NASA dataset landing page)
3. The source URL that was called
4. The statistical method used (e.g., "Hamed-Rao Modified Mann-Kendall, pymannkendall v1.4")
5. The data period (start date, end date)
6. Any caveats (PROVISIONAL, model-based, winding-down sensor)

**Open the Provenance Drawer during the demo.** This action alone earns points on Validity.

## Wording Rules for the Explanation Agent

- Report what was measured, not what it means
  - ✅ "Rajshahi recorded a statistically significant decrease in cold days (p=0.003, MK slope = −2.1 days/decade)"
  - ❌ "Winter has disappeared from Rajshahi due to climate change"
- State the processing level and any provisional status
- Never smooth over a data gap — say "Data unavailable for [year] due to sensor gap"
- For MERRA-2 based data: "This is model-reanalysis data, not direct station observations"
- For MODIS (winding down): "Historical record 2000–2025; sensor is being decommissioned"

## Dataset ID Reference for cite_check

| Data Used | dataset_id | source_url |
|---|---|---|
| NASA POWER | `NASA_POWER_AG_DAILY` | `https://power.larc.nasa.gov` |
| GPM IMERG Final V07 | `GPM_3IMERGDF_07` | `https://gpm.nasa.gov/data/imerg` |
| MODIS LST MOD11A2 | `MOD11A2.061` | `https://lpdaac.usgs.gov/products/mod11a2v061/` |
| VIIRS DNB VNP46A1 | `VNP46A1.001` | `https://ladsweb.modaps.eosdis.nasa.gov` |
| NASA GIBS Tiles | `NASA_GIBS_WMTS` | `https://gibs.earthdata.nasa.gov` |
