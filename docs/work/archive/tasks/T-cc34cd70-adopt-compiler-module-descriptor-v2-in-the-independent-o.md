---
title: "Task: Adopt Compiler module descriptor v2 in the independent Ops descriptor validator"
status: complete
owner: "project"
id: T-cc34cd70
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-b40ce868dd3925ca
lastUpdated: 2026-09-07
---

# Task: Adopt Compiler module descriptor v2 in the independent Ops descriptor validator

## Changelog

- `2026-09-07`: Synchronized Task state `complete` from Skopos.

## Goal

Adopt Compiler module descriptor v2 in the independent Ops descriptor validator

## Acceptance

- Ops independently validates module compatibility v2 while outer project contract remains v1, rejects obsolete compatibility, and conformance fixtures originate from canonical Compiler package assets with focused tests passing.

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.
- Reason: The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible.

## Owned Paths

- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `packages/framework-ops/package.json`
- `packages/framework-ops/README.md`
- `packages/framework-ops/scripts/verify-release-boundary.mjs`
- `packages/framework-ops/src/__tests__/descriptor.test.ts`
- `packages/framework-ops/src/contracts.ts`
- `packages/framework-ops/tests/fixtures/project-descriptor-contract/v1`
- `packages/framework-ops/tests/release-boundary.test.mjs`

## Ownership Expansions

- `2026-09-07T11:26:06.906Z` by `ops-descriptor`: `docs/standards/13-unisane-ops-product-architecture-baseline.md`, `packages/framework-ops/README.md` — Record exact module compatibility v2 inside unchanged static project contract v1 and packed conformance fixture provenance; synchronize selected Memory.
- `2026-09-07T11:26:47.136Z` by `ops-descriptor`: `packages/framework-ops/package.json` — Canonical test command currently runs node:test .mjs suites through Vitest causing no-suite failure; scope Vitest to authored src tests before existing Node runner.
- `2026-09-07T11:27:34.192Z` by `ops-descriptor`: `packages/framework-ops/scripts/verify-release-boundary.mjs` — Synchronize exact allowed test script with separate Vitest src and Node test runners; retain independent boundary allowlist enforcement.
- `2026-09-07T11:28:03.638Z` by `ops-descriptor`: `packages/framework-ops/tests/release-boundary.test.mjs` — Existing exact authored import inventory expected23 but actual boundary audit reports24 with zero first-party imports; align scoped release inventory regression.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Adopt Compiler module descriptor v2 in the independent Ops descriptor validator" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Ops independently validates module compatibility v2 while outer project contract remains v1, rejects obsolete compatibility, and conformance fixtures originate from canonical Compiler package assets with focused tests passing. (closure, agent-observation)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope workspace. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-cc34cd70",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-07T11:24:04.227Z",
  "updatedAt": "2026-09-07T11:31:16.453Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Adopt Compiler module descriptor v2 in the independent Ops descriptor validator",
  "goal": "Adopt Compiler module descriptor v2 in the independent Ops descriptor validator",
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
      "Ops independently validates module compatibility v2 while outer project contract remains v1, rejects obsolete compatibility, and conformance fixtures originate from canonical Compiler package assets with focused tests passing."
    ],
    "nonGoals": [],
    "constraints": []
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
      "ownedPathCount": 3,
      "affectedScopeIds": [
        "workspace"
      ],
      "impactCategories": [
        "workspace-file"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-b40ce868dd3925ca"
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
      "detail": "Carry out \"Adopt Compiler module descriptor v2 in the independent Ops descriptor validator\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Ops independently validates module compatibility v2 while outer project contract remains v1, rejects obsolete compatibility, and conformance fixtures originate from canonical Compiler package assets with focused tests passing.",
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
      "reason": "High-impact work must review and synchronize the existing standard Memory for Scope workspace.",
      "status": "complete",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
      "resolution": "memory-updated",
      "resolutionReason": "Updated optional Framework boundary section with unchanged project contract v1, required module compatibility v2, independent pinned contract/schema bytes and packed fixture provenance.",
      "resolvedAt": "2026-09-07T11:28:47.219Z",
      "resolvedByActorId": "ops-descriptor"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 4 times and new impact categories appeared (docs). Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "high",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-cc34cd70' 'Continue Adopt Compiler module descriptor v2 in the independent Ops descriptor validator as bounded follow-up work' . --scope 'workspace' --own 'docs/standards/13-unisane-ops-product-architecture-baseline.md' --own 'packages/framework-ops/package.json' --own 'packages/framework-ops/README.md' --own 'packages/framework-ops/scripts/verify-release-boundary.mjs' --own 'packages/framework-ops/tests/release-boundary.test.mjs' --reason 'The Task may be drifting from its admitted subject because ownership expanded 4 times and new impact categories appeared (docs).' --actor 'ops-descriptor'",
      "ownedPaths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "packages/framework-ops/package.json",
        "packages/framework-ops/README.md",
        "packages/framework-ops/scripts/verify-release-boundary.mjs",
        "packages/framework-ops/tests/release-boundary.test.mjs"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 4 times and new impact categories appeared (docs).",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "packages/framework-ops/README.md"
      ],
      "reason": "Record exact module compatibility v2 inside unchanged static project contract v1 and packed conformance fixture provenance; synchronize selected Memory.",
      "actorId": "ops-descriptor",
      "recordedAt": "2026-09-07T11:26:06.906Z",
      "baselinePaths": [
        {
          "path": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
          "digest": "1b6040a88b35cf00e113fdf8e2384feaf71ab4d2602e420b924451d01f6062bf",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/framework-ops/README.md",
          "digest": "b773473700a81b26edd20a47f5412d4c1bc4ff9bb23782be0711833a703526a1",
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
        "packages/framework-ops/package.json"
      ],
      "reason": "Canonical test command currently runs node:test .mjs suites through Vitest causing no-suite failure; scope Vitest to authored src tests before existing Node runner.",
      "actorId": "ops-descriptor",
      "recordedAt": "2026-09-07T11:26:47.136Z",
      "baselinePaths": [
        {
          "path": "packages/framework-ops/package.json",
          "digest": "81d3874473a0e6d4ecc16aeff31faee7a7d5cfdc7f9d13095b0f45652854afc9",
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
        "packages/framework-ops/scripts/verify-release-boundary.mjs"
      ],
      "reason": "Synchronize exact allowed test script with separate Vitest src and Node test runners; retain independent boundary allowlist enforcement.",
      "actorId": "ops-descriptor",
      "recordedAt": "2026-09-07T11:27:34.192Z",
      "baselinePaths": [
        {
          "path": "packages/framework-ops/scripts/verify-release-boundary.mjs",
          "digest": "4fd1824f5db9eab9755c829d614946381bd496426ce6d61b51ac5fa72a28d5c6",
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
        "packages/framework-ops/tests/release-boundary.test.mjs"
      ],
      "reason": "Existing exact authored import inventory expected23 but actual boundary audit reports24 with zero first-party imports; align scoped release inventory regression.",
      "actorId": "ops-descriptor",
      "recordedAt": "2026-09-07T11:28:03.638Z",
      "baselinePaths": [
        {
          "path": "packages/framework-ops/tests/release-boundary.test.mjs",
          "digest": "e62215fdcbd3cd273191ff21ff5f5108f13303d8679305f0fa355d075d3832a5",
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
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "packages/framework-ops/package.json",
    "packages/framework-ops/README.md",
    "packages/framework-ops/scripts/verify-release-boundary.mjs",
    "packages/framework-ops/src/__tests__/descriptor.test.ts",
    "packages/framework-ops/src/contracts.ts",
    "packages/framework-ops/tests/fixtures/project-descriptor-contract/v1",
    "packages/framework-ops/tests/release-boundary.test.mjs"
  ]
}
```
<!-- skopos:task-state:end -->
