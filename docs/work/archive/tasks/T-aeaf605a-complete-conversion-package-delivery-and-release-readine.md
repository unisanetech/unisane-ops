---
title: "Task: Complete conversion package delivery and release readiness"
status: complete
owner: "codex"
id: T-aeaf605a
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-6f9e59ab0f0cb78b
lastUpdated: 2026-09-11
---

# Task: Complete conversion package delivery and release readiness

## Changelog

- `2026-09-11`: Synchronized Task state `complete` from Skopos.

## Goal

Complete conversion package delivery and release readiness

## Acceptance

- Typed provider matching, sanitized attempt evidence, provider-directed retry behavior and actual Core outbox integration pass focused checks; versioned release artifacts and migration guidance are prepared

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `automatic`
- Reason: The goal contains high-impact signal: release.

## Owned Paths

- `.changeset`
- `docs/guides`
- `packages/provider-meta`
- `packages/web-runtime`
- `pnpm-lock.yaml`

## Ownership Expansions

- `2026-09-11T12:35:26.154Z` by `codex`: `pnpm-lock.yaml` — Pin the explicit provider-to-shared-contract dependency in the workspace lockfile

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete conversion package delivery and release readiness" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Typed provider matching, sanitized attempt evidence, provider-directed retry behavior and actual Core outbox integration pass focused checks; versioned release artifacts and migration guidance are prepared (closure, agent-observation)

## Memory Obligations

- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/README.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/README.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/portable-conversion-delivery.md; review and synchronize it if project truth changes. (target: `docs/guides/portable-conversion-delivery.md`); resolution: memory-updated
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/growth-provider-operations.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/research-provider-evidence.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/ads-asset-provider-operations.md`); resolution: reviewed-no-change

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-aeaf605a",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-11T12:18:13.272Z",
  "updatedAt": "2026-09-11T12:40:43.565Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Complete conversion package delivery and release readiness",
  "goal": "Complete conversion package delivery and release readiness",
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
      "Typed provider matching, sanitized attempt evidence, provider-directed retry behavior and actual Core outbox integration pass focused checks; versioned release artifacts and migration guidance are prepared"
    ],
    "nonGoals": [],
    "constraints": []
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "automatic",
    "workflow": "strict",
    "reasons": [
      "The goal contains high-impact signal: release."
    ],
    "signals": {
      "goalSignals": [
        "release"
      ],
      "ownedPathCount": 4,
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
    "baselineId": "baseline-6f9e59ab0f0cb78b"
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
      "detail": "Carry out \"Complete conversion package delivery and release readiness\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Typed provider matching, sanitized attempt evidence, provider-directed retry behavior and actual Core outbox integration pass focused checks; versioned release artifacts and migration guidance are prepared",
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
      "resolutionReason": "No adopter code or TrueResume operating workflow changed.",
      "resolvedAt": "2026-09-11T12:37:26.076Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-9b94585cde",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/portable-conversion-delivery.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/portable-conversion-delivery.md",
      "resolution": "memory-updated",
      "resolutionReason": "Updated portable conversion guide with PostgreSQL proof and migration prerequisites.",
      "resolvedAt": "2026-09-11T12:37:40.347Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-be05fc0cf4",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/growth-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Provider account operations in TrueResume are unchanged.",
      "resolvedAt": "2026-09-11T12:37:27.231Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-d5ad057196",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/research-provider-evidence.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Research evidence workflows in TrueResume are unchanged.",
      "resolvedAt": "2026-09-11T12:37:28.307Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-e15f796386",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/ads-asset-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Ads asset operations in TrueResume are unchanged.",
      "resolvedAt": "2026-09-11T12:37:29.421Z",
      "resolvedByActorId": "codex"
    }
  ],
  "questions": [],
  "recommendations": [],
  "ownershipExpansions": [
    {
      "paths": [
        "pnpm-lock.yaml"
      ],
      "reason": "Pin the explicit provider-to-shared-contract dependency in the workspace lockfile",
      "actorId": "codex",
      "recordedAt": "2026-09-11T12:35:26.154Z",
      "baselinePaths": [
        {
          "path": "pnpm-lock.yaml",
          "digest": "1eb981f16df502b26ca7a7ab6fa0eb45b56844189862a6f3028aced261cb7efa",
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
    ".changeset",
    "docs/guides",
    "packages/provider-meta",
    "packages/web-runtime",
    "pnpm-lock.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
