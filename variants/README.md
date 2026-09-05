# variants/ — the Aurora and Slipstream faces of The Wind

Staging for two separate repos, `Wind-aurora` and `Wind-slipstream`. Nothing here
is served by this repo; `index.html` at the root is the pacer itself.

`build.py` regenerates both faces from a checkout of the pacer:

```sh
git archive <commit> | tar -x -C /path/to/src     # the pacer to restyle
python3 build.py /path/to/src                      # writes aurora/ and slipstream/
```

Each face is `theme.css` (the whole stylesheet, written rule for rule against the
pacer's markup) plus a handful of markup swaps and constants in `build.py`. The
engine is carried across unchanged. Fonts come from `fontsrc/` (fetched by
`getfonts.py`, SIL OFL); `verify.mjs` drives a face through every screen and run
state in Chromium.

Built from `f1b2e63` on `claude/breath-pacer-audit-zeodi9`.
