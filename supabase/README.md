# Supabase — Vetor Trading Platform

This directory contains all Supabase migrations, seed data, and smoke-test
documentation for Phase 1.

---

## Directory Layout

```
supabase/
├── migrations/
│   ├── 0001_init_schema.sql          # 11 Phase 1 tables
│   ├── 0002_rls_policies.sql         # RLS ENABLE + per-user policies
│   └── 0003_realtime_publication.sql # Realtime publication for robots/orders/backtests
└── seed/
    ├── seed_b3_calendar.py           # Generator script (python3)
    └── b3_contracts_2026_2027.sql    # Generated seed — run after migrations
```

---

## Applying Migrations

### Option A — Supabase CLI (recommended)

```bash
# Install CLI if needed
npm install -g supabase

# Link to your project (run once)
supabase link --project-ref <YOUR_PROJECT_REF>

# Push all pending migrations
supabase db push
```

### Option B — Supabase SQL Editor

Open the Supabase Dashboard → SQL Editor and run each file in order:

1. `supabase/migrations/0001_init_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_realtime_publication.sql`

### Loading the B3 Seed

After migrations are applied, run the seed in the SQL Editor:

```bash
# Or copy-paste the content of:
supabase/seed/b3_contracts_2026_2027.sql
```

---

## Required Environment Variables

### Backend (`backend/.env`)

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon/public key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
SUPABASE_JWT_SECRET=<JWT secret>
```

The `SUPABASE_JWT_SECRET` is used by the FastAPI JWT guard to validate tokens
offline (no network round-trip). Fetch it from:
Dashboard → Settings → API → JWT Settings → JWT Secret.

The `SUPABASE_SERVICE_ROLE_KEY` allows the backend to bypass RLS when writing
orders, equity snapshots, and status updates. **Never expose this to the
frontend.**

### Frontend (`frontend/.env`)

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon/public key>
```

The frontend uses only the anon key. RLS on the Postgres side enforces that
every user sees only their own rows.

---

## Tables

| Table               | Purpose                                          | RLS  |
|---------------------|--------------------------------------------------|------|
| profiles            | Extends auth.users with name/phone/cpf/avatar    | Yes  |
| robots              | Robot configuration, mode, asset, params         | Yes  |
| b3_contracts        | B3 expiry calendar — shared reference            | SELECT only (authenticated) |
| orders              | Live trading orders with idempotency key         | Yes  |
| order_events        | Full event log per order (SUM-05)                | Yes (via orders subquery) |
| equity_snapshots    | Equity curve data appended per fill              | Yes  |
| backtests           | Backtest jobs + result metrics                   | Yes  |
| backtest_orders     | Simulated orders from backtests                  | Yes  |
| broker_connections  | MetaAPI account linkage (no raw MT5 creds)       | Yes  |
| user_preferences    | Notification, decimal, currency prefs            | Yes  |
| user_credits        | Backtest credit balance                          | Yes  |

---

## Realtime Channels

Tables in the `supabase_realtime` publication (added by 0003):

- `robots` — status changes (rascunho → executando → parado) fan out to the
  robot list and editor header in real time.
- `orders` — fill events trigger equity chart updates and order list refresh
  on the Sumário screen (D-02, D-03).
- `backtests` — status transitions (queued → processing → completed) update
  the backtest list without polling.

Subscribe from the frontend:

```typescript
const channel = supabase
  .channel(`orders-${robotId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `robot_id=eq.${robotId}`,
  }, (payload) => {
    // handle INSERT/UPDATE
  })
  .subscribe();
```

RLS is enforced server-side — a user subscribed to another user's robot_id
will receive no events.

---

## Smoke Test

See `docs/realtime-rls-smoke-test.md` for the Realtime+RLS isolation test
that must pass before Wave 2+ plans begin (RISK-05 mitigation).
