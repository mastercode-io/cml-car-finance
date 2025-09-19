# R — Execute Remediation Plan (v2) — Codex Playbook

**Goal:** Implement the remediation plan at `/docs/form-builder/remediation-plan.md` in **small, resumable tasks**, with **commit+push after each item**, and a persistent **progress tracker**.

---

## Inputs
- Plan: `/docs/form-builder/remediation-plan.md`
- Review context: `/docs/form-builder/codex-review.md` (optional)
- Repo rules: `/AGENTS.md`

## Branch / PR Strategy
- **Working branch:** `codex-form-builder` (do **not** create new branches).
- **PR:** keep using the existing PR for this branch (rolling PR). Push after **every item**.

## Golden Rules (must follow)
1. Work **one or two items at a time** (max 2).
2. After each item: **format → lint → typecheck → test → build → size**, then **commit & push**.
3. Update the tracker file `/docs/form-builder/R-Tracker.md` (see below) after each item.
4. If a check fails, fix and retry up to **3 attempts**. If still failing, **stop**, append an RCA section to the tracker, and report.
5. Never edit outside the scope of the current item. No new deps unless the plan requires them.

## Execution Loop (repeat until all items complete)
For the **next unchecked item** in the tracker:
1. Implement the change (smallest diff possible).  
2. Run:
   ```bash
   npm run format
   npm run lint
   npm run typecheck
   npm test -- --ci
   npm run build
   npm run size
   ```
3. Commit (Conventional Commit), push, and update the tracker.
4. If all green and < 2 items done in this run, proceed to the next unchecked item; otherwise **stop and report**.

## Tracker File
Maintain `/docs/form-builder/R-Tracker.md` with a checklist and links. If it doesn’t exist, **create it** using the template below and fill it as you progress.

---

# Tracker Template → /docs/form-builder/R-Tracker.md

> Initialized: 2025-09-19 10:43 UTC

## Checklist (by ID)
- [ ] R-01 — Install missing dev dependencies (ESLint, TS, Jest, Testing Library, Playwright, size-limit)
- [ ] R-02 — Install missing runtime deps (swr, expr-eval, jsonpath, web-vitals, @babel/parser, @babel/traverse, zod-to-json-schema)
- [ ] R-03 — Install missing type defs (@types/jsonpath, @types/babel__traverse)
- [ ] R-04 — Configure ESLint (.eslintrc.js) per plan
- [ ] R-05 — Configure Jest (jest.config.js, jest.setup.js) per plan
- [ ] R-06 — Update external type declarations (packages/form-engine/src/types/external.d.ts)
- [ ] R-07 — Implement missing field components (RadioGroup, Slider, Rating, FileUpload, Currency, Phone, Email)
- [ ] R-08 — Update existing fields to use shadcn/ui and cn()
- [ ] R-09 — Register all components in Field Registry
- [ ] R-10 — Complete XState submission action + happy path
- [ ] R-11 — Add XState integration tests
- [ ] R-12 — Add smoke tests
- [ ] R-13 — Configure size-limit (.size-limit.js)
- [ ] R-14 — Create minimal demo page (/demo) and E2E test

> The IDs above map 1–1 to the remediation plan phases and items. If the plan is edited, update this tracker accordingly.

## Log
| ID   | Summary                                         | Commit | CI Run | Notes |
|------|--------------------------------------------------|--------|--------|-------|
| R-01 |                                                  |        |        |       |
| R-02 |                                                  |        |        |       |
| R-03 |                                                  |        |        |       |
| R-04 |                                                  |        |        |       |
| R-05 |                                                  |        |        |       |
| R-06 |                                                  |        |        |       |
| R-07 |                                                  |        |        |       |
| R-08 |                                                  |        |        |       |
| R-09 |                                                  |        |        |       |
| R-10 |                                                  |        |        |       |
| R-11 |                                                  |        |        |       |
| R-12 |                                                  |        |        |       |
| R-13 |                                                  |        |        |       |
| R-14 |                                                  |        |        |       |

## CI Summary (latest)
- Lint: ☐/☑ | Typecheck: ☐/☑ | Tests: ☐/☑ | Build: ☐/☑ | Size: ☐/☑

## RCA (if any)
- **ID:** R-__  
  **Root cause:**  
  **Fix applied:**  
  **Follow-up:**  

---

## One-Liner Prompt (to resume safely)
```
Open /docs/form-builder/R-Tracker.md. Implement only the next one or two unchecked items from the checklist. 
After each item: run format/lint/typecheck/tests/build/size, commit & push to codex-form-builder, update R-Tracker.md (check off, add commit+CI links), then stop and report.
```
