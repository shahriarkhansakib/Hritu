---
title: "Challenge 13: Space Mission Design Game"
page_id: c13
group: "The 14 challenges"
challenge_number: 13
tags: ["Game development & engineering", "Intermediate", "Youth"]
order: 23
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 13: Space Mission Design Game

**Tags:** Game development & engineering · Intermediate · Youth

## Brief

### What the challenge asks

An educational game about planning, engineering and executing a space mission.

### The build

A mission design game where every choice costs something real. Pick a destination, a launch vehicle, instruments and a power system inside a mass, delta-v and budget envelope — and the game computes whether the design closes, then flies it and tells you what broke.

> **Killer demo**
>
> Add one more instrument. The mass budget goes red, the delta-v margin drops below zero, and the game says the launch vehicle can no longer deliver the spacecraft to the target. Remove the instrument and it closes with 4 percent margin. Engineering trade-offs become visible in two clicks.

### Where the points are

Creativity and User experience, with Validity earned by using real numbers. Real launch vehicle capacities and real instrument masses from NASA references turn a toy into a teaching tool, and they cost nothing but an afternoon of research done in advance.

## 48-hour plan

- **Before the event:** Compile the reference tables: launch vehicle capacity by destination, instrument masses and power draws, delta-v requirements between bodies, rough cost figures. Cite each row. This is the whole foundation.
- **Day 1 morning:** The budget engine — mass, power, delta-v, cost — with tests. Make it impossible to cheat.
- **Day 1 afternoon:** The design interface with live margins that go red when a budget breaks.
- **Day 1 evening:** The flight simulation and the outcome report. Record by 18:30.
- **Day 2 morning:** Three scenarios, scoring, and a post-mission explanation of what would have fixed it.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Reference tables with citations
- Delta-v map between bodies
- Three scenario briefs written

**Cut in this order**

- One scenario instead of three
- Drop the flight animation, keep the report
- Fixed instrument set, choose only the vehicle

## Data

- **NTRS** — systems engineering references, launch vehicle performance and instrument specifications, all citable.
- **api.nasa.gov and NASA mission pages** — real mission parameters to anchor each scenario.
- **SpiceyPy** — optional: compute a real transfer geometry for the chosen launch date instead of a lookup table.

**The budget engine — the game's entire honesty**

```python
def close_design(design, refs):
    """Does the design close? Returns every margin, not a verdict alone."""
    dry = sum(i["mass_kg"] for i in design["instruments"]) + design["bus_mass_kg"]
    prop = design["propellant_kg"]
    wet = dry + prop
    capacity = refs["vehicles"][design["vehicle"]]["capacity_kg"][design["destination"]]

    # Tsiolkovsky, with the stated engine
    import math
    isp = refs["engines"][design["engine"]]["isp_s"]
    dv_available = isp * 9.80665 * math.log(wet / dry)
    dv_required = refs["dv_map"][design["destination"]]

    power_need = sum(i["power_w"] for i in design["instruments"])
    power_have = design["solar_array_w"] * refs["solar_flux_factor"][design["destination"]]

    return {
      "mass": {"wet_kg": wet, "capacity_kg": capacity,
               "margin_pct": 100 * (capacity - wet) / capacity},
      "delta_v": {"available_m_s": dv_available, "required_m_s": dv_required,
                  "margin_pct": 100 * (dv_available - dv_required) / dv_required},
      "power": {"need_w": power_need, "have_w": power_have,
                "margin_pct": 100 * (power_have - power_need) / power_need},
      "cost": {"total_musd": design["cost_musd"], "cap_musd": design["budget_musd"]},
      "closes": all([wet <= capacity, dv_available >= dv_required,
                     power_have >= power_need,
                     design["cost_musd"] <= design["budget_musd"]])
    }
```

## Architecture

```
reference tables (cited)
  vehicles · instruments · dv map · engines
                │
                ▼
      src/compute/budget.py
   mass · delta-v · power · cost margins
                │
                ▼
        design interface
   live margin bars, red when broken
                │
                ▼
      flight simulation
   staged events, failures from margins
                │
                ▼
    post-mission report
  what broke, and what would have fixed it
```

## Build prompt

**Paste into your coding agent**

```
Build an educational space mission design game.

Reference data in data/refs.json: launch vehicles with capacity by destination,
engines with specific impulse, instruments with mass, power and science value, a
delta-v map between bodies, and a source_url for every row.

src/compute/budget.py: compute the wet and dry mass, available delta-v using the
rocket equation with the chosen engine, required delta-v for the destination,
power available against power needed with a solar-distance factor, and cost
against the budget cap. Return every margin as a percentage plus a single
"closes" boolean. Unit-test against a design known to close and one known to
fail on each budget in turn.

Game: choose destination, vehicle, engine, instruments, power system and
propellant load. Margin bars update on every change and turn red when a budget
breaks, with a message naming which one. When the design closes, run a staged
flight simulation whose failure probabilities are derived from the margins, and
produce a report saying what happened and which single change would most improve
it.

Three scenarios of increasing difficulty. A score combining science value,
margin and cost efficiency.

Every reference number is traceable to its source in an about screen.
Apache-2.0, public repo.
```
