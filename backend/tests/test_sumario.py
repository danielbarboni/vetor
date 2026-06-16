"""
test_sumario.py — Nyquist gate: SUM-01 … SUM-05

Tests for Sumário metric computation and equity series reconstruction.
Uses known fixtures — no database, no network.
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta

import pytest

from engine.metrics import (
    compute_net_return,
    compute_patrimonio,
    compute_number_of_trades,
    compute_profitable_pct,
    compute_profit_factor,
    compute_max_drawdown,
    compute_daily_balance,
    compute_equity_series,
    compute_relatorio_completo,
    compute_sumario,
)

# ─── Fixtures ──────────────────────────────────────────────────────────────────

def _dt(days_ago: int = 0, hours_ago: int = 0) -> str:
    """Return an ISO datetime string for N days/hours ago (UTC)."""
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)
    return dt.isoformat()


# Minimal filled order factory
def _order(
    result: float,
    order_class: str = "exit",
    side: str = "buy",
    filled_at: str | None = None,
    days_ago: int = 0,
) -> dict:
    return {
        "id": f"order-{result}-{days_ago}",
        "status": "filled",
        "order_class": order_class,
        "type": side,
        "result": result,
        "filled_at": filled_at or _dt(days_ago=days_ago),
        "created_at": filled_at or _dt(days_ago=days_ago),
    }


CAPITAL = 10_000.0

# Known fixture: 5 trades — 3 winners, 2 losers
ORDERS = [
    _order(result=500.0,  order_class="exit", side="buy",  days_ago=5),
    _order(result=300.0,  order_class="exit", side="sell", days_ago=4),
    _order(result=-200.0, order_class="exit", side="buy",  days_ago=3),
    _order(result=100.0,  order_class="exit", side="buy",  days_ago=2),
    _order(result=-150.0, order_class="stop", side="sell", days_ago=1),
]


# ─── test_equity_calc ─────────────────────────────────────────────────────────

def test_equity_calc():
    """
    SUM-02: Equity curve is correctly reconstructed from order history.

    Known fixture:
      capital = 10_000
      trades: +500, +300, -200, +100, -150  →  net = +550
      equity series: 10000 → 10500 → 10800 → 10600 → 10700 → 10550
    """
    series = compute_equity_series(CAPITAL, ORDERS)

    # Must have len = 1 (starting point) + 5 (one per filled order) = 6
    assert len(series) == 6, f"Expected 6 points, got {len(series)}"

    # First point = starting capital
    assert series[0][1] == CAPITAL, f"First point should be {CAPITAL}, got {series[0][1]}"

    # Final point = capital + net return
    expected_final = CAPITAL + 500 + 300 - 200 + 100 - 150  # 10550
    assert series[-1][1] == expected_final, (
        f"Final equity should be {expected_final}, got {series[-1][1]}"
    )

    # All timestamps should be in ascending order
    timestamps = [ts for ts, _ in series]
    assert timestamps == sorted(timestamps), "Equity series timestamps not sorted"

    # Intermediate values should be monotonically consistent
    assert series[1][1] == CAPITAL + 500   # after +500
    assert series[2][1] == CAPITAL + 800   # after +300
    assert series[3][1] == CAPITAL + 600   # after -200
    assert series[4][1] == CAPITAL + 700   # after +100
    assert series[5][1] == CAPITAL + 550   # after -150


def test_net_return():
    """Net return sums all filled order results."""
    assert compute_net_return(ORDERS) == 550.0


def test_patrimonio():
    """Patrimônio = capital + net return."""
    assert compute_patrimonio(CAPITAL, ORDERS) == CAPITAL + 550.0


def test_number_of_trades():
    """Number of trades = count of exit+stop filled orders."""
    assert compute_number_of_trades(ORDERS) == 5


def test_profitable_pct():
    """3 winners out of 5 = 60%."""
    pct = compute_profitable_pct(ORDERS)
    assert pct == 60.0, f"Expected 60.0, got {pct}"


def test_profit_factor():
    """Profit factor = 900 / 350 ≈ 2.57."""
    pf = compute_profit_factor(ORDERS)
    assert pf is not None
    assert abs(pf - (900.0 / 350.0)) < 0.01, f"PF mismatch: got {pf}"


def test_max_drawdown():
    """
    Max drawdown in the known fixture:
      equity: 10000 → 10500 → 10800 → 10600 → 10700 → 10550
      peak = 10800, trough after peak = 10550 → DD = 250, pct = 250/10800 ≈ 2.31%
    """
    dd = compute_max_drawdown(CAPITAL, ORDERS)
    assert dd["abs"] == 250.0, f"Expected DD 250.0, got {dd['abs']}"
    expected_pct = round(250.0 / 10800 * 100, 2)
    assert abs(dd["pct"] - expected_pct) < 0.01, f"DD pct mismatch: {dd['pct']}"


def test_daily_balance():
    """Daily balance = net P&L for the most recent date."""
    # Most recent order is 1 day ago with result = -150
    daily = compute_daily_balance(ORDERS)
    assert daily == -150.0, f"Expected -150.0, got {daily}"


def test_relatorio_completo_structure():
    """All 8 sections present in relatório completo."""
    rel = compute_relatorio_completo(CAPITAL, ORDERS)
    expected_sections = [
        "conta", "retorno", "risco", "resumo_trades",
        "trades_lucro", "trades_prejuizo", "trades_comprados", "trades_vendidos",
    ]
    for section in expected_sections:
        assert section in rel, f"Section '{section}' missing from relatório"


def test_relatorio_conta():
    """Conta section has correct values."""
    rel = compute_relatorio_completo(CAPITAL, ORDERS)
    conta = rel["conta"]
    assert conta["capital_inicial"] == CAPITAL
    assert conta["retorno_liquido"] == 550.0
    assert conta["patrimonio_final"] == CAPITAL + 550.0


def test_relatorio_risco():
    """Risco section contains drawdown."""
    rel = compute_relatorio_completo(CAPITAL, ORDERS)
    risco = rel["risco"]
    assert "drawdown_maximo_r" in risco
    assert risco["drawdown_maximo_r"] == 250.0


def test_sumario_aggregate():
    """compute_sumario returns all top-level keys."""
    s = compute_sumario(CAPITAL, ORDERS)
    for key in ("net_return", "patrimonio", "max_drawdown", "number_of_trades",
                "profitable_pct", "profit_factor", "daily_balance", "relatorio"):
        assert key in s, f"Key '{key}' missing from sumario"


def test_equity_empty_orders():
    """Empty orders → flat line at capital (1 point)."""
    series = compute_equity_series(CAPITAL, [])
    assert len(series) == 1
    assert series[0][1] == CAPITAL


def test_equity_with_open_position():
    """open_position_mark appends a final mark-to-market point."""
    series = compute_equity_series(CAPITAL, ORDERS, open_position_mark=200.0)
    # 6 points from orders + 1 mark point = 7
    assert len(series) == 7
    final_equity = CAPITAL + 550.0 + 200.0
    assert series[-1][1] == final_equity


def test_main_imports():
    """Sumário router is wired into main.py."""
    import main  # noqa: F401  — just ensure it imports without error
    assert hasattr(main, "app")
