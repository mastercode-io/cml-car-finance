# PHASE-3-PLAN.v2.md

> **Phase 3 focus:** Production‑grade navigation guardrails, Review step, and **Layout V1** (flag‑gated grid with single‑column fallback). This revision adds the full Layout V1 plan and splits it into small, PR‑friendly subtasks.

---

## P3-04 — Layout V1 (Flag-Gated Grid; Single-Column Fallback)

### Objectives
- Introduce a responsive, accessible grid layout system for steps **without breaking existing forms**.
- Keep current single‑column renderer as the default; enable grid via feature flag `gridLayout` or schema opt‑in.
- Support basic composition: sections, rows, columns, and per‑field column spans.
- No visual theming changes in this phase; no custom CSS frameworks required.

### Non‑Goals (defer to Layout V2)
- Designer‑level themes, tone, or token system.
- Complex nested grids within widgets.
- Drag‑and‑drop layout editor.
- Cross‑step multi‑column flows.

### Feature Flags & Rollout
- **Flag key:** `gridLayout`
- **Default:** OFF
- **Override:** `NEXT_PUBLIC_FLAGS=gridLayout=1`
- **Schema opt‑in:** `schema.ui.layout.type: "grid"`; if flag OFF → renderer falls back to single‑column.

### Schema Additions (back‑compatible)
```ts
// UnifiedFormSchema.ui
ui?: {
  layout?: {
    type?: "single-column" | "grid";
    gutter?: 8 | 12 | 16 | 24;            // default 16
    columns?: 1 | 2 | 3 | 4 | 6 | 12;     // default 12
    breakpoints?: {                       // optional, defaults sensible
      sm?: number; md?: number; lg?: number; xl?: number;
    };
    sections?: Array<{
      id: string;
      title?: string;
      description?: string;
      rows: Array<{
        columns: Array<{
          span?: number;                  // 1..columns (default 12)
          fields: string[];               // field names in render order
        }>
      }>
    }>
  };
  widgets?: {
    [field: string]: {
      component?: WidgetType;
      label?: string;
      placeholder?: string;
      description?: string;
      helpText?: string;
      className?: string;
      options?: unknown;
      disabled?: boolean;
      readOnly?: boolean;
      // NEW (optional hints; ignored by single‑column renderer):
      layout?: {
        colSpan?: number;                 // overrides column span if present
        align?: "start" | "center" | "end" | "stretch";
        size?: "sm" | "md" | "lg";
      };
    }
  }
}
```

### Rendering Rules
- If `gridLayout` flag **ON** and `ui.layout.type === "grid"`, use **GridRenderer**; else use existing **SingleColumnRenderer**.
- Section header (title/description) is optional; if provided, render above its rows.
- Rows → columns; respect `span` and clamp to available `columns` (e.g., 12).
- Missing/unknown fields in layout are ignored (warn); fields not referenced in layout are appended below as a single full‑width block (no data loss).

### Accessibility
- DOM order == visual order in a row; keyboard tab order must follow visual flow.
- Section headers use `<h3>` (or role=heading) to preserve a11y hierarchy.
- No content reflow on validation; errors appear inline without shifting neighboring columns.

### Perf & Budgets (no regressions)
- Keep current render budgets; GridRenderer should add **~0ms** on steps with ≤ 20 fields; ensure memoization of heavy maps.

### Acceptance Criteria
- With `gridLayout=0` or `ui.layout.type !== "grid"` → form renders identical to single‑column today.
- With `gridLayout=1` and minimal `ui.layout` grid → fields render in configured rows/columns.
- Tab order equals left→right, top→bottom per row.
- Forms without layout config still render correctly.
- Snapshot & DOM‑order tests pass.

### Risks & Mitigations
- **Risk:** Grid touches rendering; regressions.
  - **Mitigation:** Feature flag OFF by default; comprehensive tests; visual regression for demo.
- **Risk:** Missing fields cause silent loss.
  - **Mitigation:** Warn in dev; append unplaced fields at the end.
- **Risk:** Lint fails on schema mistakes.
  - **Mitigation:** Extend linter to validate layout (optional in V1).

---

## Work Breakdown (PR‑sized subtasks)

**P3‑04A — Grid Schema Types & Guardrails**
- Add TS types for `ui.layout` and `widgets[*].layout`.
- Validate at parse time (soft warnings) when span > columns, unknown fields, or mismatched totals.
- Unit tests for type guards and clamp logic.

**P3‑04B — GridRenderer Shell (Flag‑Gated)**
- Add `GridRenderer` component; wire selection in `FormRenderer` by flag + `ui.layout.type`.
- Render sections/rows/columns containers with CSS Grid; no field rendering yet.
- Unit tests: selection logic + SSR safety.

**P3‑04C — Field Placement & Fallbacks**
- Render actual fields in GridRenderer; obey `span`, field order, and column count.
- Unplaced fields appended below as full‑width.
- Unit tests for placement rules; snapshot tests.

**P3‑04D — Responsive Breakpoints**
- Add CSS variables for `columns` per breakpoint.
- Ensure columns collapse gracefully to 1‑column on narrow viewports.
- E2E (Playwright) smoke: viewport md→sm preserves order & tab focus.

**P3‑04E — Sections (Titles, Descriptions, Landmarks)**
- Render section headings with appropriate semantics.
- Add landmark/aria attributes for a11y.
- Unit tests for heading levels & DOM order.

**P3‑04F — Per‑Widget Layout Hints**
- Respect `ui.widgets[field].layout.colSpan/align/size` when column `span` not specified.
- Tests for hint precedence and clamping.

**P3‑04G — Error Rendering Stability**
- Ensure inline errors do not cause grid jumps; maintain row heights as needed.
- Unit tests: error injection keeps tab order and DOM order; screenshots optional.

**P3‑04H — Demo Form Updates (Layout Opt‑in)**
- Add minimal `ui.layout` to demo schema (two‑column rows in first steps; single‑column on review).
- Keep flag OFF in demo by default; document how to enable.
- Visual regression snapshots.

**P3‑04I — Docs & Examples**
- Update `FEATURES.md` and README with layout how‑to, examples, and flags.
- Add a small schema snippet showing sections/rows/columns.

---

## Test Plan
- Unit tests for: selection logic, field placement, span clamping, unplaced field fallback, section semantics, layout hints.
- Integration: grid ON/OFF parity; tab order across columns; error rendering stability.
- E2E (if available): keyboard‑only navigation through a grid step.
- Visual snapshots for demo step with 2×2 grid.

---

## Rollout
1. Land with flag OFF; merge frequently (≤400 LOC per PR).
2. Enable in demo locally with `NEXT_PUBLIC_FLAGS=gridLayout=1` for review.
3. Canary enable on one internal form after Phase 3 completion.
4. GA after 1 week with no regressions.
