---
phase: 01-mvp-nucleo-de-trading
plan: 12
subsystem: backtests
tags: [backtest, event-driven, tdd, credits, parity, realtime, frontend]
dependency_graph:
  requires: ["01-10", "01-11", "01-08"]
  provides: ["BCK-01", "BCK-02", "BCK-03", "BCK-04"]
  affects: ["frontend-routes", "backend-api", "supabase-realtime"]
tech_stack:
  added: []
  patterns:
    - "Event-driven backtest replay (Pitfall 4 — no lookahead, df.iloc[:i+1] per bar)"
    - "BCK-04 metric parity via shared metrics.py (compute_backtest_metrics delegates to compute_sumario)"
    - "asyncio.create_task for backtest runner (A10 — solo scale)"
    - "Supabase Realtime for live status transitions (aguardando → processando → concluido/erro)"
    - "Prototype pixel-faithful port (.bc/.bc-on chips, credits pill, status badges)"
    - "TDD: RED commit → GREEN commit on backtest tests"
key_files:
  created:
    - backend/engine/backtest_runner.py
    - backend/db/backtest_repo.py
    - backend/routers/backtests.py
    - frontend/src/components/backtests/BacktestModal.tsx
    - frontend/src/pages/backtests/BacktestList.tsx
    - frontend/src/pages/backtests/BacktestReport.tsx
  modified:
    - backend/tests/test_backtest.py
    - backend/main.py
    - frontend/src/lib/api.ts
    - frontend/src/App.tsx
decisions:
  - "BacktestRunner accepts both pandas DataFrame and list-of-dicts (no pandas dependency in tests)"
  - "BacktestRunner uses type name check (type(df).__name__ == 'DataFrame') to avoid hasattr collision with test BarsList"
  - "BacktestReport reuses RelatorioCompleto (relatorio prop) and EquityChart — not MetricCards — because MetricCards requires live WS tick store (robotId), while backtest is historical-only"
  - "Duplicate router mount (/backtests and /account) for GET /account/credits to match BCK-02 API surface without a separate router"
  - "Phase 1 historical data is synthetic (placeholder); real B3/MetaAPI feed deferred to Phase 2"
metrics:
  duration: "~90 minutes"
  completed_date: "2026-06-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 4
---

# Phase 01 Plan 12: Backtests (BCK-01..04) Summary

Event-driven BacktestRunner sharing StrategyBase + metrics.py with the live engine for parity, credit-aware repo + endpoints, and the full frontend (creation modal, credit-aware list, completed report reusing Sumário EquityChart + RelatorioCompleto).

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 (RED) | test_backtest.py failing tests | 74b12dc | Done |
| 1 (GREEN) | BacktestRunner + repo + endpoints | 18ffc8d | Done |
| 2 | Frontend modal + list + report | 22d5484 | Done |

## What Was Built

### Backend

**`engine/backtest_runner.py`**
- `BacktestRunner.replay()`: event-driven loop — feeds strategy exactly one bar at a time (Pitfall 4 guard: `on_tick(bar_i)` then `evaluate()` → signal queued, filled at bar(i+1).open)
- `compute_backtest_metrics()`: thin wrapper around `compute_sumario()` — BCK-04 parity guaranteed at the function level
- `run_backtest_task()`: async task (A10), status transitions aguardando→processando→concluido/erro via Supabase Realtime
- Phase 1 uses synthetic historical bars; real data feed deferred to Phase 2

**`db/backtest_repo.py`**
- `InsufficientCreditsError`: raised when credits == 0 or user has no credits row
- `_consume_credit()`: read-then-decrement (atomic at application level, Phase 1)
- CRUD for backtests, backtest_orders, and user_credits

**`routers/backtests.py`**
- `POST /backtests`: validate, consume credit, launch `asyncio.create_task`
- `GET /backtests`: list (BCK-03)
- `GET /backtests/{id}`: detail + result metrics (BCK-04)
- `GET /backtests/{id}/orders`: simulated orders
- `GET /account/credits`: credit balance (BCK-02)

### Frontend

**`BacktestModal.tsx`** (BCK-01/02)
- Prototype-faithful: "Criar backtest" header, DISPONÍVEIS credits pill, capital input, custos operacionais select, tipo do backtest select (fill_policy), date pickers with .bc/.bc-on shortcut chips (1MÊS/3MESES/6MESES/1ANO/2ANOS), "Consome 1 crédito por execução" hint, INICIAR BACKTEST CTA

**`BacktestList.tsx`** (BCK-03)
- Card grid with status badges (Aguardando/Processando/Concluído/Erro), RETORNO LÍQ./FATOR LUCRO/TRADES metrics per card, credits pill, CRIAR BACKTEST button, Supabase Realtime subscription, empty state with prototype icon

**`BacktestReport.tsx`** (BCK-04)
- Reuses `EquityChart` (with backtest equity_series) and `RelatorioCompleto` (with result.relatorio)
- 8-metric summary grid matching prototype (RETORNO LÍQUIDO, PATRIMÔNIO, DRAWDOWN MÁXIMO, FATOR DE LUCRO, Nº DE TRADES, TRADES COM LUCRO, SALDO DIÁRIO, ATIVO)
- Auto-refresh polling while status is aguardando/processando
- Read-only simulated order table

## Tests

6 backtest-specific tests, all green (85 total passing, 0 failing):
- `test_metrics_parity`: BCK-04 — `compute_backtest_metrics` == `compute_sumario` for same orders
- `test_credit_decrement_consumes_one_credit`: BCK-02 happy path
- `test_credit_decrement_rejects_at_zero`: BCK-02 zero-credit rejection
- `test_credit_decrement_rejects_when_no_credits_row`: BCK-02 missing row rejection
- `test_no_lookahead_signal_at_bar_n_uses_only_bars_up_to_n`: Pitfall 4 guard
- `test_entry_price_is_next_bar_open`: Pitfall 4 — entry fills at next bar's open

## CI Gates

- Backend: `pytest --tb=no` → 85 passed, 0 failed
- Frontend: `npm run build` → exit 0 (2380 modules, build successful)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pandas not in venv — tests used list-of-dicts fallback**
- Found during: Task 1 (GREEN phase)
- Issue: BacktestRunner tests called `import pandas` but pandas is not installed in backend venv
- Fix: BacktestRunner.replay() accepts both DataFrame and plain list-of-dicts; tests use a lightweight BarsList helper class. Runner uses `type(df).__name__ == 'DataFrame'` to distinguish.
- Files: backend/engine/backtest_runner.py, backend/tests/test_backtest.py

**2. [Rule 1 - Bug] auth import path mismatch**
- Found during: Task 1 router wiring
- Issue: `from auth.dependencies import get_current_user` raised ModuleNotFoundError; correct path is `from auth.jwt_guard import get_current_user` (returns str, not dict)
- Fix: Fixed import and all user_id extraction in router handlers

**3. [Rule 1 - Bug] hasattr(bars, 'iloc') collision with test BarsList**
- Found during: Task 1 GREEN run
- Issue: Test BarsList had an `iloc` method (callable), so `not hasattr(bars, 'iloc')` evaluated False, causing `bars.iloc[-1]` to be called as a function subscript → TypeError
- Fix: Changed detection to `type(df).__name__ == 'DataFrame'` which correctly identifies only real pandas DataFrames

### Design Decisions

**BacktestReport uses EquityChart + RelatorioCompleto, not MetricCards**
- MetricCards requires `robotId` for live WS tick subscription (D-01), which doesn't exist in backtest context
- BacktestReport renders the 8-metric summary grid directly (matching prototype exactly) and delegates RelatorioCompleto to the shared component

## Known Stubs

- `_fetch_historical_bars()` in backtest_runner.py returns synthetic OHLCV data (Phase 1 placeholder). Real B3/MetaAPI historical data integration is deferred to Phase 2.
- `BacktestList.tsx` opens `BacktestModal` with `robotId=""` and `robotName="Novo Backtest"` because the list page has no robot context; real usage should open modal from robot card or editor rail (EDT-04).

## Threat Flags

None — all new endpoints are behind `Depends(get_current_user)`, user_id is scoped from JWT (not from request body), and backtest results are filtered by user_id in all repo queries.

## Self-Check: PASSED

All 6 created files confirmed present on disk. All 3 task commits (74b12dc, 18ffc8d, 22d5484) confirmed in git log.
