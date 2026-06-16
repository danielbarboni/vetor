# Development Workflow — Vetor

Professional git, CI/CD, and review conventions for the Vetor trading platform.
This is the authoritative reference; GSD execution and all contributors follow it.

## Branching model

- **`main`** — protected, always releasable, always green. **No direct commits.**
- **Phase branch** — `phase-<N>/<slug>` cut from `main` for each roadmap phase
  (e.g. `phase-1/mvp-nucleo-de-trading`). All work for the phase lands here.
- **Wave/plan work** — GSD executes plans wave-by-wave and commits atomically on
  the phase branch. For large phases, optionally cut short-lived
  `phase-<N>/wave-<W>-<slug>` branches off the phase branch and merge them in.
- Delete branches after merge. Never reuse a merged branch.

## Commit conventions

- **Conventional Commits**: `type(scope): subject`
  (`feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `ci`, `perf`).
  Scope is the plan/area, e.g. `feat(01-08): IT editor save validation`.
- One logical change per commit; keep commits atomic and green where possible.
- Tests are part of the change — commit code and its tests together (TDD).
- Co-author trailer on AI-assisted commits:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Planning docs (`.planning/`) are committed (`commit_docs: true`); keep them in
  separate `docs(...)` commits from feature code so PR diffs stay reviewable.

## Pull requests

- **One PR per phase** (default) from the phase branch → `main`. For large phases,
  a PR per wave is acceptable; each PR must stand on its own (green CI, coherent scope).
- Open with `gh pr create` (or `/gsd:ship`, which fills the PR body from
  `config.json → ship.pr_body_sections`).
- PR body must cover: summary, requirements/acceptance criteria covered,
  risks & dependencies, test evidence, and verification status.
- **Code-focused PRs:** use `/gsd:pr-branch` to produce a branch that filters out
  `.planning/` commits when a reviewer wants only the implementation diff.
- Squash-merge to `main` (linear history) unless a phase merge-commit is preferred
  for traceability; be consistent.

## CI/CD gate (required)

GitHub Actions `.github/workflows/ci.yml` runs on every `push` and every
`pull_request` to `main`. Two required jobs (the branch-protection contract):

| Job | Steps |
|-----|-------|
| `frontend` | `npm ci` → `npm run lint` → `npm run typecheck` → `npm run build` → `npm run test` (vitest) |
| `backend`  | `pip install -r requirements.txt ruff` → `ruff check .` → `pytest` |

Rules:
- **A PR cannot merge unless both jobs are green.** No exceptions; fix the code, not the gate.
- Every feature/bugfix ships with tests (TDD). Backend = pytest; frontend = vitest.
  The Nyquist test map (RESEARCH §Validation Architecture) defines the required test names.
- Tests requiring live Supabase/MetaAPI **skip** when their env vars are absent —
  never commit real secrets; CI uses dummy/test env.
- Keep `main` releasable: if CI is red on `main`, fixing it is top priority.

## Branch protection on `main`

Enable once CI has run at least once (so the status checks exist to require):

```
gh api -X PUT repos/danielbarboni/vetor/branches/main/protection \
  -F required_status_checks.strict=true \
  -F 'required_status_checks.contexts[]=frontend' \
  -F 'required_status_checks.contexts[]=backend' \
  -F enforce_admins=false \
  -F required_pull_request_reviews.required_approving_review_count=1 \
  -F restrictions=
```

Solo phase: self-review via PR is acceptable; the CI gate is the hard requirement.

## Per-phase loop (summary)

1. `git switch -c phase-<N>/<slug>` from up-to-date `main`.
2. Execute plans (GSD) → atomic commits with tests; CI runs on each push.
3. Open PR → confirm `frontend` + `backend` jobs green → resolve review.
4. Squash-merge to `main`; delete the branch; tag a release if the phase is shippable.
5. Update `.planning/STATE.md` and `ROADMAP.md` progress.
