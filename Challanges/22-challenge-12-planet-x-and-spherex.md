---
title: "Challenge 12: Planet X and SPHEREx"
page_id: c12
group: "The 14 challenges"
challenge_number: 12
tags: ["Astrophysics & cosmology", "Advanced"]
order: 22
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 12: Planet X and SPHEREx

**Tags:** Astrophysics & cosmology · Advanced

## Brief

### What the challenge asks

Explore cosmic maps and astronomical data connected to NASA's SPHEREx mission, which is surveying the entire sky in 102 infrared wavelengths.

### The build

A spectral sky explorer. Load a SPHEREx cutout, pick a source, and the tool extracts its spectrum across the survey's wavelength bands and matches it against catalogues — with a moving-object mode that compares epochs to surface anything that shifted between visits.

> **Killer demo**
>
> Click a point of light. A 102-band spectrum draws itself beside the image, and the catalogue match appears underneath with its identifier. This is the moment where an all-sky spectral survey stops being an abstraction.

### Where the points are

Best Use of Data is a global category and this challenge is the natural fit. Cite the release DOI — QR2 is `10.26131/IRSA652`. Be careful with the word "discovery": show candidates and say they are candidates.

## 48-hour plan

- **Before the event:** Pull several SPHEREx cutouts through IRSA or AWS, plus a catalogue subset for the same sky region. FITS files are large, so choose two or three regions and cache them properly.
- **Day 1 morning:** FITS display in the browser and source extraction with photutils.
- **Day 1 afternoon:** Spectrum extraction across bands and the spectral plot.
- **Day 1 evening:** Catalogue cross-match with the identifier displayed. Record by 18:30.
- **Day 2 morning:** Epoch comparison and the moving-object candidate list, with honest uncertainty.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- SPHEREx cutouts cached as FITS
- Catalogue subset for the same region
- Astropy and photutils installed and tested

**Cut in this order**

- Drop the moving-object mode
- One region, one spectrum, done well
- Precomputed spectra instead of live extraction

## Data

- **SPHEREx through IRSA** — public weekly releases since July 2025, searchable with SIA v2 through pyvo or astroquery. Current processing is QR2, DOI `10.26131/IRSA652` ; QR1 was `10.26131/IRSA629` .
- **SPHEREx on AWS Open Data** — the same products without an authentication step, which is useful for bulk caching.
- **NASA ADS** — literature context for whatever you find, with a free bearer token.
- **api.nasa.gov NeoWs** — near-Earth object context for the solar-system side of the story.

**Extract a spectrum, honestly**

```python
from astropy.io import fits
import numpy as np

def extract_spectrum(cutout_paths, x, y, aperture_px=3):
    """One flux per band with its uncertainty. Bands with no coverage return
    None rather than an interpolated guess."""
    out = []
    for path in cutout_paths:               # one file per wavelength band
        with fits.open(path) as hdul:
            data, hdr = hdul[0].data, hdul[0].header
            yy, xx = np.ogrid[:data.shape[0], :data.shape[1]]
            mask = (xx - x) ** 2 + (yy - y) ** 2 <= aperture_px ** 2
            vals = data[mask]
            good = np.isfinite(vals)
            out.append({"wavelength_um": hdr.get("WAVELEN"),
                        "flux": float(vals[good].sum()) if good.any() else None,
                        "n_pixels": int(good.sum()),
                        "file": path})
    return out
```

## Architecture

```
IRSA SIA / AWS ──► SPHEREx cutouts (FITS, cached)
                          │
                          ▼
              astropy + photutils
        source extraction · aperture photometry
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
      FITS viewer    spectrum      epoch compare
      (JS9/Aladin)   102 bands     candidate motion
                          │
                          ▼
              catalogue cross-match
             identifier + ADS context
                          │
                          ▼
            citation: DOI 10.26131/IRSA652
```

## Build prompt

**Paste into your coding agent**

```
Build a SPHEREx spectral sky explorer.

Data: pre-cached SPHEREx cutouts as FITS in cache/spherex/, one file per
wavelength band for two or three sky regions, plus a catalogue subset for the
same regions. Record the release version and DOI in the repo.

Backend: astropy and photutils. Source detection on a chosen band, aperture
photometry across every band to build a spectrum, and a cross-match against the
cached catalogue returning the matched identifier and separation in arcseconds.

Bands without coverage return null, never an interpolated value.

Frontend: a FITS image viewer with a band selector, click a source to draw its
spectrum as flux against wavelength with error bars, and a match panel showing
the catalogue identifier, separation, and a link to ADS.

Moving-object mode: load two epochs of the same region, align them, difference
them, and list sources whose position changed by more than a stated threshold.
Label these as candidates, show the measured motion, and never call anything a
discovery.

Cite the SPHEREx release DOI 10.26131/IRSA652 in the interface and the README.
Apache-2.0, public repo.
```
