"""
FillSimulator — PRD §18 RF-EXE-05 fill policies.

Three fill policies for Simulado mode (D-05/D-06):
  - Pessimista (default): worst realistic fill — buy at ask, sell at bid.
  - Moderado:             mid-price fill — (bid + ask) / 2.
  - Otimista:             best realistic fill — buy at bid, sell at ask.

The tick payload from MetaAPI contains: bid, ask, time (from docs/metaapi-poc-findings.md).
Raw ticks are never persisted (RISK-03 / Pitfall 1).

Usage:
    sim = FillSimulator(policy="pessimista")
    fill_price = sim.fill_price(tick={"bid": 127050.0, "ask": 127055.0}, side="buy")
"""
from __future__ import annotations

from typing import Any, Dict, Literal

FillPolicy = Literal["pessimista", "moderado", "otimista"]


class FillSimulator:
    """
    Simulates order fill prices per PRD §18 RF-EXE-05.

    Args:
        policy: One of 'pessimista', 'moderado', 'otimista'. Defaults to 'pessimista' (D-05).
    """

    POLICIES: tuple = ("pessimista", "moderado", "otimista")

    def __init__(self, policy: FillPolicy = "pessimista") -> None:
        if policy not in self.POLICIES:
            raise ValueError(
                f"Invalid fill policy '{policy}'. "
                f"Must be one of: {self.POLICIES}"
            )
        self.policy: FillPolicy = policy

    def fill_price(self, tick: Dict[str, Any], side: Literal["buy", "sell"]) -> float:
        """
        Compute the simulated fill price for an order given the current tick.

        Pessimista (worst fill):
          - BUY  → ask (entering at the offer — most expensive)
          - SELL → bid (exiting at the bid — least favourable)

        Moderado (mid fill):
          - BUY  → (bid + ask) / 2
          - SELL → (bid + ask) / 2

        Otimista (best fill):
          - BUY  → bid (entering at the bid — best possible)
          - SELL → ask (exiting at the offer — most favourable)

        Args:
            tick: MetatraderSymbolPrice dict with 'bid' and 'ask' keys.
            side: 'buy' or 'sell'.

        Returns:
            Simulated fill price as a float.
        """
        bid: float = float(tick["bid"])
        ask: float = float(tick["ask"])
        mid: float = (bid + ask) / 2.0

        if self.policy == "pessimista":
            return ask if side == "buy" else bid
        elif self.policy == "moderado":
            return mid
        elif self.policy == "otimista":
            return bid if side == "buy" else ask
        else:
            raise ValueError(f"Unknown policy: {self.policy}")

    def slippage(self, tick: Dict[str, Any]) -> float:
        """
        Returns the spread cost (ask - bid) as an indicator of worst-case slippage.
        Useful for risk checks before placing an order.
        """
        return float(tick["ask"]) - float(tick["bid"])
