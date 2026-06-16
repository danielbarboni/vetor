---
phase: 01
plan: 08
subsystem: editor
tags: [editor, parameters, indicators, validation, pydantic, react]
dependency_graph:
  requires: ["01-05", "01-06", "01-07"]
  provides: ["it_params_schema", "it_validators", "RobotEditor", "indicatorDefs", "EditorShell", "ActionRail"]
  affects: ["01-10", "01-11", "01-12"]
tech_stack:
  added: ["strategies.it_params_schema (Pydantic v2)", "strategies.it_validators"]
  patterns: ["model_validator(mode='after')", "per-indicator BaseModel subclass", "conditional reveal pattern (revealedBy)", "declarative IndicatorDef shape"]
key_files:
  created:
    - backend/strategies/__init__.py
    - backend/strategies/it_params_schema.py
    - backend/strategies/it_validators.py
    - backend/tests/test_params.py
    - frontend/src/data/indicatorDefs.ts
    - frontend/src/components/editor/EditorShell.tsx
    - frontend/src/components/editor/ActionRail.tsx
    - frontend/src/components/editor/ParameterSection.tsx
    - frontend/src/components/editor/IndicadorRow.tsx
    - frontend/src/components/editor/sections/IndicadoresTecnicos.tsx
    - frontend/src/pages/robots/RobotEditor.tsx
  modified:
    - backend/routers/robots.py
    - backend/db/robot_repo.py
    - backend/db/models.py
    - frontend/src/App.tsx
decisions:
  - "Pydantic model_validator(mode='after') per subclass — each indicator validates its own required-when-enabled fields; ITParams validates at-least-one-enabled at root level"
  - "indicatorDefs.ts uses declarative FieldDef shape with revealedBy for conditional renders — avoids per-indicator JSX duplication"
  - "IndicadorRow renders common fields (habilitar_inversao, modo_operacao, forma_uso) inline, then iterates specificFields — matches PRD §12.4 structure exactly"
  - "PlaceholderSection used for sections 05-11 — wired with correct titles/subtitles; full field content deferred to plan 01-10 (execution) per plan scope"
  - "Backtest shortcut navigates to /backtests?robot=:id — full BacktestModal wired in plan 01-12 (EDT-04 intent satisfied)"
  - "params_saved_at set in robot_repo.update_robot when params key is present — no separate endpoint needed"
metrics:
  duration: "~70 min"
  completed: "2026-06-16"
  tasks: 2
  files: 15
---

# Phase 1 Plan 08: IT [Tangram 3.0] Parameter Editor Summary

**One-liner:** Full IT [Tangram 3.0] parameter editor with Pydantic v2 schema for all 14 indicators, RISK-04 cross-field validators wired into PATCH /robots/{id}, and React editor rendering 11 ordered sections, execution-lock banner, validated save with timestamp, and backtest shortcut.

---

## What Was Built

### Task 1: Backend IT param schema + cross-field validators + validated save (TDD)

**RED:** `test_params.py` with 14 per-rule assertions written first — confirmed failing (`ModuleNotFoundError: No module named 'strategies'`).

**GREEN:** Created `backend/strategies/it_params_schema.py` and `backend/strategies/it_validators.py`.

**Schema** (`it_params_schema.py`):
- `ITParams` root model with §12.3 general entry params + all 14 indicator sub-models
- Per-indicator Pydantic v2 subclasses with `model_validator(mode='after')`:
  - `MediasMoveisCfg` — media_curta/longa fields required when enabled
  - `Cruzamento3MediasCfg` — all 3 MA fields required (mc/mi/ml periodos)
  - `HiLoActivatorCfg` — numero_periodos required
  - `MACDCfg` — 6 required fields + **RISK-04**: filtro_de_valor=True → valor_do_filtro required
  - `ADXCfg` — di_periodos + suavizador + **RISK-04**: 3 filter toggles (min/max/aumento-diminuicao) each requiring their conditional value
  - `EstocasticoCfg` — periodos_k/d/suavizacao/sobrevendido/sobrecomprado
  - `VWAPCfg` — forma_uso only (âncora diária, no period fields)
  - `IFRCfg` — valor_usado/periodos/sobrevendido/sobrecomprado
  - `BollingerCfg` — valor_usado/periodos/multiplicador_desvio
  - `StopATRCfg` — media_tipo/periodos/desvio_multiplicador
  - `SARParabolicoCfg` — 3 acceleration factor fields
  - `OBVCfg` — **RISK-04**: candles_mesmo_sentido must be > 0
  - `DetectorTopFundosCfg` — numero_periodos as Literal[1,2,3,4]
  - `PontosPivotCfg` — dx_distancia_entrada + 5 toggle fields
- `ITParams.model_validator` enforces: at least one indicator enabled (RISK-04)

**Validators** (`it_validators.py`): `validate_it_params()` entry point + `format_validation_errors()` FastAPI 422 formatter.

**PATCH /robots/{id} wiring** (`routers/robots.py`):
- When `payload.params` is present, calls `validate_it_params()` before persisting
- `ValidationError` → HTTP 422 with field-level errors
- Success path sets `params_saved_at=now()` in `robot_repo.update_robot()`

**Models updated** (`models.py`): `RobotOut` gains `params_saved_at: Optional[datetime]` field.

**Tests:** 14 assertions across 9 test functions — all GREEN.

---

### Task 2: Frontend editor (EditorShell, ActionRail, ParameterSection, IndicadorRow, 11 sections)

**`indicatorDefs.ts`** — declarative definitions for all 14 indicators:
- `IndicatorDef` shape: `{id, name, formaDeUsoOptions, specificFields[]}`
- `IndicatorField` shape: `{key, label, type, options?, defaultValue?, hint?, revealedBy?, positiveInteger?}`
- `revealedBy` pattern drives conditional reveals (MACD filtro, ADX toggles)
- All PRD §12.4 fields, option enums (PT-BR), and defaults encoded

**`EditorShell.tsx`** — header bar matching UI-SPEC:
- SUMÁRIO/GRÁFICO/PARÂMETROS tabs with `.et`/`.et-on` style (box-shadow inset -2px primary)
- Breadcrumb (JBMono 11px), robot name (Sora 19px w700), ÚLTIMO SALVAR timestamp
- Right padding 92px for action rail clearance

**`ActionRail.tsx`** — fixed right rail:
- `position:fixed; right:20px; top:50%; transform:translateY(-50%)`
- `border-radius:18px; padding:8px; box-shadow:var(--shadow)`
- 44×44 buttons: Play/Stop (state-aware), Save 💾, Backtest 🧪 (`--color-primary`, EDT-04), Costs
- Tooltips: "Salvar parâmetros", "Criar backtest", "Custos operacionais"

**`ParameterSection.tsx`** — accordion:
- 26×26px badge (border-radius:8px, JBMono 10.5px w700 --muted)
- Chevron rotation on expand (0.2s transition)
- `overflow:hidden` on container (critical for animation, per UI-SPEC)

**`IndicadorRow.tsx`** — per-indicator block:
- Toggle-reveal pattern: habilitado=false → only header; true → common fields + specific fields
- Common fields: Habilitar Inversão, Modo de Operação, Forma de Uso
- FieldInput renders: toggle, dropdown, number, decimal, button-group
- `revealedBy` check skips field when controlling toggle is false

**`IndicadoresTecnicos.tsx`** — §12.3 + §12.4 combined section:
- General params: CANDLE ABERTO/FECHADO segment, A MERCADO/LIMITE segment + conditionals (spread, tempo, expiracao), entrada por indicadores
- All 14 IndicadorRow blocks rendered from `INDICATOR_DEFS`

**`RobotEditor.tsx`** — main page at `/robos/:id/parametros`:
- Loads robot via `getRobot(id)`, falls back to loading/error states
- 11 sections in PRD §12.5 order with correct titles:
  01 Papel Negociado, 02 Gráfico, 03 Indicadores Técnicos (open by default), 04 Filtros de Entrada, 05-11 Aumento de Posição through Informações
- **EDT-02** execution lock: `robot.status === 'executando'` → amber banner + all fields `disabled`
- **EDT-03** save: collects `params` state, calls `updateRobot(id, {params})`, shows 422 errors inline, updates `robot.params_saved_at` on success
- **EDT-04** backtest shortcut: ActionRail backtest button navigates to `/backtests?robot=:id` (BacktestModal wired in plan 12)
- Tab navigation: SUMÁRIO tab → navigate to `/robos/:id`; GRÁFICO → Phase 2 placeholder

---

## CI Gates

| Gate | Result |
|------|--------|
| `backend: ruff check .` | PASS — 0 issues |
| `backend: pytest` | PASS — 44 passed, 5 skipped (auth token) |
| `frontend: npm run lint` | PASS — 0 issues |
| `frontend: npm run typecheck` | PASS |
| `frontend: npm run build` | PASS — chunk size warning only (ECharts, expected) |
| `frontend: npm run test` | PASS — 75/75 tests |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused import in IndicadoresTecnicos.tsx**
- **Found during:** Task 2 build
- **Issue:** `Toggle` imported but not used directly in IndicadoresTecnicos.tsx (it's used via IndicadorRow internally)
- **Fix:** Removed unused import
- **Files modified:** `frontend/src/components/editor/sections/IndicadoresTecnicos.tsx`

**2. [Rule 1 - Bug] Unused imports in test_params.py**
- **Found during:** Task 1 ruff check
- **Issue:** Individual indicator classes imported but only `ITParams` needed (tests use dict construction, not direct class instantiation)
- **Fix:** Replaced 14 named imports with single `ITParams` import
- **Files modified:** `backend/tests/test_params.py`

### Scope Notes

- **Sections 05-11** (Aumento de Posição through Informações): rendered with `PlaceholderSection` — correct per plan scope. Full field content belongs to plan 01-10 (execution layer). All 11 sections are present with correct titles and numbers.
- **Backtest modal** (EDT-04): ActionRail button navigates to `/backtests?robot=:id`; the full BacktestModal component is wired in plan 01-12.
- **GRÁFICO tab**: Phase 2 placeholder per D-10 and plan scope.

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Sections 05-11 body (`PlaceholderSection`) | `RobotEditor.tsx` | Full fields in plan 01-10 (execution layer); structure present, correct order |
| BacktestModal open | `ActionRail.tsx` + `RobotEditor.tsx` | Navigates to `/backtests?robot=:id`; modal wired in plan 01-12 |
| Costs icon handler | `ActionRail.tsx` | No-op; plan 01-12 |

---

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond the planned PATCH /robots/{id} extension.

---

## Self-Check: PASSED

**Files created:**
- `backend/strategies/__init__.py` — FOUND
- `backend/strategies/it_params_schema.py` — FOUND
- `backend/strategies/it_validators.py` — FOUND
- `backend/tests/test_params.py` — FOUND (14 assertions)
- `frontend/src/data/indicatorDefs.ts` — FOUND (14 indicator defs, "Médias Móveis" present)
- `frontend/src/components/editor/EditorShell.tsx` — FOUND (PARÂMETROS tab present)
- `frontend/src/components/editor/ActionRail.tsx` — FOUND
- `frontend/src/components/editor/ParameterSection.tsx` — FOUND
- `frontend/src/components/editor/IndicadorRow.tsx` — FOUND
- `frontend/src/components/editor/sections/IndicadoresTecnicos.tsx` — FOUND
- `frontend/src/pages/robots/RobotEditor.tsx` — FOUND ("Robô em execução" banner present)

**Commits:**
- `c58038b` — feat(01-08): IT param schema + cross-field validators + validated save (EDT-03)
- `b4ab5de` — feat(01-08): IT editor shell, 14 indicators, 11 sections, exec-lock, backtest shortcut
