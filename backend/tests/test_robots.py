"""
test_robots.py — Nyquist gate: ROB-01 … ROB-07, WIZ-01 … WIZ-06

Tests for robot CRUD and wizard flow.
Implemented in later plan (routers/robots.py wave).
"""
import pytest


@pytest.mark.xfail(reason="implemented in later wave")
def test_name_unique():
    """WIZ-05: Robot name must be unique per user; duplicate names are rejected."""
    raise NotImplementedError


@pytest.mark.xfail(reason="implemented in later wave")
def test_create_robot():
    """WIZ-06: POST /robots creates a robot and returns its id for redirect."""
    raise NotImplementedError
