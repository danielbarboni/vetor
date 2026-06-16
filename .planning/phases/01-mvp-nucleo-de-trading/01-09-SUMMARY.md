---
phase: 01-mvp-nucleo-de-trading
plan: "09"
subsystem: broker
tags: [metaapi, poc, broker, tick-stream, v29]
dependency_graph:
  requires: ["01-03"]
  provides: ["poc_metaapi_script", "findings_template"]
  affects: ["01-10"]
tech_stack:
  added: []
  patterns: ["throwaway-poc", "asyncio-listener", "credentials-from-config"]
key_files:
  created:
    - backend/broker/__init__.py
    - backend/broker/poc_metaapi.py
    - docs/metaapi-poc-findings.md
  modified: []
decisions:
  - "PoC reads credentials from backend/config.py Settings (METAAPI_TOKEN, METAAPI_SYSTEM_ACCOUNT_ID) — no hardcoded secrets"
  - "All v29 API surface uncertainty flagged with inline NOTE comments so the live run corrects them"
  - "DEMO account safety warning added prominently; order section includes close to avoid leaving open position"
  - "Findings doc is a typed template (checkboxes) covering all 6 risk areas from RESEARCH"
metrics:
  duration: "~20 min"
  completed: "2026-06-16"
  tasks_completed: 1
  tasks_total: 2
  files_created: 3
---

# Phase 1 Plan 09: MetaAPI v29 PoC Script — Summary

## One-liner

Throwaway async PoC script for metaapi-cloud-sdk v29 covering connect/sync, B3 tick subscription, order placement, state queries, and reconnection listener — with a typed findings template for the live run.

## Status: IN-PROGRESS — blocked on Task 2 (live-run checkpoint)

Task 1 (authoring) is complete and committed.
Task 2 is a `checkpoint:human-verify gate="blocking"` that requires:
- A live MetaAPI account (METAAPI_TOKEN + METAAPI_SYSTEM_ACCOUNT_ID in backend/.env)
- Outbound network access (HTTPS + WebSocket to metaapi.cloud)

Neither is available in the current execution environment. The plan is left IN-PROGRESS pending the live run.

## Live Run — Exact Command

```bash
cd /path/to/vetor
source backend/.venv/bin/activate
python -m backend.broker.poc_metaapi 2>&1 | tee /tmp/poc_metaapi_$(date +%Y%m%d_%H%M%S).log
```

After the run, fill every `▢` cell in `docs/metaapi-poc-findings.md` then return to the plan and type `"approved"` to unblock plan 10.

## What to capture

1. Exact import path and constructor kwargs for MetaApi (v29 may differ)
2. Streaming connection class name and `subscribe_to_market_data` signature
3. Full tick event field list + types + timestamp format
4. Whether the async model is native asyncio (confirms A9) or uses a thread bridge
5. Order placement method name + whether `comment` / `clientOrderId` are accepted in options dict
6. Shapes returned by `get_positions()` / `get_orders()` (needed for EXE-06 rehydration)
7. Reconnection behaviour: does the SDK replay missed ticks? (RISK-02 predicts NO — confirm)

## What was built (Task 1)

- `backend/broker/poc_metaapi.py` — standalone `asyncio.run()` script, 200+ lines, ruff-clean, valid Python (AST-checked). Covers all 6 verification areas from the plan. Inline `# NOTE:` comments mark every v29 API surface assumption so the live run can correct them. Prominently marked throwaway; DEMO-account safety warning on the order section.
- `docs/metaapi-poc-findings.md` — typed template with 8 sections and a table per finding; ready to fill directly from the run log.
- `backend/broker/__init__.py` — empty init to make the package importable as `python -m backend.broker.poc_metaapi`.

## Deviations from Plan

None for Task 1. Task 2 deferred per explicit instruction (no network, no credentials).

## Known Stubs

`docs/metaapi-poc-findings.md` is intentionally a template with `▢` placeholders — these are not stubs in the application; they are structured fields for the human to fill after the live run.

## Self-Check: PASSED

- backend/broker/poc_metaapi.py: exists, AST-valid, ruff-clean, grep confirms MetaApi + subscribe + tick patterns
- docs/metaapi-poc-findings.md: exists, contains "tick"
- backend/broker/__init__.py: exists
