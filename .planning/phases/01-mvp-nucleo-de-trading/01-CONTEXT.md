# Phase 1: MVP — Núcleo de Trading - Context

**Gathered:** 2026-06-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete MVP trading platform from scratch as a production React + FastAPI application. The owner authenticates, creates and configures robots using the Indicadores Técnicos [Tangram 3.0] strategy, executes them against MetaAPI (BTG MT5) for B3 instruments, views real-time robot reports with order history, runs individual backtests, and manages their account and broker linkage.

No existing production code — this phase establishes the entire repository scaffold, frontend, and backend from zero.

</domain>

<decisions>
## Implementation Decisions

### Real-Time Data Architecture

- **D-01:** Live tick data (cotação ao vivo, asset price) flows from MetaAPI WebSocket → FastAPI → **FastAPI WebSocket directly to the React frontend**. The frontend does NOT subscribe to MetaAPI directly.
- **D-02:** Robot state changes (parado → executando, etc.) and all persisted order events flow via **Supabase Realtime** (PostgreSQL → WebSocket). Two-channel model: FastAPI WS = ephemeral high-frequency data; Supabase Realtime = persisted low-frequency events.
- **D-03:** The equity chart on the Sumário screen updates **on each order event** (not tick-by-tick). Equity is reconstructed from the order history + current open position mark.
- **D-04:** The frontend maintains **one shared FastAPI WebSocket connection per authenticated user**, multiplexed by `robot_id` in the message envelope. Multiple active robots share one WS connection.

### Modo Simulado — Execution Engine

- **D-05:** Modo Simulado uses **live MetaAPI tick data** (same real-time feed as Modo Real). It is paper trading, not historical replay — distinct from the backtest (BCK) feature.
- **D-06:** For Simulado, the FastAPI backend uses a **shared system MetaAPI account** (the Vetor platform account) to receive ticks. Users do NOT need to link their own broker account to run a Simulado robot. Broker linkage is only required for Modo Real.
- **D-07:** Fill policies (Pessimista / Moderado / Otimista) are defined in **PRD section 18** — the planner and implementer must read that section. Do not re-derive fill policy logic here.
- **D-08:** Robot **mode is fixed at creation** (Simulado or Real). To "promote" a Simulado robot to Real, the user duplicates it (ROB-05 "Duplicar" action) and selects Real in the wizard. No mode migration in the editor.

### Wizard — Strategy Catalog

- **D-09:** All **7 strategy types are visible** in the wizard catalog (WIZ-02). The 6 non-IT strategies have an "Em breve" badge and a **disabled "+" button** — they cannot be selected to create a robot in Phase 1.
- **D-10:** Only **IT [Tangram 3.0]** is fully selectable and produces a robot with an editable parameter screen.
- **D-11:** "Saiba Mais" modals: **planner's discretion** — if PRD covers the modal content for each strategy, implement per PRD. If not, IT gets a real modal and the others get a minimal placeholder or are omitted.
- **D-12:** Each robot operates on **one asset** (WIN%, WDO%, or BIT%) selected in Step 3 of the wizard. Multi-asset robots are out of scope.
- **D-13:** The wizard is a **fully ephemeral frontend session** — no server state is created until the user completes Step 4 and submits. If the browser is closed mid-wizard, progress is lost and the user starts over. No draft robot cleanup needed.

### Repository Structure & Infrastructure

- **D-14:** **Monorepo in this repository.** New subdirectories: `/frontend` (React + Vite) and `/backend` (FastAPI + Python). The design system remains in `/blue-hour-design-system`. The prototype HTML stays as a read-only reference artifact.
- **D-15:** **Local development without Docker.** Frontend: `npm run dev` (Vite, port 5173). Backend: `uvicorn main:app --reload` (port 8000). Supabase is the hosted service (not local) — developers use a shared dev project or their own Supabase project.
- **D-16:** **Backend deployment:** GitHub Actions → SSH to Vultr VPS São Paulo → `git pull` + `systemctl restart vetor-backend`. Frontend deployment: Cloudflare Pages via git push to main (automatic).
- **D-17:** **Robot execution processes:** each active robot runs as an `asyncio.create_task()` within the FastAPI process. No Celery, no Redis, no subprocess. The task maintains the MetaAPI WebSocket subscription and processes ticks. For Phase 1 (solo owner, few robots), this is sufficient; migration path to a task queue deferred to SaaS phase.

### Claude's Discretion

- "Saiba Mais" modal implementation for non-IT strategies (D-11): implement per PRD if content is specified; otherwise minimal or omitted for Phase 1.
- Internal directory structure within `/frontend` and `/backend` (component organization, router setup, module layout) — follow standard React/FastAPI conventions.
- Exact CORS configuration, environment variable naming, and API versioning prefix — planner defines.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Functional Specification

- `PRD_Plataforma_Robos_Trading_v2.0.md` — Authoritative functional spec (35 sections). Phase 1 critical sections:
  - §5: Authentication flows (AUT-01..06)
  - §8: Robot listing and card UX (ROB-01..07)
  - §9: Robot creation wizard (WIZ-01..06)
  - §10, §12: Robot editor — Indicadores Técnicos [Tangram 3.0], all 14 indicators (EDT-01..04)
  - §18: Robot execution engine + Modo Simulado fill policies (EXE-01..06)
  - §19: Robot report — Sumário (SUM-01..05)
  - §21.1, §21.2, §21.4: Individual backtests (BCK-01..04)
  - §26.1, §26.3, §26.4, §26.5: Minha Conta tabs (CTR-01..04)

### Planning Documents

- `.planning/ROADMAP.md` — Phase 1 goal, 8 success criteria, and requirement IDs
- `.planning/REQUIREMENTS.md` — Full Phase 1 requirement list (AUT, ROB, WIZ, EDT, EXE, SUM, BCK, CTR groups)
- `.planning/PROJECT.md` — Core value, constraints, key decisions, out-of-scope items

### Design Reference

- `Plataforma Vetor v3.dc.html` — High-fidelity prototype; **visual and UX spec only**. Do not port code. Use as screen-by-screen design reference.

### Design System (carry forward to production)

- `blue-hour-design-system/tokens/tokens.css` — CSS custom properties; MUST be imported globally in the React app. Never edit manually (generated by build-tokens.py).
- `blue-hour-design-system/palettes.js` — Theme runtime (ES module); exports `setTheme`, `getTheme`, `initTheme`. Use in production as-is.
- `blue-hour-design-system/tailwind.config.js` — Tailwind config mapping all Blue Hour tokens to utilities; use if Tailwind is adopted in `/frontend`.

### Codebase Maps

- `.planning/codebase/STACK.md` — Technology decisions (fonts, ECharts, design system, build tools)
- `.planning/codebase/ARCHITECTURE.md` — Current prototype architecture and hard constraints (what NOT to port)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `blue-hour-design-system/tokens/tokens.css`: Drop into `/frontend` as the CSS foundation. Import once globally (`main.tsx` or `index.css`). All color, spacing, and typography tokens are here.
- `blue-hour-design-system/palettes.js`: Theme switching runtime. Import in the React app's theme context. `initTheme()` reads/writes localStorage — same API as the prototype.
- `blue-hour-design-system/tailwind.config.js`: Ready-to-use Tailwind config. Copy to `/frontend/tailwind.config.js` if using Tailwind.
- **Apache ECharts 5.5.1**: Used in prototype via CDN. In production, install as npm package (`echarts@5.5.1`). Used for equity curve (Sumário), sparklines (robot cards), and backtest equity chart.
- **Fonts**: Sora (400/600/700), Inter (400/500/600), JetBrains Mono (400/600). Load via Google Fonts in the React app's `<head>`.

### Established Patterns

- **Theme contract**: HTML attributes `data-palette` and `data-theme` on `<html>` drive all theming via CSS custom properties. The React app must maintain this pattern (set on `document.documentElement`).
- **Token immutability**: `tokens.css` is generated — never edit manually. Changes go through `palettes.js` → `python3 blue-hour-design-system/build-tokens.py`.
- **No code from `support.js`**: The dc-runtime is prototype-only. No logic, patterns, or data structures from `support.js` carry forward.

### Integration Points

- React app imports `blue-hour-design-system/tokens/tokens.css` globally.
- ECharts charts must be built as React components wrapping the `echarts` npm package (not CDN).
- Supabase JS client is initialized once — handles auth sessions, Realtime subscriptions, and REST queries.
- FastAPI CORS must allow the Cloudflare Pages domain and `localhost:5173` in dev.

</code_context>

<specifics>
## Specific Ideas

- Simulator badge (Pessimista/Moderado/Otimista) appears on robot cards (ROB-02) and in the Sumário report header (SUM-01) whenever the robot is in Simulado mode.
- Continuous contract rollover (EXE-04): WIN%, WDO%, BIT% resolve to current expiry symbol (e.g., WINF26). FastAPI handles resolution and records the effective contract per order. MetaAPI provides the current front-month contract.
- The robot listing (ROB-01) organizes robots in 3 tabs: EXECUTANDO, PARADOS, ARQUIVADOS. "Rascunho" is a sub-state of PARADO (not a 4th tab) — robots created but with unsaved/invalid parameters appear in PARADOS.
- CSV export of the order list (SUM-04): standard browser download triggered from the frontend; no server-side file generation needed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 1 — MVP: Núcleo de Trading*
*Context gathered: 2026-06-15*
