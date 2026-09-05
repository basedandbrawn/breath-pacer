# Brief: build the wind engine

Use this as the prompt for the next design pass on the breath pacer.

---

## Prompt

You are designing and prototyping the next version of a breath pacer PWA. The
entire app is one file, `index.html`, roughly 1,000 lines, no build step, no
dependencies. Read it before you write anything. It already contains a lot of
hard-won engineering you must not throw away:

- A single timebase in `nowSec()` that follows the `AudioContext` clock and
  extrapolates with `performance.now()` when iOS suspends the context, so the
  pacer cannot freeze on screen.
- A phase array built by `buildSteps()`: every session is a flat list of
  `{kind, duration, stage, set, rep}` steps, and rendering reads the current
  step each frame. Phases are `in`, `hold`, `out`, `empty`, `getset`, `done`.
- Web Audio synthesis with two schemes, a 528 Hz pad and a filtered brown-noise
  breath, scheduled ahead of the visual with a 0.12 s lead.
- A media-element routing hack so iOS treats the session as media playback, plus
  wake lock, mediaSession handlers, and a resume path on `visibilitychange`.

The app is called **Breath**. It is being renamed so the word **WIND** is in the
name. Your job is to make the wind real.

### The failure mode to avoid

The last design round produced four directions: a streamline field, a windsock,
a variable-width wordmark, and an anemometer dial. All four were rejected, and
they deserved to be. Every one of them was a *picture of wind* playing on a loop
behind a countdown. The animation was decoration keyed to a timer. Swap the
picture and nothing about the app changes.

Do not produce another skin. Do not open with a metaphor and then illustrate it.

### The actual insight to design against

This app is used mid-set, out of breath, with a barbell in your hands, or lying
in the dark before sleep. In both cases the user is **not looking directly at
the screen**. They are catching it in peripheral vision, or through half-closed
eyes, or in a mirror across the gym.

Peripheral vision is nearly blind to detail and text. It is exquisitely
sensitive to large-area luminance change and to coherent motion. This is a
measurable property of the visual system, not a mood.

So the current design is backwards. It puts the pacing signal in a small ring
and a word at the center of the screen, which is exactly where peripheral vision
cannot read it, and it puts nothing in the large field, which is the only part
the user can actually perceive while working.

**The whole screen should be the instrument.** The wind is not the background.
The wind is the pacer, and the word and count are the caption underneath it, for
the moments the user does look straight at it.

### What "make the wind real" means

A real wind has properties an animation loop does not:

1. **Momentum.** Air that was pushed keeps moving after you stop pushing. This
   is what makes a hold legible: no new air is entering, but the room is still
   settling. A CSS keyframe cannot express this. A velocity field can.
2. **State that persists across phases and across the session.** Cycle 8 should
   not be pixel-identical to cycle 1. A real session accumulates.
3. **Obstacles.** Air deflects around things. If the word WIND is an obstacle
   in the field rather than a layer drawn on top of it, the identity stops being
   a logo and becomes a physical fact of the screen.
4. **Coupling to the user, not just to the clock.** Right now the app talks and
   the user obeys. Wind you cannot affect is a screensaver.

### Capability frontiers — pick and combine, do not attempt all four

**A. Solve the fluid.** WebGL2, fragment shaders, a real velocity field:
advection, divergence, a few Jacobi pressure iterations, vorticity confinement.
The breath phase injects force — inward divergence on the inhale, outward on the
exhale, nothing on the hold while the field decays on its own. Everything else
falls out of the physics. Budget it: this must hold 60 fps on an iPhone 12 and
survive a 20-minute session without cooking the battery. Measure, do not assume.

**B. Close the loop with the microphone.** `getUserMedia` plus an analyser can
detect the user's actual breath from the low-frequency envelope and spectral
centroid of the mic signal. Once the app can hear breathing, two things become
possible that no breath pacer on a phone does well: show the drift between
prescribed and actual pace as a property of the wind itself, and *entrain* —
start at the user's real rate and lead them down toward 5.5 breaths per minute,
the resonance frequency where heart rate variability peaks. The app already has
a coherent 5.5 mode; today it just demands that rate from a standing start.
Handle permission refusal and silence as first-class states, not errors.

**C. Drive sound and image from one generator.** The breath sound is already
synthesized brown noise through a bandpass. Feed the same envelope into the
force injection, so the gust you see and the gust you hear are the same event
rather than two things that happen to be in sync. The 0.12 s audio lead is
deliberate; respect it.

**D. Let the wind carry the data.** Turbulence encodes pace error. Color
temperature encodes position in the set. Whatever the field carries encodes rep
count. Not ornament keyed to data — the data is what makes the shape. Seed the
session deterministically from date and config so it is reproducible but never
twice the same.

### Hard constraints, all of them non-negotiable

- One file, no build step, no CDN, works offline, installs as a PWA.
- iOS Safari is the primary target. The audio clock, wake lock, and media-element
  routing must keep working. Test what happens when the context suspends.
- **The session layout must not move.** Switching between IN, HOLD and OUT may
  change color and may change the field, and may change nothing else. One font
  size for the phase word, fitted once for the longest word — today `fitWord()`
  refits per word, which is the bug. Fixed-height slots, tabular numerals with
  reserved width, all three phase labels always rendered, hidden controls keeping
  their slot via `visibility` rather than `display`.
- A degradation ladder, not a cliff: no WebGL2, `prefers-reduced-motion`, low
  battery, or a dropped frame budget each fall back to something that still paces
  correctly. The pacing is the product. The wind is how it is delivered.
- Legible in a bright gym at arm's length. Check contrast on the real thing.

### Deliverable

Working single-file prototypes, not static mockups. The whole point is momentum,
coupling and accumulation, and a mockup can show none of those. Three
directions at most, each built on a *different mechanism* rather than a different
palette. For each one, say what it costs: frame time, battery, permissions,
lines of code, and what breaks when it fails.

Then tell me which one you would ship, and what you would cut from it.

### How this will be judged

- Cover the word WIND and the phase labels. Can you still tell inhale from hold
  from exhale from six feet away, in peripheral vision? If not, it failed.
- Screenshot the same session at cycle 1 and cycle 8. If they are identical, the
  wind has no memory and it failed.
- Diff two frames from different phases. If anything but color and the field
  moved, the layout constraint failed.
- Take away the animation entirely. If the app is still usable, the animation was
  decoration and it failed.
