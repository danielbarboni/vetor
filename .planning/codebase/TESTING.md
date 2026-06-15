# Testing: Vetor Trading Platform

**Mapped:** 2026-06-15
**Focus:** Test framework, structure, mocking patterns, coverage

---

## Summary

**No automated test suite exists.** The codebase is a design prototype with zero test coverage. All validation is manual (visual inspection, browser testing of the HTML prototype).

---

## Test Framework

| Layer | Framework | Status |
|-------|-----------|--------|
| JavaScript/JSX | None | Not configured |
| Python (build-tokens.py) | None | Not configured |
| E2E / Browser | None | Not configured |
| CI/CD | None | No pipeline detected |

No `package.json`, no `pytest.ini`, no `vitest.config`, no test runner of any kind.

---

## Existing Quasi-Testing

### WCAG Audit Guard (`blue-hour-design-system/build-tokens.py`)

The only automated validation in the project is a partial WCAG contrast audit inside `build-tokens.py`:

```python
# AUDIT list checks contrast ratios for color token generation
# Not a formal test — runs as part of token build step
```

- Checks that generated color tokens meet accessibility contrast thresholds
- Runs during token build, not on demand
- Not a substitute for a test suite

---

## Coverage

| File | Coverage | Notes |
|------|----------|-------|
| `support.js` | 0% | DCLogic, theme system, navigation — untested |
| `PaletteSelector.jsx` | 0% | React component — untested |
| `Plataforma Vetor v3.dc.html` | 0% | Prototype HTML — manual only |
| `blue-hour-design-system/build-tokens.py` | ~partial | WCAG guard only |
| `blue-hour-design-system/palettes.js` | 0% | Theme contract — untested |

---

## Highest-Priority Testing Gaps

1. **`palettes.js` public API** — defines the theme token contract; breakage silently corrupts all colors
2. **`build-tokens.py` color math** — WCAG guard may miss edge cases in generated tokens
3. **`support.js` DCLogic** — screen navigation and state transitions are untested
4. **`PaletteSelector.jsx`** — theme switching logic has no component tests

---

## Recommended Test Stack (when adding tests)

```
Vitest + jsdom    → JavaScript/JSX unit and component tests
pytest            → Python build-tokens.py tests
Playwright        → E2E browser tests for the prototype
```

### Suggested Setup

```json
// package.json additions
{
  "devDependencies": {
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "jsdom": "^25.x",
    "@playwright/test": "^1.x"
  },
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

---

## Mocking Patterns

None established. When tests are added:
- Mock `fetch` calls for API integrations (MetaTrader, broker data)
- Use `jsdom` for DOM-dependent `support.js` logic
- Stub token CSS imports in component tests

---

## Testing Conventions to Establish

- Test files: `*.test.ts` or `*.spec.ts` co-located with source
- Python tests: `tests/` directory alongside `blue-hour-design-system/`
- E2E tests: `e2e/` directory at project root

---

*Last updated: 2026-06-15*
