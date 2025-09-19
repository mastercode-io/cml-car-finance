# Remediation Tracker

Initialized: 2025-09-19 10:43 UTC

## Checklist
- [x] R-01 — Install missing dev dependencies
- [x] R-02 — Install missing runtime deps
- [x] R-03 — Install missing type defs
- [x] R-04 — Configure ESLint
- [ ] R-05 — Configure Jest
- [ ] R-06 — Update external type declarations
- [ ] R-07 — Implement missing field components
- [ ] R-08 — Update existing fields to use shadcn/ui
- [ ] R-09 — Register all components in Field Registry
- [ ] R-10 — Complete XState submission action
- [ ] R-11 — Add XState integration tests
- [ ] R-12 — Add smoke tests
- [ ] R-13 — Configure size-limit
- [ ] R-14 — Create minimal demo and E2E test

## Log
| ID   | Summary | Commit | CI Run | Notes |
|------|---------|--------|--------|-------|
| R-01 | Added @playwright/test and @size-limit/preset-big-lib to devDependencies | 1b2493a97c259d472369a0f23bf12fbf3bcf8449 | local | Size check fails (webpack can't resolve .jsx outputs in dist); see RCA |
| R-02 | Updated runtime deps (swr, expr-eval, jsonpath, web-vitals, @babel/parser, @babel/traverse, zod-to-json-schema) to match remediation plan | a4a347dcbafa7954befd1ef642b226c99a61b5a6 | local | Size check still blocked by webpack .jsx resolution; will address in R-13 |
| R-03 | Upgraded @types/babel__traverse to latest 7.28.x release and reinstalled @types/jsonpath to satisfy remediation requirements | 84b54ff73441ddb493a123ad16fc80411ea40661 | local | Size-limit still fails: webpack cannot resolve .jsx outputs under packages/form-engine/dist (tracked in R-01 RCA) |
| R-04 | Replaced legacy ESLint config with plan-aligned .eslintrc.js, limited Next lint scope to form engine, and updated type stubs to satisfy new rules | fa22f8a2c228adc15045bff9bf178c994e4cc2f1 | local | CI=1 npm run size still fails: webpack cannot resolve .jsx artifacts emitted in packages/form-engine/dist; RCA tracked under R-01/R-13 |

## CI Summary (latest)
- Lint: ☑ | Typecheck: ☑ | Tests: ☑ | Build: ☑ | Size: ☐ (size-limit webpack resolution failure)

## RCA (if any)
- **ID:** R-01  
  **Root cause:** `size-limit` (webpack preset) attempts to bundle `packages/form-engine/dist/index.js`, but the compiled field components are emitted as `.jsx` files so webpack cannot resolve the imports.  
  **Fix applied:** None — remediation requires converting build output to `.js` or adjusting bundler config, which is out of scope for R-01.  
  **Follow-up:** Address module resolution when tackling size-limit configuration (R-13) or adjust the build pipeline to emit `.js` bundles.
