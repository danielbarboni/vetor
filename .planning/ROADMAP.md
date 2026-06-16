# Roadmap: Vetor — Plataforma de Robôs de Trading

## Overview

Three-phase journey from a focused MVP for the owner's personal B3 trading to a commercial SaaS platform. Phase 1 delivers the core trading engine with authentication, robot lifecycle, MetaAPI B3 execution, and reporting. Phase 2 completes the product with advanced analysis, IBKR/CME support, and backtest tooling. Phase 3 adds the ecosystem layer: marketplace, ranking, portfolio, and admin.

## Phases

- [ ] **Phase 1: MVP — Núcleo de Trading** - Authentication, robot management, MetaAPI B3 execution, robot report, individual backtests, account management
- [ ] **Phase 2: Completude do Produto Core** - Dashboard, IBKR/CME, mass backtests, credit purchase, ranking, portfolio, chart screen
- [ ] **Phase 3: Ecossistema e Marketplace** - SmartStore, SmarttPlay, Ranking, Portfolio, Manager admin

## Phase Details

### Phase 1: MVP — Núcleo de Trading
**Goal**: Deliver a working trading platform for B3 instruments — user can authenticate, create and configure robots using the Indicadores Técnicos [Tangram 3.0] strategy, execute them against MetaAPI (BTG MT5), view real-time robot reports with order history, run individual backtests, and manage their account and broker linkage
**Depends on**: Nothing (first phase)
**Requirements**: AUT-01, AUT-02, AUT-03, AUT-04, AUT-05, AUT-06, ROB-01, ROB-02, ROB-03, ROB-04, ROB-05, ROB-06, ROB-07, WIZ-01, WIZ-02, WIZ-03, WIZ-04, WIZ-05, WIZ-06, EDT-01, EDT-02, EDT-03, EDT-04, EXE-01, EXE-02, EXE-03, EXE-04, EXE-05, EXE-06, SUM-01, SUM-02, SUM-03, SUM-04, SUM-05, BCK-01, BCK-02, BCK-03, BCK-04, CTR-01, CTR-02, CTR-03, CTR-04
**Success Criteria** (what must be TRUE):
  1. User can register with email/password (+ OAuth Google/GitHub), log in, reset password, and log out from all devices
  2. User can create a robot via wizard (strategy selection → mode → asset → name/capital), resulting in a robot in "parado" state at /robos/{id}/parametros
  3. User can configure, save, and validate the Indicadores Técnicos [Tangram 3.0] editor with all 14 indicators and cross-field rules
  4. Robot starts and stops execution via MetaAPI (BTG MT5); B3 instruments WIN%, WDO%, BIT% resolve to current expiry with automatic rollover
  5. Robot listing shows cards with sparkline, metrics, status badges, filters, and context menu actions varying by state
  6. Robot Sumário report shows real-time metric cards, equity chart, order list (with CSV export), and order event modals
  7. Individual backtest can be created, queued, and viewed as a completed report with the same metrics as Sumário
  8. User can manage profile, link/unlink broker accounts (BTG/MetaAPI), set preferences, and view login history
**Plans**: TBD

Plans:
(populated by /gsd:plan-phase 1)

### Phase 2: Completude do Produto Core
**Goal**: Complete the product with dashboard analytics, IBKR/CME MBT futures integration, mass backtests with parameter sweep, backtest credit purchase, ranking leaderboard, portfolio multi-robot view, and standalone chart screen
**Depends on**: Phase 1
**Requirements**: DSH-01, DSH-02, DSH-03, DSH-04, GRA-01, GRS-01, BCK-MASS-01, BCK-MASS-02, BCK-BATCH-01, CRD-01, CRD-02, CTR-ASS-01, RNK-01, PRT-01, IBKR-01, IBKR-02
**Success Criteria** (what must be TRUE):
  1. Dashboard shows consolidated equity curve, daily P&L, active robot mini-cards, and platform metrics
  2. Robot report Gráfico tab shows candlestick chart with indicator overlays and trade entry/exit annotations
  3. User can run mass backtests (parameter sweep via multi-value chips) and compare results in batch report
  4. User can purchase backtest credit packages (10 or 100 credits) via payment flow
  5. IBKR integration allows Modo Real execution for CME MBT futures
  6. Ranking leaderboard and Portfolio multi-robot aggregate view are accessible
**Plans**: TBD

Plans:
(populated by /gsd:plan-phase 2)

### Phase 3: Ecossistema e Marketplace
**Goal**: Build the commercial ecosystem — SmartStore strategy marketplace, SmarttPlay educational video hub, Ranking, Portfolio, and Manager admin dashboard covering financials, user wallets, and strategy Q&A
**Depends on**: Phase 2
**Requirements**: STR-01, STR-02, STR-03, STP-01, RNK-01, PRT-01, MGR-01, MGR-02, MGR-03
**Success Criteria** (what must be TRUE):
  1. SmartStore shows strategy listings with detail pages, subscription purchase flow, Q&A, FAQ, and Disclaimer
  2. SmarttPlay educational video hub is accessible within the platform
  3. Ranking leaderboard with strategy performance filters is visible
  4. Portfolio shows consolidated multi-robot view with capital allocation
  5. Manager admin dashboard covers financials, user wallet, and strategy Q&A management
**Plans**: TBD

Plans:
(populated by /gsd:plan-phase 3)

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. MVP — Núcleo de Trading | 10/13 | In Progress|  |
| 2. Completude do Produto Core | 0/TBD | Not started | - |
| 3. Ecossistema e Marketplace | 0/TBD | Not started | - |
