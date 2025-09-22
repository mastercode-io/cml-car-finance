# Phase 2 — Execute (Revised Playbook)

**Goal:** Implement the GA‑cut tasks (P2‑01…P2‑09) incrementally with small, safe diffs.

## Golden rules
1. Work on **1–2 tasks max** per run.
2. After each task: `format/lint/typecheck/tests/build/size` → **commit & push** to `codex-form-builder` → update the tracker.
3. If a check fails, apply small fixes (≤3 attempts). If still failing, **stop** and log an RCA entry in the tracker.

## Paths
- Plan: `/docs/form-builder/PHASE-2-PLAN.v2.md`
- Tracker: `/docs/form-builder/PHASE-2-Tracker.v2.md`

## One‑liner to resume
```
Follow /docs/form-builder/PHASE-2-PLAN.v2.md. Implement the next 1–2 unchecked items from /docs/form-builder/PHASE-2-Tracker.v2.md, then run format/lint/typecheck/tests/build/size, commit & push to codex-form-builder, update the tracker with commit+CI links, and stop/report.
```