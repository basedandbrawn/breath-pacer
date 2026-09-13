# Design prompt: Wind Bender

Copy everything below the line into a fresh conversation with a design AI,
along with `design/SPEC.md` as an attachment. This document and the spec
together are the complete brief. Nothing outside them should be assumed.

---

You are designing the complete visual and interaction layer for an existing
app called **Wind Bender**. The functional specification is attached
(`SPEC.md`) and is ground truth: every screen, every state, every timing
value, every word the app can display, and the exact data your design will
be driven by are defined there. Read it in full before making any decision.
Where this prompt and the spec ever seem to disagree, the spec wins — this
prompt adds one creative direction and removes none of the spec's
requirements.

## What the app is, functionally

A breath pacer used in two situations: mid-set at the gym, holding a bar or
handles, not looking straight at the screen; and lying down or sitting,
running a fixed breathing pattern. The pacing itself — the timing, the audio,
the session logic — is already fully specified and is not yours to change.
Your job is everything the person sees and touches.

Pull the following directly from the spec; do not re-derive or guess them:

- The three screens (home, setup, run) and what must be true on each.
- The full vocabulary of words the run screen can show — the movement words,
  the breath words, the mode names — and the rule that the layout must not
  move as they change.
- The four lift modes and two breathing patterns, including the plain-
  language description of what each mode is and which lifts it's for.
- The **frame-state contract** (§11 of the spec): the exact set of numeric
  values — fill, flow, gust, amplitude, turbulence, pulse, rim, temperature,
  tap/pin position — that update every frame and that your animation must be
  driven by. This is the interface between the pacing engine and whatever
  you design; treat it as fixed, and build your visual language as a
  function of these numbers.
- The two sound options and what each phase of breath sounds like.
- The Belly and Tap interaction modes, and what a tap does in each context.
- The platform constraints (one HTML file, iOS Safari, installed to the
  home screen, must work offline, portrait only).
- The non-negotiable functional rules: peripheral-vision legibility, no
  layout shift between phases, the headline word sized once for the widest
  case, motion that is never disabled for reduce-motion (the motion *is*
  the pacer).

## The one creative direction

Everything about how this looks, sounds in visual metaphor, and feels to
use is entirely yours to invent, with a single constraint:

**The visual language should evoke the feeling of a wind-bending or
wind-breathing martial artist performing a technique** — a practitioner who
commands air as a physical, disciplined force, the way it appears in
wind-elemental bending fiction or breathing-technique swordsmanship fiction.
The breath in the app *is* the technique: each inhale and exhale should read
as a deliberate martial movement of air, not as ambient weather or a passive
backdrop.

That is the entire brief on look and feel. Interpret "wind bending /
wind breathing style" however you judge best — its intensity, its
stillness-versus-motion balance, whether it leans elegant or aggressive,
ancient or modern, minimal or elaborate, are all yours to decide. Do not
treat any of the following as implied by that one sentence unless you
independently decide they serve it:

- A specific era, culture, or fictional property to reference literally.
- A specific color, temperature, or number of colors.
- Any particular typeface, type scale, or type pairing.
- Any icon system, iconography, or symbolic motifs.

## What is explicitly not specified, and is yours alone

No part of this brief should be read as steering these. Decide them from
first principles, using only the spec's functional requirements as
constraints:

- **Color.** No palette, mood, temperature, contrast target, or number of
  hues is implied. Choose entirely on your own judgment, including whether
  color itself carries meaning in this design or is secondary to other
  cues.
- **Visual hierarchy.** What draws the eye first on each screen, how
  emphasis is distributed, and how the eye is meant to move are entirely
  open.
- **Information architecture.** How setup options are grouped, ordered, or
  disclosed; how the four lift modes and two breathing patterns are
  presented and chosen between; what's visible by default versus behind a
  tap — all open. The spec describes *what* must be choosable and *what*
  must be displayed, never *how* it's organized or grouped.
- **UI patterns and components.** Whether modes are cards, a list, tabs, a
  carousel, or something else; whether steppers, sliders, or another
  control sets reps and sets; whether there's chrome, a nav bar, gestures
  instead of buttons — open.
- **UX flow.** The path from opening the app to a running session, how many
    taps it takes, what's confirmed versus immediate, what onboarding (if
  any) exists — open.
- **Typography and layout system.** Grid, spacing, scale, alignment,
  density — open.
- **Sound-adjacent visual choices**, such as whether a waveform, meter, or
  any other audio-reactive element appears anywhere — open; the spec fixes
  what the audio *is*, not whether or how it is visualized.

If you find yourself unsure whether a decision falls under the one
creative direction above or under an open category, default to treating it
as open and make the call yourself rather than inferring intent.

## What to deliver

A complete design covering:

1. The home screen, the setup screen for both modes (Lift and Breathe), and
   the run screen in every state the spec defines (count-in, an active
   breath phase, a hold, rest, session end).
2. The full animation system driven by the frame-state contract — described
   precisely enough that it could be implemented against those exact
   variables — including what a hold looks like, what a tap or drag does
   visually, and how the wind-bending direction is expressed in motion, not
   only in static imagery.
3. Your reasoning for the choices in every category listed above as "yours
   alone" — a design is expected to have a clear point of view, not to
   avoid one.
4. Working, interactive prototypes where possible, not static mockups only
   — the spec's animation and state-based requirements can't be judged from
   a still image.
