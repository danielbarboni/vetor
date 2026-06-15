# Vetor — Plataforma de Robôs de Trading

## What This Is

Vetor is a web-based algorithmic trading platform for Brazilian and US futures markets (B3 and CME). It lets traders configure, run, and monitor automated trading robots based on multiple strategy types — with integrated backtesting, portfolio management, and a marketplace (SmartStore). Built initially for the owner's personal trading, the architecture is designed from day one to scale into a commercial SaaS serving retail algo traders in Brazil.

## Core Value

A trader can configure a robot, connect it to their broker via MetaAPI (BTG MT5 for B3) or IBKR (CME), and have it execute autonomously — while monitoring results in real time through a single unified interface.

## Requirements

### Validated

- ✓ Full UX/screen inventory covering all major platform areas — high-fidelity prototype (v3)
- ✓ Blue Hour Design System — token contract, theme switching (light/dark), WCAG audit
- ✓ Strategy editor UX for Larry Williams, Indicadores Técnicos, Toque na Média, Price Action — prototype
- ✓ Navigation architecture (sidebar, screen manager, environment toggle) — prototype
- ✓ Robot listing card with expanded metrics — prototype (14/06)
- ✓ Credit purchase screen — prototype (14/06)

### Active

**Phase 1 — MVP (Núcleo de Trading)**
- [ ] Authentication: register, login, session management, password reset
- [ ] Dashboard: portfolio equity curve, open positions summary, daily P&L
- [ ] Robot listing: list, filter, status badges, metrics card (expanded)
- [ ] Robot creation wizard: strategy selection, initial configuration
- [ ] Robot editor: all 7 strategy types (LW, IT, Tangram, Fibonacci, Toque na Média, Price Action, RenkoBot)
- [ ] Robot execution: start/stop/pause via MetaAPI (B3) or IBKR (CME)
- [ ] Real-time market data: tick feed for WIN%, WDO%, BIT% (MetaAPI) and MBT (IBKR)
- [ ] Robot report — Sumário: metrics cards, order list, order event modal
- [ ] Robot report — Gráfico: equity curve, trade annotations on chart (ECharts)
- [ ] MetaAPI integration: account provisioning, tick data, order execution

**Phase 2 — Completude do Produto Core**
- [ ] Backtests: single, mass (parameter sweep), batch comparison report
- [ ] Backtest credit system (purchase and consumption)
- [ ] Ranking: leaderboard of strategies by performance metrics
- [ ] Portfolio: multi-robot aggregate view, capital allocation
- [ ] IBKR integration: IB Gateway on VPS, ib_insync, MBT (CME Micro Bitcoin)
- [ ] Standalone chart screen

**Phase 3 — Ecossistema e Marketplace**
- [ ] SmartStore: strategy marketplace, purchase flow, detail page
- [ ] SmarttPlay: video/tutorial player embedded in platform
- [ ] Manager: admin dashboard, financials, user wallet, Q&A

### Out of Scope

- Nelogica/Tryd integration — BTG and XP both confirmed to support MT5; Nelogica not needed
- Direct B3 data feed (Cedro) — MetaAPI via BTG MT5 covers data needs; Cedro cost not justified at this scale
- CBOE Bitcoin futures — discontinued in 2019; CME (MBT) is the correct US Bitcoin futures venue
- Windows VPS for MT5 — eliminated by MetaAPI cloud bridge
- Multi-broker support at launch — start with BTG (MetaAPI) + IBKR; expand broker catalog post-SaaS launch
- Mobile app — web-first; responsive design is sufficient for v1
- Institutional-grade order routing — retail execution via MetaAPI and IBKR is sufficient

## Context

**Existing prototype:** `Plataforma Vetor v3.dc.html` is a complete high-fidelity design prototype covering all major screens. It uses a proprietary dc-runtime (`support.js`) that is prototype-only and must NOT be ported to production. The prototype serves as the UX and design spec for the production React app.

**Design system:** Blue Hour Design System provides the token contract (`tokens.css`), palette registry (`palettes.js`), and build pipeline (`build-tokens.py`). This carries forward into production as the CSS foundation.

**Prototype gaps (known before production build starts):**
- 3 of 7 strategy editors incomplete in prototype: Tangram, Fibonacci, RenkoBot — need completion in PRD spec before implementing in production
- SmarttPlay player not implemented in prototype
- Wizard "Saiba Mais" info modals missing

**Owner's trading context:**
- B3 instruments: WIN% (mini Ibovespa), WDO% (mini Dólar), BIT% (mini Bitcoin futures), equity portfolio
- CME instruments: MBT (Micro Bitcoin Futures) — same strategies as BIT%, different venue
- Primary B3 broker: BTG Pactual — MT5 account already configured and verified working
- CME broker: Interactive Brokers (IBKR)
- No paid B3 direct data plan — market data sourced via broker's MT5 feed through MetaAPI

**PRD reference:** `PRD_Plataforma_Robos_Trading_v2.0.md` — 35 sections covering all screens, data model, API spec, business rules, and acceptance criteria. This is the authoritative functional spec.

## Constraints

- **Tech — MT5 bridge:** MetaAPI adds ~50–200ms network latency vs direct MT5. Acceptable for swing/position strategies; monitor for scalp strategies.
- **Tech — IBKR sessions:** IB Gateway sessions expire every 24h and require re-authentication. Must automate via `ib-gateway-docker` or equivalent keepalive tooling.
- **Tech — Frontend:** Production app is React (replaces HTML prototype). The dc-runtime and dc-html pattern are prototype artifacts — no code carries forward from `support.js`.
- **Tech — Realtime:** Supabase Realtime (PostgreSQL logical replication → WebSocket) handles live UI updates. MetaAPI WebSocket feeds tick data to FastAPI, which writes to Supabase or pushes directly to frontend.
- **Budget — Solo phase:** Target infrastructure cost under $60/month (Vultr VPS ~$12 + MetaAPI free/starter + Supabase free tier + Cloudflare Pages free).
- **Scalability — SaaS model:** Each SaaS user provides their own MT5 broker credentials, provisioned as a separate MetaAPI account. FastAPI orchestrates per-user connections. IBKR credentials are per-user too.
- **Regulatory:** Platform executes trades on user's behalf via their own broker accounts. Platform does not hold funds or act as broker. Users are responsible for their own trading decisions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MetaAPI for MT5 bridge (not Windows VPS) | Eliminates Windows infrastructure dependency; scales to multi-user SaaS via per-account model; user's BTG account already verified to work with MT5 | — Pending |
| IBKR + ib_insync for CME (not MT5) | IBKR natively covers CME MBT futures; Linux-compatible (no Windows); cleaner API than MT5 for US markets | — Pending |
| Supabase for DB + Auth + Realtime | Saves 2–3 weeks on auth implementation; built-in Realtime replaces custom WebSocket pub/sub; PostgreSQL scales to SaaS; familiar from prior project | — Pending |
| Cloudflare Pages for frontend | Free CDN tier sufficient for solo phase; git-based deploys; familiar from prior project | — Pending |
| Vultr Linux VPS (São Paulo) for FastAPI + IB Gateway | São Paulo region reduces latency to B3/BTG servers; small instance (~$12/month) sufficient for solo phase; IB Gateway co-located with FastAPI avoids inter-region hops | — Pending |
| Prototype NOT ported to production | dc-runtime is intentionally temporary; React component architecture required for maintainability and SaaS scale; prototype serves as visual spec only | ✓ Good |
| CME instrument is MBT (not CBOE) | CBOE Bitcoin futures discontinued 2019; CME Micro Bitcoin (MBT) is the correct US equivalent to B3's BIT% mini contract | ✓ Good |
| Phase 1 excludes IBKR/CME | B3 is the owner's primary market; CME (IBKR) adds complexity; defer to Phase 2 to keep MVP scope tight | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-15 after initialization*
