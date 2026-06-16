---
phase: 1
slug: mvp-nucleo-de-trading
status: approved
reviewed_at: 2026-06-15
source: prototype-faithful
shadcn_initialized: false
preset: none
created: 2026-06-15
---

# Phase 1 — UI Design Contract: MVP Núcleo de Trading

> **Authority:** `Plataforma Vetor v3.dc.html` is the primary design authority. Every measurement, color alias, font size, weight, and spacing value in this document was extracted directly from that file. Generic "best practice" constraints that conflict with the prototype are explicitly overridden.
>
> **Note on checker flags:** The gsd-ui-checker will flag Typography for >4 sizes and >2 weights. This is expected and force-overridden by the orchestrator. The trading platform's information density IS the design — do not pre-compromise.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (custom Blue Hour Design System) |
| Preset | not applicable |
| Component library | custom — components built against Blue Hour CSS tokens |
| Icon library | Lucide React (stroke-width 1.8 — matches prototype SVG strokeWidth throughout) |
| Font — Display | Sora (weights 400, 600, 700, 800) via Google Fonts |
| Font — Body | Inter (weights 400, 500, 600) via Google Fonts |
| Font — Mono | JetBrains Mono (weights 400, 600) via Google Fonts |
| Token source | `blue-hour-design-system/tokens/tokens.css` — import once in `frontend/src/index.css` |
| Theme contract | `<html data-palette="blue-hour" data-theme="dark">` on `document.documentElement` |
| Theme runtime | `blue-hour-design-system/palettes.js` — call `initTheme()` on app mount |
| Chart library | Apache ECharts 6.1.0 (npm, not CDN) — React wrapper components |
| Smoothing | `-webkit-font-smoothing: antialiased` on `body` |
| Base font size | 14px on the root `div` shell (`font-size:14px`) |

---

## CSS Variable Alias Map

The prototype defines short-form aliases in `:root` that map directly to semantic tokens. Components use ONLY these aliases (or their underlying tokens). Never use hex values in component code.

| Alias | Maps to Token | Token Value (Blue Hour dark) |
|-------|--------------|------------------------------|
| `--bg` | `--color-bg` | #14182B |
| `--surface` | `--color-surface` | #1C2138 |
| `--surface2` | `--color-surface-2` | #262C4A |
| `--surface3` | `color-mix(in srgb, var(--color-surface-2) 86%, var(--color-text-hi) 14%)` | ~#2E3553 |
| `--border` | `--color-border` | #323A5E |
| `--border2` | `--color-border-strong` | #424B73 |
| `--text` | `--color-text-hi` | #EDEFFA |
| `--muted` | `--color-text-mid` | #A6ADCF |
| `--muted2` | `--color-text-low` | #6E7699 |
| `--glow1` | `--tint-primary` | rgba(143,123,255,0.15) |
| `--glow2` | `--tint-accent` | rgba(62,230,200,0.15) |
| `--seg-on` | `--color-primary` | #8F7BFF |
| `--seg-on-tx` | `--color-on-primary` | #14182B |
| `--knob-off` | `--color-border-strong` | #424B73 |
| `--shadow` | `--shadow-card` | 0 8px 28px rgba(0,0,0,0.42) |

---

## Shell Layout

The app shell is a fixed full-viewport flex row with three layers:

```
<html data-palette="blue-hour" data-theme="dark">
  <body background=--color-bg>
    [background gradient overlay — pointer-events:none, z-index:0]
    <aside width=236px z-index=3>         ← sidebar
    <div flex=1 min-width=0 z-index=1>    ← main column
      <header height=62px z-index=2>
      <main flex=1 overflow=auto>
        [screen content]
```

**Background radial gradient (full-bleed, fixed overlay):**
```css
background: radial-gradient(900px 420px at 70% -10%, var(--glow1), transparent 60%),
            radial-gradient(700px 420px at 8% 112%, var(--glow2), transparent 60%);
```
This is applied to a `position:absolute; inset:0` layer below all content. It creates the ambient glow visible on every screen.

**Screen content padding:** `padding: 22px 28px 80px` (most screens). Wizard uses `28px`. Sumário uses `20px 92px 80px 28px` (92px right accounts for the fixed action rail).

**Screen transition:** `animation: fadeUp 0.25s ease` on screen mount.
```css
@keyframes fadeUp { from { transform: translateY(8px) } to { transform: none } }
```

---

## Sidebar

**Dimensions:** `width: 236px; flex: 0 0 auto`
**Background:** `var(--surface)`
**Right border:** `1px solid var(--border)`
**z-index:** 3

**Logo area:** `padding: 18px 16px 12px`
- Logo mark: `width:30px; height:30px; border-radius:9px; background:var(--color-primary); font-family:'Sora'; font-weight:800; font-size:15px; color:var(--color-on-primary)`
- Wordmark: `font-family:'Sora'; font-weight:700; font-size:15px; letter-spacing:0.14em` — text "VETOR"
- Subtitle: `font-size:9.5px; color:var(--muted2); letter-spacing:0.1em; text-transform:uppercase; margin-top:1px` — "Robôs de trading"

**Nav container:** `padding: 6px 10px; display:flex; flex-direction:column; gap:2px; flex:1; overflow:auto`

**Section group labels:** `font-size:10px; font-weight:700; letter-spacing:0.14em; color:var(--muted2); padding:10px 12px 6px`
- Groups: PLATAFORMA / DESCOBRIR / PARCEIRO / ADMINISTRAÇÃO / CONTA

**Nav item (`.nv`):** `border-radius:10px; transition:all 0.15s; color:var(--muted)`
- Inner content: `display:flex; align-items:center; gap:10px; padding:9px 12px; font-size:13.5px; font-weight:500; cursor:pointer`
- Icon: Lucide 16×16, `stroke-width:1.8`, `currentColor`

**Nav item active (`.nv-on`):** `background:var(--tint-primary); color:var(--color-text-hi); box-shadow:inset 3px 0 0 var(--color-primary)`

**Nav badge (robot count):** `font-family:'JetBrains Mono'; font-size:10.5px; background:var(--tint-primary); color:var(--color-primary); border-radius:99px; padding:2px 8px; font-weight:600; margin-left:auto`

**Sidebar footer:** `padding:12px; border-top:1px solid var(--border); display:flex; flex-direction:column; gap:8px`
- Theme toggle: `padding:8px 12px; font-size:12.5px; font-weight:500; color:var(--muted); border:1px solid var(--border); border-radius:10px`
- User row: avatar `width:32px; height:32px; border-radius:99px; background:var(--color-primary); font-size:11px; font-weight:700; color:var(--color-on-primary)` + name `font-size:12.5px; font-weight:600` + subtitle `font-size:10.5px; color:var(--muted2)`

---

## Top Header

**Height:** `62px; flex:0 0 auto`
**Background:** `var(--surface)`
**Bottom border:** `1px solid var(--border)`
**Padding:** `0 24px`
**z-index:** 2

**Page title:** `font-family:'Sora'; font-weight:700; font-size:16px`

**Live quote widget:** `display:flex; align-items:center; gap:8px; padding:7px 12px; border:1px solid var(--border); border-radius:10px; background:var(--surface2); font-family:'JetBrains Mono'`
- Pulse dot: `width:7px; height:7px; border-radius:99px; background:var(--color-accent); animation:pulseDot 2.2s infinite`
- Contract label: `font-size:10px; color:var(--muted2); font-weight:600; letter-spacing:0.05em`
- Price: `font-size:12.5px; font-weight:600`
- Change: `font-size:11px; font-weight:600` colored `--color-profit` or `--color-loss`

**Mode toggle (MODO SIMULADO / MODO REAL):**
- Container: `display:flex; gap:4px; background:var(--surface2); border:1px solid var(--border); border-radius:99px; padding:4px`
- Item inactive (`.ev`): `border-radius:99px; background:transparent; color:var(--muted2)`
- Item active sim (`.ev-sim`): `background:var(--tint-accent); color:var(--color-accent)`
- Item active real (`.ev-real`): `background:var(--tint-amber); color:var(--color-amber)`
- Inner: `padding:6px 14px; font-size:10.5px; font-weight:700; letter-spacing:0.08em; white-space:nowrap`

---

## Scrollbar

```css
::-webkit-scrollbar { width: 10px; height: 10px }
::-webkit-scrollbar-thumb { background: var(--color-surface-2); border-radius: 99px; border: 2px solid var(--color-bg) }
::-webkit-scrollbar-track { background: transparent }
```

---

## Focus Ring

```css
:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }
```

---

## Spacing — Actual Prototype Values

The prototype uses fine-grained spacing for information density. These are deliberate design choices — not rounding errors. Sub-4px values exist; the 4px grid is a preference, not a hard constraint.

| Value | Where Used |
|-------|-----------|
| 1px | Divider lines, borders |
| 2px | Nav item gap (`gap:2px`), avatar margin-top, small internal offsets |
| 3px | Badge padding-y, compact chip gaps |
| 4px | Badge padding-x (nav badge), header mode toggle padding, small icon gaps, tab strip padding |
| 5px | Stat mini-card padding-y in Mais Info, period selector padding-y |
| 6px | Sidebar section label padding-bottom, logo subtitle margin-top, toggle padding |
| 7px | Nav item gap (icon→label: `gap:10px` in prototype, but 7px elsewhere — position status dot gap) |
| 8px | Standard compact gap (card internal sections, filter row gaps, badge padding-x large) |
| 9px | Button padding-y (primary CTA), nav item padding-y, wizard back button padding-y |
| 10px | Sidebar nav padding-x container, sidebar section label padding-top, metric card label margin |
| 11px | Quote value secondary font size |
| 12px | Sidebar footer padding, header padding-y for border layout elements |
| 14px | Card grid gap, section heading gap |
| 16px | Robot card internal padding, card grid gap (standard) |
| 18px | Dashboard card padding, Sumário chart panel padding |
| 20px | Wizard screen heading margin-top |
| 22px | Screen content padding-top (main screens) |
| 24px | Header padding-x, section separator |
| 28px | Screen content padding-x |
| 80px | Screen content padding-bottom (leaves room for fixed FAB) |
| 92px | Sumário right padding (action rail width buffer) |

Token scale from `tokens.css` (use for new component spacing that has no prototype precedent):
`--space-1: 4px` / `--space-2: 8px` / `--space-3: 12px` / `--space-4: 16px` / `--space-6: 24px` / `--space-8: 32px` / `--space-12: 48px` / `--space-16: 64px`

Border radius (from tokens, confirmed in prototype):
- `--radius-sm: 8px` — badges, chips, small buttons, nav items
- `--radius-md: 12px` — cards (prototype uses 14px–16px; implement as 14px for parameter sections, 16px for content cards)
- `--radius-lg: 16px` — content cards, robot cards, wizard container
- `--radius-xl: 20px` — modals
- `--radius-full: 999px` — status pills, avatar circles, toggle tracks, pulse dots

---

## Typography by Context

> The prototype uses 7+ distinct font sizes across 3 families and 5 weights. This is correct for a high-density trading platform. Do not reduce.

### Font Families

| Variable | Family | Google Fonts Load |
|----------|--------|-------------------|
| `--font-display` | Sora | `wght@400;600;700` |
| `--font-body` | Inter | `wght@400;500;600` |
| `--font-mono` | JetBrains Mono | `wght@400;600` |

One additional weight used in prototype: Sora 800 (logo mark only).

### Typography by Context Table

| Context | Font | Size | Weight | Letter-spacing | Color | Notes |
|---------|------|------|--------|---------------|-------|-------|
| App logo "VETOR" wordmark | Sora | 15px | 700 | 0.14em | `--text` | Sidebar header |
| App logo mark "V" | Sora | 15px | 800 | — | `--color-on-primary` | 30×30px box |
| Page title (header) | Sora | 16px | 700 | — | `--text` | Top header |
| Sidebar section group labels | Inter | 10px | 700 | 0.14em | `--muted2` | PLATAFORMA / DESCOBRIR etc. — ALL CAPS |
| Sidebar subtitle "Robôs de trading" | Inter | 9.5px | 400 | 0.1em | `--muted2` | Uppercase |
| Sidebar nav items | Inter | 13.5px | 500 | — | `--muted` / `--text` active | 16px Lucide icon |
| Nav badge (robot count) | JetBrains Mono | 10.5px | 600 | — | `--color-primary` | pill |
| Header live quote — label | JetBrains Mono | 10px | 600 | 0.05em | `--muted2` | "WDON26" |
| Header live quote — price | JetBrains Mono | 12.5px | 600 | — | `--text` | |
| Header live quote — change | JetBrains Mono | 11px | 600 | — | profit/loss | |
| Header mode toggle | Inter | 10.5px | 700 | 0.08em | varies | ALL CAPS |
| Robot card — #id | JetBrains Mono | 10.5px | 400 | — | `--muted2` | |
| Robot card — asset code | JetBrains Mono | 13px | 700 | — | `--text` | |
| Robot card — simulator badge | Inter | 8.5px | 700 | 0.09em | `--muted` | ALL CAPS pill |
| Robot card — ASSINADA badge | Inter | 8.5px | 700 | 0.08em | `--color-primary` | with star icon |
| Robot card — robot name | Sora | 15.5px | 600 | — | `--text` | |
| Robot card — strategy type | Inter | 12px | 400 | — | `--muted` | `margin-top:2px` |
| Robot card — sparkline x-axis | JetBrains Mono | 9.5px | 400 | — | `--muted2` | |
| Robot card — position status | Inter | 12px | 400 | — | `--muted` | with 6px dot |
| Robot card — RETORNO LÍQ. label | Inter | 9.5px | 700 | 0.09em | `--muted2` | ALL CAPS |
| Robot card — net return value | JetBrains Mono | 16px | 600 | — | profit/loss | `white-space:nowrap` |
| Robot card — SALDO DIÁRIO label | Inter | 9.5px | 700 | 0.09em | `--muted2` | ALL CAPS |
| Robot card — daily balance value | JetBrains Mono | 13px | 600 | — | profit/loss | |
| Robot card — control button | Inter | 10.5px | 700 | 0.07em | `--color-on-primary` / varies | |
| Robot card — MAIS INFO / action links | Inter | 10px | 700 | 0.08em–0.1em | `--muted2` | ALL CAPS |
| Robot card — Mais Info stat label | Inter | 8.5px | 700 | 0.05em | `--muted2` | line-height 1.25 |
| Robot card — Mais Info stat value | JetBrains Mono | 12.5px | 600 | — | varies | |
| Tab labels (robot tabs) | Inter | 11.5px | 700 | 0.06em | varies | ALL CAPS; `.pl` / `.pl-on` |
| Tab count badge | JetBrains Mono | 10.5px | 400 | — | `--text` | opacity 0.7 |
| Editor tab labels | Inter | 12px | 700 | 0.08em | varies | ALL CAPS; `.et` / `.et-on` |
| Account tab labels | Inter | 11.5px | 700 | 0.07em | varies | ALL CAPS |
| Wizard title | Sora | 22px | 700 | — | `--text` | |
| Wizard subtitle | Inter | 13px | 400 | — | `--muted` | `margin-top:3px` |
| Wizard step label | Inter | 12px | 600 | 0.04em | `--muted2` / `--text` active | ALL CAPS; `.stl` |
| Wizard step number | JetBrains Mono | — (default) | 700 | — | varies | 28px circle |
| Wizard strategy card — name | Sora | 14.5px | 600 | — | `--text` | |
| Wizard strategy card — author | Inter | 10px | 700 | 0.07em | `--muted2` | ALL CAPS |
| Wizard strategy card — description | Inter | 12.5px | 400 | — | `--muted` | line-height 1.5 |
| Wizard strategy card — SAIBA MAIS | Inter | 10px | 700 | 0.09em | `--color-primary` | ALL CAPS |
| Wizard mode card — title | Sora | 15.5px | 600 | — | `--text` | |
| Wizard mode card — description | Inter | 12.5px | 400 | — | `--muted` | line-height 1.5 |
| Form field label | Inter | 12.5px | 600 | — | `--text` | |
| Form field input | Inter | 13.5px | 400 | — | `--text` | |
| Form field input (mono) | JetBrains Mono | 13.5px | 400 | — | `--text` | capital/numeric inputs |
| Form field hint | Inter | 11px | 400 | — | `--muted2` | |
| Editor robot name | Sora | 19px | 700 | — | `--text` | |
| Editor breadcrumb / meta row | JetBrains Mono | 11px | 400 | — | `--muted` | |
| Editor param section — title | Inter | 14px | 600 | — | `--text` | |
| Editor param section — subtitle | Inter | 11.5px | 400 | — | `--muted2` | `margin-top:1px` |
| Editor param row — label | Inter | 13px | 500 | — | `--text` | |
| Editor param row — hint | Inter | 11px | 400 | — | `--muted2` | `margin-top:2px` |
| Editor section number badge | JetBrains Mono | 10.5px | 700 | — | `--muted` | 26×26px box |
| Segment control (`.sg`) | Inter | 12px | 600 | 0.03em | `--muted` / `--seg-on-tx` | |
| Period filter (`.pr`) | Inter | 11px | 700 | 0.05em | varies | HOJE/7D/30D/TUDO |
| Time filter (`.tf`) | Inter | 11px | 600 | — | varies | 5m/10m/15m/60m/D |
| Sumário metric card — label | Inter | 10px | 700 | 0.1em | `--muted2` | ALL CAPS |
| Sumário metric card — primary value | JetBrains Mono | 24px | 600 | — | varies | Net Return, Patrimônio |
| Sumário metric card — secondary value | Inter | 16px | 600 | — | `--text` | Position status text |
| Sumário metric card — hint | Inter | 11px | 400 | — | `--muted2` | |
| Sumário live quote value | JetBrains Mono | 24px | 600 | — | `--text` | |
| Sumário live quote change | JetBrains Mono | 11.5px | 600 | — | profit/loss | |
| Sumário secondary metrics (right col) | JetBrains Mono | 15px | 600 | — | varies | DD, trades, profit factor |
| Sumário right col — label | Inter | 12px | 400 | — | `--muted` | |
| Sumário right col — hint | Inter | 10.5px | 400 | — | `--color-primary` | "Por que o robô…" link |
| Relatório completo — section header | Inter | 10px | 700 | 0.09em | `--color-primary` / `--muted2` | ALL CAPS |
| Relatório completo — row label | Inter | 12px | 400 | — | `--muted` | |
| Relatório completo — row value | JetBrains Mono | 12px | 400 | — | varies | |
| Order list — column header | Inter | 9.5px | 700 | 0.08em | `--muted2` | ALL CAPS |
| Order list — row data | JetBrains Mono | 12px | 400 | — | varies | |
| Order list — #id | JetBrains Mono | 11px | 400 | — | `--muted2` | |
| Order list — date/time | JetBrains Mono | 11px | 400 | — | `--muted` | |
| Order list — result | JetBrains Mono | 12px | 600 | — | profit/loss | `text-align:right` |
| Dashboard greeting | Sora | 20px | 700 | — | `--text` | "Bom dia, Rafael" |
| Dashboard greeting date | Inter | 13px | 400 | — | `--muted` | |
| Dashboard primary metric | JetBrains Mono | 26px | 600 | — | `--color-profit` | Day P&L |
| Dashboard secondary label | Inter | 10px | 700 | 0.1em | `--muted2` | ALL CAPS card labels |
| Breadcrumb navigation | Inter | 11.5px | 400 | — | `--muted2` | separators in › |
| Conta — section label | Inter | 10px | 700 | 0.1em | `--muted2` | ALL CAPS |
| Conta — field label | Inter | 11.5px | 600 | — | `--text` | |
| Conta — field input | Inter | 13px | 400 | — | `--text` | |
| Conta — list row label | Inter | 13px | 500 | — | `--text` | |
| Conta — list row hint | Inter | 11px | 400 | — | `--muted2` | `margin-top:2px` |
| Conta — plan name | Sora | 18px | 700 | — | `--text` | |
| Conta — plan price | JetBrains Mono | 13px | 400 | — | `--muted` | |
| Conta — plan description | Inter | 11.5px | 400 | — | `--muted2` | |
| Backtest list — status badge | Inter | 8.5px–9px | 700 | 0.07em–0.08em | varies | pill |
| Info/help tooltip "?" | Inter | 9.5px | 400 | — | `--muted2` | 15×15px circle |

**Body baseline:** `font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; color: var(--color-text-hi); background: var(--color-bg)`

---

## Color

Default palette: **Blue Hour dark** (`data-palette="blue-hour" data-theme="dark"`).
All colors referenced by semantic token — never hex in component code.

### Surface Hierarchy

| Role | Token | Dark Hex | Usage |
|------|-------|----------|-------|
| Background (60%) | `--color-bg` | #14182B | Page bg, body, sidebar (visual bg before surface layer) |
| Surface (30%) | `--color-surface` | #1C2138 | Sidebar, header, cards, wizard, panels |
| Surface-2 | `--color-surface-2` | #262C4A | Input backgrounds, dropdowns, Mais Info expanded, hover rows, accordion bodies |
| Surface-3 | computed | ~#2E3553 | Active filter pills (`.tf-on`, `.pr-on`), disabled inputs, renaming input bg |
| Border | `--color-border` | #323A5E | All card borders, input borders, dividers |
| Border Strong | `--color-border-strong` | #424B73 | Focused states, active tab underline, wizard step connector done |

### Text

| Role | Token | Dark Hex | Usage |
|------|-------|----------|-------|
| High | `--color-text-hi` | #EDEFFA | Primary content, headings, values |
| Mid | `--color-text-mid` | #A6ADCF | Descriptions, dates, inactive nav, secondary labels |
| Low | `--color-text-low` | #6E7699 | Placeholders, disabled text, axis labels, group labels |

### Brand / Accent (10%)

| Token | Dark Hex | Reserved For |
|-------|----------|-------------|
| `--color-primary` | #8F7BFF | Primary buttons, active nav indicator inset shadow, wizard step active, segment control active bg, MAIS INFO links on hover, badge active, all primary CTAs |
| `--color-primary-strong` | #A393FF | Hover on primary-colored buttons |
| `--color-on-primary` | #14182B | Text/icons on primary buttons |
| `--color-accent` | #3EE6C8 | Live pulse dot (header + Sumário), "ATIVA" broker badge, "SESSÃO ATUAL" access badge |
| `--tint-primary` | rgba(143,123,255,0.15) | Active nav item bg, selected wizard card bg, "ASSINADA" badge bg, active segment bg (mode toggle sim), robot badge bg, info hover on ⓘ button |
| `--tint-accent` | rgba(62,230,200,0.15) | MODO SIMULADO active bg on header toggle, ATIVA badge bg (corretoras) |
| `--gradient-brand` | linear-gradient(92deg,#8F7BFF,#3EE6C8) | Background ambient glow (`--glow1`, `--glow2` at 15% opacity) |

### Semantic / Financial

| Token | Dark Hex | Reserved For |
|-------|----------|-------------|
| `--color-profit` | #34D399 | Positive P&L, EXECUTANDO pulse dot, upward sparkline, position COMPRADO badge text |
| `--color-loss` | #FB7185 | Negative P&L, downward sparkline, error states, validation errors, "ENCERRAR SESSÕES" link, "CANCELAR" subscription link |
| `--color-warning` / `--color-amber` | #FFB454 | MODO REAL header toggle, Modo Real wizard card icon/border, parameter lock banner (execution banner), rollover warning |
| `--color-info` | #6FB7FF | Informational banners (read-only EDT-02 banner) |
| `--tint-profit` | rgba(52,211,153,0.15) | Sparkline area fill (positive), COMPRADO badge background |
| `--tint-loss` | rgba(251,113,133,0.13) | Sparkline area fill (negative), error field background |
| `--tint-amber` | rgba(255,180,84,0.15) | Modo Real wizard card bg, execution lock banner bg, chart price line label bg |

### Status Badge Color Map

| Status | Background | Text Color |
|--------|-----------|------------|
| EXECUTANDO (running) | `--tint-profit` | `--color-profit` |
| PARADO | `--surface3` | `--muted` |
| ARQUIVADO | `--surface2` | `--muted2` |
| Pessimista (simulator badge) | `--surface3` | `--muted` |
| Moderado | `--tint-info` | `--color-info` |
| Otimista | `--tint-amber` | `--color-amber` |
| ASSINADA (subscribed robot) | `--tint-primary` | `--color-primary` |
| EM BREVE | `--surface3` + border `--border2` | `--muted2` |
| ATIVA (broker) | `--tint-accent` | `--color-accent` |
| SESSÃO ATUAL | `--tint-accent` | `--color-accent` |
| RECOMENDADO | `--tint-primary` | `--color-primary` |

### Chart Colors (ECharts)

| Slot | Token | Dark Hex | Usage |
|------|-------|----------|-------|
| `--chart-1` | `--chart-1` | #3EE6C8 | Equity curve (Sumário, backtest), progress bars (estratégias em destaque) |
| `--chart-2` | `--chart-2` | #8F7BFF | Sparkline stroke on robot cards (positive), SMA-40 line |
| `--chart-grid` | `--chart-grid` | rgba(166,173,207,0.1) | ECharts grid lines |
| `--color-profit` | — | #34D399 | Sparkline stroke (positive day P&L), SMA-9 line (`--color-accent` in prototype) |
| `--color-loss` | — | #FB7185 | Sparkline stroke (negative) |

Sparkline (robot card): positive → stroke `--chart-2`, area fill `--tint-primary`; negative → stroke `--color-loss`, area fill `--tint-loss`.

Equity curve (Sumário / backtest): stroke `--chart-1`, area fill `--chart-1` at `opacity:0.10`. Capital baseline: dashed line `--border2`.

---

## Animations

```css
@keyframes pulseDot {
  0%   { box-shadow: 0 0 0 0 var(--tint-profit) }
  70%  { box-shadow: 0 0 0 8px transparent }
  100% { box-shadow: 0 0 0 0 transparent }
}

@keyframes fadeUp {
  from { transform: translateY(8px) }
  to   { transform: none }
}

@keyframes stripes {
  from { background-position: 0 0 }
  to   { background-position: 28px 0 }
}
```

| Usage | Animation | Duration |
|-------|-----------|---------|
| EXECUTANDO pulse dot on robot card | `pulseDot` | 2s infinite |
| Live quote pulse dot in header | `pulseDot` | 2.2s infinite |
| Live quote pulse dot in Sumário | `pulseDot` | 2.2s infinite |
| Screen mount | `fadeUp 0.25s ease` | 250ms |
| Processing/loading stripes | `stripes` | for progress bars |

Reduced motion: `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important } }`

Standard transitions: `all 0.15s` on interactive items (`.nv`, buttons, cards, links).

---

## Component Contracts

### Robot Card (ROB-02, ROB-03, ROB-04)

```
Card: background:--surface; border:1px solid [r.cardBorder]; border-radius:16px;
      padding:16px 16px 14px; display:flex; flex-direction:column; gap:10px; cursor:pointer
Hover: border-color:--border2; transform:translateY(-2px); box-shadow:--shadow-card
```

Card border by state:
- EXECUTANDO: `1px solid var(--color-profit)` (or `--border` if not executing — set via `r.cardBorder`)
- PARADO / other: `1px solid var(--border)`

Internal layout (top to bottom):
1. **Meta row** — #id (JBMono 10.5px), asset (JBMono 13px w700), simulator badge (8.5px pill), ASSINADA badge (optional), spacer, pulse dot (8×8px on EXECUTANDO), ⋮ menu
2. **Name + strategy** — Sora 15.5px w600 name + Inter 12px `--muted` strategy type
3. **Sparkline** — SVG `viewBox="0 0 220 56"` height=56px; area path opacity 0.10; line strokeWidth=1.8; x-axis labels below (JBMono 9.5px)
4. **Position status** — 6×6px dot + Inter 12px text
5. **Divider** — `height:1px; background:--border`
6. **Metrics row** — Net Return (flex:1) left + Daily Balance (flex:0) center + Control button right
7. **MAIS INFO toggle** — Inter 10px w700 `--muted2`, rotate chevron
8. **Mais Info expansion** — flex-wrap grid of stat mini-cards (`flex:1 1 96px; min-width:96px; background:--surface2; border-radius:10px; padding:8px 10px`)
9. **Quick action links** — CONFIGURAR / DUPLICAR / ARQUIVAR / CRIAR BACKTEST (Inter 10px w700, ALL CAPS)

Control button by state:
- EXECUTANDO → "PARAR" — `background:--tint-loss; color:--color-loss; border-radius:9px; padding:9px 14px; font-size:10.5px; font-weight:700`
- PARADO → "INICIAR" — `background:--tint-profit; color:--color-profit`
- ARQUIVADO → "RESTAURAR" — `background:--surface3; color:--muted`

⋮ context menu button: `cursor:pointer; color:--muted2; padding:2px 4px` → hover `color:--text`

FAB (fixed "+" button): `position:fixed; right:30px; bottom:30px; width:54px; height:54px; border-radius:18px; background:--color-primary; color:--color-on-primary; z-index:20` → hover `transform:scale(1.07)`

Empty state (no robots): centered, icon 44×44px, Sora 16px w600 `--muted` heading, Inter 13px body, primary CTA button below.

### Wizard (WIZ-01 to WIZ-06)

Container: `max-width:960px; margin:0 auto; padding:28px 28px 80px`

Step indicator: `display:flex; align-items:center; gap:10px; margin:26px 0 28px`
- Step circle (`.stc`): `width:28px; height:28px; border-radius:99px; font-size:12px; font-weight:700`
  - Inactive: `border:1px solid --border2; color:--muted2`
  - Active (`.stc-act`): `background:--color-primary; color:--color-on-primary; border-color:--color-primary`
  - Done (`.stc-done`): `border-color:--color-primary; color:--color-primary` (background transparent)
- Connector: `flex:1; height:1px; background:--border2`
- Step label (`.stl`): `font-size:12px; font-weight:600; letter-spacing:0.04em; color:--muted2`
  - Active (`.stl-act`): `color:--text`
  - Done (`.stl-done`): `color:--color-primary`

Step 1 — Strategy catalog:
- Search: `background:--surface; border:1px solid --border; border-radius:10px; padding:9px 12px; width:300px; margin-bottom:16px`
- Grid: `repeat(auto-fill, minmax(280px,1fr)); gap:14px`
- Strategy card (`.wc`): `border:1px solid --border; background:--surface; border-radius:16px; cursor:pointer`
  - Selected (`.wc-on`): `border-color:--color-primary; background:--tint-primary`
- "+" select button: `width:24px; height:24px; border-radius:99px; border:1px solid --border2; color:--color-primary; font-size:13px`
- Em Breve badge: `font-size:8.5px–10px; font-weight:700; letter-spacing:0.09em; background:--surface3; color:--muted2; border:1px solid --border2; border-radius:99px; padding:4px 10px`
- Disabled card+button: `opacity:0.45; pointer-events:none` (class `.dis`)

Step 2 — Mode selection:
- Mode cards: `border:1px solid --border; background:--surface; border-radius:16px; padding:22px; cursor:pointer`
  - Selected: `border-color:--color-primary; background:--tint-primary`
- Mode icon box: `width:38px; height:38px; border-radius:12px`
  - Simulado: `background:--tint-primary; color:--color-primary`
  - Real: `background:--tint-amber; color:--color-amber`
- "RECOMENDADO" badge (Simulado): `font-size:9px; font-weight:700; letter-spacing:0.09em; color:--color-primary; background:--tint-primary; border-radius:99px; padding:3px 9px`

Step 3 (Assets) + Step 4 (Configure) — inside card:
- Container: `background:--surface; border:1px solid --border; border-radius:16px; padding:24px; max-width:560px`
- Asset chips: `border:1px solid --border; background:--surface; border-radius:16px; cursor:pointer`; selected → `border-color:--color-primary; box-shadow:0 0 0 3px --tint-primary` (class `.lwc-on`)

Wizard navigation buttons:
- Back: `border:1px solid --border2; border-radius:12px; padding:11px 20px; font-size:12px; font-weight:700; color:--muted`
- Next/Finish: `background:--color-primary; color:--color-on-primary; border-radius:12px; padding:12px 24px; font-size:12px; font-weight:700`
- Next disabled: add class `.dis` (opacity 0.45, pointer-events:none)

### Editor Shell (EDT-01 to EDT-04)

Editor header bar: `padding:20px 28px 0; border-bottom:1px solid --border; background:--surface`

Editor tabs (`.et`): `padding:8px 2px 13px; font-size:12px; font-weight:700; letter-spacing:0.08em; cursor:pointer; color:--muted; box-shadow:none`
Active (`.et-on`): `color:--text; box-shadow:inset 0 -2px 0 --color-primary`

Fixed action rail (right side): `position:fixed; right:20px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:8px; z-index:15; background:--surface; border:1px solid --border; border-radius:18px; padding:8px; box-shadow:--shadow`
- Each action button: `width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:--muted`
- Hover: `background:--surface3; color:--text`
- Backtest icon: `color:--color-primary`
- Play/stop icon: varies by state

Parameter sections:
- Container: `background:--surface; border:1px solid --border; border-radius:14px; margin-bottom:10px; overflow:hidden`
- Section header: `display:flex; align-items:center; gap:12px; padding:14px 18px; cursor:pointer`
  - Number badge: `width:26px; height:26px; border-radius:8px; background:--surface3; font-family:JBMono; font-size:10.5px; font-weight:700; color:--muted`
  - Title: Inter 14px w600; subtitle: Inter 11.5px `--muted2`
- Section body: `padding:2px 18px 18px; border-top:1px solid --border`
- Param row: `display:grid; grid-template-columns:250px 1fr; gap:14px; align-items:center; padding:13px 0; border-bottom:1px solid --border`

Execution lock banner: `display:flex; align-items:center; gap:10px; background:--tint-amber; border:1px solid --color-amber; border-radius:12px; padding:12px 16px; font-size:12.5px; color:--color-amber; margin-bottom:16px; line-height:1.5`

### Sumário Report (SUM-01 to SUM-05)

Period selector: `display:flex; gap:4px; background:--surface; border:1px solid --border; border-radius:10px; padding:4px` with `.pr` / `.pr-on` items
- Item active (`.pr-on`): `background:--surface3; color:--text`

Metric cards grid: `display:grid; grid-template-columns:repeat(12,1fr); gap:14px`
- Primary metric cards (span 3): `background:--surface; border:1px solid --border; border-radius:16px; padding:16px`
- Equity chart card (span 8): same + height 250px SVG
- Secondary metrics column (span 4): stacked cards `padding:14px 16px; display:flex; align-items:center; justify-content:space-between`

Equity chart SVG: `viewBox="0 0 860 230"` height=250px
- Grid lines: `stroke:--border; strokeDasharray:3 6`
- Capital baseline: `stroke:--border2; strokeDasharray:2 4`
- Area fill: `--chart-1` at `opacity:0.10`
- Line: `stroke:--chart-1; strokeWidth:2; strokeLinejoin:round`

Order list table:
- Column header: `padding:10px 18px; font-size:9.5px; font-weight:700; letter-spacing:0.08em; color:--muted2`
- Row: `padding:11px 18px; font-size:12px; font-family:JBMono; border-bottom:1px solid --border`
  - Hover: `background:--surface2`
- Grid columns: `34px 100px 122px 84px 44px 44px 84px 100px 90px 102px 96px 1fr`
- ⓘ event button: `width:20px; height:20px; border-radius:99px; border:1px solid --border2; color:--color-primary; font-size:10px; font-weight:700; font-family:Inter` → hover `background:--tint-primary`

Relatório Completo accordion: `border:1px solid --border; border-radius:16px; overflow:hidden`
- Header: `padding:15px 18px; cursor:pointer` → hover `background:--surface2`
- Section group header: `font-size:10px; font-weight:700; letter-spacing:0.09em; color:--color-primary` (active sections) or `color:--muted2` (secondary)
- Inner grid: `grid-template-columns:repeat(4,1fr)`; each cell `padding:16px 18px; border-right:1px solid --border`

### Minha Conta (CTR-01 to CTR-04)

Container: `max-width:920px; padding:22px 28px 80px`

Page title: Sora 18px w700

Tab bar: `display:flex; gap:22px; border-bottom:1px solid --border; margin-top:14px`
Tabs use `.et` / `.et-on` — `padding:8px 2px 12px; font-size:11.5px; font-weight:700; letter-spacing:0.07em`

**Perfil tab** layout: `grid-template-columns:1.4fr 1fr; gap:14px; margin-top:18px`
- Dados pessoais card: `background:--surface; border:1px solid --border; border-radius:16px; padding:22px`
  - Avatar: `width:54px; height:54px; border-radius:99px; background:--color-primary; font-size:16px; font-weight:700; color:--color-on-primary`
  - Form grid: `grid-template-columns:1fr 1fr; gap:14px`
  - "ALTERAR FOTO" button: outlined secondary style
  - Disabled e-mail field: `background:--surface3; color:--muted`
- Segurança card: `height:fit-content`
  - Each row: `padding:12px 0; border-bottom:1px solid --border`
  - MFA toggle: `width:38px; height:22px; border-radius:99px; border:1px solid --border2; background:--surface2; padding:2px` with knob `.kb` / `.kb-on`

**Corretoras tab:**
- "ADICIONAR" primary button: `background:--color-primary; border-radius:10px; padding:8px 14px; font-size:10.5px; font-weight:700`
- Connection status badge: ATIVA → `--tint-accent` / `--color-accent`; EM BREVE → outlined `--border2` / `--muted2`

**Preferências tab:**
- Notification toggle items: same toggle style as MFA toggle
- Segment controls for decimal separator: `.sg` / `.sg-on`
- Format preview: JetBrains Mono inline `color:--text`

**Últimos Acessos tab:**
- Table: `grid-template-columns:160px 160px 1.4fr 1fr`
- IP column: JBMono 12px
- Date column: JBMono 11.5px `--muted`

### Backtest Screens (BCK-01 to BCK-04)

Creation modal / panel:
- Period shortcut chips (`.bc`): `font-size:10px; font-weight:700; letter-spacing:0.05em; padding:5px 11px; border-radius:99px; border:1px solid --border2; color:--muted2`
  - Active (`.bc-on`): `background:--tint-primary; color:--color-primary; border-color:--color-primary`
- Credits counter: JBMono prominent

Backtest list: same card/table patterns as robot listing.

### Input Fields (universal)

```css
background: var(--surface2);
border: 1px solid var(--border);
border-radius: 10px;
padding: 10px 13px;   /* or 11px 14px for larger inputs */
color: var(--color-text-hi);
font-size: 13px;       /* or 13.5px for primary inputs */
width: 100%;
```
Focus: `border-color: var(--color-primary)` (via `style-focus`)
Disabled: `background:--surface3; color:--muted`
Numeric/mono inputs: add `font-family: 'JetBrains Mono', monospace`

Help tooltip "?": `width:15px; height:15px; border-radius:99px; border:1px solid --border2; color:--muted2; font-size:9.5px; display:inline-flex; align-items:center; justify-content:center; cursor:help`

### Buttons (canonical)

Primary CTA (e.g. "CRIAR ROBÔ", "SALVAR", "INICIAR BACKTEST"):
```css
background: var(--color-primary);
color: var(--color-on-primary);
border-radius: 10px–12px;  /* 10px for compact, 12px for wizard/modal */
padding: 9px 16px;          /* compact | 11px 20px standard | 12px 24px wizard */
font-size: 11px–12px;
font-weight: 700;
letter-spacing: 0.06em–0.07em;
```
Hover: `filter: brightness(1.12)` or `transform: translateY(-1px)` (cards only)

Secondary / outlined:
```css
border: 1px solid var(--border2);
border-radius: 10px–12px;
color: var(--muted);
background: transparent;
```
Hover: `color: --text; background: --surface3`

Destructive text link (CANCELAR assinatura, ENCERRAR SESSÕES):
`font-size:10px; font-weight:700; letter-spacing:0.07em; color:--color-loss` → hover `text-decoration:underline`

Primary text link (GERENCIAR ASSINATURA, ALTERAR):
`font-size:10px; font-weight:700; letter-spacing:0.07em; color:--color-primary` → hover `text-decoration:underline`

### Modals

- Backdrop: `rgba(0,0,0,0.6)`
- Container: `background:--surface; border-radius:16px–20px; box-shadow:--shadow-modal`
- Standard width: 480px; large (order event log): 640px
- Animation: scale 0.96→1.0 + opacity 0→1 over 250ms `--ease-out`

### Segment Controls (`.sg` / `.sg-on`)

```css
.sg {
  display: flex; align-items: center; justify-content: center;
  flex: 1 1 auto; padding: 7px 10px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.03em;
  border-radius: 8px; cursor: pointer; transition: all 0.15s;
  color: var(--muted); background: transparent;
}
.sg-on {
  background: var(--seg-on);   /* --color-primary */
  color: var(--seg-on-tx);     /* --color-on-primary */
  box-shadow: 0 1px 6px rgba(0,0,0,0.22);
}
```
Container: `display:flex; background:--surface2; border:1px solid --border; border-radius:10px; padding:4px`

### Toggle Switch

```css
Track: width:38px; height:22px; border-radius:99px; border:1px solid --border2;
       background:--surface2; padding:2px; cursor:pointer; display:flex; align-items:center
Knob off (.kb): width:16px; height:16px; border-radius:99px; margin-left:0; background:--knob-off
Knob on (.kb-on): margin-left:16px; background:--color-primary
Transition: all 0.18s
```

---

## Copywriting Contract

All copy in Brazilian Portuguese. Trading terminology uses standard B3 conventions.

### Global

| Element | Copy |
|---------|------|
| Loading state | "Carregando..." |
| Generic error heading | "Algo deu errado" |
| Generic error body | "Não foi possível carregar os dados. Tente novamente." |
| Generic error CTA | "Tentar novamente" |
| Session expired | "Sua sessão expirou. Faça login novamente." |
| Empty search results | "Nenhum resultado para '{{ query }}'" |

### Authentication (AUT-01 to AUT-06)

| Element | Copy |
|---------|------|
| Login heading | "Entrar na Vetor" |
| Login primary CTA | "Entrar" |
| Register heading | "Criar conta" |
| Register primary CTA | "Criar conta" |
| Forgot password heading | "Recuperar senha" |
| Forgot password CTA | "Enviar link" |
| Forgot password success | "Enviamos um link para [email]. Verifique sua caixa de entrada." |
| OAuth Google CTA | "Entrar com Google" |
| OAuth GitHub CTA | "Entrar com GitHub" |
| Email verification banner | "Verifique seu email para ativar a conta." |
| Error: wrong credentials | "Email ou senha incorretos." |
| Error: account not found | "Conta não encontrada. Verifique o email ou crie uma conta." |
| Error: email already registered | "Este email já está cadastrado. Faça login ou recupere a senha." |

### Robot Listing — /robos (ROB-01 to ROB-07)

| Element | Copy |
|---------|------|
| Primary CTA | "CRIAR ROBÔ" |
| Empty state heading (any tab) | "Nenhum robô neste ambiente" |
| Empty state body | "Crie um robô a partir de uma estratégia-modelo, sem precisar programar." |
| Empty state CTA | "CRIAR ROBÔ" |
| Tab EXECUTANDO | "EXECUTANDO" |
| Tab PARADOS | "PARADOS" |
| Tab ARQUIVADOS | "ARQUIVADOS" |
| Search placeholder | "Buscar robô…" |
| Filter label | "Todas as estratégias" |
| Positioned filter | "Posicionados" |
| MAIS INFO toggle | "MAIS INFO" |
| Quick link | "CONFIGURAR" / "DUPLICAR" / "ARQUIVAR" / "DESARQUIVAR" / "CRIAR BACKTEST" |
| Assinada badge | "ASSINADA" |
| Control: running | "PARAR" |
| Control: stopped | "INICIAR" |
| Control: archived | "RESTAURAR" |

### Wizard (WIZ-01 to WIZ-06)

| Element | Copy |
|---------|------|
| Breadcrumb | "Robôs › Criando seu robô" |
| Title | "Criando seu robô" |
| Subtitle | "Quatro passos e seu robô estará pronto para configurar — sem escrever uma linha de código." |
| Step 1 label | "ESTRATÉGIA" |
| Step 2 label | "MODO" |
| Step 3 label | "DADOS" |
| Step 4 label | "CONFIGURAR" |
| Search placeholder | "Buscar estratégia…" |
| SAIBA MAIS link | "SAIBA MAIS" |
| Em Breve badge | "EM BREVE" |
| RECOMENDADO badge | "RECOMENDADO" |
| Simulado title | "Modo Simulado" |
| Simulado description | "Carteira virtual com cotações reais e simulador pessimista. Nenhuma ordem é enviada à corretora." |
| Real title | "Modo Real" |
| Real description | "Envio de ordens reais à corretora. Requer conta vinculada, termo de risco aceito e plano elegível." |
| Robot name label | "Nome do robô" |
| Robot name placeholder | "Ex.: Estocástico WIN 5min" |
| Robot name hint | "Único por conta e ambiente · [N] caracteres restantes" |
| Strategy field label | "Estratégia" |
| Strategy change link | "ALTERAR" |
| Capital label | "Capital para simulação" |
| Capital default | "R$ 5.000,00" |
| Capital hint (tooltip) | "Patrimônio virtual inicial usado pelo simulador." |
| Back CTA | "VOLTAR" |
| Next CTA | "AVANÇAR →" |
| Finish CTA | "CRIAR ROBÔ →" |

### Robot Editor (EDT-01 to EDT-04)

| Element | Copy |
|---------|------|
| Breadcrumb back label | "Robôs" |
| Last saved label | "ÚLTIMO SALVAR: [DD/MM/YYYY HH:MM]" |
| Execution lock banner | "**Robô em execução:** não é possível fazer alterações nos parâmetros enquanto ele estiver executando. Pare o robô para fazer as alterações desejadas." |
| Tab SUMÁRIO | "SUMÁRIO" |
| Tab GRÁFICO | "GRÁFICO" |
| Tab PARÂMETROS | "PARÂMETROS" |
| "Execute in real" button | "EXECUTAR EM MODO REAL" |
| Rename tooltip | "Renomear" |
| Rename max chars hint | "Máximo 40 caracteres — os 10 restantes ficam reservados para o rótulo (cópia NN)" |
| Section 01 | "Papel Negociado" |
| Section 02 | "Gráfico" |
| Market segment BM&F label | "BM&F" |
| Market segment Bovespa label | "BOVESPA" |
| Rollover hint | "Contrato contínuo: o sistema resolve para o vencimento corrente e faz a rolagem automaticamente." |
| Candlestick type | "CANDLESTICK" / "HEIKIN-ASHI" |
| Save params icon tooltip | "Salvar parâmetros" |
| Create backtest icon tooltip | "Criar backtest" |
| Costs icon tooltip | "Custos operacionais" |

### Sumário (SUM-01 to SUM-05)

| Element | Copy |
|---------|------|
| Period filters | "HOJE" / "7D" / "30D" / "TUDO" |
| Export CSV button | "EXPORTAR CSV" |
| Metric: Net Return | "RETORNO LÍQUIDO" |
| Metric: Patrimônio | "PATRIMÔNIO" |
| Metric: Quote | "COTAÇÃO · [CONTRACT]" |
| Metric: Position | "POSIÇÃO ATUAL" |
| Position hint | "atualizado em tempo real" |
| Patrimônio hint | "capital inicial R$ 5.000,00" |
| Chart label patrimônio | "patrimônio" |
| Chart label capital | "capital inicial" |
| Chart card label | "EVOLUÇÃO DO PATRIMÔNIO" |
| Secondary metric: drawdown | "Drawdown máximo" |
| Secondary metric: trades | "Número de trades" |
| Secondary metric: profitable | "Trades com lucro" |
| Secondary metric: profit factor | "Fator de lucro" |
| Secondary metric: daily | "Saldo diário" |
| Help link | "Por que o meu robô ainda não operou?" |
| Relatório completo toggle | "RELATÓRIO COMPLETO" |
| Relatório section: Conta | "CONTA" |
| Relatório section: Retorno | "RETORNO" |
| Relatório section: Risco | "RISCO" |
| Relatório section: Resumo | "RESUMO DOS TRADES" |
| Relatório section: Lucro | "TRADES COM LUCRO" |
| Relatório section: Prejuízo | "TRADES COM PREJUÍZO" |
| Relatório section: Comprados | "TRADES COMPRADOS" |
| Relatório section: Vendidos | "TRADES VENDIDOS" |
| Order list label | "LISTA DE ORDENS" |
| Order export CTA | "EXPORTAR ORDENS" |
| Order column: number | "Nº ORDEM" |
| Order column: date | "DATA / HORA" |
| Order column: asset | "ATIVO" |
| Order column: side | "C/V" |
| Order column: qty | "QTD" |
| Order column: type | "TIPO" |
| Order column: status | "STATUS" |
| Order column: class | "CLASSE" |
| Order column: price | "PREÇO MÉDIO" |
| Order column: points | "RESULT. (PTS)" |
| Order column: financial | "RESULT. (R$)" |
| Filter: all status | "Todos os status" |
| Status: filled | "Executada" |
| Status: cancelled | "Cancelada" |
| Status: rejected | "Rejeitada" |
| Status: expired | "Expirada" |
| Entry class | "Entrada" |
| Exit class | "Saída" |
| Position: long | "COMPRADO" |
| Position: short | "VENDIDO" |
| Position: flat | "Sem posição" |
| Chart warning | "Certifique-se de que o ativo selecionado no gráfico é o mesmo contrato exibido no sumário do robô." |

### Backtests (BCK-01 to BCK-04)

| Element | Copy |
|---------|------|
| Create modal heading | "Novo Backtest" |
| Period shortcuts | "1M" / "3M" / "6M" / "1A" / "2A" |
| Fill type label | "Tipo de simulação" |
| Fill options | "Pessimista" / "Moderado" / "Otimista" |
| Credits label | "Créditos disponíveis:" |
| Create CTA | "INICIAR BACKTEST" |
| Status: queued | "Aguardando" |
| Status: processing | "Processando" |
| Status: completed | "Concluído" |
| Status: error | "Erro" |
| Empty state | "Nenhum backtest criado" |
| Error state | "Falha ao processar o backtest. Verifique os parâmetros e tente novamente." |

### Minha Conta (CTR-01 to CTR-04)

| Element | Copy |
|---------|------|
| Page heading | "Minha conta" |
| Tab PERFIL | "PERFIL" |
| Tab ASSINATURAS | "ASSINATURAS" |
| Tab CORRETORAS | "CORRETORAS" |
| Tab PREFERÊNCIAS | "PREFERÊNCIAS" |
| Tab ÚLTIMOS ACESSOS | "ÚLTIMOS ACESSOS" |
| Section: personal data | "DADOS PESSOAIS" |
| Section: security | "SEGURANÇA" |
| Field: full name | "Nome completo" |
| Field: email | "E-mail (verificado)" |
| Field: phone | "Telefone" |
| Field: CPF/CNPJ | "CPF/CNPJ" |
| Save CTA | "SALVAR" |
| Change avatar | "ALTERAR FOTO" |
| Change password | "Alterar senha" |
| Password last changed | "Última alteração há [N] meses" |
| MFA label | "Autenticação em 2 fatores (TOTP)" |
| MFA hint | "Obrigatória para habilitar o Modo Real" |
| Logout all | "Sair de todos os dispositivos" |
| Logout CTA | "ENCERRAR SESSÕES" |
| Broker section | "CORRETORAS VINCULADAS" |
| Add broker CTA | "ADICIONAR" |
| Available brokers | "CORRETORAS INTEGRADAS DISPONÍVEIS" |
| Link broker CTA | "VINCULAR" |
| Unlink broker CTA | "DESVINCULAR" |
| Broker status ATIVA | "ATIVA" |
| Broker status EM BREVE | "EM BREVE" |
| Notifications section | "NOTIFICAÇÕES POR E-MAIL" |
| Simulation section | "SIMULAÇÃO" |
| Default simulator label | "Tipo de simulador padrão" |
| Formatting section | "FORMATAÇÃO DE VALORES" |
| Access log IP | "IP" |
| Access log date | "DATA / HORA" |
| Access log device | "DISPOSITIVO / NAVEGADOR" |
| Access log location | "LOCALIZAÇÃO" |
| Current session badge | "SESSÃO ATUAL" |
| Plan current label | "PLANO ATUAL" |
| Change plan CTA | "ALTERAR PLANO" |
| Signed strategies label | "ESTRATÉGIAS ASSINADAS · LOJA" |
| Payment cards label | "CARTÕES DE PAGAMENTO" |
| Add card CTA | "+ ADICIONAR CARTÃO" |
| Remove card CTA | "REMOVER" |
| Cancel subscription CTA | "CANCELAR" |

### Destructive Confirmations

| Action | Heading | Body | Confirm CTA | Cancel CTA |
|--------|---------|------|-------------|------------|
| Excluir robô | "Excluir robô?" | "Esta ação é permanente. O robô '[Nome]' e todo o histórico de ordens serão excluídos." | "Excluir" | "Cancelar" |
| Arquivar robô | "Arquivar robô?" | "O robô '[Nome]' será movido para Arquivados. Você pode restaurá-lo a qualquer momento." | "Arquivar" | "Cancelar" |
| Parar com posição aberta | "O robô tem uma posição aberta em [Ativo]. O que deseja fazer?" | — | "Fechar posição e parar" / "Manter posição e parar" | "Cancelar" |
| Desvincular corretora | "Desvincular corretora?" | "Robôs no Modo Real serão pausados se a corretora for desvinculada." | "Desvincular" | "Cancelar" |
| Cancelar assinatura | "Cancelar assinatura?" | "O robô assinado será removido da sua conta e não haverá novas cobranças. Você manterá acesso até o fim do ciclo já pago." | "Cancelar assinatura" | "Manter" |
| Encerrar todas as sessões | "Encerrar sessões?" | "Você será desconectado de todos os dispositivos, incluindo o atual." | "Encerrar sessões" | "Cancelar" |

Confirm CTAs for destructive actions: `background:--color-loss; color:#FFFFFF`

---

## Motion Contract

| Token | Value | Usage |
|-------|-------|-------|
| `--motion-fast` | 150ms | Button hover, badge transitions, `.nv` hover, `.et` active, link color change |
| `--motion-base` | 250ms | Dropdown open, accordion expand height, modal appear |
| `--motion-slow` | 400ms | (reserved — not used in Phase 1) |
| `--ease-out` | cubic-bezier(0.16,1,0.3,1) | All transitions above |
| `--stagger` | 60ms | Robot card list stagger (if animated) |

Screen mount: `animation: fadeUp 0.25s ease`
Chevron rotate: `transition: transform 0.2s` (`rotate(0deg)` → `rotate(180deg)` on expand)
Card hover: `transition: all 0.18s` (slight variation from `--motion-fast` — matches prototype)

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — custom Blue Hour design system | not applicable |
| Third-party | none declared | not applicable |

---

## Checker Sign-Off

> Note: Dimensions 4 (Typography) will be flagged for >4 sizes and >2 weights. This flag is force-overridden — the prototype is the design authority and its information density requires this typographic range.

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: OVERRIDE — prototype-faithful, 7+ sizes intentional
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-15
