---
phase: 01-mvp-nucleo-de-trading
plan: "06"
subsystem: frontend/robots
tags: [robot-listing, echarts, sparkline, api-client, zustand, tanstack-query]
dependency_graph:
  requires: ["01-01", "01-04", "01-05"]
  provides: ["shared-api-client", "robot-listing-ui", "sparkline-chart"]
  affects: ["01-07", "01-08", "01-10"]
tech_stack:
  added:
    - "echarts@6.1.0 — SVG sparkline renderer for robot cards"
  patterns:
    - "Typed fetch wrapper (lib/api.ts) with Bearer token from auth store"
    - "Zustand for UI filter state; TanStack Query for server data"
    - "Prototype-ported React components (dc-runtime → React state)"
key_files:
  created:
    - frontend/src/lib/api.ts
    - frontend/src/stores/robots.ts
    - frontend/src/components/charts/SparklineChart.tsx
    - frontend/src/components/charts/SparklineChart.test.tsx
    - frontend/src/components/robot-card/RobotCard.tsx
    - frontend/src/components/robot-card/MaisInfo.tsx
    - frontend/src/components/robot-card/ContextMenu.tsx
    - frontend/src/components/robot-card/RobotFilters.tsx
    - frontend/src/pages/robots/RobotList.tsx
  modified:
    - frontend/src/App.tsx
decisions:
  - "ECharts 6.1.0 SVG renderer chosen over inline SVG for sparkline (per Assumption A1 and plan spec)"
  - "Modal component used inline children pattern (no title/footer props in existing Modal)"
  - "Fetch all robots without status filter and do client-side tab filtering to keep tab counts fresh without extra requests"
  - "ASSINADA badge shown only on real-mode robots (mode==='real') as prototype implies"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-16"
  tasks_completed: 3
  tasks_total: 3
  files_created: 9
  files_modified: 1
  tests_added: 10
  tests_total: 58
---

# Phase 01 Plan 06: Robot Listing Screen Summary

**One-liner:** ECharts 6.1.0 sparkline robot cards on /robos with three state tabs, MAIS INFO accordion, per-state context menu + control button, filters/search/grid-list, empty states, CRIAR ROBÔ FAB → wizard, and shared Bearer-auth REST client.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Shared API client + robots store + SparklineChart | 3653e7a | lib/api.ts, stores/robots.ts, SparklineChart.tsx + test |
| 2 | RobotCard + MaisInfo + ContextMenu | 932960b | RobotCard.tsx, MaisInfo.tsx, ContextMenu.tsx |
| 3 | RobotList page + RobotFilters + App.tsx wiring | 2413ff5 | RobotList.tsx, RobotFilters.tsx, App.tsx |

## Verification

- `npm run lint` — PASSED (0 errors)
- `npm run typecheck` — PASSED (0 errors)
- `npm run build` — PASSED (1634 kB bundle; chunk-size warning only — ECharts is large by design)
- `npm run test` (vitest) — PASSED (58 tests, 8 test files)

## Requirements Covered

- ROB-01: Three state tabs EXECUTANDO / PARADOS / ARQUIVADOS with counts
- ROB-02: Robot card with ECharts sparkline, asset/mode badges, position status
- ROB-03: MAIS INFO accordion, context menu, state-varying control button (PARAR/INICIAR/RESTAURAR)
- ROB-04: MAIS INFO shows 4 metrics — Número de trades, Trades com lucro %, Fator de lucro, Drawdown máximo
- ROB-05: Context menu action set varies by status (executando/parado/arquivado)
- ROB-06: Strategy filter, Posicionados toggle, grid/list toggle, name search
- ROB-07: CRIAR ROBÔ button + FAB navigate to /robos/wizard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Modal used inline children (no title/footer props)**
- **Found during:** Task 2 (RobotCard destructive confirms)
- **Issue:** The existing Modal component (plan 01-01) has no `title` or `footer` props — only `children`
- **Fix:** Rendered title, body, and action buttons directly as children inside the modal padding div
- **Files modified:** RobotCard.tsx (confirm modal structure)

None other — plan executed as written.

## Known Stubs

- `RobosWizardStub` in App.tsx at `/robos/wizard` — placeholder heading; wizard implemented in plan 01-07
- `robot.sparkline_data` comes from the API — until plan 01-05 backend delivers real equity snapshots, the API will return `[]` and SparklineChart renders a flat `[0,0]` line (by design — graceful fallback)
- Start/stop endpoints (`/robots/{id}/start`, `/robots/{id}/stop`) defined in lib/api.ts but backend not yet delivered (plan 01-10); button calls will return 404 until then

## Self-Check: PASSED

Files verified to exist:
- frontend/src/lib/api.ts — FOUND
- frontend/src/stores/robots.ts — FOUND
- frontend/src/components/charts/SparklineChart.tsx — FOUND
- frontend/src/components/charts/SparklineChart.test.tsx — FOUND
- frontend/src/components/robot-card/RobotCard.tsx — FOUND
- frontend/src/components/robot-card/MaisInfo.tsx — FOUND
- frontend/src/components/robot-card/ContextMenu.tsx — FOUND
- frontend/src/components/robot-card/RobotFilters.tsx — FOUND
- frontend/src/pages/robots/RobotList.tsx — FOUND

Commits verified:
- 3653e7a — FOUND (Task 1)
- 932960b — FOUND (Task 2)
- 2413ff5 — FOUND (Task 3)
