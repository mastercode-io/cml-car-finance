# Remediation Tracker

Initialized: 2025-09-19 10:43 UTC

## Checklist

- [x] R-01 — Install missing dev dependencies
- [x] R-02 — Install missing runtime deps
- [x] R-03 — Install missing type defs
- [x] R-04 — Configure ESLint
- [x] R-05 — Configure Jest
- [x] R-06 — Update external type declarations
- [x] R-07 — Implement missing field components
- [x] R-08 — Update existing fields to use shadcn/ui
- [x] R-09 — Register all components in Field Registry
- [x] R-10 — Complete XState submission action
- [x] R-11 — Add XState integration tests
- [x] R-Stab-01 — Single-source ambient types
- [x] R-Stab-02 — Verify form-engine public exports
- [x] R-Stab-03 — Configure size-limit for form-engine
- [x] R-Stab-04 — Form-engine build hygiene sweep
- [x] R-12 — Add smoke tests
- [x] R-13 — Configure size-limit
- [x] R-14 — Create minimal demo and E2E test

## Log

| ID        | Summary                                                                                                                                                                   | Commit                                   | CI Run | Notes                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-01      | Added @playwright/test and @size-limit/preset-big-lib to devDependencies                                                                                                  | 1b2493a97c259d472369a0f23bf12fbf3bcf8449 | local  | Size check fails (webpack can't resolve .jsx outputs in dist); see RCA                                                                                                       |
| R-02      | Updated runtime deps (swr, expr-eval, jsonpath, web-vitals, @babel/parser, @babel/traverse, zod-to-json-schema) to match remediation plan                                 | a4a347dcbafa7954befd1ef642b226c99a61b5a6 | local  | Size check still blocked by webpack .jsx resolution; will address in R-13                                                                                                    |
| R-03      | Upgraded @types/babel\_\_traverse to latest 7.28.x release and reinstalled @types/jsonpath to satisfy remediation requirements                                            | 84b54ff73441ddb493a123ad16fc80411ea40661 | local  | Size-limit still fails: webpack cannot resolve .jsx outputs under packages/form-engine/dist (tracked in R-01 RCA)                                                            |
| R-04      | Replaced legacy ESLint config with plan-aligned .eslintrc.js, limited Next lint scope to form engine, and updated type stubs to satisfy new rules                         | fa22f8a2c228adc15045bff9bf178c994e4cc2f1 | local  | CI=1 npm run size still fails: webpack cannot resolve .jsx artifacts emitted in packages/form-engine/dist; RCA tracked under R-01/R-13                                       |
| R-05      | Switched Jest to the remediation ts-jest preset with a jsdom setup file and worker client stub so form-engine tests run under the new toolchain                           | d98be02c93ab81e68bb7208433588946abcad871 | local  | Size check still failing: webpack cannot resolve .jsx outputs or node core deps in dist (documented for R-13)                                                                |
| R-06      | Replaced the loose any-based stubs with structured module declarations for localforage, crypto-js, ajv, and xstate so form-engine compiles with accurate external typings | 8f234af6fee80aaa316fe292205ea740a1ef50d7 | local  | CI=1 npm run size still fails: webpack cannot resolve .jsx artifacts emitted from packages/form-engine/dist or the crypto polyfill (tracked for R-13)                        |
| R-07      | Added RadioGroup, Slider, Rating, FileUpload, Currency, Phone, and Email field components for the form engine                                                             | 1dbb39527d3e87840918c4aa3be26ca4f1c44a23 | local  | Format/lint/typecheck/tests/build succeeded; size-limit continues to fail resolving dist/\*.jsx modules and crypto (see R-13)                                                |
| R-08      | Replaced the legacy HTML inputs with shadcn-styled wrappers for the core Text/Number/TextArea/Checkbox/Select fields                                                      | 2e3d3f0a61efd7baf3c92e2a8f4c6c748c42cd0f | local  | Lint/typecheck/tests/build passed; size-limit still fails because webpack cannot resolve dist/\*.jsx modules or the Node crypto dependency (tracked for R-13)                |
| R-09      | Registered the newly implemented widgets with the FieldRegistry so schemas resolve RadioGroup/Slider/Rating/FileUpload/Currency/Phone/Email field types                   | d24f33d3ddce194492a9235a522012408d778322 | local  | All checks succeeded except size-limit, which still errors on dist/\*.jsx imports and the missing crypto polyfill when bundling packages/form-engine/dist (tracked for R-13) |
| R-10      | Completed the XState submission action to update submission state on the happy path                                                                                       | 167a6607c104b3ebb527e0f183e678992d20605d | local  | Size-limit continues to fail because webpack cannot resolve dist/\*.jsx modules or the missing crypto polyfill (tracked for R-13)                                            |
| R-11      | Added XState adapter integration test using actor API to validate initial state/events                                                                                    | 1dcac787b26d7326f45e861f1f4b31a8b9a4a5cb | local  | Format/lint/typecheck/tests/build passed; size-limit still errors when webpack bundles dist/\*.jsx outputs and the missing crypto polyfill (tracked for R-13)                |
| R-12      | Added smoke tests that verify the public exports and a minimal render/submit flow                                                                                         | b4cea9deab9ee549fc86a5b367a7f2ad96ef7c9c | local  | Format/lint/typecheck/tests/build/size all passed with resolved tsconfig                                                                                                     |
| R-13      | Configured dual size-limit budgets for the form-engine dist entry (raw file + webpack bundle)                                                                             | 463c7e62c4dbaf7d190cc07b88e2f21979dc263a | local  | Recorded 585 B raw entry and 111.85 kB webpack bundle budgets under the 125 kB cap                                                                                           |
| R-Stab-01 | Scoped the form-engine typecheck includes to `src`/`src/types` and verified a single ambient `xstate` module declaration                                                  | 44f0aedb2ad575a029291370cd163e043ee937f7 | local  | Format/lint/typecheck/tests/build/size all pass with the guard ensuring one xstate ambient source                                                                            |
| R-Stab-02 | Normalized form-engine public exports and patched build artifacts to emit .js entrypoints for webpack                                                                     | 4757b2f444101d340db9943d39ae8159d6b26e84 | local  | size-limit still fails: webpack needs a crypto polyfill/external; to be handled in R-Stab-03                                                                                 |
| R-Stab-03 | Configured size-limit to bundle the form-engine entry with peer deps ignored and a 125 kB budget                                                                          | 12dc22b4c3f529052a0b330b15095b2ef8f34b75 | local  | size-limit now passes at ~112 kB gzipped after externals + crypto fallback                                                                                                   |
| R-Stab-04 | Tightened form-engine tsconfig/typecheck scope and chained the package build ahead of Next.js                                                                             | db61599c6f55c716ad313ad2a622509d722879b5 | local  | Verified format/lint/typecheck/tests/build/size all succeed with cleaned dist output                                                                                         |
| R-14      | Added a Suspense-wrapped demo page and Playwright smoke covering happy-path navigation to Employment step
                                                        | pending-local                            | local  | Format/lint/typecheck/tests/build/size + demo Playwright smoke executed locally
                           |



## CI Summary (latest)

- Lint: ☑ | Typecheck: ☑ | Tests: ☑ | Build: ☑ | Size: ☑ (raw dist 585 B / webpack bundle 111.85 kB gz)

## RCA (if any)

- **ID:** R-01  
  **Root cause:** `size-limit` (webpack preset) attempts to bundle `packages/form-engine/dist/index.js`, but the compiled field components are emitted as `.jsx` files so webpack cannot resolve the imports.  
  **Fix applied:** None — remediation requires converting build output to `.js` or adjusting bundler config, which is out of scope for R-01.  
  **Follow-up:** Address module resolution when tackling size-limit configuration (R-13) or adjust the build pipeline to emit `.js` bundles.
