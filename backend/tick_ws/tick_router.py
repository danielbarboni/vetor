"""
TickRouter — routes incoming ticks to subscribed robots and WS clients.

Pattern 2 from RESEARCH: TickRouter maps symbol → set of (user_id, robot_id)
so a single tick from the shared MetaAPI account fans out to every robot
subscribed to that symbol, AND to the user's WebSocket.

All state keyed by (user_id, robot_id) to support multi-tenant isolation (Pitfall 3).
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Callable, Dict, Set, Tuple

logger = logging.getLogger(__name__)

# Callback type: called with (user_id, robot_id, tick_data)
TickCallback = Callable[[str, str, Dict[str, Any]], None]


class TickRouter:
    """
    Routes ticks from broker to per-robot strategy callbacks and WS clients.

    Usage:
        router = TickRouter(ws_manager)
        router.subscribe("WINM26", user_id, robot_id, strategy_callback)
        router.dispatch("WINM26", tick_data)          # called by broker adapter
        router.unsubscribe("WINM26", user_id, robot_id)
    """

    def __init__(self, ws_manager: Any) -> None:
        self._ws_manager = ws_manager
        # symbol → set of (user_id, robot_id)
        self._subscriptions: Dict[str, Set[Tuple[str, str]]] = {}
        # (user_id, robot_id) → callback
        self._callbacks: Dict[Tuple[str, str], TickCallback] = {}

    def subscribe(
        self,
        symbol: str,
        user_id: str,
        robot_id: str,
        callback: TickCallback,
    ) -> None:
        """Subscribe robot to ticks for the given symbol."""
        key = (user_id, robot_id)
        if symbol not in self._subscriptions:
            self._subscriptions[symbol] = set()
        self._subscriptions[symbol].add(key)
        self._callbacks[key] = callback
        logger.info("TickRouter: subscribed %s/%s to %s", user_id, robot_id, symbol)

    def unsubscribe(self, symbol: str, user_id: str, robot_id: str) -> None:
        """Remove subscription for robot from symbol."""
        key = (user_id, robot_id)
        if symbol in self._subscriptions:
            self._subscriptions[symbol].discard(key)
        self._callbacks.pop(key, None)
        logger.info("TickRouter: unsubscribed %s/%s from %s", user_id, robot_id, symbol)

    def dispatch(self, symbol: str, tick_data: Dict[str, Any]) -> None:
        """
        Dispatch an incoming tick to all subscribers for this symbol.

        Called synchronously from the MetaAPI listener thread/callback.
        Fires and forgets async WS sends via asyncio.create_task.
        """
        subscribers = self._subscriptions.get(symbol, set())
        for user_id, robot_id in subscribers:
            # Strategy callback (synchronous, called inline)
            cb = self._callbacks.get((user_id, robot_id))
            if cb:
                try:
                    cb(user_id, robot_id, tick_data)
                except Exception as exc:
                    logger.error(
                        "TickRouter: strategy callback error for %s/%s: %s",
                        user_id, robot_id, exc,
                    )
            # WS fan-out (async — schedule in the running event loop)
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.ensure_future(
                        self._ws_manager.send_tick(user_id, robot_id, tick_data)
                    )
            except RuntimeError:
                pass  # No running loop (tests/import time)

    def subscribed_symbols(self, user_id: str, robot_id: str) -> list[str]:
        """Return all symbols the robot is subscribed to."""
        key = (user_id, robot_id)
        return [sym for sym, keys in self._subscriptions.items() if key in keys]
