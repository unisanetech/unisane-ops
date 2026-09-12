---
title: "Task: Harden portable tracking and conversion delivery"
status: complete
owner: "codex"
id: T-46b8c833
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-2f39a9c2cb290fa3
lastUpdated: 2026-09-11
---

# Task: Harden portable tracking and conversion delivery

## Changelog

- `2026-09-11`: Synchronized Task state `complete` from Skopos.

## Goal

Harden portable tracking and conversion delivery

## Acceptance

- Consent controls browser side effects; stable conversion identity and time survive retry; Meta acceptance produces sanitized receipts; durable delivery composes with the existing event outbox; focused package checks pass

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `automatic`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.

## Owned Paths

- `docs/guides`
- `packages/web-runtime`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Harden portable tracking and conversion delivery" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Consent controls browser side effects; stable conversion identity and time survive retry; Meta acceptance produces sanitized receipts; durable delivery composes with the existing event outbox; focused package checks pass (closure, agent-observation)

## Memory Obligations

- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/README.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/README.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/growth-provider-operations.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/research-provider-evidence.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/ads-asset-provider-operations.md`); resolution: reviewed-no-change

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-46b8c833",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-11T11:53:07.630Z",
  "updatedAt": "2026-09-11T12:12:43.472Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Harden portable tracking and conversion delivery",
  "goal": "Harden portable tracking and conversion delivery",
  "scope": {
    "query": "workspace",
    "matchedBy": "id",
    "scope": {
      "id": "workspace",
      "kind": "workspace",
      "title": "unisane-ops",
      "path": ".",
      "aliases": [
        "root",
        "unisane-ops"
      ],
      "summary": "unisane-ops (public-package-product).",
      "confidence": "high",
      "ancestorIds": [],
      "profile": "public-package-product",
      "memoryRoot": "docs",
      "codeRoots": [
        "."
      ],
      "dependsOn": [],
      "owners": [
        "ops-maintainers"
      ]
    }
  },
  "contract": {
    "acceptanceCriteria": [
      "Consent controls browser side effects; stable conversion identity and time survive retry; Meta acceptance produces sanitized receipts; durable delivery composes with the existing event outbox; focused package checks pass"
    ],
    "nonGoals": [],
    "constraints": []
  },
  "risk": "standard",
  "admission": {
    "recommendedRisk": "standard",
    "recommendedDetail": "standard",
    "selectedRisk": "standard",
    "selectedDetail": "standard",
    "selectionSource": "automatic",
    "workflow": "tracked",
    "reasons": [
      "The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 2,
      "affectedScopeIds": [
        "workspace"
      ],
      "impactCategories": [
        "docs",
        "workspace-file"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-2f39a9c2cb290fa3"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "step-record-task-risk",
      "kind": "implementation",
      "title": "Record Task risk and detail before editing",
      "detail": "Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.",
      "status": "complete"
    },
    {
      "id": "step-review-current-pattern",
      "kind": "implementation",
      "title": "Review the current pattern in unisane-ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "complete"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Harden portable tracking and conversion delivery\" inside the resolved scope before widening impact to adjacent areas.",
      "status": "complete"
    },
    {
      "id": "step-sync-knowledge",
      "kind": "docs",
      "title": "Sync docs and instruction surfaces if touched",
      "detail": "Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.",
      "status": "complete"
    }
  ],
  "selectedActions": [],
  "selectedGuardIds": [],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "Consent controls browser side effects; stable conversion identity and time survive retry; Meta acceptance produces sanitized receipts; durable delivery composes with the existing event outbox; focused package checks pass",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-guide-03b65e013f",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/README.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/README.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed: these guides cover existing TrueResume provider operations, which this framework package batch does not change. New portable composition and migration are documented in the package README and portable-conversion-delivery guide.",
      "resolvedAt": "2026-09-11T12:12:06.957Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-be05fc0cf4",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/growth-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed: these guides cover existing TrueResume provider operations, which this framework package batch does not change. New portable composition and migration are documented in the package README and portable-conversion-delivery guide.",
      "resolvedAt": "2026-09-11T12:12:07.847Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-d5ad057196",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/research-provider-evidence.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed: these guides cover existing TrueResume provider operations, which this framework package batch does not change. New portable composition and migration are documented in the package README and portable-conversion-delivery guide.",
      "resolvedAt": "2026-09-11T12:12:08.736Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-e15f796386",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/ads-asset-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed: these guides cover existing TrueResume provider operations, which this framework package batch does not change. New portable composition and migration are documented in the package README and portable-conversion-delivery guide.",
      "resolvedAt": "2026-09-11T12:12:09.623Z",
      "resolvedByActorId": "codex"
    }
  ],
  "questions": [],
  "recommendations": [],
  "declaredOwnedPaths": [
    "docs/guides",
    "packages/web-runtime"
  ]
}
```
<!-- skopos:task-state:end -->
