# AGENTS.md

This file defines how AI agents (e.g. OpenAI Codex) should work with this repository.

---

## Project Overview

- **Language / Framework**: TypeScript + React + Next.js 14 (App Router)
- **UI Library**: TailwindCSS + shadcn/ui + HeadlessUI (if needed)
- **Form Engine**: React Hook Form (RHF) + AJV (JSON Schema validation)
- **State Management**: Local state via React; optional **XState** for complex branched flows
- **Persistence**: localforage for client-side draft storage
- **Purpose**: JSON-schema–driven dynamic form builder/renderer
- **Documentation**: `/docs/`

---

## Coding Conventions

- **Style**: ESLint + Prettier enforced in CI
- **Type System**: TypeScript strict mode enabled
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **Tests**: Use Jest + React Testing Library; 90% path coverage target
- **Dependencies**: Only add new packages if explicitly required in `/docs/form-builder/*` or approved in PR review

---

## How to Run Locally

- **Install dependencies**:

  ```bash
  npm install
  ```

- **Run dev server**:

  ```bash
  npm run dev
  ```

- **Build production bundle**:

  ```bash
  npm run build
  npm start
  ```

- **Run tests**:

  ```bash
  npm test
  ```

- **Lint/format**:
  ```bash
  npm run lint
  npm run format
  ```

---

## Safe Editing Rules

- Only modify files inside `/src` and `/tests` unless the plan specifies otherwise
- Do not hardcode secrets; use `.env.local` (example in `.env.example`)
- Never remove or disable existing tests unless explicitly instructed
- Avoid introducing unused imports, dead code, or commented-out blocks
- Follow accessibility standards (WCAG 2.1 AA) for UI changes

---

## Branching & PR Rules

- **Branch**: Work in the current feature branch (`codex-form-builder`)
- **PR title**: `feat(scope): summary (step NN)`
- **PR body**: Must include:
  - Short summary of changes
  - Checklist from relevant `docs/plan/NN-step.md`
  - CI status (tests, lint, typecheck must pass)

---

## Workflow for Agents

1. Read `/docs/form-builder/form-builder-PRD-v2.2.md` and `/docs/form-builder/implementation-plan-summary.md` for high-level context
2. Execute the current step in `/docs/form-builder/step-NN-*.md`
3. Implement code changes according to schema-driven architecture
4. Run linters, formatters, and tests:
   ```bash
   npm run lint
   npm run format
   npm test
   ```
5. Commit changes using Conventional Commit format
6. Push and open a PR to the connected branch
7. Ensure CI passes before continuing to the next step
8. Update `CHANGELOG.md` if step introduces new features

---

## Example PR Checklist

- [ ] Implemented requirements from `docs/form-builder/step-NN-*.md`
- [ ] Added/updated tests (Jest/RTL)
- [ ] Code formatted with Prettier
- [ ] CI passing (lint + typecheck + tests)
- [ ] Documentation updated if required

---

---

## Continuous Integration (CI)

We enforce build quality via GitHub Actions. The workflow runs on every push and PR to the feature branch and must pass before merge.

### Required checks

- **Lint**: `npm run lint`
- **Typecheck**: `npm run typecheck` (tsc --noEmit)
- **Unit tests**: `npm test -- --ci`
- **Build**: `npm run build`
- **Bundle budget**: `npm run size` (uses size-limit; ≤150KB gzipped for critical entry)

> Performance budgets and sampling described in PRD v2.2 should be validated in staging via separate monitoring jobs.

### Local parity

Run all checks locally before pushing:

```bash
npm run format && npm run lint && npm run typecheck && npm test && npm run build && npm run size
```

### Scripts expected in package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "size": "size-limit",
    "size:why": "npx size-limit --why"
  },
  "size-limit": [
    {
      "name": "app bundle",
      "path": "apps/web/.next/static/chunks/*.js",
      "limit": "150 KB"
    }
  ]
}
```

> Adjust `path` to match your Next.js output (e.g., `.next/static/chunks/*.js`). For a monorepo, scope as needed.

## Core Dependencies

- **next** (>=14) – framework
- **react** / **react-dom** (>=18)
- **typescript** (>=5) – static typing
- **tailwindcss** + **shadcn/ui** – UI components and styling
- **react-hook-form** – form state management
- **ajv** – JSON Schema validation
- **localforage** – client-side persistence
- **xstate** (optional) – state machine for complex flows
- **jest** + **@testing-library/react** – unit/integration testing
