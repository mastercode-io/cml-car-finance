# Form Builder PRD (Revised 2.2)

**Doc Owner:** Frontend Lead  
**Audience:** Product, Engineering, QA  
**Last Updated:** 2025-09-17  
**Version:** 2.2 — Adds schema rollback procedures, review board structure, and performance profiling enhancements based on technical assessment.

---

## 1) Executive Summary
Deliver a **JSON-schema–driven form engine** using our current portal stack: **Next.js + React + TypeScript + Tailwind/shadcn + RHF**. Add **AJV** for JSON Schema validation, **localforage** for drafts, and **optional XState** for highly branched flows. Author forms via a **unified schema** (validation, UI, flow). Phase 1 focuses on renderer + minimal tooling; Phase 2 expands tooling, migration automation, and performance hardening.

**Key updates in v2.2:**
- Adds **schema rollback procedures** and versioning hygiene
- Establishes **Schema Review Board** for governance
- Enhances **performance profiling** with production sampling
- Clarifies **error recovery** patterns for failed submissions

---

## 2) Scope & Non-Goals
**Scope (Frontend only):** Renderer, schemas, rule evaluation, persistence, analytics/perf hooks, testing, migration helpers, rollout controls.  
**Non-Goals:** Backend changes, drag-and-drop visual builder, cross-form business rules engine, workflow orchestration beyond single forms.

---

## 3) Governance & Versioning

### 3.1 Schema Governance
- **Schema IDs & Versions:** Each schema has an immutable `$id` and a `version` (semver). Keep **migration maps** between consecutive versions.
- **Schema Review Board:** Product Lead + Tech Lead + QA Lead. Reviews breaking changes, approves deprecations, and maintains schema catalog.
- **Rollback Procedures:** 
  - Keep 3 previous versions accessible via CDN
  - Feature flag per schema version: `schema.{formId}.version`
  - Automatic rollback on >5% error rate spike
  - Manual override via admin panel

### 3.2 Contract Management
- **Submission Payload Contract:** Include `payloadVersion`. Backend supports N and N−1 for 90 days. Hidden fields stripped by default unless `retainHidden=true`.
- **Analytics Event Contract:** Versioned (`v`), PII-free, including `formId`, `schemaVersion`, `payloadVersion`, and `sessionId` for funnel analysis.
- **Deprecation Policy:** 30-day notice via PRs, enforced via CI schema gate, communicated in team sync.

---

## 4) Architecture
```
Unified Schema (validation/ui/flow + tests + perf)
     │
 Schema Loader  ──  Schema Validator (build/run)
     │                 │
 Schema Composer  ──  Conflict Resolver (precedence)
     │                 │
 Rule Evaluator  ──  Custom Keyword/Format Registry
     │
AJV Resolver → React Hook Form ← Field Registry (shadcn/ui)
     │                │
Per-step Errors   Visibility / NextStep / Computed Fields
     │                │
Stepper UI  ← Draft Persistence (localforage) ← Data Sources
     │
Error Recovery ← Submission (payloadVersion) → Backend
     │
Production Profiling → Performance Dashboard
```
*Optional:* Wrap in **XState** when DSL complexity thresholds exceeded (decision matrix below).

---

## 5) Unified Schema (Validation, UI, Flow)

### 5.1 Validation (JSON Schema 2020-12)
- Per-step schemas for responsive validation (≤50ms p95).
- Support **custom formats/keywords** via registry (postcode, currency, phone, file type, IBAN).
- **Async validators** with timeout (2s default) and fallback behavior.

### 5.2 UI (Presentation & Widgets)
- Widget type, labels/help, ordering, masks, placeholders, a11y hints, i18n keys.
- **Conditional styling**: `styleWhen` rules for dynamic classes.

### 5.3 Flow (Steps, Visibility, Transitions)
- **Steps** with `schema` references and optional `timeout` for auto-advance.
- **Visibility** via `visibleWhen` rules with caching.
- **Transitions** via ordered `next` rules with mandatory default and optional `guard` conditions.

### 5.4 Composition & Precedence
- `extends: []` for reuse with deterministic merge order.
- **Precedence:** base (`extends` left→right) < environment < local overrides.
- Conflicts **fail build** unless `{ "override": true, "reason": "..." }`.

### 5.5 Computed Fields
```json
{
  "computed": [
    {
      "path": "$.netIncome",
      "expr": "$.annualIncome - $.annualDeductions",
      "dependsOn": ["$.annualIncome", "$.annualDeductions"],
      "round": 2,
      "recompute": "onChange",
      "cache": true,
      "fallback": 0
    }
  ]
}
```

### 5.6 Data Sources
```json
{
  "dataSources": {
    "employers": {
      "type": "http",
      "url": "/api/employers?q={query}",
      "cache": "swr",
      "ttlMs": 60000,
      "retries": 2,
      "fallback": []
    }
  }
}
```

### 5.7 Rule DSL & XState Decision Matrix
```ts
type Rule =
 | { op: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "in" | "regex"; left: string; right: any }
 | { op: "and" | "or" | "not"; args: Rule[] }
 | { op: "custom"; fn: string; args: any[] }; // Registry lookup
```

**Escalate to XState when:**
- >8 unique conditions across flow
- Async guards with side effects
- Audit trail requirements
- Parallel state regions needed

---

## 6) Field Registry & Widgets
**V1 widgets:** Text, Number, TextArea, Select, RadioGroup, Checkbox, Date, FileUpload, Repeater, Rating, Slider.  
**Specialized:** Currency, Percentage, Phone, Email, Postcode, IBAN, ColorPicker.  
**Contract:** Props interface versioned; breaking changes require major version bump.

---

## 7) Validation, Errors, A11y
- Per-step **AJV resolver** with 50ms timeout.
- **Error recovery:** Retry with exponential backoff; offer draft save on repeated failures.
- **A11y DoD:** WCAG 2.1 AA; automated + manual testing; voice control support.

---

## 8) Persistence & Security
- **Autosave:** Debounced 500ms, compressed, encrypted for `sensitivity: high`.
- **Conflict resolution:** Last-write-wins with optional merge UI.
- **Session timeout:** 30min default, configurable per form.
- **CSP:** Strict policy with nonce for inline scripts.

---

## 9) Performance & Observability

### 9.1 Performance Budgets
- **CI Enforcement:** p95 step transition ≤150ms; initial load ≤500ms; bundle ≤150KB gzipped.
- **Production Sampling:** 1% of sessions profiled with Performance Observer API.
- **Degradation:** Disable computed fields and animations on slow devices.

### 9.2 Instrumentation
```json
{
  "events": [
    "perf:stepTransition",
    "perf:validation",
    "perf:computation",
    "perf:dataFetch"
  ],
  "sampling": { "production": 0.01, "staging": 1.0 },
  "dashboard": "https://metrics.internal/forms"
}
```

---

## 10) Analytics
- Core events + custom events per form.
- **Funnel analysis:** Session-based with abandonment reasons.
- **Error tracking:** Validation failures, network errors, timeouts.
- **PII handling:** Hash emails, redact SSNs, exclude from logs.

---

## 11) Testing Strategy
- **Path coverage:** 90% representative paths (boundary + pairwise); 100% for regulated.
- **Chaos testing:** Network failures, slow connections, storage quota.
- **Load testing:** 100 concurrent users per form.
- **Synthetic monitoring:** Key user journeys every 5min.

---

## 12) Migration Strategy
- **Automated extraction:** Zod→JSON Schema converter with 80% accuracy.
- **Validation parity:** Side-by-side comparison dashboard.
- **Rollout:** Canary (5%) → Beta (25%) → GA (100%) over 2 weeks.
- **Rollback:** One-click via feature flag; preserve in-flight drafts.

---

## 13) Milestones & Acceptance

### Milestone A — Core Renderer & Minimal Tooling (Weeks 1–3)
**Deliverables:** Schema loader, validator, rule evaluator, field registry, stepper, per-step validation, CLI tools.  
**DoD:** Demo form works; Axe pass; p95 ≤150ms; schema validation in CI.

### Milestone B — Flow, Persistence, Observability (Weeks 4–5)
**Deliverables:** Branching, autosave, analytics, performance events, error recovery.  
**DoD:** 3 test forms; drafts restore; budgets enforced; dashboard live.

### Milestone C — Migration & Pilot Launch (Weeks 6–7)
**Deliverables:** Migrate 3 forms; contract tests; feature flags; rollback procedures.  
**DoD:** Feature parity; A/B neutral; rollback tested; review board established.

### Milestone D — Production Hardening (Weeks 8–10)
**Deliverables:** Path generator; XState pilot; worker validations; production profiling.  
**DoD:** 100 concurrent users; chaos tests pass; sampling active; 5 forms migrated.

---

## 14) KPIs
- Form creation: ≤2 days (schema-only)
- Change deployment: ≤2 hours
- Migration velocity: ≥5 forms/week after Milestone C
- Error rate: <0.5% submissions
- Performance: p95 ≤150ms sustained

---

## 15) Risks & Mitigations
- **Schema proliferation:** Review board + deprecation enforcement
- **Performance degradation:** Production sampling + automatic degradation
- **Migration errors:** Automated validation + rollback procedures
- **Security vulnerabilities:** Automated scanning + CSP enforcement

---

## 16) Open Questions
1. Session timeout policy for different form types?
2. Offline mode requirements?
3. Multi-language validation messages priority?
4. Third-party integration points (analytics, CRM)?
5. Accessibility compliance level (AA vs AAA)?

---

## Appendix A: Schema Review Board Charter
- **Membership:** Product Lead, Tech Lead, QA Lead, Security Rep
- **Cadence:** Weekly during migration, biweekly thereafter
- **Responsibilities:** Approve breaking changes, maintain catalog, review deprecations
- **Decision log:** Tracked in `decisions/schemas/` directory

## Appendix B: Performance Profiling Configuration
```javascript
{
  "observer": {
    "entryTypes": ["navigation", "resource", "measure"],
    "buffer": 100,
    "sampling": 0.01,
    "endpoints": {
      "prod": "https://telemetry.prod/forms",
      "staging": "https://telemetry.staging/forms"
    }
  }
}
```

## Appendix C: Example Schema Structure
```json
{
  "$id": "https://forms.internal/schemas/employee-onboarding",
  "version": "1.0.0",
  "extends": ["https://forms.internal/schemas/base/personal-info"],
  "metadata": {
    "title": "Employee Onboarding",
    "description": "New employee information collection",
    "sensitivity": "high",
    "retainHidden": false,
    "allowAutosave": false
  },
  "steps": [
    {
      "id": "personal",
      "title": "Personal Information",
      "schema": {
        "$ref": "#/definitions/personalInfo"
      }
    },
    {
      "id": "employment",
      "title": "Employment Details",
      "schema": {
        "$ref": "#/definitions/employmentInfo"
      },
      "visibleWhen": {
        "op": "eq",
        "left": "$.employmentType",
        "right": "full-time"
      }
    }
  ],
  "transitions": [
    {
      "from": "personal",
      "to": "employment",
      "when": {
        "op": "and",
        "args": [
          { "op": "eq", "left": "$.ageVerified", "right": true },
          { "op": "neq", "left": "$.country", "right": "restricted" }
        ]
      }
    },
    {
      "from": "personal",
      "to": "review",
      "default": true
    }
  ],
  "definitions": {
    "personalInfo": {
      "type": "object",
      "properties": {
        "firstName": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50
        },
        "lastName": {
          "type": "string",
          "minLength": 1,
          "maxLength": 50
        },
        "email": {
          "type": "string",
          "format": "email"
        },
        "phone": {
          "type": "string",
          "format": "phone"
        }
      },
      "required": ["firstName", "lastName", "email"]
    },
    "employmentInfo": {
      "type": "object",
      "properties": {
        "startDate": {
          "type": "string",
          "format": "date"
        },
        "department": {
          "type": "string",
          "enum": ["Engineering", "Product", "Design", "Sales", "Support"]
        },
        "manager": {
          "type": "string"
        }
      },
      "required": ["startDate", "department"]
    }
  },
  "ui": {
    "widgets": {
      "firstName": {
        "component": "Text",
        "label": "First Name",
        "placeholder": "Enter your first name",
        "helpText": "Legal first name as it appears on ID"
      },
      "email": {
        "component": "Email",
        "label": "Work Email",
        "validation": {
          "pattern": "@company\\.com$",
          "message": "Must be a company email address"
        }
      },
      "department": {
        "component": "Select",
        "label": "Department",
        "optionsFrom": "departments"
      }
    }
  },
  "computed": [
    {
      "path": "$.fullName",
      "expr": "concat($.firstName, ' ', $.lastName)",
      "dependsOn": ["$.firstName", "$.lastName"]
    }
  ],
  "dataSources": {
    "departments": {
      "type": "http",
      "url": "/api/departments",
      "cache": "swr",
      "ttlMs": 3600000
    }
  }
}
```