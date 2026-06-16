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
