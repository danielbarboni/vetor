# MetaAPI v29 PoC Findings

**Status:** TEMPLATE — fill after running `python -m backend.broker.poc_metaapi`
**Plan:** 01-09 (Vetor trading platform, phase 1)
**Purpose:** Document the actual v29 SDK surface so plan 10 (BrokerPort / MetaAPIAdapter)
is built against real observed behaviour, not training-data assumptions.

Run command:
```
cd /path/to/vetor
source backend/.venv/bin/activate   # or however your venv is activated
python -m backend.broker.poc_metaapi 2>&1 | tee /tmp/poc_metaapi_$(date +%Y%m%d_%H%M%S).log
```

---

## 1. Connection and Synchronisation

### 1a. Top-level class / constructor

| Item | Expected (plan assumption) | Observed (fill here) |
|------|---------------------------|----------------------|
| Import path | `from metaapi_cloud_sdk import MetaApi` | ▢ |
| Constructor kwargs accepted | `(token)` | ▢ |
| `metatrader_account_api.get_account(id)` | works as-is | ▢ |
| `account.deploy()` method name | `deploy()` | ▢ |
| `account.wait_synchronized()` kwargs | `{"applicationPattern": ".*"}` | ▢ |
| `account.state` possible values | `DEPLOYED / DEPLOYING / UNDEPLOYED` | ▢ |

### 1b. Streaming connection

| Item | Expected | Observed |
|------|----------|----------|
| Get streaming connection | `account.get_streaming_connection()` | ▢ |
| Connect method | `connection.connect()` | ▢ |
| Wait synced method | `connection.wait_synchronized()` | ▢ |
| Listener registration | `connection.add_synchronization_listener(obj)` | ▢ |

---

## 2. Tick / Price Event Schema

### 2a. Subscription

| Item | Expected | Observed |
|------|----------|----------|
| Subscribe method | `connection.subscribe_to_market_data(symbol, [{...}])` | ▢ |
| Valid subscription type strings | `"quotes"`, `"ticks"` | ▢ |
| Unsubscribe method | `connection.unsubscribe_from_market_data(...)` | ▢ |
| B3 front-month symbol format | `"WIN@N"` or `"WINM25"` | ▢ (note exact string) |

### 2b. Tick event callback

| Item | Expected | Observed |
|------|----------|----------|
| Listener method name | `on_symbol_price_updated` | ▢ |
| Callback signature | `(account_id, prices, equity, margin, free_margin, margin_level)` | ▢ |
| `prices` element fields | unknown — inspect raw output | ▢ (list all fields + types) |
| Timestamp field name | unknown | ▢ |
| Timestamp format | ISO-8601 string or Unix ms? | ▢ |
| Bid/Ask field names | `bid` / `ask`? | ▢ |
| Last trade price field | `last`? | ▢ |
| Volume field | `volume`? | ▢ |

**Paste a sample tick JSON here:**
```json
▢
```

---

## 3. Async Model

| Question | Expected (RESEARCH A9) | Observed |
|----------|----------------------|----------|
| Does SDK use native asyncio? | Yes (native, same loop as FastAPI) | ▢ |
| Or does it use a thread bridge? | No | ▢ |
| `asyncio.run()` works for standalone script? | Yes | ▢ |
| Safe to `await` SDK calls from FastAPI coroutines? | Yes | ▢ |
| Any loop.run_until_complete() or threading.Thread in SDK internals? | Unknown | ▢ |

Notes: ▢

---

## 4. Order Placement

### 4a. Method names

| Item | Expected | Observed |
|------|----------|----------|
| Buy market order | `connection.create_market_buy_order(symbol, volume, options={...})` | ▢ |
| Sell market order | `connection.create_market_sell_order(symbol, volume, options={...})` | ▢ |
| `options` dict accepted? | Yes | ▢ |
| `comment` field in options | `options={"comment": "..."}` | ▢ |
| `clientOrderId` field in options | `options={"clientOrderId": "..."}` | ▢ |

### 4b. Response structure

| Item | Observed |
|------|----------|
| Result type | ▢ (dict / object?) |
| `orderId` / `order_id` key | ▢ |
| `tradeResultCode` / status key | ▢ |
| Error structure on failure | ▢ |

**Paste a sample order result JSON here:**
```json
▢
```

---

## 5. State Query — get_positions / get_orders

### 5a. Via async methods

| Method | Works? | Response shape |
|--------|--------|----------------|
| `await connection.get_positions()` | ▢ | ▢ |
| `await connection.get_orders()` | ▢ | ▢ |

### 5b. Via terminal_state (synchronous)

| Attribute | Works? | Type / shape |
|-----------|--------|-------------|
| `connection.terminal_state` | ▢ | ▢ |
| `terminal_state.positions` | ▢ | ▢ |
| `terminal_state.orders` | ▢ | ▢ |
| `terminal_state.account_information` | ▢ | ▢ (note equity / balance fields) |
| `terminal_state.connected` | ▢ | ▢ |

**Key position fields observed (for EXE-06 rehydration):**
```
▢
```

---

## 6. Reconnection Behaviour (RISK-02)

| Question | RESEARCH prediction | Observed |
|----------|---------------------|----------|
| `on_disconnected()` callback fires on network loss? | Yes | ▢ |
| `on_connected()` callback fires on reconnect? | Yes | ▢ |
| Missed ticks replayed after reconnect? | NO (RISK-02) | ▢ |
| Missed ticks window (if any replay): | 0 s | ▢ |
| `on_synchronization_started()` fires on reconnect? | Yes | ▢ |
| Time to reconnect (observed): | unknown | ▢ s |

**RISK-02 verdict:** ▢ CONFIRMED / ▢ REFUTED (explain):

---

## 7. Deviations from RESEARCH / Plan Assumptions

List any SDK behaviour that differed from what plan 01-09 assumed:

1. ▢
2. ▢
3. ▢

---

## 8. Recommended Adaptations for Plan 10 (BrokerPort / MetaAPIAdapter)

Based on the findings above, note any design changes plan 10 should incorporate:

1. ▢
2. ▢
3. ▢

---

*Filled by: ____________  Date: ____________  MetaAPI account type: ▢ DEMO / ▢ LIVE*
