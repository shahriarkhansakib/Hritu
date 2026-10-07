---
title: "Challenge 05: Health Monitoring Software for Astronauts"
page_id: c05
group: "The 14 challenges"
challenge_number: 5
tags: ["Health & life support", "Intermediate"]
order: 15
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 05: Health Monitoring Software for Astronauts

**Tags:** Health & life support · Intermediate

## Brief

### What the challenge asks

Software that monitors, analyses and helps predict astronaut health on long missions, where a crew member is months from a hospital.

### The build

A crew health console: a vitals stream, deterministic anomaly detection against a personal baseline, and an explanation layer that says what changed, when, and which published study or dataset supports the interpretation.

> **Killer demo**
>
> The stream runs. A flag appears — heart rate variability down against this crew member's own thirty-day baseline — and the panel shows the deviation, the detection rule that fired, and the OSDR study behind the interpretation. Nothing is diagnosed; everything is evidenced.

### Where the points are

Validity, and the failure mode is obvious: a project that looks like a language model diagnosing a patient scores badly and deserves to. Detection is a tested rule in your code. The model only explains what the rule found and cites the literature.

## 48-hour plan

- **Before the event:** Cache OSDR study metadata and write a realistic vitals fixture — 600 rows, one per second, with a planted anomaly at a known index so you can rehearse the demo beat.
- **Day 1 morning:** Schema, replay websocket, and the console rendering live charts.
- **Day 1 afternoon:** Baseline computation and the detection rules, with tests. This is the science boundary — keep it in src/compute.
- **Day 1 evening:** Alert panel with the rule that fired and the evidence link. Record by 18:30.
- **Day 2 morning:** Explanation agent over tool results only, plus the crew-facing summary view.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Vitals fixture with a planted anomaly
- OSDR study metadata cached
- Detection rules drafted

**Cut in this order**

- Three signals instead of six
- Drop prediction, keep detection
- Drop the agent, keep rule text

## Data

- **NASA OSDR and GeneLab** — open spaceflight biology and human research data with study identifiers you can cite.
- **NTRS** — Human Research Program reports for the physiological context.
- **Simulated telemetry** — generate it yourself and label it clearly as simulated in the interface and the video. Simulated data that is honestly labelled costs you nothing; simulated data presented as real costs you everything.

**A detection rule, not a diagnosis**

```python
def hrv_deviation(series, baseline_days=30, threshold_sd=2.0):
    """Flags when HRV falls more than threshold_sd below the personal baseline.
    Returns the rule that fired and the numbers behind it. No interpretation."""
    base = series[-baseline_days:]
    mu, sd = base.mean(), base.std(ddof=1)
    current = series[-1]
    z = (current - mu) / sd if sd else 0.0
    return {"rule": "hrv_below_personal_baseline",
            "current": float(current), "baseline_mean": float(mu),
            "baseline_sd": float(sd), "z": float(z),
            "fired": bool(z <= -threshold_sd),
            "window_days": baseline_days}
```

## Architecture

```
vitals fixture ──► replay websocket
                        │
                        ▼
              src/compute/detect.py     ◄── tested rules, personal baseline
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
        live console          alert object
        charts + trend        rule + numbers
                                   │
                                   ▼
                        explanation agent
                     (reads alert + OSDR metadata,
                      cites study id, never diagnoses)
```

## Build prompt

**Paste into your coding agent**

```
Build a crew health monitoring console for long-duration missions.

Stream: FastAPI websocket replaying demo_fixtures/vitals.json at one row per
second, with a speed control. Signals: heart rate, HRV, SpO2, sleep hours,
core temperature, exercise minutes. Label the data as simulated in the UI.

Detection in src/compute: rolling personal baselines per signal, z-score
deviation rules, and a multi-signal rule that fires when two or more signals
deviate in the same 48-hour window. Unit-test each rule against a fixture with
a planted anomaly and against a clean fixture. No language model computes these.

Console: live charts with the baseline band drawn behind the current trace, an
alert list showing which rule fired and the exact numbers, and a crew-facing
summary in plain language.

Explanation agent: receives only the alert object plus cached OSDR study
metadata. It describes what deviated and cites a study id and URL. It must never
state a diagnosis or recommend treatment; enforce this in the system prompt and
in a post-check that blocks diagnostic language.

Apache-2.0, public repo, README stating clearly that telemetry is simulated.
```
