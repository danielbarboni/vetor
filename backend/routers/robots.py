"""
Robots router — CRUD + lifecycle endpoints.

All routes are user-scoped via Depends(get_current_user).
user_id is NEVER taken from the request body (T-01-04 mitigation).

Endpoints:
  GET    /robots                 — list robots (optional ?status= filter)
  POST   /robots                 — create robot → 201 + rascunho (WIZ-06)
  GET    /robots/{id}            — get single robot
  PATCH  /robots/{id}            — update name / fill_policy / params (EDT-03)
  DELETE /robots/{id}            — delete robot
  POST   /robots/{id}/archive    — archive (rejects if executando → 409)
  POST   /robots/{id}/unarchive  — unarchive (must be arquivado)
  POST   /robots/{id}/duplicate  — duplicate → new rascunho (D-08 mode-promotion)
"""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import ValidationError

from auth.jwt_guard import get_current_user
from db.models import RobotCreate, RobotOut, RobotUpdate
from db.robot_repo import (
    archive_robot,
    create_robot,
    delete_robot,
    duplicate_robot,
    get_robot,
    list_robots,
    unarchive_robot,
    update_robot,
)
from db.supabase_client import supabase
from strategies.it_validators import format_validation_errors, validate_it_params

router = APIRouter()


# ── List robots ────────────────────────────────────────────────────────────────

@router.get("", response_model=List[RobotOut])
async def list_robots_endpoint(
    status: Optional[str] = Query(default=None, description="Filter by robot status"),
    user_id: str = Depends(get_current_user),
) -> List[RobotOut]:
    """Return all robots belonging to the authenticated user, optionally filtered by status."""
    return list_robots(supabase, user_id, status_filter=status)


# ── Create robot ───────────────────────────────────────────────────────────────

@router.post("", status_code=status.HTTP_201_CREATED, response_model=RobotOut)
async def create_robot_endpoint(
    payload: RobotCreate,
    user_id: str = Depends(get_current_user),
) -> RobotOut:
    """
    Create a new robot in 'rascunho' state (WIZ-06).

    Returns 201 + the full robot row (including id and status='rascunho').
    Returns 409 when a robot with the same name already exists (WIZ-05).
    """
    return create_robot(supabase, user_id, payload)


# ── Get robot ──────────────────────────────────────────────────────────────────

@router.get("/{robot_id}", response_model=RobotOut)
async def get_robot_endpoint(
    robot_id: UUID,
    user_id: str = Depends(get_current_user),
) -> RobotOut:
    """Return a single robot. Raises 404 if not found or owned by another user."""
    return get_robot(supabase, user_id, str(robot_id))


# ── Update robot ───────────────────────────────────────────────────────────────

@router.patch("/{robot_id}", response_model=RobotOut)
async def update_robot_endpoint(
    robot_id: UUID,
    payload: RobotUpdate,
    user_id: str = Depends(get_current_user),
) -> RobotOut:
    """
    Update robot name, fill_policy, and/or IT params (EDT-03 / RF-EXE-01).

    When params are included:
      - Validates against the full IT [Tangram 3.0] schema (RISK-04).
      - On validation failure → 422 with field-level errors.
      - On success → persists params and sets params_saved_at=now().

    Returns 404 if not found or owned by another user.
    Returns 409 on duplicate name.
    """
    # EDT-03: validate IT params when provided
    if payload.params is not None:
        try:
            validate_it_params(payload.params)
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=format_validation_errors(exc)["detail"],
            )

    return update_robot(supabase, user_id, str(robot_id), payload)


# ── Delete robot ───────────────────────────────────────────────────────────────

@router.delete("/{robot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_robot_endpoint(
    robot_id: UUID,
    user_id: str = Depends(get_current_user),
) -> None:
    """Delete a robot. Raises 404 if not found or owned by another user."""
    delete_robot(supabase, user_id, str(robot_id))


# ── Archive ────────────────────────────────────────────────────────────────────

@router.post("/{robot_id}/archive", response_model=RobotOut)
async def archive_robot_endpoint(
    robot_id: UUID,
    user_id: str = Depends(get_current_user),
) -> RobotOut:
    """
    Archive a robot (move to 'arquivado' status).

    Returns 409 when the robot is currently 'executando' (ROB-05).
    Returns 404 if not found or owned by another user.
    """
    return archive_robot(supabase, user_id, str(robot_id))


# ── Unarchive ──────────────────────────────────────────────────────────────────

@router.post("/{robot_id}/unarchive", response_model=RobotOut)
async def unarchive_robot_endpoint(
    robot_id: UUID,
    user_id: str = Depends(get_current_user),
) -> RobotOut:
    """
    Unarchive a robot (move from 'arquivado' back to 'parado').

    Returns 409 when the robot is not in 'arquivado' state.
    Returns 404 if not found or owned by another user.
    """
    return unarchive_robot(supabase, user_id, str(robot_id))


# ── Duplicate ──────────────────────────────────────────────────────────────────

@router.post(
    "/{robot_id}/duplicate",
    status_code=status.HTTP_201_CREATED,
    response_model=RobotOut,
)
async def duplicate_robot_endpoint(
    robot_id: UUID,
    user_id: str = Depends(get_current_user),
) -> RobotOut:
    """
    Duplicate a robot into a new 'rascunho' row named '[name] (cópia)'.

    This is the D-08 mode-promotion path: user can then open the wizard
    on the copy and switch from 'simulado' to 'real'.
    Returns 201 + the new robot row.
    Returns 404 if source not found or owned by another user.
    Returns 409 on duplicate name collision.
    """
    return duplicate_robot(supabase, user_id, str(robot_id))
