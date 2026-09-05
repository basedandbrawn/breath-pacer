# The Wind — slipstream

A breath pacer for lifting and for sleep. One page, no build step, no dependencies,
no network calls except the web fonts. Runs offline once loaded, installs to the
home screen as a standalone app.

**Look:** The wind, literally. Gold lines drift across slate, editorial headlines at poster scale, and a single gold rule that fills with the breath.

## Modes

- **Lift** — paces the breath through a set. Three presets set the tempo and the
  rest together: compound (4·2·6, rest 3:00), isolation (2·0·3, rest 1:30) and
  hold (4·0·8, seconds instead of reps, rest 1:30). Tune reveals the per-preset
  in/hold/out and rest steppers.
- **Breathe** — 4·7·8 or coherent 5.5·5.5, for a chosen number of cycles.

Two sounds, both built live in the browser with the Web Audio API at 528 Hz: a
soft pad (**tone**) and a slow meditation breath (**breath**). The hold is
deliberately silent in both.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole app — markup, styles and logic in one file |
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
full-screen with no browser chrome, keeps the screen awake during a session, and
keeps playing when the screen locks.

## Notes

- Settings and stats live in `localStorage`, so they are tied to the origin this
  is served from. Each deployment keeps its own separate history.
- Tapping the running screen re-anchors the current phase to that instant, for
  syncing to a rep you have already started.
