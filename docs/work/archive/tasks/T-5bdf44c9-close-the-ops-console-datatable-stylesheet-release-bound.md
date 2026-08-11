---
title: 'Task: Close the Ops console DataTable stylesheet release-boundary blocker'
status: complete
owner: 'codex-ops-data-table-stylesheet'
id: T-5bdf44c9
scope: 'unisane-ops'
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-fa8b4c4e4bdc0b5c
lastUpdated: 2026-08-11
---

# Task: Close the Ops console DataTable stylesheet release-boundary blocker

## Changelog

- `2026-08-11`: Synchronized Task state `complete` from Skopos.

## Goal

Close the Ops console DataTable stylesheet release-boundary blocker

## Acceptance

- The canonical console browser composition root imports @unisane/data-table/styles.css exactly once
  after Material Symbols and UI base styles.
- The permanent source and emitted verifier proves exact stylesheet order, DataTable CSS inclusion,
  closed emitted CSS/assets, exact Material Symbols assets, zero private or sibling source escapes,
  and unchanged React singleton facts.
- The active console blocker set is exactly RB01, RB02, RB04, RB05, RB06, and RB07; RB03 is closed
  and conversionReady remains false.
- @unisane/ui and @unisane/data-table remain workspace:\* with no lockfile, registry, publication,
  legal, authority, Node-floor, external-consumer, target Skopos, or materialization change.
- Focused console boundary tests, console types/tests/build, repository integrity, Ops architecture,
  docs/formatting, and the six-blocker root repository-separation check pass.
- The Ops integrity receipt is regenerated only through its deterministic owner and the Task closes
  with immutable source-bound Evidence.

## Non-Goals

- Do not convert package coordinates, regenerate any lockfile, publish, access a registry or remote,
  materialize a repository, activate target Skopos, or change external systems.

## Constraints

- Own only the listed unisane-ops paths and uniquely generated Task archive/snapshot; do not edit
  root projections or private audit.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: release.

## Owned Paths

- `unisane-ops/apps/console/src/browser/main.tsx`
- `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`
- `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`
- `unisane-ops/scripts/check-console-release-boundary.mjs`
- `unisane-ops/tests/console-release-boundary.test.mjs`
- `unisane-ops/tools/repository/console-release-boundary-policy.json`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact
      references to confirm the current scope, command surface, and docs entrypoints before editing
      code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Close the Ops
      console DataTable stylesheet release-boundary blocker" inside the resolved scope before
      widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction
      mirrors, and generated project knowledge aligned with the implementation.
- [x] **Check canonical Unisane core docs** (action, complete) — Required by Guard
      unisane.docs.check-core.
- [x] **Check Unisane Ops package architecture** (action, complete) — Required by Guard
      unisane.ops.architecture-check.
- [x] **Validate the Unisane Ops console** (action, complete) — Required by Guard
      unisane.ops.console.validate.
- [x] **Check the Unisane symbol reference** (action, complete) — Required by Guard
      unisane.symbol-reference.check.
- [x] **Verify packed UI producer artifacts** (action, complete) — Required by Guard
      unisane.ui.packed-producer-certificate.
- [x] **Typecheck the Unisane workspace** (action, complete) — Required by Guard quality.typecheck.

## Actions And Guards

- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Action `unisane.ops.architecture-check`: Required by Guard unisane.ops.architecture-check.
- Action `unisane.ops.console.validate`: Required by Guard unisane.ops.console.validate.
- Action `unisane.symbol-reference.check`: Required by Guard unisane.symbol-reference.check.
- Action `unisane.ui.packed-producer-certificate`: Required by Guard
  unisane.ui.packed-producer-certificate.
- Action `unisane.workspace.typecheck`: Required by Guard quality.typecheck.
- Guard `quality.focused-behavior-proof`
- Guard `quality.typecheck`
- Guard `unisane.docs.check-core`
- Guard `unisane.ops.architecture-check`
- Guard `unisane.ops.console.validate`
- Guard `unisane.symbol-reference.check`
- Guard `unisane.ui.packed-producer-certificate`

## Evidence And Readiness

- The canonical console browser composition root imports @unisane/data-table/styles.css exactly once
  after Material Symbols and UI base styles. (closure, agent-observation)
- The permanent source and emitted verifier proves exact stylesheet order, DataTable CSS inclusion,
  closed emitted CSS/assets, exact Material Symbols assets, zero private or sibling source escapes,
  and unchanged React singleton facts. (closure, agent-observation)
- The active console blocker set is exactly RB01, RB02, RB04, RB05, RB06, and RB07; RB03 is closed
  and conversionReady remains false. (closure, agent-observation)
- @unisane/ui and @unisane/data-table remain workspace:\* with no lockfile, registry, publication,
  legal, authority, Node-floor, external-consumer, target Skopos, or materialization change.
  (closure, agent-observation)
- Focused console boundary tests, console types/tests/build, repository integrity, Ops architecture,
  docs/formatting, and the six-blocker root repository-separation check pass. (closure,
  agent-observation)
- The Ops integrity receipt is regenerated only through its deterministic owner and the Task closes
  with immutable source-bound Evidence. (closure, agent-observation)
- Guard quality.focused-behavior-proof: Behavior changes require focused proof (closure,
  agent-observation)
- Guard quality.typecheck: High-impact TypeScript changes require workspace type proof (closure,
  source-bound-action)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure,
  source-bound-action)
- Guard unisane.ops.architecture-check: Unisane Ops structural changes require package-boundary
  proof (closure, source-bound-action)
- Guard unisane.ops.console.validate: Ops console changes require focused package proof (closure,
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
  "id": "T-5bdf44c9",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-11T18:25:57.697Z",
  "updatedAt": "2026-08-11T21:50:37.451Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Close the Ops console DataTable stylesheet release-boundary blocker",
  "goal": "Close the Ops console DataTable stylesheet release-boundary blocker",
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
      "The canonical console browser composition root imports @unisane/data-table/styles.css exactly once after Material Symbols and UI base styles.",
      "The permanent source and emitted verifier proves exact stylesheet order, DataTable CSS inclusion, closed emitted CSS/assets, exact Material Symbols assets, zero private or sibling source escapes, and unchanged React singleton facts.",
      "The active console blocker set is exactly RB01, RB02, RB04, RB05, RB06, and RB07; RB03 is closed and conversionReady remains false.",
      "@unisane/ui and @unisane/data-table remain workspace:* with no lockfile, registry, publication, legal, authority, Node-floor, external-consumer, target Skopos, or materialization change.",
      "Focused console boundary tests, console types/tests/build, repository integrity, Ops architecture, docs/formatting, and the six-blocker root repository-separation check pass.",
      "The Ops integrity receipt is regenerated only through its deterministic owner and the Task closes with immutable source-bound Evidence."
    ],
    "nonGoals": [
      "Do not convert package coordinates, regenerate any lockfile, publish, access a registry or remote, materialize a repository, activate target Skopos, or change external systems."
    ],
    "constraints": [
      "Own only the listed unisane-ops paths and uniquely generated Task archive/snapshot; do not edit root projections or private audit."
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
      "ownedPathCount": 6,
      "affectedScopeIds": ["unisane-ops", "workspace"],
      "impactCategories": ["docs", "scope-source"],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-fa8b4c4e4bdc0b5c"
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
      "detail": "Carry out \"Close the Ops console DataTable stylesheet release-boundary blocker\" inside the resolved scope before widening impact to adjacent areas.",
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
    },
    {
      "id": "action-unisane.workspace.typecheck",
      "kind": "action",
      "title": "Typecheck the Unisane workspace",
      "detail": "Required by Guard quality.typecheck.",
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
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json"
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
      "matchedPaths": ["unisane-ops/apps/console/src/browser/main.tsx"],
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
      "matchedPaths": ["unisane-ops/apps/console/src/browser/main.tsx"],
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
      "matchedPaths": ["unisane-ops/apps/console/src/browser/main.tsx"],
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
      "matchedPaths": ["unisane-ops/apps/console/src/browser/main.tsx"],
      "outputPaths": ["unisane-ui/packed-producer-certificate.json"],
      "requiresApproval": false
    },
    {
      "id": "unisane.workspace.typecheck",
      "title": "Typecheck the Unisane workspace",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-workspace-typecheck.yaml",
      "reason": "Required by Guard quality.typecheck.",
      "matchedPaths": ["unisane-ops/apps/console/src/browser/main.tsx"],
      "outputPaths": [],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": [
    "quality.focused-behavior-proof",
    "quality.typecheck",
    "unisane.docs.check-core",
    "unisane.ops.architecture-check",
    "unisane.ops.console.validate",
    "unisane.symbol-reference.check",
    "unisane.ui.packed-producer-certificate"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "The canonical console browser composition root imports @unisane/data-table/styles.css exactly once after Material Symbols and UI base styles.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "The permanent source and emitted verifier proves exact stylesheet order, DataTable CSS inclusion, closed emitted CSS/assets, exact Material Symbols assets, zero private or sibling source escapes, and unchanged React singleton facts.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "The active console blocker set is exactly RB01, RB02, RB04, RB05, RB06, and RB07; RB03 is closed and conversionReady remains false.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "@unisane/ui and @unisane/data-table remain workspace:* with no lockfile, registry, publication, legal, authority, Node-floor, external-consumer, target Skopos, or materialization change.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Focused console boundary tests, console types/tests/build, repository integrity, Ops architecture, docs/formatting, and the six-blocker root repository-separation check pass.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-6",
      "acceptanceCriterion": "The Ops integrity receipt is regenerated only through its deterministic owner and the Task closes with immutable source-bound Evidence.",
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
      "id": "guard-quality.typecheck",
      "acceptanceCriterion": "Guard quality.typecheck: High-impact TypeScript changes require workspace type proof",
      "phase": "closure",
      "actionIds": ["unisane.workspace.typecheck"],
      "guardIds": ["quality.typecheck"],
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
      "resolutionReason": "Updated the canonical Ops transition Standard to record the exact stylesheet composition/bundling closure and the remaining six fail-closed console release blockers.",
      "resolvedAt": "2026-08-11T18:47:51.462Z",
      "resolvedByActorId": "codex-ops-data-table-stylesheet"
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
    },
    {
      "id": "run-unisane.workspace.typecheck",
      "title": "Typecheck the Unisane workspace",
      "summary": "Required by Guard quality.typecheck.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.workspace.typecheck",
      "blocking": false,
      "status": "complete"
    }
  ],
  "declaredOwnedPaths": [
    "unisane-ops/apps/console/src/browser/main.tsx",
    "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
    "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
    "unisane-ops/scripts/check-console-release-boundary.mjs",
    "unisane-ops/tests/console-release-boundary.test.mjs",
    "unisane-ops/tools/repository/console-release-boundary-policy.json"
  ]
}
```

<!-- skopos:task-state:end -->
