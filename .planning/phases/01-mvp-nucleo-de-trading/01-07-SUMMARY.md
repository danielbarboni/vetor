---
phase: 01
plan: 07
subsystem: frontend/wizard
tags: [wizard, strategy-catalog, robot-creation, ephemeral-ui]
dependency_graph:
  requires: ["01-01 (UI primitives)", "01-05 (api.createRobot)", "01-04 (auth store)"]
  provides: ["RobotWizard at /robos/wizard", "strategyCatalog data", "wizard step components"]
  affects: ["App.tsx route (replaces stub)", "robot creation flow"]
tech_stack:
  added: []
  patterns: ["ephemeral local state (D-13)", "wizard step orchestration", "mock-based hermetic tests"]
key_files:
  created:
    - frontend/src/data/strategyCatalog.ts
    - frontend/src/components/wizard/StepStrategy.tsx
    - frontend/src/components/wizard/StepMode.tsx
    - frontend/src/components/wizard/StepAsset.tsx
    - frontend/src/components/wizard/StepConfigure.tsx
    - frontend/src/components/wizard/StepIndicator.tsx
    - frontend/src/components/wizard/SaibaMaisModal.tsx
    - frontend/src/pages/robots/RobotWizard.tsx
    - frontend/src/pages/robots/RobotWizard.test.tsx
  modified:
    - frontend/src/App.tsx
decisions:
  - "D-09/D-10 enforced: 6 non-IT strategies show EM BREVE + disabled + (opacity 0.45, pointer-events:none) — only indicadores_tecnicos is selectable"
  - "D-11: SaibaMaisModal renders full PRD §12 content for IT strategy; minimal Em Breve placeholder for the other 6"
  - "D-12: single-select asset chip — WIN%/WDO%/BIT%; only one asset per robot"
  - "D-13: zero API calls until Step 4 submit button; all state is ephemeral React useState"
  - "WIZ-06: on createRobot success navigate to /robos/{id}/parametros; on 409 show inline name error without leaving Step 4"
  - "parseCapital helper converts formatted R$ 5.000,00 display value to numeric for API payload"
metrics:
  duration: ~30 min
  completed_date: "2026-06-16"
  tasks: 2
  files_created: 9
  files_modified: 1
  tests_added: 17
  tests_total: 75
---

# Phase 1 Plan 07: Robot Creation Wizard Summary

**One-liner:** 4-step ephemeral wizard (ESTRATÉGIA→MODO→DADOS→CONFIGURAR) with 7-strategy catalog (IT-only selectable), mode/asset/name selection, and `createRobot` POST on finish redirecting to `/robos/{id}/parametros`.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Strategy catalog + Step 1 (strategy) + Step 2 (mode) | 282e945 | strategyCatalog.ts, StepStrategy.tsx, StepMode.tsx, SaibaMaisModal.tsx |
| 2 | Step 3 (asset) + Step 4 (configure) + orchestrator + tests | 707571a | StepAsset.tsx, StepConfigure.tsx, StepIndicator.tsx, RobotWizard.tsx, RobotWizard.test.tsx, App.tsx |

## Requirements Satisfied

- WIZ-01: Searchable strategy catalog with name, author, SAIBA MAIS, and select button
- WIZ-02: All 7 strategies listed; 6 non-IT show EM BREVE + disabled (opacity 0.45, pointer-events:none)
- WIZ-03: Simulado (RECOMENDADO badge) and Real mode cards with exact PT-BR descriptions
- WIZ-04: BM&F market label, WIN%/WDO%/BIT% single-select asset chips with .lwc-on ring
- WIZ-05: Robot name (max 40 chars, live count, unique hint, inline 409 error), simulation capital R$5.000,00 only in Simulado
- WIZ-06: On submit → `createRobot({name, strategy_type:'indicadores_tecnicos', mode, asset, simulation_capital, fill_policy:'pessimista', status:'rascunho'})` → navigate to `/robos/{id}/parametros`

## CI Gate Results

| Check | Result |
|-------|--------|
| `npm run lint` | GREEN (0 errors) |
| `npm run typecheck` | GREEN (0 errors) |
| `npm run build` | GREEN (chunk size warning expected — ECharts, not an error) |
| `npm run test` | GREEN — 75 tests pass (17 new wizard tests) |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all wizard steps are fully implemented and wired.

## Threat Flags

None — wizard is a pure frontend session with no new API endpoints or auth paths introduced. The single POST to `/robots` at finish uses the existing `createRobot` function from api.ts (plan 01-06).

## Self-Check: PASSED

- [x] `frontend/src/data/strategyCatalog.ts` — created, contains `indicadores_tecnicos`
- [x] `frontend/src/components/wizard/StepStrategy.tsx` — created, contains `EM BREVE`
- [x] `frontend/src/components/wizard/StepMode.tsx` — created, contains `RECOMENDADO`
- [x] `frontend/src/components/wizard/StepAsset.tsx` — created, contains `WIN%`
- [x] `frontend/src/components/wizard/StepConfigure.tsx` — created, contains `Nome do robô`
- [x] `frontend/src/components/wizard/StepIndicator.tsx` — created
- [x] `frontend/src/components/wizard/SaibaMaisModal.tsx` — created
- [x] `frontend/src/pages/robots/RobotWizard.tsx` — created, contains `createRobot` and `/robos/`
- [x] `frontend/src/pages/robots/RobotWizard.test.tsx` — created, 17 tests all pass
- [x] commit 282e945 — Task 1 verified in git log
- [x] commit 707571a — Task 2 verified in git log
