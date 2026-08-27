---
title: "Task: Make Ops package metadata explicit while preserving release blockers"
status: complete
owner: "codex"
id: T-9e65c3b1
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-5f8b7b0669d86f90
lastUpdated: 2026-08-27
---

# Task: Make Ops package metadata explicit while preserving release blockers

## Changelog

- `2026-08-27`: Synchronized Task state `complete` from Skopos.

## Goal

Make Ops package metadata explicit while preserving release blockers

## Acceptance

- The ten admitted public packages declare the correct repository directory and public provenance metadata
- ops-mcp and ops-hosted-postgresql remain private until their owner decision
- Repository licensing and publication remain blocked and no npm or remote mutation occurs

## Non-Goals

- None declared.

## Constraints

- Do not add a root license, publish, push, change visibility, or grant registry authority

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: release.
- Reason: The caller explicitly selected standard; Skopos recommended high-impact and kept both values visible.

## Owned Paths

- `docs/guides/true-resume/ads-asset-provider-operations.md`
- `docs/guides/true-resume/growth-provider-operations.md`
- `docs/guides/true-resume/research-provider-evidence.md`
- `docs/operations/true-resume/README.md`
- `docs/overview.md`
- `docs/standards/01-standalone-repository-transition-readiness.md`
- `docs/work/archive/tasks`
- `docs/work/tasks`
- `package.json`
- `packages`
- `tools/skopos/scopes.yaml`

## Ownership Expansions

- `2026-08-27T16:52:18.636Z` by `codex`: `docs/guides/true-resume/ads-asset-provider-operations.md`, `docs/guides/true-resume/growth-provider-operations.md`, `docs/guides/true-resume/research-provider-evidence.md`, `docs/operations/true-resume/README.md`, `docs/overview.md`, `docs/standards/01-standalone-repository-transition-readiness.md`, `tools/skopos/scopes.yaml` — Adopt the completed and reviewed documentation child result into parent integration ownership.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Make Ops package metadata explicit while preserving release blockers" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- The ten admitted public packages declare the correct repository directory and public provenance metadata (closure, agent-observation)
- ops-mcp and ops-hosted-postgresql remain private until their owner decision (closure, agent-observation)
- Repository licensing and publication remain blocked and no npm or remote mutation occurs (closure, agent-observation)

## Memory Obligations

- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/growth-provider-operations.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/research-provider-evidence.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/ads-asset-provider-operations.md`); resolution: reviewed-no-change

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-9e65c3b1",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-27T12:43:54.507Z",
  "updatedAt": "2026-08-27T16:53:03.606Z",
  "planIds": [],
  "childTasks": [
    {
      "taskId": "T-3bc3b56b",
      "title": "Converge stale Ops standalone documentation and scope metadata",
      "goal": "Converge stale Ops standalone documentation and scope metadata",
      "scopeId": "workspace",
      "state": "complete",
      "createdAt": "2026-08-27T12:49:48.738Z",
      "createdByActorId": "codex",
      "ownedPaths": [
        "docs/guides/true-resume",
        "docs/operations/true-resume",
        "docs/overview.md",
        "docs/standards/01-standalone-repository-transition-readiness.md",
        "tools/skopos/scopes.yaml"
      ],
      "dependencyTaskIds": [],
      "parentAcceptanceRequirementIds": [],
      "claimedByActorId": "codex"
    }
  ],
  "state": "complete",
  "detail": "standard",
  "title": "Make Ops package metadata explicit while preserving release blockers",
  "goal": "Make Ops package metadata explicit while preserving release blockers",
  "scope": {
    "query": "workspace",
    "matchedBy": "id",
    "scope": {
      "id": "workspace",
      "kind": "workspace",
      "title": "unisane-ops",
      "path": ".",
      "aliases": [
        "root"
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
      "The ten admitted public packages declare the correct repository directory and public provenance metadata",
      "ops-mcp and ops-hosted-postgresql remain private until their owner decision",
      "Repository licensing and publication remain blocked and no npm or remote mutation occurs"
    ],
    "nonGoals": [],
    "constraints": [
      "Do not add a root license, publish, push, change visibility, or grant registry authority"
    ]
  },
  "risk": "standard",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "standard",
    "selectedDetail": "standard",
    "selectionSource": "explicit-override",
    "workflow": "tracked",
    "reasons": [
      "The goal contains high-impact signal: release.",
      "The caller explicitly selected standard; Skopos recommended high-impact and kept both values visible."
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
    "baselineId": "baseline-5f8b7b0669d86f90"
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
      "detail": "Carry out \"Make Ops package metadata explicit while preserving release blockers\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "The ten admitted public packages declare the correct repository directory and public provenance metadata",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "ops-mcp and ops-hosted-postgresql remain private until their owner decision",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Repository licensing and publication remain blocked and no npm or remote mutation occurs",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-guide-be05fc0cf4",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/growth-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Guide behavior is unchanged; only standalone location and metadata were converged.",
      "resolvedAt": "2026-08-27T16:52:49.075Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-d5ad057196",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/research-provider-evidence.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Guide behavior is unchanged; only standalone location and metadata were converged.",
      "resolvedAt": "2026-08-27T16:52:49.804Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-e15f796386",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/ads-asset-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Guide behavior is unchanged; only standalone location and metadata were converged.",
      "resolvedAt": "2026-08-27T16:52:50.538Z",
      "resolvedByActorId": "codex"
    }
  ],
  "questions": [],
  "recommendations": [],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/guides/true-resume/ads-asset-provider-operations.md",
        "docs/guides/true-resume/growth-provider-operations.md",
        "docs/guides/true-resume/research-provider-evidence.md",
        "docs/operations/true-resume/README.md",
        "docs/overview.md",
        "docs/standards/01-standalone-repository-transition-readiness.md",
        "tools/skopos/scopes.yaml"
      ],
      "reason": "Adopt the completed and reviewed documentation child result into parent integration ownership.",
      "actorId": "codex",
      "recordedAt": "2026-08-27T16:52:18.636Z",
      "baselinePaths": [
        {
          "path": "docs/guides/true-resume/ads-asset-provider-operations.md",
          "digest": "62ad159470bdac15a1202c9c3636f01ec162de822d06b33e8e12de00ca20246a",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/guides/true-resume/growth-provider-operations.md",
          "digest": "5e9d018f8916036e2233069228ec081792529ff13bd05b084fc8183f36314e51",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/guides/true-resume/research-provider-evidence.md",
          "digest": "4ec25f784e12ad242e8c42892c93b44dbb6ac6cbdc53d9a0e948ac35d9b601a5",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/operations/true-resume/README.md",
          "digest": "676ea0204eedc297b654d5850019cbe2b787a12ac83e922892f87d50734d0703",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/overview.md",
          "digest": "1a7f793a026ddd7561d8f63aa1c6a5bce01bd0277c4f119f83876b3724cb5eab",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/standards/01-standalone-repository-transition-readiness.md",
          "digest": "171688bc711215b371d574a6b3f3e47c922104c1b330d2a3b6f223b3532be350",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "tools/skopos/scopes.yaml",
          "digest": "7bf34d667b7f951cd921b10ad6004de467e533bd280b30e8a5e616b1257069b1",
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
    "docs/guides/true-resume/ads-asset-provider-operations.md",
    "docs/guides/true-resume/growth-provider-operations.md",
    "docs/guides/true-resume/research-provider-evidence.md",
    "docs/operations/true-resume/README.md",
    "docs/overview.md",
    "docs/standards/01-standalone-repository-transition-readiness.md",
    "docs/work/archive/tasks",
    "docs/work/tasks",
    "package.json",
    "packages",
    "tools/skopos/scopes.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
