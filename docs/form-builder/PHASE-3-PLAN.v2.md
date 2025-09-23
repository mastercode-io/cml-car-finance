# PHASE-3-PLAN.v2 — Form Builder (Revised Sprint Scope)

**Branch:** `codex-form-builder`  
**Owner:** Alex (Form Experience)  
**Sprint:** Phase 3 (revised) — production‑readiness first  
**Reference:** PRD-Phase-3.md

---

## Strategy (why this revision)
Phase 3 refocuses on **production readiness** and **risk‑first sequencing**:
- Ship **feature flags/staged rollout** and fix **Phase‑2 regressions** before landing high‑surface work.
- Implement **layout** as a **flagged wrapper** with a rock‑solid single‑column fallback.
- Keep **Review** minimal (summary‑only) and gate actual submit later.
- Deliver **core widgets** needed by authors; keep UK lookup narrow (V1) behind a flag.
- Add **KPI/perf hooks** and **degradation toggles** to monitor & protect UX at GA.

---

## Scope Summary (P0 vs P1)

### P0 (must land for GA fitness)
0. **Feature flags & staged rollout** (foundation)  
1. **Phase‑2 regressions** (GIR 0AA, Repeater focus, offline retry)  
2. **Validation strategy & debounce** (honor schema)  
3. **Review step (summary‑only)** (no validation coupling yet)  
4. **Layout V1 (grid+sections+colSpan)** behind flag + fallback  
5. **MultiSelect widget**  
6. **Time & DateTime widgets** (combined)  
7. **UK Address Lookup (V1)** behind flag (provider chosen)  
8. **Analytics KPI hooks & default wiring** (events ready for dashboards)  
9. **Perf budgets & degradation toggles** (switches + eventing)

### P1 (nice‑to‑have, defer if needed)
- RadioGroup a11y polish (if not already complete)  
- Theme tokens → CSS vars
- Select “Add new…” (popover subform)  
- Schema linter & authoring docs expansion

---

## Work Breakdown (self‑contained tasks)

### P3-00 — Feature Flags & Staged Rollout (**P0**)
**Goal**: Safely gate risky features and enable canary→GA.  
**Deliverables**
- `FeaturesProvider` + `useFlag(name, default?)`
- Schema/Env overrides: e.g. `schema.features.gridLayout`, `process.env.NEXT_PUBLIC_FLAGS`
- Renderer switchbacks (fallback to single‑column when `gridLayout` off)
**Touch points**: `packages/*/context/features.tsx`, `renderer/FormRenderer.tsx`  
**Tests**: unit for flag resolution precedence (env > schema > default), rendering fallback snapshot.

---

### P3-01 — Phase‑2 Regressions Fix (**P0**)
**Items**
- Postcode: accept **GIR 0AA** and common edge cases; add tests.
- Repeater: focus management on **add/move/remove**; live‑region announcements remain.
- Submission retry: detect **offline** distinctly; queue or surface actionable banner.
**Touch points**: postcode format/validator; `RepeaterField`; submission flow/hooks  
**Tests**: unit + small Playwright flows (keyboard‑only add repeater item).

---

### P3-02 — Validation Strategy & Debounce (**P0**)
**Goal**: Respect `validation.strategy` (`onChange|onBlur|onSubmit`) and `debounceMs`.  
**Touch points**: `renderer/useValidation.ts`, RHF bridge  
**Tests**: unit per strategy; debounced onChange; onSubmit validates all before submit.

---

### P3-03 — Review Step (Summary‑only) (**P0**)
**Goal**: Render read‑only summary (labels/values/repeaters). Defer `allowReviewIfInvalid` semantics to a later pass.  
**Deliverables**: `ReviewStep.tsx`, `ReviewSummary.tsx` using field formatters; “Submit” button **gated in UI**, not nav logic.  
**Tests**: snapshot; a11y landmarks; redaction honored (`x-analytics.redact`).

---

### P3-04 — Layout V1 (Flagged Wrapper) (**P0**)
**Goal**: Grid container + sections + per‑field `colSpan` with **feature flag** `gridLayout`.  
**Contract (schema)**: `ui.layout.type="grid"`, `gutter`, `breakpoints`, `sections[].rows[].fields`, optional per‑field `colSpan`.  
**Touch points**: `renderer/layout/Grid.tsx`, `renderer/layout/useLayout.ts`, `FormRenderer.tsx` switch.  
**Tests**: Playwright visual snapshots at sm/md/lg; keyboard tab order unchanged; fallback path snapshot.

---

### P3-05 — MultiSelect Widget (**P0**)
**Goal**: `string[]` value; options or `optionsFrom`; chips UI; full keyboard/a11y.  
**Touch points**: `components/fields/inputs/MultiSelect.tsx`, registry, AJV (array of string).  
**Tests**: select/deselect; `maxSelections` guard; a11y roles/labels.

---

### P3-06 — Time & DateTime Widgets (**P0**) — *combined task*
**Goal**: `Time` (HH:mm, local), `DateTime` (ISO string, local timezone documented).  
**Touch points**: `components/fields/inputs/Time.tsx`, `DateTime.tsx`, registry, AJV formats.  
**Tests**: min/max ranges; round‑trip parse/format; keyboard support.

---

### P3-07 — UK Address Lookup V1 (**P0**, **flagged**)
**Assumption**: Provider selected; simple postcode→addresses API; field mapping ready.  
**Goal**: Postcode search → listbox → prefill address fields → manual edit fallback.  
**Flag**: `features.addressLookupUK`  
**Touch points**: `components/fields/specialized/AddressLookupUK.tsx`, DS adapter, mock provider.  
**Tests**: mock success/error; listbox a11y; manual fallback path.

---

### P3-08 — Analytics KPI Hooks & Default Wiring (**P0**)
**Goal**: Emit KPI/Perf events (step start/complete, validation errors, submit success/fail), ensure `v/payloadVersion/sampling` defaults are installed in host/demo.  
**Touch points**: analytics provider/hook, demo app init; docs snippet.  
**Tests**: event payload snapshots; sampling honored in prod mode env.

---

### P3-09 — Perf Budgets & Degradation Toggles (**P0**)
**Goal**: Define budgets (e.g., p95 step transition) + toggles (reduce animations, skip non‑critical recomputes); emit over‑budget events.  
**Touch points**: perf monitor hook (PerfObserver/marks), degradation toggles consumed by renderer.  
**Tests**: synthetic over‑budget path triggers toggles; events recorded.

---

### P1 Backlog (defer if capacity is tight)
- RadioGroup a11y polish
- Theme tokens → CSS vars
- Select “Add new…” (popover subform)
- Schema linter & more authoring docs

---

## Risks & Mitigations
- **Layout blast radius** → **flagged**, wrapper‑only; strict fallback to single‑column.
- **Address API variance** → adapter + mock provider; manual fallback path.
- **Validation strategy UX** → default to `onBlur`; document migration notes.
- **Perf regressions** → budgets + degradation toggles + KPI eventing.

---

## Acceptance (Definition of Done)
- All P0 tasks merged; CI green (fmt/lint/type/test/build/size)  
- Visual snapshots for layout; a11y checks for Repeater, MultiSelect, Address listbox  
- Demo schema showcasing grid + review summary + widgets + lookup (flags can be on in demo)  
- KPI/perf events visible in dev; redaction verified
