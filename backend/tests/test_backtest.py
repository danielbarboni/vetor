"""
test_backtest.py — Nyquist gate: BCK-01 … BCK-04

Tests for backtest creation, execution and metric parity with live Sumário.
Implemented in later plan (engine/backtest_runner.py wave).
"""
import pytest


@pytest.mark.xfail(reason="implemented in later wave")
def test_metrics_parity():
    """BCK-04: Backtest report metrics match Sumário metric definitions exactly."""
    raise NotImplementedError
