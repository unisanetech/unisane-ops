---
title: "Task: Extract Google asset transport and bind asset workflows through the host"
status: complete
owner: "codex"
id: T-625bec71
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-86b33cd0b72bc95e
lastUpdated: 2026-09-06
---

# Task: Extract Google asset transport and bind asset workflows through the host

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Extract Google asset transport and bind asset workflows through the host

## Acceptance

- Growth asset workflows have no Google HTTP fallback and require injected provider implementations
- CLI asset workflows use host-owned credentials and validate selected resources before live dispatch
- Provider rejects incomplete mutation evidence and redacts errors; tests and documentation cover remaining engine migration

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

- `docs/work/plans/unisane-ops-execution-cleanup-audit.md`
- `packages/growth/src/cli/commands/ads/assets`
- `packages/growth/src/cli/provider-runtime.ts`
- `packages/growth/src/contracts.ts`
- `packages/growth/src/marketing/ads`
- `packages/growth/src/marketing/index.ts`
- `packages/provider-google/src/google/marketing`
- `packages/unisane-ops/src/runtime-adapters`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Extract Google asset transport and bind asset workflows through the host" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Growth asset workflows have no Google HTTP fallback and require injected provider implementations (closure, agent-observation)
- CLI asset workflows use host-owned credentials and validate selected resources before live dispatch (closure, agent-observation)
- Provider rejects incomplete mutation evidence and redacts errors; tests and documentation cover remaining engine migration (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-625bec71",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T15:12:55.245Z",
  "updatedAt": "2026-09-06T15:19:39.610Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Extract Google asset transport and bind asset workflows through the host",
  "goal": "Extract Google asset transport and bind asset workflows through the host",
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
      "Growth asset workflows have no Google HTTP fallback and require injected provider implementations",
      "CLI asset workflows use host-owned credentials and validate selected resources before live dispatch",
      "Provider rejects incomplete mutation evidence and redacts errors; tests and documentation cover remaining engine migration"
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
    "baselineId": "baseline-86b33cd0b72bc95e"
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
      "detail": "Carry out \"Extract Google asset transport and bind asset workflows through the host\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Growth asset workflows have no Google HTTP fallback and require injected provider implementations",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "CLI asset workflows use host-owned credentials and validate selected resources before live dispatch",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Provider rejects incomplete mutation evidence and redacts errors; tests and documentation cover remaining engine migration",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
  "questions": [],
  "recommendations": [],
  "declaredOwnedPaths": [
    "docs/work/plans/unisane-ops-execution-cleanup-audit.md",
    "packages/growth/src/cli/commands/ads/assets",
    "packages/growth/src/cli/provider-runtime.ts",
    "packages/growth/src/contracts.ts",
    "packages/growth/src/marketing/ads",
    "packages/growth/src/marketing/index.ts",
    "packages/provider-google/src/google/marketing",
    "packages/unisane-ops/src/runtime-adapters"
  ]
}
```
<!-- skopos:task-state:end -->
