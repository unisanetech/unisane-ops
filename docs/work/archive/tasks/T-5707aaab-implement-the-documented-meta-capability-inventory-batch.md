---
title: "Task: Implement the documented Meta capability inventory batch with separate implementation and verification facts"
status: complete
owner: "codex"
id: T-5707aaab
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-0d7cefc743f940ec
lastUpdated: 2026-09-05
---

# Task: Implement the documented Meta capability inventory batch with separate implementation and verification facts

## Changelog

- `2026-09-05`: Synchronized Task state `complete` from Skopos.

## Goal

Implement the documented Meta capability inventory batch with separate implementation and verification facts

## Acceptance

- Document package ownership, contract, file layout, sequence, tests and completion before code changes
- Meta capability inventory distinguishes implementation, verification and host requirements without claiming account readiness
- Existing offline host operation returns the provider-owned inventory without credentials or network access

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.

## Owned Paths

- `docs/00-start-here.md`
- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `docs/work/plans/unisane-ops-meta-capability-implementation-plan.md`
- `packages/provider-meta/README.md`
- `packages/provider-meta/src/meta/capabilities`
- `packages/provider-meta/src/meta/capabilities.test.ts`
- `packages/provider-meta/src/meta/capabilities.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.test.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.ts`

## Ownership Expansions

- `2026-09-05T19:06:59.258Z` by `codex`: `packages/unisane-ops/src/runtime-adapters/growth.ts` — Update the existing offline host operation to consume the versioned provider inventory facade documented before implementation.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement the documented Meta capability inventory batch with separate implementation and verification facts" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Document package ownership, contract, file layout, sequence, tests and completion before code changes (closure, agent-observation)
- Meta capability inventory distinguishes implementation, verification and host requirements without claiming account readiness (closure, agent-observation)
- Existing offline host operation returns the provider-owned inventory without credentials or network access (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-5707aaab",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-05T19:05:57.668Z",
  "updatedAt": "2026-09-05T19:11:37.349Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Implement the documented Meta capability inventory batch with separate implementation and verification facts",
  "goal": "Implement the documented Meta capability inventory batch with separate implementation and verification facts",
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
      "Document package ownership, contract, file layout, sequence, tests and completion before code changes",
      "Meta capability inventory distinguishes implementation, verification and host requirements without claiming account readiness",
      "Existing offline host operation returns the provider-owned inventory without credentials or network access"
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
    "selectionSource": "explicit-override",
    "workflow": "tracked",
    "reasons": [
      "The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 8,
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
    "baselineId": "baseline-0d7cefc743f940ec"
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
      "detail": "Carry out \"Implement the documented Meta capability inventory batch with separate implementation and verification facts\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Document package ownership, contract, file layout, sequence, tests and completion before code changes",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Meta capability inventory distinguishes implementation, verification and host requirements without claiming account readiness",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Existing offline host operation returns the provider-owned inventory without credentials or network access",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
  "questions": [],
  "recommendations": [],
  "ownershipExpansions": [
    {
      "paths": [
        "packages/unisane-ops/src/runtime-adapters/growth.ts"
      ],
      "reason": "Update the existing offline host operation to consume the versioned provider inventory facade documented before implementation.",
      "actorId": "codex",
      "recordedAt": "2026-09-05T19:06:59.258Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/src/runtime-adapters/growth.ts",
          "digest": "cae0bce86bc58fdf1ff85300e17811843926292ad95ddd3c57001fddac282994",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "workspace",
      "nextScopeId": "workspace",
      "affectedScopeIds": [
        "workspace"
      ]
    }
  ],
  "declaredOwnedPaths": [
    "docs/00-start-here.md",
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-meta-capability-implementation-plan.md",
    "packages/provider-meta/README.md",
    "packages/provider-meta/src/meta/capabilities",
    "packages/provider-meta/src/meta/capabilities.test.ts",
    "packages/provider-meta/src/meta/capabilities.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.ts"
  ]
}
```
<!-- skopos:task-state:end -->
