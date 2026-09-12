---
title: "Task: Complete current Google conversion transport before account connection"
status: complete
owner: "codex-trueresume-measurement"
id: T-7efebfbb
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-b38a002d8d2d7d45
lastUpdated: 2026-09-12
---

# Task: Complete current Google conversion transport before account connection

## Changelog

- `2026-09-12`: Synchronized Task state `complete` from Skopos.

## Goal

Complete current Google conversion transport before account connection

## Acceptance

- Data Manager transport maps confirmed events with consent and stable identity, distinguishes ingestion from attribution, and handles retryable failures with isolated tests.

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
- `packages/web-runtime/package.json`
- `packages/web-runtime/src/conversions`
- `tools/skopos/actions`

## Ownership Expansions

- `2026-09-12T19:40:12.754Z` by `codex-trueresume-measurement`: `docs/standards/13-unisane-ops-product-architecture-baseline.md` — Record the Data Manager runtime boundary and distinction between ingestion receipts and attributed conversions.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete current Google conversion transport before account connection" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Data Manager transport maps confirmed events with consent and stable identity, distinguishes ingestion from attribution, and handles retryable failures with isolated tests. (closure, agent-observation)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope workspace. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-7efebfbb",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-12T18:55:30.945Z",
  "updatedAt": "2026-09-12T19:48:53.860Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Complete current Google conversion transport before account connection",
  "goal": "Complete current Google conversion transport before account connection",
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
      "Data Manager transport maps confirmed events with consent and stable identity, distinguishes ingestion from attribution, and handles retryable failures with isolated tests."
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
    "baselineId": "baseline-b38a002d8d2d7d45"
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
      "detail": "Carry out \"Complete current Google conversion transport before account connection\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Data Manager transport maps confirmed events with consent and stable identity, distinguishes ingestion from attribution, and handles retryable failures with isolated tests.",
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
      "resolutionReason": "Documented Data Manager transport, current consent, outbox reuse and separate ingestion versus attribution evidence.",
      "resolvedAt": "2026-09-12T19:42:17.682Z",
      "resolvedByActorId": "codex-trueresume-measurement"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because new impact categories appeared (docs). Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "high",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-7efebfbb' 'Continue Complete current Google conversion transport before account connection as bounded follow-up work' . --scope 'workspace' --own 'docs/standards/13-unisane-ops-product-architecture-baseline.md' --reason 'The Task may be drifting from its admitted subject because new impact categories appeared (docs).' --actor 'codex-trueresume-measurement'",
      "ownedPaths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because new impact categories appeared (docs).",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md"
      ],
      "reason": "Record the Data Manager runtime boundary and distinction between ingestion receipts and attributed conversions.",
      "actorId": "codex-trueresume-measurement",
      "recordedAt": "2026-09-12T19:40:12.754Z",
      "baselinePaths": [
        {
          "path": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
          "digest": "79ea13a4843388340d7ad5f45e68b1386e526878514d2d0d1f103541203b37d3",
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
    "packages/web-runtime/package.json",
    "packages/web-runtime/src/conversions",
    "tools/skopos/actions"
  ]
}
```
<!-- skopos:task-state:end -->
