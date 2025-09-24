# PHASE-3-Tracker.v2 (Revised)

| ID     | Task                                         | Pri | Branch                       | PR # / Link | Status  | CI (fmt/lint/type/test/build/size) | Notes |
|--------|----------------------------------------------|-----|------------------------------|-------------|---------|------------------------------------|-------|
| P3-00  | Feature flags & staged rollout               | P0  | codex/p3v2-00-feature-flags | pending     | In Review | ✅ fmt/lint/type/test/build/size | Feature flag provider + renderer gating in review |
| P3-01  | Fix P2 regressions (GIR 0AA, repeater, offline) | P0  | codex/p3v2-01-regressions    | pending     | In Review | ⚠️ lint/type/test/build/size (missing local deps; jest unavailable) | GIR 0AA validation + repeater focus fixes under test |
| P3-02  | Validation strategy & debounce               | P0  | codex/p3v2-02-validation     | pending     | In Review | ✅ fmt / ⚠️ lint/type/test/build/size (missing eslint, swr, zod-to-json-schema, web-vitals, jest) |
                           | Debounced onChange validation + strategy coverage |
| P3-03  | Review step (summary‑only)                   | P0  |                              |             | TODO    |                                    |       |
| P3-04  | Layout V1 (grid wrapper, flagged + fallback) | P0  |                              |             | TODO    |                                    |       |
| P3-05  | MultiSelect widget                           | P0  |                              |             | TODO    |                                    |       |
| P3-06  | Time & DateTime widgets                      | P0  |                              |             | TODO    |                                    |       |
| P3-07  | UK Address Lookup V1 (flagged)               | P0  |                              |             | TODO    |                                    |       |
| P3-08  | Analytics KPI hooks & default wiring         | P0  |                              |             | TODO    |                                    |       |
| P3-09  | Perf budgets & degradation toggles           | P0  |                              |             | TODO    |                                    |       |
| P3-10  | RadioGroup a11y polish                       | P1  |                              |             | TODO    |                                    |       |
| P3-11  | Theme tokens → CSS vars                      | P1  |                              |             | TODO    |                                    |       |
| P3-12  | Select “Add new…” (popover subform)          | P1  |                              |             | TODO    |                                    |       |
| P3-13  | Schema linter & authoring docs               | P1  |                              |             | TODO    |                                    |       |

**Legend:** Status = TODO → In Progress → Review → Merged

## Definition of Done (per P0 task)
- CI green; unit tests present; a11y checks where UI is affected  
- Flags: introduced with defaults + docs; renderer fallback validated  
- KPI/perf events visible in dev; redaction verified  
- Tracker updated with branch, PR, CI results and a short test note
