# P3-02a — Fix FormRenderer onSubmit summary regression (post P3-02)

**Branch:** `codex/p3v2-02a-submit-summary-fix`  
**Goal:** When the user submits from Review (or any step), `onSubmit` must receive a **fresh, full-form summary** and be called **exactly once**, even if debounced validations are pending (introduced in P3-02). Tests must pass.

---

## Context
- Current status: `npm run test` fails with a FormRenderer submit/summary regression after P3-02 (debounced validation).
- We added debounced validation (`onChange` with debounce + `onBlur` strategy). Submit races with pending debounce → summary may be stale or submit path may fire twice.

---

## What to change (surgical)
1. **FormRenderer submit path**
   - Before calling `onSubmit`, ensure **all pending debounced validations are flushed**.
   - Then **trigger full-form validation** (`react-hook-form` `trigger(undefined, { shouldFocus: false })`).
   - If invalid → **do not** call `onSubmit`; exit cleanly.
   - If valid → **build summary from current values** (honor `retainHidden`) and call `onSubmit(summary)` **once**.
   - Add a small **reentrancy/duplication guard** so rapid double-click or stale queued submits do not double-call.

2. **Expose/implement a flush for debounced work**
   - Locate where the debounce lives (e.g., `useValidationStrategy`, validation manager, or `useDebouncedCallback`).
   - Export a **`flushPendingValidation(): Promise<void>`** (no-op if nothing pending) that drains timers/microtasks.
     - If debounce is timer-based, track a pending promise and resolve after the timer fires; provide a synchronous `flush()` that runs the pending callbacks and clears the timer.
     - Keep API minimal/internal (no public breaking changes).

3. **Summary builder**
   - Ensure summary uses **`methods.getValues()`** (or equivalent) at the moment after flush + full trigger.
   - Respect `schema.metadata?.retainHidden` behavior already defined in the engine.

4. **Do NOT change**
   - Navigation semantics, layout engine, or demo page components.
   - Public API surface of FormRenderer props (add only internal plumbing as needed).

---

## Implementation sketch (adapt to codebase)
- **FormRenderer.tsx** (or equivalent):
  ```ts
  const handleSubmit = async () => {
    // 1) Flush any pending debounced validations (from P3-02)
    await validationManager?.flushPendingValidation?.();

    // 2) Full form validation to settle final validity
    const isValid = await methods.trigger(undefined, { shouldFocus: false });
    if (!isValid) {
      // Optional: emit analytics; jump-to-first-invalid is OFF by default (handled later in P3-NAV)
      return;
    }

    // 3) Build summary from current values; include computed values if contract requires
    const values = methods.getValues();
    const summary = buildSummary(values, {
      retainHidden: schema?.metadata?.retainHidden === true,
    });

    // 4) Reentrancy guard — ensure single call
    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;
    try {
      await props.onSubmit?.(summary);
    } finally {
      submitInFlightRef.current = false;
    }
  };
  ```

- **Validation manager / hook** (where debounce lives):
  ```ts
  // Provide a flush that runs pending debounced callbacks immediately.
  // If using setTimeout, clear it and run the work; if using a debounced lib, call .flush().
  export function flushPendingValidation(): Promise<void> { /* no-op if none pending */ }
  ```
  Wire this into FormRenderer via context or local closure where it’s created.

---

## Tests to add/fix
Create/adjust tests to cover the regression and protect against future breaks.

1. **Unit: flush + trigger before submit**
   - Given a field updated with debounced validation **not yet fired**
   - When `onSubmit` is invoked
   - Then `flushPendingValidation` is awaited, `trigger(undefined)` is called, and `onSubmit` receives **fresh** values.

2. **Unit: onSubmit called once**
   - Simulate double-click or two quick submits
   - Ensure `onSubmit` called **exactly once** (reentrancy guard).

3. **Integration: Review step**
   - Fill fields, navigate to Review, change a field (trigger debounce), immediately submit.
   - Expect: summary contains the latest value; no double-submit; form respects `retainHidden`.

4. **(Optional) Negative: invalid form**
   - Pending debounce + invalid value → submit triggers full validation → `onSubmit` **not** called.

> Keep existing tests intact—they caught the regression. Only adjust if expectations were wrong.

---

## Code search hints
- Search for: `FormRenderer`, `onSubmit`, `trigger(`, `getValues(`, `debounce`, `useValidationStrategy`, `flush`, `buildSummary`.
- Likely files: `src/form/FormRenderer.tsx` (or similar), a validation strategy module introduced in P3-02, summary utilities.

---

## Commands to run
```bash
# ensure clean tree
git checkout -b codex/p3v2-02a-submit-summary-fix

npm run format
npm run lint
npm run typecheck

# reproduce failure
npm run test

# implement fix + tests, then:
npm run test

# full CI parity
npm run build
CI=1 npm run size
```

---

## Acceptance criteria
- `npm run test` ✅ (regression fixed).
- `onSubmit` receives **fresh** summary after debounced changes.
- `onSubmit` not called when form invalid.
- No double-submit; handler called once.
- No changes to navigation/layout behaviors.

---

## Deliverables
- Code changes (FormRenderer + validation debounce owner) with `flushPendingValidation`.
- New/updated tests (unit + integration as above).
- PR: **“P3-02a: Flush debounced validation before submit; single-call onSubmit; fresh summary”**
  - Include before/after test output in PR description.

**Proceed.**
