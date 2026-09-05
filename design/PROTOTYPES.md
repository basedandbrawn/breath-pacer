# Wind engine prototypes

`wind.html` is a working prototype of the pacer built to the brief in
`PROMPT-wind-engine.md`. One file, no build step, no web fonts, no CDN. It
ports the existing engine (audio clock, step timeline, two sound schemes,
wake lock, iOS media routing) and replaces the ring with a full-screen wind
that is the instrument. Open it in Safari on the phone; `?perf=1` shows a
frame-time overlay.

## The thesis it was built against

The pacer is used in peripheral vision: mid-set with a bar in your hands, or
half asleep. Peripheral vision cannot read a small ring or a word, but it is
very sensitive to large-area luminance change and coherent motion. So the
ground of the whole screen brightens as the lungs fill and dims as they empty
(lightness 3.5% to 27.5%), motion runs inward on the inhale and outward on the
exhale, and hue slides from cool to warm across the set. The word and count
are a caption for the moments you look straight at it.

## Two mechanisms and a floor

| Engine | Mechanism | Needs | Lines | Cost per frame | What breaks |
|---|---|---|---|---|---|
| **Field** | Real fluid on the GPU: advect, vorticity confinement, divergence, 12 Jacobi pressure passes, dye. The breath injects divergence; the hold injects nothing and the field settles on its own. The phase word is a no-slip obstacle. The output analyser feeds the force, so the audible gust is the visible gust. | WebGL2 with float render targets | 104 | 0.1 ms JS, 60 fps held on an iPhone at 128×227 | No float render target, context loss, or a frame budget over 13 ms for 3 s steps down to Memory with a stated reason |
| **Memory** | The wind is the session data. Deterministic seed from date and config. Each rep releases a debris particle that the field carries for the rest of the set; a sync tap's miss becomes turbulence; on rest the debris settles into a pile. Momentum from drag, no solver. | Nothing | 99 | 1 to 2.5 ms | Particle count halves under budget pressure |
| **Still** | Zero particles. The ground luminance ramp alone. | Nothing | 0 | 0.05 ms | Nothing. This is the floor: `prefers-reduced-motion` and low battery land here by default. A tapped engine overrides it. |

## Follow: entrainment without a sensor

Breathe · Follow leads the user from their own breathing rate down to 5.5
breaths a minute, the resonance frequency where heart rate variability peaks.
It needs one trustworthy reading of the user's current pace, and it gets it
from the input the app already has: the tap.

The session opens on a TAP screen. The user taps at the start of three
breaths in. The mean gap between taps is their period, clamped to 3 to 15
seconds, and the first cycle starts on the third tap. Each cycle after that
is built when the previous one starts, 45% in and 55% out, at a period that
moves 12% of the way toward 10.9 seconds (at most one second per cycle). The
meta line shows the live rate. A tap gap over 20 seconds resets the count, so
a false start costs nothing.

### Why not the microphone

The first version of Follow listened for the breath. It was cut after a
device test, for structural reasons rather than tuning:

- A breath at a phone a foot away is quiet, and iOS's voice pipeline strips
  exactly that kind of low broadband hiss even when the page asks it not to.
- Nose breathing under a bar is nearly silent. Mouth breathing under load is
  loud but chaotic.
- The mic cannot tell inhale from exhale. It hears rhythm only, needed about
  18 seconds of clean signal, and Follow changes the rhythm every cycle, so
  the app undermined its own estimator.
- Opening the mic on iOS can route output to the earpiece.

Three taps give the period exactly, with no permission and no noise, and
work with a bar in your hands. A later version could read the accelerometer
with the phone on the abdomen for lying-down sessions, which sees direction as
well as rhythm. That needs one motion permission tap on iOS.

## Acceptance tests from the brief

1. **Cover the word.** The phase is carried by ground luminance, motion
   direction, and hue. With the caption hidden the inhale is a brightening
   convergence, the hold is bright and settling, the exhale a dimming
   divergence. Verified visually in all engines, on a phone for Field.
2. **Cycle 1 vs cycle 8.** Memory: rep 1 is blue with one debris particle,
   rep 9 is amber with ten. Field: rep 2's exhale carries the dye left from
   rep 1. Verified by capture.
3. **Diff two frames.** Slot rectangles read from the DOM during IN and OUT
   in the same session are identical: meta 0,16,390,44; word 0,283,390,146;
   count 0,430,390,71; rail 0,501,390,36; footer 20,760,350,66; word size 117 px
   in both. Only the field and colour changed.
4. **Take away the animation.** The Still engine keeps the luminance ramp
   and paces correctly. The rungs above it add motion; they do not carry the
   pacing alone.

## Fallback ladder, verified

- No WebGL2: Field falls to Memory, note reads "Fell back to MEMORY (no WebGL2 float render)".
- `prefers-reduced-motion`: the default is Still with a note saying so. A tap on an engine overrides it and is remembered. This mattered on the first device test, where Reduce Motion was on and the original ladder silently vetoed the tap.
- A saved engine name that no longer exists resolves to Field.

## What to ship

Field as the default with Still as the floor, and Memory as the automatic
fallback rather than a user choice. Field is the only one where the hold is
legible for the right reason: air already in motion, slowing down, nothing
new entering. Measured on an iPhone at 60 fps with negligible CPU.

Cut from Field before shipping: the swirl term, the idle wind on the home
screen if it costs battery, and the engine picker once one wins. Keep Follow.

## Try it

- `wind.html` home screen, pick an engine, Lift or Breathe, Start.
- Breathe, pattern **Follow**, Start, then tap at the start of three breaths in.
- `wind.html?perf=1` frame-time overlay.
- `wind.html?eng=field|memory|still` forces an engine.
- `wind.html?auto=lift` starts a session on load (audio will be silent until a tap).
- Stats screen and the tune panel from `index.html` were left out of the prototype.
