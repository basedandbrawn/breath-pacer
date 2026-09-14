# breath-pacer

A breath pacer for lifting and for sleep. One page each, no build step, no
dependencies — open a link and it runs.

## The three versions to test

All three live under `https://basedandbrawn.github.io/breath-pacer/`, so the
links differ only in the last part:

| | Link | What it is |
|---|---|---|
| **Design 1** | [wind.html](https://basedandbrawn.github.io/breath-pacer/wind.html) | The current build, unchanged. |
| **Design 2** | [wind-design2.html](https://basedandbrawn.github.io/breath-pacer/wind-design2.html) | *The disciplined instrument.* A technique read off a measuring device. Ink ground, one pale cold air, one ember: moving air is cold and pale, held air warms and thickens. The seam wordmark, Archivo against IBM Plex Mono. |
| **Design 3** | [wind-design3.html](https://basedandbrawn.github.io/breath-pacer/wind-design3.html) | *The technique, not the weather.* The name struck into a serif and bowed on a fixed curve, as if the air had leaned on it. The count at poster scale; the movement word is an obstacle the air piles up against. Archivo and Zen Old Mincho. |

Designs 2 and 3 are restyles of `wind.html`: the session engine, audio graph,
clock, wake lock and storage are carried over line for line, so the three
behave identically and only the look varies. Each has its own field renderer.

On iPhone, open a link in Safari and Share → **Add to Home Screen**. Designs 2
and 3 install under their own names, so all three can sit there at once.

## Where this deploys from

GitHub Pages serves this repository from the branch
`claude/breath-pacer-lifting-modes-hwozs3`, not from `main`. A change is only
live once it is on that branch.

## Layout

| Path | What it is |
|---|---|
| `wind.html` | Design 1, whole app in one file |
| `wind-design2.html`, `wind-design3.html` | Designs 2 and 3, one file each |
| `design2/`, `design3/` | Each design's fonts, field renderer and web manifest |
| `index.html` | An earlier Breath pacer, kept for reference |
| `design/` | Briefs, the spec and prototype notes |

## House rules for a new design

- **One page, one file**, as `wind-designN.html`.
- **Its own folder for assets** under `designN/` — the repository root's are
  already spoken for by `index.html`.
- **No service worker.** All three pages share the `/breath-pacer/` scope, so
  only one worker could ever be registered for the lot, and a cache-first worker
  would serve a stale build of whichever page was opened last.
- **Settings shared, sessions not.** Read settings from the same `localStorage`
  key as the design it was restyled from, so a change of cadence or sound
  carries between versions and the comparison is like for like.

## Running it locally

```sh
npx http-server . -p 8080
```
