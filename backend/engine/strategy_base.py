"""
StrategyBase — abstract base for all trading strategies.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, Literal

Signal = Literal["buy", "sell", None]


class StrategyBase(ABC):
    """
    Abstract strategy interface.

    Each strategy receives ticks incrementally via on_tick(), computes its
    indicators in-memory (no future data — Pitfall 4), and emits buy/sell/None
    via evaluate(). reset_state() clears all in-memory indicator state (RISK-02).
    """

    @abstractmethod
    def on_tick(self, tick: Dict[str, Any]) -> None:
        """
        Process an incoming tick and update internal indicator state.
        tick has keys: symbol, bid, ask, time, broker_time, equity.
        """

    @abstractmethod
    def evaluate(self) -> Signal:
        """
        Return 'buy', 'sell', or None based on current indicator state.
        Called after on_tick() to decide if a signal should be emitted.
        """

    @abstractmethod
    def reset_state(self) -> None:
        """
        Clear all in-memory indicator state.
        Called on broker reconnect (RISK-02) to avoid stale state.
        """
