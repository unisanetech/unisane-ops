---
title: "Task: Correct the Ops console release-boundary verifier and Skopos manifests fail closed"
status: complete
owner: "codex-ops-ui-boundary-correction"
id: T-d1957f58
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-15d838e7174a907d
lastUpdated: 2026-08-11
---

# Task: Correct the Ops console release-boundary verifier and Skopos manifests fail closed

## Changelog

- `2026-08-11`: Synchronized Task state `complete` from Skopos.

## Goal

Correct the Ops console release-boundary verifier and Skopos manifests fail closed

## Acceptance

- The Ops console release-boundary Action and Guard parse under the installed strict schemas, select for their owned paths, and bind source-bound Action evidence.
- Emitted proof requires the exact policy-owned Material Symbols font-family block and resolving font source; unrelated font proof and missing main.css fail.
- All seven RB01 through RB07 blockers and conversionReady=false remain exact with dependency coordinates, lockfiles, registry, legal, publication, and conversion authority unchanged.
- Focused boundary fixtures, repository integrity, Ops architecture, console type/build/tests, docs, formatting, and immutable Skopos closure pass.

## Non-Goals

- Do not modify dependency coordinates, lockfiles, registry authority, legal state, publication authority, consumer conversion, UI source, private audit, remotes, or external state.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: release.

## Owned Paths

- `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`
- `unisane-ops/scripts/check-console-release-boundary.mjs`
- `unisane-ops/tests/console-release-boundary.test.mjs`
- `unisane-ops/tools/repository/console-release-boundary-policy.json`
- `unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml`
- `unisane-ops/tools/skopos/actions/repository-integrity-check.yaml`
- `unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml`
- `unisane-ops/tools/skopos/guards/repository-integrity-check.yaml`

## Ownership Expansions

- `2026-08-11T17:41:50.248Z` by `codex-ops-ui-boundary-correction`: `unisane-ops/tools/skopos/actions/repository-integrity-check.yaml`, `unisane-ops/tools/skopos/guards/repository-integrity-check.yaml` — The current target loader parses the complete Ops-local manifest catalog before selecting the requested Action; these two pre-existing obsolete manifests must be schema-correct for the required parse and selection proof.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Correct the Ops console release-boundary verifier and Skopos manifests fail closed" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.
- [x] **Check canonical Unisane core docs** (action, complete) — Required by Guard unisane.docs.check-core.

## Actions And Guards

- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Guard `quality.focused-behavior-proof`
- Guard `unisane.docs.check-core`

## Evidence And Readiness

- The Ops console release-boundary Action and Guard parse under the installed strict schemas, select for their owned paths, and bind source-bound Action evidence. (closure, agent-observation)
- Emitted proof requires the exact policy-owned Material Symbols font-family block and resolving font source; unrelated font proof and missing main.css fail. (closure, agent-observation)
- All seven RB01 through RB07 blockers and conversionReady=false remain exact with dependency coordinates, lockfiles, registry, legal, publication, and conversion authority unchanged. (closure, agent-observation)
- Focused boundary fixtures, repository integrity, Ops architecture, console type/build/tests, docs, formatting, and immutable Skopos closure pass. (closure, agent-observation)
- Guard quality.focused-behavior-proof: Behavior changes require focused proof (closure, agent-observation)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure, source-bound-action)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope unisane-ops. (target: `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution: reviewed-no-change

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-d1957f58",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-11T17:39:04.517Z",
  "updatedAt": "2026-08-11T17:48:00.399Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Correct the Ops console release-boundary verifier and Skopos manifests fail closed",
  "goal": "Correct the Ops console release-boundary verifier and Skopos manifests fail closed",
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
      "The Ops console release-boundary Action and Guard parse under the installed strict schemas, select for their owned paths, and bind source-bound Action evidence.",
      "Emitted proof requires the exact policy-owned Material Symbols font-family block and resolving font source; unrelated font proof and missing main.css fail.",
      "All seven RB01 through RB07 blockers and conversionReady=false remain exact with dependency coordinates, lockfiles, registry, legal, publication, and conversion authority unchanged.",
      "Focused boundary fixtures, repository integrity, Ops architecture, console type/build/tests, docs, formatting, and immutable Skopos closure pass."
    ],
    "nonGoals": [
      "Do not modify dependency coordinates, lockfiles, registry authority, legal state, publication authority, consumer conversion, UI source, private audit, remotes, or external state."
    ],
    "constraints": []
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
      "The goal contains high-impact signal: release."
    ],
    "signals": {
      "goalSignals": [
        "release"
      ],
      "ownedPathCount": 6,
      "affectedScopeIds": [
        "unisane-ops",
        "workspace"
      ],
      "impactCategories": [
        "docs",
        "scope-source"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-15d838e7174a907d"
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
      "detail": "Carry out \"Correct the Ops console release-boundary verifier and Skopos manifests fail closed\" inside the resolved scope before widening impact to adjacent areas.",
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
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json"
      ],
      "outputPaths": [],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": [
    "quality.focused-behavior-proof",
    "unisane.docs.check-core"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "The Ops console release-boundary Action and Guard parse under the installed strict schemas, select for their owned paths, and bind source-bound Action evidence.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Emitted proof requires the exact policy-owned Material Symbols font-family block and resolving font source; unrelated font proof and missing main.css fail.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "All seven RB01 through RB07 blockers and conversionReady=false remain exact with dependency coordinates, lockfiles, registry, legal, publication, and conversion authority unchanged.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused boundary fixtures, repository integrity, Ops architecture, console type/build/tests, docs, formatting, and immutable Skopos closure pass.",
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
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-standard-ca03a29925",
      "role": "standard",
      "reason": "High-impact work must review and synchronize the existing standard Memory for Scope unisane-ops.",
      "status": "complete",
      "targetPath": "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "The correction enforces the Standard existing fail-closed Material Symbols asset and exact-blocker contract; it changes proof implementation and staged manifest validity without changing durable project truth.",
      "resolvedAt": "2026-08-11T17:46:13.167Z",
      "resolvedByActorId": "codex-ops-ui-boundary-correction"
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
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "unisane-ops/tools/skopos/actions/repository-integrity-check.yaml",
        "unisane-ops/tools/skopos/guards/repository-integrity-check.yaml"
      ],
      "reason": "The current target loader parses the complete Ops-local manifest catalog before selecting the requested Action; these two pre-existing obsolete manifests must be schema-correct for the required parse and selection proof.",
      "actorId": "codex-ops-ui-boundary-correction",
      "recordedAt": "2026-08-11T17:41:50.248Z",
      "baselinePaths": [
        {
          "path": "unisane-ops/tools/skopos/actions/repository-integrity-check.yaml",
          "digest": "7c2582b187a75dcef5a1bf5c34c506749e20d91d8df6ce8f35e82ae8b3c26976"
        },
        {
          "path": "unisane-ops/tools/skopos/guards/repository-integrity-check.yaml",
          "digest": "cf045aaea6c9160b8a3c621b151cb2f1acda0ca4ee90b407260c535d83797805"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "unisane-ops",
      "nextScopeId": "unisane-ops",
      "affectedScopeIds": [
        "unisane-ops"
      ]
    }
  ],
  "declaredOwnedPaths": [
    "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
    "unisane-ops/scripts/check-console-release-boundary.mjs",
    "unisane-ops/tests/console-release-boundary.test.mjs",
    "unisane-ops/tools/repository/console-release-boundary-policy.json",
    "unisane-ops/tools/skopos/actions/console-release-boundary-check.yaml",
    "unisane-ops/tools/skopos/actions/repository-integrity-check.yaml",
    "unisane-ops/tools/skopos/guards/console-release-boundary-check.yaml",
    "unisane-ops/tools/skopos/guards/repository-integrity-check.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
