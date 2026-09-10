---
title: "Task: Implement strict read-only Meta measurement connection contracts and readiness gating"
status: complete
owner: "bhaskarbarma"
id: T-d1cacae2
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-d1656596da60e93d
lastUpdated: 2026-09-01
---

# Task: Implement strict read-only Meta measurement connection contracts and readiness gating

## Changelog

- `2026-09-01`: Synchronized Task state `complete` from Skopos.

## Goal

Implement strict read-only Meta measurement connection contracts and readiness gating

## Acceptance

- Growth validates credential state, exact read grants, expiry, and explicit Meta measurement resource selection before reporting readiness.
- Ambiguous or incomplete Meta resource selections fail closed per service and never expose credential material.
- Focused tests cover ready, partial-grant, expired, ambiguous, disconnected, and forbidden-scope cases.

## Non-Goals

- Do not call Meta Graph, persist credentials, enable campaign mutation authority, or connect a production account.

## Constraints

- Provider Meta owns Graph transport; the host owns credential custody; Growth owns only normalized measurement readiness.
- Never accept, return, log, or persist Meta access tokens through ordinary Growth CLI or console contracts.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.
- Reason: The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__growth.symbols.json`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks/snapshots/T-d1cacae2-S-7005b6f3a7d3.json`
- `packages/growth/src/console/connections.test.ts`
- `packages/growth/src/console/connections.ts`
- `packages/growth/src/marketing/connections/meta.test.ts`
- `packages/growth/src/marketing/connections/meta.ts`
- `packages/growth/src/marketing/index.ts`

## Ownership Expansions

- `2026-09-01T19:44:03.337Z` by `bhaskarbarma`: `docs/reference/generated/repository/standalone-repository-integrity.json`, `docs/reference/generated/symbols/packages/@unisane__growth.symbols.json` — Adopt reviewed generated references refreshed by the scoped Meta connection contract.
- `2026-09-01T19:45:08.629Z` by `bhaskarbarma`: `docs/work/tasks/snapshots/T-d1cacae2-S-7005b6f3a7d3.json` — Own the immutable high-impact verification snapshot created for this task.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement strict read-only Meta measurement connection contracts and readiness gating" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Growth validates credential state, exact read grants, expiry, and explicit Meta measurement resource selection before reporting readiness. (closure, agent-observation)
- Ambiguous or incomplete Meta resource selections fail closed per service and never expose credential material. (closure, agent-observation)
- Focused tests cover ready, partial-grant, expired, ambiguous, disconnected, and forbidden-scope cases. (closure, agent-observation)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-d1cacae2",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-01T19:34:47.431Z",
  "updatedAt": "2026-09-01T19:45:22.463Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Implement strict read-only Meta measurement connection contracts and readiness gating",
  "goal": "Implement strict read-only Meta measurement connection contracts and readiness gating",
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
      "Growth validates credential state, exact read grants, expiry, and explicit Meta measurement resource selection before reporting readiness.",
      "Ambiguous or incomplete Meta resource selections fail closed per service and never expose credential material.",
      "Focused tests cover ready, partial-grant, expired, ambiguous, disconnected, and forbidden-scope cases."
    ],
    "nonGoals": [
      "Do not call Meta Graph, persist credentials, enable campaign mutation authority, or connect a production account."
    ],
    "constraints": [
      "Provider Meta owns Graph transport; the host owns credential custody; Growth owns only normalized measurement readiness.",
      "Never accept, return, log, or persist Meta access tokens through ordinary Growth CLI or console contracts."
    ]
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "standard",
    "recommendedDetail": "standard",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "explicit-override",
    "workflow": "strict",
    "reasons": [
      "The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.",
      "The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 7,
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
    "baselineId": "baseline-d1656596da60e93d"
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
      "detail": "Carry out \"Implement strict read-only Meta measurement connection contracts and readiness gating\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Growth validates credential state, exact read grants, expiry, and explicit Meta measurement resource selection before reporting readiness.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Ambiguous or incomplete Meta resource selections fail closed per service and never expose credential material.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Focused tests cover ready, partial-grant, expired, ambiguous, disconnected, and forbidden-scope cases.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-standard-2653e0fd89",
      "role": "standard",
      "reason": "The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
      "resolution": "memory-updated",
      "resolutionReason": "Added the token-free Meta measurement connection readiness boundary and console semantics to the canonical architecture standard.",
      "resolvedAt": "2026-09-01T19:44:26.556Z",
      "resolvedByActorId": "bhaskarbarma"
    }
  ],
  "questions": [],
  "recommendations": [],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json"
      ],
      "reason": "Adopt reviewed generated references refreshed by the scoped Meta connection contract.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T19:44:03.337Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "76bf911f350faac317345b4742679f6c9a21a1ff6f2bf5951601335e474d88be",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
          "digest": "db61d70d83b293c8c60d00af4299ae947292bbba77a3cb0aecbc8e34ed37e5e4",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "workspace",
      "nextScopeId": "workspace",
      "affectedScopeIds": [
        "workspace"
      ]
    },
    {
      "paths": [
        "docs/work/tasks/snapshots/T-d1cacae2-S-7005b6f3a7d3.json"
      ],
      "reason": "Own the immutable high-impact verification snapshot created for this task.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T19:45:08.629Z",
      "baselinePaths": [
        {
          "path": "docs/work/tasks/snapshots/T-d1cacae2-S-7005b6f3a7d3.json",
          "digest": "fdc8799c867cff5bc8449d896c5571aa5f1a68effd2666e33f160d1463c3e4e4",
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
  "disposition": {
    "kind": "return-from-verification",
    "reason": "Adopt the immutable verification snapshot into task ownership before final closure.",
    "actorId": "bhaskarbarma",
    "recordedAt": "2026-09-01T19:45:07.487Z",
    "priorState": "verifying",
    "nextState": "active"
  },
  "declaredOwnedPaths": [
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks/snapshots/T-d1cacae2-S-7005b6f3a7d3.json",
    "packages/growth/src/console/connections.test.ts",
    "packages/growth/src/console/connections.ts",
    "packages/growth/src/marketing/connections/meta.test.ts",
    "packages/growth/src/marketing/connections/meta.ts",
    "packages/growth/src/marketing/index.ts"
  ]
}
```
<!-- skopos:task-state:end -->
