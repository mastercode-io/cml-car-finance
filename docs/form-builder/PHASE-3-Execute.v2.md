# PHASE-3-Execute.v2 — Guidelines & Conventions (Revised)

## Workflow
- One branch per task: `codex/p3v2-<nn>-<slug>`
- Small PRs (≤ 400 LOC diff). Land high-risk work **behind flags**.
- Update the tracker row (branch, PR, CI, notes) with each PR.

## Feature Flags (must)
- Provider: `FeaturesProvider` (context) + `useFlag(name, default?)`
- Env overrides: `NEXT_PUBLIC_FLAGS="gridLayout=true,addressLookupUK=false,nav.reviewFreeze=true"`
- Schema overrides: `schema.features: { gridLayout: true }`
- **Renderer gates**
  - `gridLayout` → GridRenderer vs SingleColumnRenderer
  - `addressLookupUK` → lookup widget vs postcode+manual only
  - `reviewSummary` → show summary step (CTA can still be gated)
  - **Navigation (new)**
    - `nav.terminalStep` (treat steps with no outgoing edges as terminal)
    - `nav.explicitMode` (resolve transitions only on Next/Back, not on background recomputes)
    - `nav.reviewFreeze` (freeze on Review; ignore auto-next)
    - `nav.jumpToFirstInvalidOn` (`submit|next|never`)
    - `nav.dedupeToken` (ignore stale/duplicate step changes)

## Risk Controls
- Keep existing single-column path fully functional.
- After merging a flagged feature, **leave the flag OFF by default** in demo until basic tests pass.
- Create **rollback points** (git tags) after P3-00, P3-01, **P3-NAV**, P3-04.

## Testing Order (to de-risk)
1. P3-01 regressions (unit + small Playwright flows)  
2. P3-02 validation strategy (unit only)  
3. **P3-NAV resolver + renderer** (unit/integration/e2e) ← *run before Review*  
4. P3-03 Review summary (snapshot/a11y)  
5. P3-04 layout wrapper (Playwright snapshots sm/md/lg)  
6. Widgets (unit + a11y checks)  
7. Address lookup (mocked unit + manual fallback)  
8. KPI/perf hooks (payload snapshots)  
9. Perf toggles (synthetic over-budget test)

## Commands
```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
npm run size
npm run dev
```

## PR Template
**What** – short summary  
**Why** – user value / bug fix / readiness  
**Changes** – bullet points  
**Flags** – which feature flags are introduced/used; default state  
**Tests** – unit/visual/a11y notes  
**Docs** – links to updated MDs  
**Risks** – perf, a11y, CSP, breaking changes (note **nav** behavior changes if any)

## A11y & Visual
- Repeater: focus into newly added row; announce via aria-live
- MultiSelect/Address listbox: roles, keyboard navigation, labelledby/aria-activedescendant
- Review summary: landmarks/headings; redaction respected
- Visual snapshots: layout at sm/md/lg; ensure tab order logical

## Perf & KPI
- Record p95 step transition; emit KPI events (step start/complete, submit ok/fail)
- Degradation toggles: disable animations / reduce recompute when over budget
- Verify analytics sampling (prod 1%) and `v/payloadVersion` in payloads

## Security
- CSP nonce via hook/context for any inline needs
- No PII in logs; redaction verified by tests
