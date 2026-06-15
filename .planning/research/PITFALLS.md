# Pitfalls: Vetor Trading Platform

**Researched:** 2026-06-15
**Confidence:** HIGH (B3 market structure, IBKR/ib_insync, backtesting theory, Supabase) | MEDIUM (MetaAPI-specific vendor limits)

---

## Phase-Specific Warning Summary

| Phase | Pitfall | Priority |
|-------|---------|----------|
| Phase 1 | PITFALL-01: Tick data volume | Build ring buffer before first live test |
| Phase 1 | PITFALL-02: MetaAPI WebSocket reconnection | Implement before any robot goes live |
| Phase 1 | PITFALL-06: Order state reconciliation | Implement before first real order |
| Phase 1 | PITFALL-07: B3 circuit breakers (leilão) | Implement halt detection in robot executor |
| Phase 1 | PITFALL-08: Mini-contract expiry edge cases | Build expiry calendar in DB at project start |
| Phase 1 | PITFALL-15: B3 holiday calendar | Timezone-safe from day 1 |
| Phase 1 | PITFALL-16: B3/CME timezone offset (DST) | Timezone-safe from day 1 |
| Phase 1 | PITFALL-11: Supabase free tier limits | Upgrade to Pro before first live order |
| Phase 1 | PITFALL-13: Shared state design | Namespace architecture from Phase 1 even if solo |
| Phase 2 | PITFALL-04: IB Gateway 24h expiry | Use ib-gateway-docker from day 1 of Phase 2 |
| Phase 2 | PITFALL-05: IBKR pacing violations | Implement throttle queue before backtesting |
| Phase 2 | PITFALL-09: Backtest look-ahead bias | Architectural constraint in backtest engine |
| Phase 2 | PITFALL-10: Slippage/commission modeling | Required parameters, not optional |
| Phase 3 | PITFALL-13: SaaS shared state (fix cost) | Expensive to fix if not done in Phase 1 |
| Phase 3 | PITFALL-14: Credential encryption | Before first non-owner user |
| Phase 3 | PITFALL-12: RLS performance | Composite indexes in Phase 1 schema |
| Phase 3 | PITFALL-03: MetaAPI provisioning latency | Design async onboarding at Phase 3 kickoff |

---

## PITFALL-01: Tick Data Volume Underestimation (B3)
**Severity:** CRITICAL | **Phase:** Phase 1

WIN% and WDO% generate 500–3,000+ ticks/second during macro events (FOMC, IPCA, leilão recovery). A naive FastAPI implementation that writes every tick to Supabase Postgres will saturate the DB within minutes and block the async event loop.

**Warning signs:** FastAPI async queue depth growing at 10:00–10:15 BRT open. Supabase write latency >50ms sustained.

**Prevention:**
1. Never write raw ticks to Postgres. Aggregate in FastAPI memory (ring buffer per symbol, `collections.deque(maxlen=N)`) and flush OHLCV aggregates on a timer (every 1s), not per tick.
2. Separate the data pipeline from the order pipeline — different async tasks, no shared queue.
3. Push last-tick price directly to frontend via WebSocket — do not route through DB for display latency.

---

## PITFALL-02: MetaAPI WebSocket Reconnection Gap
**Severity:** CRITICAL | **Phase:** Phase 1

MetaAPI's SDK reconnects automatically but does NOT replay missed ticks from the gap. Strategy state (VWAP, EMA, position flags) computed on corrupted history. Orders placed during the gap have unknown fill status.

**Warning signs:** `on_disconnected` / `on_reconnected` events in logs. Gap >5s between last tick timestamp and current time.

**Prevention:**
1. On reconnection: (a) call `get_positions()`, (b) call `get_orders()`, (c) **reset all strategy in-memory state** — do not attempt to reconstruct from partial history.
2. "Staleness sentinel": no tick received >10s on active symbol → halt order placement until stream confirmed healthy.
3. MetaAPI free tier has documented connection instability — upgrade to paid for production.

---

## PITFALL-03: MetaAPI Rate Limits and Provisioning Latency
**Severity:** HIGH | **Phase:** Phase 3 (design decision in Phase 1)

New MetaAPI account provisioning takes 30–120 seconds. Synchronous onboarding UX causes user abandonment.

**Prevention:**
1. Design onboarding as async flow: submit credentials → "connection pending" → Supabase Realtime notification when ready.
2. Store provisioning state in Supabase (`metaapi_account_status` field), poll MetaAPI status endpoint, push update via Realtime.

---

## PITFALL-04: IB Gateway 24-Hour Session Expiry
**Severity:** CRITICAL | **Phase:** Phase 2

IB Gateway forcibly terminates sessions after 24h. Restart takes 30–90 seconds. Any CME position running through the restart is live in the market but invisible to the system during the restart window.

**Prevention:**
1. Use `ib-gateway-docker` with IBC utility for auto-login and session management.
2. Schedule daily restart at 05:00 ET (between CME MBT settlement and next session open).
3. On `disconnectedEvent`, enter reconnect loop, then re-subscribe to market data and reconcile positions.
4. Heartbeat: `ib.reqCurrentTime()` every 30s — fail fast if no response.

---

## PITFALL-05: IBKR Pacing Violations (Historical Data)
**Severity:** HIGH | **Phase:** Phase 2

IBKR limits: max 60 historical requests per 10-minute window, no identical requests within 15s, max 6 simultaneous subscriptions. Burst requests at startup trigger a 10+ minute lockout (error code 162).

**Prevention:**
1. Throttle queue for all historical data: `asyncio.Semaphore(6)` for concurrency + token bucket (60/10min) for rate.
2. Cache historical responses in Supabase — request from IBKR only for data newer than cache.
3. Stagger startup requests with 2–3 second delays between symbols.
4. Use `reqRealTimeBars` (5-second bars) for strategy warm-up during market hours — does not count against pacing limits.

---

## PITFALL-06: Order State Reconciliation on Network Drop
**Severity:** CRITICAL | **Phase:** Phase 1

Network drop after order is sent but before acknowledgement → system does not know if order was received. Resending creates duplicate position (2x exposure). Not resending creates a ghost order (fill happens at broker but not tracked locally).

**Prevention:**
1. Every order includes a deterministic client-side ID in MetaAPI's `comment` field, derived from `(user_id, robot_id, signal_timestamp)`.
2. After order send, poll `get_orders()` / `get_positions()` using clientId to confirm — do not rely solely on WebSocket events.
3. On startup and after every reconnection, run full reconciliation: broker positions vs local DB.
4. DB state machine for orders: `QUEUED → SENDING → SENT → CONFIRMED → FILLED | CANCELLED | ERROR`. Any state stuck >30s triggers reconciliation.

---

## PITFALL-07: B3 Circuit Breakers (Leilão) Breaking Strategy State
**Severity:** HIGH | **Phase:** Phase 1

B3 circuit breakers (leilão de volatilidade) trigger on moves >3% for Ibovespa instruments. During leilão: no new orders accepted, existing limit orders cannot be cancelled, duration is 5–15 min with random end time.

**Prevention:**
1. Halt mode trigger: no tick received for >60s on normally-active symbol during trading hours.
2. In halt mode: suspend new signal generation. Do NOT attempt to cancel orders (rejected anyway).
3. On resumption: wait 30s before resuming strategy. Query all open positions before generating new signals.
4. Never generate new entry signal within 5 minutes of leilão resumption — auction clear distorts momentum indicators.

---

## PITFALL-08: Mini-Contract Expiry Edge Cases (B3)
**Severity:** HIGH | **Phase:** Phase 1

WIN% and WDO% expire on the 3rd Monday of expiry months (Feb, Apr, Jun, Aug, Oct, Dec). BIT% expires on the 3rd Friday. On expiry day, liquidity migrates to next-month contract — volume-based strategies generate false signals.

**Prevention:**
1. Maintain B3 contract expiry calendar in DB (derived from B3 rules).
2. On expiry day and day before: disable volume-dependent signals (VWAP, volume profile).
3. Force-close all expiring contract positions by 16:50 BRT on expiry day (settlement auction at 16:55 BRT).
4. Backtests: use back-adjusted continuous data with proper rollover dates.

---

## PITFALL-09: Backtesting Look-Ahead Bias via DataFrame Operations
**Severity:** CRITICAL | **Phase:** Phase 2

Vectorized pandas indicator computation on full historical DataFrames uses future data. The EMA at bar N in a full-DataFrame computation differs from the EMA computed on just bars 1..N. Bias is invisible and systematically overstates backtest results.

**Warning signs:** Backtest Sharpe ratio >3 on raw futures data (suspect). Live trading drawdown >2x backtest drawdown.

**Prevention:**
1. Never compute indicators on the full DataFrame vectorized. Use event-driven loop or `df.iloc[:i+1]` slices.
2. Entry price must be modeled as next bar's open — not signal bar's close.
3. Sanity check: compute indicator at bar 100 using "full DataFrame" method vs bar-by-bar. Any difference = look-ahead contamination.

---

## PITFALL-10: Slippage and Commission Modeling Omissions
**Severity:** HIGH | **Phase:** Phase 2

B3 round-trip costs: WIN% ~R$3–4/contract, WDO% ~R$2–3/contract, BIT% ~R$6–10/contract, CME MBT ~$4.70/contract. Slippage on WIN% during high-volatility: 5–10 ticks (~R$25–50/contract) per entry is common.

**Prevention:**
1. Commission models are required parameters in the backtest engine, not optional — fail loud if not provided.
2. WIN% slippage model: 3–5 ticks minimum on entries (adjustable parameter).
3. Run cost sensitivity analysis: at what slippage/commission does the strategy go negative?
4. Verify exact BTG Pactual commission rates from broker fee schedule.

---

## PITFALL-11: Supabase Free Tier Limits at Trading Scale
**Severity:** HIGH | **Phase:** Phase 1

Free tier: 500MB storage, 2GB bandwidth/month, 200 concurrent connections. A trading platform hits storage in weeks and bandwidth quickly via Realtime WebSocket pushes.

**Prevention:**
1. Store only OHLCV bars, orders, fills, equity snapshots — not raw ticks.
2. Budget Supabase Pro ($25/month) from the moment any second user is added.
3. 90-day data retention policy on OHLCV bars in the live DB.

---

## PITFALL-12: Row-Level Security Performance on Order History
**Severity:** MEDIUM | **Phase:** Phase 3

Supabase RLS policies using `auth.uid()` on large tables can cause sequential scans even with indexes, particularly when the policy uses subqueries.

**Prevention:**
1. Composite indexes including `user_id`: `CREATE INDEX ON orders (user_id, created_at DESC)`.
2. RLS policy uses direct column reference: `USING (user_id = auth.uid())` — never a subquery form.
3. Test with `SET ROLE authenticated` and `EXPLAIN ANALYZE` before launch.

---

## PITFALL-13: SaaS Shared State Between Users
**Severity:** CRITICAL | **Phase:** Must be designed in Phase 1, fails visibly in Phase 3

Solo-phase FastAPI commonly uses module-level dicts for connection handles. When user B is added, their robot may get user A's MetaAPI connection handle or strategy state — ghost positions, wrong fills, incorrect P&L.

**Prevention:**
1. From Phase 1: namespace every in-memory structure by `(user_id, robot_id)`. Use `connections[user_id][robot_id]`, never `connections[robot_id]`.
2. `user_id` is a required field on every state object — use Pydantic models, not raw dicts.
3. Design `ConnectionManager` class with multi-user architecture from Phase 1. Refactoring cost from single to multi-user is 5–10x the cost of doing it right initially.

---

## PITFALL-14: Credential Management at SaaS Scale
**Severity:** HIGH | **Phase:** Phase 3

MT5 credentials (login, password, server) and IBKR credentials stored in Supabase represent real money. Plaintext storage + DB breach = all user broker accounts compromised.

**Prevention:**
1. Application-level encryption for broker credentials using Python `cryptography` (Fernet), key in environment variable.
2. For MetaAPI: once provisioned, store only the MetaAPI account ID, not the raw MT5 password.
3. Never log credentials. Add Pydantic `__repr__` overrides to redact sensitive fields.

---

## PITFALL-15: B3 Holiday Calendar Edge Cases
**Severity:** MEDIUM | **Phase:** Phase 1

B3 has a complex holiday calendar distinct from federal holidays. Carnival = 2-day halt. Corpus Christi, São Paulo municipal holidays, and election days add partial halts.

**Prevention:**
1. Maintain B3 holiday calendar in DB, updated annually from B3's January publication.
2. Trading hours guard: (a) is today a B3 holiday?, (b) is current time within 10:00–17:55 BRT?, (c) is tick stream healthy? All three required for signal generation.
3. Always use `zoneinfo` / `pytz` with `America/Sao_Paulo` — never hardcode UTC offsets.

---

## PITFALL-16: B3/CME Time Offset Shifts with US DST
**Severity:** HIGH | **Phase:** Phase 1

Brazil eliminated DST in 2019 (always UTC-3). The US still observes DST (CME is Chicago). The B3–CME time offset changes twice per year (March and November US transitions). Hardcoded offset = wrong CME trading hours for half the year.

**Prevention:**
1. Use IANA timezone names everywhere: `America/Sao_Paulo` for B3, `America/Chicago` for CME.
2. Explicitly test trading hour calculations on the second Sunday of March and first Sunday of November.

---

## Open Questions (Require Empirical Testing)

- Actual MetaAPI reconnection duration when BTG MT5 server is under load (needs live testing on owner's account)
- Exact BTG Pactual commission rates for mini-contracts (needs confirmation from broker fee schedule)
- MetaAPI free tier maximum simultaneous account count (verify from current MetaAPI pricing page before Phase 3 planning)
- Whether MetaAPI exposes B3 trading session state (halt detection) or if circuit breaker detection requires a separate tick-silence heuristic
