# REQUIREMENTS.md — Vetor Trading Platform

**Source:** PRD_Plataforma_Robos_Trading_v2.0.md (sections 5–27, 33)
**Additions vs PRD:** OAuth login (user-confirmed addition, not in original PRD)
**Last updated:** 2026-06-15 after initialization

---

## v1 Requirements (Phase 1 — MVP: Núcleo de Trading)

### Authentication (AUT)

- [ ] **AUT-01**: User can register with email/password; receives email verification
- [ ] **AUT-02**: User can log in with email/password; session persists across browser sessions
- [ ] **AUT-03**: User can recover password via email link (forgot password flow)
- [ ] **AUT-04**: User can log out from all devices simultaneously
- [ ] **AUT-05**: When user has multiple account profiles, system presents account selection screen after login (with skeleton loader)
- [ ] **AUT-06**: User can log in via OAuth (Google / GitHub) *(addition confirmed by user — not in original PRD)*

### Robot Listing (ROB)

- [x] **ROB-01**: User sees robots organized in three tabs by state: EXECUTANDO, PARADOS, ARQUIVADOS
- [x] **ROB-02**: Each robot displayed as a card showing: #id, asset code, simulator badge (Pessimista/Moderado/Otimista), robot name, strategy type, sparkline equity curve with date axis, position status, Net Return (green/red), Daily Balance
- [x] **ROB-03**: Each card has: "MAIS INFO" accordion expander, ⋮ context menu, primary control button (Parar/Iniciar/Restaurar)
- [x] **ROB-04**: "MAIS INFO" expands to show: Number of trades, Profitable trades (%), Profit factor, Max drawdown (%)
- [ ] **ROB-05**: ⋮ context menu actions per robot state (Ver Sumário, Editar parâmetros, Iniciar, Pausar/Parar, Arquivar, Desarquivar, Excluir, Criar backtest, Duplicar) — available actions vary by state
- [x] **ROB-06**: Filters by strategy (multi-select dropdown), by "Robôs Posicionados"; grid/list toggle; search by name
- [x] **ROB-07**: "CRIAR ROBÔ" button launches the wizard

### Robot Creation Wizard (WIZ)

- [ ] **WIZ-01**: Step 1 — Strategy: catalog of strategy templates with text search; each item shows name, author, "Saiba Mais" modal, and "+" to select
- [ ] **WIZ-02**: Catalog shows all 7 strategy types (list-only in Phase 1; only IT [Tangram 3.0] is fully editable after wizard)
- [ ] **WIZ-03**: Step 2 — Mode: selection between Modo Simulado and Modo Real (Modo Real requires linked broker account and eligible plan)
- [ ] **WIZ-04**: Step 3 — Asset: market selection (BM&F) and asset code via chips (WIN% / WDO% / BIT%)
- [ ] **WIZ-05**: Step 4 — Configure: Robot name (required, unique per account), selected strategy display, Simulation Capital (default R$5,000.00; only in Simulado). "Avançar" enabled only with valid fields
- [ ] **WIZ-06**: On completion, robot created in "parado/rascunho" state; redirect to `/robos/{id}/parametros`

### Robot Editor — Indicadores Técnicos [Tangram 3.0] (EDT)

- [ ] **EDT-01**: Full editor for Indicadores Técnicos [Tangram 3.0] with all 14 indicators, filters, entry/exit criteria, and time sections (per PRD section 12)
- [ ] **EDT-02**: Parameters blocked for editing while robot is executing (banner + read-only fields)
- [ ] **EDT-03**: Save parameters with full validation (JSON Schema + cross-field rules); records "Último salvar" timestamp
- [ ] **EDT-04**: Backtest shortcut icon (🧪) in editor header launches individual backtest modal

### Robot Execution (EXE)

- [ ] **EXE-01**: Start execution only with valid and saved parameters; transition to Executando state with green badge
- [ ] **EXE-02**: Stop execution: cancels pending orders; asks whether to close open position
- [ ] **EXE-03**: Modo Simulado: fills orders using configurable policy per robot (Pessimista by default; Moderado and Otimista available); badge shown on card and report
- [ ] **EXE-04**: Resolve continuous contract suffix (%) to current expiry; perform automatic rollover; record effective contract per order (e.g., WDOF26)
- [ ] **EXE-05**: Persist all orders with: timestamp, price, quantity, type (market/limit), status (filled/cancelled/rejected/expired), entry/exit classification
- [ ] **EXE-06**: Recovery after failure: engine rehydrates robot position state without duplicating orders (idempotency)

### Robot Report — Sumário (SUM)

- [ ] **SUM-01**: Report header with: robot name, strategy, asset, current contract, simulator badge, "Último salvar" timestamp
- [ ] **SUM-02**: Metric cards: Net Return, Equity evolution chart (line with tooltip), Asset quote (real-time price + % change), Patrimônio, Current position, Max drawdown, Number of trades, Profitable trades %, Profit factor, Daily balance
- [ ] **SUM-03**: "RELATÓRIO COMPLETO" expandable accordion with 8 detailed metric cards (Conta, Retorno, Risco, Drawdown, Resumo dos trades, Trades com lucro, Trades com prejuízo, Trades comprados, Trades vendidos)
- [ ] **SUM-04**: Order list with: date/time, type, direction, quantity, price, status, result; export to CSV
- [ ] **SUM-05**: Order event modal (ⓘ): detailed event log for each order (#ID, timestamps, prices, fills)

### Backtests — Individual (BCK)

- [ ] **BCK-01**: Individual backtest creation modal (from editor ⓑ icon or robot card ⋮ menu): robot name pre-filled, capital, operational costs profile, backtest type (pessimist/moderate/optimist), start/end date with period shortcuts (1M/3M/6M/1Y/2Y)
- [ ] **BCK-02**: Available backtest credits displayed (read-only counter); each execution consumes 1 credit
- [ ] **BCK-03**: Backtest list page: shows all backtests with status (Aguardando/Processando/Concluído/Erro), creation date, period, capital, type
- [ ] **BCK-04**: Completed backtest report: same metric cards as Sumário + equity curve + order list (read-only, historical)

### Minha Conta (CTR) — Phase 1 Tabs

- [ ] **CTR-01**: Perfil tab: personal data (full name, email read-only, phone, CPF/CNPJ), avatar upload, change password link, activate MFA toggle
- [ ] **CTR-02**: Corretoras tab: link/unlink broker accounts (BTG/MetaAPI integration for Phase 1); display connection status
- [ ] **CTR-03**: Preferências tab: notification and display preferences
- [ ] **CTR-04**: Últimos Acessos tab: login history (date, device, IP)

---

## v2 Requirements (Phase 2 — Completude do Produto Core)

- [ ] Robot editors for remaining 6 strategies: Larry Williams, Tangram, Fibonacci, Toque na Média, Price Action, RenkoBot Start
- [ ] Dashboard Análise Geral: consolidated equity curve, daily P&L, active robots mini-cards, platform metrics (RF-DSH-01 to RF-DSH-04)
- [ ] Robot report — Gráfico tab: candlestick chart with indicators overlaid and trade entry/exit annotations (section 20)
- [ ] Gráfico Standalone: standalone chart screen at `/private/grafico` (section 25)
- [ ] Modo Real: first broker integration (BTG Pactual via MetaAPI); requires linked broker account, risk term acceptance, eligible plan; full audit trail of all real orders
- [ ] Backtest em massa (parameter sweep): multi-value chips for SL, TP, quantity; batch queue creation
- [ ] Batch comparative report: ranked results table with key metrics across all batch backtests
- [ ] Credit purchase: buy backtest credit packages (10 or 100 credits) via payment flow (section 21 + credit purchase screen from prototype)
- [ ] Minha Conta — Assinaturas tab: active plan + renewal date, SmartStore strategy subscriptions, payment cards
- [ ] IBKR integration (CME MBT futures): IB Gateway on VPS, ib_insync, Modo Real for CME

---

## v3 Requirements (Phase 3 — Ecossistema e Marketplace)

- [ ] SmartStore complete: listing, strategy detail page, subscription purchase, Q&A, FAQ, Disclaimer (section 24)
- [ ] Ranking: strategy leaderboard with filters (section 22)
- [ ] Portfólio: consolidated multi-robot view with capital allocation (section 23)
- [ ] SmarttPlay: educational video hub (section 7)
- [ ] Manager: admin dashboard — financials, user wallet, strategy Q&A management (section 27)
- [ ] Second broker integration
- [ ] Email notifications (configurable in Preferências)

---

## Out of Scope

- MFA (TOTP) — PRD marks as "future, before Modo Real"; deferred to Phase 2 when Modo Real ships
- Public landing page (RF-AUT-02) — out of scope for this implementation phase; platform is private access
- Mobile native app — PRD defers to Phase 3 as "responsividade avançada"; responsive web is sufficient for v1-v2
- Order book / Level 2 data — requires expensive B3 data feed beyond MetaAPI tick data
- Custom indicator builder — not in PRD; adds unbounded support scope
- Paper trading engine — not in PRD; Modo Simulado covers this use case
- IRRF tax export — not in PRD; high-value future differentiator; requires trade classification stored from Phase 1 (AUT-01 captures this)
- Walk-forward analysis / Monte Carlo — not in PRD; deferred to post-SaaS
- Social copy-trading — not in PRD; requires CVM regulatory approval

---

## Traceability

| REQ-ID Group | PRD Section | Phase |
|--------------|-------------|-------|
| AUT-01..06 | §5 | 1 |
| ROB-01..07 | §8 | 1 |
| WIZ-01..06 | §9 | 1 |
| EDT-01..04 | §10, §12 | 1 |
| EXE-01..06 | §18 | 1 |
| SUM-01..05 | §19 | 1 |
| BCK-01..04 | §21.1, §21.2, §21.4 | 1 |
| CTR-01..04 | §26.1, §26.3, §26.4, §26.5 | 1 |
| DSH | §6 | 2 |
| GRA/GRS | §20, §25 | 2 |
| BCK-mass | §21.3, §21.5 | 2 |
| CTR-ASS | §26.2 | 2 |
| RNK | §22 | 3 |
| PRT | §23 | 3 |
| STR | §24 | 3 |
| STP | §7 | 3 |
| MGR | §27 | 3 |
