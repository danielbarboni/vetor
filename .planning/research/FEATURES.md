# Feature Landscape: Brazilian Retail Algo Trading SaaS

**Domain:** Algorithmic trading platform — B3 + CME futures, retail segment
**Researched:** 2026-06-15
**Confidence:** MEDIUM (training knowledge of MT5, NinjaTrader, QuantConnect, Profit Pro)

---

## Table Stakes

Features that every platform must have. Missing any causes users to leave or never adopt.

### Robot / Strategy Management

| Feature | Why Expected | Complexity | Comparison Baseline |
|---------|--------------|------------|---------------------|
| Robot list with status badges (Running / Stopped / Error / Paused) | Core workflow entrypoint — traders scan all robots at a glance | Low | MT5 Expert Advisors list; Profit Pro robo dashboard |
| Start / Stop / Pause per robot | Fundamental control. Traders pause during volatility, stop at EOD | Low | Present in all platforms |
| Per-robot P&L and position summary visible from list | Traders scan the list to triage performance | Low | MT5 shows open profit per EA |
| Active order list per robot | "What is my robot doing right now?" is the most common live question | Low | MT5 Trade tab per EA |
| Error / alert notifications | Silent failures are catastrophic. Robot must surface when it can't execute | Medium | MT5 journal tab; Profit Pro alerts |
| Multi-instrument support within a robot | WIN%, WDO%, BIT% on the same strategy type is baseline for B3 retail | Low | MT5 supports multi-symbol EAs |

### Backtesting

| Feature | Why Expected | Complexity | Comparison Baseline |
|---------|--------------|------------|---------------------|
| Single-run backtest on historical data | Without this, strategy selection is blind | Medium | MT5 Strategy Tester; NinjaTrader; QuantConnect |
| Equity curve display | Most common output visual | Low | All platforms show this |
| Key metrics: Net Profit, Win Rate, Profit Factor, Max Drawdown, Sharpe Ratio | The 5 metrics every trader checks first | Low | MT5 Strategy Tester report; NinjaTrader Performance Analyzer |
| Order-by-order trade list from backtest | Traders manually validate entries/exits against chart | Medium | MT5 Strategy Tester trades tab |
| Configurable date range and timeframe | Traders backtest recent vs historical data separately | Low | Present in all platforms |
| B3 market hours enforcement in backtest engine | Backtests running through closed-market gaps produce misleading results | Medium | Profit Pro enforces this natively; MT5 requires manual calendar setup |

### Risk Management

| Feature | Why Expected | Complexity | Comparison Baseline |
|---------|--------------|------------|---------------------|
| Daily loss limit (stop robot when daily loss reaches R$ X) | Regulatory habit and self-discipline. Expected by all serious retail traders | Medium | Profit Pro has this; MT5 does not enforce natively |
| Max simultaneous contracts per robot | Prevent runaway position sizing | Low | All serious platforms have this |
| Drawdown-based auto-stop | Standard risk rule | Medium | QuantConnect has this; MT5 lacks it natively |
| Time-based rules (don't trade near open/close, avoid expiry/rolagem days) | B3-specific: rolagem and expiry days are high-risk periods | Medium | Profit Pro handles this; MT5 requires custom EA code |

### Real-Time Monitoring

| Feature | Why Expected | Complexity | Comparison Baseline |
|---------|--------------|------------|---------------------|
| Live P&L per robot (updates per tick or per trade) | Core live view | Medium | MT5 terminal; Profit Pro live panel |
| Open position details (entry price, current price, unrealized P&L) | Traders need to see this instantly | Low | All platforms |
| Live equity curve (appended in real time) | Traders watch the curve shape intra-day | Medium | MT5 does not provide per-EA equity curve; Profit Pro shows it |
| Trade log / order history (today's trades) | Audit trail intra-day | Low | All platforms |

---

## Differentiators

Features that create competitive advantage over Profit Pro / MT5.

### Robot / Strategy Management

| Feature | Value Proposition | Complexity | Why MT5/Profit Pro Falls Short |
|---------|-------------------|------------|-------------------------------|
| Visual no-code strategy editor (configure via form fields, not MQL5/NTSL) | 80% of retail algo traders cannot write code — this is the entire addressable market | High | MT5 requires MQL5; Profit Pro requires NTSL scripting |
| Hot-parameter editing while robot is running | Change SL, TP, lot size without restarting the robot | High | MT5 requires EA removal and re-attach; restarts lose position context |
| Strategy-type templates (Larry Williams, Indicadores, Price Action, etc.) | Gives traders a proven B3-native framework rather than a blank canvas | Medium | MT5/Profit Pro are blank-canvas; no B3-native framework templates exist |
| Robot duplication + variation testing | Clone a robot, tweak one parameter, run both live | Low | Not natively available in MT5/Profit Pro |
| Side-by-side robot comparison (A vs B on same period) | Helps traders choose between similar configs | Medium | Not available in MT5 or Profit Pro |

### Backtesting

| Feature | Value Proposition | Complexity | Why This Differentiates |
|---------|-------------------|------------|------------------------|
| Mass backtest / parameter sweep (vary SL, TP, lot size across a grid) | Finds optimal parameters without manual iteration | High | MT5 Optimizer exists but is intimidating; no B3-native Portuguese equivalent |
| Walk-forward analysis | Validates parameters generalize to unseen data — prevents curve fitting | Very High | NinjaTrader and QuantConnect have this; MT5 does not |
| Monte Carlo simulation | Shows distribution of possible outcomes, not a single-path result | Very High | QuantConnect has this; MT5 does not |
| Batch comparison report (run 10 configs, rank by Sharpe) | Traders test multiple strategies and need a ranked summary | Medium | Not in Profit Pro; MT5 Optimization report is not user-friendly |
| Exportable backtest report (PDF) | Traders share results with partners or document decisions | Low | MT5 exports CSV; no polished PDF equivalent in Profit Pro |

### Risk Management

| Feature | Value Proposition | Complexity | Why This Differentiates |
|---------|-------------------|------------|------------------------|
| Portfolio-level daily loss limit (all robots combined) | Single control across the whole account | Medium | MT5 per-EA only; Profit Pro has partial support |
| Visual risk dashboard (exposure by instrument, by strategy type) | One screen to understand total risk | Medium | No retail B3 platform does this well |
| Consecutive loss counter + auto-pause ("pause after 3 consecutive losses") | Mirrors how discretionary traders think | Medium | Not available in MT5 or Profit Pro natively |
| Rolagem and expiry auto-pause rules | Robot automatically pauses on WIN% and WDO% rollover days | Medium | Very B3-specific; Profit Pro handles it partially |
| Capital allocation per robot (% of account) | Explicit allocation, not implicit via lot size | Medium | Neither MT5 nor Profit Pro surfaces this clearly |

### Portfolio View

| Feature | Value Proposition | Complexity | Comparison |
|---------|-------------------|------------|------------|
| Aggregate equity curve across all robots | "How is my total account doing?" | Medium | MT5 shows account-level equity but not broken down by EA |
| Capital allocation chart (by robot or instrument) | Visualize concentration risk at a glance | Low | Not available in MT5 or Profit Pro |
| Performance attribution (which robot drove today's P&L) | Helps traders know where to focus | Medium | Not available in Profit Pro; MT5 requires manual analysis |
| Portfolio Sharpe vs individual robot Sharpe | Shows diversification benefit clearly | Medium | Unique to this platform in Brazilian retail segment |

### Marketplace (SmartStore)

| Feature | Value Proposition | Complexity | Comparison |
|---------|-------------------|------------|------------|
| Strategy marketplace with audited backtest results (run on Vetor's own engine) | Trust mechanism — buyers see independently verifiable performance data | High | MT5 Market shows vendor-supplied, unaudited stats — major trust problem |
| Demo/sandbox mode before purchase | Try-before-buy reduces friction | Medium | MT5 Market does not have this clearly |
| Strategy subscription model (monthly fee) | Aligns seller incentives with buyer outcomes | Medium | MT5 Market supports one-time and subscription |
| Creator analytics dashboard | Incentivizes strategy creators | High | QuantConnect Alpha has this; MT5 Market offers basic analytics |
| Ranking leaderboard (Sharpe, Win Rate, Drawdown) | Discovery mechanism for buyers | Medium | QuantConnect Alpha has this; MT5 Market has basic sorting only |

---

## Anti-Features

Things that look useful but add complexity without proportional value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Browser-based coding IDE (MQL5/NTSL/Python editor) | Retail algo traders do not want to write code — that is the entire premise of Vetor | Keep strategy config as form-based editors |
| Social copy-trading (auto-copy another user's live trades) | Requires CVM regulatory approval in Brazil; different product category; liability risk | Focus on marketplace (strategy purchase/configuration) not live signal copy |
| Order book / Level 2 visualization | B3 full order book data requires expensive Cedro or BovespaMarketData subscription | Surface price + last trade via MetaAPI tick feed only |
| AI "predict next trade" feature | Technically complex, regulatory grey area, undermines trader trust in their own system | Use AI for parameter suggestions in backtesting, not live prediction |
| Custom indicator builder | Very high complexity, low adoption in retail; creates unbounded support surface | Provide the indicator set needed by the 7 strategy types |
| Paper trading from day one | Full paper-trading engine in Phase 1 adds significant complexity | Ship live-trading Phase 1; add paper trading Phase 2 or 3 |
| Mobile native app (iOS / Android) | Responsive web covers monitoring; trading decisions rarely require native mobile UX | Responsive React web app is sufficient for v1 |

---

## Brazilian Market Specifics

| Feature | B3 Context | Complexity | Where Platforms Fall Short |
|---------|-----------|------------|---------------------------|
| Mini-contract P&L math (WIN%, WDO%, BIT%) | WIN%=R$0.20/pt, WDO%=R$10/pt, BIT%=R$5/pt — must calculate P&L in these units | Low | MT5 handles if configured; web platforms often get it wrong |
| B3 trading hours enforcement | Equity futures: 09:00–17:55 BRT; currency/crypto: until 18:00 | Medium | MT5 timezone handling error-prone; Profit Pro native |
| Rolagem (contract roll) calendar | WIN%/WDO% roll quarterly; BIT% monthly; robots must avoid expiring contracts near expiry | Medium | Profit Pro handles natively; MT5 requires manual management |
| Circuit breaker awareness | B3 triggers trading halts at -10%, -15%, -20% of Ibovespa | High | MT5 does not handle this; Profit Pro does |
| Feriados nacionais e bancários | B3 closed on Brazilian national + São Paulo banking holidays | Medium | MT5 requires manual calendar; Profit Pro native |
| BRL formatting throughout UI | R$ 1.234,56 format — not $1,234.56 | Low | Every non-Brazilian platform fails this |
| Integer lot sizing | Minimum 1 contract, integer lots only — no fractional contracts on B3 | Low | MT5 handles this; web platforms sometimes allow fractional input |
| IRRF / Day Trade tax reporting export | Brazilian traders track day-trade (20% IRRF) vs swing-trade (15%) tax separately | High | No trading platform does this well — strong post-MVP differentiator |
| CME MBT conventions alongside BIT% | MBT = 0.1 BTC/contract, USD margin, CME expiry months | Medium | Unique to this platform's dual-market scope |

---

## Feature Dependencies

```
Authentication
  └─ all features

MetaAPI integration
  └─ Robot execution
       └─ Real-time monitoring
       └─ Risk management enforcement
       └─ Trade log / order history

Robot creation wizard
  └─ Robot editor (all 7 strategy types)
       └─ Robot execution

Backtesting engine (core)
  └─ Single backtest
       └─ Mass backtest / parameter sweep
            └─ Walk-forward analysis
            └─ Batch comparison report
  └─ Monte Carlo simulation (independent)

Robot execution + historical trade data
  └─ Robot report (Sumário + Gráfico)
       └─ Portfolio view (aggregate)
            └─ Marketplace performance cards (audited stats)

Marketplace
  └─ SmartStore purchase flow
       └─ Credit system
```

---

## MVP Recommendation

**Phase 1 — must ship:**
1. Robot list with status, P&L, position summary
2. Robot creation wizard + editors for all 7 strategy types
3. Start / Stop / Pause per robot
4. Active order list + trade log per robot
5. Daily loss limit + max contracts per robot (minimum viable risk)
6. Live equity curve per robot
7. B3 mini-contract P&L math + trading hours + BRL formatting correct throughout

**Phase 2 — must ship:**
1. Single backtest with equity curve + key metrics
2. B3 holiday + rolagem calendar enforcement
3. Portfolio aggregate view (equity curve, P&L attribution)
4. Mass backtest / parameter sweep
5. Circuit breaker detection (correctness concern for B3, not just differentiator)
6. Capital allocation per robot

**Phase 3 / Post-launch:**
- Walk-forward analysis (Very High complexity)
- Monte Carlo simulation (Very High complexity)
- IRRF tax reporting export (High complexity; strong differentiator — must store trade classification from day one)
- Marketplace audited backtest results (requires audit infrastructure)

---

## Competitive Positioning

1. **No coding required.** Profit Pro requires NTSL; MT5 requires MQL5. Vetor's visual strategy editors make algo trading accessible to the 80% of retail traders who cannot program.
2. **B3-native web experience.** Mini-contracts, rolagem, feriados, BRL formatting, circuit breakers — first-class citizens.
3. **Portfolio-level visibility.** MT5 and Profit Pro are robot-by-robot. Vetor aggregates across all robots.
4. **Audited marketplace.** MT5 Market shows vendor-supplied numbers. Vetor's SmartStore shows results run on the platform's own engine.
5. **Risk management built in.** Daily loss limits, drawdown-based auto-stop, consecutive-loss pause — enforced at platform level.

---

## Open Questions

- Current Profit Pro feature set for circuit breaker handling (verify at nelogica.com.br)
- Whether MetaAPI exposes B3 trading session state (halt detection) or if circuit breaker detection requires a separate data source
- Current IRRF rates and whether Receita Federal reporting requirements have changed post-2024
