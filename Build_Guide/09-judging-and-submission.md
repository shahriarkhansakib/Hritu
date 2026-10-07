---
title: "Judging and submission"
page_id: judging
group: "Shared build kit"
order: 9
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Judging and submission

*Where the points are, and the three cheapest ones that teams still lose.*

## The score sheet

| Criterion | Points | What earns the top band |
|---|---|---|
| Impact | 1–20 | A major problem, a plausible path to scale, measurable outcomes. Bangladesh framing — flood, river erosion, agriculture, heat, air quality, fire — puts real numbers behind this. |
| Creativity | 1–20 | A bold idea or an unexpected connection. One surprising visual or interaction carries this. |
| Validity | 1–20 | Validated data and methods, a working prototype, tested usability. Your `src/compute` boundary and provenance drawer are the argument. |
| Relevance | 1–20 | NASA data central and used creatively, not merely cited. Name the dataset on camera. |
| Presentation | 1–20 | A clear beginning, middle and end in clear English, understood in 240 seconds by a global audience. |
| Teamwork | 1–5 | Genuine collaboration, visible in roles and commits. |
| User experience | 1–5 | Anyone can use it without training. |
| NASA data usage | 1–5 | NASA open data plus another agency or third-party source, clearly shown. |
| Challenge category named | 0 or 1 | State the 2026 challenge on the project page. |
| Repository access | 0 or 1 | The link opens for a stranger with no login. |
| Project page complete | 0 or 1 | Every field filled and the page submitted. |
| Women participation bonus | +5% | Applied to the aggregate for teams with one or more women members. |

> **Critical**
>
> **Secure the three single points first.** Category named, public repository, page submitted. They cost fifteen minutes and are the points teams most often throw away while polishing a feature nobody will see.

## The project page, field by field

| Field | What to put in it |
|---|---|
| High-Level Summary | The project name, what you built, who it helps, how it works. Include the 240-second video link and the GitHub link here. |
| Project Demo | The 30-second video. A seven-slide deck is NASA's accepted alternative, but the video travels further. |
| Final Project | The detail — repository, Figma, full documentation. |
| Project Details | Three blocks: the why, what and how with every dataset listed; community involvement and highlighted features; tools and technologies with credit given generously. |
| GitHub or Drive access | Open and public, no permission request. Test it in a private window before you submit. |
| Use of AI | Every AI tool named, the prompts and reasoning behind them, and the data the AI worked on. |
| NASA data sources used | Every NASA and partner dataset, what you used it for and how. Judges check this against your claims. |
| References | Every source, paper, dataset, library and asset you drew on. |

## Your three videos

- **1 Oct, 11:59pm:** **240-second prescreening.** Team name, every member by name, the problem and challenge statement, and the solution approach as a concept. Built from the summaries, because full statements do not land until 28 October.
- **Day one, 6:30pm:** **240-second local judging.** The same pitch with the demo dropped in and your NASA datasets named out loud on camera. Confirm the exact date with your Local Lead — the run of show and the form differ.
- **14 Nov, 12:00pm:** **30-second global.** Team, problem, the thing working, NASA data usage, impact. English subtitles required. This is all a NASA judge on the other side of the world will see.

## The AI disclosure

AI-generated content is allowed with conditions: you need a valid reason for using it, you must explain your prompts, and you must show where your own creative work went. Unexplained generated content is not acceptable and every generating tool must be named. The detailed submission and judging guides publish on 13 November 2026 — read them that morning and match their wording. Keep `docs/AI_USE.md` current as you build rather than writing it at midnight on Saturday.

**docs/AI_USE.md — keep it as you go**

```markdown
# Use of AI in this project

## Tools
- Claude (Sonnet 4.6) via Claude Code — scaffolding, refactoring, docstrings.
- Claude via the Anthropic API — the in-app explanation agent (see src/agents/).

## What the AI did
- Generated the first draft of src/api/routes.py and the MapLibre layer setup.
- Writes the plain-language caption under each chart at runtime, from tool
  results only. Prompts are in src/agents/prompts/.

## What the AI did not do
- All statistics in src/compute are ours, written and unit-tested by the team.
- The dataset selection, the harmonization method and the interface design are ours.

## Prompts
Full prompt texts: src/agents/prompts/*.md and docs/prompts_used.md.
```
