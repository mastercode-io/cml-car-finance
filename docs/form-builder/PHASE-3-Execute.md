# PHASE-3-Execute — Guidelines & Conventions

## Workflow
- Branch per task: `codex/p3-<nn>-<slug>`
- Conventional commits: `feat|fix|chore(scope): message`
- Open PR into `codex-form-builder` with the template below
- Prefer **small PRs** (≤ 400 LOC diff) and land behind flags where risky

## PR Template (paste)
**What**  
Short summary.

**Why**  
User value / bug / parity.

**Changes**  
- bullet list

**Tests**  
- unit: …
- visual: …
- a11y: …

**Docs**  
Links to MD updates.

**Risks**  
Perf, a11y, CSP, breaking changes.

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

## Visual & A11y
- Use Playwright for snapshots at sm/md/lg (`apps/demo` pages)
- Keyboard-only path must work; focus rings visible
- Use `aria-live` for async/long operations

## Perf & Size
- Target p95 step transition < 150ms
- Keep bundle delta per task < +5kB (size-limit CI)

## Security
- CSP nonce: use provided hook/context for any inline script/style
- No PII in logs; analytics redacts email/phone

## Conflict Resolution
- Always keep “newer” API surface (Phase-3)
- Resolve duplicate tests by keeping one
- Re-run `lint`, `typecheck`, `test` after conflicts

## Demo & Docs
- Update demo schema to showcase new features
- Update docs under `docs/form-builder/`:
  - `AUTHORING.md` (layout, widgets)
  - `ANALYTICS.md`
  - `FEATURES.md` (append)
  - `GA-SMOKE.md` (new checks)
