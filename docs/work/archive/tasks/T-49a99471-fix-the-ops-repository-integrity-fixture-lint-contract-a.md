---
title:
  'Task: Fix the Ops repository-integrity fixture lint contract and refresh generated integrity
  evidence'
status: complete
owner: 'codex'
id: T-49a99471
scope: 'unisane-ops'
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-cf597285dc53199f
lastUpdated: 2026-08-14
---

# Task: Fix the Ops repository-integrity fixture lint contract and refresh generated integrity evidence

## Changelog

- `2026-08-14`: Synchronized Task state `complete` from Skopos.

## Goal

Fix the Ops repository-integrity fixture lint contract and refresh generated integrity evidence

## Acceptance

- The repository-integrity fixture passes ESLint without implicit process globals, and focused
  fixture plus generated-integrity checks remain green.

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated
  surface.

## Owned Paths

- `docs/reference/generated/repository-separation/unisane-source-boundary.json`
- `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`
- `unisane-ops/tests/repository-integrity.test.mjs`

## Ownership Expansions

- `2026-08-14T19:59:34.392Z` by `codex`:
  `docs/reference/generated/repository-separation/unisane-source-boundary.json` — The fixture import
  change invalidates the generated umbrella source-boundary receipt, so the owner output must be
  refreshed in the same lint-fix task.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact
      references to confirm the current scope, command surface, and docs entrypoints before editing
      code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Fix the Ops
      repository-integrity fixture lint contract and refresh generated integrity evidence" inside
      the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction
      mirrors, and generated project knowledge aligned with the implementation.
- [x] **Check canonical Unisane core docs** (action, complete) — Required by Guard
      unisane.docs.check-core.

## Actions And Guards

- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Guard `quality.focused-behavior-proof`
- Guard `unisane.docs.check-core`

## Evidence And Readiness

- The repository-integrity fixture passes ESLint without implicit process globals, and focused
  fixture plus generated-integrity checks remain green. (closure, agent-observation)
- Guard quality.focused-behavior-proof: Behavior changes require focused proof (closure,
  agent-observation)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure,
  source-bound-action)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->

```json
{
  "schemaVersion": 1,
  "id": "T-49a99471",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-14T19:58:15.804Z",
  "updatedAt": "2026-08-14T20:02:15.420Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Fix the Ops repository-integrity fixture lint contract and refresh generated integrity evidence",
  "goal": "Fix the Ops repository-integrity fixture lint contract and refresh generated integrity evidence",
  "scope": {
    "query": "unisane-ops",
    "matchedBy": "id",
    "scope": {
      "id": "unisane-ops",
      "kind": "product",
      "title": "Unisane Ops",
      "path": "unisane-ops",
      "aliases": ["ops"],
      "summary": "Unisane Ops (platform-product).",
      "confidence": "high",
      "parent": "workspace",
      "ancestorIds": ["workspace"],
      "profile": "platform-product",
      "memoryRoot": "unisane-ops/docs",
      "codeRoots": ["unisane-ops"],
      "dependsOn": ["workspace"],
      "owners": ["unisane-ops"]
    }
  },
  "contract": {
    "acceptanceCriteria": [
      "The repository-integrity fixture passes ESLint without implicit process globals, and focused fixture plus generated-integrity checks remain green."
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
    "selectionSource": "explicit-override",
    "workflow": "tracked",
    "reasons": [
      "The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 2,
      "affectedScopeIds": ["unisane-ops", "workspace"],
      "impactCategories": ["docs", "scope-source"],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-cf597285dc53199f"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "step-review-current-pattern",
      "kind": "implementation",
      "title": "Review the current pattern in Unisane Ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "complete"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Fix the Ops repository-integrity fixture lint contract and refresh generated integrity evidence\" inside the resolved scope before widening impact to adjacent areas.",
      "status": "complete"
    },
    {
      "id": "step-sync-knowledge",
      "kind": "docs",
      "title": "Sync docs and instruction surfaces if touched",
      "detail": "Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.",
      "status": "complete"
    },
    {
      "id": "action-unisane.docs.check-core",
      "kind": "action",
      "title": "Check canonical Unisane core docs",
      "detail": "Required by Guard unisane.docs.check-core.",
      "status": "complete"
    }
  ],
  "selectedActions": [
    {
      "id": "unisane.docs.check-core",
      "title": "Check canonical Unisane core docs",
      "category": "docs-validator",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-docs-check-core.yaml",
      "reason": "Required by Guard unisane.docs.check-core.",
      "matchedPaths": [
        "docs/reference/generated/repository-separation/unisane-source-boundary.json",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json"
      ],
      "outputPaths": [],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": ["quality.focused-behavior-proof", "unisane.docs.check-core"],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "The repository-integrity fixture passes ESLint without implicit process globals, and focused fixture plus generated-integrity checks remain green.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "guard-quality.focused-behavior-proof",
      "acceptanceCriterion": "Guard quality.focused-behavior-proof: Behavior changes require focused proof",
      "phase": "closure",
      "actionIds": [],
      "guardIds": ["quality.focused-behavior-proof"],
      "evidence": "agent-observation"
    },
    {
      "id": "guard-unisane.docs.check-core",
      "acceptanceCriterion": "Guard unisane.docs.check-core: Project Memory changes require docs proof",
      "phase": "closure",
      "actionIds": ["unisane.docs.check-core"],
      "guardIds": ["unisane.docs.check-core"],
      "evidence": "source-bound-action"
    }
  ],
  "memoryObligations": [],
  "questions": [],
  "recommendations": [
    {
      "id": "run-unisane.docs.check-core",
      "title": "Check canonical Unisane core docs",
      "summary": "Required by Guard unisane.docs.check-core.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.docs.check-core",
      "blocking": false,
      "status": "complete"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": ["docs/reference/generated/repository-separation/unisane-source-boundary.json"],
      "reason": "The fixture import change invalidates the generated umbrella source-boundary receipt, so the owner output must be refreshed in the same lint-fix task.",
      "actorId": "codex",
      "recordedAt": "2026-08-14T19:59:34.392Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository-separation/unisane-source-boundary.json",
          "digest": "0dfc20e10ff85dec6cf79e870c6d041c1b9b9490a68839342140a77dbb281aa1"
        }
      ],
      "classification": "declared-dependency",
      "priorScopeId": "unisane-ops",
      "nextScopeId": "unisane-ops",
      "affectedScopeIds": ["unisane-ops", "workspace"]
    }
  ],
  "declaredOwnedPaths": [
    "docs/reference/generated/repository-separation/unisane-source-boundary.json",
    "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
    "unisane-ops/tests/repository-integrity.test.mjs"
  ]
}
```

<!-- skopos:task-state:end -->
