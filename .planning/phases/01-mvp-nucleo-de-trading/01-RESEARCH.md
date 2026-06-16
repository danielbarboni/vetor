# Phase 1: MVP — Núcleo de Trading — Research

**Researched:** 2026-06-16
**Domain:** Full-stack trading platform — React/FastAPI/Supabase/MetaAPI/B3
**Confidence:** HIGH (architecture, UI fidelity, stack) | MEDIUM (MetaAPI SDK specifics)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Live tick data flows MetaAPI WebSocket → FastAPI → **FastAPI WebSocket directly to React frontend**. Frontend does NOT subscribe to MetaAPI directly.
- **D-02:** Robot state changes and persisted order events flow via **Supabase Realtime** (PostgreSQL → WebSocket). Two-channel model: FastAPI WS = ephemeral high-frequency; Supabase Realtime = persisted low-frequency.
- **D-03:** Equity chart on Sumário updates **on each order event** (not tick-by-tick). Equity reconstructed from order history + current open position mark.
- **D-04:** Frontend maintains **one shared FastAPI WebSocket per authenticated user**, multiplexed by `robot_id` in message envelope.
- **D-05:** Modo Simulado uses **live MetaAPI tick data** (paper trading, not historical replay).
- **D-06:** Modo Simulado uses a **shared system MetaAPI account** (Vetor platform account). Broker linkage required only for Modo Real.
- **D-07:** Fill policies (Pessimista/Moderado/Otimista) defined in PRD §18. Do not re-derive.
- **D-08:** Robot mode fixed at creation. To promote Simulado → Real, user duplicates the robot (ROB-05).
- **D-09:** All 7 strategy types visible in wizard catalog. Six non-IT strategies show "Em breve" badge with disabled "+" button.
- **D-10:** Only **IT [Tangram 3.0]** is fully selectable and produces a robot with an editable parameter screen.
- **D-11:** "Saiba Mais" modals: implement per PRD if content specified; minimal/omitted otherwise.
- **D-12:** Each robot operates on one asset: WIN%, WDO%, or BIT%.
- **D-13:** Wizard is a **fully ephemeral frontend session** — no server state until Step 4 submit.
- **D-14:** **Monorepo**: `/frontend` (React + Vite), `/backend` (FastAPI + Python), `/blue-hour-design-system` stays as-is.
- **D-15:** **Local dev without Docker.** Frontend: `npm run dev` (port 5173). Backend: `uvicorn main:app --reload` (port 8000). Supabase hosted.
- **D-16:** Deployment: GitHub Actions → SSH → Vultr VPS (backend); Cloudflare Pages git push (frontend).
- **D-17:** Robot execution as `asyncio.create_task()` per robot within FastAPI process. No Celery, no Redis, no subprocess for Phase 1.

### Code constraints (from CONTEXT.md code context)
- No code from `support.js` (prototype runtime only — do not port any logic, patterns, or data structures)
- `tokens.css` is generated — never edit manually
- `data-palette` / `data-theme` on `<html>` drive theming via CSS custom properties
- Supabase JS client initialized once — handles auth + Realtime + REST
- FastAPI CORS must allow Cloudflare Pages domain and `localhost:5173`

### Claude's Discretion
- "Saiba Mais" modal implementation for non-IT strategies (D-11)
- Internal directory structure within `/frontend` and `/backend`
- CORS configuration, environment variable naming, API versioning prefix

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within Phase 1 scope.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUT-01 | Email/password registration with email verification | Supabase Auth signUp + emailConfirm flow |
| AUT-02 | Email/password login; session persists across browser sessions | Supabase Auth signIn, session storage |
| AUT-03 | Password recovery via email link | Supabase Auth resetPasswordForEmail |
| AUT-04 | Log out from all devices simultaneously | Supabase Auth signOut(scope:'global') |
| AUT-05 | Account selection screen after login (multiple profiles) | Multi-profile UX pattern; single owner in Phase 1 but schema supports it |
| AUT-06 | OAuth Google / GitHub login | Supabase Auth signInWithOAuth |
| ROB-01 | Robot list in 3 tabs: EXECUTANDO / PARADOS / ARQUIVADOS | React tab state + Supabase query by status |
| ROB-02 | Robot card: #id, asset, badge, name, strategy, sparkline, position, net return, daily balance | ECharts SVG sparkline component |
| ROB-03 | Card: "MAIS INFO" accordion, ⋮ context menu, primary control button | React state accordion + dropdown |
| ROB-04 | MAIS INFO shows 4 expanded metrics | Derived from order history aggregate |
| ROB-05 | ⋮ context menu actions vary by state | State-machine driven action list |
| ROB-06 | Filters by strategy, positioned filter, grid/list toggle, search | Client-side filter + Supabase query params |
| ROB-07 | "CRIAR ROBÔ" launches wizard | React Router navigate |
| WIZ-01 | Step 1 strategy catalog with search, Saiba Mais, "+" | React ephemeral session state |
| WIZ-02 | All 7 strategies visible; 6 disabled with Em Breve badge | Static catalog data |
| WIZ-03 | Step 2 mode selection (Simulado / Real) | Mode stored in wizard state |
| WIZ-04 | Step 3 asset: BM&F chips WIN%/WDO%/BIT% | Asset selection state |
| WIZ-05 | Step 4 configure: robot name (unique), capital (Simulado only) | Client validation + uniqueness check via API |
| WIZ-06 | On complete: POST /robots → redirect to /robos/{id}/parametros | FastAPI POST + React Router redirect |
| EDT-01 | Full IT [Tangram 3.0] editor with 14 indicators (PRD §12) | JSON schema parameter form |
| EDT-02 | Parameters blocked while robot executing (banner + read-only) | Robot status check on load |
| EDT-03 | Save params with full validation; record "Último salvar" timestamp | JSON Schema + cross-field validation |
| EDT-04 | Backtest shortcut (⓫) in editor header launches backtest modal | Modal trigger + pre-fill robot name |
| EXE-01 | Start only with valid+saved params; transition to Executando | Status state machine |
| EXE-02 | Stop: cancel pending orders; ask whether to close open position | MetaAPI cancelOrders + get_positions |
| EXE-03 | Simulado fill policies: Pessimista (default)/Moderado/Otimista | FastAPI fill simulation engine |
| EXE-04 | Resolve WIN%/WDO%/BIT% → current expiry; record effective contract | B3 expiry calendar in DB |
| EXE-05 | Persist all orders with timestamp, price, qty, type, status, class | orders table schema |
| EXE-06 | Recovery after failure: rehydrate state without duplicating orders | Idempotency via clientOrderId |
| SUM-01 | Report header: name, strategy, asset, contract, badge, timestamp | Supabase robot + execution read |
| SUM-02 | Metric cards: net return, equity chart, live quote, patrimônio, position, drawdown, trades, profit %, factor, daily balance | Computed from orders + live WS tick |
| SUM-03 | "RELATÓRIO COMPLETO" accordion with 8 metric sections | Aggregation from orders table |
| SUM-04 | Order list + CSV export | Frontend Blob download |
| SUM-05 | Order event modal (ⓘ) with full event log | order_events table |
| BCK-01 | Backtest creation modal: pre-fill, capital, costs, type, date range | Modal form state |
| BCK-02 | Credits counter (read-only) | user_credits table |
| BCK-03 | Backtest list with status (Aguardando/Processando/Concluído/Erro) | backtests table + Realtime |
| BCK-04 | Completed backtest report: same metrics as Sumário + equity curve + orders | Shared ReportCard component |
| CTR-01 | Perfil: personal data, avatar upload, change password, MFA toggle | Supabase Auth + profiles table |
| CTR-02 | Corretoras: link/unlink BTG/MetaAPI; connection status | broker_connections table + MetaAPI provisioning |
| CTR-03 | Preferências: notifications, display prefs | user_preferences table |
| CTR-04 | Últimos Acessos: login history | auth_events / Supabase auth.sessions |

</phase_requirements>

---

## Summary

Phase 1 builds the entire production application from zero. There is no existing production code to build on — the prototype `Plataforma Vetor v3.dc.html` is the visual and functional specification only. The production app is a monorepo with `/frontend` (React 18 + Vite + TypeScript) and `/backend` (FastAPI + Python 3.12) communicating via REST and WebSocket, with Supabase handling auth, persistence, and realtime event delivery.

The critical architectural separation is the two-channel data model: MetaAPI tick data (high-frequency, ephemeral) flows FastAPI WS → browser and is never written to the database; robot state events and order fills (low-frequency, persisted) flow Postgres → Supabase Realtime → browser. This separation is locked (D-01/D-02) and must be respected at every layer.

The biggest technical risk is MetaAPI integration correctness — specifically reconnection gap handling, order state reconciliation, and B3 market structure correctness (circuit breakers, expiry calendar, trading hours). These are not edge cases; they involve real money and fail silently if not designed in from the start. The backtest engine in Phase 1 is individual-only and runs in `asyncio.create_task()` (no Celery) but must use the same `StrategyBase.on_tick()` event-driven pattern as live execution to avoid look-ahead bias.

**Primary recommendation:** Build in this order — Supabase schema+RLS → FastAPI auth middleware → BrokerPort+MetaAPIAdapter → tick routing → React auth → Robot CRUD → RobotEngine → Realtime → Report screens → Backtest → Account screens. Do not start on the report UI before the data pipeline is proven with real ticks.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Authentication / session | Supabase Auth (backend) | React (client storage) | Supabase handles JWT issuance; frontend stores session via JS SDK |
| Tick data delivery | FastAPI WebSocket | — | Ephemeral; must not touch DB; sent direct to browser |
| Robot state events / orders | Supabase Realtime | FastAPI (writer) | Persisted to Postgres; Realtime fans out to subscribed browser clients |
| Robot execution logic | FastAPI asyncio Task | — | One task per robot; D-17 locks this |
| Broker integration | FastAPI (MetaAPIAdapter) | — | Backend owns all broker I/O; frontend never talks to MetaAPI |
| UI rendering / interactions | React (client) | — | SPA; no SSR |
| Equity chart data | Frontend (computed) | FastAPI (order events via Realtime) | Chart reconstructed from order history + open position mark (D-03) |
| Backtest execution | FastAPI asyncio Task | ProcessPoolExecutor (CPU-bound) | Single backtest uses asyncio.create_task; ProcessPoolExecutor for CPU isolation |
| Auth guard routing | React Router | Supabase session check | Frontend enforces route guards; Supabase RLS enforces at data layer |
| File export (CSV/PDF) | Browser (client-side Blob) | — | No server-side file generation needed (from CONTEXT.md specifics) |
| Continuous contract resolution | FastAPI | DB (expiry calendar table) | Backend resolves WIN%→WDOF26 etc. from calendar; records effective contract per order |
| Theme / design system | Browser CSS (tokens.css) | palettes.js (initTheme) | CSS custom properties on `<html>` drive all theming |

---

## Standard Stack

### Frontend
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.2.7 | UI framework | [VERIFIED: npm registry] — locked decision |
| react-dom | 19.2.7 | DOM rendering | [VERIFIED: npm registry] |
| typescript | ~5.x | Type safety | Standard with Vite template |
| vite | 8.0.16 | Build / dev server | [VERIFIED: npm registry] — locked decision |
| @supabase/supabase-js | 2.108.2 | Auth + Realtime + REST | [VERIFIED: npm registry] — one client, initialized once |
| echarts | 6.1.0 | Charts — sparklines, equity curves, and candlestick+volume (Phase 2) | [VERIFIED: npm registry] — pinned to 6.1.0 (production preference, newer stable) — used for all charts including sparklines, equity curves, and candlestick (Phase 2) |
| zustand | 5.0.14 | Global state (robot list, WS connection, user session) | [VERIFIED: npm registry] — lightweight, no boilerplate |
| @tanstack/react-query | 5.101.0 | Server state / REST caching | [VERIFIED: npm registry] — pairs with Supabase REST queries |
| react-router-dom | ~6.x | Client-side routing | [ASSUMED] — standard React SPA routing |
| lucide-react | ~0.x | Icons (stroke-width 1.8 — matches prototype) | [ASSUMED] — specified in UI-SPEC |
| tailwindcss | ~3.x | Utility CSS alongside Blue Hour tokens | [ASSUMED] — tailwind.config.js already exists in design system |

> **ECharts version note:** The prototype pins CDN `echarts@6.1.0`. Current npm is `echarts@6.1.0`. Version 6 has breaking changes in some chart option APIs. Upgraded to 6.1.0 (user decision: newer stable over prototype pin) — used for all charts including sparklines (robot cards), equity curves (Sumário/backtest), and candlestick+volume (Phase 2 Gráfico screen).

### Backend
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastapi | 0.137.1 | API framework | [VERIFIED: PyPI] — locked decision |
| uvicorn[standard] | 0.49.0 | ASGI server | [VERIFIED: PyPI] |
| pydantic | 2.13.4 | Data validation, robot param schemas | [VERIFIED: PyPI] |
| supabase (python) | 2.31.0 | DB reads, auth admin | [VERIFIED: PyPI] |
| metaapi-cloud-sdk | 29.1.1 | MetaAPI broker integration | [VERIFIED: PyPI] — significant version jump from 27.x to 29.x; verify breaking changes |
| python-jose[cryptography] | ~3.3.x | JWT verification | [ASSUMED] — standard FastAPI auth pattern |
| python-multipart | ~0.0.x | File uploads (avatar) | [ASSUMED] — required by FastAPI for form data |
| httpx | ~0.x | Async HTTP client (MetaAPI REST calls) | [ASSUMED] |
| APScheduler | ~3.10.x | B3 expiry calendar refresh, daily cleanup | [ASSUMED] |
| zoneinfo (stdlib) | Python 3.9+ stdlib | Timezone handling (America/Sao_Paulo) | stdlib — no install needed |

> **metaapi-cloud-sdk version note:** PyPI shows jump from v21.x to v27.x to v28.x to v29.1.1. Large version gaps often indicate breaking API changes. The planner must include a task to verify v29 Python SDK API compatibility with the patterns in the Architecture section before coding against it. [ASSUMED] that the latest PyPI version (29.1.1) is the correct one to use.

### Installation commands
```bash
# Frontend (from /frontend)
npm create vite@latest . -- --template react-ts
npm install @supabase/supabase-js zustand @tanstack/react-query react-router-dom lucide-react echarts
npm install -D tailwindcss postcss autoprefixer

# Backend (from /backend)
pip install fastapi "uvicorn[standard]" pydantic supabase "python-jose[cryptography]" python-multipart httpx APScheduler metaapi-cloud-sdk
```

---

## Package Legitimacy Audit

> slopcheck was unavailable at research time. All packages tagged [ASSUMED] must be validated before install. Registry existence confirmed via `npm view` and `pip index versions`.

| Package | Registry | slopcheck | Disposition |
|---------|----------|-----------|-------------|
| react | npm | N/A | Approved — core framework, billions of downloads |
| vite | npm | N/A | Approved — official Vite project |
| @supabase/supabase-js | npm | N/A | Approved — official Supabase SDK |
| echarts | npm | N/A | Approved — Apache Foundation project |
| zustand | npm | N/A | Approved — well-established, pmndrs org |
| @tanstack/react-query | npm | N/A | Approved — TanStack org, millions of downloads |
| lucide-react | npm | N/A | Approved — Lucide org, widely used |
| fastapi | PyPI | N/A | Approved — official FastAPI project |
| uvicorn | PyPI | N/A | Approved — official Uvicorn project |
| pydantic | PyPI | N/A | Approved — official Pydantic project |
| supabase (python) | PyPI | N/A | Approved — official Supabase Python SDK |
| metaapi-cloud-sdk | PyPI | N/A | Approved — MetaAPI official SDK; verify v29 API |
| python-jose | PyPI | N/A | [ASSUMED] — widely used JWT library |
| APScheduler | PyPI | N/A | [ASSUMED] — well-known scheduler |

*slopcheck was unavailable — planner must add `checkpoint:human-verify` before the first install task for `python-jose` and `APScheduler`.*

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged [SUS]:** none identified, but python-jose and APScheduler are [ASSUMED] and require checkpoint

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (React SPA)
    │
    ├── HTTPS REST ─────────────────────────────► FastAPI (:8000)
    │                                                │
    ├── WebSocket ws://api/ws/{user_id} ──────────► FastAPI WS
    │      (tick data, multiplexed by robot_id)      │  (TickRouter → asyncio tasks)
    │                                                │
    ├── Supabase Realtime (wss) ◄──────────────── Supabase Postgres
    │      (robot status, orders, backtest status)    ▲
    │                                                │
    └── Supabase REST / Auth ◄──────────────────► Supabase
                                                     ▲
                                              FastAPI writes orders,
                                              robot status, equity
                                              snapshots here

FastAPI asyncio tasks:
    ├── RobotEngine task per robot (live / simulado)
    │       └── MetaAPIAdapter → MetaAPI WS (tick stream)
    │           on_tick() → StrategyBase.evaluate()
    │               → if signal: place_order() → MetaAPI
    │               → on_fill: write to orders table → triggers Realtime
    │
    └── BacktestTask (asyncio.create_task / ProcessPoolExecutor for CPU)
            → StrategyBase.on_tick() event-driven (no vectorized pandas)
            → write result to backtests table → Realtime notifies browser
```

### Recommended Project Structure
```
/
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # Vite entry; import tokens.css; initTheme()
│   │   ├── index.css             # imports tokens.css from blue-hour-design-system
│   │   ├── App.tsx               # Router root; Supabase session guard
│   │   ├── lib/
│   │   │   ├── supabase.ts       # single supabaseClient instance
│   │   │   └── ws.ts             # singleton FastAPI WS connection
│   │   ├── stores/
│   │   │   ├── auth.ts           # Zustand auth store
│   │   │   ├── robots.ts         # Zustand robot list store
│   │   │   └── ticks.ts          # Zustand live tick store (per robot_id)
│   │   ├── hooks/
│   │   │   ├── useRobotRealtime.ts   # Supabase Realtime subscription
│   │   │   └── useTickStream.ts      # FastAPI WS message handler
│   │   ├── pages/
│   │   │   ├── auth/             # Login, Register, ForgotPassword
│   │   │   ├── robots/           # RobotList, RobotWizard, RobotEditor
│   │   │   ├── sumario/          # RobotSumario (report)
│   │   │   ├── backtests/        # BacktestList, BacktestReport
│   │   │   └── conta/            # MinhaConta (tabs)
│   │   ├── components/
│   │   │   ├── shell/            # Sidebar, TopHeader, AppShell
│   │   │   ├── robot-card/       # RobotCard, MaisInfo, ContextMenu
│   │   │   ├── editor/           # ParameterSection, IndicadorRow, EditorTabs
│   │   │   ├── charts/           # SparklineChart, EquityChart (ECharts wrappers)
│   │   │   └── ui/               # Button, Badge, Toggle, SegmentControl, Modal, Input
│   │   └── types/
│   │       └── index.ts          # shared TypeScript types
│   ├── vite.config.ts
│   └── tailwind.config.js        # copied from blue-hour-design-system/
│
├── backend/
│   ├── main.py                   # FastAPI app, CORS, router includes
│   ├── routers/
│   │   ├── auth.py               # /auth/* (Supabase JWT validation)
│   │   ├── robots.py             # /robots CRUD
│   │   ├── execution.py          # /robots/{id}/start|stop
│   │   ├── sumario.py            # /robots/{id}/sumario
│   │   ├── backtests.py          # /backtests CRUD + run
│   │   └── conta.py              # /account/*
│   ├── engine/
│   │   ├── robot_engine.py       # RobotEngine: start/stop lifecycle
│   │   ├── strategy_base.py      # StrategyBase ABC: on_tick(), evaluate()
│   │   ├── strategies/
│   │   │   └── indicadores_tecnicos.py  # IT [Tangram 3.0] implementation
│   │   ├── fill_simulator.py     # Pessimista/Moderado/Otimista fill policies
│   │   └── backtest_runner.py    # BacktestRunner using StrategyBase
│   ├── broker/
│   │   ├── broker_port.py        # BrokerPort ABC
│   │   └── metaapi_adapter.py    # MetaAPIAdapter
│   ├── realtime/
│   │   ├── tick_router.py        # TickRouter: pub/sub asyncio
│   │   └── ws_manager.py         # ConnectionManager: one WS per user
│   ├── db/
│   │   ├── supabase_client.py    # single supabase client
│   │   ├── models.py             # Pydantic models
│   │   └── writer.py             # SupabaseWriter: orders, equity snapshots
│   ├── calendar/
│   │   └── b3_calendar.py        # B3 expiry calendar, trading hours, holidays
│   └── config.py                 # env vars, settings
│
└── blue-hour-design-system/      # unchanged — carry forward as-is
    ├── tokens/tokens.css
    ├── palettes.js
    └── tailwind.config.js
```

### Pattern 1: Supabase Auth + FastAPI JWT Guard

Every FastAPI route requiring authentication validates the Supabase JWT from the `Authorization: Bearer <token>` header. The frontend passes the session token from `supabase.auth.getSession()`.

```python
# Source: FastAPI + Supabase auth pattern [ASSUMED — standard practice]
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import jwt, JWTError

security = HTTPBearer()

async def get_current_user(token = Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload["sub"]  # user_id (UUID)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

### Pattern 2: FastAPI WebSocket — One Connection Per User, Multiplexed

```python
# Source: FastAPI WebSocket docs [ASSUMED — standard pattern]
class ConnectionManager:
    def __init__(self):
        # Namespace by user_id — never robot_id alone (PITFALL-13)
        self.connections: dict[str, WebSocket] = {}  # user_id → ws

    async def send_tick(self, user_id: str, robot_id: str, data: dict):
        ws = self.connections.get(user_id)
        if ws:
            await ws.send_json({"robot_id": robot_id, **data})

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # heartbeat only
    except WebSocketDisconnect:
        manager.disconnect(user_id)
```

### Pattern 3: Supabase Realtime Subscription (Frontend)

```typescript
// Source: @supabase/supabase-js v2 docs [ASSUMED — standard pattern]
// One subscription per robot report screen
const channel = supabase
  .channel(`robot:${robotId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
    filter: `robot_id=eq.${robotId}`
  }, (payload) => {
    // Update order list + trigger equity recalculation
    queryClient.invalidateQueries(['orders', robotId]);
  })
  .subscribe();
// Cleanup on unmount: supabase.removeChannel(channel)
```

### Pattern 4: RobotEngine State Machine

```python
# Robot status state machine — persisted to Supabase
# Source: Architecture decision from CONTEXT.md + SUMMARY.md [ASSUMED implementation]

class RobotStatus(str, Enum):
    RASCUNHO = "rascunho"       # created, params not saved
    PARADO = "parado"           # params saved, not running
    EXECUTANDO = "executando"   # running
    ARQUIVADO = "arquivado"     # archived

class RobotEngine:
    async def start(self, robot_id: str, user_id: str):
        # 1. Validate params saved + valid
        # 2. Resolve contract (WIN% → WINF26)
        # 3. Create asyncio.create_task(self._run_loop(robot_id, user_id))
        # 4. Update DB status → executando (triggers Realtime)

    async def _run_loop(self, robot_id: str, user_id: str):
        # Subscribe to MetaAPI tick stream
        # On each tick: strategy.on_tick(tick) → signal? → place_order()
        # On reconnect: reset ALL strategy state (PITFALL-02)
        # On tick silence >10s: set staleness_sentinel
```

### Pattern 5: ECharts Sparkline React Component

```typescript
// Source: ECharts npm package [ASSUMED — standard React wrapper pattern]
import * as echarts from 'echarts';
import { useEffect, useRef } from 'react';

export function SparklineChart({ data, positive }: { data: number[]; positive: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, null, { renderer: 'svg' });
    chart.setOption({
      grid: { top: 0, right: 0, bottom: 20, left: 0 },
      xAxis: { type: 'category', show: false },
      yAxis: { type: 'value', show: false },
      series: [{
        type: 'line',
        data,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: positive ? 'var(--chart-2)' : 'var(--color-loss)', width: 1.8 },
        areaStyle: { color: positive ? 'var(--tint-primary)' : 'var(--tint-loss)', opacity: 0.10 }
      }]
    });
    return () => chart.dispose();
  }, [data, positive]);

  return <div ref={ref} style={{ width: 220, height: 56 }} />;
}
```

### Anti-Patterns to Avoid

- **Porting `support.js` patterns:** The prototype's class-toggle state machine, `innerHTML` mutations, and `new Function()` eval are prototype-only. All state goes in React state/context/Zustand.
- **Writing raw ticks to Supabase:** Ring buffer in FastAPI memory + OHLCV flush every 1s (PITFALL-01).
- **Module-level dicts keyed by `robot_id` only:** Always `(user_id, robot_id)` namespace (PITFALL-13).
- **Vectorized pandas in backtest:** Event-driven loop only — `df.iloc[:i+1]` per bar (PITFALL-09).
- **Hardcoding UTC offsets for B3:** Always `America/Sao_Paulo` via `zoneinfo` (PITFALL-16).
- **Inline hex colors in React components:** Use only CSS custom property aliases from UI-SPEC (e.g., `var(--color-profit)`, `var(--border)`).
- **Editing `tokens.css` manually:** Generated by `build-tokens.py` — changes go through `palettes.js`.
- **`data-theme` / `data-palette` on any element except `document.documentElement`:** Theme contract requires attributes on `<html>`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Authentication + JWT | Custom session store | Supabase Auth (signUp, signIn, signOut, OAuth) | Email verification, OAuth, session refresh all handled |
| Realtime WebSocket fan-out (low-frequency) | Custom pub/sub | Supabase Realtime `postgres_changes` | Auth-scoped, RLS-filtered — no custom push server needed |
| Chart rendering | Custom SVG charts | ECharts (npm) | Tooltip, dataZoom, animation, SVG/canvas renderer built in |
| Form validation | Custom validators | Pydantic v2 (backend) + HTML5 + custom (frontend) | Pydantic cross-field validators cover Tangram 3.0 rules |
| Icon set | Custom SVG icons | Lucide React (stroke-width: 1.8) | UI-SPEC mandates Lucide; prototype uses equivalent SVG stroke widths |
| CSS token generation | Editing tokens.css | `python3 blue-hour-design-system/build-tokens.py` | 51 palettes × 2 modes — manual editing is error-prone and overwritten |
| Theme switching | Custom CSS injection | `palettes.js` `initTheme()` / `setTheme()` | Already built, tested, persists to localStorage |
| Contract resolution WIN%→WINF26 | Hardcoded map | B3 expiry calendar table in Supabase + resolution function | Expiry rules are algorithmic (3rd Monday even months); calendar must be updated annually |
| B3 holiday detection | Hardcoded list | B3 holiday calendar in DB, updated from B3 January publication | Calendar has non-obvious entries (Carnival, São Paulo municipal, election days) |
| Order idempotency | Timestamp comparison | Deterministic `clientOrderId = hash(user_id, robot_id, signal_ts)` | Network drop + resend must not create duplicate position |

**Key insight:** In broker integration, every "simple" shortcut (write ticks to DB, resend orders on reconnect, compute indicators on full DataFrame) produces silent, money-losing bugs. Use the established patterns.

---

## Data Model

### Supabase Tables (Phase 1)

**`profiles`** — extends auth.users
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
full_name TEXT
phone TEXT
cpf_cnpj TEXT
avatar_url TEXT
created_at TIMESTAMPTZ DEFAULT now()
```

**`robots`**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id)
name TEXT NOT NULL
strategy_type TEXT NOT NULL DEFAULT 'indicadores_tecnicos'
mode TEXT NOT NULL CHECK (mode IN ('simulado', 'real'))
status TEXT NOT NULL DEFAULT 'rascunho'
  CHECK (status IN ('rascunho', 'parado', 'executando', 'arquivado'))
asset TEXT NOT NULL CHECK (asset IN ('WIN%', 'WDO%', 'BIT%'))
simulation_capital NUMERIC(12,2)  -- null for real mode
fill_policy TEXT DEFAULT 'pessimista'
  CHECK (fill_policy IN ('pessimista', 'moderado', 'otimista'))
params JSONB  -- full IT [Tangram 3.0] parameter schema
params_saved_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
UNIQUE(user_id, name)
```

**`b3_contracts`** — expiry calendar
```sql
id SERIAL PRIMARY KEY
asset TEXT NOT NULL  -- 'WIN%', 'WDO%', 'BIT%'
symbol TEXT NOT NULL  -- e.g., 'WINF26'
expiry_date DATE NOT NULL
is_front_month BOOLEAN DEFAULT false
rollover_date DATE  -- date when liquidity typically migrates
created_at TIMESTAMPTZ DEFAULT now()
```

**`orders`**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id)
robot_id UUID NOT NULL REFERENCES robots(id)
client_order_id TEXT UNIQUE  -- deterministic: hash(user_id, robot_id, signal_ts)
broker_order_id TEXT  -- MetaAPI order ID
effective_contract TEXT NOT NULL  -- e.g., 'WINF26'
side TEXT NOT NULL CHECK (side IN ('buy', 'sell'))
qty INTEGER NOT NULL
type TEXT NOT NULL CHECK (type IN ('market', 'limit', 'stop'))
status TEXT NOT NULL
  CHECK (status IN ('queued', 'sending', 'sent', 'confirmed', 'filled',
                    'cancelled', 'rejected', 'expired'))
order_class TEXT CHECK (order_class IN ('entry', 'exit'))
entry_price NUMERIC(12,5)
fill_price NUMERIC(12,5)
fill_qty INTEGER
result_pts NUMERIC(10,2)  -- P&L in points
result_brl NUMERIC(12,2)  -- P&L in BRL
trade_type TEXT CHECK (trade_type IN ('day_trade', 'swing_trade'))
  -- populate from Phase 1 for future IRRF export
ordered_at TIMESTAMPTZ NOT NULL
filled_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT now()
```
Index: `CREATE INDEX ON orders (user_id, created_at DESC)` — composite for RLS performance (PITFALL-12)
Index: `CREATE INDEX ON orders (robot_id, created_at DESC)`

**`order_events`** — for SUM-05 event modal
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
order_id UUID NOT NULL REFERENCES orders(id)
event_type TEXT NOT NULL  -- 'submitted', 'acknowledged', 'filled', 'cancelled', etc.
event_data JSONB  -- raw MetaAPI event payload
occurred_at TIMESTAMPTZ NOT NULL
```

**`equity_snapshots`** — for equity chart (appended per fill)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id)
robot_id UUID NOT NULL REFERENCES robots(id)
equity NUMERIC(14,2) NOT NULL
snapshot_at TIMESTAMPTZ NOT NULL
```
Index: `CREATE INDEX ON equity_snapshots (robot_id, snapshot_at DESC)`

**`backtests`**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id)
robot_id UUID NOT NULL REFERENCES robots(id)
status TEXT NOT NULL DEFAULT 'queued'
  CHECK (status IN ('queued', 'processing', 'completed', 'error'))
fill_policy TEXT NOT NULL CHECK (fill_policy IN ('pessimista', 'moderado', 'otimista'))
capital NUMERIC(12,2) NOT NULL
start_date DATE NOT NULL
end_date DATE NOT NULL
result_metrics JSONB  -- computed metrics (net return, drawdown, etc.)
error_message TEXT
created_at TIMESTAMPTZ DEFAULT now()
completed_at TIMESTAMPTZ
```

**`backtest_orders`** — separate from live orders, same schema
```sql
-- Same columns as orders but references backtests(id) instead of robots(id)
-- Never mixed with live orders
```

**`broker_connections`**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID NOT NULL REFERENCES auth.users(id)
broker TEXT NOT NULL DEFAULT 'btg_metaapi'
metaapi_account_id TEXT  -- MetaAPI account ID (not raw MT5 creds)
status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'provisioning', 'active', 'error', 'unlinked'))
connected_at TIMESTAMPTZ
created_at TIMESTAMPTZ DEFAULT now()
```

**`user_preferences`**
```sql
user_id UUID PRIMARY KEY REFERENCES auth.users(id)
default_fill_policy TEXT DEFAULT 'pessimista'
decimal_separator_view TEXT DEFAULT 'comma'
decimal_separator_export TEXT DEFAULT 'comma'
currency TEXT DEFAULT 'BRL'
notifications_email BOOLEAN DEFAULT true
created_at TIMESTAMPTZ DEFAULT now()
updated_at TIMESTAMPTZ DEFAULT now()
```

**`user_credits`**
```sql
user_id UUID PRIMARY KEY REFERENCES auth.users(id)
balance INTEGER NOT NULL DEFAULT 0
updated_at TIMESTAMPTZ DEFAULT now()
```

### RLS Policies (ALL tables)
```sql
-- Pattern on every table with user_id column
ALTER TABLE robots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_robots" ON robots
  USING (user_id = auth.uid());
-- Repeat for orders, equity_snapshots, backtests, broker_connections, user_preferences
```

---

## API Surface

### FastAPI Endpoint Map

```
POST   /auth/refresh              # Exchange Supabase session (if needed)
GET    /robots                    # List user's robots (status filter)
POST   /robots                    # Create robot (wizard completion WIZ-06)
GET    /robots/{id}               # Get robot detail
PATCH  /robots/{id}               # Update name, params
DELETE /robots/{id}               # Delete robot (with confirmation)
POST   /robots/{id}/start         # Start execution (EXE-01)
POST   /robots/{id}/stop          # Stop execution (EXE-02)
POST   /robots/{id}/archive       # Archive (ROB-05)
POST   /robots/{id}/unarchive     # Restore from archive
POST   /robots/{id}/duplicate     # Duplicate robot (D-08 mode promotion path)
GET    /robots/{id}/sumario       # Computed metrics for Sumário screen (SUM-01..05)
GET    /robots/{id}/orders        # Order list (paginated, filterable)
GET    /robots/{id}/orders/{oid}/events  # Order event log (SUM-05)
GET    /robots/{id}/equity        # Equity snapshots for chart (SUM-02)

POST   /backtests                 # Create + queue backtest (BCK-01)
GET    /backtests                 # List backtests (BCK-03)
GET    /backtests/{id}            # Backtest detail + results (BCK-04)
GET    /backtests/{id}/orders     # Backtest order list (BCK-04)

GET    /account/profile           # Get profile (CTR-01)
PATCH  /account/profile           # Update profile
GET    /account/preferences       # Get prefs (CTR-03)
PATCH  /account/preferences       # Update prefs
GET    /account/sessions          # Login history (CTR-04) — from Supabase auth
POST   /account/sessions/revoke-all  # Log out all devices (AUT-04)
GET    /account/brokers           # Broker connections (CTR-02)
POST   /account/brokers           # Link broker (start provisioning)
DELETE /account/brokers/{id}      # Unlink broker
GET    /account/credits           # Credit balance (BCK-02)

WS     /ws/{user_id}              # WebSocket tick stream (D-01, D-04)
```

---

## Integration Touchpoints

### 1. Supabase Auth Flow

```
Register: supabase.auth.signUp({ email, password })
          → Supabase sends verification email
          → On verify: user redirected to app, session auto-created

Login: supabase.auth.signInWithPassword({ email, password })
       → returns session.access_token (JWT)
       → frontend: store in Zustand auth store
       → all API calls: Authorization: Bearer {access_token}

OAuth: supabase.auth.signInWithOAuth({ provider: 'google' | 'github' })
       → redirect → callback → session

Refresh: supabase.auth.onAuthStateChange() listener handles token refresh

FastAPI validates: jwt.decode(token, SUPABASE_JWT_SECRET, audience="authenticated")
```

### 2. MetaAPI Tick Stream → Browser

```
FastAPI startup:
  1. Connect to MetaAPI with SYSTEM_ACCOUNT credentials (for Simulado — D-06)
  2. Subscribe to WIN%, WDO%, BIT% tick streams
  3. TickRouter.register(robot_id, user_id, symbol)

On tick received:
  4. TickRouter.dispatch(symbol, tick) → strategy.on_tick(tick)
  5. ConnectionManager.send_tick(user_id, robot_id, tick_data)
  6. Browser receives: { robot_id, price, change, timestamp }
  7. Zustand ticks store updated → live quote widget + Sumário quote card update

Ring buffer (PITFALL-01):
  - deque(maxlen=3600) per symbol in FastAPI memory
  - OHLCV aggregator flushes every 1s (write to Supabase only OHLCV bars)
  - Raw ticks NEVER written to Supabase
```

### 3. Supabase Realtime → Browser

```
Browser subscribes on robot detail / listing screens:
  supabase.channel('robot-status')
    .on('postgres_changes', { table: 'robots', filter: `user_id=eq.${userId}` }, handler)
  supabase.channel(`orders-${robotId}`)
    .on('postgres_changes', { table: 'orders', filter: `robot_id=eq.${robotId}` }, handler)

On fill event → FastAPI writes to orders table → Postgres NOTIFY → Realtime → browser
Browser: invalidate TanStack Query cache → re-fetch metrics → equity chart appends point
```

### 4. B3 Contract Resolution (EXE-04)

```python
# In FastAPI, on robot start and on contract rollover:
async def resolve_contract(asset: str) -> str:
    # Query b3_contracts where asset=asset AND is_front_month=true
    # Return effective symbol (e.g., 'WINF26')
    # Store on robot.effective_contract + per order

# Rollover detection:
# APScheduler job daily at 07:00 BRT:
#   update b3_contracts set is_front_month based on today vs expiry_date
#   if running robot's effective_contract changed: trigger rollover
#   force-close expiring contracts by 16:50 BRT on expiry day (PITFALL-08)
```

---

## Implementation Order and Build Waves

### Wave 0 — Foundation (blocks everything)
1. Monorepo scaffold: `/frontend` (Vite+React+TS), `/backend` (FastAPI)
2. Supabase project: schema + RLS policies for all 8 tables
3. B3 expiry calendar seeded for 2026-2027
4. FastAPI skeleton: CORS, JWT middleware, health check
5. Design system integration: `tokens.css` imported in `frontend/src/index.css`, `initTheme()` called in `main.tsx`
6. App shell: sidebar, top header, routing stubs (`/auth`, `/robos`, `/robos/:id`, `/backtests`, `/conta`)

### Wave 1 — Auth (AUT-01..06)
7. Supabase Auth: register, login, forgot password, OAuth (Google/GitHub)
8. Session persistence, route guards
9. Account selection screen (AUT-05) — minimal for single user
10. Supabase `profiles` table setup on signup

### Wave 2 — Robot CRUD + Wizard (ROB-01..07, WIZ-01..06)
11. Robot list screen: tabs, cards (static data), filters, search (ROB-01..06)
12. Robot card component: full UI-SPEC fidelity (sparkline, badges, MAIS INFO, ⋮ menu, control button)
13. Wizard: 4-step ephemeral form (WIZ-01..06)
14. POST /robots on wizard completion → redirect to /robos/{id}/parametros (WIZ-06)

### Wave 3 — Editor + Execution (EDT-01..04, EXE-01..06)
15. Editor shell: tabs (SUMÁRIO/GRÁFICO/PARÂMETROS), fixed action rail, execution lock banner
16. IT [Tangram 3.0] parameter form: all 14 indicators, section accordion, cross-field validation
17. Save params → PATCH /robots/{id} (EDT-03)
18. BrokerPort ABC + MetaAPIAdapter: connect, tick stream, place_order
19. TickRouter + ConnectionManager + FastAPI WebSocket endpoint
20. RobotEngine: start/stop state machine (EXE-01..02)
21. Fill simulator (Pessimista/Moderado/Otimista) for Simulado mode (EXE-03)
22. B3 contract resolution + rollover logic (EXE-04)
23. Order persistence + idempotency (EXE-05..06)

### Wave 4 — Report (SUM-01..05) and Realtime
24. Supabase Realtime subscriptions: robot status + orders
25. Sumário screen: metric cards (static → live), equity chart (ECharts)
26. Live quote widget: FastAPI WS tick → Zustand → UI
27. Relatório Completo accordion (8 sections computed from orders)
28. Order list: paginated, filterable, CSV export (SUM-04)
29. Order event modal (SUM-05)

### Wave 5 — Backtest (BCK-01..04)
30. Backtest creation modal + POST /backtests
31. BacktestRunner using StrategyBase (shares code with live engine)
32. Backtest list + status polling via Realtime (BCK-03)
33. Backtest report: same ReportCard component as Sumário (BCK-04)

### Wave 6 — Account (CTR-01..04)
34. Minha Conta shell: tab bar (Perfil/Corretoras/Preferências/Últimos Acessos)
35. Perfil tab: personal data form, avatar upload, change password, MFA toggle (CTR-01)
36. Corretoras tab: BTG/MetaAPI link flow, provisioning state, ATIVA badge (CTR-02)
37. Preferências tab: notification toggles, decimal/currency format (CTR-03)
38. Últimos Acessos tab: login history from Supabase auth events (CTR-04)

**Do not reorder waves.** Each wave has hard dependencies on the previous.

---

## UI Fidelity Requirements

The prototype `Plataforma Vetor v3.dc.html` is the pixel-accurate spec. The following are the highest-risk fidelity points that commonly get lost in React ports:

### Shell + Global
- Background radial gradient: two-layer glow, `position:absolute; inset:0; pointer-events:none` — applied before all content layers
- Root `font-size:14px` on the outermost `div` shell (not on body)
- `data-palette="blue-hour" data-theme="dark"` on `document.documentElement` — set by `initTheme()` on mount; never on any child element
- Scrollbar: custom webkit scrollbar as per UI-SPEC — must be in global CSS

### Robot Card
- `border-radius:16px` — card body
- Border changes on state: EXECUTANDO → `1px solid var(--color-profit)`; others → `1px solid var(--border)`
- EXECUTANDO pulse dot: `pulseDot 2s infinite` animation with `var(--tint-profit)` — NOT a raw hex color (prototype had this bug; production must fix it)
- Sparkline SVG: `viewBox="0 0 220 56"`, `height:56px`, `strokeWidth:1.8`, area fill at `opacity:0.10`
- Net return: `font-family:'JetBrains Mono'; font-size:16px; font-weight:600; white-space:nowrap`
- MAIS INFO: flex-wrap grid of mini-cards with `flex:1 1 96px; min-width:96px` — chips fill the line, no orphan gaps
- Control button states: exact background/color tokens per UI-SPEC (loss/profit/surface3)

### Wizard
- Container: `max-width:960px; margin:0 auto`
- Step indicator: `width:28px; height:28px` circles with distinct done/active/inactive states using primary color
- Strategy card selected: `border-color:--color-primary; background:--tint-primary`
- Em Breve badge + disabled: `opacity:0.45; pointer-events:none` on the card (not just the button)
- Asset chips in Step 3: selected state uses `box-shadow:0 0 0 3px var(--tint-primary)`

### Editor
- Fixed action rail: `position:fixed; right:20px; top:50%; transform:translateY(-50%)` — 44×44px buttons in a `border-radius:18px` card
- Parameter section accordion: `border-radius:14px; overflow:hidden` — the overflow:hidden is critical for the accordion animation
- Section number badge: `width:26px; height:26px; border-radius:8px` (not `99px`)
- Execution lock banner: amber tint with `border:1px solid var(--color-amber)`

### Sumário
- Right padding: `padding: 20px 92px 80px 28px` — 92px right accounts for the fixed action rail
- Metric card grid: 12-column CSS grid; primary cards span 3; equity chart spans 8
- Equity SVG: `viewBox="0 0 860 230"` with grid lines (dashed) and capital baseline (dashed, `--border2`)
- Order list grid columns: `34px 100px 122px 84px 44px 44px 84px 100px 90px 102px 96px 1fr` — exact, not approximate
- Relatório Completo inner grid: `grid-template-columns:repeat(4,1fr)` with cell `border-right`

### Modals
- Backdrop: `rgba(0,0,0,0.6)` — not any darker or lighter
- Container: `border-radius:16px–20px`; standard width 480px; large (order event) 640px
- Open animation: `scale(0.96→1.0) + opacity(0→1)` at 250ms with `--ease-out`

### Typography
- UI-SPEC defines 7+ distinct font sizes across 3 families and 5 weights — this is intentional and must not be reduced
- All numeric values: `font-family:'JetBrains Mono', monospace`
- ALL CAPS elements: use CSS `text-transform:uppercase` + `letter-spacing` per UI-SPEC table — do NOT hardcode uppercase in JSX strings
- `font-size:14px` base on shell `div`, not on `body`

---

## Technical Risks and Unknowns

### RISK-01: MetaAPI SDK v29 API compatibility [HIGH]
**What:** PyPI shows metaapi-cloud-sdk jumped from v21.x to v27.x to v29.x — large version gaps suggest breaking changes.
**Impact:** Adapter code written against training-data examples may not compile against v29.
**Mitigation:** Wave 3 must begin with a proof-of-concept task: install v29, connect to system account, receive ticks, place a simulated order. Fail fast before building the full engine layer.

### RISK-02: MetaAPI reconnection gap [CRITICAL]
**What:** SDK reconnects automatically but does NOT replay missed ticks. Strategy state (VWAP, EMA, position flags) is corrupted after any reconnection.
**Impact:** Strategy generates incorrect signals after any network drop; with real money live.
**Mitigation (must implement before first live order):**
- On reconnect: call `get_positions()`, `get_orders()`, reset ALL strategy in-memory state
- Staleness sentinel: no tick >10s on active symbol → halt order placement
- Deterministic `clientOrderId` for every order

### RISK-03: B3 tick volume [CRITICAL]
**What:** WIN%/WDO% generate 500–3,000+ ticks/sec during macro events.
**Impact:** FastAPI async queue saturates; Supabase writes fail; event loop blocked.
**Mitigation:** Ring buffer (`collections.deque`) per symbol in FastAPI memory; OHLCV flush every 1s; raw ticks never written to Supabase.

### RISK-04: Tangram 3.0 editor — 14 indicator cross-field rules [MEDIUM]
**What:** The full IT [Tangram 3.0] editor (EDT-01) has 14 indicators with cross-field validation rules not fully documented in the prototype. PRD §12 is the authoritative source.
**Impact:** Parameter save (EDT-03) with invalid cross-field state could trigger incorrect strategy behavior in live execution.
**Mitigation:** Implementer MUST read PRD §12 in full before coding the parameter form. Build a Pydantic model with cross-field validators using `@model_validator`. Wave 3 backtest task verifies all cross-field rules.
**Unknown:** Are cross-field rules fully specified in PRD §12 or are some implicit in the prototype UI? Flag for human review during Wave 3.

### RISK-05: Supabase Realtime RLS interaction [MEDIUM]
**What:** Supabase Realtime with RLS requires explicit `realtime.messages` policy or the `broadcast` approach; `postgres_changes` subscription respects RLS but requires the table to be in the replication set.
**Impact:** Orders/robot status updates not delivered to correct browser client.
**Mitigation:** Verify Supabase Realtime + RLS setup in Wave 0 with a smoke test before building report screens.

### RISK-06: ECharts version 5.x vs 6.x [LOW-MEDIUM]
**What:** Prototype pins `echarts@6.1.0` via CDN. Current npm is `echarts@6.1.0`. Some option APIs changed between major versions.
**Impact:** Sparkline or equity chart options fail to render correctly.
**Mitigation:** Pin to `echarts@6.1.0` for prototype fidelity unless there is a specific reason to upgrade. See Assumptions Log A1.

### RISK-07: B3 expiry calendar accuracy [HIGH]
**What:** B3 expiry calendar (3rd Monday even months for WIN%/WDO%; 3rd Friday monthly for BIT%) must be seeded correctly for 2026–2027. Rollover days (when liquidity migrates) are earlier than expiry.
**Impact:** Wrong expiry causes force-close to fire on wrong day; volume-based signals not suppressed at correct time.
**Mitigation:** Seed calendar in Wave 0 from B3's published contract schedule. Include rollover_date column (approximately T-5 business days before expiry).

---

## Common Pitfalls

### Pitfall 1: Tick data written to Supabase
**What goes wrong:** FastAPI writes every received tick to the `orders` or a `ticks` table. Supabase write latency spikes; event loop blocks; app becomes unresponsive during market open.
**Why it happens:** Natural first instinct to persist everything for debugging.
**How to avoid:** Ring buffer per symbol in FastAPI memory. Only OHLCV bars flushed to DB every 1s. Raw ticks go to browser via WS only.
**Warning signs:** FastAPI log shows async queue depth >100 at 10:00 BRT.

### Pitfall 2: Skipping order idempotency
**What goes wrong:** Network drop after order send → uncertain order state → either double position (resend) or ghost order (no resend).
**Why it happens:** Assuming MetaAPI WebSocket is reliable.
**How to avoid:** `clientOrderId = sha256(user_id + robot_id + signal_timestamp)` in MetaAPI order comment. Poll `get_orders()` to confirm. DB state machine: QUEUED→SENDING→SENT→CONFIRMED→FILLED.

### Pitfall 3: Module-level robot state dict keyed by robot_id only
**What goes wrong:** User B's robot gets User A's MetaAPI connection handle. Ghost positions; wrong fills.
**Why it happens:** Building for single user and ignoring multi-tenancy.
**How to avoid:** ALL in-memory structures: `connections[user_id][robot_id]`. Pydantic models with `user_id` as required field on every state object.

### Pitfall 4: Computing indicators on full DataFrame in backtest
**What goes wrong:** EMA at bar N uses future data. Backtest shows Sharpe >3. Live trading shows 2x backtest drawdown.
**Why it happens:** pandas `.rolling()` and `.ewm()` on full DataFrame is vectorized — includes future values.
**How to avoid:** Event-driven loop. `df.iloc[:i+1]` per bar. Entry price = next bar's open, not signal bar's close.

### Pitfall 5: Prototype CSS class patterns used in React
**What goes wrong:** Developer copies prototype's `nv-on`, `sg-on`, `kb-on`, `et-on` class toggle patterns into React. These depend on the dc-runtime body class state machine.
**Why it happens:** Prototype is the visual spec; its markup looks like React patterns but isn't.
**How to avoid:** Implement all interactive state (active nav, segment control selected, toggle on/off) as React state. Use the CSS class names from the prototype ONLY as class names — never carry over the dc-runtime toggle logic.

### Pitfall 6: Hardcoding UTC offsets for B3 trading hours
**What goes wrong:** Trading hours check works in January, breaks in March/November when US DST shifts CME offset.
**Why it happens:** "Brazil is always UTC-3" is true but CME Chicago changes.
**How to avoid:** `from zoneinfo import ZoneInfo; ZoneInfo("America/Sao_Paulo")`. For all time comparisons, use aware datetime objects.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Frontend | Vitest + React Testing Library |
| Backend | pytest + httpx (async) |
| E2E | Playwright (Phase 1: smoke tests only) |
| Config | `frontend/vitest.config.ts`, `backend/pytest.ini` |
| Quick frontend run | `npm run test --run` (Vitest) |
| Quick backend run | `pytest backend/tests/ -x -q` |
| Full suite | `npm run test --run && pytest backend/tests/` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Command | Notes |
|--------|----------|-----------|---------|-------|
| AUT-01 | Email registration creates user | Integration (Supabase test project) | `pytest tests/test_auth.py::test_register` | Requires Supabase test project |
| AUT-02 | Login returns valid session | Integration | `pytest tests/test_auth.py::test_login` | |
| AUT-03 | Password reset email sent | Integration | `pytest tests/test_auth.py::test_reset` | |
| AUT-06 | OAuth redirect URL formed | Unit | `pytest tests/test_auth.py::test_oauth_url` | |
| WIZ-05 | Robot name uniqueness check | Unit | `pytest tests/test_robots.py::test_name_unique` | |
| WIZ-06 | Robot creation returns 201 + id | Integration | `pytest tests/test_robots.py::test_create_robot` | |
| EDT-03 | IT params save validates cross-field rules | Unit (Pydantic) | `pytest tests/test_params.py::test_it_validation` | Each cross-field rule gets its own test |
| EXE-01 | Start blocked without saved params | Unit | `pytest tests/test_engine.py::test_start_requires_params` | |
| EXE-04 | WIN% resolves to correct expiry symbol | Unit | `pytest tests/test_calendar.py::test_contract_resolution` | |
| EXE-05 | Order persisted with correct schema | Integration | `pytest tests/test_orders.py::test_order_persist` | |
| EXE-06 | Duplicate clientOrderId rejected | Unit | `pytest tests/test_orders.py::test_idempotency` | |
| SUM-02 | Equity chart reconstructs from orders | Unit | `pytest tests/test_sumario.py::test_equity_calc` | |
| SUM-04 | CSV export produces correct columns + BOM | Unit | `npx vitest run src/components/sumario/csv.test.ts` | Frontend unit |
| BCK-04 | Backtest report metrics match Sumário metrics | Unit | `pytest tests/test_backtest.py::test_metrics_parity` | |
| ROB-02 | Sparkline renders without crash | Component | `npx vitest run src/components/robot-card/SparklineChart.test.tsx` | |
| CTR-02 | Broker link triggers MetaAPI provisioning | Integration (mock MetaAPI) | `pytest tests/test_broker.py::test_provision` | Mock MetaAPI SDK |

### Sampling Rate
- **Per task commit:** `pytest backend/tests/ -x -q --timeout=10` + `npm run test --run` (fast tests only)
- **Per wave merge:** Full suite including integration tests
- **Phase gate:** Full suite green + Playwright smoke test before `/gsd:verify-work`

### Wave 0 Gaps (must create before implementing)
- [ ] `backend/tests/conftest.py` — pytest fixtures: test supabase client, mock MetaAPI adapter
- [ ] `backend/tests/test_auth.py` — AUT requirement tests
- [ ] `backend/tests/test_robots.py` — robot CRUD tests
- [ ] `backend/tests/test_params.py` — IT parameter cross-field validation tests
- [ ] `backend/tests/test_engine.py` — RobotEngine state machine tests
- [ ] `backend/tests/test_calendar.py` — B3 contract resolution tests
- [ ] `backend/tests/test_orders.py` — order persistence + idempotency tests
- [ ] `backend/tests/test_sumario.py` — metrics computation tests
- [ ] `backend/tests/test_backtest.py` — backtest engine tests
- [ ] `frontend/src/components/robot-card/SparklineChart.test.tsx`
- [ ] `frontend/src/components/sumario/csv.test.ts`
- [ ] `frontend/vitest.config.ts`
- [ ] `backend/pytest.ini`
- [ ] Framework install: `pip install pytest pytest-asyncio httpx` + `npm install -D vitest @testing-library/react`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | YES | Supabase Auth (handles hashing, session rotation, email verification) |
| V3 Session Management | YES | Supabase JWT (short-lived access + refresh token); `signOut(scope:'global')` for AUT-04 |
| V4 Access Control | YES | Supabase RLS on every table: `USING (user_id = auth.uid())` |
| V5 Input Validation | YES | Pydantic v2 (backend); HTML5 + client validation (frontend) |
| V6 Cryptography | NO (direct) | Supabase handles password hashing; broker creds stored as MetaAPI account ID only (not raw MT5 password) |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| JWT forgery / bypass | Spoofing | Validate against `SUPABASE_JWT_SECRET`; check `audience="authenticated"` |
| Row-level data leak (user A sees user B's robots) | Info Disclosure | RLS `USING (user_id = auth.uid())` on ALL tables; test with `SET ROLE authenticated` |
| Duplicate order injection via retry | Tampering | `clientOrderId` uniqueness constraint in DB; idempotency at broker adapter layer |
| Tick data flooding (WebSocket DoS) | DoS | Rate limit WS connections per user; ring buffer caps memory per symbol |
| Stale strategy state after reconnect | Tampering | Reset all strategy state on `on_reconnected` event; staleness sentinel |
| MT5 credential exposure | Info Disclosure | Never store raw MT5 password; store only MetaAPI account ID post-provisioning |
| CORS misconfiguration | Spoofing | Allowlist: Cloudflare Pages domain + `http://localhost:5173` only |
| SQL injection via JSONB params | Tampering | Parameterized queries via supabase-py; Pydantic validates JSONB before write |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend build | ✓ | v24.13.1 | — |
| Python 3 | Backend | ✓ | 3.12.3 | — |
| npm | Package install | ✓ | bundled with Node | — |
| pip | Package install | ✓ | bundled | — |
| Supabase project | Auth + DB + Realtime | ✗ (hosted) | — | Must create dev project before Wave 0 |
| MetaAPI account | Broker integration | ✗ (external) | — | Mock adapter for Wave 0-3; real account needed for Wave 3 proof-of-concept |
| Vultr VPS | Backend deployment | ✗ (not provisioned) | — | Local dev sufficient through Wave 6; provision before final deploy |

**Missing dependencies with no fallback:**
- Supabase project (dev): must be created in Wave 0 — blocks all auth and data work
- MetaAPI account: needed for Wave 3 proof-of-concept — without it, only mock adapter testing possible

**Missing dependencies with fallback:**
- Vultr VPS: local dev with `uvicorn --reload` for all development waves

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `echarts@6.1.0` should be pinned to match prototype; 6.x has breaking option API changes | Standard Stack | Sparklines/equity chart options fail to render; need code changes to migrate |
| A2 | `metaapi-cloud-sdk@29.1.1` is the correct current version; v29 Python API is compatible with documented patterns | Standard Stack | Adapter code fails to compile; must rewrite broker layer |
| A3 | `python-jose[cryptography]` is the correct JWT library for Supabase JWT validation in FastAPI | Standard Stack | JWT validation fails; need to switch to PyJWT or jose alternative |
| A4 | `APScheduler@3.10.x` is appropriate for B3 calendar refresh and daily cleanup jobs | Standard Stack | Scheduler doesn't integrate cleanly with asyncio event loop; need to use asyncio-scheduler or celery |
| A5 | `react-router-dom@6.x` for client-side routing | Standard Stack | API changes in v6→v7 may require different setup |
| A6 | B3 WIN%/WDO% expiry is 3rd Monday of even months; BIT% is 3rd Friday monthly | Data Model | Wrong rollover calendar → force-close fires on wrong day |
| A7 | Supabase Realtime `postgres_changes` subscription with RLS works without additional configuration beyond enabling the extension and having RLS policies | Integration | Realtime events not delivered to clients; need to add explicit realtime policies |
| A8 | PRD §12 fully specifies all 14 Tangram 3.0 indicators and their cross-field validation rules | EDT-01..03 | Some cross-field rules implicit in prototype only → implementer must consult both PRD §12 and prototype simultaneously |
| A9 | MetaAPI's Python SDK supports asyncio natively and integrates with FastAPI's event loop without thread bridges | Integration | Must use thread bridge (like ib_insync pattern) → significant architecture change |
| A10 | Backtest runner can use `asyncio.create_task()` for Phase 1 solo-user scale without hitting event loop blocking | BCK-01..04 | Backtest blocks event loop → must use `ProcessPoolExecutor` from Wave 5 start |

---

## Open Questions

1. **PRD §12 completeness for Tangram 3.0 cross-field rules**
   - What we know: 14 indicators exist; CONTEXT.md references PRD §12 and §10; prototype shows all 14 with selects for mode + usage form
   - What's unclear: Are all cross-field dependencies (e.g., indicator A conflicts with indicator B when both selected) fully documented in PRD §12?
   - Recommendation: Implementer reads PRD §12 + §10 in full in Wave 3 before coding the parameter form. Flag any undocumented rules for human review.

2. **MetaAPI v29 Python API surface**
   - What we know: Latest PyPI version is 29.1.1; version jumped from 21.x to 27.x to 29.x with large gaps
   - What's unclear: What methods/events changed between v21 (prior research) and v29? Does `on_tick`, `get_positions`, `get_orders` API remain stable?
   - Recommendation: Wave 3 task 1 = install v29 and run a proof-of-concept tick subscription before building the full adapter.

3. **Supabase Realtime RLS setup for `postgres_changes`**
   - What we know: Supabase Realtime respects RLS; tables must be in the replication publication
   - What's unclear: Does enabling RLS automatically apply to Realtime, or must policies be set separately in `supabase_realtime` schema?
   - Recommendation: Wave 0 verification task: create a test table, enable Realtime + RLS, subscribe from browser client, verify events are received and filtered.

4. **BTG Pactual commission rates for mini-contracts**
   - What we know: B3 round-trip costs are approximately WIN% ~R$3–4/contract (from prior research)
   - What's unclear: Exact BTG Pactual commission schedule for the owner's account tier
   - Recommendation: Confirm from broker fee schedule before seeding the backtest cost profiles. Required as a parameter in BCK-01.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux + Redux Toolkit for React state | Zustand (server state) + TanStack Query (server cache) | 2022–2024 | No boilerplate, simpler devex |
| socket.io for WebSocket | Native FastAPI WebSocket + browser WebSocket API | 2022+ | No extra protocol layer; works with any ASGI server |
| Custom auth (JWT + bcrypt) | Supabase Auth | 2021+ | Email verify, OAuth, session refresh all built-in |
| Pandas vectorized backtesting | Event-driven bar loop | Always correct; commonly ignored | Eliminates look-ahead bias |
| Celery + Redis for background tasks | `asyncio.create_task` (Phase 1) / `ProcessPoolExecutor` | Phase 1 decision | No infrastructure overhead for solo phase |
| metaapi-cloud-sdk v21.x | v29.1.1 (current) | 2024–2025 | API may have breaking changes; verify before use |

---

## Sources

### Primary (HIGH confidence)
- `01-CONTEXT.md` — All locked decisions D-01 through D-17; code constraints; integration points
- `01-UI-SPEC.md` — Component contracts, color tokens, typography, spacing, copy strings
- `.planning/codebase/ARCHITECTURE.md` — Hard constraints on dc-runtime, anti-patterns
- `.planning/codebase/STACK.md` — ECharts 6.1.0, Blue Hour DS v2.1, font stack
- `.planning/codebase/INTEGRATIONS.md` — CSV export pattern, theme localStorage contract
- `.planning/research/SUMMARY.md` — Architecture decisions, critical pitfalls, build order
- `.planning/research/PITFALLS.md` — PITFALL-01 through PITFALL-16 with prevention details
- `HANDOFF_TECH_LOG.md` — Prototype decisions, known bugs, what's implemented vs pending
- npm registry (verified): react 19.2.7, @supabase/supabase-js 2.108.2, echarts 6.1.0, zustand 5.0.14, @tanstack/react-query 5.101.0, vite 8.0.16
- PyPI registry (verified): fastapi 0.137.1, supabase 2.31.0, metaapi-cloud-sdk 29.1.1, pydantic 2.13.4, uvicorn 0.49.0

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — Full requirement list, traceability table
- `.planning/ROADMAP.md` — Phase 1 success criteria
- `.planning/PROJECT.md` — Constraints, key decisions, out-of-scope
- `.planning/codebase/CONVENTIONS.md` — Naming conventions, React patterns, error handling

### Tertiary (LOW / ASSUMED)
- react-router-dom v6, lucide-react, tailwindcss, python-jose, APScheduler — assumed from standard ecosystem knowledge; not verified via official docs in this session

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH (core packages verified via registry; minor libs ASSUMED)
- Architecture: HIGH (locked in CONTEXT.md; patterns from prior research)
- UI Fidelity: HIGH (extracted from 01-UI-SPEC.md which was built from prototype)
- Data Model: HIGH (derived from requirements + architecture decisions)
- API Surface: HIGH (derived from requirements + architecture)
- Pitfalls: HIGH (from PITFALLS.md + SUMMARY.md + CONCERNS.md)
- MetaAPI integration specifics: MEDIUM (v29 API surface unverified)

**Research date:** 2026-06-16
**Valid until:** 2026-07-16 (30 days; MetaAPI SDK check sooner if v30 releases)
