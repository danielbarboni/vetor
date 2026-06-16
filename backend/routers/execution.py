"""
Execution router — start/stop robot lifecycle endpoints.

POST /robots/{id}/start  — EXE-01: start with valid+saved params
POST /robots/{id}/stop   — EXE-02: stop, cancel pending orders, optionally close position

Also exports:
  rehydrate_running_robots() — called on app startup (EXE-06)
  shutdown_all_robots()      — called on app shutdown
"""
from __future__ import annotations

import logging
from typing import Any, Dict
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth.jwt_guard import get_current_user
from db.supabase_client import supabase as _supabase
from engine.robot_engine import RobotEngine
from tick_ws.ws_manager import manager as ws_manager
from tick_ws.tick_router import TickRouter

logger = logging.getLogger(__name__)

router = APIRouter()

# ── Module-level singletons (D-17 design) ────────────────────────────────────

_tick_router = TickRouter(ws_manager)

# RobotEngine instances keyed by user_id
_engines: Dict[str, RobotEngine] = {}


def _get_or_create_engine(user_id: str) -> RobotEngine:
    """Return or create the RobotEngine for this user."""
    if user_id not in _engines:
        from broker.metaapi_adapter import MetaAPIAdapter
        from db.writer import SupabaseWriter

        broker = MetaAPIAdapter()
        writer = SupabaseWriter(_supabase)
        _engines[user_id] = RobotEngine(
            broker=broker,
            tick_router=_tick_router,
            writer=writer,
            ws_manager=ws_manager,
        )
    return _engines[user_id]


# ── Request / Response models ─────────────────────────────────────────────────

class StartResponse(BaseModel):
    robot_id: str
    status: str
    effective_contract: str
    message: str


class StopRequest(BaseModel):
    close_position: bool = False


class StopResponse(BaseModel):
    robot_id: str
    status: str
    message: str


# ── POST /robots/{id}/start ───────────────────────────────────────────────────

@router.post(
    "/{robot_id}/start",
    response_model=StartResponse,
    status_code=status.HTTP_200_OK,
    summary="Start a robot (EXE-01)",
)
async def start_robot(
    robot_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> StartResponse:
    """
    Start the execution engine for a robot.

    Pre-conditions (returns 409 on failure):
    - Robot belongs to the caller.
    - Robot has valid + saved params (params_saved_at set, params validated).
    - Robot is in 'parado' status (not already 'executando').

    On success:
    - Resolves effective B3 contract (EXE-04).
    - Launches RobotEngine.start → asyncio task (D-17).
    - Transitions robot status → 'executando'.
    """
    user_id = current_user["id"]
    rid = str(robot_id)

    # Fetch robot (ownership check)
    result = (
        _supabase.table("robots")
        .select("*")
        .eq("id", rid)
        .eq("user_id", user_id)
        .execute()
    )
    rows = result.data if result.data else []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")

    robot = rows[0]

    # EXE-01: Reject if not stopped
    if robot["status"] == "executando":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Robot is already running. Stop it first.",
        )
    if robot["status"] not in ("parado", "rascunho"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot start robot in status '{robot['status']}'.",
        )

    # EXE-01: Require saved params
    if not robot.get("params_saved_at") or not robot.get("params"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Robot does not have valid saved parameters. Save strategy params first.",
        )

    # Validate params
    try:
        from strategies.it_params_schema import ITParams
        from strategies.it_validators import validate_it_params
        it_params = ITParams(**robot["params"])
        validate_it_params(it_params)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Strategy params failed validation: {exc}",
        )

    # EXE-04: Resolve effective contract
    try:
        from b3_calendar.b3_calendar import B3Calendar
        calendar = B3Calendar(_supabase)
        effective_contract = calendar.resolve_contract(robot["asset"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to resolve B3 contract: {exc}",
        )

    # Instantiate strategy
    from engine.strategies.indicadores_tecnicos import IndicadoresTecnicos
    strategy = IndicadoresTecnicos(it_params)

    # Start engine
    engine = _get_or_create_engine(user_id)
    try:
        await engine.start(robot=robot, strategy=strategy, effective_contract=effective_contract)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))

    # Transition status → executando (Supabase Realtime fans this out — D-02)
    _supabase.table("robots").update({"status": "executando"}).eq("id", rid).execute()

    return StartResponse(
        robot_id=rid,
        status="executando",
        effective_contract=effective_contract,
        message=f"Robot started on {effective_contract}.",
    )


# ── POST /robots/{id}/stop ────────────────────────────────────────────────────

@router.post(
    "/{robot_id}/stop",
    response_model=StopResponse,
    status_code=status.HTTP_200_OK,
    summary="Stop a robot (EXE-02)",
)
async def stop_robot(
    robot_id: UUID,
    body: StopRequest = StopRequest(),
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> StopResponse:
    """
    Stop the execution engine for a robot.

    - Cancels pending orders.
    - Optionally closes the open position (body.close_position=true) (EXE-02).
    - Transitions robot status → 'parado'.
    - Returns 409 if robot is not currently running.
    """
    user_id = current_user["id"]
    rid = str(robot_id)

    # Fetch robot (ownership check)
    result = (
        _supabase.table("robots")
        .select("*")
        .eq("id", rid)
        .eq("user_id", user_id)
        .execute()
    )
    rows = result.data if result.data else []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Robot not found")

    robot = rows[0]

    if robot["status"] != "executando":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Robot is not running (status={robot['status']}).",
        )

    # Stop engine
    engine = _get_or_create_engine(user_id)
    try:
        await engine.stop(
            user_id=user_id,
            robot_id=rid,
            close_position=body.close_position,
        )
    except Exception as exc:
        logger.error("Error stopping robot %s: %s", rid, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop robot: {exc}",
        )

    # Transition status → parado
    _supabase.table("robots").update({"status": "parado"}).eq("id", rid).execute()

    msg = "Robot stopped."
    if body.close_position:
        msg += " Open position closed."

    return StopResponse(robot_id=rid, status="parado", message=msg)


# ── Startup rehydration (EXE-06) ──────────────────────────────────────────────

async def rehydrate_running_robots() -> None:
    """
    Called on app startup. Restarts the engine for any robot persisted as 'executando'.

    Uses get_positions/get_orders to rehydrate position state — never re-issues orders (EXE-06).
    """
    logger.info("Rehydrating 'executando' robots on startup...")
    try:
        result = _supabase.table("robots").select("*").eq("status", "executando").execute()
        robots = result.data if result.data else []
        logger.info("Found %d robots to rehydrate", len(robots))

        for robot in robots:
            user_id = robot["user_id"]
            rid = robot["id"]
            logger.info("Rehydrating robot=%s", rid)
            try:
                if not robot.get("params_saved_at") or not robot.get("params"):
                    logger.warning("Robot %s has no saved params — skipping rehydration", rid)
                    continue

                from strategies.it_params_schema import ITParams
                it_params = ITParams(**robot["params"])

                from b3_calendar.b3_calendar import B3Calendar
                calendar = B3Calendar(_supabase)
                effective_contract = calendar.resolve_contract(robot["asset"])

                from engine.strategies.indicadores_tecnicos import IndicadoresTecnicos
                strategy = IndicadoresTecnicos(it_params)

                engine = _get_or_create_engine(user_id)
                await engine.start(
                    robot=robot,
                    strategy=strategy,
                    effective_contract=effective_contract,
                )
                logger.info("Robot %s rehydrated successfully", rid)
            except Exception as exc:
                logger.error("Failed to rehydrate robot %s: %s", rid, exc)
                # Don't crash startup — mark as parado
                try:
                    _supabase.table("robots").update({"status": "parado"}).eq("id", rid).execute()
                except Exception:
                    pass
    except Exception as exc:
        logger.error("rehydrate_running_robots failed: %s", exc)


async def shutdown_all_robots() -> None:
    """Gracefully stop all running robot engines on app shutdown."""
    logger.info("Shutting down all robot engines...")
    for user_id, engine in list(_engines.items()):
        for key, meta in list(engine._robot_meta.items()):
            robot_id = meta.get("robot_id", "")
            try:
                await engine.stop(user_id=user_id, robot_id=robot_id, close_position=False)
                logger.info("Engine stopped for user=%s robot=%s on shutdown", user_id, robot_id)
            except Exception as exc:
                logger.warning("Error stopping engine on shutdown: %s", exc)
