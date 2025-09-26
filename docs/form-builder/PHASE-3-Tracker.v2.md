# PHASE-3-Tracker.v2 (Revised)

| ID           | Task                                               | Pri | Branch                         | PR # / Link | Status       | CI (fmt/lint/type/test/build/size) | Notes |
|--------------|----------------------------------------------------|-----|--------------------------------|-------------|--------------|------------------------------------|-------|
| P3-00        | Feature flags & staged rollout                     | P0  | `codex/p3v2-00-feature-flags` | _pending_   | In Review    | ✅ fmt/lint/type/test/build/size   | Flags provider + renderer gates implemented; defaults OFF in demo. Docs added. |
| P3-01        | Fix P2 regressions (GIR 0AA, repeater, offline)    | P0  | `codex/p3v2-01-regressions`   | _pending_   | In Progress  | ✅ fmt/lint/type/build · ⚠️ test   | Postcode accepts **GIR 0AA**; Repeater focus mgmt added; offline retry WIP tests. |
| P3-02        | Validation strategy & debounce                     | P0  | `codex/p3v2-02-validation`    | _pending_   | **Merged**   | ✅ fmt/lint/type/test/build/size   | Debounced `onChange` (120ms) + `onBlur` strategy honored; docs updated. |
| **P3-NAV-00**| Environment & CI bootstrap                        | P0  | `codex-form-builder-phase-3`  | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | Node 20.14 pinned; npm workspaces install + mandatory dev tooling unblocks CI. |
| **P3-NAV-01**| Terminal step semantics (resolver)                 | P0  | `codex-form-builder-phase-3`  | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | Terminal steps now stay put; awaiting downstream flag wiring. |
| **P3-NAV-02**| Deterministic resolution (guards/default)          | P0  | `codex-form-builder-phase-3`  | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | Deterministic guard-first resolver + default validation; tests added. |
| **P3-NAV-03**| Review freeze + validation policy                   | P0  | `codex/p3v2-nav-03-review`    | _pending_   | In Review  | ✅ fmt/lint/type/test/build/size   | Review terminal policy behind `nav.reviewFreeze`; default jump-to-invalid on submit; integration coverage added. |
| **P3-NAV-04**| Renderer dedupe/token guard                         | P0  | `codex/p3v2-nav-04-dedupe`    | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | `nav.dedupeToken` cancels stale forward nav when users go back; duplicate transitions dropped with unit coverage. |
| **P3-NAV-05**| Schema linter rules (CI blocking)                   | P0  | `codex/p3v2-nav-05-linter`    | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | Linter enforces dup IDs, defaults, unknown targets, cycles; warns on missing terminal. |
| **P3-NAV-06**| Unit tests (resolver)                               | P0  | `codex/p3v2-nav-06-tests`     | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | Guard precedence + terminal null coverage verified. |
| **P3-NAV-07**| Integration & E2E tests                             | P0  | `codex/p3v2-nav-07-e2e`       | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | Playwright keyboard flow holds Review step & verifies tab order. |
| **P3-NAV-08**| Analytics loop detector (P1)                        | P1  | `codex/p3-nav-08`             | _pending_   | In Review   | ✅ fmt/lint/type/test/build/size   | nav loop detection emits analytics event on rapid 2-3 step oscillations. |
| P3-03        | Review step (summary-only)                          | P0  | `feat/p3-03-review-250925-200818` | _draft_     | In Review   | ✅ fmt/lint/type/test/build/size   | Draft PR adds terminal review policy, freeze handling, summary UI. Fixes: JSON summary → readable; Review fields render; tests added. |
| P3-04        | Layout V1 (grid wrapper, flagged + fallback)        | P0  |                                |             | TODO         |                                    |       |
| P3-05        | MultiSelect widget                                  | P0  |                                |             | TODO         |                                    |       |
| P3-06        | Time & DateTime widgets                             | P0  |                                |             | TODO         |                                    |       |
| P3-07        | UK Address Lookup V1 (flagged)                      | P0  |                                |             | TODO         |                                    |       |
| P3-08        | Analytics KPI hooks & default wiring                | P0  |                                |             | TODO         |                                    |       |
| P3-09        | Perf budgets & degradation toggles                  | P0  |                                |             | TODO         |                                    |       |
| P3-10        | RadioGroup a11y polish                              | P1  |                                |             | TODO         |                                    |       |
| P3-11        | Theme tokens → CSS vars                             | P1  |                                |             | TODO         |                                    |       |
| P3-12        | Select “Add new…” (popover subform)                 | P1  |                                |             | TODO         |                                    |       |
| P3-13        | Schema linter & authoring docs                      | P1  |                                |             | TODO         |                                    |       |

**Legend:** Status = TODO → In Progress → Review → Merged

_Last updated: 2025-09-25 13:49:20Z
