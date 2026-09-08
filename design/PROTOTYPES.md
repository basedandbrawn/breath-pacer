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

## Lift: three presets, one per rep shape

The old split, compound, isolation, isometric, sorted lifts by taxonomy,
and two lifts in the same bucket could need opposite breathing. What
actually determines the breath is where the pause lives, and there are
only two answers, plus isometrics. Every cycle opens on IN.

| Preset | Sequence | Rep | Rest | Lifts |
|---|---|---|---|---|
| **Drive** | in 3 · brace 1 · out 2 | 6 s | 2:30 | Squats, presses, hinges, lunges, dips, push-ups |
| **Squeeze** | in 2 · out 1 · squeeze 2 | 5 s | 1:30 | Rows, pulls, curls, raises, extensions, calves, hip thrusts |
| **Hold** | in 3 · out 4, continuous | seconds | 1:00 | Planks, carries, wall sits, dead hangs |

Drive pauses full: inhale on the way down, brace at the bottom with the
air in, exhale through the drive. The bottom of a squat wants
intra-abdominal pressure, and the one-second brace kills the bounce out of
the hole. Squeeze pauses empty: inhale on the way down, exhale as you
lift, and the exhale finishes through the squeeze at the top. The top of
a curl needs no brace, and breath-holding on light high-rep work is the
thing to avoid. The two are mirror images, three in against two out and
two in against three out, and no phase exceeds three seconds.

One preset per shape was a deliberate choice over six. The three-second
lowering errs long on a bench press, which is a good hypertrophy
prescription, rather than short on a heavy squat, which is a rushed
eccentric. The two-second squeeze is the only length that works on every
lift in its family: one is too short for calves and glutes, three is too
long to hold a heavy row. The one named compromise is that pull-ups and
barbell rows would take a three-second lowering if they had their own
preset.

On the run screen the two pauses are the same still state as Breathe's
hold, a lit rim and a pulse each second, at opposite fills: BRACE is
bright and still, SQUEEZE is dark and still. The squeeze is a fourth slot
in the cycle and the timeline, the engine's old empty-lungs phase, which
is literally what it is. The words are IN, BRACE, OUT and IN, OUT,
SQUEEZE; SQUEEZE is now the widest word the fitter measures. Max-effort
work under six reps is out of scope on purpose: at that load the breath
is held for the whole rep and a pacer cannot help.

## Two methods

The screen is the instrument, and the user is mostly not looking at it. So
the pacer couples to the body two other ways. They are the **With** chips
on the Breathe setup, and combine freely.

| Method | Setting | What it is | Needs |
|---|---|---|---|
| **Belly** | On by default | The phone on the abdomen reads the breath from the accelerometer. The wind and the breath noise become your actual breath; the tone is the pacer. | One motion-permission tap on iOS |
| **Tap** | Off by default | You drum the breath: tap once a second on the count through the inhale and the exhale, press and hold through the hold. Each tap is a real gust into the fluid at your fingertip. The pacer gives the beat as a tick and a pulse of light. | Nothing |

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
beat in light: the whole ground blinks up a step at each second of an
active phase and settles in a tenth of a second, which peripheral vision
catches. An audible tick was tried and cut: it cluttered the breath sound.
The hold has no beat from Tap; the finger just stays, and the hold's own
pulse (below) counts it.

**The version that is out of reach.** The ideal form taps back: a tick you
feel at each beat, so you could do this with the phone face-down and eyes
shut, purely by touch. iOS Safari has no vibration API. `navigator.vibrate`
is Android-only, and the one iOS trick, a `<input type="checkbox" switch>`
that clicks when the user flips it, fires on the user's own gesture and
cannot be driven on a timer. So that version is blocked by the platform,
not by effort. If this method turns out to be the one used every night,
that is the first real argument in this project for a native app.

## Ears, tried and cut

Five versions of a headphone method were built and tested on the phone: a
voice on a circle round the head, two sharper voices on the circle, a
single front axis, a line through the head from the nose to the back of
the skull, and finally a stereo-width scheme with no panner and no room.
The last was the most legible, and the existing Breath sound still did
the job better: its own envelope, brighter in and darker out, already
carries the direction of the air, and it does so from the speaker with
no headphones. Ears is gone; an old Ears setting becomes Breath. The
lesson matches the one under the microphone below: a method that needs a
peripheral the pacer does not need is a second product.

## The picture: looming, dense, held, cool, alive

The screen used to carry the phase in one number, the ground lightness,
and the top of the inhale was therefore the brightest flat value: white.
The hold had no state of its own. Five changes, all inside the layout
constraint.

1. **Looming.** The field used to converge on the inhale. Air coming in is
   air coming toward you, and the strongest cue peripheral vision has is
   optic flow, so the inhale looms: the field expands from the centre
   toward you, dye born at the centre and carried outward. The exhale
   recedes: the field contracts and dye born at the edges is drawn to the
   centre and gone.
2. **Dense, not white.** Fill maps to density: lightness runs only to
   17.5% and saturation climbs with it, so full lungs are a deep,
   saturated field, with a luminous rim in the tint colour growing around
   the edge of the screen, which is where peripheral vision is looking.
3. **Held.** Still air: the fluid's momentum decays three and a half
   times faster in the hold, the field freezes with a shimmer, the rim
   stays lit, and from the second second on the whole screen pulses once
   a second, so the hold can be counted from the field alone.
4. **Cool.** The set used to run from blue to amber, which passes through
   teal and green in the middle and read as a lab. It now runs from deep
   blue (hue 222) to violet (hue 290): cool the whole way, the dye and the
   rim in periwinkle to lilac, the ground of the app a deep navy.
5. **Alive.** A curl-noise term, the curl of a slowly drifting value-noise
   field injected as force, gives the air wisps and eddies even at rest;
   the breath force is half again stronger with a higher velocity
   ceiling; vorticity confinement is up so eddies persist; the simulation
   is 160 wide instead of 128; dye clears faster so motion reads instead
   of mud, with a gentle contrast curve on it. The particle fallback has
   more particles and stronger curl. Still one fluid pass per frame.

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
field, a beat, two chips.

**UI.** Setup was three cards of toggles with a paragraph each, plus a
Sound card that went grey when Ears was on and a footer note in jargon,
and it read as overwhelming. It is now, in both modes, the thing you are
doing (preset or pattern, with reps and sets or cycles), then **Sound**,
one choice of two, Tone or Breath, shared by the app, then in
Breathe only **With**, two chips, Belly and Tap. Each row carries a single
short line. Nothing is disabled, nothing is duplicated between modes, and
there is no footer.

On the run screen the IN · HOLD · OUT rail, three words with one lit,
is replaced by a timeline: three thin segments in proportion to the
in, hold and out of the current cycle, the current one filling left to
right. It shows the shape of the breath and where you are in it without
a second set of words, and the hold segment simply is not there on
5.5 · 5.5. The phase word is smaller, 24% of the width capped at 15% of
the height, and it is now measured on a visible offscreen span: the old
fitter measured the hidden run screen, got zero, never scaled, and READY
ran off both edges of the phone. Nothing on the run screen moves between
phases.

**UX.** The tick under Tap in Breathe is gone. The two methods compose
without special cases: Belly is a sensor, Tap is a finger, and the pacer
is the same fixed pattern under both. There is no mode where the app is waiting for
you, no calibration to get wrong, and no session that ends on its own.
The Tap beat is the weakest link and is honestly labelled as such above.

**Architecture.** The session is a flat step array again with nothing
spliced into it at run time; the only run-time mutations are Lift's
sync re-anchor and the rest skip. Touch is three numbers on the frame
state (a decaying poke, a pin) that both engines read; the audio graph
owns the beat. The mirror keeps its estimator but nothing drives the
timeline from it. Storage migrates a saved Follow pattern to 4 · 7 · 8 and
a saved Sync or Inhale to Tap on.

Still to do on a phone: whether the ground pulse and the curl wisps read
in a lit room, and the frame time of the 160-wide simulation on an older
phone.

## Try it

- `wind.html` home screen, Lift or Breathe, Start. Lift: Drive, Squeeze or Hold.
- Breathe, **With** chips: Belly, Tap. Any combination. **Sound**: Tone or Breath, shared by both modes.
- `wind.html?perf=1` frame-time overlay.
- `wind.html?eng=memory|still` forces a fallback engine, for testing.
- `wind.html?auto=lift` starts a session on load (audio will be silent until a tap).
- Stats screen and the tune panel from `index.html` were left out of the prototype.
