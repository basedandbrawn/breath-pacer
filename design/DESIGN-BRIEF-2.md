# Design brief 2: the wind across the whole app, the name, and the words

Paste everything below the line into a fresh conversation with a design AI.
Attach three files with it: `design/SPEC.md` (the functional contract),
`design/reference/setup-lift-current.png` (a screenshot of the current
setup screen, the one the client rejected), and the live app URL
`https://basedandbrawn.github.io/breath-pacer/wind.html` so the current
run screen can be seen moving.

---

You are a small studio taking over the visual, motion and verbal design of
an existing breath pacer called **Wind Bender**. The functional
specification is attached and is ground truth: every screen, state, timing,
phase, and the exact per-frame numbers your motion will be driven by are
defined there. Read it completely first. Nothing in it changes; everything
the person sees, reads and touches is yours.

The client has already rejected two passes. Both failed the same way: when
a piece was criticised it was simplified or removed instead of designed.
That is the failure you are hired to avoid. **Every problem below needs an
idea, not a deletion.**

## Roles

Work as five people who share one page and argue with each other in the
open:

1. **Creative director.** Owns the one direction (below) and the unity of
   the whole. Rejects anything that reads as a game, a toy, a fitness-brand
   template, or a meditation-app template.
2. **Motion and generative artist.** Owns the wind: a living system that
   runs across every screen, not a background behind one of them.
3. **Typographer.** Owns the name of the app on the home screen and the
   type system everywhere else, especially the words a lifter reads mid-set.
4. **UX writer.** Audits every string in the app and rewrites what fails.
5. **UI designer.** Owns components, rhythm, spacing and the fact that one
   screen looks like it was made by one hand.

## The one direction

The visual language should evoke a **wind-bending or wind-breathing martial
artist performing a technique**: someone who commands air as a physical,
disciplined force, as in wind-elemental bending fiction and breathing-
technique swordsmanship fiction. Each breath *is* a technique: a deliberate
movement of air, never ambient weather and never a screensaver.

How intense, how elegant or aggressive, how ancient or modern, how minimal
or elaborate: yours. Colour, type, hierarchy, layout, components, flow:
yours, from first principles, with the spec as the only constraint.

## Problem one: the wind across the whole app

Today the wind exists only on the run screen. Design it as a **system that
inhabits the entire app**, with a defined behaviour for every screen and
every state, and with rules for how it relates to the interface in front of
it. The spec's frame-state contract (§11) gives you the live numbers:
`fill`, `flow`, `gust`, `amp`, `still`, `pulse`, `turb`, `temp`, `rim`, tap
and pin positions, plus an `idle` flag. Design against those exactly.

Answer, with motion, not prose alone:

- **Home.** What is the wind doing when nothing is happening? How does it
  relate to the name of the app? Is the name an object in the wind, a source
  of it, something the wind reveals, something the wind is made of?
- **Setup.** The wind must not stop at the edge of a card. What does it do
  behind, between, or through the controls? Does choosing a mode change it?
  Does the tempo bar of a mode carry a preview of its breath?
- **Count-in (READY, 3 seconds).** The moment before a set. What gathers?
- **Breathing in.** The spec fixes that it is a deliberate inward technique.
  Make it unmistakable from six feet away with the words covered.
- **Holding the breath in.** Nothing enters, nothing leaves. The air is not
  dead; it is *held*. What does held air look like, and how does a person
  count a four-second hold from the motion alone?
- **Breathing out.** The release. Distinct from the in not only by direction
  but by character.
- **The hold that keeps breathing out** (the squeeze at the top of a row).
  The air is still leaving. It must read differently from the held-in hold.
- **Rest between sets.** Coherent breathing, 5.5 in and 5.5 out, for up to
  three minutes. Calmer than the set, still the same wind.
- **Session end.** One resolution, then stillness.
- **Transitions.** Between screens and between phases. The spec forbids the
  layout from moving between phases; the wind is where the change is
  allowed to be felt.
- **Touch.** A tap in Lift is "this movement starts now"; a tap in Breathe
  with Tap on is a beat. What does the wind do at the fingertip, and how does
  the field answer the person?
- **The Belly sensor.** When the phone reads the real breath, the wind
  follows the person rather than the clock. Show what that looks like when
  the person is ahead of or behind the pacer.

Then the rules: how the wind and the interface coexist. Whether type sits on
the wind, in it, or above it. Whether cards occlude it, tint it, let it
through, or bend it. What the wind does to a button that is being pressed.

Prototype the run screen phases live, driven by the real numbers. A still
image of a hold is not a design of a hold.

## Problem two: the name

The app is called **Wind Bender**. On the home screen the name is the
identity of the whole product and the first thing anyone sees. Two attempts
have been rejected: a heavy condensed face with bouncing letters ("looks
like a children's game"), and a plain letter-spaced capitals setting ("that
is not a design, that is a default").

Bring **at least six genuinely different directions**, each with a
rationale, each prototyped in place on the home screen with the wind
running, each judged against the one direction above. Use typography as a
material: letterforms, weight contrast, scale contrast, case, rhythm,
custom or modified glyphs, the relationship between the two words, the
name as an object with physical properties in the wind (drawn, cut, carved,
blown, bent, revealed), the name as a mark rather than a word, the name at
rest versus the name during a breath. At least two directions must involve
the wind physically acting on the letterforms. At least one must treat the
two words differently from each other. None may be "all caps, one weight,
letter-spaced" as the whole idea.

Recommend one and say why the others lost.

## Problem three: the words

Bring the UX writer in with authority over every string. The audit covers
the whole app; these are the known failures.

**The home screen.** The two buttons say LIFT and BREATHE. Under them there
used to be "sets · reps · rest" and "cycles", which the client rejected as
jargon that explains nothing. They were then removed, leaving two bare
words, which is not a solution either. A first-time user needs to know, in
one glance, what each of the two does and which one they want right now.
Find the words. Consider whether the two labels themselves are right.

**The Belly and Tap controls.** Two toggles on the Breathe setup, currently
sitting in a card with no label at all, because the previous label, "With",
was rejected and removed rather than replaced. Belly means "the phone lies
on your abdomen and reads your actual breathing from the accelerometer".
Tap means "you tap the screen once a second on the count and hold your
finger down through a hold". They need a name for what they are as a pair,
a name each, and enough context that a person knows what will happen when
they turn one on, delivered as a designed component and not as a paragraph
under the chips. (An earlier paragraph was rejected as "a bad way to give
information".)

**The modes.** Drive, Squeeze, Stretch, Heavy, each with a one-line note
naming what it is and which lifts it is for. Audit the names and the notes.
The run screen's movement words are LOWER, LIFT, HOLD with a breath line
under them (`breathe in`, `breathe out`, `hold your breath`, `keep breathing
out`); READY for the count-in. Audit those too, but read the spec's history
first: the previous vocabulary (brace, drive, set, squeeze, top) was rejected
for being too many words to hold under a load, so simplicity here is a
requirement, not a style.

**The Breathe patterns.** RELAX (4 · 7 · 8, corner note "long exhale") and
COHERENT (5.5 · 5.5, corner note "5.5 a minute"). Audit.

**Everything else.** Reps, Sets, Breaths, Time, Sound, Tone, Breath, Start,
Back, End, Save set, Skip rest, the meta line (`SET 1/4 · REP 3/10`,
`REST · SET 1/4`, `BREATH 3/8`), DONE. Every string in the spec.

Deliver a copy deck: every string, current → proposed → the reason, with
the ones you left alone marked as deliberate.

## Problem four: unity, and the type on the run screen

The attached screenshot of the setup screen is the current state. The
client's verdict: "no visual design or unity even on the same page; it
looks messy." Cards with tempo bars, cards with steppers, cards with
chips, a bare pair of toggles, a Start button that belongs to a different
app. Design **one component system** and show every setup control living
in it.

Separately: the run screen's headline word, the movement cue, is currently
sized at roughly a quarter of the screen width and was called "too big and
childish". It must still be readable at arm's length by someone mid-set
whose eyes are not on the phone, and the spec requires it to be sized once
for the widest word and never to move. Within those constraints, design the
run screen's type as a system: the movement word, the breath line under
it, the count, the meta line and the progress rail as one composition with
authority.

## What to deliver

1. **Interactive prototypes**, in single-file HTML, of the home screen, the
   setup screens, and the run screen in every state named above, with the
   wind system running on all of them, driven by the frame-state contract.
   Include a way to step through phases and to toggle the Belly and Tap
   conditions.
2. **The name**: six or more directions on the home screen, live, plus your
   recommendation.
3. **The motion spec**: for each screen and state, what the wind does,
   precisely enough to implement against the contract's variables, and the
   rules for wind versus interface.
4. **The copy deck**: every string in the app, current → proposed → why.
5. **The component system**: an inventory of every control on the setup
   screens rendered in the one system, and the run-screen type composition.
6. **A short critique of your own work** from the creative director: what
   is still weakest, and what you would do with another week.

What will get this rejected a third time: removing anything the client
found awkward instead of redesigning it; a wordmark that is a font choice
and nothing else; a wind that is a background; a setup screen where the
cards do not share a system; copy that explains by paragraph.
