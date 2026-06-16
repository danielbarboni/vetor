---
phase: 01-mvp-nucleo-de-trading
plan: "01"
subsystem: frontend
tags: [scaffold, design-system, shell, ui-primitives, react, vite, typescript]
dependency_graph:
  requires: []
  provides:
    - frontend/src/lib/supabase.ts
    - frontend/src/lib/theme.ts
    - frontend/src/components/shell/AppShell.tsx
    - frontend/src/components/shell/Sidebar.tsx
    - frontend/src/components/shell/TopHeader.tsx
    - frontend/src/components/ui/Button.tsx
    - frontend/src/components/ui/Badge.tsx
    - frontend/src/components/ui/Toggle.tsx
    - frontend/src/components/ui/SegmentControl.tsx
    - frontend/src/components/ui/Modal.tsx
    - frontend/src/components/ui/Input.tsx
    - frontend/src/types/index.ts
  affects: []
tech_stack:
  added:
    - react@19.2.7
    - react-dom@19.2.7
    - vite@8.0.16
    - "@supabase/supabase-js@2.108.2"
    - zustand@5.0.14
    - "@tanstack/react-query@5.101.0"
    - react-router-dom@^6
    - lucide-react
    - echarts@6.1.0
    - tailwindcss@^3 (token config only)
    - vitest + @testing-library/react
    - eslint + @typescript-eslint + eslint-plugin-react-hooks
    - prettier
  patterns:
    - Blue Hour tokens.css @imported in index.css; initTheme() called in main.tsx sets data-palette/data-theme on documentElement
    - CSS alias map (--bg, --surface, --surface2, etc.) in :root for component use
    - Inline styles + CSS custom properties only in components; no Tailwind utility classes
    - Single Supabase client instance (lib/supabase.ts)
    - Active nav derived from useLocation — no dc-runtime class toggling
key_files:
  created:
    - frontend/package.json
    - frontend/vite.config.ts
    - frontend/tsconfig.json + tsconfig.app.json + tsconfig.node.json
    - frontend/tailwind.config.js
    - frontend/postcss.config.js
    - frontend/eslint.config.js
    - frontend/.prettierrc
    - frontend/.gitignore
    - frontend/.env.example
    - frontend/index.html
    - frontend/vitest.config.ts
    - frontend/src/vite-env.d.ts
    - frontend/src/test-setup.ts
    - frontend/src/index.css
    - frontend/src/main.tsx
    - frontend/src/App.tsx
    - frontend/src/lib/supabase.ts
    - frontend/src/lib/theme.ts
    - frontend/src/components/shell/AppShell.tsx
    - frontend/src/components/shell/Sidebar.tsx
    - frontend/src/components/shell/TopHeader.tsx
    - frontend/src/components/ui/Button.tsx + Button.test.tsx
    - frontend/src/components/ui/Badge.tsx + Badge.test.tsx
    - frontend/src/components/ui/Toggle.tsx + Toggle.test.tsx
    - frontend/src/components/ui/SegmentControl.tsx + SegmentControl.test.tsx
    - frontend/src/components/ui/Modal.tsx + Modal.test.tsx
    - frontend/src/components/ui/Input.tsx
    - frontend/src/types/index.ts
    - blue-hour-design-system/palettes.d.ts
  modified: []
decisions:
  - "@vitejs/plugin-react@6.x required (v4.x only supports vite up to v7; v6.x adds vite 8 support)"
  - "palettes.d.ts added to blue-hour-design-system/ to provide TypeScript declarations for the JS module"
  - "allowJs:true in tsconfig.app.json to allow TS to resolve .js with .d.ts sibling"
  - "Sora 700 used for logo mark (plan spec says 800 but README.md binding loads only 600/700)"
  - "Outlet in AppShell.tsx, Routes in App.tsx (correct separation of layout vs routing)"
metrics:
  duration: "~35 minutes"
  completed_date: "2026-06-16"
  tasks_completed: 3
  tasks_total: 3
  files_created: 34
---

# Phase 01 Plan 01: Frontend Scaffold Summary

**One-liner:** Vite 8 + React 19 + TypeScript frontend with Blue Hour token-driven theming, pixel-faithful app shell (sidebar/header/gradient), and 6 tested UI primitives backed by shared TypeScript contracts.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Scaffold Vite+React+TS + Blue Hour wiring | 80fe090 | DONE |
| 2 | App shell (sidebar, top header, gradient) + route stubs | c8573ca | DONE |
| 3 | Canonical UI primitives + shared types (TDD) | 7b9e5e8 | DONE |

## Verification Results

- `npm run build` — exits 0, 1688 modules transformed, 251KB bundle
- `npx vitest run src/components/ui` — 33 tests pass across 5 test files
- `grep initTheme src/main.tsx` — matches
- `grep tokens.css src/index.css` — matches
- `grep createClient src/lib/supabase.ts` — matches
- `grep "export interface Robot" src/types/index.ts` — matches
- `grep radial-gradient src/components/shell/AppShell.tsx` — matches
- `grep VETOR src/components/shell/Sidebar.tsx` — matches

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @vitejs/plugin-react version incompatibility**
- **Found during:** Task 1 npm install
- **Issue:** `@vitejs/plugin-react@4.x` peer-requires `vite@^4–7`; plan uses `vite@8.0.16`
- **Fix:** Updated to `@vitejs/plugin-react@6.0.2` which adds vite 8 peer support
- **Files modified:** `frontend/package.json`
- **Commit:** 80fe090

**2. [Rule 3 - Blocking] palettes.js missing TypeScript declaration**
- **Found during:** Task 1 build
- **Issue:** `blue-hour-design-system/palettes.js` has no `.d.ts`; TS7016 implicit `any` error
- **Fix:** Created `blue-hour-design-system/palettes.d.ts` with full type declarations; added `allowJs:true` to `tsconfig.app.json`
- **Files modified:** `blue-hour-design-system/palettes.d.ts` (new), `frontend/tsconfig.app.json`
- **Commit:** 80fe090

**3. [Rule 3 - Blocking] vite.config.ts used `__dirname` (CJS-only)**
- **Found during:** Task 1 build
- **Issue:** `tsconfig.node.json` targets ESM; `__dirname` and `path.resolve` are CJS patterns
- **Fix:** Switched to `fileURLToPath(new URL('./src', import.meta.url))` pattern; added `@types/node` dev dep
- **Files modified:** `frontend/vite.config.ts`, `frontend/vitest.config.ts`, `frontend/tsconfig.node.json`
- **Commit:** 80fe090

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Live quote widget (price, symbol) | `TopHeader.tsx` | Static placeholder — wired to FastAPI WS tick stream in plan 01-05 |
| Mode toggle state | `TopHeader.tsx` | Static MODO SIMULADO active — wired to robot context in plan 01-03 |
| User row (name, avatar) | `Sidebar.tsx` | Static "Usuário" — wired to Supabase auth in plan 01-02 |
| Nav badge (robot count) | `Sidebar.tsx` | Static — wired when robot list is implemented in plan 01-03 |

These stubs do not block the plan's goal (scaffold + shell visible + primitives tested).

## Threat Flags

None — this plan creates no network endpoints, auth paths, or trust-boundary-crossing patterns. All new surfaces are client-only UI components.

## Self-Check: PASSED

- `frontend/src/lib/supabase.ts` — EXISTS
- `frontend/src/main.tsx` — EXISTS
- `frontend/src/components/shell/AppShell.tsx` — EXISTS
- `frontend/src/types/index.ts` — EXISTS
- Commit 80fe090 — EXISTS
- Commit c8573ca — EXISTS
- Commit 7b9e5e8 — EXISTS
