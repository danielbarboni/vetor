"""
Sumário router — Sumário report endpoints (SUM-01..SUM-05).

All routes require authentication via Depends(get_current_user).
All queries are user-scoped (robot must belong to the requesting user).

Endpoints:
  GET /robots/{id}/sumario          — header metadata + primary metrics + relatório completo
  GET /robots/{id}/orders           — paginated + filterable order list (SUM-04)
  GET /robots/{id}/orders/{oid}/events — per-order event log (SUM-05)
  GET /robots/{id}/equity           — equity series as Array<[timestamp_ms, value]> (SUM-02)
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from auth.jwt_guard import get_current_user
from db.supabase_client import supabase
from engine.metrics import compute_sumario, compute_equity_series

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _require_robot(robot_id: str, user_id: str) -> Dict[str, Any]:
    """
    Fetch a robot row, asserting it belongs to the requesting user.
    Raises 404 if not found, 403 if not owned.
    """
    result = (
        supabase.table("robots")
        .select("*")
        .eq("id", robot_id)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")
    robot = rows[0]
    if str(robot.get("user_id")) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return robot


def _fetch_orders(
    robot_id: str,
    order_status: Optional[str] = None,
    period: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
) -> List[Dict[str, Any]]:
    """
    Fetch orders for a robot from Supabase with optional filters.
    period: 'HOJE' | '7D' | '30D' | 'TUDO'
    """
    from datetime import datetime, timezone, timedelta

    q = supabase.table("orders").select("*").eq("robot_id", robot_id)

    if order_status:
        q = q.eq("status", order_status)

    if period and period != "TUDO":
        now = datetime.now(timezone.utc)
        if period == "HOJE":
            cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "7D":
            cutoff = now - timedelta(days=7)
        elif period == "30D":
            cutoff = now - timedelta(days=30)
        else:
            cutoff = None

        if cutoff:
            q = q.gte("created_at", cutoff.isoformat())

    q = q.order("created_at", desc=True)

    # Supabase range is 0-indexed [from, to] inclusive
    offset = (page - 1) * page_size
    q = q.range(offset, offset + page_size - 1)

    result = q.execute()
    return result.data or []


# ─── GET /robots/{id}/sumario ─────────────────────────────────────────────────

@router.get("/{robot_id}/sumario", tags=["sumario"])
async def get_sumario(
    robot_id: UUID,
    period: Optional[str] = Query(default="TUDO", description="HOJE|7D|30D|TUDO"),
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    SUM-01/SUM-02/SUM-03: Sumário header + primary metric cards + relatório completo.

    Response includes:
      - Robot metadata (name, strategy, asset, mode, status, effective_contract,
        params_saved_at)
      - Primary metrics (net_return, patrimônio, max_drawdown, number_of_trades,
        profitable_pct, profit_factor, daily_balance)
      - RELATÓRIO COMPLETO 8 sections
    """
    rid = str(robot_id)
    robot = _require_robot(rid, user_id)

    capital = float(robot.get("simulation_capital") or 0.0)
    orders = _fetch_orders(rid, period=period, page=1, page_size=10000)

    metrics = compute_sumario(capital, orders)

    return {
        # SUM-01 header metadata
        "id": rid,
        "name": robot.get("name"),
        "strategy_type": robot.get("strategy_type"),
        "asset": robot.get("asset"),
        "mode": robot.get("mode"),
        "status": robot.get("status"),
        "effective_contract": robot.get("effective_contract"),
        "params_saved_at": robot.get("params_saved_at"),
        "simulation_capital": robot.get("simulation_capital"),
        # SUM-02 primary metrics
        **metrics,
    }


# ─── GET /robots/{id}/orders ──────────────────────────────────────────────────

@router.get("/{robot_id}/orders", tags=["sumario"])
async def list_orders(
    robot_id: UUID,
    order_status: Optional[str] = Query(default=None, alias="status"),
    period: Optional[str] = Query(default="TUDO", description="HOJE|7D|30D|TUDO"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    SUM-04: Paginated, filterable order list for the robot.

    Filters: status (pending|filled|cancelled|rejected), period (HOJE|7D|30D|TUDO)
    Pagination: page + page_size
    """
    rid = str(robot_id)
    _require_robot(rid, user_id)

    orders = _fetch_orders(rid, order_status=order_status, period=period, page=page, page_size=page_size)

    return {
        "orders": orders,
        "page": page,
        "page_size": page_size,
        "count": len(orders),
    }


# ─── GET /robots/{id}/orders/{oid}/events ─────────────────────────────────────

@router.get("/{robot_id}/orders/{order_id}/events", tags=["sumario"])
async def get_order_events(
    robot_id: UUID,
    order_id: UUID,
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    SUM-05: Per-order event log from order_events table.
    """
    rid = str(robot_id)
    oid = str(order_id)
    _require_robot(rid, user_id)

    # Verify the order belongs to this robot
    order_result = (
        supabase.table("orders")
        .select("id, robot_id")
        .eq("id", oid)
        .eq("robot_id", rid)
        .execute()
    )
    order_rows = order_result.data or []
    if not order_rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    events_result = (
        supabase.table("order_events")
        .select("*")
        .eq("order_id", oid)
        .order("created_at", desc=False)
        .execute()
    )

    return {
        "order_id": oid,
        "events": events_result.data or [],
    }


# ─── GET /robots/{id}/equity ──────────────────────────────────────────────────

@router.get("/{robot_id}/equity", tags=["sumario"])
async def get_equity(
    robot_id: UUID,
    period: Optional[str] = Query(default="TUDO", description="HOJE|7D|30D|TUDO"),
    user_id: str = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    SUM-02 (D-03): Equity curve reconstructed from order history.

    Returns Array<[timestamp_ms, value]> pairs for ECharts time-series consumption.
    """
    rid = str(robot_id)
    robot = _require_robot(rid, user_id)

    capital = float(robot.get("simulation_capital") or 0.0)
    orders = _fetch_orders(rid, period=period, page=1, page_size=10000)

    series = compute_equity_series(capital, orders)

    return {
        "capital": capital,
        "series": series,
    }
