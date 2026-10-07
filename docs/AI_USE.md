# Use of AI in this Project

**Project:** Hritu: Trend or Noise? — NASA Space Apps Challenge 2026 Bangladesh
**Challenge:** Be an Earth System Trend Detective!

## AI Tools Used

### 1. Claude claude-sonnet-4-6 (via Antigravity / Claude Code)
- **Role:** Lead coding agent for project scaffolding, architecture decisions, code generation
- **Used for:**
  - Generating project folder structure and boilerplate files
  - Writing docstrings and type hints
  - Drafting README and submission text
  - Code review and refactoring suggestions
- **NOT used for:** Statistical computations (those are in `src/compute/`)

### 2. Claude API (claude-sonnet-4-6, in-app Explanation Agent)
- **Role:** The Explanation Agent (see `src/agents/loop.py`)
- **Used for:**
  - Translating computed trend JSON into 2-sentence plain-language captions
  - Generating English and Bangla explanations of statistical results
  - Narrating the "Trend or Noise" verdict
- **NOT used for:** Computing Mann-Kendall tests, slopes, or any statistics

## What the AI Did NOT Do

- All statistics in `src/compute/trend.py` are written and unit-tested by the team
- The Mann-Kendall modification choice (Hamed-Rao) is the team's scientific decision
- The 5 story lenses (Winter Vacationer, Rain-Lover, etc.) are the team's creative design
- Dataset selection (POWER, IMERG, MODIS, VIIRS) is the team's research decision
- The Bangladesh geographic framing and district selection are the team's decisions
- Interface design and UX are the team's creative work
- The cold-day threshold (14°C), monsoon onset algorithm, and extreme percentile (P95) are the team's scientific choices

## Prompts

Key prompt texts are stored in:
- `src/agents/prompts/explain.md` — the in-app Explanation Agent system prompt
- `docs/prompts_used.md` — all major prompts used during development (to be filled during hackathon)

## Reasoning

We used AI for productivity (boilerplate, documentation) and for the in-app narration feature. The science — the choice to use Modified Mann-Kendall, the monsoon onset algorithm, the cold day threshold of 14°C — is entirely the team's intellectual contribution and is independently unit-tested in `src/compute/tests/`.
