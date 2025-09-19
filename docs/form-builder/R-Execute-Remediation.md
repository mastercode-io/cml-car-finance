# R — Execute Remediation Plan (Codex Task)

**Goal:** Read and execute the remediation plan in **`/docs/form-builder/remediation-plan.md`** end‑to‑end. Apply fixes incrementally with CI gates and produce a final report.

---

## Inputs
- Plan: `/docs/form-builder/remediation-plan.md`
- Prior review: `/docs/form-builder/codex-review.md` (for pass/fail context)
- Repo rules: `/AGENTS.md`

## Branch / PR Strategy
- If a step branch is currently open for this work, **continue on that branch**.
- Otherwise create a rolling branch: `remediation/20250919`.
- Keep a **single PR** open titled: **"Remediation: implement fixes from remediation-plan.md"** and push commits to it until the plan is complete.

## Execution Loop (repeat for each plan item, top→bottom)
1. **Implement the change** with the smallest possible diff, following the exact commands/configs in the plan file.
2. **Run checks** in the sandbox:
   ```bash
   npm run format
   npm run lint
   npm run typecheck
   npm test -- --ci
   npm run build
   npm run size
   ```
   - If dependencies change: update `package.json` and **regenerate `package-lock.json`** with `npm install`, then re-run the checks.
3. **Commit** using Conventional Commits, e.g.:
   ```
   fix(form-engine): <short summary> (remediation R-<nn>)
   ```
4. **Push** to the remediation branch and let **GitHub Actions** run. Address any red checks before moving on.
5. **Log progress** in `/docs/form-builder/remediation-report.md` (see template below).

## Plan-Specific Notes
- **Phase 1 (Infrastructure & Dependencies):** Install all dev/runtime deps exactly as listed in the plan. Add ESLint & Jest configs verbatim, replace TODO type stubs with concrete types.
- **Phase 2 (Field Registry):** Implement missing field components using `shadcn/ui` wrappers and **register every widget** called out by the PRD. Keep diffs focused by field.
- **Phase 3 (XState Integration):** Replace placeholder submission; add integration tests and ensure the machine reaches `submitted` in tests.
- **Phase 4 (Validation & Testing):** Add smoke tests and ensure **size-limit** stays within budget.
- **Phase 5 (Demo):** Create the minimal demo route/page and an E2E test (Playwright) proving the feature works.

## Acceptance Criteria
- All items in `remediation-plan.md` are implemented and **checked off** in the report.
- CI is **green** (lint, typecheck, tests, build, size) on the PR.
- No `TS6059/TS6307/TS7006` or ESLint config errors remain.
- Field registry exposes the full widget catalog required by the PRD.
- XState submission/action path is covered by integration tests.
- A demo form renders and submits in the app and passes the E2E test.
- `/docs/form-builder/remediation-report.md` summarizes fixes with links to commits and CI runs.

## Guardrails
- **No destructive edits** outside scope; **no new deps** beyond the plan unless unavoidable—if needed, justify in the PR body and in the report.
- On repeated failures of the same check (**>3 attempts**), pause and document an RCA section in the report before proceeding.

---

## Report Template → `/docs/form-builder/remediation-report.md`

```markdown
# Remediation Report

## Checklist
- [ ] Phase 1 – Infrastructure & Dependencies
- [ ] Phase 2 – Field Registry
- [ ] Phase 3 – XState Integration
- [ ] Phase 4 – Validation & Testing
- [ ] Phase 5 – Demo & E2E

## Changes & Commits
- R-01: <summary> — <commit SHA> — <CI run link>
- R-02: <summary> — <commit SHA> — <CI run link>
...

## CI Summary
- Lint: ✅/❌  | Typecheck: ✅/❌ | Tests: ✅/❌ | Build: ✅/❌ | Size: ✅/❌

## RCA (if any)
- Issue: <short title>
- Root cause:
- Fix applied:
- Follow-up:
```

---

## One-liner to start (for Codex prompt box)
```
Execute the remediation plan at /docs/form-builder/remediation-plan.md end-to-end on the current remediation branch. 
For each item: implement, run format/lint/typecheck/tests/build/size, commit (fix: …), push, and update /docs/form-builder/remediation-report.md. 
Stop only on unrecoverable CI failure (>3 attempts) and summarize with RCA; otherwise proceed until the plan is complete.
```
