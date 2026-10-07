# AGENTS.md — AI Orchestration Rules for Hritu

The system uses a **single LLM orchestration pattern**: The Explanation Agent.
Agents retrieve, orchestrate, explain, and narrate. They do NOT compute.

## What Agents May Do

- Choose which dataset answers a user's question
- Call tools (from `src/agents/tools.json`) and chain steps
- Summarize a deterministic result in plain English or Bangla
- Write the 2-sentence caption under a chart
- Draft the project page text
- Call `cite_check` and display the provenance drawer

## What Agents May NOT Do

- Compute a Mann-Kendall test, Theil-Sen slope, or p-value
- Work out any numerical comparison, percentage, or ratio
- Choose a path, route, or spatial weight
- Score similarity between districts
- Invent any number not present in a tool result object
- Extrapolate beyond what the data shows
- Diagnose causation (they may state correlation only)

## The Explanation Agent

**Input:** A strict JSON payload from `src/compute/trend.py`:
```json
{
  "trend": "increasing",
  "p_value": 0.012,
  "slope": 1.8,
  "slope_unit": "days/decade",
  "metric": "monsoon_onset_doy",
  "district": "Sylhet",
  "dataset_id": "GPM_3IMERGDF_07",
  "source_url": "https://gpm.nasa.gov/data/imerg",
  "period": "2000-2026"
}
```

**Task:** Generate a 2-sentence plain-language caption in English and Bangla.

**Restrictions:**
- May NOT extrapolate
- May NOT diagnose (no causation claims, only correlation)
- May NOT invent a number not present in the JSON
- Output is blocked from the UI if it fails `cite_check`

**Provenance Gate:** Every claim in the output must map to a `dataset_id` and `source_url` from the input JSON. The `cite_check` tool validates this before display.

## Orchestrator Loop (`src/agents/loop.py`)

- Hard step cap: 6 iterations maximum (no runaway loops)
- Framework: Plain state machine (retrieve → compute → explain → display)
- No CrewAI, no LangGraph (48-hour hackathon = fewest moving parts)
- One MCP server: `nasa_tools_mcp.py` (FIRMS, POWER, CMR)

## Tool Schemas (`src/agents/tools.json`)

Three tool classes:
1. **Retrieval tools** — call NASA APIs (FIRMS, POWER, CMR, IMERG, MODIS, VIIRS)
2. **Deterministic compute tools** — call `src/compute/trend.py` functions
3. **Provenance gate** — `cite_check` validates all claims before display

## Failure Handling

- If a tool fails: say so explicitly, show the cached value with its timestamp
- Do NOT estimate a missing number
- Do NOT smooth over a data gap — state it
- If `cite_check` fails: block the output and show a "Citation Required" warning

## Bangla Localization

When generating Bangla captions:
- Use standard Bengali script (not transliteration)
- Keep technical terms (Mann-Kendall, p-value, °C) in English within the Bangla sentence
- District names: use the official Bangla spelling
- Metric values: use Bengali numerals (০১২৩৪৫৬৭৮৯)
