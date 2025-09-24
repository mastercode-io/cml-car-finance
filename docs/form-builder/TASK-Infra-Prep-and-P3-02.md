# TASK — Infra prep for CI (lint/type/test/build/size) + re-run P3-02

**Branch:** `codex/p3v2-infra-prep`  
**PR title:** `chore(infra): CI prep (lint/type/test/build/size) + rerun P3-02`  
**Tracker:** Update `PHASE-3-Tracker.v2.md` with branch, PR link/number, CI results, short notes.

---

## Context
CI steps are failing due to missing dev tooling and runtime deps. Do **infra-only** changes to unblock CI (no app logic changes), then re-run **P3-02** (Validation strategy & debounce) compile/tests.

**Current failures**
- `npm run lint` → ESLint not installed
- `npm run typecheck/build/size` → missing deps: `swr`, `@babel/traverse`, `zod-to-json-schema`, `web-vitals` (+ types)
- `npm run test` → Jest not available

---

## 0) Detect package manager & workspaces
At repo root:
```bash
node -v
npm pkg get workspaces
ls -1 pnpm-lock.yaml yarn.lock package-lock.json
```
Use the right tool:
- If `pnpm-lock.yaml` exists:
  ```bash
  corepack enable && corepack use pnpm@8
  pnpm install
  ```
- Else:
  ```bash
  npm ci || npm install
  ```

> If this is a workspace monorepo, keep **dev tooling** at the **root**, and install **runtime deps** in the **package that imports them** (use `-w packages/<name>`).

---

## 1) Install missing dev tooling (root)
```bash
# Lint
npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin   eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y

# Tests
npm i -D jest ts-jest jest-environment-jsdom @types/jest

# Types
npm i -D @types/node

# Size
npm i -D size-limit @size-limit/preset-small-lib
```

---

## 2) Install missing **runtime** deps (where they’re imported)
Find import owners:
```bash
grep -R "from 'swr'\|from \"swr\"" -n .
grep -R "@babel/traverse" -n .
grep -R "zod-to-json-schema" -n .
grep -R "web-vitals" -n .
```
Install in the owning package (or root if single-package):
```bash
npm i swr
npm i @babel/traverse && npm i -D @types/babel__traverse
npm i zod-to-json-schema
npm i web-vitals
```
> In a monorepo use: `npm i -w packages/<name> <dep>`.

---

## 3) Ensure scripts exist (add only if missing)
At root (or package that runs CI):
```jsonc
// package.json (scripts)
{
  "format": "prettier --write .",          // if Prettier is in use
  "lint": "eslint . --ext .ts,.tsx",
  "typecheck": "tsc -b --pretty false",
  "test": "jest",
  "build": "tsc -b",
  "size": "size-limit"
}
```

---

## 4) Minimal configs (create **only if missing**, don’t overwrite)

**.eslintrc.cjs**
```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint','react','react-hooks','jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2022: true, node: true, jest: true }
};
```

**jest.config.ts**
```ts
import type { Config } from 'jest';
const config: Config = {
  testEnvironment: 'jsdom',
  transform: { '^.+\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  moduleFileExtensions: ['ts','tsx','js','jsx','json'],
  testPathIgnorePatterns: ['/node_modules/','/dist/','/build/'],
};
export default config;
```

**.size-limit.json** (point to actual build artifact)
```json
[
  { "path": "packages/form-engine/dist/index.js", "limit": "15 kB" }
]
```

**TypeScript**
- Ensure root `tsconfig.base.json` (or equivalent) exists and packages extend it.
- Where tests live, add `"types": ["jest","node"]` in the relevant `tsconfig.json`.

---

## 5) Run CI locally and fix residuals
```bash
npm run format
npm run lint
npm run typecheck
npm run test
npm run build
CI=1 npm run size
```
If a module is still “not found”, identify the **package that imports it** and install there.  
If ESLint complains about missing parser/plugins, ensure they’re root devDeps.

---

## 6) Open PR
Commit with:  
`chore(infra): add lint/test/type/size scaffolding and missing deps`

PR body:
- **What**: Infra prep; no app logic changes
- **Why**: Unblock CI gates
- **Changes**: deps added, minimal configs created (only when missing), scripts ensured
- **Tests**: CI steps pass locally
- **Risks**: Low; config-only

Update `PHASE-3-Tracker.v2.md` row for this infra task with branch, PR link, and ✅/❌ per CI step.

---

## After merge — re-run **P3-02** (Validation strategy & debounce)
1) Rebase/merge the latest `codex-form-builder` into the P3-02 branch (or continue on updated base).
2) Ensure P3-02 **has no functional changes**—just make it compile and pass tests.
3) Run:
```bash
npm run typecheck
npm run test
npm run build
```
4) If failures are P3-02-specific, open a **small** PR with only those fixes.

**Deliverables**
- Infra prep PR (merged) with passing `format/lint/typecheck/test/build/size`.
- P3-02: successful `typecheck/test/build` and a short summary posted in the task.
- Tracker updated.
