"""
WebSocket ConnectionManager — D-01 / D-04.

One WebSocket connection per user at /ws/{user_id}.
Ticks and engine events are multiplexed into a single WS with a robot_id envelope.

All in-memory state keyed by user_id (Pitfall 3).
"""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# Rate-limit: max messages per second per user (DoS protection)
_MAX_SEND_RATE = 100  # not enforced per-tick here — broker ring buffer handles volume


class ConnectionManager:
    """
    Manages one active WebSocket per user_id.

    Usage:
        manager = ConnectionManager()
        await manager.connect(user_id, websocket)
        await manager.send_tick(user_id, robot_id, tick_data)
        manager.disconnect(user_id)
    """

    def __init__(self) -> None:
        # user_id → WebSocket (one WS per user, Pitfall 3)
        self._connections: Dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        """Accept and register the WebSocket for user_id. Replaces any existing connection."""
        await websocket.accept()
        # Replace stale connection if exists
        if user_id in self._connections:
            old = self._connections[user_id]
            try:
                await old.close()
            except Exception:
                pass
        self._connections[user_id] = websocket
        logger.info("WS connected: user=%s", user_id)

    def disconnect(self, user_id: str) -> None:
        """Remove the WebSocket registration for user_id."""
        self._connections.pop(user_id, None)
        logger.info("WS disconnected: user=%s", user_id)

    async def send_tick(
        self, user_id: str, robot_id: str, tick_data: Dict[str, Any]
    ) -> None:
        """
        Send a tick to the user's WebSocket with a robot_id envelope (D-04).

        Message format:
          {"type": "tick", "robot_id": "<uuid>", "data": {<tick fields>}}
        """
        ws = self._connections.get(user_id)
        if ws is None:
            return
        envelope = {"type": "tick", "robot_id": robot_id, "data": tick_data}
        try:
            await ws.send_text(json.dumps(envelope, default=str))
        except Exception as exc:
            logger.warning("WS send failed for user=%s: %s", user_id, exc)
            self.disconnect(user_id)

    async def send_event(
        self, user_id: str, robot_id: str, event_type: str, payload: Dict[str, Any]
    ) -> None:
        """
        Send a non-tick event (status change, order fill, error) to the user's WS.

        Message format:
          {"type": "<event_type>", "robot_id": "<uuid>", "data": {<payload>}}
        """
        ws = self._connections.get(user_id)
        if ws is None:
            return
        envelope = {"type": event_type, "robot_id": robot_id, "data": payload}
        try:
            await ws.send_text(json.dumps(envelope, default=str))
        except Exception as exc:
            logger.warning("WS event send failed for user=%s: %s", user_id, exc)
            self.disconnect(user_id)

    def is_connected(self, user_id: str) -> bool:
        return user_id in self._connections

    @property
    def active_users(self) -> list[str]:
        return list(self._connections.keys())


# Module-level singleton used by the FastAPI app
manager = ConnectionManager()
