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

## One engine, with a ladder under it

Field is the engine. There is no picker: the motion is the pacing signal, not
decoration, so the app does not fall back on the OS reduce-motion hint either.
Memory and Still exist only as automatic catches when the GPU cannot deliver.

| Engine | Mechanism | Needs | Lines | Cost per frame | What breaks |
|---|---|---|---|---|---|
| **Field** | Real fluid on the GPU: advect, vorticity confinement, divergence, 12 Jacobi pressure passes, dye. The breath injects divergence; the hold injects nothing and the field settles on its own. The phase word is a no-slip obstacle. The output analyser feeds the force, so the audible gust is the visible gust. | WebGL2 with float render targets | 104 | 0.1 ms JS, 60 fps held on an iPhone at 128×227 | No float render target, context loss, or a frame budget over 13 ms for 3 s steps down to Memory with a stated reason |
| **Memory** | The wind is the session data. Deterministic seed from date and config. Each rep releases a debris particle that the field carries for the rest of the set; a sync tap's miss becomes turbulence; on rest the debris settles into a pile. Momentum from drag, no solver. | Nothing | 99 | 1 to 2.5 ms | Automatic catch for no WebGL2, GPU context loss, low battery, or a blown frame budget. Particle count halves under budget pressure |
| **Still** | Zero particles. The ground luminance ramp alone. | Nothing | 0 | 0.05 ms | Nothing. The floor, reachable now only via `?eng=still`. |

## Follow: the breath mirror

Breathe · Follow leads the user from their own breathing rate down to 5.5
breaths a minute — 5.5 s in and 5.5 s out — near the resonance frequency where
heart rate variability peaks.
It needs one trustworthy reading of the current pace, and asking someone to
breathe normally while they are being measured does not give one: attending
to the breath changes it. So the reading is passive.

**Setup.** Lie down, phone on the belly just below the navel, screen up. Start
asks once for motion access (iOS prompts; Android and desktop do not).

**Sensing.** The phone tilts a degree or two with each breath. The gravity
vector is read at the sensor rate, the posture is removed with a 15 s
average, jitter and heartbeat with a 0.3 s average, and the axis with the
most breathing energy is chosen automatically. Turning points come from the
velocity with hysteresis and a 0.7 s minimum segment. Which turning point is
the inhale comes from the breath itself: at rest the exhale is the longer
half, so the shorter segment is IN. Verified in the harness with the tilt
polarity inverted, where the sign flips and the session still starts on an
inhale.

**Start.** The screen reads WAIT with a count of the inhale starts still
needed; the meta line reads PHONE ON YOUR BELLY, then BREATHING · x/MIN once
the rate is known, HOLD STILL when the phone is moving, and ON YOUR NEXT
BREATH IN once three starts are counted. The first cycle begins on the next
real inhale, so the pacer's first breath is yours. Each cycle is then built at
even halves and the period slides 12% per cycle toward 11 s, so the destination
is exactly the 5.5 · 5.5 pattern. The meta line shows the current half in
seconds, climbing toward 5.5.

**The mirror.** While the sensor sees you, the wind on the screen and the
breath noise in the sound are driven by your actual breath: the noise is
loud where your airflow is fast and silent at the turnarounds, brighter on
the inhale and darker on the exhale. The pad tone is the pacer, leading
slightly slower. You hear yourself and hear where to go.

**Sleep.** When the breathing stays slow and steady, at or under 12 a
minute, with no movement for four minutes, the sound fades over eight
seconds and the session ends by itself. The wake lock releases and the
screen sleeps on its own.

**Fallbacks.** Motion refused or absent: the tap flow (three taps at the
start of three breaths in). No breath found within 45 s: drops to taps. A
tap while sensing: taps, immediately. Everything works with the sensor off;
only the mirror is lost.

### Why not the microphone

The first version listened for the breath and was cut after a device test:
a breath at a phone a foot away is quiet, iOS strips low broadband hiss even
when asked not to, the mic cannot tell inhale from exhale, and Follow changed
the rhythm its own estimator depended on. Opening the mic on iOS can also
route output to the earpiece. The accelerometer sees direction as well as
rhythm, needs no quiet, and costs one permission tap.

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
- `prefers-reduced-motion`: deliberately ignored. Field runs regardless. Verified with the hint forced on: the engine reports `field` with no fallback reason.
- GPU context loss and a frame budget over 13 ms for 3 s both drop to Memory silently.

## What to ship

Shipped as described: Field only, no picker, Memory and Still as silent
catches. Field is the one where the hold is legible for the right reason —
air already in motion, slowing down, nothing new entering. Measured on an
iPhone at 60 fps with negligible CPU.

Still to cut from Field: the swirl term, and the idle wind on the home screen
if it costs battery.

## Try it

- `wind.html` home screen, Lift or Breathe, Start.
- Breathe, pattern **Follow**, Start, allow motion, phone on your belly. Or tap at the start of three breaths in.
- `wind.html?perf=1` frame-time overlay.
- `wind.html?eng=memory|still` forces a fallback engine, for testing.
- `wind.html?auto=lift` starts a session on load (audio will be silent until a tap).
- Stats screen and the tune panel from `index.html` were left out of the prototype.
