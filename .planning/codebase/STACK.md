# Technology Stack

**Analysis Date:** 2026-06-15

## Languages

**Primary:**
- HTML5 — High-fidelity prototype (`Plataforma Vetor v3.dc.html`); single-file design reference
- JavaScript (ES2020+) — All UI logic, state management, and runtime helpers
- JSX — React component for palette selector (`PaletteSelector.jsx`, `blue-hour-design-system/PaletteSelector-7e95c912.jsx`)
- CSS (Custom Properties) — Design token system; no preprocessor; all variables defined in `blue-hour-design-system/tokens/tokens.css`

**Secondary:**
- Python 3 — Token build script (`blue-hour-design-system/build-tokens.py`); generates `tokens.css` and `tokens.json` from palette definitions; not a runtime dependency

## Runtime

**Environment:**
- Browser (no Node.js runtime in prototype)
- The prototype (`Plataforma Vetor v3.dc.html`) is a self-contained HTML file loaded directly in a browser

**DC Runtime:**
- `support.js` — Compiled bundle from `dc-runtime/src/*.ts` (TypeScript source, output is a plain JS IIFE)
- Build note: `support.js` header says "Rebuild with `cd dc-runtime && bun run build`" — uses **Bun** as build tool for the runtime bundle

**Package Manager:**
- No `package.json` present in this repository (prototype phase)
- Token generator uses Python 3 directly (`python3 build-tokens.py`)
- DC runtime build uses **Bun** (`bun run build`)
- Lockfile: Not present

## Frameworks

**Core (Prototype):**
- **dc-runtime** (custom, internal) — Template engine: `{{ }}` interpolation, `<sc-for>`, `<sc-if>` directives; `Component extends DCLogic` class exposes state via `renderVals()`. Source at `dc-runtime/src/*.ts`. **Not to be ported** — use as specification only.

**UI Component (Reference):**
- **React** (version loaded from `window.React` global; no package version pinned in repo) — Used only for `PaletteSelector.jsx`; consumed via CDN global in prototype

**Recommended Production Stack (per README):**
- **React + Vite** — Explicitly recommended as target framework for production implementation

**Build/Dev:**
- **Bun** — Bundler for `dc-runtime` TypeScript → `support.js`
- **Python 3** — Token generation pipeline (`build-tokens.py` → `tokens.css` + `tokens.json`)

## Key Dependencies

**Critical (CDN, prototype):**
- **Apache ECharts 5.5.1** — Charting library; candlestick + volume charts on the Gráfico screen
  - Loaded via: `https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js`
  - In production: install as npm package dependency

**Fonts (CDN, Google Fonts):**
- **Sora** (weights 400, 600, 700) — Display/heading typography
- **Inter** (weights 400, 500, 600) — Body text
- **JetBrains Mono** (weights 400, 600) — Numbers, monospaced data
- Loaded via: `https://fonts.googleapis.com`

**Design System:**
- **Blue Hour Design System v2.1** — Internal; 51 palettes × 2 modes (dark/light) = 102 themes
  - Tokens source of truth: `blue-hour-design-system/tokens/tokens.css`
  - JSON tokens: `blue-hour-design-system/tokens/tokens.json`
  - Theme runtime: `blue-hour-design-system/palettes.js` (ES module; exports `PALETTES`, `setTheme`, `getTheme`, `initTheme`)
  - Tailwind mapping: `blue-hour-design-system/tailwind.config.js`

**Infrastructure:**
- **Tailwind CSS** (optional) — Config provided in `blue-hour-design-system/tailwind.config.js`; maps all Blue Hour tokens to Tailwind utilities. Not used in the prototype itself; provided for production integration.

## Configuration

**Environment:**
- No `.env` files present (prototype phase; no server-side code)
- No environment variables required to run the prototype

**Build:**
- Token generation: `python3 blue-hour-design-system/build-tokens.py` — regenerates `tokens/tokens.css` and `tokens/tokens.json`; never edit those files manually
- DC runtime bundle: `cd dc-runtime && bun run build` — regenerates `support.js`; never edit `support.js` manually

**Theme Contract:**
- Applied via HTML attributes: `<html data-palette="<palette-id>" data-theme="dark|light">`
- Palette persistence: `localStorage` via `palettes.js` `initTheme()`
- Available palette IDs: `blue-hour`, `cosmos-candy`, `neon-circuit`, `heritage-mode`, `wisteria-soft`, `graphite-minimal`, `vermilion-studio` (7 curated) + 44 algorithmically generated (see `palettes.js`)

## Platform Requirements

**Development:**
- Python 3 (token generation)
- Bun (dc-runtime rebuild)
- Modern browser with ES2020+ support

**Production (recommended):**
- React + Vite application
- Node.js ecosystem
- Apache ECharts installed as npm dependency (`echarts@5.5.1`)
- Google Fonts loaded (Sora, Inter, JetBrains Mono)
- `blue-hour-design-system/tokens/tokens.css` imported globally
- `blue-hour-design-system/palettes.js` imported for theme switching

---

*Stack analysis: 2026-06-15*
