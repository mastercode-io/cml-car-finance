# Phase 3 — Integration Tracker

> Source branches: `codex-form-builder-phase-3` (pre-layout), `codex-form-builder-phase-3-layout-engine` (layout).  
> This tracker is the single place to record status, PRs, and notes across the hardening + merge effort.

## Legend
- **Status:** ⏳ Planned · 🛠️ In Progress · ✅ Merged · 🔁 Needs Rebase · ❗Blocked
- **Owner:** 👤 You · 🤖 Codex

## Tasks

| ID   | Title                               | Branch                                      | Status  | Owner | PR # / Link | Notes |
|------|-------------------------------------|---------------------------------------------|---------|-------|-------------|-------|
| H-01 | Lock review architecture (Option A) | codex-form-builder-phase-3                  | ⏳      | 👤    | —           | Docs/PRD alignment |
| H-02 | Fix failing suites (pre-layout)     | codex-form-builder-phase-3                  | ⏳      | 🤖    | —           | Ensure submit banner + jump behavior |
| H-03 | Schema-driven redaction             | codex-form-builder-phase-3                  | ⏳      | 🤖    | —           | `x-analytics.redact` in analytics + review |
| H-04 | A11y jump + SR feedback             | codex-form-builder-phase-3                  | ⏳      | 🤖    | —           | Inline alert + focus mgmt |
| H-05 | Tag RC (v3.0.0-rc1)                 | codex-form-builder-phase-3                  | ⏳      | 👤    | —           | Push tag + notes |
| H-06 | Rebase layout onto RC               | codex-form-builder-phase-3-layout-engine    | ⏳      | 👤    | —           | Resolve FormRenderer/GridRenderer touch points |
| H-07 | Draft integration PR + checks       | layout → pre-layout                         | ⏳      | 👤    | —           | All checks green; flags OFF by default |
| H-08 | Live demo smoke                     | integration PR branch                       | ⏳      | 👤    | —           | Flags ON in demo env |
| H-09 | Final merge & release v3.0.0        | integration PR branch                       | ⏳      | 👤    | —           | Tag and docs |

## Checklists

### Validation & A11y (H-02/H-04)
- [ ] Invalid submit on Review sets inline alert banner (with required prefix copy).
- [ ] `aria-live="assertive"` region announced by SR.
- [ ] Focus moves to banner or first invalid field (policy-driven).
- [ ] Keyboard-only flow reaches Review and stays (if frozen).

### Redaction (H-03)
- [ ] `x-analytics.redact` supported on widgets.
- [ ] Analytics payload masks fields per rule.
- [ ] Review summary masks fields per rule.
- [ ] Unit tests cover full/partial/no redaction cases.

### Rebase & Integration (H-06/H-07)
- [ ] Rebase completed without unresolved conflicts.
- [ ] GridRenderer path stable; single-column fallback intact.
- [ ] All checks: format, lint, typecheck, test, build, size.
- [ ] Flags default OFF; env overrides documented.

### Live Smoke (H-08)
- [ ] Demo app loads; flags ON for guardrails + grid.
- [ ] Review step shows readable summary + confirmation control.
- [ ] Navigation guardrails hold (no loops/auto-leave).
- [ ] Submission OK; invalid submission banner appears when expected.

## Commands (for convenience)

```bash
# Pre-flight on current branch (Codex or local)
git fetch origin && git pull --rebase

# Full check locally
npm run format && npm run lint && npm run typecheck && npm run test && npm run build && CI=1 npm run size

# Demo flags example
export NEXT_PUBLIC_FLAGS="nav.dedupeToken=1,nav.reviewFreeze=1,nav.jumpToFirstInvalidOn=submit,linter.schema=1,gridLayout=1"
```

*Last updated:* 2025-09-30T15:03:40Z
