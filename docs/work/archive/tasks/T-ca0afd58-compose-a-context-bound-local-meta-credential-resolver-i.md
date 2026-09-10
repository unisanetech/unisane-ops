---
title: "Task: Compose a context-bound local Meta credential resolver into the Ops host"
status: complete
owner: "project"
id: T-ca0afd58
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-fa0e5006c8828532
lastUpdated: 2026-09-02
---

# Task: Compose a context-bound local Meta credential resolver into the Ops host

## Changelog

- `2026-09-02`: Synchronized Task state `complete` from Skopos.

## Goal

Compose a context-bound local Meta credential resolver into the Ops host

## Acceptance

- The ordinary local Growth host supplies Meta discovery and Ads reports through a provider-owned callback without returning credential material
- macOS Keychain lookup is bound to scope, project, connection, credential reference, and version rather than a global token name
- credential bytes are bounded, cleared after use, and rejected if the callback result exposes the secret or credential-shaped fields
- missing, unsupported, mismatched, and denied local credential access fail with bounded errors that include no Keychain output
- Focused tests prove host composition and cross-context credential isolation without reading a real Keychain or calling Meta

## Non-Goals

- Credential provisioning, OAuth/system-user onboarding, live Meta calls, provider mutation, ECOM changes, or hosted KMS deployment

## Constraints

- No secret values in command arguments, config, logs, errors, artifacts, or returned values
- No external provider calls, mutation, commit, or push

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: Declared ownership spans 12 paths.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json`
- `docs/reference/generated/symbols/packages/unisane-ops.symbols.json`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks`
- `packages/provider-meta/src/index.ts`
- `packages/provider-meta/src/meta/credential-execution.ts`
- `packages/provider-meta/src/meta/local-credential-resolver.test.ts`
- `packages/provider-meta/src/meta/local-credential-resolver.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.test.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.ts`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Compose a context-bound local Meta credential resolver into the Ops host" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- The ordinary local Growth host supplies Meta discovery and Ads reports through a provider-owned callback without returning credential material (closure, agent-observation)
- macOS Keychain lookup is bound to scope, project, connection, credential reference, and version rather than a global token name (closure, agent-observation)
- credential bytes are bounded, cleared after use, and rejected if the callback result exposes the secret or credential-shaped fields (closure, agent-observation)
- missing, unsupported, mismatched, and denied local credential access fail with bounded errors that include no Keychain output (closure, agent-observation)
- Focused tests prove host composition and cross-context credential isolation without reading a real Keychain or calling Meta (closure, agent-observation)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-ca0afd58",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-02T08:54:46.606Z",
  "updatedAt": "2026-09-02T09:08:58.626Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Compose a context-bound local Meta credential resolver into the Ops host",
  "goal": "Compose a context-bound local Meta credential resolver into the Ops host",
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
      "The ordinary local Growth host supplies Meta discovery and Ads reports through a provider-owned callback without returning credential material",
      "macOS Keychain lookup is bound to scope, project, connection, credential reference, and version rather than a global token name",
      "credential bytes are bounded, cleared after use, and rejected if the callback result exposes the secret or credential-shaped fields",
      "missing, unsupported, mismatched, and denied local credential access fail with bounded errors that include no Keychain output",
      "Focused tests prove host composition and cross-context credential isolation without reading a real Keychain or calling Meta"
    ],
    "nonGoals": [
      "Credential provisioning, OAuth/system-user onboarding, live Meta calls, provider mutation, ECOM changes, or hosted KMS deployment"
    ],
    "constraints": [
      "No secret values in command arguments, config, logs, errors, artifacts, or returned values",
      "No external provider calls, mutation, commit, or push"
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
      "Declared ownership spans 12 paths."
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
    "baselineId": "baseline-fa0e5006c8828532"
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
      "detail": "Carry out \"Compose a context-bound local Meta credential resolver into the Ops host\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "The ordinary local Growth host supplies Meta discovery and Ads reports through a provider-owned callback without returning credential material",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "macOS Keychain lookup is bound to scope, project, connection, credential reference, and version rather than a global token name",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "credential bytes are bounded, cleared after use, and rejected if the callback result exposes the secret or credential-shaped fields",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "missing, unsupported, mismatched, and denied local credential access fail with bounded errors that include no Keychain output",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Focused tests prove host composition and cross-context credential isolation without reading a real Keychain or calling Meta",
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
      "resolutionReason": "Documented the context-bound local macOS Keychain resolver, callback confinement, and remaining provisioning/hosted boundaries.",
      "resolvedAt": "2026-09-02T09:07:25.437Z",
      "resolvedByActorId": "bhaskarbarma"
    }
  ],
  "questions": [],
  "recommendations": [],
  "declaredOwnedPaths": [
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
    "docs/reference/generated/symbols/packages/unisane-ops.symbols.json",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks",
    "packages/provider-meta/src/index.ts",
    "packages/provider-meta/src/meta/credential-execution.ts",
    "packages/provider-meta/src/meta/local-credential-resolver.test.ts",
    "packages/provider-meta/src/meta/local-credential-resolver.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.ts"
  ]
}
```
<!-- skopos:task-state:end -->
