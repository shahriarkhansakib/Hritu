---
title: "Agentic design"
page_id: agents
group: "Shared build kit"
order: 6
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Agentic design

*Agents retrieve, orchestrate, explain and narrate. They do not compute.*

```
                        ORCHESTRATOR AGENT
                                │
        ┌───────────────┬───────┴────────┬────────────────┐
        ▼               ▼                ▼                ▼
   retrieval        analysis         narration        provenance
     agent            agent            agent             agent
  CMR · FIRMS    calls deterministic  captions and    blocks any claim
  POWER · PDS    compute tools only   explanations    without a source
        │               │                                  │
        ▼               ▼                                  ▼
   data tools    numpy · xarray · scipy            user-visible output
                 exposed as tools
```

## The boundary, stated plainly

**The model may**

- Choose which dataset answers a question
- Call tools and chain steps
- Summarise a result in Bangla or English
- Write the caption under a chart
- Draft the project page text

**The model may not**

- Compute a trend, a p-value or a slope
- Work out Sun or Earth geometry
- Choose a route or a path cost
- Score similarity between locations
- Invent a number that no tool returned

## Choosing a framework for a two-day build

| Option | Pick it when | Cost of being wrong |
|---|---|---|
| **Plain state machine or the Claude Agent SDK** | Your flow is retrieve, compute, explain. This is the default for a 48-hour hackathon: fewest moving parts, native MCP, lowest token burn. | Low. You can always add a graph later. |
| **LangGraph** | You need an explicit, checkpointed graph with a human-in-the-loop gate — for example a provenance check that must pass before output is shown. | Medium. More concepts to learn on the night. |
| **CrewAI** | You already know it and the project is narration-heavy with distinct roles. | Higher token cost. Independent 2026 benchmarks put CrewAI at roughly two to three times LangGraph's token use on comparable workflows, because handovers are decided by model calls rather than in code. |

Do not invent a framework on the weekend. For most teams here, a plain state machine plus one MCP server is the choice that finishes.

## Tool schemas

**src/agents/tools.json — retrieval, deterministic compute, and the gate**

```json
[
  {
    "name": "firms_area_query",
    "description": "Fetch active-fire detections for a bounding box and day range from NASA FIRMS.",
    "input_schema": {
      "type": "object",
      "properties": {
        "sensor": {"type": "string",
                   "enum": ["VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"]},
        "bbox": {"type": "string", "description": "west,south,east,north"},
        "days": {"type": "integer", "minimum": 1, "maximum": 10}
      },
      "required": ["sensor", "bbox", "days"]
    }
  },
  {
    "name": "trend_test",
    "description": "Deterministic Mann-Kendall test and Theil-Sen slope on a numeric series. The model must never compute this itself.",
    "input_schema": {
      "type": "object",
      "properties": {
        "values": {"type": "array", "items": {"type": "number"}},
        "dates":  {"type": "array", "items": {"type": "string"}}
      },
      "required": ["values", "dates"]
    }
  },
  {
    "name": "cite_check",
    "description": "Return true only if every numeric claim maps to a dataset id and a source URL.",
    "input_schema": {
      "type": "object",
      "properties": {
        "claims": {"type": "array", "items": {
          "type": "object",
          "properties": {
            "text": {"type": "string"},
            "source_url": {"type": "string"},
            "dataset_id": {"type": "string"}
          },
          "required": ["text", "source_url", "dataset_id"]
        }}
      },
      "required": ["claims"]
    }
  }
]
```

**src/compute/trend.py — the science, tested and outside the model**

```python
import numpy as np
from scipy import stats

def mann_kendall(values):
    """Returns S, Z, p-value and direction. No model involved."""
    x = np.asarray(values, dtype=float)
    n = len(x)
    s = sum(np.sign(x[j] - x[i]) for i in range(n - 1) for j in range(i + 1, n))
    var = n * (n - 1) * (2 * n + 5) / 18
    z = (s - np.sign(s)) / np.sqrt(var) if var > 0 else 0.0
    p = 2 * (1 - stats.norm.cdf(abs(z)))
    return {"S": float(s), "Z": float(z), "p_value": float(p),
            "direction": "increasing" if s > 0 else "decreasing" if s < 0 else "none",
            "significant_at_0.05": bool(p < 0.05)}

def theil_sen(dates_numeric, values):
    slope, intercept, lo, hi = stats.theilslopes(values, dates_numeric, 0.95)
    return {"slope_per_unit": float(slope), "intercept": float(intercept),
            "ci_low": float(lo), "ci_high": float(hi)}
```

## Stopping the model from making things up

1. Every number the model states must come out of a tool result object, never out of prose.
2. A provenance step runs `cite_check` and blocks any output with a claim missing a source URL and dataset id.
3. The interface has a provenance drawer that shows the raw tool JSON behind each figure. Open it during the demo — it takes ten seconds and it is worth points on validity.
4. Keep a small evaluation set of questions mapped to the tool call you expect, and grade tool-selection accuracy before you ship.

**src/agents/loop.py — the whole orchestrator, in one readable function**

```python
import json
from src.compute import trend
from src.acquire import safe

TOOLS = {"firms_area_query": ..., "trend_test": trend.mann_kendall}

def run(question, client, tools_spec):
    messages = [{"role": "user", "content": question}]
    for _ in range(6):                      # hard step cap: no runaway loops
        r = client.messages.create(model="claude-sonnet-4-6", max_tokens=1000,
                                   tools=tools_spec, messages=messages)
        calls = [b for b in r.content if b.type == "tool_use"]
        if not calls:
            return guard(r, messages)       # provenance gate before anything is shown
        messages.append({"role": "assistant", "content": r.content})
        results = [{"type": "tool_result", "tool_use_id": c.id,
                    "content": json.dumps(TOOLS[c.name](**c.input))} for c in calls]
        messages.append({"role": "user", "content": results})
    return {"error": "Step limit reached. Showing the last computed result."}

def guard(response, messages):
    """Every figure in the answer must trace to a tool result already in messages."""
    ...
```
