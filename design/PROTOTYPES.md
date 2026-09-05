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

## Three mechanisms, one floor

| Engine | Mechanism | Needs | Lines | JS per frame* | What breaks |
|---|---|---|---|---|---|
| **Field** | Real fluid on the GPU: advect, vorticity confinement, divergence, 12 Jacobi pressure passes, dye. The breath injects divergence; the hold injects nothing and the field settles on its own. The phase word is a no-slip obstacle. The output analyser feeds the force, so the audible gust is the visible gust. | WebGL2 with float render targets | 104 | 0.2 ms CPU; GPU cost unmeasured off-device | No float render target, context loss, or a frame budget over 13 ms for 3 s steps down to Memory with a stated reason |
| **Ear** | Listens. Tracks the breath band (120 to 1400 Hz) envelope against a running floor and peak, finds the user's rhythm by autocorrelation, and cross-correlates against the pacer's phase starts to measure drift. Drift becomes turbulence. Breathe · Follow starts each cycle at the user's own period and slides 12% per cycle toward 10.9 s (5.5 a minute). | Microphone permission | 55 + 2D field | 2 ms | Refusal shows MIC OFF, silence shows QUIET, the pacer keeps working. iOS routes output to the earpiece while the mic is open unless `play-and-record` behaves; must be tested on a device. Needs HTTPS for `getUserMedia`. |
| **Memory** | The wind is the session data. Deterministic seed from date and config. Each rep releases a debris particle that the field carries for the rest of the set; a sync tap's miss becomes turbulence; on rest the debris settles into a pile. Momentum from drag, no solver. | Nothing | 99 | 1 to 2.5 ms | Particle count halves under budget pressure |
| **Still** | Zero particles. The ground luminance ramp alone. | Nothing | 0 | 0.05 ms | Nothing. This is the floor: `prefers-reduced-motion` and low battery land here. |

\* Measured in headless Chromium with software GL on this machine, 390×844 at
2×. The Field number is JavaScript only; the shader cost needs a phone. Open
`wind.html?perf=1&eng=field` on an iPhone and read the overlay.

## Acceptance tests from the brief

1. **Cover the word.** The phase is carried by ground luminance, motion
   direction, and hue. With the caption hidden the inhale is a brightening
   convergence, the hold is bright and settling, the exhale a dimming
   divergence. Verified visually in all four engines.
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
- `prefers-reduced-motion`: any engine falls to Still with reason.
- No microphone device: Ear runs with the MIC OFF chip.
- Fake microphone: Ear reports on, detector runs, no errors.

## What I would ship, and what I would cut

Ship **Field** as the default with **Still** as the floor, and keep Memory as
the automatic fallback rather than a user choice. Field is the only one where
the hold is legible for the right reason: air already in motion, slowing down,
nothing new entering. Nothing else does that.

Cut from Field: the swirl term (turbulence is Ear's job), the idle wind on the
home screen if it costs battery on device, and the engine picker on the home
screen once one wins.

Keep **Ear** as an opt-in feature behind Breathe · Follow rather than as a
visual engine. Entrainment is the genuinely new capability here, and it does
not need its own wind. Two things must be proven on a device before it ships:
that the output still reaches the speaker while the mic is open on iOS, and
that the detector locks onto a real breath rather than room noise. The
autocorrelation needs 18 seconds of signal before it reports a rate.

## Try it

- `wind.html` home screen, pick an engine, Lift or Breathe, Start.
- `wind.html?perf=1` frame-time overlay.
- `wind.html?eng=field|ear|memory|still` forces an engine.
- `wind.html?auto=lift` starts a session on load (audio will be silent until a tap).
- Stats screen and the tune panel from `index.html` were left out of the prototype.
