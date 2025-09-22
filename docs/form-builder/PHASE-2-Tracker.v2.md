# Phase 2 Tracker (GA Cut, v2)

Initialized: 2025-09-22 08:00 BST

## Checklist

- [x] P2‑01 — Repeater (arrays)
- [x] P2‑02 — UK Postcode widget (+ AJV format)
- [x] P2‑03 — Submission retry & draft recovery
- [x] P2‑04 — Session timeout enforcement
- [x] P2‑05 — CSP with nonce
- [x] P2‑06 — Schema composer override guard
- [x] P2‑07 — Analytics: `v` + `payloadVersion`
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

| ID    | Summary                           | Commit                                   | CI Run                                        | Notes                                                                                                                                                            |
| ----- | --------------------------------- | ---------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2‑01 | Repeater (arrays)                 | b5ddf005bb16dfb5866cb08b591a8841239fa0d7 | local (lint/typecheck/test/build/size)        | Rebuilt repeater with leaner field-array wiring, keeping min/max and a11y cues.                                                                                  |
| P2‑02 | UK Postcode widget (+ AJV format) | ce909add284a37824a1fcf66205d86ac5010a879 | local (format/lint/typecheck/test/build/size) | Added masked Postcode widget and gb-postcode AJV format with regression tests.                                                                                   |
| P2‑03 | Submission retry & draft recovery | 2a17b3f6e8c5d47c997a23340f90158c875c600a | local (format/lint/typecheck/test/build/size) | Added exponential retry with aria-live feedback and lazy draft autosave to keep bundle budget intact.                                                            |
| P2‑04 | Session timeout enforcement       | ac44e4b1d2ac97b359da6fd8ef0953f47662cc03 | local (format/lint/typecheck/test/build/size) | Countdown + lock/restore UX landed; lint still reports existing `any` warnings, build skipped font download offline.                                             |
| P2‑05 | CSP with nonce                    | aad3eed4183c83726ba2b3b9adcb7214cfa75ce9 | local (format/lint/typecheck/test/build/size) | Added nonce-backed CSP middleware plus NonceProvider wiring; build still skips Google font download offline.                                                     |
| P2‑06 | Schema composer override guard    | 3670cf38fafe06c9981e8d03179e56f37694f1a2 | local (format/lint/typecheck/test/build/size) | Guarded composer collisions unless `{ override: true, reason }` is provided; retained existing `any` lint warnings and build skips remote font download offline. |
| P2‑07 | Analytics: `v` + `payloadVersion` | a17ab02557749add879289f5b2ab54c2e7533ea4 | local (format/lint/typecheck/test/build/size) | Added analytics version + payloadVersion defaults from persistence and ensured envelope tests cover the new metadata. |

## CI Summary (latest)

- Lint: ☑ | Typecheck: ☑ | Tests: ☑ | Build: ☑ | Size: ☑
