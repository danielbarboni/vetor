"""
Robot repository — user-scoped data access for the robots table.

All functions accept user_id explicitly (from the JWT guard) and enforce
it server-side. Never trust a client-supplied user_id (T-01-04).

Unique violation (user_id, name) is mapped to HTTPException 409 (WIZ-05).
Illegal state transitions (e.g. archive while executando) raise 409.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from db.models import RobotCreate, RobotOut, RobotUpdate

# Max name length — reserve 10 chars for " (cópia)" suffix (8 chars) + growth
_NAME_MAX = 100
_COPY_SUFFIX = " (cópia)"


def _to_robot_out(row: Dict[str, Any]) -> RobotOut:
    """Convert a raw Supabase row dict to a RobotOut model."""
    return RobotOut(**row)


def _handle_unique_violation(exc: Exception, name: str) -> None:
    """Re-raise unique constraint violations as HTTP 409 (WIZ-05)."""
    err_str = str(exc).lower()
    if "unique" in err_str or "duplicate" in err_str or "23505" in err_str:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A robot named '{name}' already exists in this account (WIZ-05)",
        )


# ── CRUD ──────────────────────────────────────────────────────────────────────

def create_robot(
    supabase: Any,
    user_id: str,
    payload: RobotCreate,
) -> RobotOut:
    """
    Insert a new robot row with status='rascunho' and the caller's user_id.

    Raises 409 when (user_id, name) already exists (WIZ-05).
    """
    data = {
        "user_id": user_id,
        "name": payload.name,
        "strategy_type": payload.strategy_type,
        "mode": payload.mode.value,
        "asset": payload.asset.value,
        "simulation_capital": payload.simulation_capital,
        "fill_policy": payload.fill_policy.value,
        "status": "rascunho",
    }

    try:
        result = supabase.table("robots").insert(data).execute()
    except Exception as exc:
        # supabase-py v2 raises APIError on DB errors (incl. unique violations).
        _handle_unique_violation(exc, payload.name)
        raise

    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Robot created but no row returned",
        )

    return _to_robot_out(rows[0])


def get_robot(
    supabase: Any,
    user_id: str,
    robot_id: str,
) -> RobotOut:
    """
    Return a single robot belonging to user_id.

    Raises 404 when the robot does not exist or belongs to another user.
    """
    result = (
        supabase.table("robots")
        .select("*")
        .eq("id", robot_id)
        .eq("user_id", user_id)
        .execute()
    )

    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robot not found",
        )

    return _to_robot_out(rows[0])


def list_robots(
    supabase: Any,
    user_id: str,
    status_filter: Optional[str] = None,
) -> List[RobotOut]:
    """
    Return all robots belonging to user_id, optionally filtered by status.
    """
    query = supabase.table("robots").select("*").eq("user_id", user_id)

    if status_filter:
        query = query.eq("status", status_filter)

    result = query.execute()
    rows = result.data or []
    return [_to_robot_out(r) for r in rows]


def update_robot(
    supabase: Any,
    user_id: str,
    robot_id: str,
    payload: RobotUpdate,
) -> RobotOut:
    """
    Update mutable fields (name, fill_policy, params).

    Raises 404 when robot not found or belongs to another user.
    Raises 409 on duplicate name.
    """
    # Verify ownership first
    get_robot(supabase, user_id, robot_id)

    updates: Dict[str, Any] = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.fill_policy is not None:
        updates["fill_policy"] = payload.fill_policy.value
    if payload.params is not None:
        updates["params"] = payload.params
        # EDT-03 / RF-EXE-01: record params_saved_at timestamp on successful save
        updates["params_saved_at"] = datetime.now(timezone.utc).isoformat()

    if not updates:
        return get_robot(supabase, user_id, robot_id)

    try:
        result = (
            supabase.table("robots")
            .update(updates)
            .eq("id", robot_id)
            .eq("user_id", user_id)
            .execute()
        )
    except Exception as exc:
        if payload.name:
            _handle_unique_violation(exc, payload.name)
        raise

    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robot not found after update",
        )

    return _to_robot_out(rows[0])


def delete_robot(
    supabase: Any,
    user_id: str,
    robot_id: str,
) -> None:
    """
    Delete a robot belonging to user_id.

    Raises 404 when robot not found or belongs to another user.
    """
    # Verify ownership first (raises 404 if not found)
    get_robot(supabase, user_id, robot_id)

    supabase.table("robots").delete().eq("id", robot_id).eq(
        "user_id", user_id
    ).execute()


# ── Lifecycle ─────────────────────────────────────────────────────────────────

def archive_robot(
    supabase: Any,
    user_id: str,
    robot_id: str,
) -> RobotOut:
    """
    Move robot to 'arquivado' status.

    Raises 409 when the robot is currently 'executando' (ROB-05).
    Raises 404 when not found or not owned by user.
    """
    robot = get_robot(supabase, user_id, robot_id)

    if robot.status.value == "executando":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot archive a robot that is currently executing. Stop it first.",
        )

    result = (
        supabase.table("robots")
        .update({"status": "arquivado"})
        .eq("id", robot_id)
        .eq("user_id", user_id)
        .execute()
    )

    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robot not found after archive",
        )

    return _to_robot_out(rows[0])


def unarchive_robot(
    supabase: Any,
    user_id: str,
    robot_id: str,
) -> RobotOut:
    """
    Move robot from 'arquivado' back to 'parado'.

    Raises 409 when robot is not currently 'arquivado'.
    Raises 404 when not found or not owned by user.
    """
    robot = get_robot(supabase, user_id, robot_id)

    if robot.status.value != "arquivado":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot unarchive a robot with status '{robot.status.value}'.",
        )

    result = (
        supabase.table("robots")
        .update({"status": "parado"})
        .eq("id", robot_id)
        .eq("user_id", user_id)
        .execute()
    )

    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Robot not found after unarchive",
        )

    return _to_robot_out(rows[0])


def duplicate_robot(
    supabase: Any,
    user_id: str,
    robot_id: str,
) -> RobotOut:
    """
    Duplicate a robot: copies all config + params into a new 'rascunho' row.

    The new robot's name is "[original name] (cópia)", truncated to 100 chars.
    This is the D-08 mode-promotion path — user can pick Real in wizard.
    Raises 404 when source robot not found or not owned by user.
    Raises 409 on duplicate name collision.
    """
    robot = get_robot(supabase, user_id, robot_id)

    # Truncate name to fit within _NAME_MAX (suffix is 8 chars)
    max_orig = _NAME_MAX - len(_COPY_SUFFIX)
    orig_name = robot.name[:max_orig]
    new_name = f"{orig_name}{_COPY_SUFFIX}"

    data: Dict[str, Any] = {
        "user_id": user_id,
        "name": new_name,
        "strategy_type": robot.strategy_type,
        "mode": robot.mode.value,
        "asset": robot.asset.value,
        "simulation_capital": robot.simulation_capital,
        "fill_policy": robot.fill_policy.value,
        "status": "rascunho",
    }

    # Copy params if present
    if robot.params is not None:
        data["params"] = robot.params

    try:
        result = supabase.table("robots").insert(data).execute()
    except Exception as exc:
        _handle_unique_violation(exc, new_name)
        raise

    rows = result.data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Robot duplicated but no row returned",
        )

    return _to_robot_out(rows[0])
