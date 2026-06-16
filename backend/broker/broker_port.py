"""
BrokerPort — abstract broker interface.

All broker adapters (MetaAPI real, Simulado mock, future IBKR) implement
this interface so the RobotEngine is broker-agnostic.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BrokerPort(ABC):
    """Abstract interface every broker adapter must implement."""

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    @abstractmethod
    async def connect(self) -> None:
        """Authenticate and connect to the broker streaming feed."""

    @abstractmethod
    async def disconnect(self) -> None:
        """Cleanly disconnect and release resources."""

    # ── Market data ───────────────────────────────────────────────────────────

    @abstractmethod
    async def subscribe(self, symbol: str) -> None:
        """Subscribe to live tick data for the given symbol (e.g. 'WINM26')."""

    @abstractmethod
    async def unsubscribe(self, symbol: str) -> None:
        """Unsubscribe from tick data for the given symbol."""

    # ── Order management ──────────────────────────────────────────────────────

    @abstractmethod
    async def place_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """
        Place a market or limit order.

        order dict keys:
          symbol       : str   — e.g. 'WINM26'
          side         : str   — 'buy' | 'sell'
          qty          : int   — number of contracts
          sl           : float | None
          tp           : float | None
          client_id    : str   — short alphanumeric idempotency key (≤30 chars, MetaApi constraint)
          comment      : str   — human-readable label (combined with client_id must be ≤30 chars)

        Returns broker response dict (must include 'orderId').
        """

    @abstractmethod
    async def cancel_order(self, order_id: str) -> None:
        """Cancel a pending order by broker order_id."""

    @abstractmethod
    async def close_position(self, position_id: str) -> None:
        """Market-close an open position by broker position_id."""

    # ── State queries (RPC — for rehydration EXE-06) ─────────────────────────

    @abstractmethod
    async def get_positions(self) -> List[Dict[str, Any]]:
        """Return list of current open positions."""

    @abstractmethod
    async def get_orders(self) -> List[Dict[str, Any]]:
        """Return list of current pending orders."""
