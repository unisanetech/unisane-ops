---
title: "Task: Implement remaining Meta workflows in documented batches beginning with isolated durable report evidence and shared history retrieval"
status: complete
owner: "codex"
id: T-e2bf1762
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-911967c3de495bee
lastUpdated: 2026-09-05
---

# Task: Implement remaining Meta workflows in documented batches beginning with isolated durable report evidence and shared history retrieval

## Changelog

- `2026-09-05`: Synchronized Task state `complete` from Skopos.

## Goal

Implement remaining Meta workflows in documented batches beginning with isolated durable report evidence and shared history retrieval

## Acceptance

- Record remaining batch scope and preserve architecture boundaries before coding
- Reports can be saved and retrieved with exact project environment account binding and corruption checks
- CLI MCP and console expose shared history contracts without provider credentials or independent business rules
- Focused tests types builds and interface verification prove implemented batches with remaining live gaps recorded

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

- `apps/console/src`
- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `docs/work/plans/unisane-ops-meta-capability-implementation-plan.md`
- `packages/growth/pack.manifest.json`
- `packages/growth/src`
- `packages/ops-mcp/src`
- `packages/unisane-ops/src`
- `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs`

## Ownership Expansions

- `2026-09-05T23:40:59.002Z` by `codex`: `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs` — Keep generated Codex binding assertions aligned with the canonical MCP tool list

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement remaining Meta workflows in documented batches beginning with isolated durable report evidence and shared history retrieval" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Record remaining batch scope and preserve architecture boundaries before coding (closure, agent-observation)
- Reports can be saved and retrieved with exact project environment account binding and corruption checks (closure, agent-observation)
- CLI MCP and console expose shared history contracts without provider credentials or independent business rules (closure, agent-observation)
- Focused tests types builds and interface verification prove implemented batches with remaining live gaps recorded (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-e2bf1762",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-05T23:36:25.429Z",
  "updatedAt": "2026-09-05T23:46:04.533Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Implement remaining Meta workflows in documented batches beginning with isolated durable report evidence and shared history retrieval",
  "goal": "Implement remaining Meta workflows in documented batches beginning with isolated durable report evidence and shared history retrieval",
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
      "Record remaining batch scope and preserve architecture boundaries before coding",
      "Reports can be saved and retrieved with exact project environment account binding and corruption checks",
      "CLI MCP and console expose shared history contracts without provider credentials or independent business rules",
      "Focused tests types builds and interface verification prove implemented batches with remaining live gaps recorded"
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
    "baselineId": "baseline-911967c3de495bee"
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
      "detail": "Carry out \"Implement remaining Meta workflows in documented batches beginning with isolated durable report evidence and shared history retrieval\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Record remaining batch scope and preserve architecture boundaries before coding",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Reports can be saved and retrieved with exact project environment account binding and corruption checks",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "CLI MCP and console expose shared history contracts without provider credentials or independent business rules",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused tests types builds and interface verification prove implemented batches with remaining live gaps recorded",
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
        "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
      ],
      "reason": "Keep generated Codex binding assertions aligned with the canonical MCP tool list",
      "actorId": "codex",
      "recordedAt": "2026-09-05T23:40:59.002Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs",
          "digest": "d27b11903beaf7ce08d885592d154df71559a7bb019b6a8f4e191a9cda855b32",
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
    "apps/console/src",
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-meta-capability-implementation-plan.md",
    "packages/growth/pack.manifest.json",
    "packages/growth/src",
    "packages/ops-mcp/src",
    "packages/unisane-ops/src",
    "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
  ]
}
```
<!-- skopos:task-state:end -->
