# Concerns: Vetor Trading Platform

**Mapped:** 2026-06-15
**Focus:** Tech debt, known bugs, security, performance, fragile areas

---

## Tech Debt

| # | Item | Severity | Notes |
|---|------|----------|-------|
| 1 | dc.html prototype runtime must NOT be ported | Critical | `support.js` dc-runtime is prototype-only; real app needs a proper React architecture |
| 2 | Copy-based versioning (no git branching for designs) | Medium | Design files versioned by copy/rename, not source control |
| 3 | Generated token files committed to repo | Medium | `tokens.css` and related output should be gitignored; generated at build time |
| 4 | Duplicate `PaletteSelector` with hash | Medium | `PaletteSelector.jsx` appears to have a duplicate version with trailing hash in filename |
| 5 | ~190 inline style state points | Medium | State managed via CSS class toggling on ~190 elements; systemically fragile |
| 6 | Legacy CSS token alias bridge | Low | Alias bridge exists to map old token names to new — adds complexity |

---

## Known Bugs

| Bug | Status | Impact |
|-----|--------|--------|
| 3 of 7 strategy editors incomplete (Tangram, Fibonacci, RenkoBot) | Open | Core feature gap — placeholders shown |
| SmarttPlay player not implemented | Open | Empty panel, feature missing entirely |
| Wizard "Saiba Mais" modals missing | Open | Info modals not implemented in onboarding flow |
| Hardcoded pulse animation color | Open | Uses raw hex instead of design token — breaks in dark mode |
| Placeholder/synthetic video content | Open | All media is placeholder; no real content pipeline |
| Intermittent "Illegal invocation" error | Open | Sporadic JS error, likely `this`-binding issue in dc-runtime callbacks |

---

## Security

| Issue | Severity | Location | Notes |
|-------|----------|----------|-------|
| `new Function()` / `eval` in runtime | High | `support.js` | Dynamic code execution; XSS vector if user input ever reaches it |
| `innerHTML` assignment | High | `support.js`, prototype | Direct HTML injection; sanitize before any real data is used |
| `postMessage` with wildcard origin (`*`) | Medium | `support.js` | Should be scoped to known origins in production |
| `window.print()` PDF export | Low | Prototype | No concern now; note for future print-to-PDF feature |
| CSV Blob URL override risk | Low | Export logic | Client-side CSV generation; validate column boundaries before production |

**Action required before production:** Audit and replace all `new Function`/`eval` and `innerHTML` usages.

---

## Performance

| Issue | Impact | Location |
|-------|--------|----------|
| 102 CSS theme blocks loaded upfront | Medium | All themes pre-loaded in DOM; only active theme should be injected |
| ECharts via CDN (no bundling) | Medium | `Plataforma Vetor v3.dc.html` — blocking CDN dependency |
| React via CDN UMD | Medium | Same file — not tree-shakeable, large bundle |
| Google Fonts `@import` inside component body | Low | `PaletteSelector.jsx` — should be in document `<head>` |
| All data is synthetic/seeded | N/A now | Performance with real broker data volumes unknown |

---

## Fragile Areas

| Area | Why Fragile | File |
|------|-------------|------|
| Monolithic state class on `<body>` | ~190 class toggles; one wrong class breaks multiple features | `support.js` |
| `stopPropagation` pattern | Event bubbling suppressed broadly; subtle interaction bugs possible | `support.js` |
| ECharts `init`/`dispose` in `componentDidUpdate` | Race condition risk on rapid re-renders | `PaletteSelector.jsx` |
| CSS class-map pattern | Theme colors mapped via class lookups; breaks if class naming drifts | Design system |
| dc_js string escaping rules | Undocumented escaping in dc-runtime template strings | `support.js` |

---

## Scaling Limits

- **1000-combination backtest cap** — hardcoded limit in strategy editor; may be inadequate for real strategies
- **Inline SVG sparklines on all cards** — non-virtualized; large card grids will be slow

---

## Dependencies at Risk

| Dependency | Risk |
|------------|------|
| `dc-runtime` source not in repo | If `support.js` needs changes, origin source is unavailable |
| Babel via CDN | In-browser transpilation; slow and blocks real production use |
| "SmarttBot" reference in codebase | IP/legal: competitor name referenced; remove before launch |

---

## Missing Critical Features (vs PRD)

These are absent from the prototype entirely — not bugs, just scope not yet built:

- Authentication / user accounts
- Broker integration (MetaTrader 5 or equivalent)
- Real-time market data feed
- Payment processing / subscription
- Persistence layer (database, user data storage)
- Backend API

---

## Test Coverage Gaps

See `TESTING.md` for full detail. Summary: **0% automated test coverage.** No test runner, no test files.

---

*Last updated: 2026-06-15*
