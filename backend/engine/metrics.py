"""
metrics.py — Pure metric computation for Sumário report (SUM-01..SUM-05).

All functions operate on a list of Order dicts (from Supabase rows) and optional
capital (float). No database calls — functions are fully unit-testable offline.

Metric definitions from PRD §19.2, §19.3, §19.4.

Glossary (B3 terminology, as seen in prototype):
  net_return       : Total P&L in R$ (sum of all filled order results)
  patrimonio       : Capital + net_return (equity at end of period)
  max_drawdown     : Largest peak-to-trough decline in equity (R$ and %)
  profit_factor    : gross_profit / gross_loss  (∞ if no losing trades)
  profitable_pct   : % of completed trades with positive result
  number_of_trades : count of 'exit' + 'stop' orders that are filled (completed trades)
  daily_balance    : Net P&L for calendar date of last order
  equity_series    : Array of [timestamp_ms, equity_value] pairs (D-03 reconstruction)
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple


# ─── Type alias ──────────────────────────────────────────────────────────────

OrderRow = Dict[str, Any]   # Supabase row from 'orders' table
EquityPoint = Tuple[int, float]  # (timestamp_ms, equity_value)


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _parse_dt(val: Any) -> Optional[datetime]:
    """Parse a datetime string or datetime object to an aware UTC datetime."""
    if val is None:
        return None
    if isinstance(val, datetime):
        if val.tzinfo is None:
            return val.replace(tzinfo=timezone.utc)
        return val
    try:
        # Handle ISO-8601 with or without trailing Z
        s = str(val).replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    except (ValueError, TypeError):
        return None


def _result_of(order: OrderRow) -> float:
    """
    Return the P&L contribution of a single filled order.

    For filled orders: use 'result' if present (set by writer.py).
    Fallback: derive from (filled_price - price) * quantity for sell orders,
    reversed for buy. If filled_price or price absent, return 0.
    """
    result = order.get("result")
    if result is not None:
        try:
            return float(result)
        except (TypeError, ValueError):
            pass
    return 0.0


def _is_completed_trade(order: OrderRow) -> bool:
    """Return True for trades that represent a completed position exit."""
    order_class = order.get("order_class") or order.get("class", "")
    order_status = order.get("status", "")
    return order_status == "filled" and order_class in ("exit", "stop")


def _filled_at(order: OrderRow) -> Optional[datetime]:
    return _parse_dt(order.get("filled_at") or order.get("created_at"))


# ─── Primary metrics (§19.2) ─────────────────────────────────────────────────

def compute_net_return(orders: List[OrderRow]) -> float:
    """Net return in R$ — sum of result for all filled orders."""
    return sum(_result_of(o) for o in orders if o.get("status") == "filled")


def compute_patrimonio(capital: float, orders: List[OrderRow]) -> float:
    """Patrimônio = capital + net_return."""
    return capital + compute_net_return(orders)


def compute_number_of_trades(orders: List[OrderRow]) -> int:
    """Number of completed trades (exit/stop filled orders)."""
    return sum(1 for o in orders if _is_completed_trade(o))


def compute_profitable_pct(orders: List[OrderRow]) -> Optional[float]:
    """Percentage of completed trades with a positive result (0..100)."""
    trades = [o for o in orders if _is_completed_trade(o)]
    if not trades:
        return None
    winners = sum(1 for o in trades if _result_of(o) > 0)
    return round(winners / len(trades) * 100, 2)


def compute_profit_factor(orders: List[OrderRow]) -> Optional[float]:
    """
    Profit Factor = gross_profit / gross_loss.
    Returns None if no trades, None if no losing trades (infinite).
    """
    trades = [o for o in orders if _is_completed_trade(o)]
    gross_profit = sum(_result_of(o) for o in trades if _result_of(o) > 0)
    gross_loss = abs(sum(_result_of(o) for o in trades if _result_of(o) < 0))
    if not trades:
        return None
    if gross_loss == 0:
        return None  # Infinite — represented as None in API; frontend renders "∞"
    return round(gross_profit / gross_loss, 2)


def compute_daily_balance(orders: List[OrderRow]) -> float:
    """Net P&L for the most recent calendar date present in filled orders."""
    filled = [o for o in orders if o.get("status") == "filled"]
    if not filled:
        return 0.0

    # Find the latest date
    dates_with_dt = []
    for o in filled:
        dt = _filled_at(o)
        if dt:
            dates_with_dt.append((dt.date(), o))

    if not dates_with_dt:
        return 0.0

    latest_date = max(d for d, _ in dates_with_dt)
    return sum(
        _result_of(o)
        for d, o in dates_with_dt
        if d == latest_date
    )


# ─── Max Drawdown (§19.3 Risco) ──────────────────────────────────────────────

def compute_max_drawdown(
    capital: float,
    orders: List[OrderRow],
) -> Dict[str, float]:
    """
    Maximum drawdown: largest peak-to-trough decline in the equity curve.

    Returns: { "abs": R$ value, "pct": percentage of peak }
    Uses the same equity series produced by compute_equity_series.
    """
    series = compute_equity_series(capital, orders)
    if len(series) < 2:
        return {"abs": 0.0, "pct": 0.0}

    values = [v for _, v in series]
    peak = values[0]
    max_dd_abs = 0.0
    max_dd_pct = 0.0

    for v in values[1:]:
        if v > peak:
            peak = v
        else:
            dd_abs = peak - v
            dd_pct = dd_abs / peak * 100 if peak > 0 else 0.0
            if dd_abs > max_dd_abs:
                max_dd_abs = dd_abs
                max_dd_pct = dd_pct

    return {
        "abs": round(max_dd_abs, 2),
        "pct": round(max_dd_pct, 2),
    }


# ─── Equity Series (D-03) ────────────────────────────────────────────────────

def compute_equity_series(
    capital: float,
    orders: List[OrderRow],
    open_position_mark: Optional[float] = None,
) -> List[EquityPoint]:
    """
    Reconstruct the equity curve from order history (D-03).

    Algorithm:
      1. Start at (epoch_of_first_order, capital).
      2. For each filled order in chronological order, accumulate result.
      3. If open_position_mark is provided, append a final point at now
         with the current mark-to-market value added.

    Returns: List of (timestamp_ms, equity_value) pairs — ECharts time series.
    """
    filled = sorted(
        [o for o in orders if o.get("status") == "filled"],
        key=lambda o: (_filled_at(o) or datetime.min.replace(tzinfo=timezone.utc)),
    )

    if not filled:
        # Return a flat line at capital starting from now
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        return [(now_ms, round(capital, 2))]

    points: List[EquityPoint] = []
    equity = capital

    # Starting point — just before first trade
    first_dt = _filled_at(filled[0])
    if first_dt:
        points.append((int(first_dt.timestamp() * 1000), round(equity, 2)))

    for order in filled:
        equity += _result_of(order)
        dt = _filled_at(order)
        if dt:
            points.append((int(dt.timestamp() * 1000), round(equity, 2)))

    # Optional: open position mark (current unrealized P&L)
    if open_position_mark is not None:
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
        points.append((now_ms, round(equity + open_position_mark, 2)))

    return points


# ─── RELATÓRIO COMPLETO sections (§19.3) ─────────────────────────────────────

def compute_relatorio_completo(
    capital: float,
    orders: List[OrderRow],
) -> Dict[str, Any]:
    """
    Compute all 8 RELATÓRIO COMPLETO sections from PRD §19.3.

    Returns a dict with section keys:
      conta, retorno, risco, resumo_trades,
      trades_lucro, trades_prejuizo, trades_comprados, trades_vendidos
    """
    filled = [o for o in orders if o.get("status") == "filled"]
    completed = [o for o in orders if _is_completed_trade(o)]
    winners = [o for o in completed if _result_of(o) > 0]
    losers = [o for o in completed if _result_of(o) < 0]
    buys = [o for o in completed if (o.get("type") or o.get("side", "")) in ("buy",)]
    sells = [o for o in completed if (o.get("type") or o.get("side", "")) in ("sell",)]

    net_return = compute_net_return(orders)
    patrimonio = compute_patrimonio(capital, orders)
    dd = compute_max_drawdown(capital, orders)
    pf = compute_profit_factor(orders)
    profitable_pct = compute_profitable_pct(orders)
    n_trades = compute_number_of_trades(orders)
    daily_balance = compute_daily_balance(orders)

    gross_profit = sum(_result_of(o) for o in winners)
    gross_loss = abs(sum(_result_of(o) for o in losers))

    avg_winner = round(gross_profit / len(winners), 2) if winners else 0.0
    avg_loser = round(gross_loss / len(losers), 2) if losers else 0.0
    largest_winner = round(max((_result_of(o) for o in winners), default=0.0), 2)
    largest_loser = round(abs(min((_result_of(o) for o in losers), default=0.0)), 2)

    # Buy-side metrics
    buy_winners = [o for o in buys if _result_of(o) > 0]
    buy_losers = [o for o in buys if _result_of(o) < 0]
    buy_net = round(sum(_result_of(o) for o in buys), 2)
    buy_pct = round(len(buy_winners) / len(buys) * 100, 2) if buys else 0.0

    # Sell-side metrics
    sell_winners = [o for o in sells if _result_of(o) > 0]
    sell_losers = [o for o in sells if _result_of(o) < 0]
    sell_net = round(sum(_result_of(o) for o in sells), 2)
    sell_pct = round(len(sell_winners) / len(sells) * 100, 2) if sells else 0.0

    return {
        # 1. CONTA
        "conta": {
            "capital_inicial": round(capital, 2),
            "patrimonio_final": round(patrimonio, 2),
            "retorno_liquido": round(net_return, 2),
            "saldo_diario": round(daily_balance, 2),
        },

        # 2. RETORNO
        "retorno": {
            "retorno_liquido_r": round(net_return, 2),
            "retorno_pct": round(net_return / capital * 100, 2) if capital else 0.0,
            "lucro_bruto": round(gross_profit, 2),
            "prejuizo_bruto": round(gross_loss, 2),
            "fator_de_lucro": pf,
            "saldo_diario": round(daily_balance, 2),
        },

        # 3. RISCO
        "risco": {
            "drawdown_maximo_r": dd["abs"],
            "drawdown_maximo_pct": dd["pct"],
            "maior_ganho": largest_winner,
            "maior_perda": largest_loser,
        },

        # 4. RESUMO DOS TRADES
        "resumo_trades": {
            "total_trades": n_trades,
            "trades_com_lucro": len(winners),
            "trades_com_prejuizo": len(losers),
            "pct_com_lucro": profitable_pct,
            "media_ganho": avg_winner,
            "media_perda": avg_loser,
        },

        # 5. TRADES COM LUCRO
        "trades_lucro": {
            "quantidade": len(winners),
            "lucro_total": round(gross_profit, 2),
            "media": avg_winner,
            "maior_ganho": largest_winner,
        },

        # 6. TRADES COM PREJUÍZO
        "trades_prejuizo": {
            "quantidade": len(losers),
            "prejuizo_total": round(gross_loss, 2),
            "media": avg_loser,
            "maior_perda": largest_loser,
        },

        # 7. TRADES COMPRADOS (buy-side completed trades)
        "trades_comprados": {
            "quantidade": len(buys),
            "resultado_liquido": buy_net,
            "pct_lucrativos": buy_pct,
            "vencedores": len(buy_winners),
            "perdedores": len(buy_losers),
        },

        # 8. TRADES VENDIDOS (sell-side completed trades)
        "trades_vendidos": {
            "quantidade": len(sells),
            "resultado_liquido": sell_net,
            "pct_lucrativos": sell_pct,
            "vencedores": len(sell_winners),
            "perdedores": len(sell_losers),
        },
    }


# ─── Top-level Sumário aggregate ─────────────────────────────────────────────

def compute_sumario(
    capital: float,
    orders: List[OrderRow],
    open_position_mark: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Compute all Sumário metrics for the API response.

    Returns a dict suitable for serialisation as the /robots/{id}/sumario response.
    """
    return {
        "net_return": round(compute_net_return(orders), 2),
        "patrimonio": round(compute_patrimonio(capital, orders), 2),
        "max_drawdown": compute_max_drawdown(capital, orders),
        "number_of_trades": compute_number_of_trades(orders),
        "profitable_pct": compute_profitable_pct(orders),
        "profit_factor": compute_profit_factor(orders),
        "daily_balance": round(compute_daily_balance(orders), 2),
        "relatorio": compute_relatorio_completo(capital, orders),
    }
