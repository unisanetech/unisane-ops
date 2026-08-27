---
title: "Task: Freeze and converge the authoritative Unisane Ops standalone source boundary without creating a shadow"
status: complete
owner: "codex-unisane-ops-convergence"
id: T-287702f0
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-1e47d5be7a8862f5
lastUpdated: 2026-08-09
---

# Task: Freeze and converge the authoritative Unisane Ops standalone source boundary without creating a shadow

## Changelog

- `2026-08-09`: Synchronized Task state `complete` from Skopos.

## Goal

Freeze and converge the authoritative Unisane Ops standalone source boundary without creating a shadow

## Acceptance

- An exact current all-file plus docs/tool/root-config disposition ledger is generated and maintained from the certified source checkpoint.
- AWS and Google provider packages no longer depend on private @unisane/cli-core, with a clean greenfield cutover and no compatibility alias, shim, or fallback.
- Console, Ops MCP, and hosted PostgreSQL package-admission states are recorded from existing authority; unresolved product or legal admissions remain explicit fail-closed owner decisions.
- Only target-owned package/workspace/config/CI declarations, conventional check sources, and reviewed Action/Guard source declarations are staged under unisane-ops/**.
- The umbrella root pnpm-lock.yaml and umbrella Skopos remain the sole pre-cutover authorities; no target pnpm-lock.yaml or independent target Skopos authority is created in umbrella staging.
- Exact history filter/provenance and public-safety scan specifications are defined but not executed.
- The admitted Ops package boundary has no foreign source or workspace edges, or the smallest exact externally owned blocker is reported without consumer cutover.
- Focused package plus Skopos-selected architecture/docs/metadata/workspace proof passes, strict closure produces a current immutable snapshot, and the checkpoint is committed locally.

## Non-Goals

- Do not create or execute a filtered shadow, history rewrite, remote, push, publish, deploy, DNS/provider mutation, credential operation, license invention, consumer cutover, or external repository change.

## Constraints

- Keep the umbrella root pnpm-lock.yaml and umbrella Skopos as the sole pre-cutover install and execution authorities.
- Do not guess public/private package admission, legal, licensing, deployment, provider-state, secret, or public-history decisions.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `light` / `light`
- Selection source: `explicit-override`
- Reason: The work is narrow, local, and has no durable-governance or cross-Scope signal.
- Reason: The caller explicitly selected high-impact; Skopos recommended light and kept both values visible.

## Owned Paths

- `docs/reference/generated/package-metadata`
- `docs/reference/generated/symbols`
- `pnpm-lock.yaml`
- `unisane-ops`
- `unisane-tools/packages/create-unisane/templates/package-metadata-registry.json`

## Ownership Expansions

- `2026-08-09T15:08:00.719Z` by `codex-unisane-ops-convergence`: `pnpm-lock.yaml` — Update the sole umbrella install authority for the admitted removal of provider CLI-core manifest edges; no target lockfile is created.
- `2026-08-09T15:13:47.360Z` by `codex-unisane-ops-convergence`: `docs/reference/generated/package-metadata`, `unisane-tools/packages/create-unisane/templates/package-metadata-registry.json` — Refresh the existing canonical generated metadata projections after the admitted Ops package dependency metadata change; no consumer source or behavior is cut over.
- `2026-08-09T15:24:19.538Z` by `codex-unisane-ops-convergence`: `docs/reference/generated/symbols` — Refresh the existing canonical generated symbol projection for the admitted provider-local output symbols; no handwritten central source is changed.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Freeze and converge the authoritative Unisane Ops standalone source boundary without creating a shadow" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.
- [x] **Check changed Unisane architecture scope** (action, complete) — Required by Guard unisane.architecture.check-changed.
- [x] **Check canonical Unisane core docs** (action, complete) — Required by Guard unisane.docs.check-core.
- [x] **Validate the Unisane Ops console** (action, complete) — Required by Guard unisane.ops.console.validate.
- [x] **Validate Unisane Ops growth** (action, complete) — Required by Guard unisane.ops.growth.validate.
- [x] **Validate the Unisane Ops Google provider** (action, complete) — Required by Guard unisane.ops.provider-google.validate.
- [x] **Validate the Unisane Ops Meta provider** (action, complete) — Required by Guard unisane.ops.provider-meta.validate.
- [x] **Check generated Unisane package metadata** (action, complete) — Required by Guard unisane.packages-meta.check.

## Actions And Guards

- Action `unisane.architecture.check-changed`: Required by Guard unisane.architecture.check-changed.
- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Action `unisane.ops.console.validate`: Required by Guard unisane.ops.console.validate.
- Action `unisane.ops.growth.validate`: Required by Guard unisane.ops.growth.validate.
- Action `unisane.ops.provider-google.validate`: Required by Guard unisane.ops.provider-google.validate.
- Action `unisane.ops.provider-meta.validate`: Required by Guard unisane.ops.provider-meta.validate.
- Action `unisane.packages-meta.check`: Required by Guard unisane.packages-meta.check.
- Guard `unisane.architecture.check-changed`
- Guard `unisane.docs.check-core`
- Guard `unisane.ops.console.validate`
- Guard `unisane.ops.growth.validate`
- Guard `unisane.ops.provider-google.validate`
- Guard `unisane.ops.provider-meta.validate`
- Guard `unisane.packages-meta.check`

## Evidence And Readiness

- An exact current all-file plus docs/tool/root-config disposition ledger is generated and maintained from the certified source checkpoint. (closure, agent-observation)
- AWS and Google provider packages no longer depend on private @unisane/cli-core, with a clean greenfield cutover and no compatibility alias, shim, or fallback. (closure, agent-observation)
- Console, Ops MCP, and hosted PostgreSQL package-admission states are recorded from existing authority; unresolved product or legal admissions remain explicit fail-closed owner decisions. (closure, agent-observation)
- Only target-owned package/workspace/config/CI declarations, conventional check sources, and reviewed Action/Guard source declarations are staged under unisane-ops/**. (closure, agent-observation)
- The umbrella root pnpm-lock.yaml and umbrella Skopos remain the sole pre-cutover authorities; no target pnpm-lock.yaml or independent target Skopos authority is created in umbrella staging. (closure, agent-observation)
- Exact history filter/provenance and public-safety scan specifications are defined but not executed. (closure, agent-observation)
- The admitted Ops package boundary has no foreign source or workspace edges, or the smallest exact externally owned blocker is reported without consumer cutover. (closure, agent-observation)
- Focused package plus Skopos-selected architecture/docs/metadata/workspace proof passes, strict closure produces a current immutable snapshot, and the checkpoint is committed locally. (closure, agent-observation)
- Guard unisane.architecture.check-changed: Architecture-sensitive changes require changed-scope proof (closure, source-bound-action)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure, source-bound-action)
- Guard unisane.ops.console.validate: Ops console changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.growth.validate: Ops growth changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.provider-google.validate: Ops Google-provider changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.provider-meta.validate: Ops Meta-provider changes require focused package proof (closure, source-bound-action)
- Guard unisane.packages-meta.check: Package metadata inputs require freshness proof (closure, source-bound-action)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md; review and synchronize it if project truth changes. (target: `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-287702f0",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-09T14:43:34.364Z",
  "updatedAt": "2026-08-09T16:04:43.038Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Freeze and converge the authoritative Unisane Ops standalone source boundary without creating a shadow",
  "goal": "Freeze and converge the authoritative Unisane Ops standalone source boundary without creating a shadow",
  "scope": {
    "query": "unisane-ops",
    "matchedBy": "id",
    "scope": {
      "id": "unisane-ops",
      "kind": "product",
      "title": "Unisane Ops",
      "path": "unisane-ops",
      "aliases": [
        "ops"
      ],
      "summary": "Unisane Ops (platform-product).",
      "confidence": "high",
      "parent": "workspace",
      "ancestorIds": [
        "workspace"
      ],
      "profile": "platform-product",
      "memoryRoot": "unisane-ops/docs",
      "codeRoots": [
        "unisane-ops"
      ],
      "dependsOn": [
        "workspace"
      ],
      "owners": [
        "unisane-ops"
      ]
    }
  },
  "contract": {
    "acceptanceCriteria": [
      "An exact current all-file plus docs/tool/root-config disposition ledger is generated and maintained from the certified source checkpoint.",
      "AWS and Google provider packages no longer depend on private @unisane/cli-core, with a clean greenfield cutover and no compatibility alias, shim, or fallback.",
      "Console, Ops MCP, and hosted PostgreSQL package-admission states are recorded from existing authority; unresolved product or legal admissions remain explicit fail-closed owner decisions.",
      "Only target-owned package/workspace/config/CI declarations, conventional check sources, and reviewed Action/Guard source declarations are staged under unisane-ops/**.",
      "The umbrella root pnpm-lock.yaml and umbrella Skopos remain the sole pre-cutover authorities; no target pnpm-lock.yaml or independent target Skopos authority is created in umbrella staging.",
      "Exact history filter/provenance and public-safety scan specifications are defined but not executed.",
      "The admitted Ops package boundary has no foreign source or workspace edges, or the smallest exact externally owned blocker is reported without consumer cutover.",
      "Focused package plus Skopos-selected architecture/docs/metadata/workspace proof passes, strict closure produces a current immutable snapshot, and the checkpoint is committed locally."
    ],
    "nonGoals": [
      "Do not create or execute a filtered shadow, history rewrite, remote, push, publish, deploy, DNS/provider mutation, credential operation, license invention, consumer cutover, or external repository change."
    ],
    "constraints": [
      "Keep the umbrella root pnpm-lock.yaml and umbrella Skopos as the sole pre-cutover install and execution authorities.",
      "Do not guess public/private package admission, legal, licensing, deployment, provider-state, secret, or public-history decisions."
    ]
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "light",
    "recommendedDetail": "light",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "explicit-override",
    "workflow": "strict",
    "reasons": [
      "The work is narrow, local, and has no durable-governance or cross-Scope signal.",
      "The caller explicitly selected high-impact; Skopos recommended light and kept both values visible."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 1,
      "affectedScopeIds": [
        "unisane-ops",
        "workspace"
      ],
      "impactCategories": [
        "scope-source"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-1e47d5be7a8862f5"
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
      "detail": "Carry out \"Freeze and converge the authoritative Unisane Ops standalone source boundary without creating a shadow\" inside the resolved scope before widening impact to adjacent areas.",
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
      "id": "action-unisane.architecture.check-changed",
      "kind": "action",
      "title": "Check changed Unisane architecture scope",
      "detail": "Required by Guard unisane.architecture.check-changed.",
      "status": "complete"
    },
    {
      "id": "action-unisane.docs.check-core",
      "kind": "action",
      "title": "Check canonical Unisane core docs",
      "detail": "Required by Guard unisane.docs.check-core.",
      "status": "complete"
    },
    {
      "id": "action-unisane.ops.console.validate",
      "kind": "action",
      "title": "Validate the Unisane Ops console",
      "detail": "Required by Guard unisane.ops.console.validate.",
      "status": "complete"
    },
    {
      "id": "action-unisane.ops.growth.validate",
      "kind": "action",
      "title": "Validate Unisane Ops growth",
      "detail": "Required by Guard unisane.ops.growth.validate.",
      "status": "complete"
    },
    {
      "id": "action-unisane.ops.provider-google.validate",
      "kind": "action",
      "title": "Validate the Unisane Ops Google provider",
      "detail": "Required by Guard unisane.ops.provider-google.validate.",
      "status": "complete"
    },
    {
      "id": "action-unisane.ops.provider-meta.validate",
      "kind": "action",
      "title": "Validate the Unisane Ops Meta provider",
      "detail": "Required by Guard unisane.ops.provider-meta.validate.",
      "status": "complete"
    },
    {
      "id": "action-unisane.packages-meta.check",
      "kind": "action",
      "title": "Check generated Unisane package metadata",
      "detail": "Required by Guard unisane.packages-meta.check.",
      "status": "complete"
    }
  ],
  "selectedActions": [
    {
      "id": "unisane.architecture.check-changed",
      "title": "Check changed Unisane architecture scope",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-architecture-check-changed.yaml",
      "reason": "Required by Guard unisane.architecture.check-changed.",
      "matchedPaths": [
        "unisane-tools/packages/create-unisane/templates/package-metadata-registry.json"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.docs.check-core",
      "title": "Check canonical Unisane core docs",
      "category": "docs-validator",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-docs-check-core.yaml",
      "reason": "Required by Guard unisane.docs.check-core.",
      "matchedPaths": [
        "docs/reference/generated/package-metadata",
        "docs/reference/generated/symbols"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.console.validate",
      "title": "Validate the Unisane Ops console",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-console-validate.yaml",
      "reason": "Required by Guard unisane.ops.console.validate.",
      "matchedPaths": [
        "unisane-ops"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.growth.validate",
      "title": "Validate Unisane Ops growth",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-growth-validate.yaml",
      "reason": "Required by Guard unisane.ops.growth.validate.",
      "matchedPaths": [
        "unisane-ops"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.provider-google.validate",
      "title": "Validate the Unisane Ops Google provider",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-provider-google-validate.yaml",
      "reason": "Required by Guard unisane.ops.provider-google.validate.",
      "matchedPaths": [
        "unisane-ops"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.provider-meta.validate",
      "title": "Validate the Unisane Ops Meta provider",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-provider-meta-validate.yaml",
      "reason": "Required by Guard unisane.ops.provider-meta.validate.",
      "matchedPaths": [
        "unisane-ops"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.packages-meta.check",
      "title": "Check generated Unisane package metadata",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-packages-meta-check.yaml",
      "reason": "Required by Guard unisane.packages-meta.check.",
      "matchedPaths": [
        "unisane-tools/packages/create-unisane/templates/package-metadata-registry.json"
      ],
      "outputPaths": [],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": [
    "unisane.architecture.check-changed",
    "unisane.docs.check-core",
    "unisane.ops.console.validate",
    "unisane.ops.growth.validate",
    "unisane.ops.provider-google.validate",
    "unisane.ops.provider-meta.validate",
    "unisane.packages-meta.check"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "An exact current all-file plus docs/tool/root-config disposition ledger is generated and maintained from the certified source checkpoint.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "AWS and Google provider packages no longer depend on private @unisane/cli-core, with a clean greenfield cutover and no compatibility alias, shim, or fallback.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Console, Ops MCP, and hosted PostgreSQL package-admission states are recorded from existing authority; unresolved product or legal admissions remain explicit fail-closed owner decisions.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Only target-owned package/workspace/config/CI declarations, conventional check sources, and reviewed Action/Guard source declarations are staged under unisane-ops/**.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "The umbrella root pnpm-lock.yaml and umbrella Skopos remain the sole pre-cutover authorities; no target pnpm-lock.yaml or independent target Skopos authority is created in umbrella staging.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-6",
      "acceptanceCriterion": "Exact history filter/provenance and public-safety scan specifications are defined but not executed.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-7",
      "acceptanceCriterion": "The admitted Ops package boundary has no foreign source or workspace edges, or the smallest exact externally owned blocker is reported without consumer cutover.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-8",
      "acceptanceCriterion": "Focused package plus Skopos-selected architecture/docs/metadata/workspace proof passes, strict closure produces a current immutable snapshot, and the checkpoint is committed locally.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "guard-unisane.architecture.check-changed",
      "acceptanceCriterion": "Guard unisane.architecture.check-changed: Architecture-sensitive changes require changed-scope proof",
      "phase": "closure",
      "actionIds": [
        "unisane.architecture.check-changed"
      ],
      "guardIds": [
        "unisane.architecture.check-changed"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.docs.check-core",
      "acceptanceCriterion": "Guard unisane.docs.check-core: Project Memory changes require docs proof",
      "phase": "closure",
      "actionIds": [
        "unisane.docs.check-core"
      ],
      "guardIds": [
        "unisane.docs.check-core"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.console.validate",
      "acceptanceCriterion": "Guard unisane.ops.console.validate: Ops console changes require focused package proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.console.validate"
      ],
      "guardIds": [
        "unisane.ops.console.validate"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.growth.validate",
      "acceptanceCriterion": "Guard unisane.ops.growth.validate: Ops growth changes require focused package proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.growth.validate"
      ],
      "guardIds": [
        "unisane.ops.growth.validate"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.provider-google.validate",
      "acceptanceCriterion": "Guard unisane.ops.provider-google.validate: Ops Google-provider changes require focused package proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.provider-google.validate"
      ],
      "guardIds": [
        "unisane.ops.provider-google.validate"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.provider-meta.validate",
      "acceptanceCriterion": "Guard unisane.ops.provider-meta.validate: Ops Meta-provider changes require focused package proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.provider-meta.validate"
      ],
      "guardIds": [
        "unisane.ops.provider-meta.validate"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.packages-meta.check",
      "acceptanceCriterion": "Guard unisane.packages-meta.check: Package metadata inputs require freshness proof",
      "phase": "closure",
      "actionIds": [
        "unisane.packages-meta.check"
      ],
      "guardIds": [
        "unisane.packages-meta.check"
      ],
      "evidence": "source-bound-action"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-standard-ca03a29925",
      "role": "standard",
      "reason": "The declared Task scope owns canonical standard Memory at unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
      "resolution": "memory-updated",
      "resolutionReason": "Synchronized the canonical readiness Standard with the no-shadow source-convergence checkpoint, exact blocker set, admissions, authority sequencing, and deferred history/public-safety proof.",
      "resolvedAt": "2026-08-09T15:58:03.723Z",
      "resolvedByActorId": "codex-unisane-ops-convergence"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "run-unisane.architecture.check-changed",
      "title": "Check changed Unisane architecture scope",
      "summary": "Required by Guard unisane.architecture.check-changed.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.architecture.check-changed",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.docs.check-core",
      "title": "Check canonical Unisane core docs",
      "summary": "Required by Guard unisane.docs.check-core.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.docs.check-core",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.ops.console.validate",
      "title": "Validate the Unisane Ops console",
      "summary": "Required by Guard unisane.ops.console.validate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.console.validate",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.ops.growth.validate",
      "title": "Validate Unisane Ops growth",
      "summary": "Required by Guard unisane.ops.growth.validate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.growth.validate",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.ops.provider-google.validate",
      "title": "Validate the Unisane Ops Google provider",
      "summary": "Required by Guard unisane.ops.provider-google.validate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.provider-google.validate",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.ops.provider-meta.validate",
      "title": "Validate the Unisane Ops Meta provider",
      "summary": "Required by Guard unisane.ops.provider-meta.validate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.provider-meta.validate",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.packages-meta.check",
      "title": "Check generated Unisane package metadata",
      "summary": "Required by Guard unisane.packages-meta.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.packages-meta.check",
      "blocking": false,
      "status": "complete"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "pnpm-lock.yaml"
      ],
      "reason": "Update the sole umbrella install authority for the admitted removal of provider CLI-core manifest edges; no target lockfile is created.",
      "actorId": "codex-unisane-ops-convergence",
      "recordedAt": "2026-08-09T15:08:00.719Z",
      "baselinePaths": [
        {
          "path": "pnpm-lock.yaml",
          "digest": "f0c27a73181478d64324c10f76d6b3bf87dae4cc063a80368c306f34761b8308"
        }
      ]
    },
    {
      "paths": [
        "docs/reference/generated/package-metadata",
        "unisane-tools/packages/create-unisane/templates/package-metadata-registry.json"
      ],
      "reason": "Refresh the existing canonical generated metadata projections after the admitted Ops package dependency metadata change; no consumer source or behavior is cut over.",
      "actorId": "codex-unisane-ops-convergence",
      "recordedAt": "2026-08-09T15:13:47.360Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/package-metadata",
          "digest": "eba8790e6a6716a832f464522d73d473ecf92d58c302841a44a1cc1de3b2450a"
        },
        {
          "path": "unisane-tools/packages/create-unisane/templates/package-metadata-registry.json",
          "digest": "fe3d984bacb0ea213de1e4f039deaba50c241a51f4dfdaf8413c2e691b5f9461"
        }
      ]
    },
    {
      "paths": [
        "docs/reference/generated/symbols"
      ],
      "reason": "Refresh the existing canonical generated symbol projection for the admitted provider-local output symbols; no handwritten central source is changed.",
      "actorId": "codex-unisane-ops-convergence",
      "recordedAt": "2026-08-09T15:24:19.538Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/symbols",
          "digest": "6b0d230652b450d04c464bed26ad0acfc3dc30fcbe5451485e7c91d7b1d10cb1"
        }
      ]
    }
  ],
  "declaredOwnedPaths": [
    "docs/reference/generated/package-metadata",
    "docs/reference/generated/symbols",
    "pnpm-lock.yaml",
    "unisane-ops",
    "unisane-tools/packages/create-unisane/templates/package-metadata-registry.json"
  ]
}
```
<!-- skopos:task-state:end -->
