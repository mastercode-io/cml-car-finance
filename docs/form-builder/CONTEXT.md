# Schema‑Driven Form Builder — CONTEXT.md

> One‑page primer for assistants/agents working on the **Phase‑2 GA cut**. Keep this in sync with the v2 docs.

## Mission
Ship a lean, reliable GA of the JSON‑schema–driven form builder for a small client portal: fast iteration on forms, strong validation, solid UX, and safe rollout—**without** over‑engineering.

## Source of truth (v2)
- **Plan:** `/docs/form-builder/PHASE-2-PLAN.v2.md`
- **Execute:** `/docs/form-builder/PHASE-2-Execute.v2.md`
- **Tracker:** `/docs/form-builder/PHASE-2-Tracker.v2.md`

## Scope for GA (P2‑01 … P2‑09)
1. **P2‑01 Repeater (arrays)** — add/remove/reorder, min/max, per‑item validation, docs & tests.
2. **P2‑02 UK Postcode widget + AJV format** — mask + `format: "gb-postcode"`, examples, tests.
3. **P2‑03 Submission retry & draft recovery** — backoff on 429/5xx, autosave draft, clear UX.
4. **P2‑04 Session timeout enforcement** — countdown UI, lock on expiry, recovery path.
5. **P2‑05 CSP with nonce** — headers + nonce plumbing, docs.
6. **P2‑06 Schema composer override guard** — require `{ override: true, reason }` on collisions.
7. **P2‑07 Analytics versioning** — include `v` + `payloadVersion`; redact PII.
8. **P2‑08 Perf sampling** — 1% sampling in prod, configurable via env.
9. **P2‑09 Minimal rollback runbook** — keep N versions, toggle to pin schema version, flip‑back script.

> Everything **not** above is **deferred** to the post‑GA backlog (styleWhen, extra specialized widgets, staged rollout automation, auto‑degrade on perf breach, KPI dashboard, chaos/load, SRB enforcement, auto‑rollback hooks).

## Guardrails
- **Small PRs**: 1–2 tasks per PR. Branch: `codex-form-builder`.
- **No new deps** unless essential; justify in PR.
- **Schema first**: changes require examples + docs updates.
- **DX**: keep types strict; avoid magic; prefer composition over config explosion.

## Quality gates (every PR)
- `format → lint → typecheck → tests → build → size`
- **Performance**: avoid regressions. Aim: _minimal bundle growth_ per feature; **target** p95 per-step render < 150 ms on mid‑range hardware.
- **Accessibility**:
  - Focus first invalid control on submit.
  - Announce errors (aria‑live) and include an error summary.
  - Keyboard only: all interactive controls reachable and operable.
  - Labels, `aria-describedby` for help/error text.
- **Security**:
  - Enforce **CSP with nonce**; no inline scripts/styles without nonce.
    - `middleware.ts` issues the CSP header/nonce; client components should read it via `NonceProvider` (see `components/security/nonce-context.tsx`).
  - Treat all input as untrusted; server‑side re‑validation for critical paths.
  - Avoid leaking PII in logs/analytics; scrub before emission.

## Telemetry
- Include `v` and `payloadVersion` on events.
- Default **1% sampling in prod**, higher in non‑prod via env (`NEXT_PUBLIC_FORM_ANALYTICS_SAMPLING` or `FORM_ANALYTICS_SAMPLING`).

## Rollback & recovery
- Keep last **N schema versions** on CDN.
- Toggle to pin a specific schema version per environment.
- One‑liner script to flip back; verify in staging.

## Working agreement for assistants (“codex”)
1. Read the **Plan** and **Tracker** v2 docs.
2. Pick the next unchecked GA task.
3. Propose a minimal plan (bullets) and list files to touch.
4. Implement + tests; run quality gates.
5. Open a PR with _Why/What/Risk/Checks_.
6. Update the **Tracker** with ✅, commit hash, CI link, and 1–2 line notes.
7. **Stop after 1–2 tasks** and await review.

### One‑liner resume
```
Resume Phase‑2 GA: take the next unchecked item from /docs/form-builder/PHASE-2-Tracker.v2.md, implement with small diffs, run format/lint/typecheck/tests/build/size, open a PR, update the tracker with commit+CI links; then stop and report.
```

### PR templates (optional)

**Title**
```
P2-01 Repeater: add array field (add/remove/reorder, min/max, per-item validation)
```

**Body**
```
Why
- GA blocker per PHASE-2-PLAN.v2 (P2-01)

What
- <RepeaterField/> + registry wire-up
- AJV array handling + tests
- Demo schema + docs

Risk/Notes
- No new deps
- Focus & error summary verified

Checks
- Lint/Types/Tests/Build/Size: ✅
```

**Commit**
```
feat(repeater): P2-01 <RepeaterField/>, array schema support, tests, docs
```
