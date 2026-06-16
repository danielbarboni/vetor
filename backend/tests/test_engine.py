"""
test_engine.py — Nyquist gate: EXE-01 … EXE-06

Tests for RobotEngine start/stop lifecycle.
Implemented in later plan (engine wave).
"""
import pytest


@pytest.mark.xfail(reason="implemented in later wave")
def test_start_requires_params():
    """EXE-01: Robot cannot start without valid, saved parameters; rejects with 400."""
    raise NotImplementedError
