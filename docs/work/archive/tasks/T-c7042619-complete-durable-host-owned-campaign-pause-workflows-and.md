---
title: "Task: Complete durable host-owned campaign pause workflows and Meta provider control across interfaces"
status: complete
owner: "codex"
id: T-c7042619
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-d976245befb5b42b
lastUpdated: 2026-09-06
---

# Task: Complete durable host-owned campaign pause workflows and Meta provider control across interfaces

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Complete durable host-owned campaign pause workflows and Meta provider control across interfaces

## Acceptance

- Campaign apply persists an atomic attempt before provider writes and interrupted attempts reconcile without replay
- Host composes selected Meta campaign control and durable stores without exposing a raw mutation bypass
- CLI MCP and console approvals consume the shared host campaign lifecycle with truthful capability status
- Synthetic workflow recovery isolation and provider tests plus builds types lint pass and docs separate remaining scope from live proof

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

- `apps/console/src/app.test.ts`
- `docs/work/plans/unisane-ops-execution-cleanup-audit.md`
- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `packages/growth/src`
- `packages/ops-mcp/src`
- `packages/provider-meta/src`
- `packages/unisane-ops/src`
- `packages/unisane-ops/test`

## Ownership Expansions

- `2026-09-06T16:54:30.111Z` by `codex`: `apps/console/src/app.test.ts` — Update console integration fixture to exercise host-owned campaign review listing after store convergence

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete durable host-owned campaign pause workflows and Meta provider control across interfaces" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Campaign apply persists an atomic attempt before provider writes and interrupted attempts reconcile without replay (closure, agent-observation)
- Host composes selected Meta campaign control and durable stores without exposing a raw mutation bypass (closure, agent-observation)
- CLI MCP and console approvals consume the shared host campaign lifecycle with truthful capability status (closure, agent-observation)
- Synthetic workflow recovery isolation and provider tests plus builds types lint pass and docs separate remaining scope from live proof (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-c7042619",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T16:42:00.168Z",
  "updatedAt": "2026-09-06T16:58:30.883Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Complete durable host-owned campaign pause workflows and Meta provider control across interfaces",
  "goal": "Complete durable host-owned campaign pause workflows and Meta provider control across interfaces",
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
      "Campaign apply persists an atomic attempt before provider writes and interrupted attempts reconcile without replay",
      "Host composes selected Meta campaign control and durable stores without exposing a raw mutation bypass",
      "CLI MCP and console approvals consume the shared host campaign lifecycle with truthful capability status",
      "Synthetic workflow recovery isolation and provider tests plus builds types lint pass and docs separate remaining scope from live proof"
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
    "baselineId": "baseline-d976245befb5b42b"
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
      "detail": "Carry out \"Complete durable host-owned campaign pause workflows and Meta provider control across interfaces\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Campaign apply persists an atomic attempt before provider writes and interrupted attempts reconcile without replay",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Host composes selected Meta campaign control and durable stores without exposing a raw mutation bypass",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "CLI MCP and console approvals consume the shared host campaign lifecycle with truthful capability status",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Synthetic workflow recovery isolation and provider tests plus builds types lint pass and docs separate remaining scope from live proof",
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
        "apps/console/src/app.test.ts"
      ],
      "reason": "Update console integration fixture to exercise host-owned campaign review listing after store convergence",
      "actorId": "codex",
      "recordedAt": "2026-09-06T16:54:30.111Z",
      "baselinePaths": [
        {
          "path": "apps/console/src/app.test.ts",
          "digest": "faeda31aa07a21b5233e0d7ae778c38d8b7377fc41170db1e3f34c150db7fc67",
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
    "apps/console/src/app.test.ts",
    "docs/work/plans/unisane-ops-execution-cleanup-audit.md",
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "packages/growth/src",
    "packages/ops-mcp/src",
    "packages/provider-meta/src",
    "packages/unisane-ops/src",
    "packages/unisane-ops/test"
  ]
}
```
<!-- skopos:task-state:end -->
