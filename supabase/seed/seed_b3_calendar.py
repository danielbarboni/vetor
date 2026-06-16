#!/usr/bin/env python3
"""
seed_b3_calendar.py
-------------------
Generates SQL INSERT statements for the b3_contracts table covering 2026-2027.

B3 Contract Rules (as of 2026):
  WIN% (Mini Ibovespa Futures) — quarterly even-month contracts:
    Expiry: Wednesday nearest the 15th of the contract month
    Contract months (even): Feb(G), Apr(J), Jun(M), Aug(Q), Oct(V), Dec(Z)

  WDO% (Mini Dollar Futures) — same schedule as WIN%:
    Same even months and same expiry calculation.

  BIT% (Bitcoin Futures, B3) — monthly contracts:
    Expiry: 3rd Friday of every month

Standard futures month codes (ISO/industry standard):
  F=Jan  G=Feb  H=Mar  J=Apr  K=May  M=Jun
  N=Jul  Q=Aug  U=Sep  V=Oct  X=Nov  Z=Dec

Rollover convention (approximation):
  T-5 business days before expiry (counting Mon–Fri, no holiday correction
  for the seed — APScheduler will keep the live calendar current).

Front-month determination (relative to TODAY = 2026-06-16):
  The front month is the nearest contract whose expiry_date >= today.
  Exactly one is_front_month = true per asset.

Usage:
  python3 supabase/seed/seed_b3_calendar.py > supabase/seed/b3_contracts_2026_2027.sql
  python3 supabase/seed/seed_b3_calendar.py   # prints to stdout
"""

import sys
from datetime import date, timedelta
from zoneinfo import ZoneInfo

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BRT = ZoneInfo("America/Sao_Paulo")
TODAY = date(2026, 6, 16)           # fixed reference date per plan spec
START_YEAR = 2026
END_YEAR = 2027

# Standard futures month codes
MONTH_CODE = {
    1: 'F', 2: 'G', 3: 'H', 4: 'J', 5: 'K', 6: 'M',
    7: 'N', 8: 'Q', 9: 'U', 10: 'V', 11: 'X', 12: 'Z',
}

# Even months traded by WIN% and WDO%
WIN_WDO_MONTHS = [2, 4, 6, 8, 10, 12]   # G J M Q V Z

# All months traded by BIT%
BIT_MONTHS = list(range(1, 13))          # F G H J K M N Q U V X Z


# ---------------------------------------------------------------------------
# Date calculation helpers
# ---------------------------------------------------------------------------

def wednesday_nearest_15th(year: int, month: int) -> date:
    """
    B3 rule for WIN% / WDO%:
    The expiry is the Wednesday (weekday=2) nearest to the 15th of the month.
    'Nearest' means the Wed within [-3, +3] of the 15th.
    If the 15th IS a Wednesday, expiry = 15th.
    """
    the_15th = date(year, month, 15)
    # Offset from 15th to nearest Wednesday
    day_of_week = the_15th.weekday()   # Mon=0 … Sun=6; Wed=2
    offset = (2 - day_of_week + 7) % 7
    if offset > 3:
        offset -= 7          # go backwards if closer
    return the_15th + timedelta(days=offset)


def third_friday(year: int, month: int) -> date:
    """Return the 3rd Friday of the given month."""
    first_day = date(year, month, 1)
    # Weekday of the 1st: Mon=0 … Sun=6; Fri=4
    first_friday_offset = (4 - first_day.weekday() + 7) % 7
    first_friday = first_day + timedelta(days=first_friday_offset)
    return first_friday + timedelta(weeks=2)   # 3rd Friday = 1st + 14 days


def business_days_before(d: date, n: int) -> date:
    """Return the date that is n business days (Mon–Fri) before d."""
    result = d
    counted = 0
    while counted < n:
        result -= timedelta(days=1)
        if result.weekday() < 5:   # Mon–Fri
            counted += 1
    return result


# ---------------------------------------------------------------------------
# Contract generation
# ---------------------------------------------------------------------------

def generate_contracts():
    contracts = []

    for year in range(START_YEAR, END_YEAR + 1):
        # WIN% and WDO%
        for month in WIN_WDO_MONTHS:
            expiry = wednesday_nearest_15th(year, month)
            rollover = business_days_before(expiry, 5)
            code = MONTH_CODE[month]
            yr2 = str(year)[-2:]
            for asset in ('WIN%', 'WDO%'):
                prefix = asset[:3]   # 'WIN' or 'WDO'
                symbol = f"{prefix}{code}{yr2}"
                contracts.append({
                    'asset': asset,
                    'symbol': symbol,
                    'expiry_date': expiry,
                    'rollover_date': rollover,
                })

        # BIT%
        for month in BIT_MONTHS:
            expiry = third_friday(year, month)
            rollover = business_days_before(expiry, 5)
            code = MONTH_CODE[month]
            yr2 = str(year)[-2:]
            symbol = f"BIT{code}{yr2}"
            contracts.append({
                'asset': 'BIT%',
                'symbol': symbol,
                'expiry_date': expiry,
                'rollover_date': rollover,
            })

    # Sort chronologically
    contracts.sort(key=lambda c: (c['expiry_date'], c['asset']))
    return contracts


def assign_front_months(contracts):
    """
    Assign is_front_month = True to exactly one contract per asset.
    The front month is the contract with the nearest expiry_date >= TODAY.
    """
    result = []
    front_assigned = {'WIN%': False, 'WDO%': False, 'BIT%': False}

    # First pass: find the earliest expiry >= TODAY for each asset
    front_expiry = {}
    for c in contracts:
        asset = c['asset']
        if c['expiry_date'] >= TODAY:
            if asset not in front_expiry:
                front_expiry[asset] = c['expiry_date']
            else:
                if c['expiry_date'] < front_expiry[asset]:
                    front_expiry[asset] = c['expiry_date']

    for c in contracts:
        asset = c['asset']
        is_front = (
            asset in front_expiry
            and c['expiry_date'] == front_expiry[asset]
            and not front_assigned[asset]
        )
        if is_front:
            front_assigned[asset] = True
        result.append({**c, 'is_front_month': is_front})

    return result


# ---------------------------------------------------------------------------
# SQL output
# ---------------------------------------------------------------------------

def to_sql(contracts):
    lines = [
        "-- b3_contracts_2026_2027.sql",
        "-- Generated by supabase/seed/seed_b3_calendar.py",
        f"-- Reference date (front-month determination): {TODAY}",
        "--",
        "-- Month code reference:",
        "--   F=Jan G=Feb H=Mar J=Apr K=May M=Jun",
        "--   N=Jul Q=Aug U=Sep V=Oct X=Nov Z=Dec",
        "--",
        "-- WIN% / WDO%: even-month contracts (G J M Q V Z)",
        "-- BIT%: monthly contracts (all 12 month codes)",
        "",
        "-- Truncate + reload is safe; this is reference data only.",
        "TRUNCATE TABLE b3_contracts RESTART IDENTITY;",
        "",
    ]

    for c in contracts:
        fm = 'true' if c['is_front_month'] else 'false'
        rollover = f"'{c['rollover_date']}'" if c['rollover_date'] else 'NULL'
        lines.append(
            f"insert into b3_contracts (asset, symbol, expiry_date, is_front_month, rollover_date) values "
            f"('{c['asset']}', '{c['symbol']}', '{c['expiry_date']}', {fm}, {rollover});"
        )

    lines.append("")
    lines.append("-- Verification: exactly one front month per asset")
    lines.append("-- SELECT asset, symbol, expiry_date FROM b3_contracts WHERE is_front_month = true ORDER BY asset;")
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    contracts = generate_contracts()
    contracts = assign_front_months(contracts)

    # Sanity checks
    for asset in ('WIN%', 'WDO%', 'BIT%'):
        front_count = sum(1 for c in contracts if c['asset'] == asset and c['is_front_month'])
        if front_count != 1:
            print(f"ERROR: {asset} has {front_count} front-month rows (expected exactly 1)", file=sys.stderr)
            sys.exit(1)
        front = next(c for c in contracts if c['asset'] == asset and c['is_front_month'])
        print(f"# {asset} front month: {front['symbol']} expiry={front['expiry_date']}", file=sys.stderr)

    # Print total contract counts to stderr for visibility
    total = len(contracts)
    print(f"# Total contracts generated: {total}", file=sys.stderr)

    print(to_sql(contracts))


if __name__ == '__main__':
    main()
