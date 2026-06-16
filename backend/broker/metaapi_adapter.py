"""
MetaAPIAdapter — BrokerPort implementation for MetaAPI v29.

Built against the confirmed v29.1.1 API surface from docs/metaapi-poc-findings.md.
One streaming connection serves the system account (Simulado D-06).
"""
from __future__ import annotations

import asyncio
import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

from broker.broker_port import BrokerPort

logger = logging.getLogger(__name__)

# ── Sentinel: max seconds without a tick before halting orders ────────────────
STALENESS_TIMEOUT_S = 10

# ── Per-symbol ring buffer capacity ───────────────────────────────────────────
RING_BUFFER_MAXLEN = 3600


# ── SynchronizationListener subclass ──────────────────────────────────────────
# MUST subclass SynchronizationListener — standalone raises AttributeError on
# every un-overridden callback (confirmed in PoC findings, RISK-02).

try:
    from metaapi_cloud_sdk import MetaApi, SynchronizationListener  # type: ignore

    _METAAPI_AVAILABLE = True
except ImportError:
    # Allows import in test environments without the SDK installed.
    MetaApi = None  # type: ignore
    SynchronizationListener = object  # type: ignore
    _METAAPI_AVAILABLE = False


class _TickListener(SynchronizationListener):
    """
    Per-symbol tick listener.

    Subclasses SynchronizationListener to receive the no-op defaults for
    the ~30 callbacks we don't care about (avoiding AttributeError storms).
    Overrides only the callbacks we handle.
    """

    def __init__(
        self,
        symbol: str,
        ring_buffer: deque,
        on_tick_cb: Callable[[str, Dict[str, Any]], None],
        on_connected_cb: Callable[[], None],
        on_disconnected_cb: Callable[[], None],
    ) -> None:
        self.symbol = symbol
        self._ring = ring_buffer
        self._on_tick = on_tick_cb
        self._on_connected = on_connected_cb
        self._on_disconnected = on_disconnected_cb

    async def on_symbol_price_updated(
        self, instance_index: str, price: Any
    ) -> None:
        """Called on each tick for the subscribed symbol."""
        tick = {
            "symbol": getattr(price, "symbol", self.symbol),
            "bid": getattr(price, "bid", None),
            "ask": getattr(price, "ask", None),
            "time": getattr(price, "time", datetime.now(timezone.utc)),
            "broker_time": getattr(price, "brokerTime", None),
            "equity": getattr(price, "equity", None),
        }
        # Ring buffer: raw ticks are NEVER written to Supabase (Pitfall 1 / RISK-03)
        self._ring.append(tick)
        self._on_tick(self.symbol, tick)

    async def on_connected(self, instance_index: str, replicas: int) -> None:
        """Broker reconnected — notify adapter to reset strategy state (RISK-02)."""
        logger.info("MetaAPI connected (instance=%s, replicas=%d)", instance_index, replicas)
        self._on_connected()

    async def on_disconnected(self, instance_index: str) -> None:
        """Broker disconnected — halt order placement (RISK-02)."""
        logger.warning("MetaAPI disconnected (instance=%s)", instance_index)
        self._on_disconnected()

    async def on_synchronization_started(self, instance_index: str, **kwargs: Any) -> None:
        """Re-sync started after reconnect — treat same as connected (RISK-02)."""
        logger.info("MetaAPI sync started (instance=%s)", instance_index)
        self._on_connected()


class MetaAPIAdapter(BrokerPort):
    """
    Production BrokerPort backed by MetaAPI v29 streaming + RPC.

    Usage (Simulado / system account, D-06):
        adapter = MetaAPIAdapter(token=settings.METAAPI_TOKEN,
                                 account_id=settings.METAAPI_SYSTEM_ACCOUNT_ID)
        await adapter.connect()
        await adapter.subscribe("WINM26")
        adapter.on_tick = my_handler
        ...
        await adapter.disconnect()
    """

    def __init__(self, token: str, account_id: str) -> None:
        self._token = token
        self._account_id = account_id
        self._api: Any = None
        self._account: Any = None
        self._streaming_conn: Any = None
        self._rpc_conn: Any = None
        self._connected = False
        self._halted = False  # set True when staleness or disconnect fires

        # symbol → ring buffer (raw ticks, in-memory only)
        self._buffers: Dict[str, deque] = {}
        # symbol → last tick timestamp (for staleness sentinel)
        self._last_tick_ts: Dict[str, float] = {}
        # External on_tick callback set by RobotEngine
        self.on_tick: Callable[[str, Dict[str, Any]], None] = lambda s, t: None
        # Reconnect callbacks (set by RobotEngine so it can reset strategy state)
        self.on_reconnect: Callable[[], None] = lambda: None
        self.on_disconnect: Callable[[], None] = lambda: None

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def connect(self) -> None:
        if not _METAAPI_AVAILABLE:
            raise RuntimeError(
                "metaapi-cloud-sdk not installed. "
                "Run: pip install metaapi-cloud-sdk==29.1.1"
            )
        logger.info("MetaAPIAdapter: connecting account %s", self._account_id)
        self._api = MetaApi(self._token)
        self._account = await self._api.metatrader_account_api.get_account(self._account_id)

        # Deploy if not already running (requires MetaApi balance)
        if self._account.state not in ("DEPLOYED", "DEPLOYING"):
            await self._account.deploy()
        await self._account.wait_deployed()
        await self._account.wait_connected()

        # Streaming connection for ticks
        self._streaming_conn = self._account.get_streaming_connection()
        await self._streaming_conn.connect()
        await self._streaming_conn.wait_synchronized()

        # RPC connection for state queries (positions/orders rehydration)
        self._rpc_conn = self._account.get_rpc_connection()
        await self._rpc_conn.connect()
        await self._rpc_conn.wait_synchronized()

        self._connected = True
        self._halted = False
        logger.info("MetaAPIAdapter: connected and synchronized")

    async def disconnect(self) -> None:
        self._connected = False
        if self._streaming_conn:
            try:
                await self._streaming_conn.close()
            except Exception:
                pass
        if self._rpc_conn:
            try:
                await self._rpc_conn.close()
            except Exception:
                pass
        logger.info("MetaAPIAdapter: disconnected")

    # ── Market data ───────────────────────────────────────────────────────────

    async def subscribe(self, symbol: str) -> None:
        if not self._streaming_conn:
            raise RuntimeError("Not connected — call connect() first")

        if symbol not in self._buffers:
            self._buffers[symbol] = deque(maxlen=RING_BUFFER_MAXLEN)

        ring = self._buffers[symbol]
        listener = _TickListener(
            symbol=symbol,
            ring_buffer=ring,
            on_tick_cb=self._handle_tick,
            on_connected_cb=self._handle_reconnect,
            on_disconnected_cb=self._handle_disconnect,
        )
        self._streaming_conn.add_synchronization_listener(listener)
        await self._streaming_conn.subscribe_to_market_data(
            symbol,
            [{"type": "quotes"}, {"type": "ticks"}],
        )
        logger.info("MetaAPIAdapter: subscribed to %s", symbol)

    async def unsubscribe(self, symbol: str) -> None:
        if self._streaming_conn:
            try:
                await self._streaming_conn.unsubscribe_from_market_data(symbol, [{"type": "quotes"}, {"type": "ticks"}])
            except Exception as exc:
                logger.warning("unsubscribe %s failed: %s", symbol, exc)

    # ── Order management ──────────────────────────────────────────────────────

    def _check_staleness(self, symbol: str) -> None:
        """Raise if the symbol has not received a tick in STALENESS_TIMEOUT_S seconds."""
        import time
        last = self._last_tick_ts.get(symbol, 0)
        age = time.monotonic() - last if last else float("inf")
        if age > STALENESS_TIMEOUT_S:
            raise RuntimeError(
                f"Staleness sentinel: no tick for '{symbol}' in {age:.1f}s — order halted"
            )

    async def place_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        if self._halted:
            raise RuntimeError("Adapter halted (disconnected) — cannot place order")
        symbol = order["symbol"]
        self._check_staleness(symbol)

        side = order["side"]
        qty = float(order["qty"])
        sl = order.get("sl") or 0.0
        tp = order.get("tp") or 0.0
        # clientId: ≤30 chars, alphanumeric — use short derived id from caller
        client_id = str(order.get("client_id", ""))[:30]
        comment = str(order.get("comment", ""))

        # combined comment+clientId ≤ 30 chars (MetaApi constraint from PoC findings)
        options: Dict[str, Any] = {}
        if client_id:
            options["clientId"] = client_id
        if comment:
            # Truncate combined to stay within 30-char constraint
            max_comment = max(0, 30 - len(client_id) - 1)
            options["comment"] = comment[:max_comment] if max_comment > 0 else ""

        conn = self._streaming_conn
        if side == "buy":
            resp = await conn.create_market_buy_order(symbol, qty, sl, tp, options)
        elif side == "sell":
            resp = await conn.create_market_sell_order(symbol, qty, sl, tp, options)
        else:
            raise ValueError(f"Unknown order side: {side!r}")

        return {"orderId": getattr(resp, "orderId", None), "raw": resp}

    async def cancel_order(self, order_id: str) -> None:
        if self._streaming_conn:
            await self._streaming_conn.cancel_order(order_id)

    async def close_position(self, position_id: str) -> None:
        if self._streaming_conn:
            await self._streaming_conn.close_position(position_id, {})

    # ── State queries ─────────────────────────────────────────────────────────

    async def get_positions(self) -> List[Dict[str, Any]]:
        if self._rpc_conn:
            return await self._rpc_conn.get_positions() or []
        return []

    async def get_orders(self) -> List[Dict[str, Any]]:
        if self._rpc_conn:
            return await self._rpc_conn.get_orders() or []
        return []

    # ── Internal tick/reconnect handlers ──────────────────────────────────────

    def _handle_tick(self, symbol: str, tick: Dict[str, Any]) -> None:
        import time
        self._last_tick_ts[symbol] = time.monotonic()
        self._halted = False
        self.on_tick(symbol, tick)

    def _handle_reconnect(self) -> None:
        """Called on connected / sync_started — reset strategy state (RISK-02)."""
        self._halted = False
        self.on_reconnect()

    def _handle_disconnect(self) -> None:
        """Called on disconnected — halt order placement (RISK-02)."""
        self._halted = True
        self.on_disconnect()

    # ── Ring buffer access (for strategy incremental computation) ─────────────

    def get_ring_buffer(self, symbol: str) -> deque:
        """Return the in-memory ring buffer for the given symbol."""
        return self._buffers.get(symbol, deque(maxlen=RING_BUFFER_MAXLEN))
