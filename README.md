# Electoral Map Studio

A fully customizable electoral map builder. Opens loaded with the real, certified 2024
presidential result and current Senate composition — paint over it to build any scenario:
a fictional future election, an alternate-history "what if," or just a personal prediction.

**[Live demo](https://zachzc3.github.io/electoral-map-studio/)**

## Features

- **President tab** — real US state shapes (not a cartogram), click to paint a state for
  the selected party, right-click to clear, double-click for a detail panel (edit electoral
  votes, include/exclude a state entirely, or set its winner directly)
- **Fully custom parties** — up to 6, each with its own name, abbreviation, and color
- **Safe / Likely / Lean / Tilt** confidence grading per state, like a real forecast map
- **Maine & Nebraska congressional-district splits** modeled as their own 1-EV chips,
  alongside each state's 2 at-large votes
- **House tab** — 12th Amendment contingent-election simulator (1 vote per state delegation,
  real 2020-census apportionment, top-3 electoral-vote finishers eligible)
- **Senate tab** — 100-seat grid seeded from real current party control, VP contingent-election
  rules (top-2 eligible), quick scenario presets
- Toggling a state out of the election dynamically recomputes electoral votes, House seats,
  and Senate seats everywhere else in the tool
- State persists in your browser's `localStorage` — no backend, no account, nothing leaves
  your device

## Data sources

- 2024 presidential result, 2020-census electoral vote / House apportionment, and current
  Senate party control: verified against public certified results.
- State shapes: [Blank US Map (states only)](https://commons.wikimedia.org/wiki/File:Blank_US_Map_(states_only).svg),
  public domain, via Wikimedia Commons.

## Running locally

No build step. Just open `index.html` in a browser, or serve the folder with any static
file server (e.g. `python -m http.server`).

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell |
| `style.css` | All styling |
| `state_paths.js` | Real US state boundary SVG path data |
| `app.js` | All interactive logic — data, rendering, event handling |
