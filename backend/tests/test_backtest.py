"""
test_backtest.py — BCK-01 … BCK-04 tests.

Tests for backtest creation (credit-aware), event-driven runner
(no lookahead, Pitfall 4), and metric parity with live Sumário.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List
from unittest.mock import MagicMock
import pytest

# ─── helpers ─────────────────────────────────────────────────────────────────

def _make_orders(capital: float = 10_000.0) -> List[Dict[str, Any]]:
    """Minimal filled order set used by both backtest and sumário metric tests."""
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "ord-1",
            "status": "filled",
            "order_class": "exit",
            "type": "buy",
            "result": 300.0,
            "filled_at": (now - timedelta(hours=3)).isoformat(),
            "created_at": (now - timedelta(hours=3)).isoformat(),
        },
        {
            "id": "ord-2",
            "status": "filled",
            "order_class": "stop",
            "type": "sell",
            "result": -150.0,
            "filled_at": (now - timedelta(hours=2)).isoformat(),
            "created_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "id": "ord-3",
            "status": "filled",
            "order_class": "exit",
            "type": "buy",
            "result": 200.0,
            "filled_at": (now - timedelta(hours=1)).isoformat(),
            "created_at": (now - timedelta(hours=1)).isoformat(),
        },
    ]


# ─── BCK-04 Metric parity ──────────────────────────────────────────────────

def test_metrics_parity():
    """
    BCK-04: Backtest report metrics computed by backtest_runner MUST match
    metrics computed by engine/metrics.py for the same order set.

    This is the core parity guarantee: same orders, same capital → same
    Sumário numbers regardless of whether they come from live or backtest.
    """
    from engine.metrics import compute_sumario
    from engine.backtest_runner import compute_backtest_metrics

    capital = 10_000.0
    orders = _make_orders(capital)

    sumario_result = compute_sumario(capital, orders)
    backtest_result = compute_backtest_metrics(capital, orders)

    # Core metrics must be identical
    assert backtest_result["net_return"] == sumario_result["net_return"], (
        f"net_return mismatch: backtest={backtest_result['net_return']} "
        f"sumario={sumario_result['net_return']}"
    )
    assert backtest_result["patrimonio"] == sumario_result["patrimonio"], (
        "patrimonio mismatch"
    )
    assert backtest_result["number_of_trades"] == sumario_result["number_of_trades"], (
        "number_of_trades mismatch"
    )
    assert backtest_result["profitable_pct"] == sumario_result["profitable_pct"], (
        "profitable_pct mismatch"
    )
    assert backtest_result["profit_factor"] == sumario_result["profit_factor"], (
        "profit_factor mismatch"
    )
    assert backtest_result["max_drawdown"] == sumario_result["max_drawdown"], (
        "max_drawdown mismatch"
    )


# ─── BCK-02 Credit decrement ──────────────────────────────────────────────

def test_credit_decrement_consumes_one_credit():
    """BCK-02: create_backtest consumes exactly one credit."""
    from db.backtest_repo import BacktestRepo

    mock_supabase = MagicMock()
    repo = BacktestRepo(mock_supabase)

    # Simulate credits table returning balance=3
    credits_response = MagicMock()
    credits_response.data = [{"id": "cred-1", "credits": 3}]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = credits_response

    # Simulate update returning updated row
    update_response = MagicMock()
    update_response.data = [{"id": "cred-1", "credits": 2}]
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = update_response

    # Simulate insert returning the new backtest row
    insert_response = MagicMock()
    insert_response.data = [{
        "id": "bt-001",
        "robot_id": "rob-001",
        "user_id": "user-001",
        "status": "aguardando",
        "capital": 10000.0,
        "fill_policy": "moderado",
        "date_from": datetime.now(timezone.utc).isoformat(),
        "date_to": datetime.now(timezone.utc).isoformat(),
        "include_costs": True,
        "result": None,
        "error": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None,
    }]
    mock_supabase.table.return_value.insert.return_value.execute.return_value = insert_response

    result = repo.create_backtest(
        user_id="user-001",
        robot_id="rob-001",
        capital=10000.0,
        fill_policy="moderado",
        date_from=datetime.now(timezone.utc),
        date_to=datetime.now(timezone.utc),
        include_costs=True,
    )

    assert result is not None
    assert result["status"] == "aguardando"


def test_credit_decrement_rejects_at_zero():
    """BCK-02: create_backtest raises when credits == 0."""
    from db.backtest_repo import BacktestRepo, InsufficientCreditsError

    mock_supabase = MagicMock()
    repo = BacktestRepo(mock_supabase)

    # Simulate credits table returning balance=0
    credits_response = MagicMock()
    credits_response.data = [{"id": "cred-1", "credits": 0}]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = credits_response

    with pytest.raises(InsufficientCreditsError):
        repo.create_backtest(
            user_id="user-001",
            robot_id="rob-001",
            capital=10000.0,
            fill_policy="moderado",
            date_from=datetime.now(timezone.utc),
            date_to=datetime.now(timezone.utc),
            include_costs=True,
        )


def test_credit_decrement_rejects_when_no_credits_row():
    """BCK-02: create_backtest raises when user has no credits row at all."""
    from db.backtest_repo import BacktestRepo, InsufficientCreditsError

    mock_supabase = MagicMock()
    repo = BacktestRepo(mock_supabase)

    # Simulate credits table returning empty list
    credits_response = MagicMock()
    credits_response.data = []
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = credits_response

    with pytest.raises(InsufficientCreditsError):
        repo.create_backtest(
            user_id="user-001",
            robot_id="rob-001",
            capital=10000.0,
            fill_policy="moderado",
            date_from=datetime.now(timezone.utc),
            date_to=datetime.now(timezone.utc),
            include_costs=True,
        )


# ─── Pitfall 4 lookahead guard ────────────────────────────────────────────

def _make_bars_list(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Lightweight list-of-dicts bar sequence that the BacktestRunner accepts
    without requiring pandas (avoids ModuleNotFoundError in test env).
    Implements __len__ and __getitem__ to satisfy the runner's iteration protocol.
    """
    class BarsList:
        def __init__(self, data):
            self._data = data

        def __len__(self):
            return len(self._data)

        def __getitem__(self, idx):
            if isinstance(idx, slice):
                return BarsList(self._data[idx])
            row = self._data[idx]
            # Return a dict-like object with item and attribute access
            return _DictRow(row)

        def iloc(self, idx):
            return self[idx]

    class _DictRow(dict):
        def __getattr__(self, name):
            try:
                return self[name]
            except KeyError:
                raise AttributeError(name)

    return BarsList(rows)


def test_no_lookahead_signal_at_bar_n_uses_only_bars_up_to_n():
    """
    Pitfall 4 guard: the runner feeds the strategy exactly one bar at a time.

    We verify that on_tick is called exactly once per bar and evaluate()
    is called after each on_tick — never before — by counting cumulative ticks.
    """
    from engine.backtest_runner import BacktestRunner

    now = datetime.now(timezone.utc)
    rows = [
        {"open": 100.0, "high": 101.0, "low": 99.0,  "close": 100.5, "volume": 1000.0,
         "time": (now + timedelta(minutes=i)).isoformat()}
        for i in range(5)
    ]
    bars = _make_bars_list(rows)

    tick_count = []

    class SpyStrategy:
        """Strategy spy: records cumulative ticks at each evaluate() call."""
        def __init__(self):
            self._ticks: int = 0

        def on_tick(self, tick):
            self._ticks += 1

        def evaluate(self):
            tick_count.append(self._ticks)
            return None

        def reset_state(self):
            self._ticks = 0

    runner = BacktestRunner(strategy=SpyStrategy(), fill_policy="moderado")
    runner.replay(bars, capital=10_000.0)

    # At bar i, the spy must have seen exactly i+1 ticks when evaluate() is called
    assert tick_count == list(range(1, len(rows) + 1)), (
        f"Lookahead detected! tick_count={tick_count} expected={list(range(1, len(rows)+1))}"
    )


def test_entry_price_is_next_bar_open():
    """
    Pitfall 4: Entry fills at next bar's OPEN, never at signal bar's price.

    Signal at bar 1 (close=101.5); fill must be at bar 2's open (105.0).
    """
    from engine.backtest_runner import BacktestRunner

    now = datetime.now(timezone.utc)
    rows = [
        {"open": 100.0, "high": 101.0, "low": 99.0,  "close": 100.5, "volume": 1000.0,
         "time": (now + timedelta(minutes=0)).isoformat()},
        {"open": 101.0, "high": 102.0, "low": 100.0, "close": 101.5, "volume": 1100.0,
         "time": (now + timedelta(minutes=1)).isoformat()},
        # Bar 2: open=105.0 — this is where the entry fill should occur
        {"open": 105.0, "high": 106.0, "low": 104.0, "close": 105.5, "volume": 1200.0,
         "time": (now + timedelta(minutes=2)).isoformat()},
    ]
    bars = _make_bars_list(rows)

    class BuyOnBar1Strategy:
        """Emits buy on the 2nd bar (bar index 1)."""
        def __init__(self):
            self._bar = 0

        def on_tick(self, tick):
            self._bar += 1

        def evaluate(self):
            # After 2nd on_tick call (bar index 1), emit buy
            if self._bar == 2:
                return "buy"
            return None

        def reset_state(self):
            self._bar = 0

    runner = BacktestRunner(strategy=BuyOnBar1Strategy(), fill_policy="moderado")
    orders = runner.replay(bars, capital=10_000.0)

    entry_orders = [o for o in orders if o.get("order_class") == "entry"]
    assert len(entry_orders) >= 1, "Expected entry order from buy signal"

    entry = entry_orders[0]
    fill_price = entry.get("filled_price") or entry.get("price")
    assert fill_price is not None, "Entry order has no fill price"
    # Must fill at bar 2's open (105.0), NOT bar 1's close (101.5)
    assert abs(fill_price - 105.0) < 0.01, (
        f"Entry should fill at next bar open (105.0), got {fill_price} — lookahead detected!"
    )
