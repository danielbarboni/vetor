# Supabase RLS + Realtime Smoke Test (Phase 1, plan 01-02)

**Date:** 2026-06-16
**Project:** vetor-dev (ref `invmscfhvulmvlcunpak`, region sa-east-1)
**Purpose:** De-risk RISK-05 — confirm Row Level Security isolates user data before any report screen is built.

## Schema applied

3 migrations + B3 seed applied via `psql` (Session pooler, IPv4):
- `0001_init_schema.sql` — 11 tables
- `0002_rls_policies.sql` — RLS on all user-scoped tables
- `0003_realtime_publication.sql` — `supabase_realtime` publication
- `b3_contracts_2026_2027.sql` — 48 contracts seeded

### Verification

| Check | Result |
|-------|--------|
| Tables in `public` | 11 ✓ |
| RLS enabled | all 11 tables ✓ |
| Realtime publication members | `robots`, `orders`, `backtests` ✓ |
| B3 front-month (1 per asset) | `WINM26`, `WDOM26`, `BITM26` ✓ |

## RLS isolation test (psql, role `authenticated` + `request.jwt.claims`)

Two principals inserted into `auth.users` (A, B); one robot each (seeded as service
role). Queried `robots` while impersonating each user the same way Supabase does
in production — `set local role authenticated` + `set local request.jwt.claims =
'{"sub":"<uuid>","role":"authenticated"}'` (this is exactly what `auth.uid()` reads).

| Scenario | Expected | Observed |
|----------|----------|----------|
| user A reads `robots` | only A's row | `rls-test-A` ✓ |
| user B reads `robots` | only B's row | `rls-test-B` ✓ |
| anonymous (`anon`, no claims) | 0 rows | `0` ✓ |
| `robots` policies with `WITH CHECK` (write protection) | ≥1 | 2 ✓ |
| `orders` SELECT/ALL policy present | ≥1 | 1 ✓ |

**Result: PASS.** RLS enforces per-user isolation on reads, blocks anonymous reads,
and constrains writes via `WITH CHECK`. Test principals and rows cleaned up afterward.

> Note: the headless environment blocks outbound HTTP(S), so the GoTrue admin API /
> PostgREST / Realtime-websocket path could not be exercised over the network. RLS was
> instead verified at the database level (the actual enforcement point) via the same
> `request.jwt.claims` mechanism `auth.uid()` consumes — equivalent guarantee for the
> security-critical property. The Realtime publication membership is confirmed in the
> schema; live websocket fan-out should be spot-checked from the React app in Wave 1+.
