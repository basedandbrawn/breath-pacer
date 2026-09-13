# Wind Bender — functional specification

A complete description of what the app *does*, written so that a developer
who has never seen it can rebuild it from this document alone.

**Scope.** This is the functional spec: timing, audio synthesis, the session
engine, sensors, storage, platform workarounds, and the data contract the
animation consumes. It deliberately contains **no colours, no typography, no
layout and no styling**. Wherever the real app makes a visual choice, this
document names the *quantity* the visual is driven by and stops there. A
separate design document owns the look.

Everything below is normative unless marked "rationale" or "history".

---

## 1. What the app is

A breath pacer for two situations:

- **Lift.** A lifter mid-set, holding a bar or handles, not looking straight
  at the screen. The app tells them what the body does next and what the air
  is doing while it happens.
- **Breathe.** A person lying down or sitting, running a fixed breathing
  pattern for a number of cycles.

The product is the **pacing**. Sound and animation are two deliveries of the
same clock, and the app must still pace correctly if either is degraded or
absent.

Two rules govern every decision in the Lift mode:

1. **The headline word is the movement, never the breath.** Under load a
   lifter cannot hold a vocabulary. The words are LOWER, LIFT and HOLD, plus
   READY before a set. What the air is doing is a secondary line underneath.
2. **One breath is one continuous sound,** even when it spans two movements.
   A pull and the squeeze after it are one exhale; the audio must not restart
   or drop between them.

---

## 2. Platform contract

| Requirement | Value |
|---|---|
| Delivery | One self-contained HTML file. No build step, no bundler, no dependencies, no CDN, no network request at runtime. |
| Primary target | iOS Safari on a phone, installed to the home screen. |
| Secondary | Any modern browser. |
| Offline | Must run with no connection. (A service worker is optional and not currently present; see §16.) |
| Install | Web app manifest, `display: standalone`, portrait, plus the Apple meta tags for standalone mode, status bar style, home-screen title and touch icon. |
| Persistence | `localStorage` only. No account, no server, no analytics. |
| Orientation | Portrait only. |

The app must survive: the screen locking mid-session, the tab being
backgrounded and restored, the audio context being suspended by the OS,
the GPU context being lost, and Low Power Mode capping the frame rate at 30.

---

## 3. The timebase

Everything is scheduled against one function. Getting this wrong is the
single most common way to break the app.

```
nowSec():
  p = performance.now() / 1000
  if an AudioContext exists:
    c = ctx.currentTime
    if c > lastCtxT:                 # the audio clock is advancing
      lastCtxT = c; lastPerfT = p
      return c
    return lastCtxT + (p - lastPerfT)  # suspended: extrapolate
  return p
```

**Rationale.** The `AudioContext` clock is the only clock that agrees with
scheduled audio, so the visible count must follow it. But iOS freezes
`currentTime` when it suspends the context, and a frozen clock freezes the
pacer on screen. So: follow the audio clock while it moves, and extrapolate
from wall time when it stalls, re-syncing the moment it resumes.

A helper converts a `nowSec` timestamp into an audio-context timestamp for
scheduling:

```
toCtx(t) = ctx.currentTime + max(0, t - nowSec())
```

---

## 4. The session model

A session is a **flat, immutable-at-build array of steps**. Nothing is
spliced in at run time except the two explicit edits in §4.6.

### 4.1 The step record

```
{ k:     phase kind   — "in" | "hold" | "out" | "empty" | "getset" | "done"
  dur:   seconds (float)
  stage: "getset" | "set" | "rest" | "done"
  set:   1-based set number (0 for done)
  rep:   1-based rep/cycle number (0 outside a rep)
  mv:    movement word for this step, "" when not applicable }
```

`stage` answers "where in the session", `k` answers "what the air is doing",
`mv` answers "what the body does". They are independent on purpose: in the
Heavy mode a single held breath (`k = "hold"`) spans two different movements
(`mv = "LOWER"` then `mv = "LIFT"`).

### 4.2 Phase kinds

| `k` | Meaning | Lungs | Notes |
|---|---|---|---|
| `in` | Breathing in | filling | |
| `out` | Breathing out | emptying | |
| `hold` | Breath held, air in | full | |
| `empty` | Still breathing out, at the end of the exhale | empty | Distinct from `hold`: air is still leaving |
| `getset` | Count-in before a set | ~empty | 3 s, treated as a breath in |
| `done` | Terminal sentinel | — | `dur = 1e9` |

### 4.3 Building a Lift session

```
for each set s in 1..sets:
    push { k:"getset", dur:3, stage:"getset", set:s, rep:0 }
    for each rep r in 1..reps:
        push every [k, dur, mv] of the chosen mode's sequence,
            with stage:"set", set:s, rep:r
    if s < sets:
        push the rest block for set s      (§4.5)
push { k:"done", dur:1e9, stage:"done" }
```

Steps with `dur <= 0` are skipped at push time.

### 4.4 Building a Breathe session

```
for each cycle r in 1..cycles:
    push the pattern's [k, dur] pairs with stage:"set", set:1, rep:r
push { k:"done", dur:1e9, stage:"done" }
```

### 4.5 Rest

Rest is not silence: it is coherent breathing at 5.5 s in, 5.5 s out, for the
mode's rest duration, generated as ordinary steps with `stage: "rest"`.

```
coherentSteps(seconds):
    n = ceil(seconds / 11) * 2 + 2        # over-generate
    alternate in(5.5), out(5.5) for n steps
    trimTo(seconds)
```

`trimTo(array, from, total)` walks forward accumulating durations; at the
step that crosses `total` it shortens that step to the remainder and
truncates the array there. If the resulting last step is shorter than 0.4 s
and is not the only step, it is dropped instead — a 0.2 s breath phase is
noise.

### 4.6 Run-time edits

Only two, both in Lift:

- **Save set** — record the set as completed with the reps done so far, then
  splice out every remaining step of the current set. The session continues
  at the next rest or set.
- **Skip rest** — splice out every remaining step of the current rest block.

Both are followed by a **hard re-anchor** (§4.8).

### 4.7 Advancing

Once per animation frame, before rendering:

```
while current step is not the last  and  now >= stepStart + step.dur  and  guard < 400:
    stepStart += step.dur
    idx++
    if the step we just left had stage "set" and the new step is not in the
       same set: record that set as completed with the full rep count
```

The `while` (not `if`) matters: after the tab is backgrounded for two
minutes the pacer must catch up in one frame rather than crawl forward one
step per frame. The guard prevents an infinite loop if a zero-duration step
ever slips through.

When the current step is `done`, end the session naturally.

### 4.8 Re-anchor

```
reanchor(hard):
    if not hard: turbulence += min(into, max(0, dur - into)) / 2.5, capped at 1
    stepStart = nowSec()
    schedIdx  = idx - 1        # force the audio to re-schedule from here
```

A soft re-anchor is the user's sync tap: the current phase restarts now, and
how far off the beat they were becomes turbulence (§10). A hard re-anchor is
a structural edit and scores nothing.

---

## 5. Lift modes

Four. Each is a sequence of `[breath, seconds, movement word]`, a rest
duration, a default rep count, and a plain-language note naming the lifts it
is for. The sequence begins with whatever movement that family of lifts
actually begins with — this is why Squeeze opens on the way up.

| Mode | Sequence | Rep | Rest | Default reps | What it is |
|---|---|---|---|---|---|
| **Drive** | `in 3 LOWER` → `hold 1 HOLD` → `out 2 LIFT` | 6 s | 2:00 | 10 | Pauses at the bottom with the air in. Squats, presses, hinges. |
| **Squeeze** | `out 1 LIFT` → `empty 2 HOLD` → `in 3 LOWER` | 6 s | 1:30 | 12 | Pauses at the top, still breathing out. Rows, flies, curls, raises. |
| **Stretch** | `in 3 LOWER` → `hold 2 HOLD` → `out 2 LIFT` | 7 s | 1:30 | 10 | Pauses long at the bottom, air held in, soft. Flies, pullovers, deficit work. |
| **Heavy** | `in 2 HOLD` → `hold 2 LOWER` → `hold 1 LIFT` → `out 1 HOLD` | 6 s | 3:00 | 5 | One held breath under the whole rep (the Valsalva). Five reps and under. |

Notes that are easy to get wrong:

- **Squeeze's `empty`.** The `out` and the `empty` that follows it are one
  exhale. The screen changes the movement word from LIFT to HOLD; the audio
  must not change at all (§7.5).
- **Heavy's two `hold` steps.** One breath is held across both, with the
  movement word changing from LOWER to LIFT underneath it. Again the audio
  is continuous.
- **Heavy's first and last steps** are both movement-word HOLD: standing at
  the top breathing in, then standing at the top breathing out.
- The tempos are **fixed**. They are not user-editable, and a stored config
  from an older version must not be able to override them.

Reps are stored **per mode** (changing reps in Drive does not change Squeeze).
Sets are shared. Limits: reps 1–60, sets 1–20, cycles 1–40, step ±1.

---

## 6. Breathe patterns

| Pattern | Sequence | Cycle |
|---|---|---|
| **Relax** | `in 4` → `hold 7` → `out 8` | 19 s |
| **Coherent** | `in 5.5` → `out 5.5` | 11 s |

Default 8 cycles. The setup screen shows the session length as
`cycles × cycle seconds`. Breathe steps carry no movement word.

---

## 7. Audio

### 7.1 The graph

Built once, lazily, inside the user gesture that starts a session.

```
                     ┌── dryIn ──────────────────┐
                     │                           ▼
  voices ────────────┤                        lowpass(roll)
                     │                           ▲
                     └── wetIn ──┬───────────────┘
                                 └─ convolver ─ wet(0.42) ─┘

  lowpass(roll) → highshelf(2400 Hz, −7 dB) → compressor → master → destination
                                                              ├──→ analyser (tap)
                                                              └──→ MediaStreamDestination → <audio> element
```

- `roll` lowpass: **4200 Hz in Lift, 2600 Hz in Breathe**, Q 0.4.
- Compressor: threshold −8, knee 22, ratio 4, attack 0.02, release 0.5.
- Convolver impulse response is **synthesised at runtime**, ~2.8 s: per
  sample, brown-ish noise (`last = (last + 0.28·w)/1.28`) scaled by
  `(1−t)^2.6 · (1 − e^(−i/(rate·0.012)))`.
- `master.gain` starts at 0.0001 and ramps to **0.92 in Lift, 0.62 in
  Breathe** over 1 s on session start; ramps to 0.0001 over 1.2 s on stop.
- The analyser (`fftSize` 1024, `smoothingTimeConstant` 0) exists so the
  animation can read the loudness the app is currently producing (§10).

### 7.2 The ramp helper

All envelopes go through one function so that shapes are consistent and
interruptions are safe:

```
env(param, from, to, at, dur, shape = easeInOut):
    t0 = max(at, ctx.currentTime)
    cancelAndHoldAtTime(t0)     # fall back to cancelScheduledValues
    start = (at <= now + 0.03) ? param.value : from   # interrupting? start where we are
    setValueAtTime(start, t0)
    for i in 1..26:
        p = i/26
        linearRampToValueAtTime(start + (to-start)·shape(p), t0 + dur·p)
```

Twenty-six linear segments approximate a curve closely enough and avoid
`setValueCurveAtTime`, which behaves inconsistently across browsers when
cancelled. Shapes used: `easeInOut` = `p<0.5 ? 4p³ : 1−(−2p+2)³/2`,
`easeOut` = `1−(1−p)³`, `easeIn` = `p³`.

### 7.3 Sound: **Tone** (default)

Two notes and only two. **The breath in is a high note; the breath out is a
low note a fifth below.** This is the convention of established coherent-
breathing tracks (a high bell for the inhale, a low bell for the exhale),
rendered as sustained notes rather than strikes. Nothing ever changes pitch
and no third note is ever introduced, so it cannot read as a siren, an alarm
or a melody.

- **High voice — D4, 293.66 Hz.** Partials (ratio, gain):
  `(1, 1.0) (1.0015, 0.45) (2, 0.18) (3, 0.07)`. Lowpass starts at 320 Hz.
- **Low voice — G3, 196.00 Hz.** Partials:
  `(1, 1.0) (1.0015, 0.5) (2, 0.28) (3, 0.12) (0.5, 0.22)`. Lowpass starts
  at 220 Hz.
- The `1.0015` twin detunes by about 2.6 cents, giving a slow beat so the
  note moves inside itself rather than sitting dead.
- Both voices run through the reverb bus.
- Level ceiling `top = 0.22 × k`, where `k` is 1 in Lift and **0.7 in
  Breathe**.

Per phase (`g = max(dur, 0.35)`):

| Phase | High voice | Low voice |
|---|---|---|
| `in` | → level `top`, cutoff **1700 Hz**, over `g` | → silence, cutoff 220, over `min(1, g)` |
| `out` | → silence, cutoff 320, over `min(0.9, g)` | first `q = min(0.5, 0.2g)`: → `top`, cutoff 1200 (easeOut); then remaining `g − q`: → `0.12·top`, cutoff 220 |
| `hold` | whichever voice is **currently louder** → `0.62·top` at **its current cutoff**, over `min(1, g)`, easeOut | (the other is left alone) |
| `empty` | → silence over 0.5 s | → `0.12·top`, cutoff 220, over `g` |
| `getset` / other | → silence over 0.6 s | → silence over 0.6 s |

Three properties this produces, all required:

1. **A hold is never silent, and never moves.** It sustains the note that was
   already sounding, a little softer, at the cutoff it already had. Opening
   or closing it would imply air moving when none is.
2. **An `empty` continues the exhale.** The low note goes on closing.
3. **Every change is a ramp across the whole count.** A phase change is heard
   as a turn, never as a hit.

### 7.4 Sound: **Breath**

Brown noise (5 s looping buffer, `last = (last + 0.02·w)/1.02`, scaled ×3.6)
→ bandpass 800 Hz Q 0.9 → peaking 528 Hz Q 1.2 +4 dB → lowpass 2300 Hz Q 0.4
→ gain → dry bus. Ceiling `bt = 1.05 × k`.

| Phase | Behaviour |
|---|---|
| `in` | gain 0→`bt` over 0.6g, then `bt`→0.35`bt` over 0.35g; bandpass 520→1400; lowpass 1800→2600 |
| `out` | gain 0→0.9k over 0.14g, then →0.08k over 0.84g; bandpass 1200→380; lowpass 2300→1100 |
| `hold` | gain → 0.14`bt` over 0.5 s; bandpass → 700. **Quiet, steady air — never silence.** |
| `empty` | gain → 0.10`bt` over `g`; bandpass → 300. Audible to the end. |
| other | gain → 0 over 0.25 s |

### 7.5 Scheduling

Audio is scheduled **ahead** of the visual by `LEAD = 0.12 s`. Once per
frame:

```
while schedIdx < last and guard < 6:
    j = schedIdx + 1
    t = start time of step j          # stepStart + sum of durations from idx to j
    if t > now + LEAD: break
    if step j is "out" and step j+1 is "empty" in the same stage:
        schedule ONE "out" of duration (dur_j + dur_{j+1})
        schedIdx = j + 1
        continue
    if step j is not "done": schedule its phase at toCtx(max(t, now + 0.004))
    schedIdx = j
```

**The merge is mandatory.** An `out` followed by an `empty` is one exhale to
the ear; scheduling them separately produces an audible drop at the boundary,
which testing showed reads as "stop breathing". This is the single most
important audio behaviour in the app.

`schedIdx` is reset to `idx − 1` whenever the context resumes or a re-anchor
happens, so scheduling restarts from the current step.

### 7.6 Teardown

`audioStop` fades the master to silence over 1.2 s and tears the voices down
**1.5 s later** on a timer. Starting a new session must `clearTimeout` that
timer before building new voices — otherwise a session started within 1.5 s
of ending the previous one is silently destroyed by the old timer. (This was
a real bug.)

### 7.7 iOS and platform workarounds

All of these are load-bearing:

- The `AudioContext` must be created **inside** the tap that starts the
  session, and `resume()` called there too.
- The master is additionally routed into a `MediaStreamDestination` whose
  stream is the `srcObject` of a hidden `<audio playsinline>` element, which
  is played. This makes iOS treat the session as **media playback**, so audio
  survives the screen locking.
- `navigator.audioSession.type = "playback"` where supported.
- A near-silent `ConstantSourceNode` (gain 0.0001) is connected to the
  destination and started, to keep the graph alive.
- `navigator.mediaSession` metadata and play/pause handlers are registered;
  the handlers resume the context and replay the element.
- `ctx.onstatechange`: when it returns to `running` mid-session, reset
  `schedIdx = idx − 1`.
- On `visibilitychange` to visible during a session: re-acquire the wake
  lock, resume the context, replay the audio element.
- Every one of these is wrapped in `try/catch`; none may throw on a browser
  that lacks it.

---

## 8. Screen wake

Request a screen wake lock when a session starts, release it when it ends.
Re-request on `visibilitychange` to visible, because the lock is dropped when
the page is hidden. Handle absence of the API and rejection silently.

---

## 9. Belly: reading the breath from the accelerometer

Available in **Breathe only**, on by default. The phone lies on the abdomen;
it tilts a degree or two with each breath. When the sensor is confident, the
animation and the breath noise follow the user's *actual* breath while the
tone continues to pace the prescribed one — so the user hears themselves
against where they should be.

Permission: on iOS, `DeviceMotionEvent.requestPermission()` must be called
from the Start tap. Refusal is a first-class state — the session runs
normally without the mirror.

Per `devicemotion` event, with `a = accelerationIncludingGravity`:

```
dt = clamp(t - lastT, 0.004, 0.1)
g  = |a|  (fallback 9.81)
if |g - 9.81| > 1.2:  moving = true, moveT = t
else if t - moveT > 2.0: moving = false

for each axis i in {x, y}:
    raw[i] = a[i] / g
    dc[i]  += (raw[i] - dc[i]) · min(1, dt/15)     # 15 s: removes posture
    hp      = raw[i] - dc[i]
    prev    = lp[i]
    lp[i]  += (hp - lp[i]) · min(1, dt/0.3)        # 0.3 s: removes heartbeat, jitter
    v       = (lp[i] - prev)/dt
    vel[i] += (v - vel[i]) · min(1, dt/0.15)
    env[i] += (|lp[i]| - env[i]) · min(1, |lp[i]| > env[i] ? dt/0.5 : dt/12)   # fast attack, slow release

axis = the axis with the larger envelope
       (switch only if the current axis falls below half the best)
```

Turning points on the chosen axis, with hysteresis:

```
thr = max(0.0025, env · 0.18)
nd  = v > thr ? +1 : v < -thr ? -1 : dir
on a direction change, if the segment lasted > 0.7 s:
    record the segment length into rises[] or falls[] (keep last 6)
    record the timestamp into peaks[] or troughs[] (keep last 8)
    once ≥2 of each: sign = (mean rise > 1.15 × mean fall) ? -1 : +1
```

**Which turning point is the inhale is decided by the breath itself:** at
rest the exhale is the longer half, so the shorter segment is the inhale.
This makes the estimator immune to which way up the phone is lying, verified
by feeding it inverted tilt.

Derived outputs:

```
starts   = sign > 0 ? troughs : peaks
period   = median of the last 4 start-to-start gaps;  rate = 60/period
ampOk    = clamp((env - 0.004)/0.008, 0, 1)
recent   = (t - lastStart) < 2.5 · period ? 1 : 0
conf     = ampOk · min(1, count/3) · recent
fill     = (clamp(x·sign/(1.1·env), -1, 1) + 1)/2      # 0..1, lungs
flow     = clamp(v·sign/(0.9·env), -1, 1)              # -1..1, airflow
```

While `moving` is true, `dir` and `conf` are forced to 0 — a person shifting
position is not breathing data.

**The mirror voice.** When the mirror is active, an extra brown-noise voice
(bandpass 700 Hz Q 0.8 → lowpass 2400 → gain → dry bus) is driven every
frame by `conf · |flow| · 0.6`, with the bandpass moved to 1300 Hz on inhale
and 480 Hz on exhale, both via `setTargetAtTime` with a 0.12–0.25 s time
constant. When the mirror is on, the app forces the **Tone** scheme for
pacing regardless of the sound setting, because the noise is now the user.

The mirror is consumed by the animation only when `conf > 0.35` and not
`moving`. **It never drives the clock** — the prescribed pattern is the
pacer, always.

---

## 10. Touch

| Context | Behaviour |
|---|---|
| Lift, during a set | A tap anywhere on the run screen (outside a button) is a **sync tap**: the current phase restarts now (soft re-anchor), a full-screen flash confirms it, and the air is pushed away from the fingertip. |
| Breathe with Tap on, during a set | The user drums the breath, one tap per second on the count, finger held through a hold. Each tap pushes the air; a held finger pins it. |
| Breathe with Tap off | Taps do nothing. |
| Rest, count-in, done | Taps do nothing. |

**Taps never move the clock in Breathe.** The distance from the tap to the
nearest second becomes turbulence:

```
into = nowSec() - stepStart
f    = into - floor(into)
miss = min(f, 1 - f)
turbulence = min(1, turbulence + miss · 0.5)
```

Turbulence decays continuously at 12% per second and is fed to the animation.
Nothing is scored and nothing is displayed — pace error is expressed as the
air getting rough.

`pointerdown` / `pointermove` / `pointerup` (plus `pointercancel` on
`window`). `gesturestart` and `dblclick` are prevented to stop pinch-zoom and
double-tap zoom.

---

## 11. The frame-state contract

This is the interface between the pacer and **any** renderer. Computed once
per frame, before drawing. A rebuild can swap the visuals entirely as long as
it consumes these.

| Field | Range | Meaning / formula |
|---|---|---|
| `phase` | string | current `k` |
| `stage` | string | current `stage` |
| `prog` | 0..1 | fraction through the current step |
| `fill` | 0..1 | how full the lungs are. `in`: `easeInOut(prog)`. `hold`: 1. `out`: `1 − easeInOut(prog)`. `getset`: `0.15·(1−prog)`. Otherwise 0. |
| `flow` | −1.8..1.8 | airflow, signed: `+` in, `−` out. `bell = sin(prog·π)^0.7 · clamp(2.2/dur, 1, 1.8)`; positive on `in`, negated on `out`, 0 otherwise; multiplied by 0.45 during rest. |
| `gust` | 0..1 | `e^(−into/0.3)` during `in`/`out`, else 0. The first third of a second of a breath is a rush. |
| `amp` | 0..1 | `max(smoothed analyser RMS, min(1,bell)·0.75)`. The analyser gives `min(1, rms·7)`, smoothed at 0.25 per frame; if unavailable it falls back to `bell·0.6`. **The floor is mandatory** — see §17. |
| `still` | bool | `phase` is `hold` or `empty` |
| `pulse` | 0..1 | during `still`, from the second second on, `e^(−frac(into)/0.12)` — a once-a-second beat so a hold can be counted without reading |
| `turb` | 0..1 | accumulated pace error (§10) |
| `temp` | 0..1 | position within the set: `(rep−1)/(reps−1)`; 0.5 during rest, 0.15 otherwise |
| `dim` | 1 or 0.72 | 0.72 in Breathe — the whole presentation is softer at night |
| `tapX/tapY/tapK` | px, 0..1 | the decaying poke: `k·e^(−age/0.2)` while age < 0.9 s |
| `pinX/pinY/pinK` | px, 0/1 | a held finger |
| `rim` | 0..~0.3 | `0.09·fill + 0.16·pulse + (still ? 0.04 : 0)` |
| `idle` | bool | no session running; the home screen |

When the mirror is confident, `fill`, `flow` and `amp` are **replaced** by the
sensor's values.

**On the terminal `done` step** the state is driven for a few seconds after
the session ends: `flow = −0.9·e^(−into/2.5)`, `gust = e^(−into/0.6)`,
`fill = 0.6·e^(−into/3)` — one slow outward bloom that settles.

**Idle state** (home screen): `fill = 0.28 + 0.12·sin(t·0.35)`, `flow = 0`,
`amp = 0.2`, turbulence decaying.

---

## 12. What the run screen must say

Content only; presentation is out of scope.

| Element | Content |
|---|---|
| Headline word | Lift, during a set: the step's movement word (`LOWER`, `LIFT`, `HOLD`). Rest: `REST`. Count-in: `READY`. End: `DONE`. Breathe: the breath itself (`IN`, `HOLD`, `OUT`). |
| Secondary line | What the air is doing: `breathe in`, `breathe out`, `hold your breath`, `keep breathing out`. Count-in: `breathe in`. Breathe mode: empty (the headline already says it). |
| Count | Seconds remaining **in the current step**, `min(ceil(remaining), ceil(dur))`, minimum 1. During rest: the whole remaining rest as `m:ss`. |
| Progress rail | One segment per step of the **current rep/cycle**, widths proportional to their durations; completed segments full, the current one filling. Rebuilt only when the rep changes. |
| Meta line | Lift: `SET s/n · REP r/n`. Rest: `REST · SET s/n`. Breathe: `CYCLE r/n`, plus `· TAP` or `· PRESS` when Tap is on. |
| Actions | During a set in Lift: **Save set**. During rest: **Skip rest**. After DONE: **Back**. Always: **End**. |

Two hard layout invariants that are functional, not cosmetic:

- **The layout must not move between phases.** Every slot has a fixed
  height; the count uses tabular figures with reserved width; hidden
  controls keep their slot. A pacer that jumps as the phase changes is
  unreadable in peripheral vision.
- **The headline word is sized once**, for the widest word that can ever
  appear (`LOWER`, `READY`, `HOLD`, `LIFT`, `REST`, `DONE`, `OUT`), measured
  on a *visible* off-screen element. Measuring a hidden element returns zero
  width and the fitter silently does nothing — this was a real bug that let
  the longest word overflow the screen.

---

## 13. Rendering: the animation subsystem

The animation is the pacing signal, not decoration: peripheral vision cannot
read a word or a small ring, but it is very sensitive to large-area luminance
change and to coherent motion. So the whole screen moves with the breath, and
the text is a caption for the moments the user looks straight at it. The app
therefore **does not** honour `prefers-reduced-motion` — there would be no
pacer left.

Two renderers, same contract (§11):

**Primary — a GPU fluid.** WebGL2 with float or half-float render targets. Per
frame: advect velocity, vorticity confinement, apply force, compute
divergence, ~10 Jacobi pressure iterations, subtract the gradient, advect and
inject one channel of dye, then a display pass. Simulation grid ~128 wide
(height by aspect), dye at 3× that. The force is a **spiral whose spin
reverses with the breath**: the inhale draws everything to the centre, the
exhale throws it outward, magnitude `flow · (0.6 + 0.9·amp) · (1 + 1.2·gust)`.
Curl noise adds wisps; vorticity confinement keeps eddies alive. The headline
word is a **no-slip obstacle** that also sheds dye from its edges and pulls
air toward itself.

**Fallback — 2D canvas lines.** Long polyline "ribbons": each is a chain of
points at fixed spacing trailing a head, so a line holds its shape when the
air stops and streams when it blows. Same force model, plus drag. ~60–120
lines. Costs well under a millisecond.

**The obstacle mask.** The headline element is rasterised into an off-screen
canvas at half resolution; both engines sample its alpha. Rebuilt when the
word changes, the screen changes, on resize, and when fonts finish loading. A
version counter lets the GPU engine know when to re-upload the texture.

**Frame budget and the ladder.**

```
dt = min(wallDelta, 1/20)          # clamp; wallDelta itself clamped to 0.1
cpuEMA  += (cpuMs  - cpuEMA)  · 0.05
wallEMA += (wallMs - wallEMA) · 0.05
if cpuEMA > 9 ms or wallEMA > 40 ms, sustained for 3 s:
    first: the fluid drops its resolution once
    then:  hand over to the 2D lines
```

Also fall back immediately on WebGL2 context loss, and at startup if WebGL2
or float render targets are unavailable.

**Three rules that were learned the hard way and must not be re-broken:**

1. **Decay must be per second, not per frame.** Any `value *= 0.99` per frame
   makes the air behave differently at 30 fps and 60 fps. Use
   `value *= pow(0.99, dt·60)` or `pow(halfLife, dt)`.
2. **Clamp `dt` at 1/20 s, not 1/30.** A clamp tighter than the real frame
   time advances the simulation by less time than actually elapsed, and the
   whole animation plays in slow motion whenever the device falls behind.
3. **Cap the display pixel ratio at 1.5.** The display pass is per-pixel; 3×
   on a modern phone more than doubles the fill cost for no visible gain.

---

## 14. Storage

Key `wind.v2`, with a one-time read of the older `wind.v1` if the new key is
absent.

```
{ cfg: {
    sound: "tone" | "breath",
    lift:  { preset: string,
             reps:   { drive, squeeze, stretch, heavy },
             sets:   int },
    breathe: { cycles: int, pat: "478" | "coh",
               belly: "on"|"off", tap: "on"|"off" } },
  stats: { sec: float, log: [ ... ] } }
```

**Loading must be defensive.** Start from a deep clone of the defaults and
copy in only known, valid keys:

- The mode sequences, durations and rest times are **never** read from
  storage. Only `preset`, `reps`, `sets` are.
- An unknown `preset` falls back to `drive`.
- An unknown `pat` falls back to `478`; an unknown `sound` to `tone`.
- Any parse failure leaves the defaults untouched.

`stats.sec` accumulates total session seconds. `stats.log` is unshifted with
`{ t: epoch ms, m: mode, s: set number, of: total sets, d: reps done, g: reps
goal }` per completed set, capped at 400 entries. Sets are recorded once each
— a guard map keyed `mode:set` prevents double entry when a set is both
auto-completed and saved.

Every write is wrapped in `try/catch`: Safari private mode throws.

---

## 15. Query parameters

| Parameter | Effect |
|---|---|
| `?auto=lift` / `?auto=breathe` | Start that session ~300 ms after load. Audio stays silent until a tap. |
| `?eng=slipstream` | Force the 2D fallback renderer. |
| `?perf=1` | Show a frame-time / engine overlay. |
| `?nobudget=1` | Disable the frame-budget ladder (for testing the fluid on slow renderers). |

---

## 16. Not present, deliberately or otherwise

- **No service worker** in the current build, so an installed app needs a
  connection on first open of a session. Adding one is a known, wanted
  improvement.
- **No haptics.** The ideal Tap method would tap back, but iOS Safari has no
  vibration API and the one workaround fires only on a user gesture, not a
  timer. This is a platform block, not an oversight; it is the strongest
  argument in the project for a native app.
- **No microphone.** An earlier version listened for the breath and was cut:
  a breath a foot from a phone is quiet, iOS strips low broadband hiss, the
  mic cannot distinguish inhale from exhale, and opening it can route output
  to the earpiece. The accelerometer sees direction as well as rhythm and
  costs one permission tap.
- **No session resume across a reload.** A live session is lost if the page
  is dropped. (An earlier sibling app had this; it is worth restoring.)
- **No stats screen.** The log is recorded but never displayed.

---

## 17. Failure modes to avoid (history)

Every one of these shipped at some point and had to be diagnosed.

1. **The animation running at half speed.** Caused by three things at once:
   the force being scaled by the loudness of the audio (a quieter sound
   literally slowed the wind and a silent hold stalled it); the `dt` clamp at
   1/30 playing the simulation in slow motion below 30 fps; and a frame-budget
   guard that measured only JavaScript time and so never noticed a GPU stall.
   Fixes: a floor under the loudness coupling so sound can only *add* to the
   force; clamp at 1/20; watch the whole frame interval as well as JS time.
2. **A NaN poisoning the velocity field.** `pow(sin(x·π), 0.7)` was evaluated
   while `x` was still negative during a lead-in; the sine went negative, the
   power returned NaN, and a single NaN frame made the entire field uniform
   for the rest of the session. Guard the domain, and scrub non-finite values
   at the end of any force pass.
3. **Audio cutting out on a hold.** A hold scheduled nothing, so it was
   silent, which testing showed reads as "stop breathing". Every phase must
   make sound (§7.3, §7.4).
4. **An exhale that restarts mid-breath.** Scheduling `out` and `empty` as
   two phases produced a drop at the boundary. They must be merged (§7.5).
5. **A new session killed by the previous teardown timer.** (§7.6)
6. **The headline word overflowing the screen**, because the fitter measured
   a hidden element and got zero. (§12)
7. **A tone that climbed a scale.** A pentatonic ladder, one note per second,
   read as a melody with a hit every second. A pitch-gliding sine read as a
   siren. Two fixed notes solve both. (§7.3)

---

## 18. Acceptance tests

Functional checks a rebuild must pass.

**Timing**
- A Drive session with 10 reps and 4 sets builds `4 × (1 + 30) + 3 × rest`
  steps plus the terminal sentinel; total duration matches the sum.
- Backgrounding the tab for 60 s and returning advances the pacer to the
  correct step in one frame, not gradually.
- With the audio context suspended, the on-screen count keeps advancing at
  the right rate.

**Audio**
- In Squeeze, the low voice's gain is continuous and monotonically falling
  across the `out` → `empty` boundary; no step, no gap.
- No phase leaves both voices at silence, except the count-in and the end.
- Starting a session within 1 s of ending one produces sound.
- Every phase's scheduled audio begins within ±20 ms of `phaseStart − 0.12 s`.

**Words**
- In Heavy, the headline reads `HOLD → LOWER → LIFT → HOLD` while the
  secondary line reads `breathe in → hold your breath → hold your breath →
  breathe out`.
- In Squeeze, the first step of a set is `LIFT / breathe out`.

**Sensor**
- Feed a synthetic 12-per-minute tilt wave: `rate` converges to ~12,
  `conf` exceeds 0.35, and `fill` peaks at the top of the inhale.
- Invert the polarity of the same wave: `sign` flips and the session still
  starts on an inhale.
- Simulate movement (|g| far from 9.81): `conf` drops to 0.

**Renderer**
- The frame state's `fill` is 1 for the whole of any `hold`, and the field's
  velocity decays rather than being driven.
- Forcing the fallback renderer produces a running session with the same
  words, counts and audio.
- With the GPU renderer at 30 fps, the air travels the same distance per
  second as at 60 fps (the per-second decay test).

**Storage**
- A stored config containing hand-edited mode durations is ignored.
- A stored `preset` that no longer exists falls back to `drive`.
- With `localStorage` throwing, the app still runs from defaults.

---

## 19. Build order for a rebuild

1. The clock (§3) and a bare step array with a text readout. Verify timing
   with the tab backgrounded.
2. The session builder and the four Lift modes plus the two Breathe patterns
   (§4–6). Verify step counts and totals.
3. The word/secondary-line vocabulary and the count (§12).
4. The Tone scheme and the scheduler, including the `out`+`empty` merge
   (§7.3, §7.5). This is where the app becomes usable.
5. The iOS audio workarounds and the wake lock (§7.7, §8).
6. Storage and its defensive load (§14).
7. The frame-state contract (§11) and the simpler 2D renderer.
8. The GPU renderer and the budget ladder (§13).
9. Belly and Tap (§9, §10).

Steps 1–6 are a complete, shippable pacer. Everything after is delivery.
