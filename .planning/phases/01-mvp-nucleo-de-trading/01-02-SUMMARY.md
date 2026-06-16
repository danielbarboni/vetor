---
phase: 01-mvp-nucleo-de-trading
plan: "02"
subsystem: database
tags: [supabase, postgres, rls, realtime, b3-calendar, schema, seed]
dependency_graph:
  requires: []
  provides:
    - supabase-schema-phase1
    - rls-policies-all-tables
    - realtime-publication-robots-orders-backtests
    - b3-expiry-calendar-2026-2027
  affects:
    - all-subsequent-plans (schema is the data foundation)
    - plan-05 (orders/robots writes)
    - plan-10-11-12-13 (execution, broker, reporting, backtest)
tech_stack:
  added:
    - supabase migrations (SQL DDL)
    - python3 zoneinfo (stdlib) for B3 calendar generation
  patterns:
    - RLS USING (user_id = auth.uid()) on all user-scoped tables
    - order_events access via subquery on orders
    - b3_contracts SELECT-only for authenticated role (no client writes)
    - supabase_realtime publication for postgres_changes fan-out
key_files:
  created:
    - supabase/migrations/0001_init_schema.sql
    - supabase/migrations/0002_rls_policies.sql
    - supabase/migrations/0003_realtime_publication.sql
    - supabase/seed/seed_b3_calendar.py
    - supabase/seed/b3_contracts_2026_2027.sql
    - supabase/README.md
  modified: []
decisions:
  - "WIN%/WDO% expiry = Wednesday nearest 15th of even-month (B3 mini-futures rule)"
  - "BIT% expiry = 3rd Friday of every month (all 12 months)"
  - "Rollover = T-5 business days before expiry (Mon-Fri count, no holiday correction in seed)"
  - "Front months relative to 2026-06-16: WINM26/WDOM26 (2026-06-17), BITM26 (2026-06-19)"
  - "order_events RLS uses subquery on orders rather than a direct user_id column (table has no user_id)"
  - "user_credits INSERT/UPDATE restricted to service role only (frontend reads balance, backend awards)"
metrics:
  duration: "~25 min"
  completed_date: "2026-06-16"
  tasks_completed: 2
  tasks_total: 3
  files_created: 6
---

# Phase 1 Plan 02: Supabase Schema + RLS + Realtime + B3 Calendar — Summary

**One-liner:** Full 11-table Postgres schema with per-user RLS, Realtime publication for robots/orders/backtests, and a generated B3 expiry calendar seed (48 contracts, 2026-2027).

---

## Status: AUTHORING COMPLETE — APPLY DEFERRED

Tasks 1 and 2 are authored and committed. **Task 3 (apply migrations to live Supabase + RLS/Realtime smoke test) is intentionally deferred** — the Supabase dev project did not exist at execution time. No migrations have been applied to any hosted project.

Plans 05, 10, 11, 12, 13 and all Wave 2+ plans **CANNOT begin** until Task 3 is cleared.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Schema + RLS + Realtime migrations | ec28cab | 0001_init_schema.sql, 0002_rls_policies.sql, 0003_realtime_publication.sql, supabase/README.md |
| 2 | B3 expiry calendar seed | 181adb8 | seed_b3_calendar.py, b3_contracts_2026_2027.sql |

---

## Task 3 — Deferred: What the User Must Do

### Prerequisites
- A Supabase project created and accessible (URL, anon key, service role key, JWT secret)

### Step-by-step

**1. Apply migrations** (pick one method):

```bash
# Option A — Supabase CLI
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push

# Option B — SQL Editor (run in order)
# 1. supabase/migrations/0001_init_schema.sql
# 2. supabase/migrations/0002_rls_policies.sql
# 3. supabase/migrations/0003_realtime_publication.sql
```

**2. Load the B3 seed**

In the Supabase SQL Editor, paste the contents of:
`supabase/seed/b3_contracts_2026_2027.sql`

**3. Verify in the Supabase Dashboard**

- Table Editor: confirm all 11 tables exist
- Authentication → Policies: confirm RLS is ON for every user-scoped table
- Database → Replication: confirm robots, orders, backtests appear under the supabase_realtime publication

**4. Run the RLS + Realtime smoke test** (RISK-05 mitigation)

With two authenticated test users (A and B):

```javascript
// User A — subscribe in browser console / Node script
const channel = supabase
  .channel('smoke-test-a')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'orders',
    filter: `user_id=eq.${userA_id}`,
  }, (payload) => console.log('A received:', payload))
  .subscribe();

// Insert one order row for user A (via service role or SQL Editor)
// Insert one order row for user B
// Expected: User A receives ONLY A's event. User B's event must NOT appear.
```

Document the result in `docs/realtime-rls-smoke-test.md`.

**5. Verify front months**

```sql
SELECT asset, symbol, expiry_date
FROM b3_contracts
WHERE is_front_month = true
ORDER BY asset;
-- Expected: exactly 3 rows (one per asset)
-- WIN%: WINM26  2026-06-17
-- WDO%: WDOM26  2026-06-17
-- BIT%: BITM26  2026-06-19
```

**6. Resume signal**

Once all steps pass, resume plan 01-02 continuation by providing:
> "approved" — or describe any failures.

---

## What Was Built

### 0001_init_schema.sql — 11 tables

| Table | Key constraints |
|-------|----------------|
| profiles | PK = auth.users(id) |
| robots | CHECK mode/status/asset/fill_policy; UNIQUE(user_id,name); updated_at trigger |
| b3_contracts | SERIAL PK; asset/symbol/expiry/rollover/is_front_month |
| orders | client_order_id TEXT UNIQUE (idempotency T-01-02); composite indexes (PITFALL-12) |
| order_events | FK orders(id) ON DELETE CASCADE |
| equity_snapshots | index (robot_id, snapshot_at DESC) |
| backtests | CHECK status/fill_policy |
| backtest_orders | mirrors orders schema; FK backtests(id) |
| broker_connections | metaapi_account_id (no raw MT5 creds) |
| user_preferences | updated_at trigger |
| user_credits | service-role write only |

### 0002_rls_policies.sql — RLS on all user-scoped tables

- All 10 user-scoped tables: ENABLE ROW LEVEL SECURITY + SELECT/INSERT/UPDATE/DELETE policies using `user_id = auth.uid()`
- profiles: keyed on `id = auth.uid()`
- order_events: subquery `order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())`
- b3_contracts: SELECT-only for `auth.role() = 'authenticated'` (T-01-06)

### 0003_realtime_publication.sql — Realtime fan-out

Adds `robots`, `orders`, `backtests` to `supabase_realtime` publication (D-02).

### seed_b3_calendar.py + b3_contracts_2026_2027.sql

- 48 contracts total: 12 WIN% + 12 WDO% (even months) + 24 BIT% (monthly)
- Month codes verified against standard table (F G H J K M N Q U V X Z)
- Rollover dates: T-5 business days before expiry
- Front months (2026-06-16 reference): WINM26, WDOM26, BITM26

---

## Deviations from Plan

None — plan executed as written for Tasks 1 and 2. Task 3 intentionally deferred per `<deferred_checkpoint>` instruction.

---

## Threat Model Coverage

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-01-01 Info Disclosure (user A reads user B) | RLS USING (user_id = auth.uid()) on all tables | Authored — pending smoke test |
| T-01-02 Tampering (duplicate order on retry) | orders.client_order_id UNIQUE | Authored |
| T-01-06 Info Disclosure (b3_contracts writable by client) | SELECT-only policy for authenticated role | Authored |

---

## Self-Check: PASSED

| Item | Status |
|------|--------|
| supabase/migrations/0001_init_schema.sql | FOUND |
| supabase/migrations/0002_rls_policies.sql | FOUND |
| supabase/migrations/0003_realtime_publication.sql | FOUND |
| supabase/seed/seed_b3_calendar.py | FOUND |
| supabase/seed/b3_contracts_2026_2027.sql | FOUND |
| Commit ec28cab (Task 1) | FOUND |
| Commit 181adb8 (Task 2) | FOUND |
