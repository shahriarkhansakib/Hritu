---
name: judging-ready-submission
description: Map the Hritu build to NASA project-page fields and the Bangladesh score sheet. Verify OSI license, AI disclosure, references, and public repository. Use before submitting the project.
license: Apache-2.0
---

# Judging-Ready Submission for Hritu

## Three Points You Cannot Lose (Do These First)

1. **Name the 2026 challenge** on the project page: "Be an Earth System Trend Detective!"
2. **Make the repository public** and test the link in a private/incognito browser window
3. **Submit the project page** before the deadline

These three cost 15 minutes and teams lose them constantly.

## Score Sheet — Hritu's Strategy

| Criterion | Points | Our Argument |
|---|---|---|
| Impact | 1–20 | 5 personal stories → real Bangladeshi decisions. Flood, heat, monsoon, agriculture, coastal safety. |
| Creativity | 1–20 | "Trend or Noise" verdict engine. Explicitly rejects false trends. Not just a line chart. |
| Validity | 1–20 | Modified Mann-Kendall (autocorrelation-corrected). Provenance Drawer. `src/compute/` boundary. |
| Relevance | 1–20 | 4 NASA datasets: POWER, IMERG, MODIS, VIIRS. Each named on camera. |
| Presentation | 1–20 | English + Bangla. Mobile PWA. 240-second narrative with a clear verdict moment. |
| Teamwork | 1–5 | Visible roles in commits. Use git blame to show contribution. |
| User Experience | 1–5 | Click → select district → see verdict. Anyone can use it without training. |
| NASA Data Usage | 1–5 | 4 NASA datasets + NASA GIBS basemap. All cited with IDs and URLs. |
| Challenge category | 0/1 | "Be an Earth System Trend Detective!" — stated on project page. |
| Repository access | 0/1 | Public GitHub, tested in private browser. |
| Page submitted | 0/1 | All fields filled before deadline. |
| Women bonus | +5% | Applied if team has ≥1 woman member. |

## Project Page — Field by Field

### High-Level Summary
"Hritu translates 40+ years of NASA climate data into 5 personal stories for Bangladeshi users — a teenager wondering where December's cold went, a farmer waiting for the monsoon, an elderly couple relocating from Dhaka's heat. Our deterministic statistical engine (Modified Mann-Kendall) answers the question: is this shift real or just noise? Built offline-first for hackathon venues with unreliable wifi."

Include: 240-second video link + GitHub link.

### NASA Data Sources Used
List each dataset:
1. NASA POWER Daily (T2M_MIN, T2M_MAX, RH2M, PRECTOTCORR, WS50M_MAX) — 1981–2026 — used for Stories 1, 3, 5
2. GPM IMERG Final V07 (GPM_3IMERGDF) — 2000–2026 — used for Story 2 monsoon onset
3. MODIS MOD11A2 v061 — 2000–2025 — used for Story 4 Dhaka LST
4. VIIRS VNP46A1 (Day/Night Band) — 2012–2026 — used for Story 4 nightlights
5. NASA GIBS WMTS — basemap across all stories

### Use of AI
Point to `docs/AI_USE.md`. Must include:
- Claude claude-sonnet-4-6 (Claude Code) for scaffolding
- Claude API (in-app explanation agent)
- What AI did and did NOT do
- All prompts referenced from `src/agents/prompts/`

## The Three Videos

| Deadline | Video | Content |
|---|---|---|
| 1 Oct, 11:59pm | 240-sec prescreening | Team names, challenge statement, concept (no working demo needed yet) |
| Day 1, 6:30pm | 240-sec local judging | Same + live demo + NASA datasets named out loud |
| 14 Nov, 12pm | 30-sec global | Team, problem, the thing working, NASA data, impact. English subtitles. |

## AI Disclosure Checklist (docs/AI_USE.md)

- [ ] Every AI tool named (Claude Code, Claude API)
- [ ] Prompts documented in `src/agents/prompts/`
- [ ] `src/compute/` functions identified as team's own work
- [ ] Dataset selection identified as team's own decision
- [ ] Statistical method choice (Modified MK) identified as team's own
- [ ] Interface design identified as team's own
