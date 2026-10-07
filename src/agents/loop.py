"""Hritu Agent Orchestrator Loop.

Plain state machine: retrieve → compute → explain → display.
Hard 6-step cap. No CrewAI, no LangGraph.
No LLM call ever touches src/compute/.

Flow:
1. User selects a story lens + district
2. Orchestrator calls the appropriate compute tool
3. Compute tool returns a provenance-ready JSON
4. Orchestrator calls Claude to generate a 2-sentence caption
5. cite_check validates the caption
6. Result displayed in UI with Provenance Drawer
"""
import json
import os
import anthropic
from typing import Any

from src.compute import trend
from src.compute.lenses import winter, monsoon, coastal
from src.acquire import power as power_acquire

ANTHROPIC_CLIENT = anthropic.Anthropic()
MODEL = "claude-sonnet-4-6"
MAX_STEPS = 6  # hard cap — no runaway loops


# ── Tool Implementations ───────────────────────────────────────────────────────

def _cite_check(claims: list[dict]) -> dict:
    """Validate all claims have source_url and dataset_id."""
    for claim in claims:
        if not claim.get("source_url") or not claim.get("dataset_id"):
            return {"valid": False, "failed_claim": claim.get("text", "unknown")}
    return {"valid": True}


def _power_climate_query(lat: float, lon: float,
                          start: str = "19810101", end: str = "20261231",
                          parameters: str = "T2M_MIN,T2M_MAX,RH2M,PRECTOTCORR,WS50M_MAX") -> dict:
    """Fetch POWER data and return as dict."""
    import pandas as pd
    df, source = power_acquire.fetch_power_daily(lat, lon, start, end, parameters)
    return {"data": df.to_dict(), "source": source,
            "dataset_id": "NASA_POWER_AG_DAILY",
            "source_url": "https://power.larc.nasa.gov"}


def _winter_cold_day_trend(district: str, lat: float, lon: float,
                            cold_threshold_c: float = 14.0) -> dict:
    """Story 1: count cold days and run trend test."""
    import pandas as pd
    df, source = power_acquire.fetch_power_daily(lat, lon)
    result = winter.analyze_winter_trend(df, district=district,
                                         cold_threshold=cold_threshold_c)
    result["data_source"] = source
    return result


TOOLS: dict[str, Any] = {
    "power_climate_query":          _power_climate_query,
    "winter_cold_day_trend":        _winter_cold_day_trend,
    "cite_check":                   _cite_check,
    # TODO: wire up remaining story tools in lenses/
    # "monsoon_onset_trend":          _monsoon_onset_trend,
    # "district_climate_rank":        _district_climate_rank,
    # "dhaka_lst_nightlight_correlation": _dhaka_lst_nightlight_correlation,
    # "coastal_extreme_trend":        _coastal_extreme_trend,
}


# ── Explain Agent ──────────────────────────────────────────────────────────────

def _load_explain_prompt() -> str:
    """Load the explanation agent system prompt from file."""
    prompt_path = "src/agents/prompts/explain.md"
    try:
        with open(prompt_path) as f:
            return f.read()
    except FileNotFoundError:
        return "You translate JSON trend results into 2-sentence captions in English and Bangla. Never invent numbers."


def explain_result(trend_json: dict) -> dict:
    """Call the Explanation Agent to generate a caption from a trend result.

    Args:
        trend_json: The full_trend_report() output dict.

    Returns:
        Dict with 'english', 'bangla', and 'claims' keys.
        Output is blocked by cite_check if claims are missing provenance.
    """
    system_prompt = _load_explain_prompt()
    user_msg = f"Generate a caption for this trend result:\n\n```json\n{json.dumps(trend_json, indent=2)}\n```"

    r = ANTHROPIC_CLIENT.messages.create(
        model=MODEL,
        max_tokens=500,
        system=system_prompt,
        messages=[{"role": "user", "content": user_msg}],
    )

    raw = r.content[0].text.strip()
    # Extract JSON from the response
    try:
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()
        caption = json.loads(raw)
    except Exception:
        caption = {"english": raw, "bangla": "", "claims": []}

    return caption


# ── Orchestrator Loop ──────────────────────────────────────────────────────────

def _load_tools_spec() -> list[dict]:
    """Load tool schemas from tools.json."""
    with open("src/agents/tools.json") as f:
        return json.load(f)


def run(question: str) -> dict:
    """Run the agent loop for a user question.

    Args:
        question: User's question (e.g., "Is Rajshahi's winter disappearing?")

    Returns:
        Dict with 'answer', 'caption', 'provenance', and 'blocked' fields.
    """
    tools_spec = _load_tools_spec()
    messages = [{"role": "user", "content": question}]
    last_tool_result = None

    for step in range(MAX_STEPS):
        r = ANTHROPIC_CLIENT.messages.create(
            model=MODEL,
            max_tokens=1000,
            tools=tools_spec,
            messages=messages,
        )

        # Check if the model wants to use tools
        calls = [b for b in r.content if b.type == "tool_use"]

        if not calls:
            # Model is done — run the provenance gate
            if last_tool_result:
                caption = explain_result(last_tool_result)
                check = _cite_check(caption.get("claims", []))
                if not check["valid"]:
                    return {
                        "blocked": True,
                        "reason": f"Citation Required: claim '{check.get('failed_claim')}' has no dataset_id or source_url.",
                        "caption": None,
                        "provenance": last_tool_result,
                    }
                return {
                    "blocked": False,
                    "caption": caption,
                    "provenance": last_tool_result,
                    "answer": r.content[0].text if hasattr(r.content[0], "text") else "",
                }
            return {"blocked": False, "answer": r.content[0].text, "provenance": None, "caption": None}

        # Execute tool calls
        messages.append({"role": "assistant", "content": r.content})
        tool_results = []
        for call in calls:
            if call.name in TOOLS:
                result = TOOLS[call.name](**call.input)
                last_tool_result = result
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": json.dumps(result),
                })
            else:
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": json.dumps({"error": f"Unknown tool: {call.name}"}),
                })
        messages.append({"role": "user", "content": tool_results})

    return {
        "blocked": False,
        "error": "Step limit reached (6 steps). Showing last computed result.",
        "provenance": last_tool_result,
        "caption": None,
    }
