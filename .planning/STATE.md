---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Plan 01-04 complete — Auth layer (store + RequireAuth + 5 screens + /account/sessions)
last_updated: "2026-06-16T18:54:04.375Z"
last_activity: 2026-06-16
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 13
  completed_plans: 8
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-15)

**Core value:** Trader configures a robot, connects it to their B3/CME broker via MetaAPI/IBKR, and it executes autonomously — monitored in real time through a single unified interface
**Current focus:** Phase 01 — mvp-nucleo-de-trading

## Current Position

Phase: 01 (mvp-nucleo-de-trading) — EXECUTING
Plan: 6 of 13 (complete); Plan 5 of 13 (complete)
Status: Ready to execute
Last activity: 2026-06-16

Progress: [██████░░░░] 62%

## Performance Metrics

**Velocity:**

- Total plans completed: 5
- Average duration: ~25 min
- Total execution time: ~145 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 — mvp-nucleo-de-trading | 5/13 | ~145 min | ~29 min |
| Phase 01-mvp-nucleo-de-trading P06 | 25m | 3 tasks | 10 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Key decisions for Phase 1:

- MetaAPI (not Windows VPS) for MT5 bridge — scales to SaaS; BTG account already verified
- Supabase for DB + Auth + Realtime — saves weeks on auth; PostgreSQL scales to SaaS
- Prototype NOT ported — dc-runtime is prototype-only; React + production architecture required
- Phase 1 excludes IBKR/CME — B3 is primary; defer CME to Phase 2

Key decisions from Plan 01-01:

- @vitejs/plugin-react@6.x required for vite 8 compatibility (v4.x peer range is vite ^4–7)
- palettes.d.ts added to blue-hour-design-system/ for TypeScript module declarations
- Sora 700 used for logo mark (README.md binding loads only 600/700, not 800)

Key decisions from Plan 01-02:

- WIN%/WDO% expiry = Wednesday nearest 15th of even-month (B3 mini-futures rule)
- BIT% expiry = 3rd Friday of every month (all 12 months)
- Rollover = T-5 business days before expiry (Mon-Fri, no holiday correction in seed)
- Front months (2026-06-16): WINM26/WDOM26 (2026-06-17), BITM26 (2026-06-19)
- order_events RLS uses subquery on orders (table has no direct user_id column)
- user_credits writes restricted to service role only

Key decisions from Plan 01-03:

- JWT guard fails closed (503) when SUPABASE_JWT_SECRET absent — distinguishes misconfiguration from bad token
- CORS allowlist driven by settings.cors_origins_list (comma-split) — never wildcard
- ruff installed separately in CI (not in requirements.txt) — matches plan spec
- asyncio_default_fixture_loop_scope=function in pytest.ini — suppresses pytest-asyncio 0.25.3 deprecation warning

Key decisions from Plan 01-04:

- vi.hoisted() required for Vitest mock fns — vi.mock() is hoisted before const declarations
- HTTPBearer returns 401 (not 403) on missing Authorization header — tests assert in (401, 403)
- AccountSelector auto-skips to /robos for single-profile users (AUT-05 spec)
- /account/sessions returns placeholder shape — real impl deferred until Supabase project + migrations exist
- Auth callback navigates to /auth/select (not /robos) to allow multi-profile future expansion

Key decisions from Plan 01-05:

- RobotStatus enum extended with 'rascunho' (DB default state, was missing from plan 03 model)
- Unique-violation detection via exception string inspection ('23505'/'duplicate'/'unique') — Supabase Python SDK raises Exception not a typed error on constraint violation
- model_post_init used for cross-field D-08 validation (simulation_capital iff mode=simulado)
- 5 async endpoint tests skip without SUPABASE_JWT_SECRET (correct per environment_constraints)
- [Phase ?]: Pinned per Assumption A1 for prototype fidelity
- [Phase ?]: All frontend plans use this shared client

### Pending Todos

- Plan 01-02 Task 3: user must create Supabase project, apply 3 migrations, load B3 seed, run RLS+Realtime smoke test, then signal "approved" to unblock Wave 2+.

### Blockers/Concerns

- BLOCKING: Plan 01-02 Task 3 not yet executed — no Supabase project exists. Plans 05/10/11/12/13 and all Wave 2+ plans cannot begin until migrations applied and smoke test passes.
- 3 of 7 strategy editors (Tangram, Fibonacci, RenkoBot) incomplete in prototype — need PRD spec completion before implementing in production. Phase 1 only requires Indicadores Técnicos [Tangram 3.0].

## Session Continuity

Last session: 2026-06-16T18:54:04.353Z
Stopped at: Plan 01-04 complete — Auth layer (store + RequireAuth + 5 screens + /account/sessions)
Resume file: None
