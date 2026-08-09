---
title: "Task: Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary"
status: active
owner: "codex-unisane-ops-framework-devtools-boundary"
id: T-639cf77f
scope: "unisane-ops"
role: task
lifecycle: active
authority: canonical
provenance: accepted
view: current
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-1a9dcc2fa8b12f73
lastUpdated: 2026-08-09
---

# Task: Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary

## Changelog

- `2026-08-09`: Synchronized Task state `active` from Skopos.

## Goal

Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary

## Acceptance

- Every authored source, type, and test import from @unisane/devtools uses only @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed.
- @unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools with no workspace/file/link fallback, alias, shim, or copied source.
- A deterministic package-owned boundary and packed manifest/content/declaration proof passes without publishing or mutating registry authority.
- Disposable proof records required root lock and repository-ledger deltas while tracked root lockfile and central generated projections remain unchanged.
- Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated blockers remain fail closed.

## Non-Goals

- Do not resolve Ops console UI/data-table blockers, materialize the target repo, activate target lockfile/Skopos, publish, deploy, or mutate external systems.

## Constraints

- Own only unisane-ops/packages/framework-ops and unique Skopos Task artifacts; do not access or modify private audit evidence.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: release.

## Owned Paths

- `unisane-ops/packages/framework-ops`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Every authored source, type, and test import from @unisane/devtools uses only @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed. (closure, agent-observation)
- @unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools with no workspace/file/link fallback, alias, shim, or copied source. (closure, agent-observation)
- A deterministic package-owned boundary and packed manifest/content/declaration proof passes without publishing or mutating registry authority. (closure, agent-observation)
- Disposable proof records required root lock and repository-ledger deltas while tracked root lockfile and central generated projections remain unchanged. (closure, agent-observation)
- Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated blockers remain fail closed. (closure, agent-observation)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope unisane-ops. (target: `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution: reviewed-no-change

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-639cf77f",
  "type": "task",
  "status": "active",
  "generatedAt": "2026-08-09T20:20:39.848Z",
  "updatedAt": "2026-08-09T20:33:14.500Z",
  "planIds": [],
  "childTasks": [],
  "state": "active",
  "detail": "detailed",
  "title": "Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary",
  "goal": "Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary",
  "scope": {
    "query": "unisane-ops",
    "matchedBy": "id",
    "scope": {
      "id": "unisane-ops",
      "kind": "product",
      "title": "Unisane Ops",
      "path": "unisane-ops",
      "aliases": [
        "ops"
      ],
      "summary": "Unisane Ops (platform-product).",
      "confidence": "high",
      "parent": "workspace",
      "ancestorIds": [
        "workspace"
      ],
      "profile": "platform-product",
      "memoryRoot": "unisane-ops/docs",
      "codeRoots": [
        "unisane-ops"
      ],
      "dependsOn": [
        "workspace"
      ],
      "owners": [
        "unisane-ops"
      ]
    }
  },
  "contract": {
    "acceptanceCriteria": [
      "Every authored source, type, and test import from @unisane/devtools uses only @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed.",
      "@unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools with no workspace/file/link fallback, alias, shim, or copied source.",
      "A deterministic package-owned boundary and packed manifest/content/declaration proof passes without publishing or mutating registry authority.",
      "Disposable proof records required root lock and repository-ledger deltas while tracked root lockfile and central generated projections remain unchanged.",
      "Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated blockers remain fail closed."
    ],
    "nonGoals": [
      "Do not resolve Ops console UI/data-table blockers, materialize the target repo, activate target lockfile/Skopos, publish, deploy, or mutate external systems."
    ],
    "constraints": [
      "Own only unisane-ops/packages/framework-ops and unique Skopos Task artifacts; do not access or modify private audit evidence."
    ]
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "explicit-override",
    "workflow": "strict",
    "reasons": [
      "The goal contains high-impact signal: release."
    ],
    "signals": {
      "goalSignals": [
        "release"
      ],
      "ownedPathCount": 1,
      "affectedScopeIds": [
        "unisane-ops",
        "workspace"
      ],
      "impactCategories": [
        "scope-source"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-1a9dcc2fa8b12f73"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "step-review-current-pattern",
      "kind": "implementation",
      "title": "Review the current pattern in Unisane Ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "complete"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Every authored source, type, and test import from @unisane/devtools uses only @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "@unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools with no workspace/file/link fallback, alias, shim, or copied source.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "A deterministic package-owned boundary and packed manifest/content/declaration proof passes without publishing or mutating registry authority.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Disposable proof records required root lock and repository-ledger deltas while tracked root lockfile and central generated projections remain unchanged.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated blockers remain fail closed.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-standard-ca03a29925",
      "role": "standard",
      "reason": "High-impact work must review and synchronize the existing standard Memory for Scope unisane-ops.",
      "status": "complete",
      "targetPath": "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed the transition Standard: this bounded package cut consumes the already-admitted exact Devtools release boundary and leaves root lockfile, target lockfile, Skopos activation, central projections, materialization, and unrelated blockers unchanged.",
      "resolvedAt": "2026-08-09T20:22:54.427Z",
      "resolvedByActorId": "codex-unisane-ops-framework-devtools-boundary"
    }
  ],
  "questions": [],
  "recommendations": [],
  "declaredOwnedPaths": [
    "unisane-ops/packages/framework-ops"
  ]
}
```
<!-- skopos:task-state:end -->
