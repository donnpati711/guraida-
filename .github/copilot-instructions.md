# Copilot instructions for this repository

## Project overview

This repository is a lightweight browser game called SKYBOUND. It is intentionally dependency-free and built as a static web app:

- `index.html` defines the page structure, HUD, overlay panels, and the `<canvas>` used for the flight scene.
- `style.css` contains all layout, theming, and game UI styling; it uses a small set of CSS custom properties and a fixed 16:9 game-frame layout.
- `game.js` contains the full game logic: canvas rendering, upgrade system, costume shop, event mechanics, progression saved in `localStorage`, and the main animation loop.

The app is designed to run directly in a browser without a bundler, build step, or framework.

## Commands

There are no package.json, npm scripts, lint configuration, or automated test runner in this repo.

Typical local run:

```bash
cd /workspaces/guraida-
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

If you need a quick smoke check without browser automation, serve the directory and confirm the page loads; there is no formal test suite to run.

Single-test guidance: not applicable; this repository has no automated tests.

## Architecture notes

The game is organized around a few central patterns:

- `state` is the main mutable game state object in `game.js`: active/ended flags, camera position, altitude, glider position, speed, vertical speed, pitch, distance, and event timing.
- The main rendering loop uses `requestAnimationFrame(frame)`, with `update(delta)` and `draw()` split into simulation and visual stages.
- Progression is persisted via `localStorage` using the `skybound-progress` key; the `loadProgress()` and `saveProgress()` helpers are the canonical source of truth for upgrades, owned cosmetics, and selected gear.
- Upgrades are centralized in the `upgrades` object, with each entry including button references and a cost formula based on `baseCost` and the current level.
- Costumes are represented as arrays (`pilotCostumes`, `gliderCostumes`) and rendered dynamically through `renderCostumeCategory()`. This preserves a single source of truth for available skins and purchased items.
- Terrain and thermal generation are deterministic enough for a simple arcade loop: `groundHeight(worldX)` drives terrain curvature, `thermals` drive lift, and event states (`tailwind`, `thermal`, `coins`) modulate gameplay.

## Conventions specific to this codebase

- Keep the DOM IDs and selectors aligned with the HTML; most game logic starts by querying specific elements like `#game`, `#overlay`, `#start-button`, and the HUD IDs in `index.html`.
- Do not introduce a framework or bundler for small UI/game changes. The project is intentionally plain HTML/CSS/JS and should stay that way unless there is a clear project-wide reason to add tooling.
- When adding new gameplay systems, prefer extending the existing `state` object and `upgrades`/costume data patterns instead of introducing a new state management layer.
- Use the established localStorage pattern for progression. Do not store progress in globals or ad hoc variables outside of the existing `progress` object.
- Game resets and starting states are driven by `resetFlight()`, which reinitializes `state`, places thermals, and starts the animation loop. Preserve this central reset flow when changing startup or difficulty behavior.
- Keep visual work synchronized with the canvas and HUD: if you change a game stat, also update the corresponding DOM element (`altitudeDisplay`, `distanceDisplay`, `speedDisplay`, etc.) in the same logic path.
- UI overlays and shop interactions are intentionally modalized via `overlay` and `costumeOverlay`; maintain those patterns when adding new menu flows.

## Working style for changes

- Favor surgical edits in the existing files instead of creating new modules unless the feature clearly warrants it.
- Preserve the arcade presentation and Japanese UI copy unless a change intentionally targets a new localization or UX direction.
- Use the existing naming conventions (`state`, `progress`, `upgrades`, `pilotCostumes`, `drawGlider`, etc.) to stay consistent with the codebase.
- When testing behavior manually, use the browser and confirm the flow of a flight session, upgrade purchase, costume selection, and landing/coin award.

## Notes for future Copilot sessions

This repo is a static browser game rather than a typical app with build/deploy tooling. The fastest path to validating gameplay is serving the directory locally and checking the actual in-browser behavior rather than expecting a CI/test pipeline.
