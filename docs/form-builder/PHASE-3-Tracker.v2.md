# PHASE-3-Tracker.v2.md

> Status board for Phase 3. This revision appends **P3‑04 — Layout V1** subtasks. Prior completed items retained for continuity.

## Legend
- **Status:** `todo` | `in-progress` | `review` | `merged` | `blocked`
- **Branch:** default for NAV/Review: `codex-form-builder-phase-3`; Layout: `codex-form-builder-layout-v1`

## Summary (high level)
- **P3‑NAV (01..08):** ✅ merged
- **P3‑03 Review step:** ✅ merged (including readable summary + confirm control)
- **Infra prep & P3‑02a regression fix:** ✅ merged
- **P3‑04 Layout V1:** 🚧 starting

---

## Detailed Tracker

| ID | Title | Branch | Status | PR | Notes |
|---|---|---|---|---|---|
| P3-00 | Repo bootstrap & scripts | codex-form-builder-phase-3 | merged | link | Baseline tooling, scripts |
| P3-01 | Validation strategy & debounce | codex-form-builder-phase-3 | merged | link | Configurable modes |
| P3-02 | Build/test pipeline updates | codex-form-builder-phase-3 | merged | link | Initial infra |
| P3-02a | FormRenderer summary regression fix + tests | codex-form-builder-phase-3 | merged | link | Tests green |
| P3-NAV-01 | Terminal step semantics | codex-form-builder-phase-3 | merged | link | |
| P3-NAV-02 | Deterministic transition resolution | codex-form-builder-phase-3 | merged | link | |
| P3-NAV-03 | Review policy behind flags | codex-form-builder-phase-3 | merged | link | |
| P3-NAV-04 | Renderer de-dupe/token guard | codex-form-builder-phase-3 | merged | link | |
| P3-NAV-05 | Schema linter rules in CI | codex-form-builder-phase-3 | merged | link | |
| P3-NAV-07 | E2E/Playwright smoke | codex-form-builder-phase-3 | merged | link | Container note: browsers not in image |
| P3-NAV-08 | Analytics loop detector | codex-form-builder-phase-3 | merged | link | |
| P3-03 | Review & Submit (readable summary + confirm) | codex-form-builder-phase-3 | merged | link | User-friendly review; confirm required |

### New: Layout V1 (Grid; Flag-Gated)

| ID | Title | Branch | Status | PR | Notes |
|---|---|---|---|---|---|
| P3-04A | GridRenderer scaffold (flag-gated) | codex-form-builder-layout-v1 | in-progress |  | Feature flag plumbing, renderer switch |
| P3-04B | Grid responsive + schema contract | codex-form-builder-layout-v1 | done |  | Responsive columns, gutter/rowGap vars, schema overrides |
| P3-04C | Field placement & fallbacks | codex-form-builder-layout-v1 | done | pending | Grid renderer places fields per layout, appends fallback row, adds tests (PR link pending) |
| P3-04D | Responsive breakpoints | codex-form-builder-layout-v1 | review | link | CSS vars for breakpoints + auto single-column collapse |
| P3-04E | Sections (titles/landmarks) | codex-form-builder-phase-3-layout-engine | review | pending | Heading levels clamp + aria landmarks; section descriptions announced via aria-describedby |
| P3-04F | Per‑widget layout hints | codex-form-builder-phase-3-layout-engine | review | pending | Widget layout hints backfill colSpan/align/size defaults |
| P3-04G | Error rendering stability | codex-form-builder-phase-3-layout-engine | review | pending | No grid jump on errors |
| P3-04H | Demo schema: opt‑in layout | codex-form-builder-phase-3-layout-engine | review | pending | Minimal 2‑col layout configured in demo schema; flag off by default |
| P3-04I | Docs & examples | codex-form-builder-phase-3-layout-engine | review | pending | FEATURES.md/README updates |

---

## How to Run (quick)
```bash
# Enable grid locally
export NEXT_PUBLIC_FLAGS="gridLayout=1,nav.dedupeToken=1,nav.reviewFreeze=1,nav.jumpToFirstInvalidOn=submit"

npm run format
npm run lint
npm run typecheck
npm run test
npm run build
CI=1 npm run size
```

## Notes
- Keep PRs ≤ 400 LOC. Each row above should land as a separate PR referencing this tracker.
- Flag remains **OFF** by default in demo; reviewers can enable via `NEXT_PUBLIC_FLAGS`.
