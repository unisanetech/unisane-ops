---
title: "Task: Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection"
status: complete
owner: "bhaskarbarma"
id: T-a19b0534
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-ee5a51c4a941e78a
lastUpdated: 2026-09-01
---

# Task: Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection

## Changelog

- `2026-09-01`: Synchronized Task state `complete` from Skopos.

## Goal

Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection

## Acceptance

- Provider Meta persists a strict token-free record bound to scope, project, environment, connection, identity, secret reference, and credential version.
- Rotation, refresh, revocation, and disconnect transitions reject context or version conflicts and never return or persist credential material.
- Growth reads canonical Meta connection records into its normalized readiness context without calling Graph or treating provider status as business truth.
- Focused provider and host tests cover strict parsing, atomic persistence, lifecycle conflicts, revocation, disconnect retention semantics, and status projection.

## Non-Goals

- Do not implement OAuth, accept raw tokens, resolve a hosted credential, call Meta Graph, enable campaign mutation, or connect a real account.

## Constraints

- Provider Meta owns connection records; the host owns secret custody; Growth owns normalized readiness only.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.
- Reason: The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks/snapshots/T-a19b0534-S-dcb6e4ba1fa0.json`
- `packages/provider-meta/package.json`
- `packages/provider-meta/README.md`
- `packages/provider-meta/src/index.ts`
- `packages/provider-meta/src/meta/connection-lifecycle.ts`
- `packages/provider-meta/src/meta/connection-store.ts`
- `packages/provider-meta/src/meta/connection.test.ts`
- `packages/provider-meta/src/meta/connection.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.test.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.ts`
- `pnpm-lock.yaml`

## Ownership Expansions

- `2026-09-01T21:03:57.968Z` by `bhaskarbarma`: `packages/provider-meta/package.json`, `pnpm-lock.yaml` — The provider-owned runtime validator requires a direct Zod dependency and corresponding workspace lockfile update.
- `2026-09-01T21:06:52.225Z` by `bhaskarbarma`: `packages/unisane-ops/src/runtime-adapters/growth.test.ts` — Focused host projection coverage is required to prove the canonical Meta record reaches Growth without secret metadata.
- `2026-09-01T21:10:09.873Z` by `bhaskarbarma`: `docs/reference/generated/repository/standalone-repository-integrity.json`, `docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json` — Adopt reviewed generated references refreshed for the Meta lifecycle package surface.
- `2026-09-01T21:12:19.387Z` by `bhaskarbarma`: `docs/work/tasks/snapshots/T-a19b0534-S-dcb6e4ba1fa0.json` — Own the immutable high-impact verification snapshot created for this task.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Provider Meta persists a strict token-free record bound to scope, project, environment, connection, identity, secret reference, and credential version. (closure, agent-observation)
- Rotation, refresh, revocation, and disconnect transitions reject context or version conflicts and never return or persist credential material. (closure, agent-observation)
- Growth reads canonical Meta connection records into its normalized readiness context without calling Graph or treating provider status as business truth. (closure, agent-observation)
- Focused provider and host tests cover strict parsing, atomic persistence, lifecycle conflicts, revocation, disconnect retention semantics, and status projection. (closure, agent-observation)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-a19b0534",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-01T21:00:26.561Z",
  "updatedAt": "2026-09-01T21:12:33.470Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection",
  "goal": "Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection",
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
      "Provider Meta persists a strict token-free record bound to scope, project, environment, connection, identity, secret reference, and credential version.",
      "Rotation, refresh, revocation, and disconnect transitions reject context or version conflicts and never return or persist credential material.",
      "Growth reads canonical Meta connection records into its normalized readiness context without calling Graph or treating provider status as business truth.",
      "Focused provider and host tests cover strict parsing, atomic persistence, lifecycle conflicts, revocation, disconnect retention semantics, and status projection."
    ],
    "nonGoals": [
      "Do not implement OAuth, accept raw tokens, resolve a hosted credential, call Meta Graph, enable campaign mutation, or connect a real account."
    ],
    "constraints": [
      "Provider Meta owns connection records; the host owns secret custody; Growth owns normalized readiness only."
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
      "ownedPathCount": 9,
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
    "baselineId": "baseline-ee5a51c4a941e78a"
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
      "detail": "Carry out \"Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Provider Meta persists a strict token-free record bound to scope, project, environment, connection, identity, secret reference, and credential version.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Rotation, refresh, revocation, and disconnect transitions reject context or version conflicts and never return or persist credential material.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Growth reads canonical Meta connection records into its normalized readiness context without calling Graph or treating provider status as business truth.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused provider and host tests cover strict parsing, atomic persistence, lifecycle conflicts, revocation, disconnect retention semantics, and status projection.",
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
      "resolutionReason": "Recorded the provider-owned token-free Meta record lifecycle and host-to-Growth projection boundary in the canonical architecture standard.",
      "resolvedAt": "2026-09-01T21:11:46.867Z",
      "resolvedByActorId": "bhaskarbarma"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 4 times. Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "medium",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-a19b0534' 'Continue Implement the provider-owned token-free Meta connection record lifecycle and Growth status projection as bounded follow-up work' . --scope 'workspace' --own 'docs/reference/generated/repository/standalone-repository-integrity.json' --own 'docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json' --own 'docs/work/tasks/snapshots/T-a19b0534-S-dcb6e4ba1fa0.json' --own 'packages/provider-meta/package.json' --own 'packages/unisane-ops/src/runtime-adapters/growth.test.ts' --own 'pnpm-lock.yaml' --reason 'The Task may be drifting from its admitted subject because ownership expanded 4 times.' --actor 'bhaskarbarma'",
      "ownedPaths": [
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
        "docs/work/tasks/snapshots/T-a19b0534-S-dcb6e4ba1fa0.json",
        "packages/provider-meta/package.json",
        "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
        "pnpm-lock.yaml"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 4 times.",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "packages/provider-meta/package.json",
        "pnpm-lock.yaml"
      ],
      "reason": "The provider-owned runtime validator requires a direct Zod dependency and corresponding workspace lockfile update.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T21:03:57.968Z",
      "baselinePaths": [
        {
          "path": "packages/provider-meta/package.json",
          "digest": "14753a81f3590db40b4445d57d1d932a58e6b5f369e35601fc0b1ca634a570a4",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "pnpm-lock.yaml",
          "digest": "a49a708350f57f68765cd3a2054356a080f1ebbf7475efba95e80be8a77256fa",
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
        "packages/unisane-ops/src/runtime-adapters/growth.test.ts"
      ],
      "reason": "Focused host projection coverage is required to prove the canonical Meta record reaches Growth without secret metadata.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T21:06:52.225Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
          "digest": "2b050011873675bd75cc8116aee84783818897cc375d5f156a05274876a622d7",
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
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json"
      ],
      "reason": "Adopt reviewed generated references refreshed for the Meta lifecycle package surface.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T21:10:09.873Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "0105938c5dd5c26b967a24003435a3da944da183110a17a504252420ef110306",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
          "digest": "c492632f44d63bbe471d72f57dcea146f7def894b1f06280ffa1f34435c42969",
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
        "docs/work/tasks/snapshots/T-a19b0534-S-dcb6e4ba1fa0.json"
      ],
      "reason": "Own the immutable high-impact verification snapshot created for this task.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T21:12:19.387Z",
      "baselinePaths": [
        {
          "path": "docs/work/tasks/snapshots/T-a19b0534-S-dcb6e4ba1fa0.json",
          "digest": "ed7b424c34ca20afce16712bc931b37826a61c3cdef425bf2881fe6fc9c61bd1",
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
    "recordedAt": "2026-09-01T21:12:18.226Z",
    "priorState": "verifying",
    "nextState": "active"
  },
  "declaredOwnedPaths": [
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks/snapshots/T-a19b0534-S-dcb6e4ba1fa0.json",
    "packages/provider-meta/package.json",
    "packages/provider-meta/README.md",
    "packages/provider-meta/src/index.ts",
    "packages/provider-meta/src/meta/connection-lifecycle.ts",
    "packages/provider-meta/src/meta/connection-store.ts",
    "packages/provider-meta/src/meta/connection.test.ts",
    "packages/provider-meta/src/meta/connection.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.ts",
    "pnpm-lock.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
