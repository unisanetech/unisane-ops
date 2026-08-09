---
title:
  'Task: Eliminate the framework-ops to devtools workspace link through the released
  framework-integration boundary'
status: active
owner: 'codex-integration-reviewer'
id: T-639cf77f
scope: 'unisane-ops'
role: task
lifecycle: active
authority: canonical
provenance: accepted
view: current
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-58e0261d3c327ce3
lastUpdated: 2026-08-09
---

# Task: Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary

## Changelog

- `2026-08-09`: Synchronized Task state `active` from Skopos.

## Goal

Eliminate the framework-ops to devtools workspace link through the released framework-integration
boundary

## Acceptance

- Every authored source, type, and test import from @unisane/devtools uses only
  @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed.
- @unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools
  with no workspace/file/link fallback, alias, shim, or copied source.
- A deterministic package-owned boundary and packed manifest/content/declaration proof passes
  without publishing or mutating registry authority.
- Disposable proof records required root lock and repository-ledger deltas while tracked root
  lockfile and central generated projections remain unchanged.
- Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated
  blockers remain fail closed.

## Non-Goals

- Do not resolve Ops console UI/data-table blockers, materialize the target repo, activate target
  lockfile/Skopos, publish, deploy, or mutate external systems.

## Constraints

- Own only unisane-ops/packages/framework-ops and unique Skopos Task artifacts; do not access or
  modify private audit evidence.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: release.

## Owned Paths

- `docs/reference/generated/repository-separation/unisane-source-boundary.json`
- `docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md`
- `pnpm-lock.yaml`
- `scripts/__tests__/ops-package-boundary.test.mjs`
- `scripts/commands/architecture/ops-package-boundary-check.mjs`
- `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`
- `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`
- `unisane-ops/packages/framework-ops`
- `unisane-ops/tools/repository/standalone-integrity-policy.json`

## Ownership Expansions

- `2026-08-09T20:52:22.434Z` by `codex-integration-reviewer`:
  `docs/reference/generated/repository-separation/unisane-source-boundary.json`,
  `docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md`,
  `pnpm-lock.yaml`, `scripts/__tests__/ops-package-boundary.test.mjs`,
  `scripts/commands/architecture/ops-package-boundary-check.mjs`,
  `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`,
  `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`,
  `unisane-ops/tools/repository/standalone-integrity-policy.json` — Serial integration must
  reconcile the root-owned architecture assertion, test fixture, lock projection, standalone Ops
  blocker policy/receipt, Framework separation ledger, and canonical transition/plan truth after the
  approved package semver cut.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact
      references to confirm the current scope, command surface, and docs entrypoints before editing
      code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Eliminate the
      framework-ops to devtools workspace link through the released framework-integration boundary"
      inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction
      mirrors, and generated project knowledge aligned with the implementation.
- [x] **Check changed Unisane architecture scope** (action, complete) — Required by Guard
      unisane.architecture.check-changed.
- [x] **Check canonical Unisane core docs** (action, complete) — Required by Guard
      unisane.docs.check-core.
- [x] **Check Unisane Ops package architecture** (action, complete) — Required by Guard
      unisane.ops.architecture-check.

## Actions And Guards

- Action `unisane.architecture.check-changed`: Required by Guard unisane.architecture.check-changed.
- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Action `unisane.ops.architecture-check`: Required by Guard unisane.ops.architecture-check.
- Guard `quality.focused-behavior-proof`
- Guard `unisane.architecture.check-changed`
- Guard `unisane.docs.check-core`
- Guard `unisane.ops.architecture-check`

## Evidence And Readiness

- Every authored source, type, and test import from @unisane/devtools uses only
  @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed.
  (closure, agent-observation)
- @unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools
  with no workspace/file/link fallback, alias, shim, or copied source. (closure, agent-observation)
- A deterministic package-owned boundary and packed manifest/content/declaration proof passes
  without publishing or mutating registry authority. (closure, agent-observation)
- Disposable proof records required root lock and repository-ledger deltas while tracked root
  lockfile and central generated projections remain unchanged. (closure, agent-observation)
- Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated
  blockers remain fail closed. (closure, agent-observation)
- Guard quality.focused-behavior-proof: Behavior changes require focused proof (closure,
  agent-observation)
- Guard unisane.architecture.check-changed: Architecture-sensitive changes require changed-scope
  proof (closure, source-bound-action)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure,
  source-bound-action)
- Guard unisane.ops.architecture-check: Unisane Ops structural changes require package-boundary
  proof (closure, source-bound-action)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for
  Scope unisane-ops. (target:
  `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution:
  memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->

```json
{
  "schemaVersion": 1,
  "id": "T-639cf77f",
  "type": "task",
  "status": "active",
  "generatedAt": "2026-08-09T20:20:39.848Z",
  "updatedAt": "2026-08-09T21:08:31.645Z",
  "planIds": [],
  "childTasks": [],
  "state": "active",
  "detail": "detailed",
  "title": "Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary",
  "goal": "Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary",
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
      "Every authored source, type, and test import from @unisane/devtools uses only @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed.",
      "@unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools with no workspace/file/link fallback, alias, shim, or copied source.",
      "A deterministic package-owned boundary and packed manifest/content/declaration proof passes without publishing or mutating registry authority.",
      "Disposable proof records required root lock and repository-ledger deltas while tracked root lockfile and central generated projections remain unchanged.",
      "Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated blockers remain fail closed."
    ],
    "nonGoals": [
      "Do not resolve Ops console UI/data-table blockers, materialize the target repo, activate target lockfile/Skopos, publish, deploy, or mutate external systems."
    ],
    "constraints": [
      "Own only unisane-ops/packages/framework-ops and unique Skopos Task artifacts; do not access or modify private audit evidence."
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
    "reasons": ["The goal contains high-impact signal: release."],
    "signals": {
      "goalSignals": ["release"],
      "ownedPathCount": 1,
      "affectedScopeIds": ["unisane-ops", "workspace"],
      "impactCategories": ["scope-source"],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-58e0261d3c327ce3"
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
      "detail": "Carry out \"Eliminate the framework-ops to devtools workspace link through the released framework-integration boundary\" inside the resolved scope before widening impact to adjacent areas.",
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
      "id": "action-unisane.ops.architecture-check",
      "kind": "action",
      "title": "Check Unisane Ops package architecture",
      "detail": "Required by Guard unisane.ops.architecture-check.",
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
      "matchedPaths": ["scripts/commands/architecture/ops-package-boundary-check.mjs"],
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
        "docs/reference/generated/repository-separation/unisane-source-boundary.json",
        "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.architecture-check",
      "title": "Check Unisane Ops package architecture",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-architecture-check.yaml",
      "reason": "Required by Guard unisane.ops.architecture-check.",
      "matchedPaths": ["scripts/commands/architecture/ops-package-boundary-check.mjs"],
      "outputPaths": [],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": [
    "quality.focused-behavior-proof",
    "unisane.architecture.check-changed",
    "unisane.docs.check-core",
    "unisane.ops.architecture-check"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "Every authored source, type, and test import from @unisane/devtools uses only @unisane/devtools/framework-integration; private paths and undeclared emitted imports fail closed.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "@unisane/framework-ops declares the real authority-backed semver coordinate for @unisane/devtools with no workspace/file/link fallback, alias, shim, or copied source.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "A deterministic package-owned boundary and packed manifest/content/declaration proof passes without publishing or mutating registry authority.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Disposable proof records required root lock and repository-ledger deltas while tracked root lockfile and central generated projections remain unchanged.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Focused typecheck, tests, build, pack, Ops boundary, closure, and diff checks pass; unrelated blockers remain fail closed.",
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
      "id": "guard-unisane.architecture.check-changed",
      "acceptanceCriterion": "Guard unisane.architecture.check-changed: Architecture-sensitive changes require changed-scope proof",
      "phase": "closure",
      "actionIds": ["unisane.architecture.check-changed"],
      "guardIds": ["unisane.architecture.check-changed"],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.docs.check-core",
      "acceptanceCriterion": "Guard unisane.docs.check-core: Project Memory changes require docs proof",
      "phase": "closure",
      "actionIds": ["unisane.docs.check-core"],
      "guardIds": ["unisane.docs.check-core"],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.architecture-check",
      "acceptanceCriterion": "Guard unisane.ops.architecture-check: Unisane Ops structural changes require package-boundary proof",
      "phase": "closure",
      "actionIds": ["unisane.ops.architecture-check"],
      "guardIds": ["unisane.ops.architecture-check"],
      "evidence": "source-bound-action"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-standard-ca03a29925",
      "role": "standard",
      "reason": "High-impact work must review and synchronize the existing standard Memory for Scope unisane-ops.",
      "status": "complete",
      "targetPath": "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
      "resolution": "memory-updated",
      "resolutionReason": "Updated the Ops transition Standard to record the exact admitted @unisane/devtools@0.1.0 framework-integration boundary and the closed workspace-link blocker.",
      "resolvedAt": "2026-08-09T21:08:31.645Z",
      "resolvedByActorId": "codex-integration-reviewer"
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
      "id": "run-unisane.ops.architecture-check",
      "title": "Check Unisane Ops package architecture",
      "summary": "Required by Guard unisane.ops.architecture-check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.architecture-check",
      "blocking": false,
      "status": "complete"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/reference/generated/repository-separation/unisane-source-boundary.json",
        "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
        "pnpm-lock.yaml",
        "scripts/__tests__/ops-package-boundary.test.mjs",
        "scripts/commands/architecture/ops-package-boundary-check.mjs",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/tools/repository/standalone-integrity-policy.json"
      ],
      "reason": "Serial integration must reconcile the root-owned architecture assertion, test fixture, lock projection, standalone Ops blocker policy/receipt, Framework separation ledger, and canonical transition/plan truth after the approved package semver cut.",
      "actorId": "codex-integration-reviewer",
      "recordedAt": "2026-08-09T20:52:22.434Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository-separation/unisane-source-boundary.json",
          "digest": "0eaf184c894384deedadbe8ca22764558210b8ab5670f40905fa56852b58932f"
        },
        {
          "path": "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
          "digest": "17dca5adfb3ab91a610ba5748e30a1cdc4711be741fda75c7a7b27b582b514df"
        },
        {
          "path": "pnpm-lock.yaml",
          "digest": "aa0185994af5dc92b6ae19b6889144d513e5adcc12c5e7ed15e5ba4fff10312a"
        },
        {
          "path": "scripts/__tests__/ops-package-boundary.test.mjs",
          "digest": "e8fa66aa9096b012de7f8a6e973c08c5a2fa838f66233e7adae7b7208b7f6322"
        },
        {
          "path": "scripts/commands/architecture/ops-package-boundary-check.mjs",
          "digest": "6d8ed32abcfaaab95c4b87388323eb048048aa800d7bffdad95bc23cefcbd037"
        },
        {
          "path": "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "751baeb59096c1405686d0cf881851ceecabeacce0b09c47f03ca26a9421c09e"
        },
        {
          "path": "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
          "digest": "3bb7c78804cb99897ae7795a9cf28e2aaf902505de82fa3a03789a079800b676"
        },
        {
          "path": "unisane-ops/tools/repository/standalone-integrity-policy.json",
          "digest": "78f77145f5d705b0f05336a86343a29c5643ccc10a8d33d945ed6d7d4de65dc9"
        }
      ]
    }
  ],
  "declaredOwnedPaths": [
    "docs/reference/generated/repository-separation/unisane-source-boundary.json",
    "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
    "pnpm-lock.yaml",
    "scripts/__tests__/ops-package-boundary.test.mjs",
    "scripts/commands/architecture/ops-package-boundary-check.mjs",
    "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
    "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
    "unisane-ops/packages/framework-ops",
    "unisane-ops/tools/repository/standalone-integrity-policy.json"
  ]
}
```

<!-- skopos:task-state:end -->
