---
title: "Challenge 14: The Earth Information Jukebox"
page_id: c14
group: "The 14 challenges"
challenge_number: 14
tags: ["Audio & multimodal Earth data", "Intermediate", "Youth"]
order: 24
event: "NASA International Space Apps Challenge 2026, Bangladesh"
source: https://claude.ai/code/artifact/b60a0c96-9c13-4fd5-9706-b31923e70aa1
---

# Challenge 14: The Earth Information Jukebox

**Tags:** Audio & multimodal Earth data · Intermediate · Youth

## Brief

### What the challenge asks

Turn Earth-observation and climate data into interactive audio. Sonification is not decoration — for a blind user it is the only way in, and for everyone else it finds patterns the eye skips over.

### The build

A jukebox of Earth data. Choose a variable and a place, and decades of NASA observations play as sound with a defensible mapping: value to pitch, variability to timbre, seasonality to rhythm. Layer several variables and Bangladesh's climate record becomes an ensemble.

> **Killer demo**
>
> Play Bangladesh 1985, then 2025, back to back. The pitch is audibly higher and the rhythm is audibly more erratic. Nobody needs the chart explained after that.

### Where the points are

Presentation, and the Art and Technology category globally. The risk is arbitrariness, so state the mapping explicitly — which value maps to which frequency, over which range — and let the listener see the chart scrub in time with the sound. Accessibility is the argument that makes this more than a gimmick: captions, a described-audio mode and keyboard control belong in the build, not in the write-up.

## 48-hour plan

- **Before the event:** Cache long POWER series for several locations and variables, and precompute the normalised arrays the audio engine will read. Audio must never wait on a fetch.
- **Day 1 morning:** Web Audio engine with one variable playing and a chart cursor moving in time with it.
- **Day 1 afternoon:** The mapping panel, with ranges shown, and the second and third variables layered.
- **Day 1 evening:** Decade A/B comparison and the export. Record by 18:30 — and mind the audio levels in the recording.
- **Day 2 morning:** Accessibility: captions, described mode, keyboard control, reduced motion. Test with the screen off.
- **Day 2 noon:** Freeze, record, submit.

**Pre-build**

- Normalised series as JSON in the web folder
- Mapping ranges chosen and documented
- Audio tested on a laptop speaker, not headphones

**Cut in this order**

- Two variables instead of six
- Drop the globe, keep the chart
- Drop export, keep playback

## Data

- **NASA POWER** — decades of daily temperature, rainfall and solar radiation for any point. Small files, no key, perfect for audio.
- **MODIS or VIIRS NDVI** — vegetation as a slower, seasonal voice.
- **FIRMS** — fire counts as percussion, which is genuinely the right mapping for a sparse event series.
- **GRACE and GRACE-FO** — water storage as a bass line beneath everything else.

**A mapping you can defend**

```
// Value to pitch across a stated range. Linear in value, exponential in
// frequency, because pitch perception is logarithmic.
const MAPPING = {
  T2M:        { lo: 10, hi: 40, fLo: 220, fHi: 880, voice: 'sine',
                label: 'Temperature 10-40C maps to 220-880Hz' },
  PRECTOTCORR:{ lo: 0,  hi: 60, param: 'rhythm',
                label: 'Daily rainfall 0-60mm maps to note density' }
};

function toFreq(value, m) {
  const t = Math.min(1, Math.max(0, (value - m.lo) / (m.hi - m.lo)));
  return m.fLo * Math.pow(m.fHi / m.fLo, t);   // equal musical steps
}
```

> **Note**
>
> **Show the mapping on screen.** A sonification whose rules are visible is science communication. One whose rules are hidden is a sound effect — and that difference is worth ten points on validity.

## Architecture

```
POWER · NDVI · FIRMS · GRACE
          │ (pre-event)
          ▼
 normalised series JSON in web/public
          │
          ▼
   Web Audio engine
  pitch · rhythm · timbre · gain
          │
  ┌───────┼────────┬──────────┐
  ▼       ▼        ▼          ▼
chart   mapping  A/B decade  captions
cursor   panel   compare    + described
                              mode
```

No backend at all. Static files plus Web Audio, which means it works offline, on a phone, and in a browser with no internet.

## Build prompt

**Paste into your coding agent**

```
Build a browser sonification jukebox for NASA Earth data.

Data: precomputed normalised series as JSON in web/public, one file per variable
per location, generated before the event from NASA POWER, NDVI, FIRMS and GRACE.
No network calls at runtime.

Audio: Web Audio API. Map temperature to pitch across a stated frequency range,
rainfall to note density, vegetation to a sustained harmonic voice, fire counts
to percussion, and water storage to a bass tone. Every mapping is defined in one
MAPPING object and rendered as human-readable text in the interface.

Playback: a transport with play, pause and speed; a time-series chart whose
cursor moves in sync with the audio; a layer mixer with a mute and gain control
per variable; and an A/B mode that plays two decades back to back.

Accessibility is a requirement, not an extra: live text captions describing what
is being heard, a described-audio mode that speaks the value at each year
boundary, full keyboard control, visible focus, and prefers-reduced-motion
respected. The experience must be usable with the screen off and usable with the
sound off.

Show the mapping rules and the data source for every variable on screen.
Apache-2.0, public repo, POWER and every other dataset cited with its URL.
```
