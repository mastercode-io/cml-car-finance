# Context.md

**Project:** JSON-schema–driven Form Builder & Demo (client portal)  
**Objectives:** Deliver a production-ready, extensible form engine enabling fast authoring and iteration of complex, multi‑step forms with strong UX, accessibility, performance, observability, and safe rollout (flags/canary).

- Decisions: 
  - Continue with the current JS/TS stack (React + react-hook-form) and a schema-driven engine; do **not** migrate to Anvil.works.
  - Phase sequencing: fix regressions/PRD gaps → add navigation guardrails (P3-NAV) → Layout V1 → new widgets/integrations.
  - Introduce feature flags; **flags default OFF** and gate risky features (navigation resolver, layout grid, address lookup).
  - UK Address Lookup V1 proceeds (provider selected, simple JSON mapping) behind a flag; start with happy path.
  - Temporary demo “hack” acceptable to prevent loops; real fix via **P3-NAV** guardrails.
  - Git strategy: use **Draft PRs** and either **stacked PRs** (each subtask bases on previous) or an **umbrella branch**; avoid merging code that touches submit/summary until P3‑02a lands.
  - Submit path contract: flush debounced validation, full-form validate, then call `onSubmit` **once** with a fresh summary.

- Requirements: 
  - **Authoring/UX:** flexible responsive layouts (multi-column, sections), variable input sizing, labels/placeholder controls, help text; advanced widgets (Radio/Checkbox groups, Date/Time/DateTime, MultiSelect), subforms/repeaters, UK address lookup, select/lookup with “Add new…”.
  - **Logic:** conditional visibility (hide/show), computed fields, data sources (pre-fill/read-only), review step/summary.
  - **Accessibility:** proper keyboard/focus management (esp. Repeater), ARIA-correct listbox/typeahead patterns.
  - **Validation:** strategy & debounce; UK postcode acceptance incl. **GIR 0AA**.
  - **Reliability:** draft persistence with offline-aware retry; high-sensitivity data requires encryption (demo may disable).
  - **Performance/Operations:** performance budgets with **automatic degradation**, KPI/analytics hooks, staged rollout via **feature flags**, chaos/load testing, canary→GA path.
  - **Tooling/Quality:** schema linter (cycles/unknowns/dup defaults), CI gates (fmt/lint/type/test/build/size), analytics sampling/versioning.

- Outstanding Questions: 
  - Finalize navigation resolver contract (terminal steps, default/guard precedence, next===current dedupe) and Review step policy (freeze vs live; allow submit if invalid?).
  - Confirm **flag keys** and defaults for nav/layout/address lookup and the staged rollout plan.
  - Specify **Layout V1** grid API (breakpoints, spans, section headers) and the migration path from single column.
  - Address lookup provider specifics (error states, accessibility, fallback) and test doubles/mock strategy.
  - Demo persistence: resolve “High sensitivity data requires encryption” (enable encryption or mark demo non‑sensitive).
  - Define schema linter rules and CI enforcement; policy for quarantining flaky tests if any.
  - Agree on date display defaults (UK vs US) and widget API for formatting without breaking `WidgetConfig` typing.

- Key Context/Artifacts: 
  - **PRD & plans:** `form-builder-PRD-v2.2.md`, `PHASE-2-PLAN.md`, `PHASE-2-Execute.md`, `PHASE-2-Tracker.md`, `PHASE-3-PLAN.v2.md`, `PHASE-3-Execute.v2.md`, `PHASE-3-Tracker.v2.md`.
  - **Remediation/Reviews:** `remediation-plan.md`, `PRD-Compliance-Report.md`, `REVIEW-REPORT.md`, `TASK-Infra-Prep-and-P3-02.md`.
  - **Features overview:** `FEATURES.md`.
  - **Demo artifacts:** `DemoForm.tsx`, `DemoDraftRecovery.tsx`, `DemoFormSchema` (employment application); known issues: step loop at Review, UK date placeholder discrepancy, `componentProps` not in `WidgetConfig` type.
  - **Conflicts resolved:** `RepeaterField` merge (a11y improvements, default item handling, error mapping).
  - **Phase‑3 status snapshot:**  
    - **P3‑00 (flags):** In Review, CI ✅; flags + renderer gates, defaults OFF.  
    - **P3‑01 (regressions):** In Progress; GIR 0AA fix + Repeater focus in; offline retry tests WIP.  
    - **P3‑02 (validation strategy):** Merged, CI ✅; debounced `onChange` + `onBlur`.  
    - **P3‑02a (submit summary fix):** Kickoff file `P3-02a-submit-summary-fix.md`; implement flush, full trigger, single submit.  
    - **P3‑NAV (guardrails):** Next; terminal semantics, deterministic resolution, dedupe; behind flags; add unit/integration tests; analytics loop detector optional.  
    - **Upcoming:** Layout V1 (flagged, fallback to single column), widgets (MultiSelect, Time/DateTime), UK Address Lookup V1, analytics KPI wiring, perf budgets & degradation, RadioGroup a11y, theme tokens, select “Add new…”, schema linter.
