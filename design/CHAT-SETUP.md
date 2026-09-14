# Chat setup: what to upload and what to say

The manifest for the Claude.ai project that works on this repo. Regenerate this
page whenever the file set or the state of the work changes.

State as of 2026-09-14: head is `4c707bb` (2026-09-09). Nothing has changed
since; files uploaded after that commit are current.

## Files to upload

| File | Size | Last changed | Why it goes up |
|---|---|---|---|
| `wind.html` | 95 KB, 1,173 lines | 2026-09-09 | The live line of work. Wind Bender: the fluid field, Drive/Squeeze, the tone ladder, Belly and Tap. Everything new lands here. |
| `design/PROTOTYPES.md` | 24 KB | 2026-09-09 | The design record. What was built, what was cut and why, the acceptance tests, the fallback ladder. Read this before proposing anything. |
| `index.html` | 47 KB, 1,062 lines | 2026-08-30 | The shipped v1, still titled "Breath". `wind.html` ported its engine — audio clock, step array, sound schemes, wake lock, iOS media routing — so it is the reference for anything the prototype inherited. |
| `design/PROMPT-wind-engine.md` | 7 KB | 2026-09-05 | The brief `wind.html` was built against: the peripheral-vision thesis, the hard constraints, how the work is judged. |

Leave out:

- `design/second-wind-directions.html` (48 KB) — the four rejected directions.
  Superseded by the brief's account of why they failed; the bytes buy nothing.
- `icon-*.png`, `manifest.webmanifest` — binary and trivial. The manifest is
  quoted in the instructions below instead.

## Project instructions

> This project is Wind Bender, a breath pacer PWA. Repo:
> `basedandbrawn/breath-pacer`, one file per app, no build step, no
> dependencies, no CDN, works offline, installs to the home screen. iOS Safari
> is the primary target.
>
> **Two apps.** `index.html` (1,062 lines, titled "Breath") is the shipped v1.
> `wind.html` (1,173 lines, titled "Wind Bender") is the current line of work
> and where every change goes unless I say otherwise. It ported v1's engine:
> the `nowSec()` audio clock that extrapolates through iOS context suspension,
> the flat `buildSteps()` phase array, the two sound schemes, wake lock, and
> the media-element routing hack. Do not rewrite any of that.
>
> `manifest.webmanifest` names the app "Wind Bender" but its `start_url` is
> still `./index.html`, so the installed icon launches v1. Ask before changing
> it.
>
> **The thesis.** The app is used mid-set with a bar in your hands, or lying in
> the dark. The user is not looking at the screen — they catch it in peripheral
> vision, which is blind to text and detail and exquisitely sensitive to
> large-area luminance change and coherent motion. So the whole screen is the
> instrument: the ground brightens as the lungs fill and dims as they empty,
> motion looms on the inhale and recedes on the exhale, hue slides cool across
> the set. The word and the count are a caption for the moments you look
> straight at it.
>
> **The layout constraint.** Switching between phases may change colour and may
> change the field, and may change nothing else. Fixed-height slots, tabular
> numerals with reserved width, hidden controls keep their slot via
> `visibility`, and the phase word is fitted once for the longest word on a
> visible offscreen span.
>
> **Modes.** Lift has two presets, decided by where the pause lives: Drive
> (in 3 · brace 1 · out 2) and Squeeze (in 2 · out 1 · squeeze 2). Breathe has
> RELAX (4 · 7 · 8) and COHERENT (5.5 · 5.5). The Lifting Cues page is the
> source of truth for timing; the app follows the page.
>
> **The ladder.** Field (WebGL2 fluid) is the engine. Memory (particles) and
> Still (luminance ramp only) are silent automatic catches, not choices.
> `prefers-reduced-motion` is deliberately ignored, because the motion is the
> pacing signal.
>
> **What was tried and cut, so don't re-propose it:** the microphone breath
> detector, the Follow entrainment pattern, Ears (five headphone spatial
> schemes), the isometric Lift preset, the chime and glide tones, the
> IN·HOLD·OUT rail. `PROTOTYPES.md` says why for each.
>
> **How to answer me.** Read `PROTOTYPES.md` before proposing anything. Give me
> working single-file code, not mockups — momentum, coupling and accumulation
> are the point and a mockup shows none of them. For anything new, state its
> cost: frame time, battery, permissions, lines. Say what you would cut.
> Prose in this project is plain and declarative; match `PROTOTYPES.md`.

## Open question for the next session

`manifest.webmanifest` carries the Wind Bender name with a v1 `start_url`. If
`wind.html` is now the app, that pointer and `index.html`'s `<title>` both need
to move, and v1 either becomes the file that ships or becomes dead weight.
