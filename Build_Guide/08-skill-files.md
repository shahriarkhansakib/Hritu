---
title: "Skill files"
page_id: skills
group: "Shared build kit"
order: 8
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Skill files

*SKILL.md, CLAUDE.md and AGENTS.md — ready to copy into your repository.*

A skill is a folder containing a `SKILL.md`: YAML frontmatter with a required `name` and `description`, optional `license`, `allowed-tools` and `metadata`, then a Markdown body. The folder name must match `name`. Only the name and description load at startup; the body loads when the skill activates and reference files load only when read, so keep the body short and push detail into reference files beside it.

**.claude/skills/space-apps-project/SKILL.md**

```markdown
---
name: space-apps-project
description: Scaffold and manage a NASA Space Apps 2026 project. Use when building any of the 14 challenges, wiring the offline-first data cache, or preparing the judging submission.
license: Apache-2.0
metadata:
  author: SpaceApps-Bangladesh
  version: "1.0"
---

# Space Apps 2026 project

## When to use
Any Space Apps 2026 build. Enforces offline-first caching, cited data, an OSI
license, no under-18 likeness, and AI-use disclosure.

## Steps
1. Create the repo with LICENSE (Apache-2.0), README, cache/, demo_fixtures/,
   src/{acquire,compute,agents,api}, web/, docs/AI_USE.md.
2. Wire data through the nasa-data-access skill. Write every response to cache/.
3. Keep deterministic science in src/compute. Agents orchestrate and explain only.
4. Before the demo, run with OFFLINE=1 and record a 240-second video.
5. Fill the NASA project page using the judging-ready-submission skill.

## Guardrails
- Cite every dataset with an id and a URL.
- Name every AI tool used and record the prompts in docs/AI_USE.md.
- The repository must be public and openly licensed.
```

**.claude/skills/nasa-data-access/SKILL.md**

```markdown
---
name: nasa-data-access
description: Access NASA and partner data — earthaccess, CMR, Harmony, FIRMS, POWER, api.nasa.gov, GIBS, ASF, IRSA, PDS, Treks, OSDR, NTRS, ADS — with caching and offline fallback. Use whenever the project needs NASA data.
allowed-tools: Read, Bash
license: Apache-2.0
---

# NASA data access

Use the verified endpoints in reference/endpoints.md and the working snippets in
reference/snippets.py. Do not invent base URLs.

## Rules
- Cache first: try live, fall back to cache, then to demo_fixtures.
- Never let a demo depend on the network. Support OFFLINE=1.
- Keys live in .env and are never committed. Commit .env.example only.
- Record the dataset id and source URL alongside every value you store.

## Status notes to repeat in the interface
- NISAR L-band products are PROVISIONAL, validated at a limited set of sites.
- SPHEREx current release is QR2 — cite DOI 10.26131/IRSA652.
- Suomi-NPP ends 1 November 2026. Prefer VIIRS on NOAA-20 and NOAA-21.
```

**.claude/skills/evidence-provenance/SKILL.md**

```markdown
---
name: evidence-provenance
description: Attach a dataset id and source URL to every numeric claim and validate citations before any agent output is shown to a user. Use whenever an agent explains or narrates a result.
allowed-tools: Read
license: Apache-2.0
---

# Evidence and provenance

Every stated number must originate from a tool-result object carrying source_url
and dataset_id. Run cite_check before display and block output when a claim has
no source. Render the raw tool JSON in a provenance drawer in the interface.

## Wording rules
- Report what was measured, not what it means: "rainfall declined 12 percent
  over 2001 to 2025, Mann-Kendall p = 0.01" rather than "the climate is drying".
- State the processing level and any provisional status.
- Never smooth over a gap in the record. Say the record has a gap.
```

**.claude/skills/judging-ready-submission/SKILL.md**

```markdown
---
name: judging-ready-submission
description: Map the build to the NASA project-page fields and the Bangladesh score sheet, and verify the OSI license, AI disclosure, references and public repository. Use before submitting.
license: Apache-2.0
---

# Judging-ready submission

Produce, in this order:
1. High-Level Summary — what it is, who it helps, how it works, with the
   240-second video link and the GitHub link.
2. Project Demo — the 30-second video for global judging.
3. Project Details — the why/what/how, community involvement, tools used.
4. GitHub or Drive access — public, tested in a private browser window.
5. Use of AI — every tool named, prompts explained, your own work shown.
6. NASA data sources used — each dataset, what it was used for, and how.
7. References — every source, paper, dataset, library and asset.

Then check score-sheet coverage: Impact, Creativity, Validity, Relevance and
Presentation at 1-20 each; Teamwork, User experience and NASA data usage at 1-5;
challenge category named, repository open, project page submitted at 0 or 1 each.
```

**Per-challenge skill — one folder each, this is the template**

```markdown
---
name: challenge-09-modis-viirs-harmonization
description: Build the MODIS and VIIRS hotspot harmonization project. Use for challenge 9 — reconcile cross-sensor fire detections and build a harmonized burning-activity calendar.
license: Apache-2.0
---

# Challenge 9 — Harmonization of MODIS and VIIRS hot spots

Ask: reconcile 1 km MODIS against 375 m VIIRS so that post-2012 detection counts
are not spuriously inflated by the finer sensor.

Data: FIRMS area API for MODIS and for VIIRS on NOAA-20 and NOAA-21.
Deterministic: spatial clustering of overlapping detections within ~5.5 km cells,
implemented in src/compute/harmonize.py.

Killer demo: toggle raw against harmonized over Bangladesh, 2003 to 2026, and
watch the false step change at the sensor transition disappear.

Cut when behind: one region, one year, static parquet, no live query.
```

**CLAUDE.md — repository root**

```markdown
# CLAUDE.md

This is a NASA Space Apps 2026 project built at a Bangladesh Local Event.

## Non-negotiables
- Offline-first. Read from cache/. Wrap live calls with a fixture fallback.
  Support OFFLINE=1.
- Deterministic science — statistics, geometry, routing, physics — lives in
  src/compute and is never performed by the model.
- Cite every dataset with an id and a URL.
- Record every AI tool and key prompt in docs/AI_USE.md.
- Apache-2.0 license. Public repository. No under-18 likenesses anywhere.

## Commands
- make cache   # pre-fetch every demo input
- make demo    # run the app with OFFLINE=1
- make test    # tool-selection evaluation and cite_check

## Style
- Python: type hints, small pure functions in src/compute, pytest for the science.
- Frontend: no build step you cannot rerun on a laptop with no internet.
```

**AGENTS.md — portable across agent tools**

```markdown
# AGENTS.md

Agents may: search catalogues (CMR, PDS, ADS, NTRS), fetch data (FIRMS, POWER,
earthaccess, ASF, IRSA), orchestrate steps, and explain or narrate results.

Agents may not: compute statistics, geometry, routing or physics themselves.
Call the functions in src/compute instead.

Every claim needs a source_url and a dataset_id, or the evidence-provenance
check blocks it. If a tool fails, say so and show the cached value with its
timestamp. Do not estimate a missing number.
```

> **Note**
>
> **Sharing skills with your team.** Commit `.claude/skills/` to the repository, or zip a skill folder and hand it over. The Agent Skills format is an open standard, so the same folder works across Claude, Codex, Copilot, Cursor, Gemini CLI and Goose.
