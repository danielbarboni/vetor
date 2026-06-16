"""
Tests for Robot CRUD + lifecycle API.

All tests use mock supabase clients (hermetic — no live HTTP calls).
Router tests use the test_client + auth_token fixtures from conftest.

Coverage:
- test_name_unique          : duplicate name → 409 (WIZ-05)
- test_create_robot         : POST /robots → 201 + id + status rascunho (WIZ-06)
- test_create_robot_simulado: simulation_capital required for simulado mode (D-08)
- test_create_robot_real    : simulation_capital must be null for real mode (D-08)
- test_list_robots_filter   : GET /robots?status=parado returns filtered list
- test_get_robot_not_found  : GET /robots/{id} for another user → 404
- test_archive_executing    : POST /robots/{id}/archive while executando → 409 (ROB-05)
- test_duplicate_robot      : POST /robots/{id}/duplicate returns new rascunho (D-08)
- test_unarchive_robot      : POST /robots/{id}/unarchive from arquivado → parado
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from db.models import (
    AssetSymbol,
    RobotCreate,
    RobotMode,
)
from db.robot_repo import (
    archive_robot,
    create_robot,
    duplicate_robot,
    get_robot,
    list_robots,
    unarchive_robot,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

USER_ID = "00000000-0000-0000-0000-000000000001"
ROBOT_ID = str(uuid.uuid4())
NOW = datetime.now(timezone.utc).isoformat()


def _make_robot_row(
    *,
    id: str = ROBOT_ID,
    user_id: str = USER_ID,
    name: str = "Robô Teste",
    strategy_type: str = "indicadores_tecnicos",
    mode: str = "simulado",
    asset: str = "WIN%",
    simulation_capital: float | None = 10000.0,
    fill_policy: str = "pessimista",
    status: str = "rascunho",
    params: dict | None = None,
    effective_contract: str | None = None,
) -> dict:
    return {
        "id": id,
        "user_id": user_id,
        "name": name,
        "strategy_type": strategy_type,
        "mode": mode,
        "asset": asset,
        "simulation_capital": simulation_capital,
        "fill_policy": fill_policy,
        "status": status,
        "params": params,
        "effective_contract": effective_contract,
        "created_at": NOW,
        "updated_at": NOW,
    }


def _mock_supabase(rows: list[dict] | None = None, *, error: Any = None) -> MagicMock:
    """Build a chainable MagicMock supabase client that returns the given rows."""
    mock = MagicMock()
    result = MagicMock()
    result.data = rows if rows is not None else []
    result.error = error

    mock.table.return_value = mock
    mock.select.return_value = mock
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.delete.return_value = mock
    mock.eq.return_value = mock
    mock.execute.return_value = result
    return mock


def _mock_supabase_seq(rows_seq: list[list[dict]]) -> MagicMock:
    """Build a supabase mock that returns different data on successive execute() calls."""
    call_count = [0]
    sb = MagicMock()

    def execute_side_effect():
        idx = call_count[0]
        call_count[0] += 1
        result = MagicMock()
        result.error = None
        result.data = rows_seq[idx] if idx < len(rows_seq) else []
        return result

    sb.table.return_value = sb
    sb.select.return_value = sb
    sb.insert.return_value = sb
    sb.update.return_value = sb
    sb.delete.return_value = sb
    sb.eq.return_value = sb
    sb.execute.side_effect = execute_side_effect
    return sb


# ── Repository unit tests ─────────────────────────────────────────────────────

def test_create_robot_sets_rascunho_and_user_id():
    """create_robot inserts with status='rascunho' and the caller's user_id."""
    row = _make_robot_row(status="rascunho", user_id=USER_ID)
    sb = _mock_supabase([row])

    payload = RobotCreate(
        name="Robô Teste",
        mode=RobotMode.simulado,
        asset=AssetSymbol.win,
        simulation_capital=10000.0,
    )
    result = create_robot(sb, USER_ID, payload)

    assert result.status.value == "rascunho"
    assert str(result.user_id) == USER_ID

    call_args = sb.insert.call_args[0][0]
    assert call_args["user_id"] == USER_ID
    assert call_args["status"] == "rascunho"


def test_name_unique():
    """Duplicate (user_id, name) → 409 conflict (WIZ-05)."""
    from fastapi import HTTPException

    sb = _mock_supabase()
    sb.execute.side_effect = Exception(
        "duplicate key value violates unique constraint (23505)"
    )

    payload = RobotCreate(
        name="Robô Duplicado",
        mode=RobotMode.simulado,
        asset=AssetSymbol.win,
        simulation_capital=5000.0,
    )

    with pytest.raises(HTTPException) as exc_info:
        create_robot(sb, USER_ID, payload)

    assert exc_info.value.status_code == 409


def test_create_robot_simulado_requires_capital():
    """simulation_capital is required when mode='simulado' (D-08)."""
    with pytest.raises(ValueError, match="simulation_capital is required"):
        RobotCreate(
            name="Robô Simulado",
            mode=RobotMode.simulado,
            asset=AssetSymbol.win,
            simulation_capital=None,
        )


def test_create_robot_real_rejects_capital():
    """simulation_capital must be null when mode='real' (D-08)."""
    with pytest.raises(ValueError, match="simulation_capital must be null"):
        RobotCreate(
            name="Robô Real",
            mode=RobotMode.real,
            asset=AssetSymbol.win,
            simulation_capital=5000.0,
        )


def test_list_robots_user_scoped():
    """list_robots filters by user_id."""
    row = _make_robot_row(status="parado", user_id=USER_ID)
    sb = _mock_supabase([row])

    robots = list_robots(sb, USER_ID)

    assert len(robots) == 1
    eq_calls = [str(c) for c in sb.eq.call_args_list]
    assert any("user_id" in c for c in eq_calls)


def test_list_robots_status_filter():
    """list_robots with status_filter applies status eq filter."""
    row = _make_robot_row(status="parado")
    sb = _mock_supabase([row])

    robots = list_robots(sb, USER_ID, status_filter="parado")

    assert len(robots) == 1
    eq_calls = [str(c) for c in sb.eq.call_args_list]
    assert any("status" in c for c in eq_calls)


def test_get_robot_not_found():
    """get_robot raises 404 when robot is not found (different user or missing)."""
    from fastapi import HTTPException

    sb = _mock_supabase([])

    with pytest.raises(HTTPException) as exc_info:
        get_robot(sb, USER_ID, ROBOT_ID)

    assert exc_info.value.status_code == 404


def test_archive_robot_success():
    """archive_robot moves robot from 'parado' to 'arquivado'."""
    original = _make_robot_row(status="parado")
    archived = _make_robot_row(status="arquivado")
    sb = _mock_supabase_seq([[original], [archived]])

    result = archive_robot(sb, USER_ID, ROBOT_ID)
    assert result.status.value == "arquivado"


def test_archive_executing():
    """archive_robot on an executing robot raises 409 (ROB-05)."""
    from fastapi import HTTPException

    row = _make_robot_row(status="executando")
    sb = _mock_supabase([row])

    with pytest.raises(HTTPException) as exc_info:
        archive_robot(sb, USER_ID, ROBOT_ID)

    assert exc_info.value.status_code == 409


def test_unarchive_robot():
    """unarchive_robot moves robot from 'arquivado' to 'parado'."""
    archived = _make_robot_row(status="arquivado")
    parado = _make_robot_row(status="parado")
    sb = _mock_supabase_seq([[archived], [parado]])

    result = unarchive_robot(sb, USER_ID, ROBOT_ID)
    assert result.status.value == "parado"


def test_duplicate_robot():
    """duplicate_robot creates a new rascunho row with ' (cópia)' suffix."""
    original = _make_robot_row(name="Robô Original", status="parado")
    new_id = str(uuid.uuid4())
    dup = _make_robot_row(
        id=new_id,
        name="Robô Original (cópia)",
        status="rascunho",
    )
    sb = _mock_supabase_seq([[original], [dup]])

    result = duplicate_robot(sb, USER_ID, ROBOT_ID)

    assert result.status.value == "rascunho"
    assert "(cópia)" in result.name
    assert str(result.id) != ROBOT_ID


def test_duplicate_robot_name_truncated():
    """duplicate_robot truncates long names so total length ≤ 100 chars."""
    long_name = "A" * 95
    original = _make_robot_row(name=long_name)
    # After truncation: 92 chars + " (cópia)" (8 chars) = 100
    expected_name = ("A" * 92) + " (cópia)"
    dup = _make_robot_row(id=str(uuid.uuid4()), name=expected_name, status="rascunho")
    sb = _mock_supabase_seq([[original], [dup]])

    duplicate_robot(sb, USER_ID, ROBOT_ID)

    insert_data = sb.insert.call_args[0][0]
    assert len(insert_data["name"]) <= 100


# ── Router integration tests ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_robot_endpoint(test_client, auth_token):
    """POST /robots → 201 with id and status rascunho (WIZ-06)."""
    new_id = str(uuid.uuid4())
    robot_row = _make_robot_row(id=new_id, status="rascunho")
    mock_sb = _mock_supabase([robot_row])

    with patch("routers.robots.supabase", mock_sb):
        response = await test_client.post(
            "/robots",
            json={
                "name": "Robô Wizard",
                "mode": "simulado",
                "asset": "WIN%",
                "simulation_capital": 10000.0,
            },
            headers={"Authorization": f"Bearer {auth_token}"},
        )

    assert response.status_code == 201
    body = response.json()
    assert "id" in body
    assert body["status"] == "rascunho"


@pytest.mark.asyncio
async def test_list_robots_endpoint(test_client, auth_token):
    """GET /robots returns the user's robots as a list."""
    row = _make_robot_row(status="parado")
    mock_sb = _mock_supabase([row])

    with patch("routers.robots.supabase", mock_sb):
        response = await test_client.get(
            "/robots",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_robot_not_found_endpoint(test_client, auth_token):
    """GET /robots/{id} for missing robot → 404."""
    mock_sb = _mock_supabase([])

    with patch("routers.robots.supabase", mock_sb):
        response = await test_client.get(
            f"/robots/{ROBOT_ID}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_archive_executing_endpoint(test_client, auth_token):
    """POST /robots/{id}/archive on executing robot → 409 (ROB-05)."""
    row = _make_robot_row(status="executando")
    mock_sb = _mock_supabase([row])

    with patch("routers.robots.supabase", mock_sb):
        response = await test_client.post(
            f"/robots/{ROBOT_ID}/archive",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_duplicate_endpoint(test_client, auth_token):
    """POST /robots/{id}/duplicate returns a new robot id distinct from source."""
    original = _make_robot_row(name="Robô Original", status="parado")
    new_id = str(uuid.uuid4())
    dup = _make_robot_row(id=new_id, name="Robô Original (cópia)", status="rascunho")
    mock_sb = _mock_supabase_seq([[original], [dup]])

    with patch("routers.robots.supabase", mock_sb):
        response = await test_client.post(
            f"/robots/{ROBOT_ID}/duplicate",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["id"] != ROBOT_ID
    assert body["status"] == "rascunho"
