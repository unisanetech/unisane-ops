---
title: "Task: Reconcile canonical Ops CLI, config, and descriptor behavior on authoritative dev and refresh the preserved local standalone candidate"
status: active
owner: "codex-ops-local-refresh"
id: T-b42b9e0e
scope: "unisane-ops"
role: task
lifecycle: active
authority: canonical
provenance: accepted
view: current
risk: high-impact
proofSubject: project-integration
proofBaseline: baseline-26d0c29b1075892b
lastUpdated: 2026-08-25
---

# Task: Reconcile canonical Ops CLI, config, and descriptor behavior on authoritative dev and refresh the preserved local standalone candidate

## Changelog

- `2026-08-25`: Synchronized Task state `active` from Skopos.

## Goal

Reconcile canonical Ops CLI, config, and descriptor behavior on authoritative dev and refresh the preserved local standalone candidate

## Acceptance

- Only semantic gaps from f7ff3b488 and 405d7e4fb absent from authoritative dev are implemented, with no duplicate or compatibility path.
- The public unisane-ops package, unisane-ops executable, unisane-ops/config export, defineUnisaneProject, defineUnisaneOps, and single unisane.config.ts loader contract are focused-proven.
- @unisane/framework-ops remains descriptor-only, validates the canonical V1 contract, and has zero Framework, Compiler, or Devtools package dependencies and no executable bridge.
- The pre-refresh standalone candidate is preserved exactly, the target is refreshed from authoritative Ops source, and focused standalone package and CLI checks pass without remote or registry mutation.
- Umbrella receipt commit(s), candidate commit, proof, and the remaining private-Framework registry blocker are reported exactly.

## Non-Goals

- Do not create compatibility aliases, parallel descriptor or execution contracts, or modify Framework, Compiler, Devtools, Platforms, central migration Plans, remotes, registries, hosted governance, or provider state.

## Constraints

- Use only local source and local Git operations; keep the standalone candidate non-authoritative and preserve its current clean candidate before replacement.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `proof-subject`
- Reason: Project-integration proof always requires strict high-impact work.

## Owned Paths

- `unisane-ops/docs/overview.md`
- `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`
- `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`
- `unisane-ops/packages/framework-ops`
- `unisane-ops/packages/unisane-ops`
- `unisane-ops/scripts/check-package-contents.mjs`
- `unisane-ops/tools/repository/standalone-integrity-policy.json`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Reconcile canonical Ops CLI, config, and descriptor behavior on authoritative dev and refresh the preserved local standalone candidate" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.
- [ ] **Check canonical Unisane core docs** (action, pending) — Required by Guard unisane.docs.check-core.
- [ ] **Check the Platforms current-source disposition ledger** (action, pending) — Required by Guard unisane.platforms-disposition.check.
- [ ] **Check the Unisane repository source boundary** (action, pending) — Required by Guard unisane.repository-source-boundary.check.

## Actions And Guards

- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Action `unisane.platforms-disposition.check`: Required by Guard unisane.platforms-disposition.check.
- Action `unisane.repository-source-boundary.check`: Required by Guard unisane.repository-source-boundary.check.
- Guard `quality.focused-behavior-proof`
- Guard `unisane.docs.check-core`
- Guard `unisane.platforms-disposition.check`
- Guard `unisane.repository-source-boundary.check`

## Evidence And Readiness

- Only semantic gaps from f7ff3b488 and 405d7e4fb absent from authoritative dev are implemented, with no duplicate or compatibility path. (closure, agent-observation)
- The public unisane-ops package, unisane-ops executable, unisane-ops/config export, defineUnisaneProject, defineUnisaneOps, and single unisane.config.ts loader contract are focused-proven. (closure, agent-observation)
- @unisane/framework-ops remains descriptor-only, validates the canonical V1 contract, and has zero Framework, Compiler, or Devtools package dependencies and no executable bridge. (closure, agent-observation)
- The pre-refresh standalone candidate is preserved exactly, the target is refreshed from authoritative Ops source, and focused standalone package and CLI checks pass without remote or registry mutation. (closure, agent-observation)
- Umbrella receipt commit(s), candidate commit, proof, and the remaining private-Framework registry blocker are reported exactly. (closure, agent-observation)
- Guard quality.focused-behavior-proof: Behavior changes require focused proof (closure, agent-observation)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure, source-bound-action)
- Guard unisane.platforms-disposition.check: Platforms topology inputs require an exhaustive disposition ledger (closure, source-bound-action)
- Guard unisane.repository-source-boundary.check: Stable repository sources require source-boundary freshness proof (closure, source-bound-action)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md; review and synchronize it if project truth changes. (target: `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-b42b9e0e",
  "type": "task",
  "status": "active",
  "generatedAt": "2026-08-25T09:36:38.341Z",
  "updatedAt": "2026-08-25T09:59:35.708Z",
  "planIds": [],
  "childTasks": [],
  "state": "active",
  "detail": "detailed",
  "title": "Reconcile canonical Ops CLI, config, and descriptor behavior on authoritative dev and refresh the preserved local standalone candidate",
  "goal": "Reconcile canonical Ops CLI, config, and descriptor behavior on authoritative dev and refresh the preserved local standalone candidate",
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
      "Only semantic gaps from f7ff3b488 and 405d7e4fb absent from authoritative dev are implemented, with no duplicate or compatibility path.",
      "The public unisane-ops package, unisane-ops executable, unisane-ops/config export, defineUnisaneProject, defineUnisaneOps, and single unisane.config.ts loader contract are focused-proven.",
      "@unisane/framework-ops remains descriptor-only, validates the canonical V1 contract, and has zero Framework, Compiler, or Devtools package dependencies and no executable bridge.",
      "The pre-refresh standalone candidate is preserved exactly, the target is refreshed from authoritative Ops source, and focused standalone package and CLI checks pass without remote or registry mutation.",
      "Umbrella receipt commit(s), candidate commit, proof, and the remaining private-Framework registry blocker are reported exactly."
    ],
    "nonGoals": [
      "Do not create compatibility aliases, parallel descriptor or execution contracts, or modify Framework, Compiler, Devtools, Platforms, central migration Plans, remotes, registries, hosted governance, or provider state."
    ],
    "constraints": [
      "Use only local source and local Git operations; keep the standalone candidate non-authoritative and preserve its current clean candidate before replacement."
    ]
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "proof-subject",
    "workflow": "strict",
    "reasons": [
      "Project-integration proof always requires strict high-impact work."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 7,
      "affectedScopeIds": [
        "unisane-ops",
        "workspace"
      ],
      "impactCategories": [
        "docs",
        "scope-source"
      ],
      "proofSubjectKind": "project-integration"
    }
  },
  "proofSubject": {
    "kind": "project-integration",
    "baselineId": "baseline-26d0c29b1075892b"
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
      "detail": "Carry out \"Reconcile canonical Ops CLI, config, and descriptor behavior on authoritative dev and refresh the preserved local standalone candidate\" inside the resolved scope before widening impact to adjacent areas.",
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
      "status": "pending"
    },
    {
      "id": "action-unisane.platforms-disposition.check",
      "kind": "action",
      "title": "Check the Platforms current-source disposition ledger",
      "detail": "Required by Guard unisane.platforms-disposition.check.",
      "status": "pending"
    },
    {
      "id": "action-unisane.repository-source-boundary.check",
      "kind": "action",
      "title": "Check the Unisane repository source boundary",
      "detail": "Required by Guard unisane.repository-source-boundary.check.",
      "status": "pending"
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
        "unisane-ops/docs/overview.md",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.platforms-disposition.check",
      "title": "Check the Platforms current-source disposition ledger",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-platforms-disposition-check.yaml",
      "reason": "Required by Guard unisane.platforms-disposition.check.",
      "matchedPaths": [
        "unisane-ops/packages/framework-ops",
        "unisane-ops/packages/unisane-ops",
        "unisane-ops/docs/overview.md",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/tools/repository/standalone-integrity-policy.json",
        "unisane-ops/scripts/check-package-contents.mjs"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.repository-source-boundary.check",
      "title": "Check the Unisane repository source boundary",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-repository-source-boundary-check.yaml",
      "reason": "Required by Guard unisane.repository-source-boundary.check.",
      "matchedPaths": [
        "unisane-ops/packages/framework-ops",
        "unisane-ops/packages/unisane-ops",
        "unisane-ops/docs/overview.md",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/tools/repository/standalone-integrity-policy.json",
        "unisane-ops/scripts/check-package-contents.mjs"
      ],
      "outputPaths": [],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": [
    "quality.focused-behavior-proof",
    "unisane.docs.check-core",
    "unisane.platforms-disposition.check",
    "unisane.repository-source-boundary.check"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "Only semantic gaps from f7ff3b488 and 405d7e4fb absent from authoritative dev are implemented, with no duplicate or compatibility path.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "The public unisane-ops package, unisane-ops executable, unisane-ops/config export, defineUnisaneProject, defineUnisaneOps, and single unisane.config.ts loader contract are focused-proven.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "@unisane/framework-ops remains descriptor-only, validates the canonical V1 contract, and has zero Framework, Compiler, or Devtools package dependencies and no executable bridge.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "The pre-refresh standalone candidate is preserved exactly, the target is refreshed from authoritative Ops source, and focused standalone package and CLI checks pass without remote or registry mutation.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Umbrella receipt commit(s), candidate commit, proof, and the remaining private-Framework registry blocker are reported exactly.",
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
      "guardIds": [
        "quality.focused-behavior-proof"
      ],
      "evidence": "agent-observation"
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
      "id": "guard-unisane.platforms-disposition.check",
      "acceptanceCriterion": "Guard unisane.platforms-disposition.check: Platforms topology inputs require an exhaustive disposition ledger",
      "phase": "closure",
      "actionIds": [
        "unisane.platforms-disposition.check"
      ],
      "guardIds": [
        "unisane.platforms-disposition.check"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.repository-source-boundary.check",
      "acceptanceCriterion": "Guard unisane.repository-source-boundary.check: Stable repository sources require source-boundary freshness proof",
      "phase": "closure",
      "actionIds": [
        "unisane.repository-source-boundary.check"
      ],
      "guardIds": [
        "unisane.repository-source-boundary.check"
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
      "resolutionReason": "Updated the canonical standalone transition standard for the exact public CLI/config and descriptor-only contract boundary.",
      "resolvedAt": "2026-08-25T09:46:20.957Z",
      "resolvedByActorId": "codex-ops-local-refresh"
    }
  ],
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
      "status": "open"
    },
    {
      "id": "run-unisane.platforms-disposition.check",
      "title": "Check the Platforms current-source disposition ledger",
      "summary": "Required by Guard unisane.platforms-disposition.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.platforms-disposition.check",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.repository-source-boundary.check",
      "title": "Check the Unisane repository source boundary",
      "summary": "Required by Guard unisane.repository-source-boundary.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.repository-source-boundary.check",
      "blocking": false,
      "status": "open"
    }
  ],
  "declaredOwnedPaths": [
    "unisane-ops/docs/overview.md",
    "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
    "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
    "unisane-ops/packages/framework-ops",
    "unisane-ops/packages/unisane-ops",
    "unisane-ops/scripts/check-package-contents.mjs",
    "unisane-ops/tools/repository/standalone-integrity-policy.json"
  ]
}
```
<!-- skopos:task-state:end -->
