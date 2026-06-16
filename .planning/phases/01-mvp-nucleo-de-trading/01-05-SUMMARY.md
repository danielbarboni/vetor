---
phase: 01-mvp-nucleo-de-trading
plan: 05
subsystem: backend/robots
tags: [robots, crud, lifecycle, api, repository, pydantic, tdd]
dependency_graph:
  requires: ["01-03"]
  provides: ["robot-crud-api", "robot-lifecycle"]
  affects: ["01-08", "01-10", "01-11"]
tech_stack:
  added: []
  patterns:
    - "User-scoped repository pattern (user_id always from JWT, never request body)"
    - "Unique violation → HTTPException 409 mapping (Supabase error string inspection)"
    - "Sequential mock (call_count list) for multi-execute supabase chains"
key_files:
  created:
    - backend/db/robot_repo.py
    - backend/routers/robots.py
    - backend/routers/__init__.py
  modified:
    - backend/db/models.py
    - backend/main.py
    - backend/tests/test_robots.py
decisions:
  - "RobotStatus enum extended with 'rascunho' (DB default state, was missing from plan 03 model)"
  - "Unique-violation detection via exception string inspection ('23505'/'duplicate'/'unique') — Supabase Python SDK raises Exception not a typed error on constraint violation"
  - "model_post_init used for cross-field D-08 validation (simulation_capital iff mode=simulado)"
  - "5 async endpoint tests skip without SUPABASE_JWT_SECRET (correct per environment_constraints)"
metrics:
  duration: "~40 min"
  completed: "2026-06-16"
  tasks_completed: 2
  files_created: 3
  files_modified: 3
---

# Phase 1 Plan 05: Robot CRUD + Lifecycle API Summary

**One-liner:** User-scoped robot CRUD + lifecycle (archive/unarchive/duplicate) via 8 FastAPI endpoints backed by Supabase, with D-08 capital validation and ROB-05 state-transition guards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Robot repository + Pydantic models | a9f0e9b | models.py, robot_repo.py, test_robots.py |
| 2 | Robots router (8 endpoints) + main.py wiring | 3a2c5bb | robots.py, __init__.py, main.py |

## What Was Built

**backend/db/models.py** — Extended:
- `RobotStatus`: added `rascunho` (DB default, previously missing)
- `RobotCreate`: renamed `strategy` → `strategy_type`, `capital` → `simulation_capital`; added `fill_policy`; `model_post_init` enforces D-08 (simulation_capital required iff mode=simulado)
- `RobotUpdate`: new model for PATCH (name?, fill_policy?, params?)
- `RobotOut`: updated field names to match schema (strategy_type, simulation_capital, fill_policy)

**backend/db/robot_repo.py** — User-scoped data access:
- `create_robot`: inserts with status='rascunho' + caller user_id; maps unique violation → 409 (WIZ-05)
- `get_robot`: filters by both id AND user_id — 404 for other users' robots
- `list_robots`: user-scoped, optional status filter
- `update_robot`: verifies ownership before update; maps unique violation → 409
- `delete_robot`: ownership check then delete
- `archive_robot`: rejects if status=executando → 409 (ROB-05)
- `unarchive_robot`: rejects if status≠arquivado → 409
- `duplicate_robot`: copies all fields + params → new rascunho row; name truncated to 100 chars with " (cópia)" suffix (D-08 mode-promotion path)

**backend/routers/robots.py** — 8 endpoints, all behind `Depends(get_current_user)`:
- `GET /robots` — list with optional ?status= filter
- `POST /robots` → 201 + RobotOut (WIZ-06)
- `GET /robots/{id}` — single robot
- `PATCH /robots/{id}` — mutable fields only (params in plan 08)
- `DELETE /robots/{id}` → 204
- `POST /robots/{id}/archive` — state guard (ROB-05)
- `POST /robots/{id}/unarchive`
- `POST /robots/{id}/duplicate` → 201 + new RobotOut (D-08)

**backend/main.py** — robots router wired at prefix `/robots`.

**backend/tests/test_robots.py** — Replaced xfail stubs with 17 hermetic tests (12 pass, 5 skip without JWT secret):
- Repository unit tests: create defaults, name uniqueness, D-08 validation, list filter, get 404, archive/unarchive state machine, duplicate name + truncation
- Router endpoint tests: create 201, list 200, get 404, archive 409, duplicate 201

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added 'rascunho' to RobotStatus enum**
- **Found during:** Task 1 — robot_repo sets status='rascunho' on insert but RobotOut deserialization would fail since 'rascunho' was not in the enum
- **Fix:** Added `rascunho = "rascunho"` to `RobotStatus` enum
- **Files modified:** backend/db/models.py
- **Commit:** a9f0e9b

**2. [Rule 2 - Missing critical functionality] Sequential mock helper for multi-call supabase chains**
- **Found during:** Task 1 test writing — archive/unarchive/duplicate make 2 execute() calls (get_robot + update/insert); single-result mock returned same rows both times, making archive-of-parado test flawed
- **Fix:** Added `_mock_supabase_seq(rows_seq)` helper that returns different data on successive execute() calls
- **Files modified:** backend/tests/test_robots.py
- **Commit:** a9f0e9b

## Known Stubs

None — all 8 endpoints are fully implemented. PATCH /robots/{id} intentionally excludes params (plan 08 handles strategy editor params save — this is documented in the router docstring, not a stub).

## Threat Flags

None — no new network endpoints beyond what the plan specified. user_id is enforced server-side on every query (T-01-04 mitigated). No new auth paths, file access, or schema changes beyond the robots table operations already in RESEARCH.md.

## Self-Check

- [x] backend/db/robot_repo.py exists and contains `user_id` and `rascunho`
- [x] backend/routers/robots.py exists and contains `archive` and `duplicate`
- [x] backend/tests/test_robots.py: `test_name_unique` and `test_create_robot_endpoint` present
- [x] Commits a9f0e9b and 3a2c5bb exist in git log
- [x] `ruff check .` → All checks passed
- [x] `pytest tests/test_robots.py` → 12 passed, 5 skipped (JWT-dependent)
- [x] `pytest` (full suite) → 12 passed, 5 skipped, 12 xfailed

## Self-Check: PASSED
