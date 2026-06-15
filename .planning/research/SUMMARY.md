# Research Summary — Vetor Trading Platform

**Synthesized:** 2026-06-15
**Inputs:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Consumer:** gsd-roadmapper agent

---

## Executive Summary

Vetor is a no-code algorithmic trading SaaS for Brazilian retail traders, targeting B3 futures (WIN%, WDO%, BIT%) via MetaAPI/BTG MT5 and CME futures (MBT) via IBKR. The core competitive premise is replacing code-based platforms (MT5/MQL5, Profit Pro/NTSL) with a visual, form-based robot configurator — reaching the 80% of retail algo traders who cannot program. The architecture must handle two radically different data velocities simultaneously: high-frequency tick streams (500–3,000+ ticks/sec during volatility) that must never touch the database, and low-frequency state events (orders, fills, robot status) that drive the Supabase Realtime UI layer.

The recommended architecture is FastAPI (async) on a São Paulo VPS as the integration hub: MetaAPI WebSocket feeds tick data into asyncio tasks per robot, ticks are fanned out to browser via native WebSocket/SSE while OHLCV aggregates and order events are written to Supabase. The SaaS data model (user_id on every table, RLS on every table) must be built into Phase 1 even though Phase 1 serves a single user — retrofitting multi-tenancy is a 5–10x more expensive fix than doing it once.

The critical Phase 1 risk is not complexity but correctness: B3 market structure (circuit breakers, contract expiry, holiday calendar, DST-safe timezone handling) and broker reliability (MetaAPI reconnection gaps, order state reconciliation on network drop) must be treated as non-negotiable requirements in Phase 1. Skipping them produces a platform that silently misbehaves with real money on the line.

---

## Recommended Stack

### Frontend
| Layer | Choice | Version |
|-------|--------|---------|
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Build | Vite | 5.x |
| Global state | Zustand | 4.x |
| Server state | TanStack Query | 5.x |
| Charts | ECharts | 5.x |
| Tables | AG Grid Community | 31.x |
| Styling | Tailwind CSS | 3.x + Blue Hour tokens |

**Do not use:** Redux Toolkit, Socket.io, Lightweight Charts (license), react-virtualized.

### Backend
| Layer | Choice | Version |
|-------|--------|---------|
| Runtime | Python | 3.11+ (avoid 3.13) |
| API | FastAPI | 0.111+ |
| ASGI | Uvicorn | 0.29+ |
| B3 broker | metaapi-cloud-sdk | verify PyPI |
| CME broker | ib_insync | 0.9.86, verify PyPI |
| DB/Auth | supabase-py | 2.x |
| JWT | python-jose | 3.3.x |
| Scheduler | APScheduler | 3.10+ |
| Validation | pydantic | 2.x |

**Do not use:** Celery+Redis (Phase 1), SQLAlchemy, asyncpg directly, Starlette WS for ticks.

### Infrastructure
| Component | Choice |
|-----------|--------|
| Frontend | Cloudflare Pages (free) |
| API server | Vultr VPS São Paulo (~$12/mo) |
| IB Gateway | ghcr.io/gnzsnz/ib-gateway Docker image |
| Process mgr | systemd (not Docker for FastAPI in Phase 1) |
| Reverse proxy | Nginx (SSL termination + SSE buffering headers) |
| DB/Auth/Realtime | Supabase (free tier -> Pro at first second user) |

**Versions to verify before pinning:** metaapi-cloud-sdk, ib_insync, supabase-py on PyPI; ag-grid-community, echarts on npm.

---

## Table Stakes vs Differentiators

### Phase 1 must-ship (table stakes — absence causes user abandonment)
1. Robot list with status badges, per-robot P&L, open position summary
2. Robot creation wizard + editors for all 7 strategy types
3. Start / Stop / Pause per robot
4. Active order list + trade log per robot (intra-day)
5. Daily loss limit + max contracts per robot
6. Live equity curve per robot (real-time, appended per trade)
7. B3 mini-contract P&L math (WIN% R$0.20/pt, WDO% R$10/pt, BIT% R$5/pt)
8. B3 trading hours enforcement + BRL formatting throughout

### Phase 2 differentiators (competitive advantage over Profit Pro / MT5)
1. Single backtest + equity curve + 5 key metrics
2. Mass backtest / parameter sweep
3. B3 holiday + rolagem calendar enforcement in backtest engine
4. Portfolio aggregate view (equity curve + P&L attribution across robots)
5. Capital allocation per robot

### Defer to Phase 3+
- Walk-forward analysis (Very High complexity)
- Monte Carlo simulation (Very High complexity)
- IRRF tax reporting export (High complexity — but store trade_type column from Phase 1)
- SmartStore marketplace with audited backtest results
- Social copy-trading (avoid — CVM regulatory risk)
- Browser-based code editor (anti-feature — undermines no-code premise)

---

## Architecture Decision Record

| Decision | Pattern | Rationale |
|----------|---------|-----------|
| Tick delivery | FastAPI WebSocket/SSE direct to browser | Supabase Realtime routes through US East; unacceptable latency for Sao Paulo VPS to BR client. Never write raw ticks to DB. |
| Order/state delivery | Supabase Realtime (postgres_changes) | Low-frequency events; DB is source of truth; Realtime handles fan-out to React |
| Robot execution | asyncio Task per robot, state machine | Not threads (GIL), not subprocesses (too heavy). StrategyBase.on_tick() is pure CPU — same class used in live and backtest. |
| Broker abstraction | BrokerPort ABC | MetaAPIAdapter (B3) and IBKRAdapter (CME) behind same interface; one MetaAPI connection per broker account, never per robot |
| IB Gateway event loop | Thread bridge pattern | ib_insync conflicts with uvicorn asyncio loop; wrap in dedicated thread with queue.Queue bridge |
| Backtest isolation | ProcessPoolExecutor (no Celery) | CPU-bound; must not block event loop; upgrade to Celery later by swapping dispatch only |
| Multi-tenancy | user_id on every table + RLS | SaaS data model in Phase 1 even solo; retrofitting is 5-10x more expensive |
| Tick memory | Ring buffer (collections.deque) | Aggregate to OHLCV in FastAPI, flush on timer; never write raw ticks to Supabase |

### Key component build order (Phase 1 — do not reorder)
```
1.  Supabase schema + RLS policies
2.  FastAPI skeleton + JWT auth middleware
3.  BrokerPort ABC + MetaAPIAdapter
4.  TickRouter (asyncio pub/sub)
5.  FastAPI WS + ConnectionManager
6.  React auth + Supabase JS client
7.  Robot CRUD REST + React UI
8.  RobotInstance + StrategyBase (one strategy first)
9.  RobotEngine (start/stop/pause lifecycle)
10. SupabaseWriter + Supabase Realtime to React
11. Robot report screens
12. Remaining 6 strategy types
```

---

## Critical Pitfalls — Must Address in Phase 1

These are not deferred risks. They involve real money and are silent failures.

### 1. MetaAPI reconnection gap — CRITICAL
On reconnect, SDK does NOT replay missed ticks. Strategy state (VWAP, EMA, position flags) is corrupted.
**Fix:** On reconnect: call get_positions() + get_orders(), then reset ALL strategy in-memory state. Add staleness sentinel: no tick >10s on active symbol halts order placement.

### 2. Order state reconciliation — CRITICAL
Network drop after order sent but before ACK creates duplicate position (resend) or ghost order (no resend).
**Fix:** Every order carries a deterministic client-side ID in MetaAPI's comment field derived from (user_id, robot_id, signal_timestamp). Implement order state machine: QUEUED -> SENDING -> SENT -> CONFIRMED -> FILLED. Any state stuck >30s triggers full reconciliation.

### 3. Tick volume underestimation — CRITICAL
WIN%/WDO% produce 500-3,000+ ticks/sec during volatility. Per-tick Supabase writes saturate DB in minutes.
**Fix:** Ring buffer per symbol in FastAPI memory. Flush OHLCV aggregates on timer (every 1s). Ticks go to browser via WS only — never DB.

### 4. B3 circuit breakers / leilao — HIGH
No tick for >60s during trading hours = trading halt. New orders rejected during halt.
**Fix:** Halt mode on tick silence >60s. Suspend signal generation. On resumption: wait 30s, reconcile positions, skip first 5 minutes.

### 5. Mini-contract expiry calendar — HIGH
WIN%/WDO% expire 3rd Monday of even months; BIT% 3rd Friday monthly. Liquidity migrates before expiry.
**Fix:** B3 expiry calendar in DB at project start. Disable volume-dependent signals on expiry day. Force-close expiring positions by 16:50 BRT.

### 6. B3/CME timezone / DST offset — HIGH
Brazil no DST (always UTC-3). US observes DST. CME/B3 offset shifts twice per year.
**Fix:** IANA timezone names everywhere: America/Sao_Paulo for B3, America/Chicago for CME. Test on March and November US DST transition Sundays.

### 7. SaaS shared state — CRITICAL (Phase 1 design, Phase 3 failure)
Module-level dicts keyed by robot_id only causes user B to get user A's connection handle.
**Fix:** Namespace ALL in-memory structures by (user_id, robot_id) from Phase 1. ConnectionManager built for multi-user from day one.

### 8. Supabase free tier — HIGH
Free tier (500MB, 2GB/month) is breached in weeks at trading scale.
**Fix:** Store OHLCV bars + orders + fills only. Budget Supabase Pro ($25/mo) before adding any second user.

---

## Phase Recommendations

### Phase 1 — Trading Core (B3 only, MetaAPI)
**Rationale:** Deliver a working, safe robot execution platform for the owner's B3 account. All Phase 2 features depend on Phase 1 data model.

Key deliverables:
- Auth, robot CRUD, MetaAPI connection
- Live tick stream (WebSocket) for WIN%, WDO%, BIT%
- RobotEngine: start/stop/pause, all 7 strategy types
- Real-time monitoring: order list, equity curve, live P&L
- Risk controls: daily loss limit, max contracts
- B3 correctness: mini-contract math, trading hours, circuit breaker detection, expiry calendar, holiday calendar
- Multi-tenancy data model (even though solo user)

**Research flag:** Needs deeper phase planning — MetaAPI SDK integration patterns and B3 market structure specifics benefit from targeted research before sprint planning.

### Phase 2 — Backtesting + Portfolio + IBKR
**Rationale:** Backtesting is CPU-bound with strong isolation requirements; IBKR adds a second broker with distinct event loop constraints. Both require ProcessPoolExecutor and IBKRAdapter scaffolding.

Key deliverables:
- Backtest engine: event-driven loop (no look-ahead bias), ProcessPoolExecutor, slippage/commission as required parameters
- Single + mass backtest (parameter sweep)
- B3 rolagem calendar + holiday enforcement in backtest
- Portfolio aggregate view
- IBKR integration: IB Gateway Docker, ib_insync thread bridge, MBT (CME)

**Research flag:** IBKR pacing limits and IB Gateway Docker session management are well-documented — standard patterns apply.

### Phase 3 — Ecosystem + Marketplace
**Rationale:** Marketplace requires audited backtest infrastructure (Phase 2 dependency). SaaS onboarding requires MetaAPI provisioning async flow and credential encryption.

Key deliverables:
- SmartStore: strategy marketplace, purchase flow, audited backtest cards
- SmarttPlay: video/tutorial embedded player
- Manager: admin dashboard, user wallet, financials
- MetaAPI async provisioning flow (30-120s account setup)
- Credential encryption (Fernet, key in env)
- IRRF tax reporting (if trade_type column seeded in Phase 1)

**Research flag:** Marketplace trust mechanisms, credit system design, and MetaAPI multi-account provisioning limits need dedicated research at Phase 3 kickoff.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack is solid; verify metaapi-cloud-sdk, ib_insync, supabase-py versions on PyPI before pinning |
| Features | MEDIUM | MT5/Profit Pro comparison is accurate; Profit Pro circuit breaker feature set needs verification at nelogica.com.br |
| Architecture | HIGH | asyncio/FastAPI/Supabase/RLS patterns are well-established; MetaAPI SDK specifics need live testing |
| Pitfalls | HIGH (B3 structure), MEDIUM (MetaAPI limits) | MetaAPI reconnection timing and free-tier connection limits require empirical testing on owner's account |

---

## Open Questions — Resolve Before or During Phase 1

1. **MetaAPI SDK version:** Verify current PyPI version; breaking changes past v27?
2. **MetaAPI reconnection duration:** Actual reconnect time under BTG MT5 load requires live testing on owner's account before production reliance.
3. **MetaAPI halt detection:** Does MetaAPI expose B3 trading session state (halt/leilao) as explicit signal, or must circuit breaker detection rely solely on tick-silence heuristic (>60s)?
4. **BTG Pactual commission rates:** Exact mini-contract round-trip costs needed as required backtest parameters — confirm from broker fee schedule.
5. **Supabase Realtime RLS:** Additional dashboard steps required beyond 2024 documentation? Verify before Phase 1 launch.
6. **gnzsnz/ib-gateway Docker image:** Still maintained? Verify before Phase 2 begins.
7. **3 incomplete strategy editors:** Tangram, Fibonacci, RenkoBot editors incomplete in v3 prototype — PRD spec must be completed before Phase 1 implementation.
8. **MetaAPI free-tier account limit:** Required before Phase 3 SaaS onboarding planning.

---

## Future-Proofing — Build from Phase 1

- Add `trade_type VARCHAR ('day_trade' | 'swing_trade')` to `trades` table in Phase 1 schema — required for Phase 3 IRRF tax export. Populated at trade close time.
- Composite indexes on `(user_id, created_at DESC)` for orders and trades — required for RLS performance at scale.
- IB Gateway Docker Compose scaffold in Phase 1 repo (inactive) — enables Phase 2 without infrastructure rework.
- Scalability triggers: Redis pub/sub at >50 concurrent users; Celery when ProcessPoolExecutor capacity is exceeded. Both are additive — zero schema changes required.
