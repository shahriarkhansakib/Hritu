---
title: "Challenge 03: Build a Junior Astronaut Mission Trainer"
page_id: c03
group: "The 14 challenges"
challenge_number: 3
tags: ["Education & gamification", "Intermediate", "Youth"]
order: 13
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 03: Build a Junior Astronaut Mission Trainer

**Tags:** Education & gamification · Intermediate · Youth

## Brief

### What the challenge asks

An interactive, gamified training tool for young people who want to be astronauts — something that teaches by doing rather than by telling.

### The build

A browser trainer with three short missions: a pre-launch checklist under time pressure, a docking alignment game, and an Earth-observation task where the player identifies real features in NASA imagery. Badges at the end, and every fact traceable to a NASA source.

> **Killer demo**
>
> Hand a judge a phone. Within fifteen seconds they are flying a docking approach and failing it, then succeeding. No explanation needed, which is exactly what the user experience criterion is measuring.

### Where the points are

User experience and Presentation. The trap is that education projects score low on Relevance because NASA data ends up decorative — so make one mission genuinely depend on real imagery or real orbital numbers, and say which dataset it is on camera.

## 48-hour plan

- **Before the event:** Cache EPIC and APOD imagery, write the question bank, and sketch the three missions on paper. Game design on the night is what kills these projects.
- **Day 1 morning:** Core loop: start, play, score, retry. One mission working end to end.
- **Day 1 afternoon:** Second mission and the badge system. Test with someone who has never seen it.
- **Day 1 evening:** Third mission if time allows, sound, and the 240-second video by 18:30.
- **Day 2 morning:** Difficulty balancing, Bangla strings, touch targets, offline service worker.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Imagery cached and credited
- Question bank written
- Mission sketches agreed

**Cut in this order**

- Two missions, then one
- Drop sound
- Drop badges, keep the score

## Data

- **api.nasa.gov EPIC** — full-disc Earth images with real timestamps and positions, ideal for the observation mission.
- **api.nasa.gov APOD** — a daily image reward at the end of a mission.
- **NASA image library** — training and ISS photography for the checklist mission.
- **NTRS** — the source for any factual claim in the quiz.

> **Note**
>
> **Under-18 rule.** This is the challenge most likely to trip over it. No recognisable name, voice or likeness of anyone under 18 in your video or submission — which means do not film your youngest playtesters. Film hands, or film an adult.

## Architecture

```
cached NASA imagery + strings.json
                │
                ▼
      static PWA (service worker)
                │
    ┌───────────┼────────────┐
    ▼           ▼            ▼
 checklist   docking     observe Earth
  mission     mission      mission
    └───────────┼────────────┘
                ▼
         score + badges
        (localStorage, guarded)
```

Browser storage here is a per-player convenience, so wrap every read and write in try/catch and render correctly when it comes back empty.

## Build prompt

**Paste into your coding agent**

```
Build a mobile-first progressive web app that trains young people as junior
astronauts through three short missions.

Mission 1, pre-launch checklist: ordered steps under a timer, wrong order gives
a real explanation of what would have gone wrong.
Mission 2, docking: a canvas game aligning a spacecraft with an ISS port using
arrow keys or touch, with drift and a fuel budget.
Mission 3, Earth observation: show a cached NASA EPIC image and ask the player
to identify a feature, scored against the image metadata.

Everything loads from cached local assets through a service worker so it works
with no connection. Score and badges in localStorage, wrapped in try/catch, with
a sensible empty state. English and Bangla strings from strings.json.

Accessibility: 44px touch targets, keyboard playable, prefers-reduced-motion
respected, colour is never the only signal.

Credit every NASA image in an about screen with its source URL. Apache-2.0.
```
