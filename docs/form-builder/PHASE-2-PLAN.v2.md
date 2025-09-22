# Phase 2 — GA Cut (Revised Plan)

**Context:** Remediation is complete and we want a lean path to production. This revision trims non‑essentials and focuses on the minimum set required for a reliable GA release. Anything not listed here moves to the **Deferred Backlog**.

**Branch/PR:** continue with `codex-form-builder` and your current PR workflow.

---

## Scope (P2‑01 … P2‑09)

### P2‑01 — Repeater (arrays)
**Why:** Required by PRD; currently missing.
**Deliverables:** `<RepeaterField/>` with add/remove/reorder, min/max, per‑item validation, docs & unit tests.
**Wire‑up:** register in `field-registry.ts`, renderer support for array schemas.
**AC:** typecheck, unit tests for add/remove/validation; demo schema shows array usage.

### P2‑02 — UK Postcode widget (+ AJV format)
**Why:** Immediate real‑world need; other “specialized” widgets deferred.
**Deliverables:** `<PostcodeField/>` with mask/validation; AJV `format: "gb-postcode"`; docs & tests.
**AC:** AJV passes valid/invalid examples; sample schema demonstrates field; bundle size budget holds.

### P2‑03 — Submission retry & draft recovery
**Why:** Improve reliability under transient failures.
**Deliverables:** Submission pipeline with exponential backoff; on repeated failure, autosave draft and clear user messaging.
**AC:** integration tests simulate 500/429; verify backoff steps and draft‑save UX.

### P2‑04 — Session timeout enforcement
**Why:** PRD models `metadata.timeout` but runtime doesn’t enforce.
**Deliverables:** countdown UI; lock and recovery path on expiry.
**AC:** integration tests with fake timers; expired sessions block submit and offer recovery.

### P2‑05 — CSP with nonce
**Why:** Security baseline for GA.
**Deliverables:** CSP headers via Next config/middleware; nonce plumbing; docs.
**AC:** security headers present in dev/prod; docs updated; no breaking changes to dynamic scripts/styles.

### P2‑06 — Schema composer override guard
**Why:** Prevent accidental collisions.
**Deliverables:** collisions require `{ "override": true, "reason": "..." }`; otherwise throw with failing JSON path.
**AC:** unit tests: silent overwrite → error; explicit override passes.

### P2‑07 — Analytics: add `v` + `payloadVersion`
**Why:** Observability & comparability.
**Deliverables:** extend event schema & emitters; include `payloadVersion` from persistence; redact PII.
**AC:** unit tests; fixtures updated; sampling respects environment (see P2‑08).

### P2‑08 — Perf sampling = 1% in production
**Why:** Low‑overhead telemetry to start.
**Deliverables:** env‑based sampling config; 1% prod default, higher in dev/test.
**AC:** unit tests; config documented; override via env var.

### P2‑09 — Minimal rollback runbook
**Why:** Safe escape hatch without over‑engineering.
**Deliverables:** keep N versions in CDN; feature toggle to pin schema version; one‑liner script to flip back.
**AC:** docs + tested script; verified manual rollback in staging.

---

## Explicitly Deferred (Backlog)
- `styleWhen` renderer support (cosmetic).
- Specialized widgets beyond Postcode (IBAN, Percentage, ColorPicker).
- Automatic degradation on perf breach.
- Feature flags & staged rollout automation (5%→25%→100%).
- KPI aggregation dashboard (keep lightweight hooks only).
- Chaos/load/synthetic jobs (ship minimal k6 script later).
- Schema Review Board artifacts & CI enforcement.
- Auto‑rollback hook on error rate threshold.
- Open questions & risks log.

---

## Execution Rules
- Implement **1–2 tasks per run**. After each: `format → lint → typecheck → tests → build → size` then **commit & push** and update the tracker.
- Keep diffs small; if a task grows, split (`P2‑02a Postcode‑AJV`, `P2‑02b UI`).
- Avoid new deps unless necessary; document rationale in PR & tracker.

## Acceptance for GA (Phase 2)
- P2‑01…P2‑09 all ✅ in tracker.
- CI green; demo E2E passes; size within budget.
- Compliance report re‑run shows no ❌ in the GA‑critical sections.
- Runbook validated in staging.