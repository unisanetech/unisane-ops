---
title:
  'Task: Close the authoritative Ops console UI dependency boundary and freeze the next standalone
  Ops candidate input'
status: complete
owner: 'codex'
id: T-e6a0d492
scope: 'unisane-ops'
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-9ef7cdd30adcd37e
lastUpdated: 2026-08-14
---

# Task: Close the authoritative Ops console UI dependency boundary and freeze the next standalone Ops candidate input

## Changelog

- `2026-08-14`: Synchronized Task state `complete` from Skopos.

## Goal

Close the authoritative Ops console UI dependency boundary and freeze the next standalone Ops
candidate input

## Acceptance

- Ops console consumes exact immutable @unisane/ui@0.1.1 and @unisane/data-table@0.1.1 coordinates
  with no workspace, file, link, portal, Git, sibling-source, copied-source, alias, or fallback
  resolution.
- Console release-boundary and standalone-integrity owners report the converted boundary truthfully
  and fail closed on future local-coordinate drift.
- Focused tests, typecheck, browser build, emitted CSS/assets proof, React singleton proof, and a
  clean isolated consumer proof pass against the converted coordinates.
- Ops transition Memory records the closed UI dependency blocker and the exact remaining blockers
  without claiming publication, remote creation, deployment, or authority cutover.

## Non-Goals

- Do not publish packages, create or push a remote, deploy, change visibility, or cut over
  repository authority.

## Constraints

- Use existing canonical policy, generator, and verification owners; do not add fallback paths or a
  second proof workflow.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: Declared ownership spans 12 paths.

## Owned Paths

- `docs/reference/generated/repository-separation/unisane-source-boundary.json`
- `docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md`
- `pnpm-lock.yaml`
- `unisane-infrastructure/repository-system/manifests/unisane-ops.json`
- `unisane-ops/.gitignore`
- `unisane-ops/.npmrc`
- `unisane-ops/apps/console/package.json`
- `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`
- `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`
- `unisane-ops/package.json`
- `unisane-ops/scripts/check-console-external-consumer.mjs`
- `unisane-ops/scripts/check-console-release-boundary.mjs`
- `unisane-ops/scripts/check-repository-integrity.mjs`
- `unisane-ops/tests/console-external-consumer.test.mjs`
- `unisane-ops/tests/console-release-boundary.test.mjs`
- `unisane-ops/tests/repository-integrity.test.mjs`
- `unisane-ops/tools/repository/console-release-boundary-policy.json`
- `unisane-ops/tools/repository/standalone-integrity-policy.json`
- `unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml`
- `unisane-ops/tools/skopos/actions/repository-integrity-check.yaml`
- `unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml`
- `unisane-ops/tools/skopos/guards/repository-integrity-check.yaml`
- `unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs`
- `unisane-ui/scripts/verify-packed-producer-certificate.mjs`

## Ownership Expansions

- `2026-08-14T18:56:03.111Z` by `codex`:
  `unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs`,
  `unisane-ui/scripts/verify-packed-producer-certificate.mjs` — The selected packed-producer
  certificate owns the Ops consumer semantic coordinate contract and must be updated atomically with
  the exact 0.1.1 conversion.
- `2026-08-14T19:01:46.745Z` by `codex`:
  `docs/reference/generated/repository-separation/unisane-source-boundary.json`,
  `docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md`,
  `unisane-infrastructure/repository-system/manifests/unisane-ops.json`, `unisane-ops/package.json`,
  `unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml`,
  `unisane-ops/tools/skopos/actions/repository-integrity-check.yaml`,
  `unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml`,
  `unisane-ops/tools/skopos/guards/repository-integrity-check.yaml` — The conversion changes the
  target verify chain, future target-local Guards, ecosystem transition sequence, repository
  dependency admission, and generated source-boundary truth.
- `2026-08-14T19:30:54.467Z` by `codex`: `unisane-ops/.gitignore`, `unisane-ops/.npmrc` — The
  standalone offline consumer proof must share an explicitly tracked repository-local pnpm store
  contract with the normal standalone install, and that runtime cache must remain ignored.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact
      references to confirm the current scope, command surface, and docs entrypoints before editing
      code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Close the
      authoritative Ops console UI dependency boundary and freeze the next standalone Ops candidate
      input" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction
      mirrors, and generated project knowledge aligned with the implementation.
- [x] **Check changed Unisane architecture scope** (action, complete) — Required by Guard
      unisane.architecture.check-changed.
- [x] **Check canonical Unisane core docs** (action, complete) — Required by Guard
      unisane.docs.check-core.
- [x] **Check Unisane Ops package architecture** (action, complete) — Required by Guard
      unisane.ops.architecture-check.
- [x] **Validate the Unisane Ops console** (action, complete) — Required by Guard
      unisane.ops.console.validate.
- [x] **Check generated Unisane package metadata** (action, complete) — Required by Guard
      unisane.packages-meta.check.
- [x] **Check the Unisane symbol reference** (action, complete) — Required by Guard
      unisane.symbol-reference.check.
- [x] **Verify packed UI producer artifacts** (action, complete) — Required by Guard
      unisane.ui.packed-producer-certificate.

## Actions And Guards

- Action `unisane.architecture.check-changed`: Required by Guard unisane.architecture.check-changed.
- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Action `unisane.ops.architecture-check`: Required by Guard unisane.ops.architecture-check.
- Action `unisane.ops.console.validate`: Required by Guard unisane.ops.console.validate.
- Action `unisane.packages-meta.check`: Required by Guard unisane.packages-meta.check.
- Action `unisane.symbol-reference.check`: Required by Guard unisane.symbol-reference.check.
- Action `unisane.ui.packed-producer-certificate`: Required by Guard
  unisane.ui.packed-producer-certificate.
- Guard `quality.focused-behavior-proof`
- Guard `unisane.architecture.check-changed`
- Guard `unisane.docs.check-core`
- Guard `unisane.ops.architecture-check`
- Guard `unisane.ops.console.validate`
- Guard `unisane.packages-meta.check`
- Guard `unisane.symbol-reference.check`
- Guard `unisane.ui.packed-producer-certificate`

## Evidence And Readiness

- Ops console consumes exact immutable @unisane/ui@0.1.1 and @unisane/data-table@0.1.1 coordinates
  with no workspace, file, link, portal, Git, sibling-source, copied-source, alias, or fallback
  resolution. (closure, agent-observation)
- Console release-boundary and standalone-integrity owners report the converted boundary truthfully
  and fail closed on future local-coordinate drift. (closure, agent-observation)
- Focused tests, typecheck, browser build, emitted CSS/assets proof, React singleton proof, and a
  clean isolated consumer proof pass against the converted coordinates. (closure, agent-observation)
- Ops transition Memory records the closed UI dependency blocker and the exact remaining blockers
  without claiming publication, remote creation, deployment, or authority cutover. (closure,
  agent-observation)
- Guard quality.focused-behavior-proof: Behavior changes require focused proof (closure,
  agent-observation)
- Guard unisane.architecture.check-changed: Architecture-sensitive changes require changed-scope
  proof (closure, source-bound-action)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure,
  source-bound-action)
- Guard unisane.ops.architecture-check: Unisane Ops structural changes require package-boundary
  proof (closure, source-bound-action)
- Guard unisane.ops.console.validate: Ops console changes require focused package proof (closure,
  source-bound-action)
- Guard unisane.packages-meta.check: Package metadata inputs require freshness proof (closure,
  source-bound-action)
- Guard unisane.symbol-reference.check: Symbol reference inputs require freshness proof (closure,
  source-bound-action)
- Guard unisane.ui.packed-producer-certificate: UI producer changes require immutable
  packed-consumer proof (closure, source-bound-action)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at
  unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md; review and
  synchronize it if project truth changes. (target:
  `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution:
  memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->

```json
{
  "schemaVersion": 1,
  "id": "T-e6a0d492",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-14T18:51:57.089Z",
  "updatedAt": "2026-08-14T19:55:36.575Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Close the authoritative Ops console UI dependency boundary and freeze the next standalone Ops candidate input",
  "goal": "Close the authoritative Ops console UI dependency boundary and freeze the next standalone Ops candidate input",
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
      "Ops console consumes exact immutable @unisane/ui@0.1.1 and @unisane/data-table@0.1.1 coordinates with no workspace, file, link, portal, Git, sibling-source, copied-source, alias, or fallback resolution.",
      "Console release-boundary and standalone-integrity owners report the converted boundary truthfully and fail closed on future local-coordinate drift.",
      "Focused tests, typecheck, browser build, emitted CSS/assets proof, React singleton proof, and a clean isolated consumer proof pass against the converted coordinates.",
      "Ops transition Memory records the closed UI dependency blocker and the exact remaining blockers without claiming publication, remote creation, deployment, or authority cutover."
    ],
    "nonGoals": [
      "Do not publish packages, create or push a remote, deploy, change visibility, or cut over repository authority."
    ],
    "constraints": [
      "Use existing canonical policy, generator, and verification owners; do not add fallback paths or a second proof workflow."
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
    "reasons": ["Declared ownership spans 12 paths."],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 12,
      "affectedScopeIds": ["unisane-ops", "workspace"],
      "impactCategories": ["docs", "scope-source", "workspace-file"],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-9ef7cdd30adcd37e"
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
      "detail": "Carry out \"Close the authoritative Ops console UI dependency boundary and freeze the next standalone Ops candidate input\" inside the resolved scope before widening impact to adjacent areas.",
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
    },
    {
      "id": "action-unisane.ops.console.validate",
      "kind": "action",
      "title": "Validate the Unisane Ops console",
      "detail": "Required by Guard unisane.ops.console.validate.",
      "status": "complete"
    },
    {
      "id": "action-unisane.packages-meta.check",
      "kind": "action",
      "title": "Check generated Unisane package metadata",
      "detail": "Required by Guard unisane.packages-meta.check.",
      "status": "complete"
    },
    {
      "id": "action-unisane.symbol-reference.check",
      "kind": "action",
      "title": "Check the Unisane symbol reference",
      "detail": "Required by Guard unisane.symbol-reference.check.",
      "status": "complete"
    },
    {
      "id": "action-unisane.ui.packed-producer-certificate",
      "kind": "action",
      "title": "Verify packed UI producer artifacts",
      "detail": "Required by Guard unisane.ui.packed-producer-certificate.",
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
        "unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs",
        "unisane-ui/scripts/verify-packed-producer-certificate.mjs"
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
      "matchedPaths": ["unisane-ops/apps/console/package.json"],
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
      "matchedPaths": ["unisane-ops/apps/console/package.json"],
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
      "matchedPaths": ["unisane-ops/apps/console/package.json"],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.symbol-reference.check",
      "title": "Check the Unisane symbol reference",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-symbol-reference-check.yaml",
      "reason": "Required by Guard unisane.symbol-reference.check.",
      "matchedPaths": ["unisane-ops/apps/console/package.json"],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ui.packed-producer-certificate",
      "title": "Verify packed UI producer artifacts",
      "category": "quality-check",
      "safety": "mutating",
      "sourcePath": "tools/skopos/actions/unisane-ui-packed-producer-certificate.yaml",
      "reason": "Required by Guard unisane.ui.packed-producer-certificate.",
      "matchedPaths": [
        "unisane-ops/apps/console/package.json",
        "unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs",
        "unisane-ui/scripts/verify-packed-producer-certificate.mjs"
      ],
      "outputPaths": ["unisane-ui/packed-producer-certificate.json"],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": [
    "quality.focused-behavior-proof",
    "unisane.architecture.check-changed",
    "unisane.docs.check-core",
    "unisane.ops.architecture-check",
    "unisane.ops.console.validate",
    "unisane.packages-meta.check",
    "unisane.symbol-reference.check",
    "unisane.ui.packed-producer-certificate"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "Ops console consumes exact immutable @unisane/ui@0.1.1 and @unisane/data-table@0.1.1 coordinates with no workspace, file, link, portal, Git, sibling-source, copied-source, alias, or fallback resolution.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Console release-boundary and standalone-integrity owners report the converted boundary truthfully and fail closed on future local-coordinate drift.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Focused tests, typecheck, browser build, emitted CSS/assets proof, React singleton proof, and a clean isolated consumer proof pass against the converted coordinates.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Ops transition Memory records the closed UI dependency blocker and the exact remaining blockers without claiming publication, remote creation, deployment, or authority cutover.",
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
    },
    {
      "id": "guard-unisane.ops.console.validate",
      "acceptanceCriterion": "Guard unisane.ops.console.validate: Ops console changes require focused package proof",
      "phase": "closure",
      "actionIds": ["unisane.ops.console.validate"],
      "guardIds": ["unisane.ops.console.validate"],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.packages-meta.check",
      "acceptanceCriterion": "Guard unisane.packages-meta.check: Package metadata inputs require freshness proof",
      "phase": "closure",
      "actionIds": ["unisane.packages-meta.check"],
      "guardIds": ["unisane.packages-meta.check"],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.symbol-reference.check",
      "acceptanceCriterion": "Guard unisane.symbol-reference.check: Symbol reference inputs require freshness proof",
      "phase": "closure",
      "actionIds": ["unisane.symbol-reference.check"],
      "guardIds": ["unisane.symbol-reference.check"],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ui.packed-producer-certificate",
      "acceptanceCriterion": "Guard unisane.ui.packed-producer-certificate: UI producer changes require immutable packed-consumer proof",
      "phase": "closure",
      "actionIds": ["unisane.ui.packed-producer-certificate"],
      "guardIds": ["unisane.ui.packed-producer-certificate"],
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
      "resolutionReason": "Updated the canonical Ops transition standard to close only OPS-R03 at the local consumer boundary, document the exact 0.1.1 registry/store proof, and retain publication, remote, deployment, legal, and authority gates.",
      "resolvedAt": "2026-08-14T19:53:35.144Z",
      "resolvedByActorId": "codex"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (package-manifest). Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "high",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-e6a0d492' 'Continue Close the authoritative Ops console UI dependency boundary and freeze the next standalone Ops candidate input as bounded follow-up work' . --scope 'unisane-ops' --own 'docs/reference/generated/repository-separation/unisane-source-boundary.json' --own 'docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md' --own 'unisane-infrastructure/repository-system/manifests/unisane-ops.json' --own 'unisane-ops/.gitignore' --own 'unisane-ops/.npmrc' --own 'unisane-ops/package.json' --own 'unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml' --own 'unisane-ops/tools/skopos/actions/repository-integrity-check.yaml' --own 'unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml' --own 'unisane-ops/tools/skopos/guards/repository-integrity-check.yaml' --own 'unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs' --own 'unisane-ui/scripts/verify-packed-producer-certificate.mjs' --reason 'The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (package-manifest).' --actor 'codex'",
      "ownedPaths": [
        "docs/reference/generated/repository-separation/unisane-source-boundary.json",
        "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
        "unisane-infrastructure/repository-system/manifests/unisane-ops.json",
        "unisane-ops/.gitignore",
        "unisane-ops/.npmrc",
        "unisane-ops/package.json",
        "unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml",
        "unisane-ops/tools/skopos/actions/repository-integrity-check.yaml",
        "unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml",
        "unisane-ops/tools/skopos/guards/repository-integrity-check.yaml",
        "unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs",
        "unisane-ui/scripts/verify-packed-producer-certificate.mjs"
      ],
      "scopeId": "unisane-ops",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (package-manifest).",
      "blocking": false,
      "status": "open"
    },
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
      "id": "run-unisane.packages-meta.check",
      "title": "Check generated Unisane package metadata",
      "summary": "Required by Guard unisane.packages-meta.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.packages-meta.check",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.symbol-reference.check",
      "title": "Check the Unisane symbol reference",
      "summary": "Required by Guard unisane.symbol-reference.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.symbol-reference.check",
      "blocking": false,
      "status": "complete"
    },
    {
      "id": "run-unisane.ui.packed-producer-certificate",
      "title": "Verify packed UI producer artifacts",
      "summary": "Required by Guard unisane.ui.packed-producer-certificate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ui.packed-producer-certificate",
      "blocking": false,
      "status": "complete"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs",
        "unisane-ui/scripts/verify-packed-producer-certificate.mjs"
      ],
      "reason": "The selected packed-producer certificate owns the Ops consumer semantic coordinate contract and must be updated atomically with the exact 0.1.1 conversion.",
      "actorId": "codex",
      "recordedAt": "2026-08-14T18:56:03.111Z",
      "baselinePaths": [
        {
          "path": "unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs",
          "digest": "ab0f834a17c29d303707356a51390745f594bc930b9dc461e722e5c3130bc55b"
        },
        {
          "path": "unisane-ui/scripts/verify-packed-producer-certificate.mjs",
          "digest": "5c6a0c76a1ec164764515dd4f1f563e43d020005c624742e92c7de8a2f8f2d32"
        }
      ],
      "classification": "declared-dependency",
      "priorScopeId": "unisane-ops",
      "nextScopeId": "unisane-ops",
      "affectedScopeIds": ["unisane-ops", "workspace"]
    },
    {
      "paths": [
        "docs/reference/generated/repository-separation/unisane-source-boundary.json",
        "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
        "unisane-infrastructure/repository-system/manifests/unisane-ops.json",
        "unisane-ops/package.json",
        "unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml",
        "unisane-ops/tools/skopos/actions/repository-integrity-check.yaml",
        "unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml",
        "unisane-ops/tools/skopos/guards/repository-integrity-check.yaml"
      ],
      "reason": "The conversion changes the target verify chain, future target-local Guards, ecosystem transition sequence, repository dependency admission, and generated source-boundary truth.",
      "actorId": "codex",
      "recordedAt": "2026-08-14T19:01:46.745Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository-separation/unisane-source-boundary.json",
          "digest": "bee908fc531451f5fc283ed11ac256c4cc46abb61267bbbc67fb3419284e407d"
        },
        {
          "path": "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
          "digest": "80781b2d813b1e5bba9978bfe93122524d06892b37076ef7f7d7aa1586c158a4"
        },
        {
          "path": "unisane-infrastructure/repository-system/manifests/unisane-ops.json",
          "digest": "36965d8e8e35186e179c70e19bcbaf065301482a7e0f4b413628b825d65a6a52"
        },
        {
          "path": "unisane-ops/package.json",
          "digest": "286d3112a325fd4d3aa6624e67ead445ff95f7046bb45b6c20d82f6a544ddb64"
        },
        {
          "path": "unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml",
          "digest": "23116446a777383f298ca39b361364c38ace27cd3b74da1ae432b7453cc4855a"
        },
        {
          "path": "unisane-ops/tools/skopos/actions/repository-integrity-check.yaml",
          "digest": "5005c57224059cce70267aa70064888ebd52656eee155f5c0ddf561150d17cbc"
        },
        {
          "path": "unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml",
          "digest": "933f4a50d25bdd545a5608ae029c4b466ccbbf1b15c5c00731cda81d9e0d5262"
        },
        {
          "path": "unisane-ops/tools/skopos/guards/repository-integrity-check.yaml",
          "digest": "b5636450efb278c052f3c116fe442d0063390015ea1b2cc0cba26cc5a6608859"
        }
      ],
      "classification": "declared-dependency",
      "priorScopeId": "unisane-ops",
      "nextScopeId": "unisane-ops",
      "affectedScopeIds": ["unisane-ops", "workspace"]
    },
    {
      "paths": ["unisane-ops/.gitignore", "unisane-ops/.npmrc"],
      "reason": "The standalone offline consumer proof must share an explicitly tracked repository-local pnpm store contract with the normal standalone install, and that runtime cache must remain ignored.",
      "actorId": "codex",
      "recordedAt": "2026-08-14T19:30:54.467Z",
      "baselinePaths": [
        {
          "path": "unisane-ops/.gitignore",
          "digest": "df0b363bb028ecf6e091b43ed87ed9a3a3c6be35910772c22a0164c3cabbef0c"
        },
        {
          "path": "unisane-ops/.npmrc",
          "digest": "ffa63583dfa6706b87d284b86b0d693a161e4840aad2c5cf6b5d27c3b9621f7d"
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
    "docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md",
    "pnpm-lock.yaml",
    "unisane-infrastructure/repository-system/manifests/unisane-ops.json",
    "unisane-ops/.gitignore",
    "unisane-ops/.npmrc",
    "unisane-ops/apps/console/package.json",
    "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
    "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
    "unisane-ops/package.json",
    "unisane-ops/scripts/check-console-external-consumer.mjs",
    "unisane-ops/scripts/check-console-release-boundary.mjs",
    "unisane-ops/scripts/check-repository-integrity.mjs",
    "unisane-ops/tests/console-external-consumer.test.mjs",
    "unisane-ops/tests/console-release-boundary.test.mjs",
    "unisane-ops/tests/repository-integrity.test.mjs",
    "unisane-ops/tools/repository/console-release-boundary-policy.json",
    "unisane-ops/tools/repository/standalone-integrity-policy.json",
    "unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml",
    "unisane-ops/tools/skopos/actions/repository-integrity-check.yaml",
    "unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml",
    "unisane-ops/tools/skopos/guards/repository-integrity-check.yaml",
    "unisane-ui/scripts/__tests__/verify-packed-producer-certificate.test.mjs",
    "unisane-ui/scripts/verify-packed-producer-certificate.mjs"
  ]
}
```

<!-- skopos:task-state:end -->
