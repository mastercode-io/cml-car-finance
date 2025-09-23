# Form JSON Schema Authoring Guide

## Purpose and audience
This guide explains how to design JSON schemas that power the `@form-engine` runtime. It focuses on the authoring surface for product and engineering teams who need to model multi-step experiences, map widgets, and wire validation, visibility, and dynamic data behaviours without touching runtime code.【F:packages/form-engine/src/types/schema.types.ts†L36-L48】

## Schema anatomy
Every form schema must satisfy the unified contract below. Use it as a checklist whenever you add, review, or extend definitions.【F:packages/form-engine/src/utils/schema-validator.ts†L6-L104】【F:packages/form-engine/src/types/schema.types.ts†L36-L48】

| Key | Required? | Description |
| --- | --- | --- |
| `$id` | ✅ | Stable identifier used for composition, persistence, and analytics. |
| `version` | ✅ | Semantic version or commit hash that tags the schema release. |
| `extends` | optional | Array of `$id`s to inherit from. Overrides must be acknowledged with `{ "override": true, "reason": "..." }` at the affected node.【F:packages/form-engine/src/core/schema-composer.ts†L39-L211】 |
| `metadata` | ✅ | Describes runtime characteristics such as `title`, `sensitivity`, `allowAutosave`, `retainHidden`, `timeout`, and ownership tags.【F:packages/form-engine/src/types/schema.types.ts†L13-L24】 |
| `definitions` | optional | Shared JSON Schema fragments that steps reference via `$ref`. |
| `steps` | ✅ | Ordered array of `FormStep` objects (see below). Visible steps drive navigation and validation flows.【F:packages/form-engine/src/types/schema.types.ts†L26-L34】 |
| `transitions` | ✅ | Graph that controls forward/backward routing. Conditional transitions evaluate rules before falling back to defaults.【F:packages/form-engine/src/rules/transition-engine.ts†L15-L155】 |
| `ui` | ✅ | Widget registry, layout, and theme metadata that render the form.【F:packages/form-engine/src/types/ui.types.ts†L3-L31】 |
| `computed` | optional | Declarative expressions that derive values and write back into the submission payload.【F:packages/form-engine/src/types/schema.types.ts†L45-L47】【F:packages/form-engine/src/computed/ComputedFieldEngine.ts†L27-L200】 |
| `dataSources` | optional | Named connectors for HTTP, static, or function-based option hydration and computed logic.【F:packages/form-engine/src/types/schema.types.ts†L45-L47】【F:packages/form-engine/src/datasources/DataSourceManager.ts†L14-L200】 |
| `validation` | optional | Global defaults for strategy, debounce, async timeouts, and inline error handling.【F:packages/form-engine/src/types/schema.types.ts†L6-L11】 |

## Metadata planning
`metadata` influences persistence, analytics, and security posture. Set `sensitivity` to `high` when the payload requires encryption—drafts are skipped unless an encryption key is present. Toggle `allowAutosave` to disable background saves when regulators disallow drafts. Use `timeout` (minutes) for inactivity expiry, and populate `tags`/`owner` for catalogue tooling.【F:packages/form-engine/src/types/schema.types.ts†L13-L24】【F:packages/form-engine/src/persistence/PersistenceManager.ts†L74-L125】【F:packages/form-engine/src/renderer/FormRenderer.tsx†L282-L305】

## Authoring steps
Each step owns a schema fragment plus optional rule-driven visibility. Keep step IDs stable—they anchor transitions, analytics, and draft recovery.【F:packages/form-engine/src/types/schema.types.ts†L26-L34】 Steps reference shared fragments through `$ref` paths like `#/definitions/contact`. To hide a step until prerequisites are met, attach `visibleWhen` with a rule (see “Visibility grammar”). Hidden steps are skipped by default navigation, but you can still target them through explicit transitions for review flows.【F:packages/form-engine/src/rules/transition-engine.ts†L15-L155】

### Step example
```json
{
  "id": "income",
  "title": "Income details",
  "visibleWhen": { "op": "gt", "left": "$.applicant.annualIncome", "right": 0 },
  "schema": { "$ref": "#/definitions/income" },
  "helpText": "Provide the amount before tax each year."
}
```

## Modeling fields with JSON Schema
Field definitions follow the 2020-12 JSON Schema feature set plus custom keywords. Standard keywords (`type`, `enum`, `format`, `minimum`, combinators, etc.) behave as documented in the spec. Arrays (`items`, `minItems`, `maxItems`) combine naturally with the repeater widget for dynamic lists. Use `definitions`/`$defs` to keep payload contracts DRY.【F:packages/form-engine/src/types/json-schema.types.ts†L3-L75】

### Custom extensions
- `'x-visibility'`: attaches rule grammar directly to a field. Hidden fields are omitted from validation unless `metadata.retainHidden` says otherwise (default: drop hidden answers).【F:packages/form-engine/src/types/json-schema.types.ts†L67-L75】【F:packages/form-engine/src/rules/visibility-controller.ts†L56-L105】
- `'x-compute'`: reserved for expression-based derivations (pair with `computed` config).【F:packages/form-engine/src/types/json-schema.types.ts†L67-L75】【F:packages/form-engine/src/computed/ComputedFieldEngine.ts†L27-L200】
- `'x-datasource'`: names a registered data source that populates options or derived content. The runtime resolves it through `DataSourceManager`.【F:packages/form-engine/src/types/json-schema.types.ts†L67-L75】【F:packages/form-engine/src/datasources/DataSourceManager.ts†L14-L200】

## UI definition and widget mapping
Declare every rendered field in `ui.widgets`. Each entry maps a logical field name to a `WidgetConfig` describing the component, labels, placeholders, options, and behaviour. The renderer falls back to a text widget when it can’t resolve the requested component, so ensure `component` matches a registered widget (`Text`, `Number`, `Select`, `Checkbox`, `Repeater`, etc.). Use `styleWhen` for conditional classes, `options` or `optionsFrom` for choice lists, and accessibility labels (`helpText`, `description`) to keep flows inclusive.【F:packages/form-engine/src/types/ui.types.ts†L3-L111】

### Repeater-specific options
Repeaters are defined via `component: "Repeater"` and accept `fields` (sub-widget configs), `minItems`, `maxItems`, copy for add/remove buttons, and defaults per item. The runtime enforces bounds, seeds defaults, and manages focus and announcements for screen-reader users automatically.【F:packages/form-engine/src/types/ui.types.ts†L33-L79】【F:packages/form-engine/src/components/fields/RepeaterField.tsx†L20-L199】

## Validation controls
Set global defaults with `validation`:
- `strategy`: `'onChange'`, `'onBlur'`, or `'onSubmit'` resolver behaviour.
- `debounceMs`: delay before async validation fires.
- `asyncTimeoutMs`: cap for worker-based validation.
- `suppressInlineErrors`: hides inline messages until submission.【F:packages/form-engine/src/types/schema.types.ts†L6-L11】

The schema validator bootstraps Ajv with built-in formats (`phone`, `gb-postcode`, `iban`, `currency`) and the `requiredWhen` keyword for conditional requirements. `requiredWhen` enforces that `requires` fields are present when `field` equals a specific value. Custom formats align browser widgets with server validation for parity.【F:packages/form-engine/src/utils/schema-validator.ts†L122-L194】

### Per-field rules
Widgets can add `validation.pattern` for light-weight client checks, while JSON Schema keywords remain the source of truth. Combine `format`, `minLength`, and `maximum` to avoid writing imperative logic.【F:packages/form-engine/src/types/ui.types.ts†L33-L63】【F:packages/form-engine/src/types/json-schema.types.ts†L45-L55】

## Visibility grammar
Visibility rules use the `Rule` union. Comparison operators (`eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `in`, `regex`) support JSONPath selectors (`$.field`) and context tokens (`@now`, `@today`, `@env`). Logical operators (`and`, `or`, `not`), custom functions, and `always` cover complex scenarios. Built-in custom functions include `isWeekday`, `hasRole`, and `isComplete`. Errors default to visible to keep forms resilient.【F:packages/form-engine/src/types/rules.types.ts†L1-L38】【F:packages/form-engine/src/rules/rule-evaluator.ts†L1-L138】【F:packages/form-engine/src/rules/visibility-controller.ts†L16-L105】

### Example: hide field on weekends
```json
{
  "x-visibility": {
    "op": "custom",
    "fn": "isWeekday",
    "args": []
  }
}
```

## Navigation and transitions
Define `transitions` to guide forward motion. Each entry pairs `from`/`to` IDs plus optional `when` rule and `guard` name. Transitions are evaluated in priority order: conditional edges first, then the `default: true` fallback. If no explicit edges exist, the engine walks the next visible step in declaration order. `getPreviousStep` respects visibility too, so hidden steps are skipped during back navigation.【F:packages/form-engine/src/types/rules.types.ts†L39-L62】【F:packages/form-engine/src/rules/transition-engine.ts†L15-L155】

### Review steps
Model review hubs as regular steps and either guard them behind `allowReviewIfInvalid` (runtime prop) or transitions that check validation state via context (e.g., `@completedSteps`). Use `isComplete` to ensure prerequisites are met before opening confirmation stages.【F:packages/form-engine/src/rules/visibility-controller.ts†L16-L33】【F:packages/form-engine/src/rules/transition-engine.ts†L15-L155】

## Computed fields
Use `computed` for declarative derivations. Each entry defines a target `path`, an `expr` parsed by `expr-eval`, dependency JSONPaths, optional rounding, cache policy, and fallback value. The engine topologically sorts dependencies, computes values, caches results (unless disabled), and writes them back into the data model. Built-in helpers (`now`, `today`, `sum`, `avg`, string casing utilities, etc.) and user-supplied functions support rich calculations.【F:packages/form-engine/src/types/computed.types.ts†L1-L39】【F:packages/form-engine/src/computed/ComputedFieldEngine.ts†L13-L200】

### Example
```json
{
  "path": "#/applicant/debtToIncome",
  "expr": "sum(loans) / income",
  "dependsOn": ["$.applicant.loans", "$.applicant.income"],
  "round": 2,
  "fallback": 0
}
```

## Data sources
Declare reusable data fetchers under `dataSources`. Supported types:
- `http`: performs REST requests with retry/backoff, optional body, headers, and JSONPath transforms.
- `static`: returns the provided `data` literal.
- `function`: invokes a registered function by name (local registry or `globalThis`).
Caching options include `'swr'`, `'persistent'`, TTLs, and `staleWhileRevalidate`. Transform strings apply JSONPath updates before results reach widgets.【F:packages/form-engine/src/types/computed.types.ts†L41-L69】【F:packages/form-engine/src/datasources/DataSourceManager.ts†L14-L200】

Bind a widget to a source with `'x-datasource'` or `optionsFrom`. Parameters can be passed from computed values or context when the widget requests fresh data.【F:packages/form-engine/src/types/json-schema.types.ts†L67-L75】【F:packages/form-engine/src/types/ui.types.ts†L33-L63】

## Composition and overrides
Use `extends` to inherit base schemas. The composer merges parent steps, transitions, and deep object trees. When overriding anything besides `$id`/`version`, add `{ "override": true, "reason": "Regulatory update" }` on the overriding node; otherwise the composer throws `SchemaOverrideError`. Reasons must be non-empty strings to document intent for auditors.【F:packages/form-engine/src/core/schema-composer.ts†L39-L220】

## Persistence and drafts
Runtime persistence honours schema metadata: drafts are initialised with the schema `$id`, `version`, and `sensitivity`; autosave is disabled if `allowAutosave` is `false`. High-sensitivity drafts are skipped unless an encryption key is supplied. Draft payloads record step progress, timestamps, and encryption state, and the manager throttles writes to avoid performance hits.【F:packages/form-engine/src/renderer/FormRenderer.tsx†L282-L305】【F:packages/form-engine/src/persistence/PersistenceManager.ts†L74-L194】

## Authoring checklist
1. **Identify** schema `$id`/`version` strategy and register all base fragments before composing.
2. **Model** payload contracts with JSON Schema first, then attach UI metadata for each field.
3. **Wire** visibility and transition rules so hidden steps/fields match the desired journey.
4. **Specify** validation strategy (`validation.strategy`, Ajv keywords) to match UX expectations.
5. **Connect** data sources and computed expressions for derived or remote data.
6. **Review** metadata (`sensitivity`, `allowAutosave`, `timeout`) against compliance needs.
7. **Document** overrides with reasons when extending existing forms.
8. **Test** schemas with the validator CLI (or runtime) before promoting to higher environments.

## Troubleshooting tips
- **Field not rendering?** Confirm an entry exists in `ui.widgets` and that the requested `component` has been registered with the field registry (defaults cover standard widgets).【F:packages/form-engine/src/types/ui.types.ts†L3-L63】
- **Visibility rule misbehaving?** Log the evaluated data, confirm JSONPath selectors resolve, and watch for exceeding the evaluation cap (1,000 evaluations throws).【F:packages/form-engine/src/rules/rule-evaluator.ts†L1-L38】
- **Repeater data missing?** Ensure `fields` specify `name` and `component`; invalid configs are filtered out before rendering.【F:packages/form-engine/src/types/ui.types.ts†L33-L79】【F:packages/form-engine/src/components/fields/RepeaterField.tsx†L104-L132】
- **Autosave disabled unexpectedly?** High-sensitivity schemas without encryption keys skip persistence—either lower sensitivity or configure keys in the host app.【F:packages/form-engine/src/persistence/PersistenceManager.ts†L74-L125】

## Further reading
- Feature catalogue (`FEATURES.md`) for runtime capabilities and extension points.
- Ajv JSON Schema reference for keyword semantics.
- JSONPath (Stefan Goessner) for crafting rule selectors.
