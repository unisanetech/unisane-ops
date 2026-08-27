---
title: "Task: Prepare public Ops package and repository metadata without publishing"
status: cancelled
owner: "project"
id: T-324b35fb
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-25d122477fabd059
lastUpdated: 2026-08-27
---

# Task: Prepare public Ops package and repository metadata without publishing

## Changelog

- `2026-08-27`: Synchronized Task state `cancelled` from Skopos.

## Goal

Prepare public Ops package and repository metadata without publishing

## Acceptance

- Public Ops packages declare explicit repository and public-access metadata
- The public repository has an explicit MIT license matching package manifests

## Non-Goals

- None declared.

## Constraints

- Do not publish, push, change repository visibility, or modify registry authority

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.

## Owned Paths

- `LICENSE`
- `docs`
- `package.json`
- `packages`

## Ownership Expansions

- None recorded.

## Steps

- [ ] **Record Task risk and detail before editing** (implementation, pending) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [ ] **Review the current pattern in unisane-ops** (implementation, pending) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [ ] **Implement the smallest scoped change** (implementation, pending) — Carry out "Prepare public Ops package and repository metadata without publishing" inside the resolved scope before widening impact to adjacent areas.
- [ ] **Sync docs and instruction surfaces if touched** (docs, pending) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Public Ops packages declare explicit repository and public-access metadata (closure, agent-observation)
- The public repository has an explicit MIT license matching package manifests (closure, agent-observation)

## Memory Obligations

- [open] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md`)
- [open] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md`)
- [open] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md`)
- [open] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md`)
- [open] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md`)
- [open] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md`)
- [open] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`)

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-324b35fb",
  "type": "task",
  "status": "active",
  "generatedAt": "2026-08-27T12:40:40.247Z",
  "updatedAt": "2026-08-27T12:43:41.274Z",
  "planIds": [],
  "childTasks": [],
  "state": "cancelled",
  "detail": "standard",
  "title": "Prepare public Ops package and repository metadata without publishing",
  "goal": "Prepare public Ops package and repository metadata without publishing",
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
      "Public Ops packages declare explicit repository and public-access metadata",
      "The public repository has an explicit MIT license matching package manifests"
    ],
    "nonGoals": [],
    "constraints": [
      "Do not publish, push, change repository visibility, or modify registry authority"
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
    "baselineId": "baseline-25d122477fabd059"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "step-record-task-risk",
      "kind": "implementation",
      "title": "Record Task risk and detail before editing",
      "detail": "Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.",
      "status": "pending"
    },
    {
      "id": "step-review-current-pattern",
      "kind": "implementation",
      "title": "Review the current pattern in unisane-ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "pending"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Prepare public Ops package and repository metadata without publishing\" inside the resolved scope before widening impact to adjacent areas.",
      "status": "pending"
    },
    {
      "id": "step-sync-knowledge",
      "kind": "docs",
      "title": "Sync docs and instruction surfaces if touched",
      "detail": "Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.",
      "status": "pending"
    }
  ],
  "selectedActions": [],
  "selectedGuardIds": [],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "Public Ops packages declare explicit repository and public-access metadata",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "The public repository has an explicit MIT license matching package manifests",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-decision-341f18b2e8",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md"
    },
    {
      "id": "memory-decision-a11c64f03d",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md"
    },
    {
      "id": "memory-decision-c88570410c",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md"
    },
    {
      "id": "memory-decision-cfb606b23c",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md"
    },
    {
      "id": "memory-decision-d104bbc751",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md"
    },
    {
      "id": "memory-decision-e72ef0e604",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md"
    },
    {
      "id": "memory-standard-2653e0fd89",
      "role": "standard",
      "reason": "The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md"
    }
  ],
  "questions": [],
  "recommendations": [],
  "disposition": {
    "kind": "cancel",
    "reason": "Durable Ops readiness explicitly blocks inventing a repository license and keeps ops-mcp plus hosted-postgresql outside the admitted public package set; replace with a fail-closed metadata task.",
    "actorId": "codex",
    "recordedAt": "2026-08-27T12:43:41.274Z",
    "priorState": "active",
    "nextState": "cancelled"
  },
  "declaredOwnedPaths": [
    "LICENSE",
    "docs",
    "package.json",
    "packages"
  ]
}
```
<!-- skopos:task-state:end -->
