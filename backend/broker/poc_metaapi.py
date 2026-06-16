"""
THROWAWAY PROOF-OF-CONCEPT — DO NOT IMPORT FROM APPLICATION CODE.
==================================================================
Purpose : Verify the metaapi-cloud-sdk v29 API surface before building
          the production BrokerPort adapter (plan 10).
Author  : Generated for plan 01-09 (Vetor trading platform).
Run     : python -m backend.broker.poc_metaapi  (from repo root, inside venv)
Requires: METAAPI_TOKEN and METAAPI_SYSTEM_ACCOUNT_ID set in backend/.env
          (or as environment variables).  A DEMO account is strongly preferred.

SAFETY WARNING
--------------
Task 4 below attempts to place a real market order.
If METAAPI_SYSTEM_ACCOUNT_ID points to a LIVE account this will execute
a real trade with real money.  Use a MetaAPI DEMO account for this PoC.

NOTE comments mark places where the exact v29 symbol / method name must be
confirmed at run time against the official SDK docs.  Do not trust these
names blindly — the SDK jumped v21→v27→v29 with breaking changes.

Findings template: docs/metaapi-poc-findings.md  (fill after running).
"""

from __future__ import annotations

import asyncio
import json
import logging
import sys
import time

# NOTE: Adjust import path if the installed package exposes a different top-level name.
# Confirmed package: metaapi-cloud-sdk==29.1.1 (pip install metaapi-cloud-sdk==29.1.1)
try:
    from metaapi_cloud_sdk import MetaApi  # NOTE: verify exact class name in v29
except ImportError as exc:  # pragma: no cover
    sys.exit(
        f"metaapi-cloud-sdk not installed: {exc}\n"
        "Run: pip install metaapi-cloud-sdk==29.1.1"
    )

# Read credentials from the application settings (never hardcode).
# sys.path manipulation is acceptable for a throwaway PoC script.
import os
import sys as _sys

_sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from backend.config import settings  # noqa: E402

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    stream=sys.stdout,
)
log = logging.getLogger("poc_metaapi")

# ---------------------------------------------------------------------------
# Constants — adjust as needed before running
# ---------------------------------------------------------------------------
# B3 front-month WIN futures symbol.
# NOTE: MetaAPI may normalise the symbol differently; at run time verify the
# exact ticker string returned by account.get_symbols() and update here.
SYMBOL = "WIN@N"  # NOTE: or "WINM25", "WIN$" — check account symbol list

TICK_SAMPLE_COUNT = 20  # Print first N tick events then stop subscribing
ORDER_VOLUME = 1  # Minimum lot size for B3 mini-contracts
ORDER_COMMENT = "poc_vetor_01_09"  # NOTE: confirm 'comment' field supported in v29
ORDER_CLIENT_ID = "poc-vetor-01-09-001"  # NOTE: confirm 'clientOrderId' field in v29


# ---------------------------------------------------------------------------
# Listener classes
# ---------------------------------------------------------------------------


class TickListener:
    """Receives streaming price/tick events from MetaAPI.

    NOTE: In v29 the listener base class may be named differently.
    Possible names: SynchronizationListener, MetaApiSynchronizationListener,
    or the account may expose subscribe_to_market_data() with a callback dict.
    Confirm exact inheritance pattern at run time.
    """

    def __init__(self, max_ticks: int) -> None:
        self._count = 0
        self._max = max_ticks
        self._done = asyncio.Event()

    @property
    def done(self) -> asyncio.Event:
        return self._done

    # NOTE: Method name may be on_symbol_price_updated, on_tick, or on_quote —
    # confirm against v29 changelog.  Below uses the most likely v29 name.
    async def on_symbol_price_updated(  # NOTE: verify method name
        self, account_id: str, prices: list, equity: float, margin: float, free_margin: float, margin_level: float
    ) -> None:
        """Called when price/tick arrives for a subscribed symbol."""
        if self._count >= self._max:
            return
        for price in prices:
            self._count += 1
            log.info(
                "[TICK %02d/%02d] raw structure: %s",
                self._count,
                self._max,
                json.dumps(price, default=str),
            )
        if self._count >= self._max:
            self._done.set()

    async def on_connected(self, account_id: str, instance_index: int) -> None:
        log.info("[RECONNECT] Connected: account=%s instance=%s", account_id, instance_index)

    async def on_disconnected(self, account_id: str, instance_index: int) -> None:
        log.warning(
            "[RECONNECT] Disconnected: account=%s instance=%s — "
            "RISK-02: SDK does NOT replay missed ticks; confirm here.",
            account_id,
            instance_index,
        )

    async def on_synchronization_started(self, account_id: str, *args, **kwargs) -> None:  # type: ignore[override]
        log.info("[SYNC] Synchronization started: account=%s", account_id)

    async def on_account_information_updated(self, account_id: str, account_information: dict) -> None:
        log.debug("[ACCOUNT] %s", json.dumps(account_information, default=str))

    async def on_positions_updated(self, account_id: str, positions: list, removed_position_ids: list) -> None:
        log.debug("[POSITIONS] count=%d removed=%s", len(positions), removed_position_ids)

    async def on_orders_updated(self, account_id: str, orders: list, completed_order_ids: list) -> None:
        log.debug("[ORDERS] count=%d completed=%s", len(orders), completed_order_ids)

    async def on_history_orders_updated(self, account_id: str, history_orders: list) -> None:
        log.debug("[HISTORY_ORDERS] count=%d", len(history_orders))

    async def on_deals_updated(self, account_id: str, deals: list) -> None:
        log.debug("[DEALS] count=%d", len(deals))


# ---------------------------------------------------------------------------
# Main PoC routine
# ---------------------------------------------------------------------------


async def run_poc() -> None:
    """Full PoC walkthrough — each section is numbered to match findings doc."""
    token = settings.METAAPI_TOKEN
    account_id = settings.METAAPI_SYSTEM_ACCOUNT_ID

    if not token or not account_id:
        log.error(
            "METAAPI_TOKEN or METAAPI_SYSTEM_ACCOUNT_ID is empty. "
            "Set them in backend/.env and re-run."
        )
        sys.exit(1)

    log.info("=== MetaAPI v29 PoC — Vetor platform (plan 01-09) ===")
    log.info("Token prefix: %s...", token[:8] if len(token) > 8 else "(short)")
    log.info("System account ID: %s", account_id)

    # ── Section 1: Connect and synchronise ───────────────────────────────────
    log.info("\n── [1/6] Connect to MetaAPI and synchronise account ──")

    # NOTE: MetaApi() constructor signature may accept domain, requestTimeout,
    # retryOpts kwargs in v29.  Confirm acceptable kwargs.
    api = MetaApi(token)  # NOTE: verify constructor params for v29

    try:
        account = await api.metatrader_account_api.get_account(account_id)
        # NOTE: deploy() may be required only for accounts not yet deployed.
        # In v29 it may be: account.deploy(), account.wait_deployed() — check.
        log.info("Account state: %s", account.state)
        if account.state not in ("DEPLOYED", "DEPLOYING"):
            log.info("Deploying account …")
            await account.deploy()  # NOTE: verify method name in v29

        log.info("Waiting for synchronisation …")
        await account.wait_synchronized({"applicationPattern": ".*", "synchronizationId": None})  # NOTE: verify kwargs
        log.info("[1/6] Synchronised OK. Connection type: %s", getattr(account, "connection_type", "unknown"))
    except Exception:
        log.exception("[1/6] FAILED during connect/sync — aborting")
        raise

    # ── Section 2: Subscribe to tick stream ──────────────────────────────────
    log.info("\n── [2/6] Subscribe to tick stream for %s ──", SYMBOL)

    tick_listener = TickListener(max_ticks=TICK_SAMPLE_COUNT)

    try:
        # NOTE: In v29 the streaming connection API may be:
        #   connection = account.get_streaming_connection()
        #   await connection.connect()
        #   await connection.subscribe_to_market_data(SYMBOL, [{"type": "quotes"}, {"type": "ticks"}])
        # Or it may still use add_synchronization_listener + subscribe_to_market_data.
        # Adjust below after confirming the v29 streaming connection class.

        connection = account.get_streaming_connection()  # NOTE: verify method name
        connection.add_synchronization_listener(tick_listener)  # NOTE: verify
        await connection.connect()  # NOTE: verify
        await connection.wait_synchronized()  # NOTE: verify

        log.info("Subscribing to market data for %s …", SYMBOL)
        # NOTE: subscription options dict keys may differ in v29 (e.g. "type" values).
        await connection.subscribe_to_market_data(  # NOTE: verify
            SYMBOL,
            [{"type": "quotes"}, {"type": "ticks"}],  # NOTE: confirm valid type strings
        )

        log.info("Waiting for %d ticks …", TICK_SAMPLE_COUNT)
        try:
            await asyncio.wait_for(tick_listener.done.wait(), timeout=120.0)
            log.info("[2/6] Received %d ticks — subscription OK", TICK_SAMPLE_COUNT)
        except asyncio.TimeoutError:
            log.warning("[2/6] Timeout waiting for ticks — check symbol %r and account subscription", SYMBOL)

    except Exception:
        log.exception("[2/6] FAILED during tick subscription")

    # ── Section 3: get_positions and get_orders ───────────────────────────────
    log.info("\n── [3/6] get_positions() and get_orders() ──")
    try:
        # NOTE: In v29 these may be on the terminal_state rather than called
        # directly as async methods.  Possible alternatives:
        #   terminal_state = connection.terminal_state
        #   positions = terminal_state.positions
        #   orders = terminal_state.orders
        # Or async: await connection.get_positions()
        positions = await connection.get_positions()  # NOTE: verify
        log.info("[3/6] get_positions() — count=%d", len(positions))
        for i, pos in enumerate(positions[:3]):
            log.info("  position[%d]: %s", i, json.dumps(pos, default=str))

        orders = await connection.get_orders()  # NOTE: verify
        log.info("[3/6] get_orders() — count=%d", len(orders))
        for i, ord_ in enumerate(orders[:3]):
            log.info("  order[%d]: %s", i, json.dumps(ord_, default=str))

    except Exception:
        log.exception("[3/6] FAILED during get_positions/get_orders")

    # ── Section 4: Place a simulated order (DEMO ONLY) ────────────────────────
    log.info("\n── [4/6] Place market order — DEMO ACCOUNT ONLY ──")
    log.info("SAFETY: If this is a LIVE account, comment out this section!")

    try:
        # NOTE: In v29 order placement may be on the trade_executor or connection:
        #   result = await connection.create_market_buy_order(
        #       SYMBOL, ORDER_VOLUME, stopLoss=None, takeProfit=None,
        #       options={"comment": ORDER_COMMENT, "clientOrderId": ORDER_CLIENT_ID}
        #   )
        # Exact kwargs and options dict keys must be confirmed at run time.
        result = await connection.create_market_buy_order(  # NOTE: verify method name
            SYMBOL,
            ORDER_VOLUME,
            options={
                "comment": ORDER_COMMENT,  # NOTE: confirm 'comment' accepted
                "clientOrderId": ORDER_CLIENT_ID,  # NOTE: confirm 'clientOrderId' accepted
            },
        )
        log.info("[4/6] Order result: %s", json.dumps(result, default=str))

        # Brief pause then close the position to avoid leaving an open trade
        await asyncio.sleep(2.0)
        order_id = result.get("orderId") or result.get("order_id")  # NOTE: check key name
        if order_id:
            close_result = await connection.create_market_sell_order(  # NOTE: verify
                SYMBOL,
                ORDER_VOLUME,
                options={"comment": f"close_{ORDER_COMMENT}", "clientOrderId": f"{ORDER_CLIENT_ID}-close"},
            )
            log.info("[4/6] Close result: %s", json.dumps(close_result, default=str))
        else:
            log.warning("[4/6] No orderId in result — skipping close")

    except Exception:
        log.exception("[4/6] FAILED during order placement — note error for findings doc")

    # ── Section 5: Inspect terminal state / account info ─────────────────────
    log.info("\n── [5/6] Terminal state and account information ──")
    try:
        terminal_state = connection.terminal_state  # NOTE: verify attribute name
        log.info("[5/6] terminal_state.connected: %s", getattr(terminal_state, "connected", "N/A"))
        log.info("[5/6] terminal_state.account_information: %s",
                 json.dumps(getattr(terminal_state, "account_information", {}), default=str))
        log.info("[5/6] terminal_state.positions count: %d",
                 len(getattr(terminal_state, "positions", [])))
        log.info("[5/6] terminal_state.orders count: %d",
                 len(getattr(terminal_state, "orders", [])))
    except Exception:
        log.exception("[5/6] FAILED reading terminal_state")

    # ── Section 6: Reconnection / disconnect behaviour (RISK-02) ─────────────
    log.info("\n── [6/6] Reconnection behaviour — RISK-02 ──")
    log.info(
        "The TickListener.on_disconnected() and on_connected() callbacks above "
        "will log every connect/disconnect event.  To force a disconnect test: "
        "temporarily pull the network cable or kill the Wi-Fi for ~5 s and "
        "observe whether missed ticks arrive after reconnect (RISK-02 predicts "
        "they do NOT — confirm here)."
    )
    log.info("Keeping connection alive for 10 s to observe any events …")
    await asyncio.sleep(10.0)

    # ── Teardown ─────────────────────────────────────────────────────────────
    log.info("\n── Teardown ──")
    try:
        await connection.unsubscribe_from_market_data(  # NOTE: verify method name
            SYMBOL,
            [{"type": "quotes"}, {"type": "ticks"}],  # NOTE: confirm
        )
        await connection.close()  # NOTE: verify method name
    except Exception:
        log.warning("Error during teardown (non-fatal): %s", exc_info=True)

    log.info("=== PoC complete. Fill docs/metaapi-poc-findings.md with findings. ===")


def main() -> None:
    start = time.monotonic()
    try:
        asyncio.run(run_poc())
    except KeyboardInterrupt:
        log.info("Interrupted by user.")
    finally:
        elapsed = time.monotonic() - start
        log.info("Total run time: %.1f s", elapsed)


if __name__ == "__main__":
    main()
