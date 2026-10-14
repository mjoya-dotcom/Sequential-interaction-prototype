# Sequential-interaction-prototype
Tutorial

Live page: https://mjoya-dotcom.github.io/Sequential-interaction-prototype/

## Campfire at Dusk — sequence prototype

One continuous, linear interaction built from three studies (`studies/`):

| # | Step | Source study | Gesture |
|---|------|--------------|---------|
| 1 | Ring the pit | Campfire Rocks | Drag 4 rocks from the glowing pile into the slots |
| 2 | Gather wood | Campfire Wood (collect) | Tap 6 glowing logs hidden in the trees, under the bench, on the ground |
| 3 | Stack wood | Campfire Wood (place) | Drag each log from the bubble into the ring |
| 4 | Light it | Campfire Matches | Drag the match, rub it on the striker until it lights, touch it to the wood |

Each step unlocks only after the previous one completes. The scene darkens after every step.
Once lit, the fire burns for about 20 seconds, then dies down to embers. Reset (top right) is always available.

The site is in `docs/` (static HTML/CSS/JS, no build step, relative paths, `.nojekyll`).
To publish it: **Settings → Pages → Deploy from a branch → `main` / `/docs`**.

- `docs/index.html` — scene markup (single SVG)
- `docs/css/style.css` — flat grayscale tokens, light/dark, reduced motion
- `docs/js/engine.js` — tween/easing engine (from Rocks + Matches)
- `docs/js/fx.js` — sparks, embers, smoke, rings, dust puffs
- `docs/js/scene.js` — landscape/portrait layout
- `docs/js/rocks.js`, `wood.js`, `match.js` — the steps
- `docs/js/flow.js` — step order, progress dots, dusk, reset, render loop
