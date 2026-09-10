---
title: "Task: Deliver account-aware Meta capability discovery through one Growth action and CLI MCP console adapters"
status: complete
owner: "codex"
id: T-57103658
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-018664cf0a816955
lastUpdated: 2026-09-05
---

# Task: Deliver account-aware Meta capability discovery through one Growth action and CLI MCP console adapters

## Changelog

- `2026-09-05`: Synchronized Task state `complete` from Skopos.

## Goal

Deliver account-aware Meta capability discovery through one Growth action and CLI MCP console adapters

## Acceptance

- Plan records owner files contracts and tests before implementation
- Shared offline action evaluates exact project environment connection freshness grants selected resources and actual host support without granting mutation authority
- CLI MCP and console consume the same typed result; target mismatch and missing host support fail closed
- Focused unit integration and presentation tests plus affected typechecks and builds pass

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: Declared ownership spans 12 paths.
- Reason: The caller explicitly selected standard; Skopos recommended high-impact and kept both values visible.

## Owned Paths

- `apps/console/package.json`
- `apps/console/src`
- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `docs/work/plans/unisane-ops-meta-capability-implementation-plan.md`
- `packages/growth/pack.manifest.json`
- `packages/growth/src/actions`
- `packages/growth/src/capabilities`
- `packages/growth/src/cli`
- `packages/growth/src/console`
- `packages/growth/src/contracts.ts`
- `packages/ops-mcp/src`
- `packages/unisane-ops/src/mcp`
- `packages/unisane-ops/src/runtime-adapters`
- `pnpm-lock.yaml`

## Ownership Expansions

- `2026-09-05T19:39:11.548Z` by `codex`: `apps/console/package.json`, `pnpm-lock.yaml` — Resolve unavailable pinned UI artifacts using published compatible releases and verify console.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Deliver account-aware Meta capability discovery through one Growth action and CLI MCP console adapters" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Plan records owner files contracts and tests before implementation (closure, agent-observation)
- Shared offline action evaluates exact project environment connection freshness grants selected resources and actual host support without granting mutation authority (closure, agent-observation)
- CLI MCP and console consume the same typed result; target mismatch and missing host support fail closed (closure, agent-observation)
- Focused unit integration and presentation tests plus affected typechecks and builds pass (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-57103658",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-05T19:24:27.656Z",
  "updatedAt": "2026-09-05T19:43:37.575Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Deliver account-aware Meta capability discovery through one Growth action and CLI MCP console adapters",
  "goal": "Deliver account-aware Meta capability discovery through one Growth action and CLI MCP console adapters",
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
      "Plan records owner files contracts and tests before implementation",
      "Shared offline action evaluates exact project environment connection freshness grants selected resources and actual host support without granting mutation authority",
      "CLI MCP and console consume the same typed result; target mismatch and missing host support fail closed",
      "Focused unit integration and presentation tests plus affected typechecks and builds pass"
    ],
    "nonGoals": [],
    "constraints": []
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
      "Declared ownership spans 12 paths.",
      "The caller explicitly selected standard; Skopos recommended high-impact and kept both values visible."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 12,
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
    "baselineId": "baseline-018664cf0a816955"
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
      "detail": "Carry out \"Deliver account-aware Meta capability discovery through one Growth action and CLI MCP console adapters\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Plan records owner files contracts and tests before implementation",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Shared offline action evaluates exact project environment connection freshness grants selected resources and actual host support without granting mutation authority",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "CLI MCP and console consume the same typed result; target mismatch and missing host support fail closed",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused unit integration and presentation tests plus affected typechecks and builds pass",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
  "questions": [],
  "recommendations": [],
  "disposition": {
    "kind": "resume",
    "reason": "User requested next; published UI 0.1.1 exposes console components. Validate replacing unavailable prerelease pins and finish console verification.",
    "actorId": "codex",
    "recordedAt": "2026-09-05T19:39:10.220Z",
    "priorState": "deferred",
    "nextState": "active"
  },
  "ownershipExpansions": [
    {
      "paths": [
        "apps/console/package.json",
        "pnpm-lock.yaml"
      ],
      "reason": "Resolve unavailable pinned UI artifacts using published compatible releases and verify console.",
      "actorId": "codex",
      "recordedAt": "2026-09-05T19:39:11.548Z",
      "baselinePaths": [
        {
          "path": "apps/console/package.json",
          "digest": "b5943f1b73ab40dc440fea4166fd98d102f0f0e1c82d4d4c6516a595f141ee1b",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "pnpm-lock.yaml",
          "digest": "38c287099c8afb858f7dcfa6a98b3133c9d8e080977a664b5441812b8e404a9d",
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
    "apps/console/package.json",
    "apps/console/src",
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-meta-capability-implementation-plan.md",
    "packages/growth/pack.manifest.json",
    "packages/growth/src/actions",
    "packages/growth/src/capabilities",
    "packages/growth/src/cli",
    "packages/growth/src/console",
    "packages/growth/src/contracts.ts",
    "packages/ops-mcp/src",
    "packages/unisane-ops/src/mcp",
    "packages/unisane-ops/src/runtime-adapters",
    "pnpm-lock.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
