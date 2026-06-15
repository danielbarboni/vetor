# External Integrations

**Analysis Date:** 2026-06-15

## APIs & External Services

**Charting:**
- **Apache ECharts 5.5.1** — Candlestick + volume charts, dataZoom, markLine, tooltip
  - SDK/Client: CDN `https://cdn.jsdelivr.net/npm/echarts@5.5.1/dist/echarts.min.js` (prototype); install as npm package in production
  - Auth: None required
  - Usage: `blue-hour-design-system/icons/` — chart rendered in `<div id="echart-graf">` on the Gráfico screen

**Fonts:**
- **Google Fonts** — Typography delivery
  - Endpoint: `https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap`
  - Auth: None
  - Families: Sora (display), Inter (body), JetBrains Mono (monospaced numbers)

**Payment (UI Prototype — flows only, no real SDK integrated yet):**
- **Google Pay** — Payment sheet UI prototyped; `payGoogle()` / `gpayConfirm()` handlers in `Plataforma Vetor v3.dc.html` (lines ~4922, ~4924) simulate redirect + approval with 1s timeout; no real Google Pay SDK present
  - In production: integrate Google Pay JS API
- **PIX** — Payment method UI prototyped (QR code placeholder, 10% discount flow); no real PIX API integration present
- **Credit Card** — Card management UI fully prototyped (add/delete/set-default card, installments); no real payment processor SDK present

**Broker (UI Reference Only):**
- **B3 (Brazilian exchange)** — Platform trades BM&F futures (WIN%, WDO%) and BOVESPA equities; broker connection shown in Minha Conta → Corretoras ("vinculação via API"); no real broker API SDK present in prototype
  - Reference text in prototype: "Atlas DTVM · Futuros BM&F · vinculação via API"

## Data Storage

**Databases:**
- Not detected — prototype uses fully synthetic seed data (deterministic seeded arrays in `Plataforma Vetor v3.dc.html` lines ~4502–4584)
- In production: all data lists (robots, ranking, store, videos, orders, plans) must map to API endpoints per README specification

**File Storage:**
- Local filesystem only (prototype)
- Video thumbnails and avatars are placeholders (no real files)
- In production: replace with real media storage (CDN or cloud storage)

**Caching:**
- `localStorage` — Theme/palette persistence via `blue-hour-design-system/palettes.js` (`initTheme`, `setTheme`)
- No other client-side caching

## Authentication & Identity

**Auth Provider:**
- Not detected — no authentication system implemented in prototype
- In production: implement auth (JWT, session, or OAuth) for user account management, plan subscriptions, and broker connections

## Monitoring & Observability

**Error Tracking:**
- Custom inline error collector: `window.__errs` array captures pre-bootstrap errors via `window.addEventListener('error', ...)` in `Plataforma Vetor v3.dc.html` (line ~11)
- No third-party error tracking service (e.g., Sentry) integrated

**Logs:**
- Browser console only (prototype)

## CI/CD & Deployment

**Hosting:**
- Not configured — prototype is a standalone HTML file opened directly in browser

**CI Pipeline:**
- None detected

## Environment Configuration

**Required env vars:**
- None (prototype phase; no server or secrets)

**Secrets location:**
- No secrets present in repository

## Webhooks & Callbacks

**Incoming:**
- None implemented

**Outgoing:**
- None implemented

## Video Platform

**SmarttPlay (internal video library):**
- Admin interface fully prototyped (CRUD for categories and videos in `Plataforma Vetor v3.dc.html`)
- Upload accepts: "link de player embedded (Vimeo, YouTube não listado, CDN própria)" — per prototype hint text
- Video player (RF-SPL-02) not yet implemented — marked as pending in `HANDOFF_TECH_LOG.md`
- In production: integrate with chosen video hosting (Vimeo, self-hosted CDN, or YouTube unlisted)

## Exports

**CSV Export:**
- Client-side `Blob` generation via `URL.createObjectURL` + anchor click
- Format: semicolon-separated (`;`), UTF-8 BOM, pure numeric values (no currency symbol), configurable decimal separator (comma or period), nulls as empty strings
- Files generated: `ordens_<id>.csv`, `ordens_robo.csv`
- Implemented in: `Plataforma Vetor v3.dc.html` helper methods `_csvCell`, `_csvNum`, `_download`

**PDF Export:**
- Client-side via `window.print()` with a dedicated `#__pdfRoot` print element
- `@media print` stylesheet: A4, hides main app, shows report-only layout
- Content: header + patrimony chart (SVG) + 7-metric summary + full report (8 sections)
- Orders table excluded from PDF (exported separately as CSV)
- Implemented in: `Plataforma Vetor v3.dc.html`

---

*Integration audit: 2026-06-15*
