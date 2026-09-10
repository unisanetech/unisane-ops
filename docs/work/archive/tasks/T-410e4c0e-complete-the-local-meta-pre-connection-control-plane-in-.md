---
title: "Task: Complete the local Meta pre-connection control plane in one batch"
status: complete
owner: "bhaskarbarma"
id: T-410e4c0e
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-86a5788d4cf6bb55
lastUpdated: 2026-09-02
---

# Task: Complete the local Meta pre-connection control plane in one batch

## Changelog

- `2026-09-02`: Synchronized Task state `complete` from Skopos.

## Goal

Complete the local Meta pre-connection control plane in one batch

## Acceptance

- The ordinary Ops pack graph recognizes provider-meta and connect/disconnect/check route through one canonical lifecycle
- Meta system-user credential ingress never accepts token CLI arguments and persists only through a context-bound macOS Keychain writer without putting the secret in process arguments or output
- Connect verifies identity and exact read grants, discovers bounded resources, and requires explicit valid ad-account and Pixel/dataset selections before ready state
- Re-running connect supports deterministic refresh and one-version rotation without cross-project, cross-environment, cross-identity, or stale-record replacement
- Disconnect removes the bound local credential and connection intent while preserving historical measurement evidence and never changing provider resources
- Discovery and Ads reads have bounded timeout, retry-after, retry count, pagination, revocation classification, and redacted errors
- Offline readiness and capability reporting expose what is implemented, fixture-proven, host-blocked, or live-evidence-required without exposing secret references
- Focused and package tests prove the complete pre-connection flow using fake Keychain and mocked Meta transport only

## Non-Goals

- Real Meta authorization, live Graph calls, provider mutation, ECOM changes, GTM publication, hosted KMS deployment, commit, or push

## Constraints

- Do not place credentials in CLI arguments, config, logs, errors, artifacts, returned values, or test fixtures
- Keep ECOM canonical outcomes and tracking emissions outside Unisane Ops ownership

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: Declared ownership spans 14 paths.

## Owned Paths

- `docs/reference/generated`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks`
- `packages/provider-meta`
- `packages/unisane-ops/src/handlers/check.ts`
- `packages/unisane-ops/src/handlers/connect.ts`
- `packages/unisane-ops/src/handlers/disconnect.ts`
- `packages/unisane-ops/src/host.ts`
- `packages/unisane-ops/src/runtime-adapters/cloud-dns.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.test.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.ts`
- `packages/unisane-ops/test`
- `pnpm-lock.yaml`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete the local Meta pre-connection control plane in one batch" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- The ordinary Ops pack graph recognizes provider-meta and connect/disconnect/check route through one canonical lifecycle (closure, agent-observation)
- Meta system-user credential ingress never accepts token CLI arguments and persists only through a context-bound macOS Keychain writer without putting the secret in process arguments or output (closure, agent-observation)
- Connect verifies identity and exact read grants, discovers bounded resources, and requires explicit valid ad-account and Pixel/dataset selections before ready state (closure, agent-observation)
- Re-running connect supports deterministic refresh and one-version rotation without cross-project, cross-environment, cross-identity, or stale-record replacement (closure, agent-observation)
- Disconnect removes the bound local credential and connection intent while preserving historical measurement evidence and never changing provider resources (closure, agent-observation)
- Discovery and Ads reads have bounded timeout, retry-after, retry count, pagination, revocation classification, and redacted errors (closure, agent-observation)
- Offline readiness and capability reporting expose what is implemented, fixture-proven, host-blocked, or live-evidence-required without exposing secret references (closure, agent-observation)
- Focused and package tests prove the complete pre-connection flow using fake Keychain and mocked Meta transport only (closure, agent-observation)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-410e4c0e",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-02T12:14:58.565Z",
  "updatedAt": "2026-09-02T12:59:24.270Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Complete the local Meta pre-connection control plane in one batch",
  "goal": "Complete the local Meta pre-connection control plane in one batch",
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
      "The ordinary Ops pack graph recognizes provider-meta and connect/disconnect/check route through one canonical lifecycle",
      "Meta system-user credential ingress never accepts token CLI arguments and persists only through a context-bound macOS Keychain writer without putting the secret in process arguments or output",
      "Connect verifies identity and exact read grants, discovers bounded resources, and requires explicit valid ad-account and Pixel/dataset selections before ready state",
      "Re-running connect supports deterministic refresh and one-version rotation without cross-project, cross-environment, cross-identity, or stale-record replacement",
      "Disconnect removes the bound local credential and connection intent while preserving historical measurement evidence and never changing provider resources",
      "Discovery and Ads reads have bounded timeout, retry-after, retry count, pagination, revocation classification, and redacted errors",
      "Offline readiness and capability reporting expose what is implemented, fixture-proven, host-blocked, or live-evidence-required without exposing secret references",
      "Focused and package tests prove the complete pre-connection flow using fake Keychain and mocked Meta transport only"
    ],
    "nonGoals": [
      "Real Meta authorization, live Graph calls, provider mutation, ECOM changes, GTM publication, hosted KMS deployment, commit, or push"
    ],
    "constraints": [
      "Do not place credentials in CLI arguments, config, logs, errors, artifacts, returned values, or test fixtures",
      "Keep ECOM canonical outcomes and tracking emissions outside Unisane Ops ownership"
    ]
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "explicit-override",
    "workflow": "strict",
    "reasons": [
      "Declared ownership spans 14 paths."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 14,
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
    "baselineId": "baseline-86a5788d4cf6bb55"
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
      "detail": "Carry out \"Complete the local Meta pre-connection control plane in one batch\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "The ordinary Ops pack graph recognizes provider-meta and connect/disconnect/check route through one canonical lifecycle",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Meta system-user credential ingress never accepts token CLI arguments and persists only through a context-bound macOS Keychain writer without putting the secret in process arguments or output",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Connect verifies identity and exact read grants, discovers bounded resources, and requires explicit valid ad-account and Pixel/dataset selections before ready state",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Re-running connect supports deterministic refresh and one-version rotation without cross-project, cross-environment, cross-identity, or stale-record replacement",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Disconnect removes the bound local credential and connection intent while preserving historical measurement evidence and never changing provider resources",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-6",
      "acceptanceCriterion": "Discovery and Ads reads have bounded timeout, retry-after, retry count, pagination, revocation classification, and redacted errors",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-7",
      "acceptanceCriterion": "Offline readiness and capability reporting expose what is implemented, fixture-proven, host-blocked, or live-evidence-required without exposing secret references",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-8",
      "acceptanceCriterion": "Focused and package tests prove the complete pre-connection flow using fake Keychain and mocked Meta transport only",
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
      "reason": "The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
      "resolution": "memory-updated",
      "resolutionReason": "Updated the architecture baseline with the sealed provider-meta pack, secure local credential lifecycle, bounded discovery, explicit selection, readiness, and capability contract.",
      "resolvedAt": "2026-09-02T12:56:13.883Z",
      "resolvedByActorId": "bhaskarbarma"
    }
  ],
  "questions": [],
  "recommendations": [],
  "declaredOwnedPaths": [
    "docs/reference/generated",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks",
    "packages/provider-meta",
    "packages/unisane-ops/src/handlers/check.ts",
    "packages/unisane-ops/src/handlers/connect.ts",
    "packages/unisane-ops/src/handlers/disconnect.ts",
    "packages/unisane-ops/src/host.ts",
    "packages/unisane-ops/src/runtime-adapters/cloud-dns.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.ts",
    "packages/unisane-ops/test",
    "pnpm-lock.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
