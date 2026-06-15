# STACK.md — Vetor Trading Platform

**Researched:** 2026-06-15
**Confidence:** MEDIUM-HIGH (verify marked items on PyPI/npm before pinning)

---

## Frontend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.x | SPA framework | Concurrent rendering, hooks-based; v18 is battle-tested production standard |
| TypeScript | 5.x | Type safety | Mandatory for trading domain — catches broker API shape mismatches at compile time |
| Vite | 5.x | Build tool | Fast HMR, native ES modules, Cloudflare Pages compatible |
| Zustand | 4.x | Global state | 2 KB, no boilerplate, composable slices; correct for robot-status atoms + tick streams |
| TanStack Query | 5.x | Server/REST state | Handles FastAPI REST calls with stale-while-revalidate; separates server state from UI state |
| ECharts | 5.x | Charting | Already in prototype; handles candlestick, equity curve, trade annotations; Apache-licensed |
| AG Grid Community | 31.x | Order/position tables | Best-in-class virtual scroll for large order lists; Community edition is free |
| Tailwind CSS | 3.x | Utility styling | Pairs with Blue Hour CSS custom properties; zero runtime overhead |

**Do NOT use:**
- Redux Toolkit — Zustand handles everything with 90% less code
- Lightweight Charts by TradingView — commercial license restrictions
- Socket.io client — native EventSource + WebSocket is sufficient
- React-virtualized — AG Grid covers this

---

## Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Python | 3.11+ | Runtime | asyncio.TaskGroup available; 3.12 faster; avoid 3.13 until libraries catch up |
| FastAPI | 0.111+ | API + SSE | Native async, StreamingResponse for SSE, background lifespan tasks |
| Uvicorn | 0.29+ | ASGI server | Single worker sufficient for solo phase |
| metaapi-cloud-sdk | [VERIFY PyPI] | B3 data + execution | Official async Python SDK; tick subscriptions, order execution, account provisioning |
| ib_insync | 0.9.86 [VERIFY] | CME execution (Phase 2) | Wraps IB TWS API in asyncio; connectAsync() works inside FastAPI lifespan |
| supabase-py | 2.x | DB + Auth admin | AsyncClient for non-blocking writes; service key bypasses RLS on backend |
| python-jose | 3.3.x | JWT verification | Verifies Supabase JWTs with audience="authenticated" |
| APScheduler | 3.10+ | Scheduled jobs | IB keepalive ping, robot health checks — avoids Celery for Phase 1 |
| pydantic | 2.x | Data validation | Required by FastAPI 0.100+; use for strategy parameter schemas |

**Do NOT use:**
- Celery+Redis — overkill for Phase 1
- SQLAlchemy — bypasses Supabase RLS; use supabase-py PostgREST
- asyncpg directly — same RLS bypass issue
- Starlette WebSocket for tick pushes — SSE is simpler for server→client

---

## Infrastructure

| Technology | Purpose | Why |
|------------|---------|-----|
| Cloudflare Pages | Frontend hosting | Free, git-based, auto-HTTPS, Vite SPA output deploys directly |
| Vultr VPS São Paulo | FastAPI + IB Gateway | São Paulo minimizes latency to B3/BTG; $12/mo sufficient for solo phase |
| `ghcr.io/gnzsnz/ib-gateway` | IB Gateway container | Handles 24h session restart via `AUTO_RESTART_TIME` env var automatically |
| systemd | FastAPI process manager | Simpler than Docker for a single-service Python app on a small VPS |
| Nginx | Reverse proxy | SSL termination (certbot), proxies to uvicorn, handles SSE buffering headers |

---

## Integration Patterns

### 1. MetaAPI Python SDK

```
MetaApi(token)
  → get_account(id)
  → deploy()
  → wait_connected()
  → get_streaming_connection()
  → connect()
  → wait_synchronized()   ← takes 30-90s; run in FastAPI lifespan, NEVER in request handler
```

- Tick feed: implement `SynchronizationListener.on_symbol_price_updated(instance_index, prices)`
- Execution: `connection.create_market_buy_order(symbol, volume, stop_loss, take_profit, options)`
- SaaS provisioning: `metatrader_account_api.create_account({"login", "password", "server": "BTGPactual-Server", "platform": "mt5"})`
- **Critical:** `wait_synchronized()` takes 30–90 seconds. Run in FastAPI `lifespan` startup, never in request handlers. Implement `on_disconnected` → reconnect with exponential backoff.

### 2. ib_insync + IB Gateway

- Use `ghcr.io/gnzsnz/ib-gateway` Docker image with `AUTO_RESTART_TIME: "11:59 PM"` to handle the 24h expiry automatically
- Add VNC port (5900) for emergency manual re-auth
- Inside FastAPI: `await ib.connectAsync("127.0.0.1", 4003, clientId=1)` in lifespan
- Use `ib.pendingTickersEvent` callback for ticks
- Call `ib_insync.util.patchAsyncio()` to prevent event loop conflicts
- **Never** call `ib.run()` inside FastAPI — FastAPI owns the event loop

### 3. FastAPI + Supabase

- JWT verification: `jose.jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")` — the `audience` claim is mandatory
- Tick delivery: use `StreamingResponse` with `media_type="text/event-stream"` and `X-Accel-Buffering: no` Nginx header (Nginx buffers SSE without this)
- Background market data loops: use `asyncio.create_task()` in lifespan, NOT `BackgroundTasks` (which exits after one request)
- Backend DB writes: use `SUPABASE_SERVICE_KEY` (service role) — bypasses RLS correctly for server-side writes

### 4. React State + UI

- Zustand store: two slices — `robotStore` (robot list, status) and `tickStore` (live price atoms per symbol)
- SSE client: native `EventSource` in a `useTickStream(symbol)` hook with reconnect-on-error
- Supabase Realtime: `supabase.channel().on("postgres_changes", {event: "UPDATE", table: "robots", filter: "user_id=eq.${userId}"})` — requires Realtime RLS enabled in dashboard
- AG Grid: Community edition, `domLayout="autoHeight"`, custom `cellStyle` for P&L coloring using CSS tokens

### 5. Supabase Realtime — Critical Distinction

- **postgres_changes** for robot status + P&L updates — enable table replication in dashboard; enable Realtime RLS with `user_id = auth.uid()` policy
- **DO NOT USE Supabase Broadcast for tick data** — routes through US East servers; São Paulo VPS → US → Brazil client adds 150–300ms latency
- Use FastAPI SSE (Server-Sent Events) for tick data — direct VPS→client, stays in Brazil

---

## Data Flow

```
MetaAPI cloud ──websocket──► FastAPI lifespan task
                                  │
                    ┌─────────────┼──────────────┐
                    ▼             ▼              ▼
              SSE stream    Supabase DB     Supabase DB
              (ticks→UI)   (orders write)  (robot status)
                    │                           │
                    ▼                           ▼
              React EventSource          Supabase Realtime
              (tick atoms in            (postgres_changes
               Zustand store)            → Zustand store)
```

---

## Versions to Verify Before Pinning

| Package | Where to Check |
|---------|---------------|
| metaapi-cloud-sdk | https://pypi.org/project/metaapi-cloud-sdk/ |
| ib_insync | https://pypi.org/project/ib-insync/ |
| supabase (Python) | https://pypi.org/project/supabase/ |
| ag-grid-community | https://www.npmjs.com/package/ag-grid-community |
| echarts | https://www.npmjs.com/package/echarts |
| gnzsnz/ib-gateway image | https://github.com/gnzsnz/ib-gateway-docker |

---

## Open Questions

- Is `gnzsnz/ib-gateway` still the maintained Docker image, or has a better-maintained fork emerged?
- Has MetaAPI released breaking changes in the SDK past v27?
- Does Supabase Realtime RLS require any additional dashboard step beyond what existed in 2024?
