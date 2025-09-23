# PHASE-3-PLAN — Form Builder (Next Sprint)

**Branch:** `codex-form-builder`  
**Duration:** ~2 weeks  
**Owner:** Alex (Form Experience)  
**Reference:** PRD-Phase-3.md

## Goals (P0)
1. Review step contract (`type:"review"`, `allowReviewIfInvalid`, `submit`)
2. Layout V1 (responsive grid): multi-column, per-field `colSpan`, sections, gutters, breakpoints
3. Validation strategy & debounce (`onChange|onBlur|onSubmit`, `debounceMs`)
4. Widget gap fill: MultiSelect, Time, DateTime, RadioGroup polish, **UK Address Lookup**
5. Analytics default wiring (v, payloadVersion, sampling, redaction)

### Nice-to-haves (P1)
- Theme tokens → CSS vars (brand color, radius, density, tone)
- Select/Lookup “Add new…” (popover subform)
- Schema linter + docs

---

## Work Breakdown (self-contained tasks)

### P3-01 — Review Step: Semantics & Guard
**Scope**
- Add `type:"review"` to schema step
- Honor `allowReviewIfInvalid` (default: `true`)
- Render banner with “Jump to first issue”, focus management, aria-live
- Accept `submit: { label?: string; confirm?: boolean }`

**Touch points**
- `packages/form-engine/src/renderer/StepNavigator.ts(x)`
- `packages/form-engine/src/renderer/FormRenderer.tsx`
- `packages/form-engine/src/components/review/ReviewStep.tsx` (new)

**Tests**
- Enter review with invalid answers → banner visible, jump focuses first invalid
- Strict mode (`allowReviewIfInvalid:false`) blocks entry with clear message
- a11y: screen reader announcement and proper focus order

---

### P3-02 — Review Summary Rendering
**Scope**
- Auto-generate summary table (labels, values, repeaters)
- Hide values of fields marked `x-analytics.redact: true`
- Indicate hidden/conditional fields appropriately

**Touch points**
- `components/review/ReviewSummary.tsx` (new)
- `FieldRegistry` formatters (for string/number/date/select/repeater)

**Tests**
- Snapshot of summary for demo schema
- Redacted fields show placeholders (e.g., ••••)

---

### P3-03 — Validation Strategy & Debounce
**Scope**
- Read schema `validation.strategy`, `debounceMs`
- Implement strategies in RHF bridge layer
- Keep worker path for heavy schemas

**Touch points**
- `renderer/useValidation.ts`
- `renderer/FormRenderer.tsx`

**Tests**
- Unit tests for `onChange|onBlur|onSubmit`
- Debounce unit test for onChange

---

### P3-04 — Layout V1: Grid Scaffolding
**Scope**
- Grid container + breakpoints + gutter
- Sections with headers/optional description
- Safe single-column fallback

**Touch points**
- `renderer/layout/Grid.tsx` (new)
- `renderer/layout/useLayout.ts` (reads `ui.layout`)
- `renderer/FormRenderer.tsx` integration

**Tests**
- Visual snapshots (Playwright) at sm/md/lg
- Keyboard tab order remains logical

---

### P3-05 — Layout V1: Field Placement & colSpan
**Scope**
- Per-row `fields: []` mapping to components
- `colSpan` per-field/per-row with breakpoint overrides
- Error + help text alignment in grid

**Touch points**
- `renderer/layout/Grid.tsx`
- `components/FieldContainer.tsx`

**Tests**
- Snapshot: single/two/three-column forms
- Error rendering doesn’t break grid

---

### P3-06 — Demo Schema Migration to Layout
**Scope**
- Update demo form(s) to declare sections/rows/colSpan
- Document authoring guidelines

**Touch points**
- `apps/demo/schemas/*.ts|json`
- `docs/form-builder/AUTHORING.md` (layout section)

**Tests**
- Manual smoke via GA-SMOKE

---

### P3-07 — MultiSelect Widget
**Scope**
- `value: string[]`
- Props: `options | optionsFrom`, placeholder, `maxSelections?`
- Chips rendering + keyboard a11y

**Touch points**
- `components/fields/inputs/MultiSelect.tsx` (new)
- `FieldRegistry` registration
- AJV schema: array of string validation

**Tests**
- Unit tests (select/deselect, max)
- a11y: roles, focus, labels

---

### P3-08 — Time Widget
**Scope**
- HH:mm input with parsing/format
- Min/Max support, keyboard a11y

**Touch points**
- `components/fields/inputs/Time.tsx` (new)
- AJV `format:"time"`

**Tests**
- Valid/invalid times; min/max

---

### P3-09 — DateTime Widget
**Scope**
- ISO string, local timezone persisted (document)
- Calendar + time input; min/max

**Touch points**
- `components/fields/inputs/DateTime.tsx` (new)
- AJV `format:"date-time"`

**Tests**
- Round-trip parse/format; min/max

---

### P3-10 — RadioGroup A11y Polish
**Scope**
- ARIA roles, roving tabindex
- Error association and focus ring

**Touch points**
- `components/fields/inputs/RadioGroup.tsx`

**Tests**
- Keyboard-only navigation; screen reader labels

---

### P3-11 — UK Address Lookup
**Scope**
- Widget: postcode → fetch addresses via data source → select → populate address fields
- Manual entry fallback when API fails or user opts to edit
- Provider adapter with mock

**Touch points**
- `components/fields/specialized/AddressLookupUK.tsx` (new)
- `data/DataSourceManager.ts` integration
- `adapters/address/ideal-postcodes.ts` (example)

**Tests**
- Unit tests with mocked DS
- Error cases and fallback
- a11y: listbox roles and keyboard

---

### P3-12 — Analytics Default Wiring
**Scope**
- Host/demo initializes analytics with v/payloadVersion, sampling defaults (1% prod), redaction
- Docs snippet

**Touch points**
- `apps/demo/_app.tsx` or provider
- `docs/form-builder/ANALYTICS.md`

**Tests**
- Sampling in prod mode; redaction unit test

---

### P3-13 (P1) — Theme Tokens → CSS Vars
**Scope**
- Map `ui.theme` to CSS vars; two sample themes

---

### P3-14 (P1) — Select “Add new…” (Popover Subform)
**Scope**
- Custom Select that opens a subform to create an option, refreshes options, autoselects

---

### P3-15 (P1) — Schema Linter & Docs
**Scope**
- `npm run schema:lint` for JSONPaths, review flags, dynamic values
- AUTHORING.md + examples

---

## Risks & Mitigations
- Layout touches many components → feature flag + single-column fallback
- Address API variations → adapter pattern + mock tests
- Validation strategy UX change → default to `onBlur`, document migration
