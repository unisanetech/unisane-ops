---
title: "Task: Extract Google Ads conversion-goal transport from Growth into the Google provider"
status: complete
owner: "codex"
id: T-bfb43ef9
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-2f2ed7f5b464e112
lastUpdated: 2026-09-06
---

# Task: Extract Google Ads conversion-goal transport from Growth into the Google provider

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Extract Google Ads conversion-goal transport from Growth into the Google provider

## Acceptance

- Growth conversion-goal planning and orchestration use a typed provider port with no Google HTTP transport or credential handling
- CLI routes through host credential resolution into provider-google preserving validate-only and explicit live confirmation semantics
- Provider rejects ambiguous resource matches and incomplete mutation receipts; tests build types lint pass and docs identify remaining shared-engine migration

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
- `packages/growth/src/cli/commands/ads/goals/google.ts`
- `packages/growth/src/cli/provider-runtime.ts`
- `packages/growth/src/contracts.ts`
- `packages/growth/src/marketing/goals`
- `packages/growth/src/marketing/index.ts`
- `packages/provider-google/src/google/marketing`
- `packages/unisane-ops/src/runtime-adapters`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Extract Google Ads conversion-goal transport from Growth into the Google provider" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Growth conversion-goal planning and orchestration use a typed provider port with no Google HTTP transport or credential handling (closure, agent-observation)
- CLI routes through host credential resolution into provider-google preserving validate-only and explicit live confirmation semantics (closure, agent-observation)
- Provider rejects ambiguous resource matches and incomplete mutation receipts; tests build types lint pass and docs identify remaining shared-engine migration (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-bfb43ef9",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T15:02:43.354Z",
  "updatedAt": "2026-09-06T15:10:19.523Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Extract Google Ads conversion-goal transport from Growth into the Google provider",
  "goal": "Extract Google Ads conversion-goal transport from Growth into the Google provider",
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
      "Growth conversion-goal planning and orchestration use a typed provider port with no Google HTTP transport or credential handling",
      "CLI routes through host credential resolution into provider-google preserving validate-only and explicit live confirmation semantics",
      "Provider rejects ambiguous resource matches and incomplete mutation receipts; tests build types lint pass and docs identify remaining shared-engine migration"
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
    "baselineId": "baseline-2f2ed7f5b464e112"
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
      "detail": "Carry out \"Extract Google Ads conversion-goal transport from Growth into the Google provider\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Growth conversion-goal planning and orchestration use a typed provider port with no Google HTTP transport or credential handling",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "CLI routes through host credential resolution into provider-google preserving validate-only and explicit live confirmation semantics",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Provider rejects ambiguous resource matches and incomplete mutation receipts; tests build types lint pass and docs identify remaining shared-engine migration",
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
    "packages/growth/src/cli/commands/ads/goals/google.ts",
    "packages/growth/src/cli/provider-runtime.ts",
    "packages/growth/src/contracts.ts",
    "packages/growth/src/marketing/goals",
    "packages/growth/src/marketing/index.ts",
    "packages/provider-google/src/google/marketing",
    "packages/unisane-ops/src/runtime-adapters"
  ]
}
```
<!-- skopos:task-state:end -->
