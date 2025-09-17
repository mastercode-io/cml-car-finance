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
