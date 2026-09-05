# The Wind — slipstream

A breath pacer for lifting and for sleep. One page, no build step, no dependencies,
no network requests at all: the fonts ship with the app and a service worker caches
the shell, so it opens in a basement gym or in airplane mode. Installs to the home
screen as a standalone app.

**Look:** Slipstream is the wind, literally. Two sets of gold lines drift across slate at rest; during a session they follow the lungs, rushing in on the inhale, going still on the hold, and flowing back out on the exhale. The phase word arrives on the wind and a gold rule fills and empties with the breath. Syne carries the headlines, titles and the phase word; IBM Plex Mono carries labels and readouts. Type is Syne and IBM Plex Mono (SIL Open Font License, see `fonts/`).

This is a restyle of [breath-pacer](https://github.com/basedandbrawn/breath-pacer):
every screen, control, preset, sound and behaviour is the same, and the session
engine, audio graph and clock are carried over line for line. Only the visual
layer, the fonts, the icon and the offline shell's file list differ.

## What it does

- **Lift** paces the breath through a set. Three cadences set the tempo: compound
  (4·2·6), isolation (2·0·3) and isometric (4·0·8, seconds instead of reps). Adjust
  reveals per-cadence in/hold/out steppers, with a reset when one has been edited.
  Reps, sets and rest live under Session, with the session length shown.
- **Breathe** runs 4·7·8, coherent 5.5·5.5 or box 4·4·4·4 for a chosen number of cycles.
- **Rest waits for you.** When the clock reaches zero the pacer goes quiet, reads
  READY and counts the overrun. START SET begins the count-in when you are at the bar.
- **A tap means "I am breathing in now."** During IN it restarts the inhale; during
  HOLD or OUT it jumps to the next inhale. Rest ignores taps.
- **END asks once** and reverts after a moment, so a mis-tap never discards a session.
- **A live session survives a reload.** iOS drops backgrounded pages during a long
  rest; on reopen the pacer is already at the right phase.
- Two sounds synthesised live at 528 Hz, **tone** and **breath**, plus **off**.
  Steppers repeat while held.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app: markup, styles and logic in one file |
| `sw.js` | Offline shell: caches everything on first load |
| `fonts/` | Bundled woff2 faces and their licences |
| `manifest.webmanifest` | Makes it installable as a standalone app |
| `icon-180.png` `icon-192.png` `icon-512.png` | Home-screen icons |

## Running it

Open `index.html` in a browser, or serve the folder:

```sh
npx http-server . -p 8080
```

## Publishing with GitHub Pages

Settings → Pages → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
It goes live at `https://basedandbrawn.github.io/Wind-slipstream/` in a minute or two.

## Installing on iPhone

Open the Pages URL in Safari, then Share → **Add to Home Screen**. It launches
full-screen, keeps the screen awake during a session, and keeps playing when the
screen locks.

## Notes

Settings live in `localStorage`, tied to the origin this is served from, so each
deployment keeps its own.
