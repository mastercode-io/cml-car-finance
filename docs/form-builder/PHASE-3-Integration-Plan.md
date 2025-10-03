# Phase 3 — Pre-Layout Hardening & Layout Integration Plan

**Branches in scope**
- **Pre-layout:** `codex-form-builder-phase-3`
- **Layout engine:** `codex-form-builder-phase-3-layout-engine`

**Goal**
Stabilize the pre-layout branch (tests, review semantics, redaction, a11y), tag an RC, then rebase and integrate the layout engine branch with minimal risk and clear CI signals.

---

## High-Level Steps

1. **Lock Review Architecture (Option A)**
   - Keep `navigation.review` (single review step) as the canonical approach.
   - Update PRD/docs to reflect this; defer multi-review support to a future phase if needed.

2. **Fix Failing Suites & Ensure CI Green (Pre-layout)**
   - Address any outstanding unit/integration test failures on `codex-form-builder-phase-3`.
   - Ensure submit-time invalid banner appears (Review step), and all guardrails are respected.

3. **Schema-Driven Redaction**
   - Support `x-analytics.redact` (or equivalent) on field definitions.
   - Apply redaction in: analytics payloads and review summary rendering.

4. **A11y “Jump to First Issue” & Screen Reader Feedback**
   - Ensure invalid submit sets an inline alert banner with `aria-live` and moves focus appropriately.
   - Validate keyboard-only and SR scenarios; add tests.

5. **Tag Pre-layout RC**
   - Tag `v3.0.0-rc1` on `codex-form-builder-phase-3` and push tag.
   - Draft concise release notes.

6. **Rebase Layout Branch onto RC**
   - Rebase `codex-form-builder-phase-3-layout-engine` onto the hardened branch.
   - Resolve expected touch points (e.g., `FormRenderer` call-site for `GridRenderer`).

7. **Integration PR & Required Checks**
   - Open a **draft** PR from layout branch into the hardened base.
   - Enforce required checks: unit, integration, typecheck, build, size.
   - Keep feature flags **OFF by default**; allow env override via `NEXT_PUBLIC_FLAGS`.

8. **Live Smoke Tests (Demo App)**
   - Toggle flags to validate navigation guardrails + grid layout in the demo environment.
   - Capture before/after performance and UX notes.

9. **Cut Final Release**
   - Merge the layout branch when green, tag `v3.0.0`, update docs, close the tracker items.

---

## Task Breakdown

### H-01 — Lock Review Architecture
- **Branch:** `codex-form-builder-phase-3`
- **Deliverables:**
  - Docs: confirm single review step policy via `navigation.review` (freeze/terminal/validate).
  - Remove stale references to multi-review unless requirements change.
- **Tests:** none (docs only).

### H-02 — Fix Remaining Failing Tests (Pre-layout)
- **Branch:** `codex-form-builder-phase-3`
- **Scope:** ensure the Review submit banner is emitted on invalid submit; ensure “jump to first invalid” behavior is covered.
- **Tests:** existing integration suite + any missing cases.

### H-03 — Schema-Driven Redaction
- **Branch:** `codex-form-builder-phase-3`
- **Scope:**
  - Add `x-analytics.redact: true|"partial"` (or similar) at widget level.
  - Apply redaction in analytics + review; include unit tests for both.
- **Tests:** new targeted unit tests.

### H-04 — A11y & UX Feedback
- **Branch:** `codex-form-builder-phase-3`
- **Scope:**
  - Inline alert banner on invalid submit (Review step) with `aria-live="assertive"`.
  - Focus management to the banner or first invalid field, as per policy.
- **Tests:** integration test for SR/keyboard flows (no Playwright dependency).

### H-05 — Tag RC
- **Branch:** `codex-form-builder-phase-3`
- **Scope:** tag `v3.0.0-rc1`, push tag, add release notes.
- **Tests:** n/a.

### H-06 — Rebase Layout Branch
- **Branch:** `codex-form-builder-phase-3-layout-engine`
- **Scope:** `git rebase` onto `codex-form-builder-phase-3` (post RC tag); resolve conflicts.
- **Tests:** full suite.

### H-07 — Integration PR & Checks
- **Branch:** `codex-form-builder-phase-3-layout-engine` → `codex-form-builder-phase-3`
- **Scope:** open **draft** PR; ensure all checks: `format`, `lint`, `typecheck`, `test`, `build`, `size`.
- **Flags default OFF**; document env overrides.

### H-08 — Live Demo Smoke
- **Branch:** integration PR branch
- **Scope:** run demo with flags toggled; validate Review step + grid layout + guardrails.
- **Tests:** manual checklists to accompany CI.

### H-09 — Finalize & Release
- **Branch:** integration PR branch
- **Scope:** merge; tag `v3.0.0`; update docs/tracker.

---

## Standard Commands

**CI script (local parity):**
```bash
npm run format && npm run lint && npm run typecheck && npm run test && npm run build && CI=1 npm run size
```

**Feature flags (example env):**
```bash
export NEXT_PUBLIC_FLAGS="nav.dedupeToken=1,nav.reviewFreeze=1,nav.jumpToFirstInvalidOn=submit,linter.schema=1,gridLayout=1"
```

**Git flow (key steps):**
```bash
# Pre-layout stabilization on codex-form-builder-phase-3
git checkout codex-form-builder-phase-3
git pull --rebase origin codex-form-builder-phase-3

# Tag RC
git tag -a v3.0.0-rc1 -m "Phase 3 pre-layout RC"
git push origin v3.0.0-rc1

# Rebase layout branch
git checkout codex-form-builder-phase-3-layout-engine
git fetch origin
git rebase origin/codex-form-builder-phase-3
# …resolve conflicts…
git rebase --continue
git push -f origin codex-form-builder-phase-3-layout-engine

# Open DRAFT integration PR (layout → pre-layout)
# (done on GitHub UI/API), then iterate until green
```

---

## Codex Execution Notes (prepend to each subtask)

- **Pre-flight:** always `git fetch`, `git checkout <branch>`, `git pull --rebase` before edits.
- **Small PRs:** ≤ 400 LOC per subtask.
- **Keep flags OFF by default;** support env override via `NEXT_PUBLIC_FLAGS`.
- **Update tracker** after each PR: `/docs/form-builder/PHASE-3-Integration-Tracker.md`.

_Last updated:_ 2025-09-30T15:03:40Z
