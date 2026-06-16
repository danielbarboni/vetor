---
phase: 01-mvp-nucleo-de-trading
plan: 03
subsystem: backend
tags: [fastapi, supabase, jwt, pytest, ci, cors, pydantic]
dependency_graph:
  requires: [01-01]
  provides: [backend-foundation, jwt-guard, pytest-harness, ci-workflow]
  affects: [all subsequent backend plans]
tech_stack:
  added:
    - fastapi==0.137.1
    - uvicorn[standard]==0.49.0
    - pydantic==2.13.4
    - pydantic-settings==2.7.0
    - supabase==2.31.0
    - python-jose[cryptography]==3.3.0
    - python-multipart==0.0.20
    - httpx==0.28.1
    - APScheduler==3.10.4
    - metaapi-cloud-sdk==29.1.1
    - pytest==8.3.5
    - pytest-asyncio==0.25.3
    - pytest-timeout==2.3.1
    - ruff (CI linter)
  patterns:
    - Pydantic-settings for env config
    - HTTPBearer JWT guard with jose.decode audience="authenticated"
    - Single service-role Supabase client singleton
    - xfail placeholders for Nyquist gate test modules
    - GitHub Actions concurrency group with cancel-in-progress
key_files:
  created:
    - backend/main.py
    - backend/config.py
    - backend/.env.example
    - backend/requirements.txt
    - backend/auth/__init__.py
    - backend/auth/jwt_guard.py
    - backend/db/__init__.py
    - backend/db/supabase_client.py
    - backend/db/models.py
    - backend/pytest.ini
    - backend/tests/__init__.py
    - backend/tests/conftest.py
    - backend/tests/test_auth.py
    - backend/tests/test_robots.py
    - backend/tests/test_params.py
    - backend/tests/test_engine.py
    - backend/tests/test_calendar.py
    - backend/tests/test_orders.py
    - backend/tests/test_sumario.py
    - backend/tests/test_backtest.py
    - backend/tests/test_broker.py
    - .github/workflows/ci.yml
    - .gitignore
  modified: []
decisions:
  - "CORS configured with explicit allowlist (settings.cors_origins_list) — never wildcard; default includes localhost:5173"
  - "JWT guard fails closed when SUPABASE_JWT_SECRET is absent (503 not 401) to distinguish misconfiguration from bad token"
  - "Supabase client uses placeholder URL/key when env absent so import succeeds; real creds required for DB operations"
  - "asyncio_default_fixture_loop_scope=function added to pytest.ini to suppress pytest-asyncio deprecation warning"
  - "ruff not pinned in requirements.txt — installed separately in CI (pip install -r requirements.txt ruff) matching plan spec"
metrics:
  duration: ~30 min
  completed: 2026-06-16
  tasks_completed: 2
  files_created: 23
---

# Phase 01 Plan 03: FastAPI Backend Scaffold Summary

**One-liner:** FastAPI backend with CORS allowlist, Supabase JWT guard (jose, audience="authenticated"), single service-role Supabase client, Pydantic v2 base models, green 14-xfail pytest harness covering all Nyquist gate modules, and GitHub Actions CI workflow with named `frontend`/`backend` required status check jobs.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | FastAPI app, config, CORS, JWT guard, Supabase client, base models | ce94bb2 | backend/main.py, config.py, .env.example, auth/jwt_guard.py, db/supabase_client.py, db/models.py, requirements.txt, .gitignore |
| 2 | pytest harness (conftest + Nyquist test modules) + CI workflow | 51d6a03 | backend/pytest.ini, tests/conftest.py, 9 test_*.py modules, .github/workflows/ci.yml |

## Verification Results

- `cd backend && python -c "import main"` — passes (exit 0)
- `cd backend && pytest` — 14 xfailed in 0.34s (exit 0)
- `grep -q "audience" auth/jwt_guard.py` — passes
- `grep -q "CORSMiddleware" main.py` — passes
- `grep -qv 'allow_origins=\["\*"\]' main.py` — passes (no wildcard)
- `grep -q "mock_metaapi" tests/conftest.py` — passes
- `test -f ../.github/workflows/ci.yml && grep -q "pytest" ../.github/workflows/ci.yml` — passes
- `ruff check .` — All checks passed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comment in main.py triggered grep-qv wildcard check**
- **Found during:** Task 1 verification
- **Issue:** `# NEVER use allow_origins=["*"]` comment matched the grep pattern `allow_origins=\["\*"\]`
- **Fix:** Rephrased comment to "NEVER use wildcard origins"
- **Files modified:** backend/main.py
- **Commit:** ce94bb2

**2. [Rule 2 - Missing] pytest-asyncio deprecation warning for asyncio_default_fixture_loop_scope**
- **Found during:** Task 2 initial pytest run
- **Issue:** pytest-asyncio 0.25.3 emits PytestDeprecationWarning when `asyncio_default_fixture_loop_scope` not set
- **Fix:** Added `asyncio_default_fixture_loop_scope = function` to pytest.ini
- **Files modified:** backend/pytest.ini
- **Commit:** 51d6a03

**3. [Rule 2 - Missing] No .gitignore existed**
- **Found during:** Task 1 pre-commit check
- **Issue:** .venv/, __pycache__, .env, node_modules would be untracked and risk accidental commit
- **Fix:** Created root .gitignore covering Python, Node, env files, and IDE artifacts
- **Files modified:** .gitignore (new)
- **Commit:** ce94bb2

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced beyond what the plan specified. The JWT guard itself is the auth trust boundary defined in the plan's threat model (T-01-04 mitigated: user_id always taken from decoded token sub, never from client input).

## Known Stubs

None — this plan creates infrastructure only (no UI, no data flows to render).

## Self-Check: PASSED

- [x] backend/main.py exists
- [x] backend/auth/jwt_guard.py exists and contains "audience"
- [x] backend/db/supabase_client.py exists
- [x] backend/tests/conftest.py exists (>20 lines)
- [x] .github/workflows/ci.yml exists and contains "pytest" and "frontend"/"backend" job names
- [x] Commits ce94bb2 and 51d6a03 present in git log
- [x] pytest exits 0 (14 xfailed)
