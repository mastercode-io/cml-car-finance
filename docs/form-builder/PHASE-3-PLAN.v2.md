# PHASE-3-PLAN.v2 — Form Builder (Revised Sprint Scope)

**Branch:** `codex-form-builder`  
**Owner:** Alex (Form Experience)  
**Sprint:** Phase 3 (revised) — production-readiness first  
**Reference:** PRD-Phase-3.md

---

## Strategy (why this revision)
Phase 3 refocuses on **production readiness** and **risk-first sequencing**:
- Ship **feature flags/staged rollout** and fix **Phase-2 regressions** before landing high-surface work.
- Implement **layout** as a **flagged wrapper** with a rock-solid single-column fallback.
- Keep **Review** minimal (summary-only) and gate actual submit later.
- Deliver **core widgets** needed by authors; keep UK lookup narrow (V1) behind a flag.
- Add **KPI/perf hooks** and **degradation toggles** to monitor & protect UX at GA.

---

## Scope Summary (P0 vs P1)

### P0 (must land for GA fitness)
0. **Feature flags & staged rollout** (foundation)  
1. **Phase-2 regressions** (GIR 0AA, Repeater focus, offline retry)  
2. **Validation strategy & debounce** (honor schema) — **COMPLETED**  
**P3-NAV.** **Navigation guardrails** (terminal steps, deterministic resolver, review freeze, jump-to-invalid policy, dedupe) — **prereq for P3-03**  
3. **Review step (summary-only)** (no validation coupling yet)  
4. **Layout V1 (grid+sections+colSpan)** behind flag + fallback  
5. **MultiSelect widget**  
6. **Time & DateTime widgets** (combined)  
7. **UK Address Lookup (V1)** behind flag (provider chosen)  
8. **Analytics KPI hooks & default wiring** (events ready for dashboards)  
9. **Perf budgets & degradation toggles** (switches + eventing)

### P1 (nice-to-have, defer if needed)
- RadioGroup a11y polish  
- Theme tokens → CSS vars  
- Select “Add new…” (popover subform)  
- Schema linter & authoring docs expansion

---

## P3-NAV — Production-grade Navigation Guardrails (**P0**, prerequisite for P3-03)

**Goal:** Eliminate step loops and accidental rewinds (e.g., `legal → review → personal`) by making navigation **deterministic, explicit, and terminal-aware**, with safe rollout via feature flags.

**Feature flags (ship dark first):**
- `nav.terminalStep`
- `nav.explicitMode`
- `nav.reviewFreeze`
- `nav.jumpToFirstInvalidOn` = `'submit' | 'next' | 'never'` (default: `'submit'`)
- `nav.dedupeToken`

**Deliverables & Acceptance:**
1. **Terminal step semantics (resolver)**
   - If current step has **no outgoing transitions** → return `null` (stay).  
   - No fallback to first step’s default.
2. **Deterministic resolution (resolver)**
   - Per-step order: first matching **guarded** → the single **default** → `null`.  
   - Reject multiple `default: true` from same step (lint error).
3. **Review policy (renderer + config)**
   - `navigation.review = { terminal: true, validate: 'form', freezeNavigation: true }` when `nav.reviewFreeze` is ON.  
   - Reaching `review` never auto-navigates away; Submit validates whole form; Back returns.
4. **Jump-to-first-invalid (policy)**
   - Honored only on **submit** by default (configurable via `nav.jumpToFirstInvalidOn`).  
   - No auto-bounces while sitting on Review.
5. **Renderer dedupe & re-entrancy guard**
   - Tokenize step changes; ignore duplicates and stale tokens; drop `next === current`.
6. **Schema linter rules (CI-blocking)**
   - Duplicate step IDs ❌; >1 default per step ❌; unknown targets ❌; cycles ❌ (unless `allowCycle: true`).  
   - Warn if no terminal step is reachable.
7. **Analytics hooks (P1)**
   - Emit `nav_loop_detected` if oscillation between 2–3 steps occurs within 2s.
8. **Tests**
   - **Unit:** terminal → `null`; guard precedence; single default.  
   - **Integration:** reach Review and **stay** while autosave/computed fire; submit invalid → single bounce to first invalid.  
   - **E2E (keyboard-only):** Next/Back path reaches Review and stays; tab order intact.

**Touch points:** transition resolver, FormRenderer nav reducer, schema linter, analytics.  
**Rollout:** flags ON in demo/canary → observe → GA flip; keep kill-switch.

---

## Work Breakdown (self-contained tasks)
(Existing tasks retained; P3-NAV runs **before** P3-03)

- **P3-00 — Feature Flags & Staged Rollout (P0)**
- **P3-01 — Phase-2 Regressions Fix (P0)**
- **P3-02 — Validation Strategy & Debounce (P0)** — **DONE**

**→ P3-NAV (P0, prereq for P3-03)**

- **P3-03 — Review Step (Summary-only) (P0)**
- **P3-04 — Layout V1 (Flagged Wrapper) (P0)**
- **P3-05 — MultiSelect (P0)**
- **P3-06 — Time & DateTime (P0)**
- **P3-07 — UK Address Lookup V1 (P0, flagged)**
- **P3-08 — Analytics KPI Hooks (P0)**
- **P3-09 — Perf Budgets & Degradation (P0)**

### Risks & Mitigations
- **Layout blast radius** → **flagged** wrapper; strict single-column fallback.  
- **Navigation loops** → **P3-NAV** guards + linter + tests.  
- **Address API variance** → adapter + mock provider; manual fallback.

### Acceptance (Definition of Done)
- All P0 tasks merged; CI green (fmt/lint/type/test/build/size)  
- Visual snapshots (layout); a11y checks (Repeater, MultiSelect, Address listbox)  
- Demo schema shows grid + review summary + widgets + lookup (flags can be on in demo)  
- KPI/perf events visible in dev; redaction verified
