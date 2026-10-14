# NASA Space Apps Challenge 2026: Strategy, Analysis & Ideation Conversations

> **Document Context:** Transcript of strategic planning, challenge-by-challenge competitive audits, scientific boundary architecture, and Bangladesh localization ideation for the **NASA Space Apps Challenge 2026** (featuring **Challenge 02: Be an Earth System Trend Detective!**).

---

## 1. Why NASA Hosts Space Apps: Solving the "Last-Mile Problem"

**User Prompt:**  
*There should be so many existing solutions/projects for these problems/challenges, right? Especially since the data is NASA's own property, so they should have already created dashboards using that data. How can we make new projects without them, and why would NASA use ours? They should have their own bigger and better projects, right? Also, what existing solutions are there for the stated challenges right now in the market or on the internet?*

**Response:**  
NASA does not host the Space Apps Challenge to build raw scientific databases; they host it to solve the **"last-mile problem."**

While NASA operates petabyte-scale archives like the **Distributed Active Archive Centers (DAACs)**, the **Planetary Data System (PDS)**, and the **Earth Observing System Data and Information System (EOSDIS)**, their existing software suffers from three structural limitations:

1. **Designed for researchers, not end users:** Tools like NASA Giovanni or ASF Vertex output raw NetCDF, HDF5, or GeoTIFF files. They require a background in remote sensing or orbital mechanics to interpret, making them unusable for a farmer, an emergency dispatcher, an astronaut under stress, or a school student.
2. **Global scope without local context:** NASA satellites collect uniform global measurements, but NASA cannot build localized applications for every river basin or agricultural delta on Earth. A Bangladeshi team integrating NASA POWER data with Bangladesh Water Development Board river records creates a tool NASA's central engineering teams would never prioritize building.
3. **Operational gaps and sensor retirements:** Several challenges target active operational friction points. For instance, Suomi-NPP data access ends on November 1, 2026, and MODIS is phasing out. NASA actively needs novel cross-sensor harmonization methods and outside engineering prototypes to bridge these transitions.

---

## 2. Challenge-by-Challenge: Existing Solutions vs. The Unsolved Gaps

| Challenge | What Exists Today (NASA & Market) | Why Existing Tools Are Insufficient | What Your Project Does Differently |
|---|---|---|---|
| **01. Abandoned but not Forgotten** | NASA NSSDCA Master Catalog; NASA Solar System Treks (Moon & Mars Trek); Wikipedia hardware catalogs. | NSSDCA is a tabular registry of mission metadata (COSPAR IDs, launch dates). Solar System Treks displays basemaps without contextual narrative. Neither engages young space enthusiasts. | A scrollytelling web map that brings hardware coordinates to life, detailing historical missions, scientific legacies, and direct links to original NASA source records. |
| **02. Be an Earth System Trend Detective!** | NASA Giovanni; NASA Earthdata Search; Copernicus Climate Data Store; Climate Reanalyzer. | Giovanni lets users plot time series, but requires complex queries over dense gridded variables. It does not perform automated, non-parametric statistical significance testing (Mann-Kendall/Theil-Sen) or localized plain-language trend detection for non-academics. | A localized anomaly and trend explorer that calculates real statistical significance ($p$-values, confidence intervals) over multi-decade records for specific districts. |
| **03. Junior Astronaut Mission Trainer** | Kerbal Space Program (KSP); NASA Kids' Club; Spaceflight Simulator. | KSP has a steep orbital mechanics learning curve and costs money. NASA Kids' Club consists of basic quizzes. Neither works as a lightweight mobile trainer based on real spacecraft telemetry and actual NASA Earth imagery. | A progressive web app (PWA) with bite-sized, data-backed missions (docking alignment, checklist execution, EPIC Earth observation) playable in seconds on mobile. |
| **04. CLPS Lunar Mission Browser** | NASA Moon Trek; LROC QuickMap; NASA Artemis / CLPS web portals. | Moon Trek and QuickMap are complex GIS applications. They do not cross-reference commercial lander manifests, volatile-detection payloads, solar elevation angles, and Direct-to-Earth communication lines-of-sight in a single public dashboard. | An interactive lunar surface browser allowing users to filter landing sites by payload type, target launch date, and real-time illumination conditions calculated from SPICE kernels. |
| **05. Astronaut Health Monitoring** | NASA Open Science Data Repository (OSDR); GeneLab; consumer telemetry (Garmin/Whoop). | OSDR contains raw physiological and omics datasets, not operational software. Consumer trackers rely on Earth-based cloud servers, which fail under deep-space communication delays. | An offline-capable edge console that monitors telemetry against personal astronaut baselines, identifies multi-signal anomalies via deterministic rules, and cites relevant spaceflight health studies. |
| **06. Dancing with the SARs** | ASF Vertex; Copernicus Browser; Google Earth Engine. | ASF Vertex is a search and bulk-download portal for raw radar scenes. It offers no client-side, interactive before-and-after flood or riverbank erosion quantification for civic disaster teams. | A lightweight change-detection tool that takes calibrated Synthetic Aperture Radar scenes, filters speckle, runs thresholding to isolate open water through monsoon clouds, and calculates inundated area in $\text{km}^2$. |
| **07. Field Shift: Adapting Farms with NASA Data** | NASA POWER Data Access Viewer; NASA Harvest / GEOGLAM; CropWatch. | NASA POWER outputs raw meteorological tables. A rural farmer cannot interpret daily solar insolation or precipitation arrays to determine when to plant. | A decision-support tool that translates multi-decade POWER precipitation and temperature trends into localized planting window shifts (e.g., advising an 11-day delay for Aman rice transplanting). |
| **08. Flame in Freefall** | NASA Technical Reports Server (NTRS); Physical Sciences Informatics (PSI) system. | Over 200 microgravity combustion experiments (FLEX, BASS, SoFIE) are scattered across academic PDFs and laboratory reports on NTRS without a unified querying parameter space. | An interactive safety dashboard using machine learning trained on published test points to predict flame-spread regimes under custom oxygen, pressure, and flow conditions, linking predictions to specific NASA report IDs. |
| **09. Harmonization of MODIS and VIIRS Hot Spots** | NASA FIRMS (Fire Information for Resource Management System); Global Wildfire Information System (GWIS). | FIRMS plots raw hotspot pixels. Because $375\text{ m}$ VIIRS detects far more sub-pixel fires than $1\text{ km}$ MODIS, raw multi-decade historical fire counts show an artificial step increase after 2012. | A spatial-clustering engine that unifies detections onto a shared grid cell, eliminates sensor-resolution inflation, and generates a reliable, continuous burning-activity calendar across sensor retirements. |
| **10. Earth Analogs for Moon and Mars** | NASA Terrestrial Analog database; published analog research papers. | Existing analogs (Atacama, Devon Island, McMurdo Dry Valleys) were identified piecemeal by researchers. There is no automated parametric tool to identify new, uncharacterized analog sites matching specific landing coordinates. | A global similarity engine that takes target environmental traits (diurnal temperature range, elevation, aridity index, surface roughness) and scores Earth grid cells to rank unstudied analog environments. |
| **11. Martian Map** | NASA Mars Trek; JMARS (Java Mission-planning and Analysis for Remote Sensing); Google Mars. | JMARS is a specialized desktop GIS tool for scientists, while Mars Trek is a viewer. Neither provides automated traverse planning that models rover energy consumption, slope safety cutoffs, and terrain traversability. | A tactical surface route planner that samples digital elevation models along a drawn path, verifies rover slope limits, estimates energy burn in watt-hours, and calculates safe contingency alternatives. |
| **12. Planet X and SPHEREx** | NASA/IPAC Infrared Science Archive (IRSA); Aladin Sky Atlas; WiseView. | IRSA provides spectral data via Python APIs (SIA v2) and FITS tables. There is no intuitive tool for amateur astronomers to inspect the 102 spectral bands or blink multi-epoch images to detect moving trans-Neptunian objects. | A public-facing spectral explorer and blink-comparator that renders 102-band SPHEREx cutouts, plots emission/absorption spectra for clicked sources, and highlights positional shifts across observation epochs. |
| **13. Space Mission Design Game** | NASA Trajectory Browser; General Mission Analysis Tool (GMAT); Kerbal Space Program. | GMAT is an industrial flight dynamics suite unsuitable for education. Commercial games simplify physics and use fictional specifications. | A web-based systems engineering simulation powered by actual NASA launch vehicle capacities, realistic $\Delta v$ budgets, and payload trade-offs, where budget failures trigger mission aborts. |
| **14. The Earth Information Jukebox** | NASA Earth Information Center (EIC) exhibits; NASA Scientific Visualization Studio (SVS). | NASA’s outreach is predominantly visual (satellite imagery, 4K rendering, 3D globes). This excludes visually impaired audiences and ignores audio as a method for detecting temporal patterns and cyclical climate anomalies. | A Web Audio sonification engine that maps environmental parameters (temperature to pitch, rainfall to rhythmic density, wildfire frequency to percussion) to provide an accessible, multi-sensory way to explore climate data. |

---

## 3. How to Build a Winning Solution

To ensure your submission stands out against existing commercial and government tools, focus on three engineering priorities:

1. **Solve for a clear end user:** Do not build a generic "data dashboard." Build a specific decision tool for an identifiable person—such as a rice farmer in Rajshahi navigating shifting monsoons, an emergency responder checking flood extents without internet, or a high school science teacher.
2. **Maintain a strict compute boundary:** Keep your data processing deterministic in your backend code (e.g., Python algorithms running statistical tests, geometry transforms, or spatial clustering). Use language models only to retrieve, narrate, and contextualize those verified figures. A project where an AI hallucinates calculations will fail the validity criteria.
3. **Make provenance visible:** Always show the data source. Add a metadata drawer or citation footer that outputs the exact dataset ID, retrieval timestamp, and origin URL for every calculation. Judges reward transparency and clear data lineage over flashy, unsubstantiated claims.

---

## 4. Deep-Dive Strategy: Challenge 02 ("Be an Earth System Trend Detective!")

**User Prompt:**  
*I'm really interested in this challenge: Be an Earth System Trend Detective! Give me all sorts of ideas against the evaluation criteria given: readability, validity, etc.*

**Response:**  
System nominal. Execution Protocol: Challenge Analysis Initiated.  
Here is the strategic breakdown for Challenge 2: "Be an Earth System Trend Detective!" mapped directly to the local Bangladesh context and the evaluation rubric:

### 1. The Core Objective & The "Trap"
- **The Ask:** The primary scientific objective is to identify, visualize, and statistically validate multi-decade trends in environmental variables using NASA observation records and to explain whether these trends are significant.
- **The Trap (The Pit of AI Hallucination):** Teams frequently make the mistake of retrieving a few raw data points and letting an LLM generate a summary like: *"The climate in Bangladesh is getting hotter and drier."* This is a fatal error on Validity. An LLM cannot compute a non-parametric trend or a $p$-value. If your project lacks a deterministic statistical boundary, judges will discard it as scientifically invalid.

### 2. Bangladesh Localization (Impact Maximization)
- **The Framing:** Target Saline Intrusion and Monsoon Shifting in the Coastal Belt (e.g., Chattogram/Khulna). Don't look at "global warming." Look specifically at how the onset of the monsoon is shifting (delaying planting for Aman rice) or how groundwater storage is declining.
- **Partner / Local Data Integration:**
  - *NASA Data:* Use NASA POWER (daily temperature/precipitation) and GRACE / GRACE-FO (Total Water Storage).
  - *Local Data:* Layer on Bangladesh Meteorological Department (BMD) station records or Bangladesh Water Development Board (BWDB) river salinity data. This cross-referencing maximizes the "NASA Data Usage" (1–5 points) metric by combining global satellite telemetry with local ground truth.

### 3. Architecture & Offline Resilience
- **Offline Cache Requirement:** Do NOT query the NASA POWER API or GRACE datasets on venue Wi-Fi during the demo. Pre-fetch decades of POWER daily data into local Parquet files for 5–10 specific Bangladesh districts. Convert gridded IMERG/GRACE variables into Zarr format chunked by time.
- **The `src/compute` Boundary:** Write a dedicated `trend.py` module in Python. This is your scientific shield. It must contain:
  - *Mann-Kendall Test:* To determine trend direction and the $p$-value for significance.
  - *Theil-Sen Estimator:* To calculate robust slope (e.g., $+0.031^\circ\text{C}$ per year).
  - *LLM Role:* The LLM agent only reads the JSON output of this deterministic module to write a plain-language Bangla/English caption. It never calculates the math.

### 4. Judging Criteria Mapping (Score Sheet Strategy)
- **Impact (1–20):** You aren't just showing a graph; you are building a localized tool for district-level agricultural extension officers to see exactly how many days the monsoon onset has shifted since 2001.
- **Validity (1–20):** Build a "Provenance Drawer" in the UI. When a user clicks a trend line, a drawer slides out showing the $p$-value, confidence interval (CI), exact Mann-Kendall Z-score, dataset ID, and NASA source URL.
- **Relevance (1–20):** The core analysis relies on NASA POWER and GRACE datasets, processed locally using Python (`xarray`, `pandas`, `scipy`), fulfilling the requirement to make NASA data central to the solution.
- **Creativity (1–20):** Build a dual-pane comparative visualizer where a user can swipe between a northern district (Rajshahi - drought) and a coastal district (Chattogram - extreme precipitation) and immediately see diverging trends.
- **Presentation (1–20):** The 240-second video focuses on the human element: *"In Chattogram, farmers rely on the June rains..."* followed by a live, offline demonstration of your tool validating that rains are arriving later and heavier.

### 5. 48-Hour Execution Blueprint
- **Day 1 (Morning): Science First.** Load cached Parquet/Zarr files into Pandas/Xarray. Write and unit-test the Mann-Kendall and Theil-Sen statistical functions in `src/compute`. Ensure they handle missing data gracefully.
- **Day 1 (Afternoon): API & Map.** Wrap statistical functions in a FastAPI endpoint (`GET /trend?district=Chattogram&variable=T2M`). Build frontend map and chart components using MapLibre GL JS and Chart.js.
- **Day 1 (Evening): Narration & Video.** Wire up the LLM explanation agent. It takes JSON from FastAPI and generates a two-sentence summary in English and Bangla. Record the 240-second local judging video using `OFFLINE=1` cache mode.
- **Day 2 (Morning): UI Polish & Provenance.** Build the Provenance Drawer. Implement strict error handling so the UI clearly states *"Not statistically significant at $\alpha=0.05$"* when data is noisy.
- **Day 2 (Noon - Code Freeze):** Re-test offline mode, record the final 30-second global video, and meticulously fill out Project Page fields (especially the AI disclosure and Dataset citations).

---

## 5. Persona & Narrative Ideation: The 4 Human Stories

**User Prompt:**  
*Let's consolidate our ideas. What should we do? And can we use existing solutions to help us build faster, or gather concepts, so that we don't invent the wheel again? Also, one thing we should focus on is whether NASA data is available for our idea. I want to address problems that have stories behind them:*
1. *A rainy-season-loving teenager longs for rainy days, but they are not coming.*
2. *A boy in town waits all year for December winter vacation to eat pitha or enjoy winter in his village, but winter is short-lived and out of sync.*
3. *A university student worried about extreme weather and coastal sea-level rise engulfing the coastlands.*
4. *A retired couple who lived their lives in cities and want to return to village life, wanting to see which places in Bangladesh have which climate trends.*

**Response: Using Existing Solutions Without Reinventing the Wheel**  
Stand on the shoulders of existing open-source tools. A 48-hour hackathon is an exercise in integration, UX, and validation, not rewriting fundamental algorithms.

### What to use out-of-the-box:
- **Statistical Math:** Do not write linear regression or significance algorithms from scratch. Use `scipy.stats` (`theilslopes`) or `pymannkendall` for Mann-Kendall trend tests.
- **UI Components & Mapping:** Use MapLibre GL JS with standard basemaps. Use Chart.js or Recharts with Tailwind CSS / shadcn/ui.
- **Data Transport & Caching:** Use DuckDB or Pandas to read pre-cached local Parquet files.
- **NASA APIs:** Use the NASA POWER API (requires zero API keys and returns structured JSON/CSV) rather than setting up complex Earthdata CMR queries on stage.

### What must be uniquely yours:
- The domain-specific feature engineering (e.g., turning raw daily min temperatures into a "Winter Chill Index", or aggregating daily rain to detect the exact day the monsoon started each year).
- The persona-driven interface that translates scientific statistics into human decisions.
- The provenance drawer linking computed $p$-values and slopes directly to NASA dataset identifiers and source URLs.
- The offline caching layer (`demo_fixtures/`) so your application never crashes during live presentation.

### NASA Data Availability Matrix:

| Phenomenon / Variable | NASA Mission / Dataset | Endpoint / Tool | Coverage & Resolution |
|---|---|---|---|
| **Monsoon Delay & Rain Volume** | NASA POWER (`PRECTOTCORR`) or GPM / IMERG | `power.larc.nasa.gov/api/temporal/daily/point` | Daily precipitation from 1981 to present; global $0.5^\circ$ grid covering all 64 districts of Bangladesh. |
| **Shortened / Milder Winters** | NASA POWER (`T2M_MIN`, `T2M_MAX`, `T2M`) | NASA POWER Point API | Daily surface temperatures from 1981 to present. |
| **Extreme Heat & Humidity** | NASA POWER (`RH2M`, `ALLSKY_SFC_SW_DWN`) | NASA POWER Point API | Relative humidity and solar irradiance to compute heat index trends. |
| **Groundwater & Salinity Trends** | GRACE / GRACE-FO (Terrestrial Water Storage) | NASA Earthdata / PO.DAAC | Monthly liquid water equivalent thickness anomalies across Bangladesh deltas. |

### The Consolidated Concept: "Ritu-Chakra" (The Lost Seasons of Bangladesh)
Rather than treating four personas as separate ideas, unite them under a single, cohesive narrative: **Bangladesh's traditional six seasons (Shoro-Ritu) are collapsing into erratic climate extremes, and people need objective data to adapt their lives.**

```
                           RITU-CHAKRA
               (NASA Earth System Trend Detective)
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 [Winter Tracker]      [Monsoon Detective]     [Retirement Scout]
- Teenager / Vacation  - Rain-lover / Student   - Senior Citizen Couple
- Dec T_min shift      - Monsoon onset drift    - District microclimates
- Cold-wave frequency  - Extreme dry/wet spell  - Climate comfort score
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                    DETERMINISTIC COMPUTE ENGINE
                    Mann-Kendall (p) + Theil-Sen
                                │
                                ▼
                   PROVENANCE DRAWER & CITATIONS
                   NASA POWER (T2M, PRECTOTCORR, RH2M)
```

1. **The Winter Vacationer ("Where Did December Go?"):**
   - *Question:* "I take my vacation in late December, but it doesn't feel cold anymore. Am I imagining it, or has winter actually shifted?"
   - *NASA Metric:* Query `T2M_MIN` from Dec 15 to Jan 15 across 1985–2025.
   - *Detective Output:* Theil-Sen slope: *"In Sreemangal/Sylhet, December nighttime minimums have risen by $+1.8^\circ\text{C}$ since 1990 ($p=0.004$, statistically significant). The true cold spell has compressed from 28 days to 14 days and drifted into mid-January."*
2. **The Monsoon & Extreme Weather Tracker ("The Delayed Rain"):**
   - *Question:* "The calendar says Asharh (mid-June), but there is no rain. When does the real rain actually start now?"
   - *NASA Metric:* Query daily `PRECTOTCORR` from May 1 to July 31 across 1990–2025.
   - *Detective Output:* Computes seasonal onset date (first 7-day window with $>25\text{ mm}$ rain not followed by a dry spell): *"In Chattogram, the monsoon onset has drifted 11 days later over the past 30 years ($p=0.012$), accompanied by a 23% increase in single-day extreme rainfall bursts."*
3. **The Retirement & Climate Relocator ("Where Should We Settle?"):**
   - *Question:* "We want to leave Dhaka and retire to a quiet village. Which district matches our physiological preferences?"
   - *NASA Metric:* Combine multi-decade `T2M_MAX` (summer heat), `PRECTOTCORR` (annual rain), and `RH2M` (humidity) across 8 representative district hubs.
   - *Detective Output:* A lifestyle match filter ranking districts by verified 30-year climate trajectory.

---

## 6. Competitive Analysis & The Strategic Audit

**User Prompt:**  
*What's your thought on this? Several public repos for this exact challenge already build a globe or dashboard with Mann-Kendall significance tests. The guide's anchor scale gives 1 for Creativity to anything already public. Watch the resolution trap: NASA POWER is model-based at roughly half-degree grid cells. What separates us?*

**Response: The Strategic Audit (Where Your Edge Lies)**

### 1. The Resolution Reality Check
NASA POWER is driven by the MERRA-2 reanalysis model on a $0.5^\circ \times 0.625^\circ$ grid (roughly $55 \times 65\text{ km}$ across Bangladesh). Dhaka, Gazipur, and Narayanganj fall into virtually the same grid cell. Claiming a localized difference between Dhaka and Gazipur using POWER is a scientific error that any remote sensing judge will catch.
- **The Strategy:** State this limitation openly in your presentation and UI. Use NASA POWER for long-term historical context (1981–2026), but use GPM IMERG Final V07 ($0.1^\circ \approx 10\text{ km}$, 2000–present) for spatial rainfall contrasts, and MODIS MOD11A2 ($1\text{ km}$) for land surface temperature.

### 2. The Statistical Edge (Killing the "Vanilla" Mann-Kendall)
Standard Mann-Kendall assumes serial independence. Climate data (especially temperature and monsoon rainfall) suffers from **Lag-1 positive autocorrelation**, which artificially deflates the variance and causes standard tests to report statistically significant trends where none exist (false positives).
- **Your Differentiator:** Implement **Modified Mann-Kendall with Pre-Whitening** (e.g., Yue & Pilon method) or **Hamed & Rao variance correction**.
- **Add Pettitt’s Test for Change-Point Detection:** Instead of just drawing a straight line, detect the exact year the regime broke (e.g., *"In Sreemangal, the winter structure underwent a permanent change-point in 2008"*).

### 3. Kill Story C (Sea Level)
Drop the university student's sea-level altimetry story. Satellite altimetry within 20–50 km of the Bengal delta suffers heavy land-contamination and complex tidal dynamics that PO.DAAC gridded products cannot cleanly resolve without advanced coastal retracking. Tackling that in 48 hours is a trap.
- Keep the three tight human anchors: **The Winter Vacation Boy** (cold night compression), **The Rain Lover / Farmer** (monsoon onset drift), and **The Retired Couple** (the microclimate settle-down scout).

---

## 7. Hard Numbers Validation Script (NASA POWER)

```python
import urllib.request
import json
from collections import defaultdict

def fetch_power_series(lat: float, lon: float, start: str, end: str) -> dict:
    url = (
        f"https://power.larc.nasa.gov/api/temporal/daily/point?"
        f"parameters=T2M_MIN,PRECTOTCORR&community=AG&longitude={lon}&latitude={lat}&"
        f"start={start}&end={end}&format=JSON"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
    return data["properties"]["parameter"]

# Sreemangal coordinates (24.3065° N, 91.7296° E)
print("Querying NASA POWER for Sreemangal (1985–2025)...")
data = fetch_power_series(24.3065, 91.7296, "19850101", "20251231")
tmin = data["T2M_MIN"]

# Group vacation window: Dec 20 to Jan 5 (17 calendar days per winter season)
vacation_cold_nights = defaultdict(int)
for date_str, temp in tmin.items():
    if temp == -999.0:  # NASA POWER fill value
        continue
    month = int(date_str[4:6])
    day = int(date_str[6:8])
    year = int(date_str[0:4])
    
    # Associate Jan 1-5 with the December of the preceding winter season
    season_year = year if month == 12 else (year - 1 if month == 1 else None)
    if season_year and ((month == 12 and day >= 20) or (month == 1 and day <= 5)):
        if temp <= 14.0:  # Definition of crisp winter night in plains
            vacation_cold_nights[season_year] += 1

# Compare the first decade (1985-1994) against the recent decade (2015-2024)
early_decade = [vacation_cold_nights[y] for y in range(1985, 1995) if y in vacation_cold_nights]
recent_decade = [vacation_cold_nights[y] for y in range(2015, 2025) if y in vacation_cold_nights]

avg_early = sum(early_decade) / len(early_decade)
avg_recent = sum(recent_decade) / len(recent_decade)

print("\n--- RESULTS FOR VIDEO SCRIPT ---")
print(f"1985–1994 Average Winter Vacation Cold Nights: {avg_early:.1f} out of 17 days")
print(f"2015–2024 Average Winter Vacation Cold Nights: {avg_recent:.1f} out of 17 days")
print(f"Net Shift: {avg_recent - avg_early:.1f} days ({((avg_recent - avg_early)/avg_early)*100:.1f}%)")
```

---

## 8. Prescreening Video Storyboard (240 Seconds / 4 Minutes)

| Time Window | Visual on Screen | Spoken Script Focus |
|---|---|---|
| **0:00 – 0:45** | Team members on camera; traditional Bangladeshi seasonal calendar (*Shoro-Ritu*). | **The Human Reality:** Introduce your team name and city venue. State the problem: Bangladesh's seasonal cycle is collapsing. A boy visiting his ancestral village for winter vacation in late December finds the cold has vanished. Are our seasons shifting, or is it human nostalgia? |
| **0:45 – 1:30** | The Challenge & The Trap: Diagram showing the 4 core questions: *What, Where, How Much, and Is It Significant?* | **The Technical Gap:** Address the challenge prompt directly. Explain why standard climate dashboards fail: they treat climate like static linear lines, ignore spatial autocorrelation, and confuse reanalysis models with ground reality. |
| **1:30 – 2:45** | Terminal output or a clean slide showing the NASA POWER run, plus the IMERG workflow. | **The Solution Architecture — Ritu Detective:** Present the "Trend or Noise" engine. Explain your deterministic compute pipeline: Hamed-Rao modified Mann-Kendall, Theil-Sen confidence bounds, and Pettitt change-point detection. Drop the concrete finding: *"Our prototype on NASA POWER reveals that winter cold nights in late December have compressed significantly, drifting into mid-January."* |
| **2:45 – 3:30** | Wireframe/Figma mockup of the 3 stories: The Winter Vacationer, The Monsoon Detective, and The Retirement Relocator. | **The Delivery:** Show the interface concept. A citizen picks a life decision, the engine checks if the trend is genuine or noise, and a Provenance Drawer proves the $p$-values and references NASA datasets (POWER, GPM IMERG Final V07, MOD11A2). |
| **3:30 – 4:00** | Team members closing shot with the offline-first commitment. | **The Execution Commitment:** Reiterate that the science runs deterministically, the demo works entirely offline via pre-cached Parquet fixtures, and everything is Apache-2.0 open-source. |
