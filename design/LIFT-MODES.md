# Lift modes: the gym test, and what to do about it

> Second pass: the cue words below (BRACE, DRIVE, SET, SQUEEZE, TOP) were
> themselves too many to hold under a load, and SET was the worst of them.
> The app now uses three words, LOWER, LIFT and HOLD, with the breath as a
> line under the word; see "Three words" at the end.

Written after a failed session on a rear delt fly machine in Squeeze mode
(in 2 · out 1 · squeeze 2). The lifter could not tell whether to keep
exhaling through the squeeze or stop breathing, did not know what the
breath was doing during the eccentric, and found OUT then SQUEEZE, shown as
two words in sequence, too much to follow with a handle in each hand.

## The diagnosis

The app is a breath pacer that shows breath words. Under a load the body
needs the movement word, with the breath carried underneath it. That single
inversion explains every complaint:

- **"Do I stop breathing while squeezing?"** The squeeze was scheduled as a
  separate phase, with its own word and, in the ladder tone, silence. Two
  words and a change of sound read as two instructions. Physiologically the
  squeeze is the tail of the same exhale that drove the pull.
- **"What is my breathing doing during the eccentric?"** The cycle opened on
  IN with no movement word, so IN had to be guessed as the lowering. It was,
  but nothing said so.
- **"Should in be longer, or out?"** Neither is a goal inside a set. The
  breath follows the movement tempo: exhale as long as pull plus squeeze,
  inhale as long as the lowering. On a machine fly that is about 3 out and
  3 in. Long exhales (4·7·8, 4·6) are for coming down between sets and after
  the session, when the exhale is the point; in the rep the movement is the
  point and the breath serves it.
- **Squeeze lifts start with the concentric.** A row, a fly, a curl, a
  pulldown and a hip thrust all begin with the pull. "Every cycle opens on
  IN" put the inhale first for a lift whose first movement is an exhale. The
  fix is one SET breath in, then pull.

The same inversion is why Drive felt fine at moderate loads and useless at
heavy ones: LOWER · BRACE · DRIVE is a movement sequence with a breath under
it, and the Valsalva (in at the top, hold through the lowering and the
drive, out at lockout) could not be said at all because the app had no way
to run one breath under two movements.

## What a lifter needs from the screen and the speaker

Tested by walking through sets in imagination and in the lab page's runner,
with the cue words spoken and the swell tone under them.

1. **The word is the movement.** LOWER, BRACE, DRIVE, PULL, SQUEEZE, LIFT,
   STRETCH, BREATHE, TOP, HOLD, SET. Never IN, OUT, EMPTY as the headline.
2. **The breath is a second track.** Colour on the ground (cool in, warm
   out, silver still), the tone (opens in, closes out, sustains held), and a
   thin bar under the movement bar. When one breath spans two movements the
   bar spans both, so PULL + SQUEEZE is one gold OUT and LOWER + DRIVE in
   Heavy is one silver HOLD.
3. **The count is seconds left in the movement.** Not in the breath.
4. **The sound must carry the turn without the screen.** With the eyes on
   the bar, the moment to change comes from the ear. The swell's turn from
   opening to closing carries in and out. For the movement boundary inside
   one breath (PULL to SQUEEZE, LOWER to DRIVE) a soft low knock at every
   movement start, below 300 Hz, is the least alarming marker found. A spoken
   cue (speechSynthesis, available on iOS Safari) is the most legible of all
   and costs nothing; offered as Voice.
5. **The sync tap stays.** A tap means "this movement starts now".
6. **Rest breathes you down.** Coherent 5.5 as now, or 4 in · 6 out, which
   is where a long exhale belongs.

## The modes

| Mode | Movement · breath · seconds | Lifts | Why |
|---|---|---|---|
| **Drive** | LOWER in 3 · BRACE hold 1 · DRIVE out 2 | Squat, bench, press, leg press, lunge, RDL at moderate loads | Pauses full. The brace kills the bounce |
| **Squeeze** | SET in 2 once, then PULL out 1 · SQUEEZE out 2 · LOWER in 3 | Rows, flies, pulldowns, curls, raises, calves, hip thrusts, crunches | Pauses empty. One exhale under pull and squeeze; the lowering is the whole inhale |
| **Stretch** | LOWER in 3 · STRETCH hold 2 · LIFT out 2 | Chest fly, pullover, incline curl, deficit RDL, seated calf, deep goblet squat | Pauses long and soft. STRETCH, not BRACE: sink, don't tense |
| **Heavy** | BREATHE in 2 · LOWER hold 2 · DRIVE hold 1 · TOP out 1 | Squat, bench, deadlift, press at five reps and under | The Valsalva. One held breath under two movements, which was "out of scope" only because the old design could not say it |
| **Steady** | HOLD in 4 · HOLD out 4, for time | Plank, wall sit, dead hang, carries | No rep. Keeps you breathing through a hold, which is where everyone stops |

Drive and Squeeze survive with new words and one merged exhale; Stretch,
Heavy and Steady are new. A sixth, Pump (one breath every two reps for
1·0·1 tempo work) was considered and left out: at that tempo the breath
cannot follow the rep and the pacer should not pretend it can.

## The tone

The ladder is gone. One note, G3, with two soft harmonics, a second
fundamental a hair sharp so the note slowly moves inside, and a breath of
pink air under it. The in opens the lowpass 240 to 1500 Hz and swells the
level; the out closes both; a hold sustains, a little softer; a squeeze is
the same hum at its darkest. Nothing steps and nothing slides in pitch, so
it cannot be a siren and it cannot be do-re-mi. Seven variants are on the
lab page with the reasoning for a nervous system that startles.

## What the lab page is

`design/lab.html`: eight winds on one breath clock, seven tones you can
play, and the five modes as runnable three-rep sets with the cues, the
two-track bar, the tone, the knock and an optional voice. The app itself
carries the tone change and the wind speed fix; the modes are a proposal
in the lab until they are approved for `wind.html`.


## Three words

SET meant the one breath in you take after you are in position and before
the first pull: handles in hand, chest up, breathe in, go. A real thing,
and a bad word for it, because SET already means a set of reps and it
named a breath rather than a movement. READY is that breath now: the
count-in says "breathe in" under it and the first movement word follows.

Brace, drive, squeeze and top were each a coaching cue for one kind of
lift, so there were five words for two things the body does. The way down
and the way up are the same for every lift, so those are the words: LOWER
and LIFT. A pause is a pause: HOLD. What differs between lifts is only what
the air does in the hold, and that is the small line under the word, not a
new word.

| Mode | Words · breath under them |
|---|---|
| Drive | LOWER · breathe in 3 → HOLD · hold your breath 1 → LIFT · breathe out 2 |
| Squeeze | LIFT · breathe out 1 → HOLD · keep breathing out 2 → LOWER · breathe in 3 |
| Stretch | LOWER · breathe in 3 → HOLD · hold your breath 2 → LIFT · breathe out 2 |
| Heavy | HOLD · breathe in 2 → LOWER · hold 2 → LIFT · hold 1 → HOLD · breathe out 1 |
| Steady | HOLD · breathe in 4 → HOLD · breathe out 4, for time |

Drive and Squeeze ship in wind.html with these words. Stretch, Heavy and
Steady are runnable in the lab.
