# Coding Conventions

**Analysis Date:** 2026-06-15

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `PaletteSelector.jsx`, `blue-hour-design-system/PaletteSelector-7e95c912.jsx`)
- JavaScript modules: camelCase or kebab-case (e.g., `palettes.js`, `support.js`, `build-tokens.py`)
- Config files: kebab-case (e.g., `tailwind.config.js`, `tokens.css`, `tokens.json`)
- HTML prototypes: PascalCase with version suffix (e.g., `Plataforma Vetor v3.dc.html`)
- Design system docs: kebab-case markdown (e.g., `design-system.md`)

**Functions:**
- camelCase throughout (e.g., `parseDcDocument`, `parseDcText`, `parseDataProps`, `dcNameFromPath`, `readStore`, `writeStore`, `getTheme`, `setTheme`, `initTheme`)
- Utility helpers: short descriptive camelCase (e.g., `sparkPath`, `tint`, `safeDecode`, `localStorageHas`)
- Python utilities: snake_case (e.g., `h2rgb`, `rgb2hex`, `hls_of`, `from_hls`, `mix`, `rgba`, `luminance`, `contrast`, `nudge_primary`)

**Variables:**
- camelCase for locals and parameters (e.g., `rootName`, `hostEl`, `bootPath`, `scriptEl`)
- SCREAMING_SNAKE_CASE for module-level constants (e.g., `BASE_CSS`, `FULL_PAGE_CSS`, `IDENT_RE`, `NUMBER_RE`, `PALETTES`, `DEFAULTS`, `KEY`)
- Single-letter variables only for mathematical/geometric helpers (e.g., `X`, `Y`, `mn`, `mx`, `w`, `h`, `r`, `g`, `b`)

**Types/Identifiers:**
- React component names: PascalCase (e.g., `PaletteSelector`, `MiniDashboard`, `Check`, `StandaloneRoot`)
- CSS class prefixes: kebab-case with component prefix (e.g., `ps-card`, `ps-mode`, `sc-placeholder`, `sc-interp`, `sc-host`, `dc-root`)
- HTML data attributes: kebab-case (e.g., `data-palette`, `data-theme`, `data-dc-script`, `data-props`, `data-pid`)
- Design token CSS variables: `--color-*`, `--shadow-*`, `--gradient-*`, `--chart-*`

**IDs:**
- Palette IDs: kebab-case (e.g., `blue-hour`, `cosmos-candy`, `neon-circuit`, `heritage-mode`)
- localStorage keys: short kebab-case constant (e.g., `bh-theme`)

## Code Style

**Formatting:**
- No ESLint, Prettier, or Biome config files detected — no automated formatter enforced
- 2-space indentation throughout JS/JSX files
- Single quotes in `palettes.js` module; double quotes in `PaletteSelector.jsx` JSX
- Semicolons omitted in `palettes.js`; present in `support.js` (generated file)
- Arrow functions preferred over `function` declarations for components and callbacks
- Trailing commas in multi-line object/array literals

**Linting:**
- No linting configuration detected in the repository
- Code quality enforced by authoring convention only

## Import Organization

**In `palettes.js` (ES module):**
- Named exports at top of file (no imports — self-contained module)
- Pattern: `export const`, `export function`

**In `PaletteSelector.jsx` (prototype runtime):**
- Destructures from global `React` at file top:
  ```js
  const { useState, useEffect, useRef, useCallback } = React;
  ```
- No `import` statements — runs in browser global context (React loaded via CDN/`window.React`)
- Exports via `module.exports` at bottom for prototype runtime compatibility

**In `support.js` (generated bundle):**
- IIFE bundle — no imports; all code namespaced inside `(() => { ... })()`
- Header comment marks file as generated: `// GENERATED from dc-runtime/src/*.ts — do not edit.`

**Path Aliases:**
- Not applicable — no bundler/module resolution config present in repo root

## Error Handling

**Patterns:**
- `try/catch` with silent fallback for localStorage operations:
  ```js
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* in-memory only */ }
  ```
- `try/catch` with fallback return value for JSON parsing:
  ```js
  try { parsed = JSON.parse(raw); } catch { return { props: null, preview: null }; }
  ```
- Guard clauses with early `return null` for missing DOM elements:
  ```js
  const dc = doc.querySelector("x-dc");
  if (!dc) return null;
  ```
- `throw new Error(...)` with descriptive message for missing critical globals:
  ```js
  if (!R) throw new Error("dc-runtime: window.React is not available yet");
  ```
- Optional chaining `?.` used liberally to avoid null errors:
  ```js
  scriptEl?.getAttribute("data-props") ?? null
  ```
- `.catch(() => {})` for non-critical async fetch failures (silent swallow)

## Logging

**Framework:** None — no logging library detected

**Patterns:**
- No `console.log` / `console.warn` in production code paths
- Python build script collects audit warnings into a module-level `AUDIT = []` list and prints at end of build
- Errors surfaced to UI via `.sc-logic-error` DOM element (injected inline CSS, not console)

## Comments

**When to Comment:**
- File-level JSDoc block at top of every module, describing purpose, integration contract, and usage example:
  ```js
  /**
   * Blue Hour DS · palettes.js
   * Runtime de troca de tema. Requer tokens/tokens.css carregado.
   * Contrato: <html data-palette="..." data-theme="dark|light">
   *
   * Uso:
   *   import { PALETTES, setTheme, getTheme, initTheme } from './palettes.js';
   */
  ```
- Inline comments on non-obvious logic in Portuguese (project language is PT-BR):
  ```js
  /* Contrato do design system: os atributos no <html> trocam o tema inteiro. */
  /* Navegação por setas no radiogroup */
  ```
- Generated files marked clearly: `// GENERATED from dc-runtime/src/*.ts — do not edit.`
- Section separators in Python with `# ====...====` banner comments

**JSDoc/TSDoc:**
- Used at file/module level only; individual functions are not JSDoc-annotated

## Function Design

**Size:** Functions kept small and single-purpose. Utility functions (e.g., `resolve`, `findTopLevelEquality`, `parensWrapWhole`) are each under 30 lines.

**Parameters:**
- Destructured object params for config-style calls: `setTheme({ palette, mode } = {})`
- Optional props pattern with default via destructuring: `function PaletteSelector({ initialPalette, initialMode, onChange } = {})`
- DOM utilities accept explicit `doc` param with `document` as default: `function boot(runtime, doc = document)`

**Return Values:**
- Functions return `null` (not `undefined`) when no result is found — consistent null-as-sentinel pattern
- State-mutating functions return the new state for optional chaining by caller: `return setTheme(saved)`

## Module Design

**Exports:**
- `palettes.js`: named ES module exports (`export const`, `export function`) — no default export
- `PaletteSelector.jsx`: `module.exports = PaletteSelector` (CJS-style for prototype runtime)
- `support.js`: self-registering IIFE; exposes runtime via `window` globals

**Barrel Files:** None detected — each module is consumed directly

## React Patterns

**Hooks:**
- `useState` with initializer function (lazy init) for reading DOM attributes at mount:
  ```js
  const [palette, setPalette] = useState(() => {
    const candidate = initialPalette || readAttr("data-palette", "blue-hour");
    return PALETTES.some((p) => p.id === candidate) ? candidate : "blue-hour";
  });
  ```
- `useEffect` for side effects (DOM attribute sync, subscriptions)
- `useCallback` for stable event handler references passed to child elements
- `useRef` for imperative DOM access (focus management in radiogroup)

**Component Structure:**
- Helper components (`MiniDashboard`, `Check`) defined as plain functions above the primary component
- No class components — function components only
- Inline styles used extensively alongside Tailwind utility classes (inline styles carry dynamic token values; Tailwind handles layout)

## Design System Contract

- Theme switching contract: set `<html data-palette="..." data-theme="dark|light">` attributes — CSS custom properties in `tokens/tokens.css` respond automatically
- Token CSS variables follow `--color-{role}` naming (e.g., `--color-bg`, `--color-primary`, `--color-profit`, `--color-loss`)
- Tailwind config at `blue-hour-design-system/tailwind.config.js` maps token variables to utility class names
- Typography stack: `Sora` (display/headings), `Inter` (body), `JetBrains Mono` (numeric/data)
- P&L colors (`profit`/`loss`) are reserved — never used for primary or accent; enforced by build script constraint

---

*Convention analysis: 2026-06-15*
