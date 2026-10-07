---
title: "Challenge 01: Abandoned but not Forgotten"
page_id: c01
group: "The 14 challenges"
challenge_number: 1
tags: ["Storytelling & space exploration", "Intermediate", "Youth"]
order: 11
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 01: Abandoned but not Forgotten

**Tags:** Storytelling & space exploration · Intermediate · Youth

## Brief

### What the challenge asks

Build a creative narrative that brings to life the equipment NASA has left behind on the Moon and Mars. Descent stages, retired rovers, jettisoned heat shields, landers that went quiet — hardware that stopped working but did not stop meaning something.

### The build

An interactive map and timeline of discarded NASA hardware, on real Moon and Mars basemaps, where every object carries its mission, its last contact, its coordinates and a citation. Not a slideshow about abandoned robots: a map you can fly around, where the provenance is visible next to the story.

> **Killer demo**
>
> Click a point on the lunar surface. The Apollo 11 descent stage opens with its coordinates, its final photograph, the date contact ended, and a one-line link back to the NASA source it came from.

### Where the points are

This is a storytelling challenge, so Presentation and Creativity carry it. Protect Relevance by making the NASA source visible for every object rather than letting the narrative float free of the data. A Bangla language toggle is a cheap, honest win on user experience and reach.

## 48-hour plan

- **Before the event:** Curate the object list offline: name, mission, coordinates, end date, image URL, source URL. Twenty objects is plenty. Cache Moon and Mars basemap tiles to PMTiles.
- **Day 1 morning:** Lock the data model and load the GeoJSON. Get a Moon basemap rendering with markers by lunch — that single screenshot de-risks the whole weekend.
- **Day 1 afternoon:** Build the object panel and the timeline scrubber. Wire the 11:30 mentor round around your narrative structure, not your code.
- **Day 1 evening:** Write three to five objects in full, with real copy. Record the 240-second local judging video by 18:30.
- **Day 2 morning:** Polish transitions, add the Bangla toggle, test on a phone. Fill the project page while you still have energy.
- **Day 2 noon:** Freeze. Record the 30-second global video, push the repository, submit.

**Pre-build before you travel**

- Curated object GeoJSON with citations
- Moon and Mars tiles as PMTiles
- Images downloaded locally, credited

**Cut in this order**

- Fewer objects, told better
- Timeline becomes a static list
- Moon only, drop Mars
- Static basemap image instead of tiles

## Data

- **NASA Solar System Treks** — Moon Trek and Mars Trek WMTS tiles for the basemap. No authentication.
- **api.nasa.gov** — Mars Rover Photos for rover imagery, APOD for hero images.
- **PDS Search API and NSSDCA** — mission and spacecraft metadata with stable identifiers.
- **NTRS** — mission reports for the dates and the science each object enabled.

**One object record — every field earns its place**

```json
{
  "id": "apollo11-lm-descent",
  "name": "Eagle descent stage",
  "mission": "Apollo 11",
  "body": "moon",
  "lat": 0.67408, "lon": 23.47297,
  "left_behind": "1969-07-21",
  "last_contact": "1969-07-21",
  "why_left": "The ascent stage used it as a launch platform and lifted off without it.",
  "science_enabled": "Passive seismic and laser ranging experiments deployed beside it.",
  "image": "local/apollo11_lm.jpg",
  "image_credit": "NASA",
  "source_url": "https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C",
  "dataset_id": "NSSDCA 1969-059C"
}
```

## Architecture

```
curated objects.geojson  ──┐
Treks WMTS tiles ──► PMTiles │
NASA images ──► local/       │
                             ▼
                     static web app
                  MapLibre + timeline
                             │
                   ┌─────────┴─────────┐
                   ▼                   ▼
             object panel         citation line
           story, image, date     source + dataset id
```

No backend. The whole thing is static files, which means it deploys anywhere, loads on a weak connection, and cannot fail because a server did not start.

## Build prompt

**Paste into your coding agent**

```
Build a static scrollytelling web app about NASA hardware left behind on the
Moon and Mars.

Data: a curated GeoJSON at data/objects.geojson where each feature has name,
mission, body, lat, lon, left_behind, last_contact, why_left, science_enabled,
image (a local path), image_credit, source_url and dataset_id.

Map: MapLibre GL with a local PMTiles basemap for each body, switched by a
Moon/Mars toggle. Markers for every object; clicking one opens a side panel with
the story, the local image with its credit, and a visible citation line showing
source_url and dataset_id.

Add a timeline scrubber that filters objects by the year they were left behind.
Add an English/Bangla language toggle reading from data/strings.json.

Constraints: no build step that needs the internet; every asset local; keyboard
accessible; works at 360px wide; respects prefers-reduced-motion; Apache-2.0
LICENSE; README listing every NASA source used.
```
