# Phase-2 Review Report

## Summary
Ran the requested checks: `npm run format` succeeded, but `npm run lint` still fails locally because ESLint is not installed in this workspace, so lint/typecheck/test/build/size were not re-run past that point. The review focused on the Phase-2 GA items (P2-01…P2-09); most implementations look solid, but I found a couple of regressions around accessibility and postcode validation along with a missing offline scenario test.

The repeater widget now normalizes configs, enforces min/max counts, and surfaces nested errors, yet it never moves focus into the newly added item—an accessibility regression called out in the scope. The AJV `gb-postcode` format and the matching field pattern also reject the special `GIR 0AA` postcode that Product requested as a canonical example, and the unit tests only assert modern shapes, so the gap would ship unnoticed. Finally, submission retry logic never distinguishes offline failures, and there is no Jest coverage that simulates offline mode, so the spec item for offline handling is not met.

## Checklist
- P2-01 Repeater widget: ⚠️ Missing focus handoff after add.
- P2-02 UK Postcode format/widget: ❌ `GIR 0AA` rejected; tests miss legacy shape.
- P2-03 Submission retry & draft: ⚠️ No offline-specific handling or tests.
- P2-04 Session timeout UX: ✅ Countdown + restart/restore flows exercised.
- P2-05 CSP with nonce: ✅ Nonce plumbed from middleware through layout/components.
- P2-06 Composer override guard: ✅ Collision guard requires `{ override: true, reason }` and trims directives.
- P2-07 Analytics payload: ✅ Version metadata present and sensitive keys redacted.
- P2-08 Sampling defaults: ✅ Production default 1 % with env overrides covered.
- P2-09 Rollback runbook: ✅ Scripts/docs present and tested.

## Findings
| Severity | Area | File:Line | What’s wrong | Why it matters | Minimal fix |
| --- | --- | --- | --- | --- | --- |
| Blocker | Validation | packages/form-engine/src/validation/ajv-setup.ts:52-59; packages/form-engine/src/components/fields/specialized/PostcodeField.tsx:21 | `gb-postcode` regex only allows 1–2 letter outward codes, so canonical legacy code `GIR 0AA` (and other special cases) fail validation and the widget mask; tests only cover SW1A/EC1A so this slips through. | Users entering still-valid historic postcodes will be blocked even though Product called out `GIR 0AA` as a required example. | Broaden the regex/pattern to explicitly allow `GIR 0AA` (and update tests to cover it); see patch below. |
| Medium | Accessibility | packages/form-engine/src/components/fields/RepeaterField.tsx:149-170 | `handleAddItem` appends and announces but never shifts focus into the new item, so keyboard/screen-reader users remain on the “Add” button contrary to the scope’s a11y requirement. | Without moving focus, the newly inserted controls aren’t discoverable without extra navigation, hurting usability. | After appending, schedule a focus on the first tabbable field inside the new item (e.g. via `requestAnimationFrame` + `querySelector`). |
| Medium | Resilience | packages/form-engine/src/renderer/FormRenderer.tsx:476-507; packages/form-engine/tests/unit/FormRenderer.test.tsx:352-469 | Retry loop only inspects HTTP status codes; offline `TypeError` exceptions skip retries and show a generic error, and there’s no unit test simulating offline as required. | Offline users won’t see tailored messaging and autosave coverage isn’t verified, leaving the offline acceptance criterion unmet. | Detect `navigator.onLine === false` (or `error.message === 'Failed to fetch'`) to show offline guidance and add a Jest case that mocks an offline failure. |

## Suggested patches
```diff
--- a/packages/form-engine/src/validation/ajv-setup.ts
+++ b/packages/form-engine/src/validation/ajv-setup.ts
@@
-    const postcodeValidator = (data: string) =>
-      /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(data.trim());
+    const postcodeValidator = (data: string) => {
+      const trimmed = data.trim().toUpperCase();
+      if (!trimmed) return false;
+      if (trimmed === 'GIR 0AA') return true;
+      return /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/.test(trimmed);
+    };
```
```diff
--- a/packages/form-engine/src/components/fields/specialized/PostcodeField.tsx
+++ b/packages/form-engine/src/components/fields/specialized/PostcodeField.tsx
@@
-const POSTCODE_PATTERN = '^[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2}$';
+const POSTCODE_PATTERN = '^(GIR 0AA|[A-Za-z]{1,2}\\d[A-Za-z\\d]? ?\\d[A-Za-z]{2})$';
@@
-  const normalized = normalizePostcode(value);
+  const normalized = normalizePostcode(value);
+  if (normalized === 'GIR0AA') {
+    return 'GIR 0AA';
+  }
```
```diff
--- a/packages/form-engine/tests/unit/form-engine.test.ts
+++ b/packages/form-engine/tests/unit/form-engine.test.ts
@@
-    const success = await engine.validate(schema, {
-      postcode: 'SW1A 1AA',
-      legacyPostcode: 'EC1A 1BB',
-    });
+    const success = await engine.validate(schema, {
+      postcode: 'GIR 0AA',
+      legacyPostcode: 'EC1A 1BB',
+    });
```

## Follow-ups
- Consider a follow-up to introduce true offline queuing/UX (e.g. banner that recognizes offline state) once GA is locked.
- Broaden postcode acceptance further if future requirements add BFPO/overseas formats.
