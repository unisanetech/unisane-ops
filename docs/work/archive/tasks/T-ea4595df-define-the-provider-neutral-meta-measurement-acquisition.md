---
title: "Task: Define the provider-neutral Meta measurement acquisition, reconciliation, diagnostics, and console roadmap for Unisane Ops Growth"
status: complete
owner: "bhaskarbarma"
id: T-ea4595df
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-93e4de33b097cc2b
lastUpdated: 2026-08-31
---

# Task: Define the provider-neutral Meta measurement acquisition, reconciliation, diagnostics, and console roadmap for Unisane Ops Growth

## Changelog

- `2026-08-31`: Synchronized Task state `complete` from Skopos.

## Goal

Define the provider-neutral Meta measurement acquisition, reconciliation, diagnostics, and console roadmap for Unisane Ops Growth

## Acceptance

- A durable roadmap documents Ops/ECOM ownership boundaries, phased capabilities, privacy and credential controls, migrations, test strategy, rollout gates, and a completion checklist.
- The roadmap corrects dual-channel Pixel/CAPI deduplication semantics and keeps canonical outcomes separate from provider-attributed conversions.
- The repository documentation router remains unambiguous and the roadmap is linked from the canonical documentation index.

## Non-Goals

- Implement the Meta connection, provider APIs, ECOM instrumentation, GTM changes, or production mutations in this planning task.

## Constraints

- Unisane Ops must remain product-neutral; ECOM may appear only as an external adopter or redacted test scenario, never as a code dependency or source of Ops-wide truth.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.

## Owned Paths

- `docs/00-start-here.md`
- `docs/guides/true-resume/README.md`
- `docs/operations/true-resume/README.md`
- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`

## Ownership Expansions

- `2026-08-31T18:53:07.035Z` by `bhaskarbarma`: `docs/reference/generated/repository/standalone-repository-integrity.json` — The repository integrity guard requires refreshing its generated index after adding the roadmap and correcting document roles.
- `2026-08-31T18:56:19.218Z` by `bhaskarbarma`: `docs/guides/true-resume/README.md` — Closure verification requires the True Resume operations guide to live in the canonical docs/guides location while docs/00-start-here.md remains the sole workspace router.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Define the provider-neutral Meta measurement acquisition, reconciliation, diagnostics, and console roadmap for Unisane Ops Growth" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- A durable roadmap documents Ops/ECOM ownership boundaries, phased capabilities, privacy and credential controls, migrations, test strategy, rollout gates, and a completion checklist. (closure, agent-observation)
- The roadmap corrects dual-channel Pixel/CAPI deduplication semantics and keeps canonical outcomes separate from provider-attributed conversions. (closure, agent-observation)
- The repository documentation router remains unambiguous and the roadmap is linked from the canonical documentation index. (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-ea4595df",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-31T18:42:47.070Z",
  "updatedAt": "2026-08-31T19:00:01.237Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Define the provider-neutral Meta measurement acquisition, reconciliation, diagnostics, and console roadmap for Unisane Ops Growth",
  "goal": "Define the provider-neutral Meta measurement acquisition, reconciliation, diagnostics, and console roadmap for Unisane Ops Growth",
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
      "A durable roadmap documents Ops/ECOM ownership boundaries, phased capabilities, privacy and credential controls, migrations, test strategy, rollout gates, and a completion checklist.",
      "The roadmap corrects dual-channel Pixel/CAPI deduplication semantics and keeps canonical outcomes separate from provider-attributed conversions.",
      "The repository documentation router remains unambiguous and the roadmap is linked from the canonical documentation index."
    ],
    "nonGoals": [
      "Implement the Meta connection, provider APIs, ECOM instrumentation, GTM changes, or production mutations in this planning task."
    ],
    "constraints": [
      "Unisane Ops must remain product-neutral; ECOM may appear only as an external adopter or redacted test scenario, never as a code dependency or source of Ops-wide truth."
    ]
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
      "ownedPathCount": 3,
      "affectedScopeIds": [
        "workspace"
      ],
      "impactCategories": [
        "docs"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-93e4de33b097cc2b"
  },
  "priority": 80,
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
      "detail": "Carry out \"Define the provider-neutral Meta measurement acquisition, reconciliation, diagnostics, and console roadmap for Unisane Ops Growth\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "A durable roadmap documents Ops/ECOM ownership boundaries, phased capabilities, privacy and credential controls, migrations, test strategy, rollout gates, and a completion checklist.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "The roadmap corrects dual-channel Pixel/CAPI deduplication semantics and keeps canonical outcomes separate from provider-attributed conversions.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "The repository documentation router remains unambiguous and the roadmap is linked from the canonical documentation index.",
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
        "docs/reference/generated/repository/standalone-repository-integrity.json"
      ],
      "reason": "The repository integrity guard requires refreshing its generated index after adding the roadmap and correcting document roles.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T18:53:07.035Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "179fcc262511d848c21a4dd9e7447375631f9ab3233dae10f547b0b18fc0b2cb",
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
        "docs/guides/true-resume/README.md"
      ],
      "reason": "Closure verification requires the True Resume operations guide to live in the canonical docs/guides location while docs/00-start-here.md remains the sole workspace router.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T18:56:19.218Z",
      "baselinePaths": [
        {
          "path": "docs/guides/true-resume/README.md",
          "digest": "c741529fff138771ffe43897f86e2e2b8d499014fabec9dec3d459ae8419bb24",
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
    "docs/00-start-here.md",
    "docs/guides/true-resume/README.md",
    "docs/operations/true-resume/README.md",
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md"
  ]
}
```
<!-- skopos:task-state:end -->
