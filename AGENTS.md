# Repository Guidelines

## Project Structure & Module Organization
Next.js 14 App Router drives the UI: screens live in `app/`, reusable UI in `components/`, and shared styles in `styles/` with Tailwind tuned via `tailwind.config.ts`. The form engine and schema tooling live in `packages/form-engine`; helpers stay in `hooks/`, `utils/`, and `lib/`. Assets sit in `public/`, scripts in `scripts/`, and reference docs in `docs/` plus `PROJECT_OVERVIEW.md`. Jest specs live under `packages/form-engine/tests`, Playwright journeys in `e2e/`, mocks in `mock-server.js`, and deploy files in `netlify/`.

## Build, Test, and Development Commands
- `npm run dev`: Boots Next via `scripts/run-next-with-env.js`, loading `.env.local`.
- `npm run build`: Runs `tsc -b`, workspace builds, then `next build`; execute before release PRs.
- `npm run lint` / `npm run format`: ESLint and Prettier checks; run both before committing UI or schema changes.
- `npm run typecheck`: Lightweight TS validation for shared models.
- `npm run test` or `npm run test:ci`: Serial Jest suite (unit + integration).
- `npm run test:e2e`: Playwright scenarios in `e2e/`.
- `npm run ci:guards`: Repo-specific size/env gates for tooling work.

## Coding Style & Naming Conventions
TypeScript everywhere, formatted by Prettier (2 spaces, semicolons, single quotes, 100-character lines). React components and hooks use PascalCase (`LoanCard.tsx`) and camelCase (`useLoanLookup.ts`). Prefer Tailwind utilities inline; extract shared styles into `styles/credit-form.css` only when stacks become noisy. Server helpers in `lib/` end with intent-revealing suffixes like `*Service`. Re-run `npm run lint` after refactors so imports auto-fix.

## Testing Guidelines
Keep unit, integration, and smoke specs under `packages/form-engine/tests/**` using the existing `*.test.ts[x]` and `*.smoke.test.tsx` suffixes. Component tests rely on Testing Library + `@testing-library/jest-dom` already initialized in `jest.setup.js`. Critical journeys (loan search, admin decisioning) need Playwright specs named like `e2e/loan-search.spec.ts`, with failure screenshots attached. Always run `npm run test` before pushing and note the suites in the PR.

## Commit & Pull Request Guidelines
Continue the conventional commit style (`feat(demo): …`, `chore(merge): …`) with scopes that match the primary folder touched. PRs need a crisp summary, motivation, linked ticket, and testing evidence; include before/after captures for UI work and rollout notes for schema or workflow updates.

## Security & Configuration Tips
Never commit secrets; keep personal overrides in `.env.local` and document new variables in `docs/`. Public data must use the `NEXT_PUBLIC_` prefix, while private values stay on the server or Netlify dashboard. When adding APIs, extend `middleware.ts` for routing/auth and record mock payloads in `mock-server.js` so other agents can reproduce flows offline.
