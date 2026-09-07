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

## Three methods

The screen is the instrument, and the user is mostly not looking at it. So
the pacer couples to the body three other ways. They live in one card on
the Breathe setup, **Method**, and combine freely.

| Method | Setting | What it is | Needs |
|---|---|---|---|
| **Belly** | On by default | The phone on the abdomen reads the breath from the accelerometer. The wind and the breath noise become your actual breath; the tone is the pacer. | One motion-permission tap on iOS |
| **Tap** | Off by default | You drum the breath: tap once a second on the count through the inhale and the exhale, press and hold through the hold. Each tap is a real gust into the fluid at your fingertip. The pacer gives the beat as a tick and a pulse of light. | Nothing |
| **Ears** | Off by default | Spatial wind. Two voices around the head: a thin rising whistle that comes in from the left and climbs to the right ear, a low falling blow that sinks away behind. Eyes closed, you hear the breath. | Headphones |

Follow, the pattern that started at your own pace and led you down to 5.5 s,
is gone. It carried its own start screen, a three-tap calibration, a
sensing state with four prompts, dynamic cycle building and an automatic
sleep ending, and none of it was the pacer: it was a second product bolted
to the side. The two fixed patterns remain and every method works with both.

## Belly: the breath mirror

**Setup.** Method · Belly on (the default). Lie down, phone on the belly just
below the navel, screen up. Start asks once for motion access (iOS prompts;
Android and desktop do not). The tone paces the pattern; the wind on the
screen and the breath noise in the sound are your actual breath.

**Sensing.** The phone tilts a degree or two with each breath. The gravity
vector is read at the sensor rate, the posture is removed with a 15 s
average, jitter and heartbeat with a 0.3 s average, and the axis with the
most breathing energy is chosen automatically. Turning points come from the
velocity with hysteresis and a 0.7 s minimum segment. Which turning point is
the inhale comes from the breath itself: at rest the exhale is the longer
half, so the shorter segment is IN. Verified in the harness with the tilt
polarity inverted, where the sign flips and the session still starts on an
inhale.

**The mirror.** While the sensor sees you, the wind on the screen and the
breath noise in the sound are driven by your actual breath: the noise is
loud where your airflow is fast and silent at the turnarounds, brighter on
the inhale and darker on the exhale. The pad tone is the pacer. You hear
yourself against where you should be.

**Fallbacks.** Motion refused or absent: the session runs without the
mirror. Nothing else changes.

## Tap: drum the breath

Method · Tap on. The pacer counts; you play the count.

- **Inhale.** Tap once a second, on the count. Active phase, active hand.
- **Hold.** Press and hold. Breath held, finger held.
- **Exhale.** Tap once a second again.

Each tap pushes the wind: a real gust into the fluid at your fingertip, a
radial shove in the velocity field wide enough to cross a third of the
screen, a puff of dye at the finger and a ring thrown out from it, the
velocity ceiling lifted for the instant so the shove is not clipped, and a
flash of the whole ground. The poke rings down over about half a second.
The air moves because you moved it, and you can see that it did. A held finger pins the air under it: velocity is
damped in a small disc around the touch, and the field settles there
first. In the particle fallback the same two things happen to particles.

Taps never move the clock. The gap between your tap and the nearest beat
becomes turbulence, the same channel pace error has always used, and
nothing is scored or displayed. The layout does not move.

**The beat.** Because the phone cannot tap you back, the pacer gives the
beat two other ways. A soft tick (1480 Hz, 55 ms) at each second of an
active phase, scheduled with the same look-ahead as the breath sound so it
holds through dropped frames. And a pulse of light: the whole ground
blinks up a step at each beat and settles in a tenth of a second, which
peripheral vision catches. The hold has no beat; the finger just stays.

**The version that is out of reach.** The ideal form taps back: a tick you
feel at each beat, so you could do this with the phone face-down and eyes
shut, purely by touch. iOS Safari has no vibration API. `navigator.vibrate`
is Android-only, and the one iOS trick, a `<input type="checkbox" switch>`
that clicks when the user flips it, fires on the user's own gesture and
cannot be driven on a timer. So that version is blocked by the platform,
not by effort. If this method turns out to be the one used every night,
that is the first real argument in this project for a native app.

## Ears: spatial wind

Method · Ears on, headphones in. The sound scheme becomes the spatial wind
and the Sound row is disabled: the wind is the sound.

Three versions came before this: a voice on a circle round the head, two
sharper voices on the same circle, and a single axis from far in front
into the head. The one that matches what a breath feels like is a
straight line **through the head, front to back**: the air is drawn in at
the nose and travels to the back of the skull; it is held there; it leaves
the back of the skull, passes the nose and goes out in front.

- **Inhale.** Heard the instant the count starts, just in front of the
  nose, airy (top end 3.8 kHz). It rushes at the nostril (pitch centre up
  to 950 Hz over the first 30%) and then goes deeper and darker as it
  fills the back of the head: centre down to 420 Hz, top end down to
  1.3 kHz, level up to full. As it passes the nose it crossfades from the
  spatial path to a dry path in the middle of the head, so from there on
  it is inside you. Position: 1.4 m in front, nose, middle, back of the
  skull, slightly above the ears.
- **Hold.** A different kind of sound, not wind: a low hum, the noise
  through a narrow resonance at 120 Hz with the top shut at 500 Hz, held
  at the back of the skull inside the head, with a soft throb once a
  second from the second second on so the hold can be counted eyes shut.
  The drop from the full inhale into the hum marks the first second.
- **Exhale.** Full at once, from the back of the skull, still inside. It
  opens up as it passes the nose (centre up to 1.1 kHz, top end to 4.2 kHz,
  handed back to the spatial path between 12% and 35%), then goes out in
  front, falling to 220 Hz, closing to 650 Hz, fading to 5%, eight metres
  out by the end.

Every parameter starts a phase where the previous phase left it: level,
both filters, the head blend and the position are all ramped from their
current value, so the handoffs are continuous and the three phases are
one motion. The panner carries direction only; its distance law is off and
distance is done in the envelope. The voice is pink noise, soft at the top.
Position is scheduled with the same look-ahead as the envelopes, 26 linear
ramps per phase along the waypoints, with a per-frame fallback where the
params are missing. The output low-pass opens to 7 kHz for Ears. With
Belly on as well, your own airflow stays in the head as the mirror voice.

Ears is a Lift setting too, one Ears row under Sets. The rest breathing
between sets is the same in and out, so the count is in your ears under
the bar rather than on a screen across the gym.

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

## Evaluation after the third pass

What was removed: the Follow pattern with its WAIT and TAP screens, the
three-tap calibration, dynamic cycle building, the 45 s sensing timeout,
the sleep ending, the Sync and Inhale tap readings with the held-hold
splice. About 120 lines, four session-state fields, two step kinds, two
words in the word slot. What was added: one tap that only touches the
field, a beat, two Ears voices, three toggles.

**UI.** The Breathe setup is now Pattern and Cycles, then a Method card of
three rows with a name, one line of what it does, and an On/Off pill; then
Sound. The earlier three segmented controls with sub-lines were three
copies of the same widget for three yes/no questions. The row form reads
top to bottom as a list of what the pacer can do to you. When Ears is on
the Sound buttons dim and the reason is printed inside the Sound card,
not in a footer note. Nothing on the run screen moved: the meta line gains
"· TAP" or "· PRESS" in Tap mode, short enough to clear the End button at
390 px, and that is the only text change.

**UX.** The three methods now compose without special cases: Belly is a
sensor, Tap is a finger, Ears is a speaker, and the pacer is the same fixed
pattern under all of them. There is no mode where the app is waiting for
you, no calibration to get wrong, and no session that ends on its own.
The Tap beat is the weakest link and is honestly labelled as such above.

**Architecture.** The session is a flat step array again with nothing
spliced into it at run time; the only run-time mutations are Lift's
sync re-anchor and the rest skip. Touch is three numbers on the frame
state (a decaying poke, a pin) that both engines read; the audio graph
owns the beat. The mirror keeps its estimator but nothing drives the
timeline from it. Storage migrates a saved Follow pattern to 4 · 7 · 8 and
a saved Sync or Inhale to Tap on.

Still to do on a phone: the Ears level balance in real earbuds, the tick
level against the tone, and whether the ground pulse is visible in a lit
room.

## Try it

- `wind.html` home screen, Lift or Breathe, Start.
- Breathe, **Method** card: Belly, Tap, Ears. Each is one toggle. Any combination.
- `wind.html?perf=1` frame-time overlay.
- `wind.html?eng=memory|still` forces a fallback engine, for testing.
- `wind.html?auto=lift` starts a session on load (audio will be silent until a tap).
- Stats screen and the tune panel from `index.html` were left out of the prototype.
