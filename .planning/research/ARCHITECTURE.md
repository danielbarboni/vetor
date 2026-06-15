# Architecture: Vetor Trading Platform

**Researched:** 2026-06-15
**Confidence:** HIGH (asyncio/FastAPI/Supabase/RLS patterns) | MEDIUM (MetaAPI SDK specifics — verify against current SDK)

---

## System Overview

```
EXTERNAL BROKERS
  MetaAPI Cloud (BTG MT5 / B3) ──WS──→ MetaAPIAdapter
  IB Gateway (Vultr VPS / CME) ──TCP──→ IBKRAdapter
                                              │
                                      BrokerPort (ABC)
                                              │
                          ┌───────────────────┼──────────────────┐
                          │                   │                  │
                     TickRouter        RobotEngine          REST API
                  (asyncio pub/sub)  (asyncio Tasks)     /api/v1/...
                          │                   │
               ┌──────────┼──────────┐   RobotInstance
               │          │          │   ├─ state machine
          WS endpoint  Supabase  Backtest  ├─ strategy fn
          /ws/market    Writer   Worker    └─ order manager
               │          │   (ProcessPool)
               │      Supabase PG
               │      (orders, trades,
               │       positions, robots)
               │          │
               │     Supabase Realtime
               │     (logical replication)
               │          │
REACT FRONTEND (Cloudflare Pages)
  ├─ Native WS → /ws/market  (ticks only — lowest latency)
  ├─ Supabase JS → Realtime  (orders, robot state, P&L)
  └─ REST → /api/v1/         (robot control, reports, backtest)
```

---

## 1. Tick Data Path (Broker to UI)

**Do NOT route ticks through Supabase Realtime.** Writing a DB row per tick at 5 ticks/sec × 4 symbols = 1.7M rows/day blows past Supabase free tier write limits and adds 200–800ms DB-write latency.

| Data type | Path | Latency |
|-----------|------|---------|
| Live ticks (price display, charts) | MetaAPI WS → FastAPI WS → React | 50–250ms |
| Order fills, position changes | MetaAPI WS → SupabaseWriter → Supabase Realtime → React | 200–800ms |
| Robot state changes (start/stop/pause) | FastAPI REST → Supabase → Supabase Realtime → React | 200–800ms |

FastAPI maintains a `ConnectionManager` that maps `symbol → set[WebSocket]`. The `MetaAPIAdapter.on_tick()` callback calls `TickRouter.publish(symbol, tick)`, which fans out to the ConnectionManager (for UI) AND to each `RobotInstance.tick_queue` (for signal computation).

---

## 2. Robot Execution Model

**Pattern: asyncio Task per robot, state machine, strategy as pure function**

Each robot is a long-running `asyncio.Task` — not a thread (GIL contention), not a subprocess (too heavy for solo phase). `RobotEngine` singleton manages `{robot_id → asyncio.Task}`.

**State machine:**
```
STOPPED → STARTING → RUNNING ⇄ PAUSED
                         ↓
                      STOPPING → STOPPED
                         ↓
                       ERROR → STARTING (retry with backoff)
```

**Internal structure:**
```python
class RobotInstance:
    tick_queue: asyncio.Queue   # receives ticks from TickRouter
    strategy: StrategyBase      # pure on_tick(tick, position) → Signal
    broker: BrokerPort          # injected; places orders

    async def run(self):
        while self.state not in (STOPPED, ERROR):
            tick = await self.tick_queue.get()
            if self.state == RUNNING:
                signal = self.strategy.on_tick(tick, self.position)
                if signal:
                    await self._execute_signal(signal)
```

**Critical:** `StrategyBase.on_tick()` must be a pure CPU function — no await, no I/O, no side effects. This makes the same strategy class usable in both live execution AND backtesting without modification.

---

## 3. Broker Abstraction Layer

```python
class BrokerPort(ABC):
    async def subscribe_ticks(self, symbol: str, callback: Callable) -> None: ...
    async def place_order(self, order: OrderRequest) -> OrderResult: ...
    async def cancel_order(self, order_id: str) -> None: ...
    async def get_positions(self) -> list[Position]: ...
    async def get_account_info(self) -> AccountInfo: ...
```

**MetaAPIAdapter:** Wraps `metaapi_cloud_sdk`. One `StreamingMetaApiConnection` per broker account — NOT per robot. Ticks shared via TickRouter.

**IBKRAdapter:** `ib_insync` conflicts with FastAPI's uvicorn asyncio loop. Use bridge pattern: IBKRAdapter wraps ib_insync in a dedicated thread, uses a `queue.Queue` for IB callbacks, and an asyncio task to drain the queue into TickRouter. IB Gateway runs as `ib-gateway-docker` container on the same VPS (TCP localhost:4001).

**Critical rule:** One MetaAPI connection per broker account, shared across all robots. Never create one connection per robot.

---

## 4. Backtest Architecture

**Pattern: ProcessPoolExecutor, no Celery in Phase 1**

Backtests are CPU-bound (replaying years of tick data). Must run in `ProcessPoolExecutor` — a blocking strategy computation in the event loop stalls all live robots.

```
REST POST /api/v1/backtests
  → Create backtest record (status=QUEUED) in Supabase
  → asyncio.get_event_loop().run_in_executor(pool, run_backtest, params)
  → Subprocess: pure function, loads ticks from DB, runs strategy loop
  → Subprocess returns result dict
  → FastAPI awaits result, writes to Supabase (status=COMPLETED)
  → Supabase Realtime pushes to React
```

`run_backtest()` must be a pure function: no DB connections, no asyncio, no shared state. Receives historical ticks as a list, returns a result dict.

**Upgrade path:** When SaaS demands parallel backtests, replace `run_in_executor` with Celery task. Zero schema changes — only dispatch mechanism changes.

---

## 5. Database Schema (Key Patterns)

**6 core tables: broker_accounts, robots, orders, positions, trades, backtests**

Every table has `user_id UUID REFERENCES auth.users NOT NULL`. Foreign keys: users → broker_accounts → robots → orders/positions/trades.

Key decisions:
- `robots.strategy_params JSONB` — stores all 7 strategy types' parameters without a type-per-table explosion
- `orders` table records broker execution (bid/ask fills, broker IDs); `trades` table records closed P&L (entry + exit order pair)
- `positions` is a live snapshot — updated on every fill; NOT derived from orders on read (too slow at scale)
- `backtests.result JSONB` — equity curve, trade list, metrics stored as one JSON blob in solo phase

**Equity curve query:**
```sql
SELECT closed_at, SUM(realized_pnl) OVER (ORDER BY closed_at)
FROM trades WHERE robot_id = $1 ORDER BY closed_at;
```

**IRRF tax classification** (future-proof from day one):
- Add `trade_type VARCHAR` column on `trades`: `'day_trade'` or `'swing_trade'`
- Determined at trade close time: same-day open+close = day_trade, else swing_trade
- Required for Phase 3 IRRF tax export differentiator

---

## 6. Auth + Multi-Tenancy

**Pattern: RLS on every table, user_id always from JWT**

```sql
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own data" ON robots FOR ALL
  USING (auth.uid() = user_id);
```

FastAPI validates Supabase JWT with `jose.jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")`. Extracts `user_id = payload["sub"]`.

- All FastAPI→Supabase writes: **service role key** (bypasses RLS), but explicitly set `user_id` from validated JWT
- Frontend queries: **anon key** + user JWT (RLS enforces isolation)
- **Never accept `user_id` from request body** — always from validated JWT only

Composite indexes required for RLS performance:
```sql
CREATE INDEX ON orders (user_id, created_at DESC);
CREATE INDEX ON trades (user_id, robot_id, closed_at DESC);
```

---

## 7. WebSocket Management

**Pattern: ConnectionManager singleton, asyncio broadcast, no Redis in Phase 1**

```python
class ConnectionManager:
    _subscribers: dict[str, set[tuple[UUID, WebSocket]]]  # symbol → clients

    async def broadcast_tick(self, symbol: str, tick: Tick):
        # asyncio.gather() for concurrent sends; remove dead connections on failure
```

All WS handlers are `async def` — yield to event loop on every `await`. At solo phase load (1 user, 4 symbols, ~5 ticks/sec), single event loop handles this trivially.

**Redis upgrade trigger:** ~50+ concurrent users subscribing to the same symbols AND backtest workers moved to separate processes.

---

## Phase 1 Build Order

Dependencies are strict — do not reorder:

```
1.  Supabase schema + RLS policies          (everything depends on this)
2.  FastAPI skeleton + JWT auth middleware  (required before any endpoint)
3.  BrokerPort ABC + MetaAPIAdapter         (test with manual tick subscription)
4.  TickRouter (in-process pub/sub)         (required before WS + robot engine)
5.  FastAPI WS /ws/market + ConnectionManager
6.  React auth flow + Supabase JS client
7.  Robot CRUD REST + React robot list/creation UI
8.  RobotInstance + StrategyBase (ONE strategy first: LW or IT)
9.  RobotEngine (start/stop/pause lifecycle)
10. SupabaseWriter + Supabase Realtime → React
11. Robot report screens (Sumário + Gráfico)
12. Remaining 6 strategy types (parallel, independent)
```

Phase 2 additions (no schema changes needed):
```
13. BacktestWorker + ProcessPoolExecutor
14. IBKRAdapter + IB Gateway Docker (scaffold Docker Compose in Phase 1, leave inactive)
15. Portfolio aggregate views (query-only, no new tables)
```

---

## Scalability Path (Solo → SaaS)

| Concern | Solo Phase 1 | SaaS v1 (10–100 users) | SaaS v2 (1000+) |
|---------|-------------|------------------------|-----------------|
| Robot execution | asyncio Tasks, one process | Same — scales to 100s of Tasks | Extract to dedicated worker service |
| Tick routing | In-process asyncio pub/sub | Symbol dedup: one MetaAPI connection per symbol shared across users | Redis pub/sub |
| Backtest | ProcessPoolExecutor | Same + credit rate limiting | Celery + Redis |
| MetaAPI | One account (owner's) | Per-user MetaAPI accounts | MetaAPI handles scale |
| IB Gateway | One container on VPS | One per IBKR user | Managed container service |
| DB | Supabase free | Supabase Pro ($25/mo) | Pro + read replicas |

**Key invariant:** `user_id` column + RLS on every table means user #2 requires zero schema migrations. SaaS data model is in place from day one.

---

## Critical Anti-Patterns

1. **Persisting every tick to Supabase** — DB write bottleneck. Use FastAPI WS for ticks, Supabase only for order/state events.
2. **Blocking event loop in strategy code** — `time.sleep()` or sync HTTP in `on_tick()` stalls ALL robots. Strategies must be pure CPU.
3. **One MetaAPI connection per robot** — MetaAPI charges per connection; ticks are duplicated. One connection per broker account.
4. **Running ib_insync in FastAPI's asyncio loop** — use thread bridge pattern.
5. **Trusting `user_id` from request payload** — always from validated JWT only.
6. **Module-level dicts for connection handles** — namespace by `(user_id, robot_id)` from Phase 1.
