# Form Engine Package

This package hosts the schema-driven form engine that will power the finance application forms.

## Structure

- `src/` – Source code organized into domain-specific folders
  - `core/` – Core orchestration logic and shared services
  - `components/` – Reusable UI primitives built on shadcn/ui and Headless UI
  - `hooks/` – Custom React hooks for form orchestration
  - `schemas/` – JSON schema definitions and fixtures
  - `utils/` – Shared utilities
  - `types/` – TypeScript declaration files
- `tests/` – Unit, integration, and end-to-end test suites
- `docs/` – Package-specific documentation and ADRs

Additional implementation will arrive in future steps of the plan.

## Feature flags

- `FeaturesProvider` exposes runtime feature toggles with sensible defaults (all layout/navigation enhancements disabled) and merges schema-provided features with environment overrides from `NEXT_PUBLIC_FLAGS`.【F:packages/form-engine/src/context/features.tsx†L13-L177】
- Use `useFlag('gridLayout')` (or other flag names) inside components to branch on behavior, or pass `overrides` to `FeaturesProvider` for tests and Storybook scenarios.【F:packages/form-engine/src/context/features.tsx†L180-L200】

## Grid layout renderer (flagged)

- When `gridLayout` is enabled and a schema declares `ui.layout.type: "grid"`, `FormRenderer` swaps the single-column flow for `GridRenderer`. The component renders each section as an accessible `<section>` landmark with headings/descriptions, sorts rows by responsive order hints, and appends any unplaced fields to a fallback row.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L1104-L1108】【F:packages/form-engine/src/renderer/layout/GridRenderer.tsx†L100-L405】
- Layout metadata supports responsive column counts, gutter/row gaps, per-field spans, alignment, hide/show rules, and widget-level overrides, all defined under the shared UI types and computed through the responsive helpers.【F:packages/form-engine/src/types/ui.types.ts†L3-L106】【F:packages/form-engine/src/renderer/layout/responsive.ts†L13-L271】
- Unit and integration tests cover the grid renderer’s fallback to single-column when disabled, responsive breakpoints, error stability, and landmark semantics—use them as references when extending the layout engine.【F:packages/form-engine/src/renderer/layout/__tests__/GridRenderer.spec.tsx†L41-L391】【F:packages/form-engine/tests/integration/formrenderer.grid-layout.test.tsx†L60-L142】
