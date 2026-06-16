"""
test_broker.py — CTR-02 broker provisioning gate.

Tests link_broker() from broker/provisioning.py:
- Stores metaapi_account_id + status in broker_connections
- NEVER persists a raw MT5 password (mitigates T-01 credential exposure)
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch


def _make_mock_supabase(inserted: list):
    """Return a mock Supabase client that captures insert() calls."""
    mock_client = MagicMock()
    mock_table = MagicMock()
    mock_client.table.return_value = mock_table
    mock_table.select.return_value = mock_table
    mock_table.insert.side_effect = lambda data: inserted.append(data) or mock_table
    mock_table.update.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[], error=None)
    return mock_client


def test_provision():
    """CTR-02: Linking a BTG account via MetaAPI stores account ID and no raw MT5 password."""
    import asyncio
    from broker.provisioning import link_broker

    inserted_rows: list = []
    mock_db = _make_mock_supabase(inserted_rows)

    # Mock MetaAPI SDK to return a fake account_id without network calls
    mock_account = MagicMock()
    mock_account.id = "metaapi-account-uuid-1234"

    mock_api = MagicMock()
    mock_api.metatrader_account_api = MagicMock()
    mock_api.metatrader_account_api.create_account = AsyncMock(return_value=mock_account)

    with patch("broker.provisioning.supabase", mock_db), \
         patch("broker.provisioning.MetaApi", return_value=mock_api):

        result = asyncio.run(
            link_broker(
                user_id="user-uuid-001",
                login="12345678",
                password="secret-mt5-password",  # noqa: S106  (test-only credential)
                server="BTG-Demo",
                broker_name="BTG Pactual",
            )
        )

    # Must return a record with metaapi_account_id
    assert result.get("metaapi_account_id") == "metaapi-account-uuid-1234", (
        "link_broker must return metaapi_account_id"
    )

    # Must have written to broker_connections
    assert len(inserted_rows) >= 1, "link_broker must insert a row into broker_connections"

    # SECURITY: raw MT5 password must NEVER appear in any persisted field
    for row in inserted_rows:
        for key, val in row.items():
            assert "secret-mt5-password" not in str(val), (
                f"Raw MT5 password found in persisted field '{key}' — T-01 violation"
            )
        # Also explicitly assert no 'password' key was stored
        assert "password" not in row, (
            "broker_connections row must not contain a 'password' field (T-01)"
        )
        assert "mt5_password" not in row, (
            "broker_connections row must not contain a 'mt5_password' field (T-01)"
        )
