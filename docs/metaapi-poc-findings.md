# MetaAPI v29 PoC — Findings (plan 01-09)

**Date:** 2026-06-16 · **SDK:** metaapi-cloud-sdk==29.1.1 · **Account:** 5518fd64-… (MetaQuotes-Demo)

## Run status
- ✅ **Auth + provisioning API work** — token valid; `GET /users/current/accounts/{id}` → 200; account state `UNDEPLOYED`.
- ⛔ **`account.deploy()` → 403 ForbiddenException**: *"To allow trading account deployment please top up your account."* MetaApi requires a positive balance to deploy (run the cloud terminal). Live tick/order round-trip is therefore **pending a MetaApi top-up**.
- ✅ **Full v29 API surface extracted from the installed SDK source** (below) — this is the ground truth plan 01-10 builds against; the `# NOTE:` guesses in the PoC are now resolved.
- ✅ **Async model: native asyncio** (SDK uses httpx/anyio, all `async def`) — no thread bridge. Confirms A9 → fits FastAPI `asyncio.create_task` per robot (D-17).

## Confirmed API surface (v29.1.1)

### Top-level
`from metaapi_cloud_sdk import MetaApi, SynchronizationListener`

### Account (`MetatraderAccount`, from `api.metatrader_account_api.get_account(id)`)
| Method | Notes |
|--------|-------|
| `await account.deploy()` / `await account.undeploy()` | deploy needs MetaApi balance (403 otherwise) |
| `await account.wait_deployed()` / `await account.wait_connected()` | poll until ready |
| `account.get_streaming_connection(...)` | → streaming connection (ticks + sync listener) |
| `account.get_rpc_connection()` | → RPC connection (positions/orders queries) |

### Streaming connection (`StreamingMetaApiConnectionInstance`)
- `await connection.connect()` / `await connection.wait_synchronized(opts)`
- `await connection.subscribe_to_market_data(symbol, subscriptions)` — tick stream
- `connection.unsubscribe_from_market_data(symbol, ...)`
- `connection.add_synchronization_listener(listener)`

### Order placement (`MetatraderConnectionInstance` base — both streaming & rpc)
- `create_market_buy_order(symbol, volume, sl, tp, options)` · `create_market_sell_order(...)`
- `create_limit_buy_order(...)` · `close_position(position_id, options)`
- clientId / comment passed via the `options` dict (for idempotency tagging).

### RPC connection (`RpcMetaApiConnectionInstance`)
- `await get_positions()` · `get_position(id)` · `await get_orders()` · `get_order(id)`  → state rehydration (EXE-06)

### Synchronization listener (`SynchronizationListener` — subclass & override)
- `on_symbol_price_updated(instance_index, price: MetatraderSymbolPrice)` ← **single-symbol tick** (the live quote feed)
- `on_symbol_prices_updated(...)` ← batched
- `on_connected(instance_index, replicas)` / `on_disconnected(instance_index)` ← **reconnection signals (RISK-02)**
- `on_positions_updated` / `on_positions_replaced` / `on_pending_orders_updated`
- `on_synchronization_started(...)`

## Implications for plan 01-10
- **Tick payload** = `MetatraderSymbolPrice` model (fields: bid/ask/time/etc. — read the model when implementing the fill simulator).
- **Reconnection (RISK-02):** on `on_disconnected` → halt; on `on_connected`/`on_synchronization_started` → reset strategy state + re-query `get_positions()/get_orders()` (assume missed ticks NOT replayed). Staleness sentinel still applies.
- **Idempotency:** pass deterministic `clientId`/`comment` in order `options`.
- **Adapter shape:** `MetaAPIAdapter(BrokerPort)` wraps a streaming connection (subscribe + listener) for ticks and an RPC connection for queries; one streaming connection serves the system account for Simulado (D-06).

## Pending live validation (needs MetaApi top-up + deploy)
- Exact `MetatraderSymbolPrice` field names/types from a real tick.
- Order placement response + fill event shape.
- Reconnection timing/behaviour under a forced disconnect.

> These are confirmation-only; the method surface above is sufficient to build 01-10. Re-run `python -m backend.broker.poc_metaapi` after topping up the MetaApi account (and set POC_SYMBOL/POC_VOLUME) to capture the live payloads.

---

## LIVE RUN CONFIRMED (2026-06-16 18:06, MetaQuotes-Demo, deployed)

Account deployed + connected + synchronized; 20 EURUSD ticks received; teardown auto-undeployed (billing stopped). Run time 116s.

### Tick payload — `on_symbol_price_updated(instance_index, price)` → `MetatraderSymbolPrice`
```json
{"symbol":"EURUSD","bid":1.16098,"ask":1.16116,
 "time":"2026-06-16 21:06:43+00:00","brokerTime":"2026-06-17 00:06:43.000",
 "accountCurrencyExchangeRate":1,"profitTickValue":1,"lossTickValue":1,
 "timestamps":{"eventGenerated":"...","serverProcessingStarted":"...","serverProcessingFinished":"..."},
 "equity":10000}
```
→ Fill simulator uses `bid`/`ask`; timestamp = `time` (tz-aware UTC) / `brokerTime`; `timestamps.*` for latency.

### Account info — `connection.terminal_state.account_information`
```json
{"platform":"mt5","type":"ACCOUNT_TRADE_MODE_DEMO","broker":"MetaQuotes Ltd.","currency":"USD",
 "balance":10000,"equity":10000.0,"margin":0,"freeMargin":10000,"leverage":100,"tradeAllowed":true,
 "marginMode":"ACCOUNT_MARGIN_MODE_RETAIL_HEDGING","login":108457238,"accountCurrencyExchangeRate":1}
```
`terminal_state.connected` = True; `.positions` / `.orders` = [] (work).

### Reconnection (RISK-02)
`on_connected(instance_index, replicas)`, `on_disconnected(instance_index)`, `on_synchronization_started(instance_index, …)` all fire. **Listener MUST subclass `SynchronizationListener`** — a standalone listener raises AttributeError on every un-overridden callback (on_symbol_specification_updated, on_health_status, on_broker_connection_status_changed) — 9944 errors drowned sync in the first attempt.

### Order placement — IMPORTANT constraint
`connection.create_market_buy_order(symbol, volume, sl, tp, options)` raised `ValidationException` with `options={"comment":…, "clientId":"poc-vetor-01-09-001"}`.
Root cause (SDK models.py): **comment + clientId combined length ≤ 30 chars** (≤31 if only one), restricted charset.
→ **Plan 01-10 idempotency:** store the full `sha256(user+robot+signal_ts)` `client_order_id` in the DB (UNIQUE), but send a SHORT (≤30 char, alphanumeric) derived id as the MetaApi `clientId`. Do NOT send the raw 64-char hash. Re-confirm the exact order response shape (`MetatraderTradeResponse`) once a valid clientId is used.

### Async model
Native asyncio (httpx/anyio); all SDK calls are `async def` → fits FastAPI `asyncio.create_task` per robot (D-17). Deploy/connect ≈ 3-5 s when already deployed; first deploy can take minutes.
