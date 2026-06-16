"""
backtests.py — FastAPI router for individual backtests (BCK-01..04).

Endpoints:
  POST   /backtests              — create + queue, consume credit (BCK-01/02)
  GET    /backtests              — list all user backtests (BCK-03)
  GET    /backtests/{id}         — backtest detail + result metrics (BCK-04)
  GET    /backtests/{id}/orders  — simulated orders for a completed backtest
  GET    /account/credits        — current credit balance (BCK-02)

All endpoints are protected by Depends(get_current_user).
Status changes fan out via Supabase Realtime (backtests table is published).
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from auth.jwt_guard import get_current_user
from db.backtest_repo import BacktestRepo, InsufficientCreditsError
from db.supabase_client import supabase
from db.models import BacktestCreate, BacktestOut

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Dependency: BacktestRepo ──────────────────────────────────────────────────

def get_repo() -> BacktestRepo:
    return BacktestRepo(supabase)


# ── GET /account/credits (BCK-02) ─────────────────────────────────────────────

@router.get("/credits", tags=["backtest"], summary="Available backtest credits (BCK-02)")
async def get_credits(
    user_id: str = Depends(get_current_user),
    repo: BacktestRepo = Depends(get_repo),
) -> Dict[str, Any]:
    """Return the current backtest credit balance for the authenticated user."""
    balance = repo.get_credits(user_id)
    return {"balance": balance}


# ── POST /backtests (BCK-01/02) ───────────────────────────────────────────────

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    tags=["backtest"],
    summary="Create and queue a backtest (BCK-01/02)",
)
async def create_backtest(
    payload: BacktestCreate,
    user_id: str = Depends(get_current_user),
    repo: BacktestRepo = Depends(get_repo),
) -> Dict[str, Any]:
    """
    Create a new backtest, consume one credit, and launch the async runner (BCK-01/02).

    Returns the created backtest record with status='aguardando'.
    The runner transitions status: aguardando → processando → concluido/erro.
    Status changes are published via Supabase Realtime.
    """

    try:
        backtest = repo.create_backtest(
            user_id=user_id,
            robot_id=str(payload.robot_id),
            capital=payload.capital,
            fill_policy=payload.fill_policy.value,
            date_from=payload.date_from,
            date_to=payload.date_to,
            include_costs=payload.include_costs,
        )
    except InsufficientCreditsError as exc:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=str(exc),
        ) from exc

    # Launch async runner (A10 — asyncio.create_task for Phase 1 solo scale)
    backtest_id = backtest.get("id", "")
    robot_id = str(payload.robot_id)

    # Fetch robot params for strategy construction
    robot_params = _get_robot_params(user_id, robot_id)

    from engine.backtest_runner import run_backtest_task

    asyncio.create_task(
        run_backtest_task(
            backtest_id=backtest_id,
            robot_id=robot_id,
            user_id=user_id,
            capital=payload.capital,
            fill_policy=payload.fill_policy.value,
            date_from=payload.date_from,
            date_to=payload.date_to,
            include_costs=payload.include_costs,
            repo=repo,
            robot_params=robot_params,
        )
    )

    return backtest


def _get_robot_params(user_id: str, robot_id: str) -> Optional[Dict[str, Any]]:
    """Fetch robot params from DB for strategy construction."""
    try:
        res = (
            supabase.table("robots")
            .select("params")
            .eq("user_id", user_id)
            .eq("id", robot_id)
            .execute()
        )
        rows = res.data or []
        if rows:
            return rows[0].get("params")
    except Exception as exc:
        logger.warning("Could not fetch robot params for backtest: %s", exc)
    return None


# ── GET /backtests (BCK-03) ───────────────────────────────────────────────────

@router.get(
    "",
    tags=["backtest"],
    summary="List all backtests (BCK-03)",
)
async def list_backtests(
    user_id: str = Depends(get_current_user),
    repo: BacktestRepo = Depends(get_repo),
) -> List[Dict[str, Any]]:
    """Return all backtest records for the authenticated user, newest first."""
    return repo.list_backtests(user_id)


# ── GET /backtests/{id} (BCK-04) ──────────────────────────────────────────────

@router.get(
    "/{backtest_id}",
    tags=["backtest"],
    summary="Backtest detail + result metrics (BCK-04)",
)
async def get_backtest(
    backtest_id: str,
    user_id: str = Depends(get_current_user),
    repo: BacktestRepo = Depends(get_repo),
) -> Dict[str, Any]:
    """
    Return a single backtest with full result_metrics.

    For completed backtests, result contains the same metric structure
    as the Sumário endpoint (BCK-04 parity).
    """
    backtest = repo.get_backtest(user_id, backtest_id)
    if backtest is None:
        raise HTTPException(status_code=404, detail="Backtest not found")
    return backtest


# ── GET /backtests/{id}/orders ────────────────────────────────────────────────

@router.get(
    "/{backtest_id}/orders",
    tags=["backtest"],
    summary="Simulated orders for a completed backtest",
)
async def get_backtest_orders(
    backtest_id: str,
    user_id: str = Depends(get_current_user),
    repo: BacktestRepo = Depends(get_repo),
) -> Dict[str, Any]:
    """Return all simulated orders generated during a completed backtest run."""
    orders = repo.get_backtest_orders(user_id, backtest_id)
    return {"backtest_id": backtest_id, "orders": orders, "count": len(orders)}
