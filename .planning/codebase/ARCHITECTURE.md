# Architecture: Vetor Trading Platform

**Mapped:** 2026-06-15
**Focus:** System pattern, layers, data flow, abstractions, entry points

---

## System Overview

The codebase is a **high-fidelity design prototype**, not a production application. The architecture is intentionally temporary — built to demonstrate UX and design system before the real React application is built.

```
┌─────────────────────────────────────────────┐
│         Plataforma Vetor v3.dc.html          │  ← Entry point (prototype)
│   (markup + CDN React/Babel/ECharts)         │
└──────────────────┬──────────────────────────┘
                   │ loads
┌──────────────────▼──────────────────────────┐
│              support.js                      │  ← dc-runtime (prototype engine)
│   DCLogic | Theme System | Navigation        │
│   Screen Manager | State Class Bridge        │
└──────────────────┬──────────────────────────┘
                   │ mounts into
┌──────────────────▼──────────────────────────┐
│           React Components (CDN)             │  ← PaletteSelector.jsx + inline JSX
│   (transpiled in-browser via Babel CDN)      │
└──────────────────┬──────────────────────────┘
                   │ reads tokens from
┌──────────────────▼──────────────────────────┐
│         Blue Hour Design System              │  ← Token contract
│   palettes.js → build-tokens.py → tokens.css │
│   Alias Bridge | WCAG Audit                  │
└─────────────────────────────────────────────┘
```

---

## Architecture Pattern

**Pattern:** Prototype-Runtime + Design System Separation

This is NOT a standard SPA or MPA. Key characteristics:
- A single monolithic HTML file is the entire "application"
- A custom dc-runtime (`support.js`) handles all state, navigation, and theme switching
- React is used only for the `PaletteSelector` component (isolated widget)
- Design tokens flow from `palettes.js` → Python build → CSS output

**This architecture must NOT be ported to production.** The real application should be a standard React/Next.js SPA consuming the design system's token output.

---

## Layers

| Layer | Files | Responsibility |
|-------|-------|----------------|
| Entry Point | `Plataforma Vetor v3.dc.html` | Full prototype markup, CDN imports, JSX inline |
| Runtime Engine | `support.js` | State, navigation, theme switching, event wiring |
| React Widget | `PaletteSelector.jsx` | Isolated theme selector component |
| Design System | `blue-hour-design-system/` | Token generation pipeline |
| Token Output | `tokens.css` (generated) | CSS custom properties consumed by all layers |
| Planning Docs | `.planning/`, `.interface-design/` | Non-code artifacts |

---

## Key Abstractions

### DCLogic (`support.js`)
The central state machine for the prototype. Manages:
- Screen/view transitions (simulated routing)
- Active state tracking (~190 CSS class toggles on `<body>`)
- Event delegation for all interactive elements

### Token Contract (`blue-hour-design-system/palettes.js`)
Defines the color token schema. This is the single source of truth for:
- Base palette colors
- Semantic aliases (profit/loss, primary/secondary)
- Theme variants (light/dark)

**Breaking this file breaks all colors everywhere.**

### Alias Bridge (design system)
Maps legacy token names to current token names. Exists to support incremental migration without breaking existing CSS references.

### CSS State Classes
The prototype uses CSS classes on `<body>` and parent elements to drive UI state:
- Active screen: `body.screen--dashboard`, `body.screen--robots`, etc.
- Active theme: `body.theme--dark`, `body.theme--light`
- Modal state: `body.modal--open`

This pattern is prototype-specific. The real app will use React state/context.

---

## Data Flows

### Page Boot
```
HTML loads → CDN scripts resolve → support.js initializes DCLogic
→ Default state classes applied to <body>
→ PaletteSelector React component mounted into #palette-selector-root
→ tokens.css custom properties active
→ Prototype interactive
```

### Theme Switch
```
User selects theme in PaletteSelector
→ PaletteSelector fires callback
→ DCLogic updates body class (e.g. body.theme--blue-hour)
→ CSS custom properties resolve to new palette
→ All themed elements update via cascade
```

### Screen Navigation
```
User clicks nav item
→ DCLogic intercepts click (event delegation)
→ Removes current screen class from <body>
→ Adds new screen class to <body>
→ CSS shows/hides screens via .screen--X visibility rules
→ URL hash optionally updated
```

---

## Component Map

| Component | File | Purpose |
|-----------|------|---------|
| Platform Shell | `Plataforma Vetor v3.dc.html` | Full prototype UI (sidebar, screens, modals) |
| dc-Runtime | `support.js` | State machine, navigation, theme bridge |
| Palette Selector | `PaletteSelector.jsx` | React theme picker widget |
| Token Builder | `blue-hour-design-system/build-tokens.py` | Generates tokens.css from palettes.js |
| Palette Registry | `blue-hour-design-system/palettes.js` | Color palette definitions |
| Design Reference | `.interface-design/` | Static design assets (not rendered) |

---

## Entry Points

| Entry Point | Type | Notes |
|-------------|------|-------|
| `Plataforma Vetor v3.dc.html` | Browser open | Main prototype — open directly in browser |
| `blue-hour-design-system/build-tokens.py` | `python build-tokens.py` | Regenerate tokens.css after palette changes |

---

## Hard Constraints

1. **`tokens.css` is generated — never edit manually.** Changes are overwritten by `build-tokens.py`.
2. **dc-runtime (`support.js`) is prototype-only.** Do not port to production.
3. **Style holes are mount-only.** CSS injection points in the prototype have fixed mount locations.
4. **React is CDN + in-browser Babel.** Not suitable for production (slow, no tree-shaking).

---

## Anti-Patterns (prototype-specific, do not carry forward)

- Inline style attribute manipulation for theme state (use CSS custom properties in production)
- Raw hex colors outside the token system (use semantic tokens only)
- Misusing profit/loss semantic colors for non-financial UI elements
- `new Function()` / `eval()` in runtime code (security risk)
- Event handling via `stopPropagation` broadly (fragile, hard to debug)

---

*Last updated: 2026-06-15*
