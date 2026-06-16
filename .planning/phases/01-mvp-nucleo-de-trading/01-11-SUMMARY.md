---
phase: 01-mvp-nucleo-de-trading
plan: 11
subsystem: sumario-report
tags: [backend, frontend, realtime, metrics, echarts, csv, supabase-realtime, websocket]
requirements: [SUM-01, SUM-02, SUM-03, SUM-04, SUM-05]
dependency_graph:
  requires: ["01-10", "01-06", "01-04", "01-03"]
  provides: ["robot-sumario-screen", "metric-engine", "equity-series", "order-list-csv", "realtime-hooks"]
  affects: ["App.tsx routing", "api.ts", "lib/supabase Realtime"]
tech_stack:
  added:
    - "engine/metrics.py — pure metric functions (no DB deps)"
    - "routers/sumario.py — 4 FastAPI endpoints"
    - "stores/ticks.ts — Zustand tick state keyed by robot_id"
    - "hooks/useTickStream.ts — shared WS singleton with backoff"
    - "hooks/useRobotRealtime.ts — Supabase postgres_changes"
    - "components/charts/EquityChart.tsx — ECharts 6.1.0 time-series"
    - "components/sumario/* — 5 components + csv.ts + csv.test.ts"
    - "pages/sumario/RobotSumario.tsx — full Sumário screen"
  patterns:
    - "D-01/D-04: single shared WS per user multiplexed by robot_id"
    - "D-02: Supabase postgres_changes → TanStack Query invalidation"
    - "D-03: equity reconstructed from order history per-event"
    - "ECharts SVG renderer (echarts.init pattern from SparklineChart)"
key_files:
  created:
    - backend/engine/metrics.py
    - backend/routers/sumario.py
    - backend/tests/test_sumario.py
    - frontend/src/stores/ticks.ts
    - frontend/src/hooks/useTickStream.ts
    - frontend/src/hooks/useRobotRealtime.ts
    - frontend/src/components/charts/EquityChart.tsx
    - frontend/src/components/sumario/MetricCards.tsx
    - frontend/src/components/sumario/RelatorioCompleto.tsx
    - frontend/src/components/sumario/OrderList.tsx
    - frontend/src/components/sumario/OrderEventModal.tsx
    - frontend/src/components/sumario/csv.ts
    - frontend/src/components/sumario/csv.test.ts
    - frontend/src/pages/sumario/RobotSumario.tsx
  modified:
    - backend/main.py
    - frontend/src/lib/api.ts
    - frontend/src/App.tsx
decisions:
  - "compute_relatorio_completo derives buy/sell side from order.type field (fallback from order.side) — matches writer.py schema"
  - "EquityChart equity series starts with a capital point before the first trade (D-03 spec)"
  - "useTickStream implemented as a module-level singleton (not React context) to enforce one WS per tab"
  - "profit_factor returns None (not Infinity) when no losing trades — frontend renders ∞ string"
  - "Ruff F841 on unused `filled` variable in compute_relatorio_completo — removed in fix commit"
metrics:
  duration: 28m
  completed_date: "2026-06-16"
  tasks: 2
  files: 17
---

# Phase 01 Plan 11: Sumário Report Summary

**One-liner:** Backend metric engine (net return, drawdown, profit factor, equity D-03 reconstruction) + live Sumário screen (ECharts 6.1.0 equity chart, Supabase Realtime + FastAPI WS hooks, 8-section accordion, order list with CSV export and event modal).

## What Was Built

### Task 1: Backend metric computation + endpoints

`backend/engine/metrics.py` — pure functions (no DB calls):
- `compute_net_return`, `compute_patrimonio`, `compute_number_of_trades`, `compute_profitable_pct`, `compute_profit_factor`, `compute_max_drawdown`, `compute_daily_balance`
- `compute_equity_series` — D-03 reconstruction from order history + optional open-position mark; returns `List[(timestamp_ms, equity)]` for ECharts
- `compute_relatorio_completo` — 8 sections (Conta, Retorno, Risco, Resumo dos trades, Trades com lucro, Trades com prejuízo, Trades comprados, Trades vendidos)
- `compute_sumario` — top-level aggregate

`backend/routers/sumario.py` — 4 endpoints, all `Depends(get_current_user)` + user-scoped:
- `GET /robots/{id}/sumario` — header metadata + primary metrics + relatório (SUM-01/02/03)
- `GET /robots/{id}/orders` — paginated, status+period filterable (SUM-04)
- `GET /robots/{id}/orders/{oid}/events` — per-order event log (SUM-05)
- `GET /robots/{id}/equity` — `Array<[timestamp_ms, value]>` (SUM-02/D-03)

`backend/tests/test_sumario.py` — 15 tests covering known-fixture equity series, all metrics, 8 relatório sections, aggregate, edge cases (empty orders, open position mark).

### Task 2: Realtime hooks + Sumário screen

**Stores:**
- `stores/ticks.ts` — Zustand: `{ ticks: Record<robot_id, Tick> }` + `setTick`

**Hooks:**
- `useTickStream.ts` — module-level singleton WS at `/ws/{user_id}?token=<jwt>`, reconnects with exponential backoff (1s → 30s cap), demultiplexes envelope `{ robot_id, price, change, timestamp }` → ticks store (D-04)
- `useRobotRealtime.ts` — Supabase `postgres_changes` on `robots` (status) + `orders` (filter robot_id); on order event → `queryClient.invalidateQueries(['sumario'], ['equity'], ['orders'])` (D-02/D-03)

**Components:**
- `charts/EquityChart.tsx` — ECharts 6.1.0, `echarts.init(ref, null, { renderer: 'svg' })`, `xAxis: { type: 'time' }`, `smooth: true`, `areaStyle { color: var(--chart-1), opacity: 0.10 }`, optional baseline `markLine` (dashed `--border2`), container `width=100% height=230`
- `sumario/MetricCards.tsx` — live quote from `useTickStore`, EquityChart embedded, 5 secondary metric cards in right column
- `sumario/RelatorioCompleto.tsx` — 8-section accordion, each section expandable, section 1 (CONTA) open by default
- `sumario/OrderList.tsx` — paginated table (50/page), status chip filter, EXPORTAR CSV → `downloadOrdersCsv`, ⓘ button → OrderEventModal
- `sumario/OrderEventModal.tsx` — 640px modal, timeline event log from events endpoint
- `sumario/csv.ts` — `buildOrdersCsv` with UTF-8 BOM (`﻿`), 11 SUM-04 columns, decimal-separator preference; `downloadOrdersCsv` via Blob URL
- `sumario/csv.test.ts` — 10 tests (BOM, columns, decimal separator, nulls)

**Page:**
- `pages/sumario/RobotSumario.tsx` — `/robos/:id/sumario`; SUM-01 header (robot name, status dot, simulator badge, strategy, contract, ÚLTIMO SALVAR); period selector HOJE/7D/30D/TUDO; EXPORTAR CSV; MetricCards; RelatorioCompleto; OrderList; `useTickStream()` + `useRobotRealtime()`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug/Lint] Unused local variable `filled` in metrics.py**
- Found during: post-commit ruff check
- Issue: `filled` list was computed but never used in `compute_relatorio_completo`
- Fix: removed the unused variable; function uses `completed` (exit+stop filtered) throughout
- Files modified: backend/engine/metrics.py
- Commit: f6be8d5

**2. [Rule 1 - Bug/Lint] Unused `pytest` import in test_sumario.py**
- Found during: post-commit ruff check
- Fix: ruff --fix auto-removed it
- Commit: f6be8d5

## Known Stubs

None — all metric values are computed from real order data. Live quote shows "Aguardando cotação ao vivo…" when no WS tick received yet (correct behavior, not a stub — WS requires Supabase project + live robot).

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: auth-bypass-risk | backend/routers/sumario.py | All 4 endpoints use `Depends(get_current_user)` + `_require_robot()` ownership check — T-01-04 user scoping verified. No new surface beyond existing pattern. |

## Self-Check: PASSED

Files created/exist:
- backend/engine/metrics.py ✓
- backend/routers/sumario.py ✓
- backend/tests/test_sumario.py ✓
- frontend/src/stores/ticks.ts ✓
- frontend/src/hooks/useTickStream.ts ✓
- frontend/src/hooks/useRobotRealtime.ts ✓
- frontend/src/components/charts/EquityChart.tsx ✓
- frontend/src/components/sumario/csv.ts ✓
- frontend/src/components/sumario/csv.test.ts ✓
- frontend/src/components/sumario/MetricCards.tsx ✓
- frontend/src/components/sumario/RelatorioCompleto.tsx ✓
- frontend/src/components/sumario/OrderList.tsx ✓
- frontend/src/components/sumario/OrderEventModal.tsx ✓
- frontend/src/pages/sumario/RobotSumario.tsx ✓

Commits:
- 306a6b3: feat(01-11): backend metric engine + sumario/orders/equity endpoints ✓
- 96dbb60: feat(01-11): Sumario screen — realtime hooks, equity chart, metric cards, relatório, order list + CSV ✓
- f6be8d5: fix(01-11): remove unused variables caught by ruff ✓

CI gates:
- backend ruff: All checks passed ✓
- backend pytest (15 tests): passed ✓
- frontend csv.test.ts (10 tests): passed ✓
- frontend npm run build: exit 0 ✓
