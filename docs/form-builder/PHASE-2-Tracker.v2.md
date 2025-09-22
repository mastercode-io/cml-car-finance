# Phase 2 Tracker (GA Cut, v2)

Initialized: 2025-09-22 08:00 BST

## Checklist
- [x] P2‑01 — Repeater (arrays)
- [ ] P2‑02 — UK Postcode widget (+ AJV format)
- [ ] P2‑03 — Submission retry & draft recovery
- [ ] P2‑04 — Session timeout enforcement
- [ ] P2‑05 — CSP with nonce
- [ ] P2‑06 — Schema composer override guard
- [ ] P2‑07 — Analytics: `v` + `payloadVersion`
- [ ] P2‑08 — Perf sampling = 1% (prod)
- [ ] P2‑09 — Minimal rollback runbook

## Deferred Backlog (post‑GA)
- styleWhen support
- Specialized widgets: IBAN, Percentage, ColorPicker
- Automatic degradation on perf breach
- Feature flags & staged rollout automation
- KPI aggregation dashboard
- Chaos/load/synthetic tests
- SRB artifacts & CI enforcement
- Auto‑rollback hook
- Open questions & risks log

## Log
| ID   | Summary | Commit | CI Run | Notes |
|------|---------|--------|--------|-------|
| P2‑01 | Repeater (arrays) | b5ddf005bb16dfb5866cb08b591a8841239fa0d7 | local (lint/typecheck/test/build/size) | Rebuilt repeater with leaner field-array wiring, keeping min/max and a11y cues. |

## CI Summary (latest)
- Lint: ☐/☑ | Typecheck: ☐/☑ | Tests: ☐/☑ | Build: ☐/☑ | Size: ☐/☑