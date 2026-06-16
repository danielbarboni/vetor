---
phase: 01-mvp-nucleo-de-trading
plan: 13
subsystem: account-management
tags: [ctr-01, ctr-02, ctr-03, ctr-04, security, credential-safe, metaapi, broker-provisioning]
dependency_graph:
  requires: ["01-03", "01-04", "01-06", "01-01"]
  provides: ["CTR-01", "CTR-02", "CTR-03", "CTR-04", "/conta route", "/account/* endpoints", "broker provisioning"]
  affects: ["Phase 2 Modo Real (requires CTR-02 broker link)", "engine fill policy (uses CTR-03 decimal/simulator prefs)"]
tech_stack:
  added: []
  patterns: ["TDD RED/GREEN for broker provisioning", "module-level MetaApi import for patch()-ability", "whitelist-only profile/preferences update", "credential-safe provisioning (T-01)"]
key_files:
  created:
    - backend/db/account_repo.py
    - backend/broker/provisioning.py
    - backend/routers/conta.py
    - frontend/src/pages/conta/MinhaConta.tsx
    - frontend/src/components/conta/PerfilTab.tsx
    - frontend/src/components/conta/CorretorasTab.tsx
    - frontend/src/components/conta/PreferenciasTab.tsx
    - frontend/src/components/conta/UltimosAcessosTab.tsx
  modified:
    - backend/main.py
    - backend/tests/test_broker.py
    - frontend/src/lib/api.ts
    - frontend/src/App.tsx
decisions:
  - MetaApi imported at module level (not lazily inside function) so unittest.mock.patch can replace it in tests
  - Whitelist-only update in account_repo prevents column-injection attacks on profile/preferences
  - MFA toggle rendered disabled with hint "Obrigatória para habilitar o Modo Real" — Phase 2 feature
  - ASSINATURAS tab omitted from Phase 1 tab bar — Phase 2
  - uploadAvatar in Phase 1 encodes as data URL and PATCHes avatar_url directly (Supabase Storage deferred until project exists)
  - MetaApi placeholder class raises RuntimeError when SDK absent so integration errors are explicit
metrics:
  duration_minutes: 45
  completed_date: "2026-06-16"
  tasks_completed: 2
  files_created: 8
  files_modified: 4
---

# Phase 01 Plan 13: Minha Conta (CTR-01..04) Summary

**One-liner:** Four-tab account screen (Perfil/Corretoras/Preferências/Últimos Acessos) with credential-safe MetaAPI broker provisioning storing only `metaapi_account_id`, never raw MT5 passwords (T-01 mitigated).

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Account endpoints + broker provisioning (TDD) | b242e38 (RED), 01246e5 (GREEN) | account_repo.py, provisioning.py, routers/conta.py, main.py |
| 2 | Minha Conta 4-tab screen | 19b0b22 | MinhaConta.tsx, PerfilTab.tsx, CorretorasTab.tsx, PreferenciasTab.tsx, UltimosAcessosTab.tsx |

## What Was Built

### Backend (Task 1)

**`backend/db/account_repo.py`** — User-scoped repository:
- `get_profile` / `update_profile` (whitelist: full_name, phone, cpf_cnpj, avatar_url)
- `get_preferences` / `update_preferences` with defaults merge (email notifications, simulator type, decimal format)
- `get_brokers` — returns only credential-free fields
- `get_credits`

**`backend/broker/provisioning.py`** — Credential-safe MetaAPI provisioning:
- `link_broker(user_id, login, password, server, broker_name)` — calls MetaAPI, stores ONLY `metaapi_account_id + status` in `broker_connections`. The MT5 password is forwarded to MetaAPI only and **never written to the database** (T-01).
- `unlink_broker(user_id, connection_id)` — sets status to 'unlinked' with user_id guard
- MetaApi imported at module level with fallback placeholder class — enables `unittest.mock.patch` in tests

**`backend/routers/conta.py`** — Account endpoints behind `get_current_user`:
- `GET/PATCH /account/profile` (CTR-01)
- `GET/PATCH /account/preferences` (CTR-03)
- `GET/POST /account/brokers`, `DELETE /account/brokers/{id}` (CTR-02)
- `GET /account/credits`
- `/account/sessions` reused from plan 04 auth router (CTR-04)

### Frontend (Task 2)

**`frontend/src/lib/api.ts`** — Added: `getProfile`, `updateProfile`, `uploadAvatar`, `getPreferences`, `updatePreferences`, `getBrokers`, `linkBroker`, `unlinkBroker`, `getSessions`, `revokeAllSessions`, `getCredits` with typed interfaces.

**`frontend/src/pages/conta/MinhaConta.tsx`** — `/conta` route:
- Page heading "Minha conta" (Sora 18px w700)
- Tab bar with `.et`/`.et-on` classes: PERFIL | CORRETORAS | PREFERÊNCIAS | ÚLTIMOS ACESSOS
- ASSINATURAS tab omitted (Phase 2)

**`frontend/src/components/conta/PerfilTab.tsx`** (CTR-01):
- DADOS PESSOAIS card: 54px avatar with initials fallback, ALTERAR FOTO upload, Nome completo + E-mail (disabled) + Telefone + CPF/CNPJ grid, SALVAR button
- SEGURANÇA card: Alterar senha link → /auth/forgot, MFA toggle **disabled** with hint "Obrigatória para habilitar o Modo Real", ENCERRAR SESSÕES destructive button + confirm modal

**`frontend/src/components/conta/CorretorasTab.tsx`** (CTR-02):
- CORRETORAS VINCULADAS list with ATIVA (`--tint-accent`) / EM BREVE (outlined `--border2`) badges
- ADICIONAR button → link modal (MT5 login + password → calls linkBroker)
- DESVINCULAR → destructive confirm modal ("Robôs no Modo Real serão pausados...")
- Available brokers list (BTG Pactual: VINCULAR; XP/Clear: EM BREVE)

**`frontend/src/components/conta/PreferenciasTab.tsx`** (CTR-03):
- NOTIFICAÇÕES POR E-MAIL: 3 Toggle switches (execuções, parada, margem)
- SIMULAÇÃO: SegmentControl (Pessimista/Moderado/Otimista)
- FORMATAÇÃO DE VALORES: decimal separator SegmentControl + live format preview in JetBrains Mono

**`frontend/src/components/conta/UltimosAcessosTab.tsx`** (CTR-04):
- Table columns: DATA/HORA (JBMono) | DISPOSITIVO/NAVEGADOR | IP (JBMono) | LOCALIZAÇÃO
- SESSÃO ATUAL badge in `--tint-accent` / `--color-accent` on current session row
- Data from `GET /account/sessions`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] MetaApi lazy import prevented patch() in tests**
- **Found during:** Task 1 GREEN phase
- **Issue:** MetaApi was imported inside `link_broker()` function body — `patch("broker.provisioning.MetaApi")` cannot replace an import that doesn't exist at module level
- **Fix:** Moved MetaApi import to module level with try/except fallback; removed lazy import inside function
- **Files modified:** `backend/broker/provisioning.py`
- **Commit:** 01246e5 (included in GREEN commit)

## Known Stubs

- `uploadAvatar` encodes file as base64 data URL and PATCHes `avatar_url` directly (no Supabase Storage). Works visually but not production-ready. Resolves when Supabase project is created (Plan 01-02 Task 3 blocker).
- `/account/sessions` returns placeholder shape (plan 04 decision) — real login history requires Supabase admin API or sessions log table. Noted in plan 04 decisions.
- LOCALIZAÇÃO column in UltimosAcessosTab shows "—" — IP geolocation is out of scope for Phase 1.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond what the plan's threat model covers. Broker provisioning correctly enforces T-01 (no raw MT5 credentials in DB).

## TDD Gate Compliance

| Gate | Commit | Status |
|------|--------|--------|
| RED (test) | b242e38 | PASS — `test_provision` failed with `ModuleNotFoundError` as expected |
| GREEN (feat) | 01246e5 | PASS — `test_provision` passes; full suite 32 passed |

## Self-Check: PASSED

Files exist:
- backend/db/account_repo.py: FOUND
- backend/broker/provisioning.py: FOUND
- backend/routers/conta.py: FOUND
- frontend/src/pages/conta/MinhaConta.tsx: FOUND
- frontend/src/components/conta/PerfilTab.tsx: FOUND
- frontend/src/components/conta/CorretorasTab.tsx: FOUND
- frontend/src/components/conta/PreferenciasTab.tsx: FOUND
- frontend/src/components/conta/UltimosAcessosTab.tsx: FOUND

Commits exist: b242e38, 01246e5, 19b0b22 — all in git log.

CI gates:
- backend ruff: PASSED
- backend pytest: 32 passed, 5 skipped, 9 xfailed
- frontend lint: PASSED (no ESLint errors)
- frontend typecheck: PASSED (tsc --noEmit)
- frontend build: PASSED (vite build exits 0)
- frontend vitest: 75 passed (9 test files)
