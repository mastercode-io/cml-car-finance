# Form Builder — Phase 3 PRD (Next Sprint)

**Owner:** Alex (Form Experience)  
**Doc version:** 3.0 (draft)  
**Branches:** `codex-form-builder`  
**Timeframe:** 2 weeks (Sprint N)  

---

## 1) Background & Problem Statement

Phase 2 delivered a schema-first form engine with strong validation, visibility rules, resilience (retry/draft), session timeout, and analytics. Teams can build production forms, but authoring speed and UX depth are gated by three gaps:

1. **Layout**: Renderer ignores `ui.layout` (single-column only). Authors can’t express multi-column sections, per-row sizing, or headers.  
2. **Review flow**: No explicit contract for the review step → confusing redirects when invalid answers exist.  
3. **Key widgets**: Missing MultiSelect, Time/DateTime, and a turnkey **UK Address Lookup** (postcode → addresses → populate lines).

Phase 3 closes these, and hardens validation strategy + analytics defaults to improve time-to-author and user completion rates.

---

## 2) Goals (P0) & Non-Goals

### Goals (P0)
- **Layout V1 (Responsive Grid):** Multi-column, per-field `colSpan`, section headers, gutters, breakpoints.  
- **Review Step Contract:** Declarative `type:"review"` + `allowReviewIfInvalid`; banner with “Go to first issue”.  
- **Validation Strategy:** Renderer honors `validation.strategy` (`onChange|onBlur|onSubmit`) + `debounceMs`.  
- **Widget Gap Fill:** MultiSelect, Time/DateTime, RadioGroup polish, and **UK Address Lookup** widget.  
- **Analytics Default Wiring:** Ensure event `v`/`payloadVersion`, sampling defaults, and PII redaction are installed by default in the host/demo.

### Non-Goals (for this sprint)
- Layout V2 (advanced grouping, tabs, sticky review) — later.  
- Theming system overhaul (CSS vars beyond essentials) — partial scaffolding only.  
- End-to-end WYSIWYG builder UI — authoring JSON remains file-based for this sprint.

---

## 3) Users & Value

- **Form authors (primary):** Need fast, declarative control over layouts and widgets to ship forms quickly.  
- **End users (secondary):** Need scannable layouts, fewer steps, clear review, and robust address entry.

**Value:** Faster authoring (↓ time-to-build), better completion rates (↑ conversion), fewer support issues (address entry, review clarity).

---

## 4) Scope & Deliverables

### A. Review Step Contract (Flow) — P0
**Problem:** “Review & Submit” sometimes bounces to step 1 due to validation guards.  
**Solution:** Add `type:"review"` step semantics:
- `allowReviewIfInvalid: boolean` — if true, render review with a warning banner and **Jump to first issue** button.  
- `submit: { label?: string; confirm?: boolean }` — review screen CTA.

**Acceptance Criteria**
- Entering review never loops silently.  
- Banner appears when invalid answers exist; Jump moves focus to the first invalid field.  
- Tests: strict (false) vs lenient (true) modes; a11y announcements (aria-live).

---

### B. Layout V1 (Responsive Grid) — P0
**Goal:** Consume `ui.layout` to produce multi-column forms with sections.  
**Contract**
```jsonc
"ui": {
  "layout": {
    "type": "grid",
    "gutter": 24,
    "breakpoints": { "sm": 1, "md": 2, "lg": 3 },
    "sections": [
      {
        "id": "personal",
        "title": "Personal",
        "rows": [
          { "fields": ["firstName", "lastName"], "colSpan": { "sm": 1, "md": 1, "lg": 1 } },
          { "fields": ["email"], "colSpan": { "lg": 2 } },
          { "fields": ["phone", "postcode"] }
        ]
      }
    ]
  }
}
```
- A row can list 1..N field names; each field may override `colSpan`.  
- Section supports `title` (renders as header) and optional `description`.  
- Renderer keeps a safe fallback to single-column if layout is missing or invalid.

**Acceptance Criteria**
- Respects `breakpoints`, `gutter`, section headers.  
- Per-field/row `colSpan` works; keyboard tab order stays logical.  
- Visual regression tests on a demo schema (screenshots at sm/md/lg).

---

### C. Validation Strategy & Debounce — P0
**Contract**
```jsonc
"validation": {
  "strategy": "onBlur",         // "onChange" | "onBlur" | "onSubmit"
  "debounceMs": 120
}
```
**Acceptance Criteria**
- Strategy toggles validation trigger behavior; `onSubmit` validates all before submit.  
- Debounce applied to async/sync field validation when strategy is `onChange`.  
- Unit tests per strategy; no perf regressions.

---

### D. Widget Gap Fill — P0
**MultiSelect**
- Props: `options`, `optionsFrom`, `placeholder`, `maxSelections?`, `creatable? (later)`  
- Value: `string[]` by default.

**Time/DateTime**
- `Time` (HH:mm), `DateTime` (ISO string); keyboard accessible; min/max support.

**RadioGroup polish**
- Ensure ARIA roles, roving tabindex, and error association.

**UK Address Lookup (must-have)**
- Postcode → fetch list of addresses (data source) → user selects → form lines populate.  
- Contract example:
```jsonc
{
  "name": "addressLookup",
  "component": "AddressLookupUK",
  "label": "Find your address",
  "dataSource": { "name": "ukAddressByPostcode", "argFrom": "postcode" },
  "mapsTo": { "line1": "address1", "line2": "address2", "town": "postTown", "postcode": "postcode" }
}
```
**Acceptance Criteria (all widgets)**
- Registered in field registry; RHF + Ajv formats where needed; unit tests; docs & demo examples.  
- Address lookup handles API errors gracefully and allows manual entry fallback.

---

### E. Analytics Default Wiring — P0
- Ensure host/demo initializes analytics with event `v`/`payloadVersion`, sampling defaults (1% prod, 100% dev), and PII redaction.  
- Add docs snippets and a minimal “enable analytics” guide.

**Acceptance Criteria**
- Events observed in dev; sampling respected in prod mode; email/phone redacted.  
- Tests green for sampling and redaction.

---

## 5) Nice-to-Haves (P1, spillover if time)

- Theme tokens → CSS variables (brand color, radius, density, tone) with a small theming demo.  
- Select/Lookup with **“Add new…”** (popover subform) that posts to a data source then selects the new option.  
- Schema Linter & Docs: `npm run schema:lint` (JSONPath checks, review flags, dynamic values), AUTHORING.md, examples library.

---

## 6) Out of Scope (for Phase 3)

- Tabs/wizards, sticky review header, drag-and-drop layout designer.  
- International address lookup beyond UK.  
- Full visual builder UI (future phase).

---

## 7) Success Metrics & Budgets

- **Authoring speed:** median PRs to add/update a form section ↓ 30%.  
- **Completion rate:** +5% on demo funnels (proxy).  
- **A11y:** axe “serious/critical” = 0 on demo pages.  
- **Perf budgets:** p95 step transition < **150ms**; bundle delta < **+15kB** for Phase 3.  
- **Quality:** unit tests + visual snapshots added for new widgets/layout.

---

## 8) Dependencies & Risks

- **Address API decision:** choose provider & response mapping (mock in tests).  
- **Layout touches many widgets:** guard with feature flag; maintain single-column fallback.  
- **Validation strategy changes UX:** document defaults and migration notes.

---

## 9) Milestones & Timeline (2 weeks)

- **Wk1:** Review step ✅; Validation strategy ✅; Layout skeleton (grid, sections); MultiSelect + Radio polish.  
- **Wk2:** Layout `colSpan` + breakpoints ✅; Time/DateTime ✅; UK Address Lookup ✅; Analytics wiring ✅; Docs & smoke tests.

---

## 10) Acceptance & Test Plan

- Unit tests for: review flow (strict/lenient), strategies, widgets, address errors/fallback.  
- Visual regression (Playwright) for layout at sm/md/lg.  
- GA-SMOKE updated to include new widgets and layout checks.  
- A11y pass (axe) on key pages; keyboard-only run including repeaters and address lookup.

---

## 11) Open Questions

1. `optionsFrom` contract: `schemaEnumOf` vs explicit `dataSource`? (Both supported?)  
2. Address provider choice (Loqate, Royal Mail PAF via vendor, Ideal Postcodes, getAddress).  
3. `allowReviewIfInvalid` default (true vs false)?  
4. Timezone for DateTime (store as UTC? local? with offset?).  
5. Minimum browser support matrix for new widgets (especially DateTime).

---

## 12) Definition of Done

- All P0 acceptance criteria met; tests and docs merged.  
- Demo form showcases: multi-column layout, review banner/jump, all new widgets, address lookup.  
- GA-SMOKE.md updated; tracker ticked with commit hashes; release branch cut for staging.
