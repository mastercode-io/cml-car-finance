# Form Builder Feature Catalogue

## Overview
The form builder runtime is exposed through `@form-engine`, which publishes the schema composer, renderer, field registry, analytics, persistence, and hook utilities so host apps can compose them as needed.【F:packages/form-engine/src/index.ts†L1-L63】 Multi-step schemas drive `FormRenderer`, which orchestrates validation, transitions, visibility, persistence, and widget rendering while mapping JSON widget declarations to React components registered in the field registry.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L86-L823】【F:packages/form-engine/src/core/field-registry.ts†L75-L103】 Supporting services cover analytics, computed fields, external data sources, drafts, and performance budgets so authored schemas stay declarative while runtime concerns remain extensible.【F:packages/form-engine/src/analytics/FormAnalytics.ts†L48-L294】【F:packages/form-engine/src/computed/ComputedFieldEngine.ts†L12-L297】【F:packages/form-engine/src/datasources/DataSourceManager.ts†L1-L210】【F:packages/form-engine/src/persistence/PersistenceManager.ts†L5-L320】【F:packages/form-engine/src/performance/PerformanceBudget.ts†L1-L153】 Strict CSP headers and nonce propagation protect the shell and empower widgets to opt into inline resources securely.【F:middleware.ts†L1-L39】【F:lib/security/csp.ts†L1-L34】【F:app/layout.tsx†L22-L41】【F:components/security/nonce-context.tsx†L6-L18】

## Feature Map
| Area | What it does | Key files | JSON keys | Default behavior | Tests |
| --- | --- | --- | --- | --- | --- |
| Schema composition | Composes schemas via `extends`, enforces `{ "override": true, "reason": "..." }` when overriding steps/transitions, and merges deeply with guard rails for `$id`/`version`.【F:packages/form-engine/src/core/schema-composer.ts†L62-L220】 | `core/schema-composer.ts` | `extends`, `override`, `reason` | Throws `SchemaOverrideError` if override confirmation is missing. | – |
| Field registry & widgets | Lazily bootstraps built-in widgets (Text, Number, Date, Select, Checkbox, Radio, Repeater, FileUpload, Slider, Rating, Currency, Phone, Postcode, Email) and wraps them via `FieldFactory`, falling back to Text when unknown.【F:packages/form-engine/src/core/field-registry.ts†L75-L103】【F:packages/form-engine/src/components/fields/FieldFactory.tsx†L16-L64】 | `core/field-registry.ts`, `components/fields/*` | `ui.widgets.<field>.component` | Warns and renders Text when a widget is unregistered. | – |
| Widgets (defaults) | Provide accessible, RHF-integrated widgets for text, email, postcode, number, date, select, checkbox, and repeater collections with schema-driven props and callbacks.【F:packages/form-engine/src/components/fields/TextField.tsx†L12-L158】【F:packages/form-engine/src/components/fields/specialized/EmailField.tsx†L11-L142】【F:packages/form-engine/src/components/fields/specialized/PostcodeField.tsx†L21-L203】【F:packages/form-engine/src/components/fields/NumberField.tsx†L12-L211】【F:packages/form-engine/src/components/fields/DateField.tsx†L12-L198】【F:packages/form-engine/src/components/fields/SelectField.tsx†L23-L229】【F:packages/form-engine/src/components/fields/CheckboxField.tsx†L12-L179】【F:packages/form-engine/src/components/fields/RepeaterField.tsx†L20-L280】 | `components/fields/*`, `types/ui.types.ts` | `ui.widgets.*` | Controlled components synced with RHF; repeater enforces min/max and a11y. | – |
| Validation engine | Configures Ajv with custom formats, keywords (`requiredWhen`, `crossField`, `asyncValidate`), and performance tracking; `StepValidator` + hooks orchestrate per-step or worker-based validation.【F:packages/form-engine/src/validation/ajv-setup.ts†L18-L355】【F:packages/form-engine/src/validation/step-validator.ts†L20-L130】【F:packages/form-engine/src/hooks/useStepValidation.ts†L20-L113】【F:packages/form-engine/src/validation/worker-client.ts†L33-L146】 | `validation/*`, `hooks/useStepValidation.ts` | `validation.strategy`, `validation.debounceMs`, `asyncValidate`, `requiredWhen` | Resolver runs synchronously on change; worker auto-selected for large/async schemas. | `step-validator.test.ts` covers warnings vs. blocking.【F:packages/form-engine/tests/unit/step-validator.test.ts†L5-L72】 |
| Visibility rules | Evaluates `x-visibility` on fields and `visibleWhen` on steps using JSONPath-aware rules, custom functions (`isWeekday`, `hasRole`, `isComplete`), and caches to avoid redundant evaluations.【F:packages/form-engine/src/rules/rule-evaluator.ts†L12-L178】【F:packages/form-engine/src/rules/visibility-controller.ts†L6-L110】 | `rules/rule-evaluator.ts`, `rules/visibility-controller.ts` | `properties.*['x-visibility']`, `steps[].visibleWhen` | Falls back to visible and logs on rule errors. | – |
| Transitions & routing | Computes next/previous steps via explicit transitions, guards, and visibility-aware fallbacks while recording history for diagnostics/testing.【F:packages/form-engine/src/rules/transition-engine.ts†L12-L156】 | `rules/transition-engine.ts`, `renderer/StepProgress.tsx` | `transitions[]`, guard ids | Linear fallback when no transition matches; hidden steps skipped. | Path generator ensures review paths are included.【F:packages/form-engine/tests/unit/testing/PathGenerator.test.ts†L5-L91】 |
| Submission & offline resilience | Validates all visible steps, retries submission (3 attempts, 500 ms exponential backoff), detects offline failures, and saves drafts when errors occur.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L463-L548】 | `renderer/FormRenderer.tsx` | – | Surfaces info/error banners; offline shows recovery guidance. | Renderer test covers retries/offline draft save.【F:packages/form-engine/tests/unit/FormRenderer.test.tsx†L442-L520】 |
| Autosave & drafts | Persists drafts with encryption/compression, TTL cleanup, autosave intervals, manual recovery UI, and `draftLoaded` events.【F:packages/form-engine/src/persistence/PersistenceManager.ts†L5-L320】【F:packages/form-engine/src/persistence/useAutosave.ts†L1-L189】【F:packages/form-engine/src/persistence/DraftRecovery.tsx†L7-L165】 | `persistence/*` | `metadata.allowAutosave`, `metadata.sensitivity`, `metadata.timeout`, `ttlDays` | Autosave enabled unless disabled; high sensitivity requires encryption. | Autosave + manager tests cover intervals, encryption, expiry.【F:packages/form-engine/tests/unit/persistence/useAutosave.test.tsx†L1-L47】【F:packages/form-engine/tests/unit/persistence/PersistenceManager.test.ts†L16-L71】 |
| Session timeout | Tracks `metadata.timeout`, renders countdown banner, locks navigation on expiry, and exposes restart/restore flows with persistence cleanup.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L86-L792】 | `renderer/FormRenderer.tsx` | `metadata.timeout` | Defaults to 30 min when unset; disables navigation when expired. | Session tests verify restart/restore behavior.【F:packages/form-engine/tests/unit/FormRenderer.test.tsx†L526-L582】 |
| Analytics & performance | Buffers analytics events with sampling/redaction, exposes hook helpers, and enforces performance budgets via web-vitals listeners.【F:packages/form-engine/src/analytics/FormAnalytics.ts†L48-L294】【F:packages/form-engine/src/hooks/useFormAnalytics.ts†L1-L191】【F:packages/form-engine/src/performance/PerformanceBudget.ts†L1-L153】 | `analytics/FormAnalytics.ts`, `hooks/useFormAnalytics.ts`, `performance/PerformanceBudget.ts` | `metadata.sensitivity`, optional analytics config | Sampling defaults to 100% dev / 1% prod with sensitive-field redaction. | Analytics tests cover sampling, redaction, marks.【F:packages/form-engine/tests/unit/analytics/FormAnalytics.test.ts†L53-L160】 |
| Security & CSP | Generates per-request nonce, emits strict CSP, and provides a nonce context for widgets to consume when injecting inline resources.【F:middleware.ts†L1-L35】【F:lib/security/csp.ts†L1-L34】【F:app/layout.tsx†L22-L41】【F:components/security/nonce-context.tsx†L6-L18】 | `middleware.ts`, `lib/security/csp.ts`, `app/layout.tsx` | – | Nonce required for inline scripts/styles; dev loosens CSP for tooling. | – |
| Computed fields & data sources | Evaluates computed expressions with dependency tracking + topological sort, integrates SWR-backed data source fetching with caching, retries, and transforms.【F:packages/form-engine/src/computed/ComputedFieldEngine.ts†L12-L297】【F:packages/form-engine/src/hooks/useComputedFields.ts†L16-L88】【F:packages/form-engine/src/datasources/DataSourceManager.ts†L1-L210】【F:packages/form-engine/src/hooks/useDataSource.ts†L7-L24】 | `computed/*`, `datasources/*`, `hooks/useDataSource.ts` | `computed[]`, `dataSources.*` | Computed values cached unless `cache:false`; data sources cache per key when enabled. | – |
| Grid layout renderer (flagged) | Switches to the multi-column `GridRenderer` when the `gridLayout` flag and `ui.layout.type === "grid"` are both present, rendering sectioned rows, responsive spans, widget-level layout hints, and fallbacks for unplaced fields.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L1104-L1108】【F:packages/form-engine/src/renderer/layout/GridRenderer.tsx†L100-L430】【F:packages/form-engine/src/renderer/layout/responsive.ts†L13-L292】【F:packages/form-engine/src/context/features.tsx†L13-L177】 | `renderer/FormRenderer.tsx`, `renderer/layout/GridRenderer.tsx`, `renderer/layout/responsive.ts`, `context/features.tsx` | `ui.layout.type`, `ui.layout.sections[].rows[].fields`, `ui.widgets[field].layout.*`, `features.gridLayout`, `NEXT_PUBLIC_FLAGS` | Default OFF; falls back to single-column containers and skips hidden fields when disabled or not configured.【F:packages/form-engine/src/renderer/layout/GridRenderer.tsx†L100-L205】【F:packages/form-engine/tests/integration/formrenderer.grid-layout.test.tsx†L92-L106】 | Grid renderer unit + integration tests cover spans, a11y sections, fallbacks, responsiveness, and error stability.【F:packages/form-engine/src/renderer/layout/__tests__/GridRenderer.spec.tsx†L41-L391】【F:packages/form-engine/tests/integration/formrenderer.grid-layout.test.tsx†L60-L142】 |
| Theming & layout metadata | Schema `ui.layout` now defines sections, responsive columns, and gutter/row spacing while `ui.theme` reserves future styling hooks; widget `layout` blocks add per-field overrides consumed by the grid renderer.【F:packages/form-engine/src/types/ui.types.ts†L3-L106】【F:packages/form-engine/src/renderer/layout/responsive.ts†L36-L271】 | `types/ui.types.ts`, `renderer/layout/responsive.ts` | `ui.layout`, `ui.theme`, `ui.widgets[field].layout` | Layout metadata is optional; when omitted the renderer reverts to stacked fields.【F:packages/form-engine/src/renderer/layout/GridRenderer.tsx†L100-L423】 | Grid renderer tests assert fallback rows, heading levels, and hint precedence.【F:packages/form-engine/src/renderer/layout/__tests__/GridRenderer.spec.tsx†L60-L391】 |

## Deep Dives

### Widgets & Fields
`initializeFieldRegistry` seeds the default widget set so schema authors can reference `ui.widgets.<field>.component` without manual registration.【F:packages/form-engine/src/core/field-registry.ts†L75-L99】 `FieldFactory` resolves each widget, warns on missing registrations, and wraps the component with shared label/error chrome, falling back to the Text widget when nothing matches.【F:packages/form-engine/src/components/fields/FieldFactory.tsx†L16-L64】 Widget metadata is authored under `ui.widgets`, with optional validation, options, repeater config, and conditional styling rules (`styleWhen`).【F:packages/form-engine/src/types/ui.types.ts†L19-L63】 Key widgets:

- **Text** – Controlled `input[type=text]` wired to RHF via `Controller`, forwarding focus/blur/change events, and applying `aria-invalid` styling when validation fails.【F:packages/form-engine/src/components/fields/TextField.tsx†L12-L157】 Schema snippet:
  ```json
  "fullName": {
    "type": "string",
    "minLength": 1,
    "ui": { "widgets": { "fullName": { "component": "Text", "label": "Full name" } } }
  }
  ```
- **Email** – Adds `type="email"`, default `autoComplete=email`, and an `onStringChange` callback for analytics redaction hooks; supports external value control while mirroring into RHF state.【F:packages/form-engine/src/components/fields/specialized/EmailField.tsx†L11-L142】 Pair with schema `{ "format": "email" }` to reuse Ajv's built-in checks.【F:packages/form-engine/src/validation/ajv-setup.ts†L18-L69】
- **UK Postcode** – Normalizes input to uppercase, strips spaces, optionally auto-formats outward/inward codes, and enforces a UK postcode pattern while emitting string change events.【F:packages/form-engine/src/components/fields/specialized/PostcodeField.tsx†L21-L203】 Ajv exposes `uk-postcode`/`gb-postcode` formats for server parity.【F:packages/form-engine/src/validation/ajv-setup.ts†L35-L87】
- **Number** – Parses values to numbers/null, respects min/max/step from schema or component props, and calls `onNumberChange` when a valid numeric value is produced.【F:packages/form-engine/src/components/fields/NumberField.tsx†L12-L210】 Configure with schema constraints such as `{ "type": "number", "minimum": 0 }`.
- **Date** – Converts between ISO strings and `Date` objects, normalizes min/max boundaries, and fires `onDateSelect` with parsed `Date` instances to support computed logic.【F:packages/form-engine/src/components/fields/DateField.tsx†L12-L198】 Use schema `{ "type": "string", "format": "date" }` with optional `minimum`/`maximum` ISO strings.
- **Select** – Wraps shadcn's select, exposing read-only mode, placeholder, optional hidden input for non-string values, and retains server-friendly hidden input for HTML form fallback.【F:packages/form-engine/src/components/fields/SelectField.tsx†L23-L229】 Supply `ui.widgets.field.options` for static choices or `optionsFrom` to hydrate from a data source.【F:packages/form-engine/src/types/ui.types.ts†L27-L49】
- **Checkbox** – Mirrors boolean state into a hidden `<input>` for submission compatibility, surfaces `onCheckedChange`, and honors read-only/disabled states.【F:packages/form-engine/src/components/fields/CheckboxField.tsx†L12-L179】 Schema: `{ "type": "boolean" }`.
- **Repeater** – Uses `useFieldArray` to manage list fields, filters invalid child configs, seeds default items, enforces `minItems`/`maxItems`, and announces add/remove/reorder actions via a polite live region while focusing the first interactive control of new rows for a11y.【F:packages/form-engine/src/components/fields/RepeaterField.tsx†L20-L280】 Child widgets inherit nested `ui.widgets` entries and can define defaults via `defaultValue`.

### Validation (AJV formats, strategies, debounce)
`ValidationConfig` (schema-level) exposes `strategy`, `debounceMs`, `asyncTimeoutMs`, and `suppressInlineErrors`, though the current renderer hard-codes `mode: 'onChange'` and does not yet consume the strategy/debounce flags.【F:packages/form-engine/src/types/schema.types.ts†L7-L19】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L119-L125】 `ValidationEngine` configures Ajv with strict defaults (`coerceTypes`, `useDefaults`, `removeAdditional: 'failing'`), custom formats (UK postcode, US zip, phone, IBAN, currency, credit card), and keywords (`requiredWhen`, `crossField`, async HTTP validation).【F:packages/form-engine/src/validation/ajv-setup.ts†L18-L254】 Each validation run records durations and exposes `getPerformanceMetrics` for budgets.【F:packages/form-engine/src/validation/ajv-setup.ts†L270-L355】 `StepValidator` registers per-step schemas, optionally delegates to a `ValidationWorkerClient`, separates warnings from blocking errors, and can validate all steps in sequence.【F:packages/form-engine/src/validation/step-validator.ts†L20-L130】 `useStepValidation` automatically spins up a worker when schemas are large, async, or complex, while providing `validate`, `clearErrors`, and the last result for consumers.【F:packages/form-engine/src/hooks/useStepValidation.ts†L20-L113】 Unit tests confirm warnings still allow progression when configured.【F:packages/form-engine/tests/unit/step-validator.test.ts†L5-L44】 Debounce and alternate strategies remain TODO (see Known Limitations).

### Visibility (`x-visibility` ops, examples, pitfalls)
`RuleEvaluator` supports comparison (`eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `in`, `regex`), logical (`and`, `or`, `not`), custom, and constant (`always`) operators with JSONPath (`$.field`) or context (`@env`, `@now`) operands; results are cached per data snapshot with an evaluation cap to prevent runaway rules.【F:packages/form-engine/src/rules/rule-evaluator.ts†L12-L120】 `VisibilityController` wires defaults (`isWeekday`, `hasRole`, `isComplete`), evaluates field-level `x-visibility` and step `visibleWhen`, and resolves `$ref` definitions when needed, falling back to visible (with console error) if evaluation throws.【F:packages/form-engine/src/rules/visibility-controller.ts†L6-L110】 Pitfalls: invalid JSONPaths resolve to `undefined`, causing comparisons to fail; ensure rule operands mirror the schema structure. Example field snippet:
```json
"employmentStatus": {
  "type": "string",
  "ui": {
    "widgets": {
      "employmentStatus": { "component": "Select", "label": "Status" }
    }
  },
  "x-visibility": { "op": "in", "left": "$.applicant.country", "right": ["UK", "US"] }
}
```

### Repeaters (min/max, focus behavior, a11y, errors)
`RepeaterField` guards against missing child configs, seeds default item values, and uses `useFieldArray` to keep nested state in sync with RHF.【F:packages/form-engine/src/components/fields/RepeaterField.tsx†L61-L200】 It auto-appends placeholder items to satisfy `minItems`, trims extras beyond `maxItems`, and exposes `Add`, `Remove`, `Move` controls with accessible labels and disabled states.【F:packages/form-engine/src/components/fields/RepeaterField.tsx†L180-L280】 An off-screen live region announces actions, and `focusItemControl` searches primary/fallback selectors to focus the first interactive control in a new or moved item for keyboard users.【F:packages/form-engine/src/components/fields/RepeaterField.tsx†L83-L206】 Errors bubble up by querying RHF state for each nested path, so schema authors must align repeater field names with actual nested schema keys.

### Transitions & routing (steps, guarded nav, review step API, `allowReviewIfInvalid`)
`TransitionEngine` sorts transitions so guard-based routes win before `default` ones, evaluates rule-based `when`, optional guard functions, and skips hidden targets via an embedded `VisibilityController` before falling back to the next visible step or submission.【F:packages/form-engine/src/rules/transition-engine.ts†L12-L156】 `FormRenderer` integrates this engine on `Next`/`Previous`, records history for back navigation, and focuses the first error when validation fails.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L566-L612】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L463-L485】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L633-L647】 `StepProgress` renders an accessible progress nav that only allows revisiting completed/error steps, keeping forward navigation guarded.【F:packages/form-engine/src/renderer/StepProgress.tsx†L10-L148】 Review steps are modeled as normal transitions (see path generator test), and no explicit `allowReviewIfInvalid` flag exists yet—highlighted as a backlog item.【F:packages/form-engine/tests/unit/testing/PathGenerator.test.ts†L5-L91】

### Submission (retry/backoff, offline handling), autosave/draft
On submit, the renderer validates every visible step via the Ajv engine, focuses the first failing field, and only proceeds when all steps pass; otherwise it surfaces errors and keeps the user on the failing step.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L463-L487】 Successful submissions append `_meta` metadata (schema id/version, timestamp, completed steps).【F:packages/form-engine/src/renderer/FormRenderer.tsx†L489-L499】 Failures trigger up to three retries with exponential backoff (500 ms base) for retryable statuses; offline detection inspects navigator state, `TypeError`, and fetch error strings.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L500-L544】 When the final attempt fails, the renderer saves a manual draft (immediate flush) and surfaces tailored messaging for offline vs. server errors.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L526-L544】 Unit tests verify retry/backoff and offline messaging coupled with draft persistence.【F:packages/form-engine/tests/unit/FormRenderer.test.tsx†L442-L520】

`PersistenceManager` writes drafts to IndexedDB via localforage, enforces encryption for high-sensitivity forms, compresses large payloads, applies TTL expiry, and tracks metadata (timestamps, save counts, device/session ids).【F:packages/form-engine/src/persistence/PersistenceManager.ts†L5-L320】 `useAutosave` instantiates a manager per form, generates encryption keys automatically for high sensitivity when none is provided, schedules interval saves, dispatches a `draftLoaded` custom event, and exposes `saveDraft`, `clearDraft`, and `loadDraft` helpers.【F:packages/form-engine/src/persistence/useAutosave.ts†L1-L189】 Tests cover autosave intervals, disabled state, encryption, and TTL cleanup.【F:packages/form-engine/tests/unit/persistence/useAutosave.test.tsx†L14-L47】【F:packages/form-engine/tests/unit/persistence/PersistenceManager.test.ts†L16-L71】 `DraftRecovery` and `DraftManagementDialog` render UX for resuming or discarding stored drafts with relative timestamps and version details.【F:packages/form-engine/src/persistence/DraftRecovery.tsx†L7-L165】

### Session timeout (metadata.timeout, banner UX, focus mgmt)
`metadata.timeout` (minutes) is converted to milliseconds, defaulting to 30 minutes when absent.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L86-L148】 The renderer tracks remaining time every second, shows an info/warning/error banner when under the five-minute threshold or expired, and disables navigation/submit buttons upon expiry.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L151-L676】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L821-L859】 Users may restart (clearing drafts and resetting state) or restore saved drafts, both of which reset timers and focus states while relaying success/failure feedback.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L678-L792】 Jest tests assert that expiry locks controls and that restart/restore flows interact with persistence correctly.【F:packages/form-engine/tests/unit/FormRenderer.test.tsx†L526-L582】

### CSP + nonce (where injected, what is blocked/allowed)
The Next.js middleware creates a 16-byte nonce, stores it on the request headers, and builds a CSP restricting scripts/styles to self, nonce, and Google Fonts, plus strict `object-src`, `frame-ancestors`, and referrer policy defaults.【F:middleware.ts†L1-L35】【F:lib/security/csp.ts†L1-L34】 The root layout reads `x-nonce`, injects it into `<meta name="csp-nonce">`, tags Google Fonts with the nonce, and provides a React context via `NonceProvider` so widgets or analytics can retrieve the nonce when creating inline elements.【F:app/layout.tsx†L22-L41】【F:components/security/nonce-context.tsx†L6-L18】 Widgets that load third-party resources must pull from this context and pass the nonce to comply with CSP.

### Analytics (v, payloadVersion, sampling defaults, redaction)
`FormAnalytics` resolves sampling (explicit, env var, or 1 % production / 100 % non-prod), assigns event (`v`) and payload versions, sanitizes sensitive keys (email/phone/SSN, etc.), tracks step/validation/submission events, and buffers payloads until the `bufferSize` threshold, flushing via idle callbacks or on visibility/unload.【F:packages/form-engine/src/analytics/FormAnalytics.ts†L48-L294】 Sensitive redaction recursively replaces values whose paths match sensitive keywords.【F:packages/form-engine/src/analytics/FormAnalytics.ts†L270-L294】 `useFormAnalytics` wraps the class, wires up `PerformanceBudget` for validation/step metrics, and exposes helpers for field interactions, step views, validation outcomes, and submissions.【F:packages/form-engine/src/hooks/useFormAnalytics.ts†L1-L191】【F:packages/form-engine/src/performance/PerformanceBudget.ts†L1-L153】 Tests cover sampling overrides, default sampling, redaction, and performance marks.【F:packages/form-engine/tests/unit/analytics/FormAnalytics.test.ts†L53-L160】 Consumers must opt-in by calling the hook and forwarding callbacks to the renderer or custom widgets.

### Composer/fragment override (`override:true`, `reason`)
`SchemaComposer` loads base schemas, recursively composes dependencies, and requires `{ "override": true, "reason": "..." }` when overriding any value outside `$id`/`version`; missing confirmations throw `SchemaOverrideError` to ensure change control. Steps and transitions are merged by id/edge with the same guard, logging warnings when overrides replace existing widgets or transitions.【F:packages/form-engine/src/core/schema-composer.ts†L69-L211】 This enables fragment reuse with explicit audit trails for regulators.

### Theming/layout (gutter, density, tone) & i18n hooks
Schema metadata defines layout groups (type, columns, gutter, breakpoints) and theme tokens (brand color, density, tone, corner radius).【F:packages/form-engine/src/types/ui.types.ts†L1-L63】 The renderer currently renders a single-column card and only reads `schema.ui.widgets`, so layout/theme metadata is a forward-looking contract requiring implementation (see Known Limitations).【F:packages/form-engine/src/renderer/FormRenderer.tsx†L807-L823】 No built-in i18n hooks exist; localization must occur in host apps or custom widgets.

### Extension points (how to add a field/widget/validator)
- **Widgets**: Call `FieldRegistry.getInstance().register('MyWidget', { component, formatter, parser, validator })` before rendering. `FieldFactory` will resolve it when `ui.widgets.field.component = "MyWidget"`.【F:packages/form-engine/src/core/field-registry.ts†L50-L103】【F:packages/form-engine/src/components/fields/FieldFactory.tsx†L16-L64】
- **Validation**: Extend `ValidationEngine` (add formats/keywords), pass a custom instance into application code, or attach a `ValidationWorkerClient` to `StepValidator` for off-main-thread validation.【F:packages/form-engine/src/validation/ajv-setup.ts†L18-L254】【F:packages/form-engine/src/validation/step-validator.ts†L20-L130】【F:packages/form-engine/src/validation/worker-client.ts†L33-L146】 Custom rule functions can be registered on `RuleEvaluator` for visibility/transition guards.【F:packages/form-engine/src/rules/rule-evaluator.ts†L32-L120】
- **Computed fields**: Register expressions via `ComputedFieldEngine.registerComputedField`, subscribe with `useComputedFields`, and add custom helper functions via `registerCustomFunction` for domain-specific logic.【F:packages/form-engine/src/computed/ComputedFieldEngine.ts†L12-L297】【F:packages/form-engine/src/hooks/useComputedFields.ts†L16-L88】
- **Data sources**: Plug new fetchers or helper functions using `DataSourceManager.registerFetcher` / `registerFunction`; components can hydrate options through `useDataSource` with SWR caching semantics.【F:packages/form-engine/src/datasources/DataSourceManager.ts†L40-L107】【F:packages/form-engine/src/hooks/useDataSource.ts†L7-L24】
- **Analytics**: Wrap the form with `useFormAnalytics` and call `trackStepView`, `trackFieldInteraction`, etc., or invoke `FormAnalytics.trackEvent` directly for bespoke telemetry.【F:packages/form-engine/src/hooks/useFormAnalytics.ts†L17-L191】【F:packages/form-engine/src/analytics/FormAnalytics.ts†L110-L214】

## How-to Snippets

### Author a schema with visibility, validation, and overrides
```json
{
  "$id": "finance.loan.v1",
  "version": "1.0.0",
  "extends": ["finance.base"],
  "override": true,
  "reason": "Adjust income threshold",
  "metadata": {
    "title": "Loan application",
    "description": "Apply for a vehicle loan",
    "sensitivity": "medium",
    "allowAutosave": true,
    "timeout": 45
  },
  "definitions": {
    "review": {
      "type": "object",
      "properties": {
        "confirmation": { "type": "boolean" }
      }
    }
  },
  "steps": [
    {
      "id": "applicant",
      "title": "Applicant details",
      "schema": {
        "type": "object",
        "properties": {
          "fullName": { "type": "string", "minLength": 1 },
          "email": { "type": "string", "format": "email" },
          "postcode": { "type": "string", "format": "uk-postcode" },
          "annualIncome": { "type": "number", "minimum": 0 }
        },
        "required": ["fullName", "email"]
      }
    },
    {
      "id": "income",
      "title": "Income",
      "visibleWhen": { "op": "gt", "left": "$.applicant.annualIncome", "right": 0 },
      "schema": { "$ref": "#/definitions/review" }
    },
    { "id": "review", "title": "Review", "schema": { "$ref": "#/definitions/review" } }
  ],
  "transitions": [
    { "from": "applicant", "to": "income", "when": { "op": "gt", "left": "$.applicant.annualIncome", "right": 0 } },
    { "from": "applicant", "to": "review", "default": true },
    { "from": "income", "to": "review", "default": true }
  ],
  "ui": {
    "widgets": {
      "fullName": { "component": "Text", "label": "Full name" },
      "email": { "component": "Email", "label": "Email address" },
      "postcode": { "component": "Postcode", "label": "UK postcode", "autoFormat": true },
      "annualIncome": { "component": "Number", "label": "Annual income", "min": 0, "step": 100 }
    },
    "layout": {
      "type": "two-column",
      "gutter": 24,
      "groups": [
        { "id": "contact", "fields": ["fullName", "email"] },
        { "id": "financial", "fields": ["postcode", "annualIncome"] }
      ]
    },
    "theme": { "brandColor": "#0047ab", "density": "comfortable", "tone": "light" }
  },
  "validation": { "strategy": "onChange", "debounceMs": 150 },
  "computed": [
    {
      "path": "$.applicant.netIncome",
      "expr": "annualIncome * 0.8",
      "dependsOn": ["$.applicant.annualIncome"],
      "round": 0
    }
  ],
  "dataSources": {
    "rateTable": {
      "type": "http",
      "url": "https://api.example.com/rates/{product}",
      "params": { "product": "car-loan" },
      "cache": "swr",
      "ttlMs": 60000
    }
  }
}
```
This example highlights overrides, step visibility rules, transitions, widget mapping, layout/theme metadata, validation strategy placeholders, computed fields, and data sources.【F:packages/form-engine/src/types/schema.types.ts†L7-L38】【F:packages/form-engine/src/rules/rule-evaluator.ts†L12-L120】【F:packages/form-engine/src/rules/transition-engine.ts†L12-L156】【F:packages/form-engine/src/types/ui.types.ts†L1-L63】【F:packages/form-engine/src/computed/ComputedFieldEngine.ts†L12-L120】【F:packages/form-engine/src/datasources/DataSourceManager.ts†L1-L130】

### Enable the grid layout renderer
The grid renderer stays behind the `gridLayout` feature flag—either set `features.gridLayout: true` on the schema or provide `NEXT_PUBLIC_FLAGS="gridLayout=1"` to override at runtime.【F:packages/form-engine/src/context/features.tsx†L13-L177】【F:packages/form-engine/tests/integration/formrenderer.grid-layout.test.tsx†L57-L106】 When the flag is on and `ui.layout.type` is `"grid"`, `FormRenderer` mounts `GridRenderer` instead of the single-column stack.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L1104-L1108】 The schema shape for sections, rows, and widget layout hints lives under `ui.layout` and `ui.widgets[field].layout` in the shared UI types.【F:packages/form-engine/src/types/ui.types.ts†L3-L106】 Define responsive columns, gutters, sections, and per-field layout hints to arrange widgets:

```json
{
  "$id": "loan.grid.v1",
  "version": "1.0.0",
  "features": { "gridLayout": true },
  "steps": [
    {
      "id": "details",
      "title": "Contact details",
      "schema": {
        "type": "object",
        "properties": {
          "firstName": { "type": "string" },
          "lastName": { "type": "string" },
          "email": { "type": "string", "format": "email" },
          "phone": { "type": "string" },
          "employer": { "type": "string" }
        }
      }
    }
  ],
  "ui": {
    "layout": {
      "type": "grid",
      "columns": { "base": 2, "lg": 4 },
      "gutter": { "base": 16, "lg": 24 },
      "rowGap": { "base": 24 },
      "sections": [
        {
          "id": "contact",
          "title": "Contact details",
          "description": "How we can reach you",
          "rows": [
            {
              "fields": [
                { "name": "firstName", "colSpan": { "base": 2, "lg": 1 } },
                { "name": "lastName", "colSpan": { "base": 2, "lg": 1 } }
              ]
            },
            {
              "fields": [
                { "name": "email", "colSpan": { "base": 2, "lg": 2 } },
                { "name": "phone", "colSpan": { "base": 2, "lg": 2 }, "hide": { "base": true, "lg": false } }
              ]
            }
          ]
        },
        {
          "id": "employment",
          "headingLevel": 2,
          "rows": [
            {
              "fields": [
                { "name": "employer", "colSpan": { "base": 2, "lg": 4 }, "align": { "lg": "start" } }
              ]
            }
          ]
        }
      ]
    },
    "widgets": {
      "email": {
        "component": "Email",
        "label": "Email",
        "layout": { "order": { "lg": 0 } }
      },
      "phone": {
        "component": "Phone",
        "label": "Phone number"
      }
    }
  }
}
```

Sections become `<section>` landmarks whose headings and descriptions are wired to `aria-labelledby` / `aria-describedby`, and the renderer sorts fields within each row using responsive spans, widget overrides, and explicit order values.【F:packages/form-engine/src/renderer/layout/GridRenderer.tsx†L137-L330】【F:packages/form-engine/src/renderer/layout/responsive.ts†L36-L271】 Fields omitted from the layout (or hidden at the active breakpoint) are skipped or appended to a fallback row so nothing disappears from the step.【F:packages/form-engine/src/renderer/layout/GridRenderer.tsx†L186-L405】【F:packages/form-engine/src/renderer/layout/__tests__/GridRenderer.spec.tsx†L284-L317】

### Render a form with autosave and analytics
```tsx
import { FormRenderer, useAutosave, useFormAnalytics } from '@form-engine';
import type { UnifiedFormSchema } from '@form-engine/types';

export function LoanApplication({ schema, initialData }: { schema: UnifiedFormSchema; initialData?: Record<string, unknown> }) {
  const analytics = useFormAnalytics(schema.$id, schema.version, {
    endpoint: '/api/analytics',
    sampling: 0.25,
    performanceBudgets: { validation: 80, stepTransition: 250 }
  });

  const autosave = useAutosave(schema.$id, schema.version, initialData ?? {}, schema.steps[0]?.id ?? 'start', [], {
    enabled: schema.metadata.allowAutosave !== false,
    sensitivity: schema.metadata.sensitivity,
    interval: 5000
  });

  const handleSubmit = async (data: unknown) => {
    analytics.trackSubmission(true, data as Record<string, unknown>);
    // post to API...
  };

  return (
    <FormRenderer
      schema={schema}
      initialData={initialData}
      onSubmit={handleSubmit}
      onStepChange={(stepId) => analytics.trackStepView(stepId)}
      onFieldChange={(name, value) => analytics.trackFieldInteraction(name, value, 'change')}
      onValidationError={(errors) => analytics.trackValidation(schema.steps[0]?.id ?? 'unknown', errors as Record<string, unknown>, false)}
      className="space-y-6"
    />
  );
}
```
The snippet shows how host apps wire autosave (interval persistence + manual save helpers) and analytics instrumentation around `FormRenderer` while respecting schema metadata.【F:packages/form-engine/src/persistence/useAutosave.ts†L1-L189】【F:packages/form-engine/src/hooks/useFormAnalytics.ts†L17-L191】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L821-L859】 `FormRenderer` continues to manage validation, transitions, retries, and session timeouts internally.

## Known Limitations & TODOs
- `validation.strategy`, `validation.debounceMs`, and `validation.suppressInlineErrors` are defined in the schema contract but the renderer currently hard-codes `mode: 'onChange'` and ignores debounce/strategy—plumb these settings through the resolver and validation hooks.【F:packages/form-engine/src/types/schema.types.ts†L7-L19】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L119-L125】
- Layout/theme metadata is not yet honored; `FormRenderer` only reads `schema.ui.widgets`, rendering a single-column layout regardless of `ui.layout`/`ui.theme`. Implement responsive layout/theming support in the renderer layer.【F:packages/form-engine/src/types/ui.types.ts†L1-L63】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L807-L823】
- Review-step nuances such as an `allowReviewIfInvalid` toggle remain unimplemented—transitions treat review as a standard step and tests only assert representative paths; capture this requirement in a future routing enhancement.【F:packages/form-engine/tests/unit/testing/PathGenerator.test.ts†L5-L91】
- `DataSourceManager` swallows transform errors with a warning and returns the original payload, which may hide integration failures; consider exposing telemetry or surfacing errors to callers.【F:packages/form-engine/src/datasources/DataSourceManager.ts†L143-L209】
- Built-in widgets do not automatically consume the CSP nonce; when embedding third-party scripts/styles, ensure they read from `useCspNonce` and apply the nonce to avoid CSP violations.【F:components/security/nonce-context.tsx†L6-L18】
- `useFormAnalytics` is opt-in and `FormRenderer` does not wire analytics hooks automatically, so host apps must manually connect analytics callbacks; evaluate a lightweight integration or documentation update to reduce boilerplate.【F:packages/form-engine/src/hooks/useFormAnalytics.ts†L17-L191】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L821-L859】
