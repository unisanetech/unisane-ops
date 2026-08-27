---
title: "Task: Correct disposable Unisane Ops extraction hygiene verification and privacy-safe owner-review locators"
status: complete
owner: "codex-unisane-ops-proof-correction"
id: T-20a60a63
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-6c476864c904409c
lastUpdated: 2026-08-09
---

# Task: Correct disposable Unisane Ops extraction hygiene verification and privacy-safe owner-review locators

## Changelog

- `2026-08-09`: Synchronized Task state `complete` from Skopos.

## Goal

Correct disposable Unisane Ops extraction hygiene verification and privacy-safe owner-review locators

## Acceptance

- Proof check recomputes exact candidate HEAD/tree/ref/object inventory and strict no-reflog unreachable hygiene, failing on any drift or residue.
- Committed receipts contain deterministic redacted per-category, per-rule, and subject-type aggregates without raw matched values or sensitive paths.
- A deterministic uncommitted mode-0600 owner-review locator bundle covers every finding with safe candidate locators and is digest-bound and verified by proof check.
- Completed Task T-b222cdbf archive and immutable snapshot remain byte-identical, focused proof passes, strict closure completes, and one local correction commit is produced.

## Non-Goals

- Do not integrate, materialize a final repository, create remotes, push, publish, deploy, activate target Skopos, generate a target lockfile, invent approvals, or start further work.

## Constraints

- Keep the permanent standalone repository-integrity guard separate from disposable extraction/privacy proof hygiene.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: privacy.

## Owned Paths

- `unisane-infrastructure/repository-system/private-audit/unisane-ops/T-b222cdbf`
- `unisane-ops`

## Ownership Expansions

- `2026-08-09T16:49:27.296Z` by `codex-unisane-ops-proof-correction`: `unisane-infrastructure/repository-system/private-audit/unisane-ops/T-b222cdbf` — Reviewer requires detailed extraction, scanner, locator, and task-specific proof sources to leave the future public product boundary and remain under Infrastructure-owned private audit control.

## Steps

- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Correct disposable Unisane Ops extraction hygiene verification and privacy-safe owner-review locators" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.
- [x] **Validate the Unisane Ops console** (action, complete) — Required by Guard unisane.ops.console.validate.
- [x] **Validate Unisane Ops growth** (action, complete) — Required by Guard unisane.ops.growth.validate.
- [x] **Validate the Unisane Ops Google provider** (action, complete) — Required by Guard unisane.ops.provider-google.validate.
- [x] **Validate the Unisane Ops Meta provider** (action, complete) — Required by Guard unisane.ops.provider-meta.validate.

## Actions And Guards

- Action `unisane.ops.console.validate`: Required by Guard unisane.ops.console.validate.
- Action `unisane.ops.growth.validate`: Required by Guard unisane.ops.growth.validate.
- Action `unisane.ops.provider-google.validate`: Required by Guard unisane.ops.provider-google.validate.
- Action `unisane.ops.provider-meta.validate`: Required by Guard unisane.ops.provider-meta.validate.
- Guard `unisane.ops.console.validate`
- Guard `unisane.ops.growth.validate`
- Guard `unisane.ops.provider-google.validate`
- Guard `unisane.ops.provider-meta.validate`

## Evidence And Readiness

- Proof check recomputes exact candidate HEAD/tree/ref/object inventory and strict no-reflog unreachable hygiene, failing on any drift or residue. (closure, agent-observation)
- Committed receipts contain deterministic redacted per-category, per-rule, and subject-type aggregates without raw matched values or sensitive paths. (closure, agent-observation)
- A deterministic uncommitted mode-0600 owner-review locator bundle covers every finding with safe candidate locators and is digest-bound and verified by proof check. (closure, agent-observation)
- Completed Task T-b222cdbf archive and immutable snapshot remain byte-identical, focused proof passes, strict closure completes, and one local correction commit is produced. (closure, agent-observation)
- Guard unisane.ops.console.validate: Ops console changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.growth.validate: Ops growth changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.provider-google.validate: Ops Google-provider changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.provider-meta.validate: Ops Meta-provider changes require focused package proof (closure, source-bound-action)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md; review and synchronize it if project truth changes. (target: `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-20a60a63",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-09T16:45:08.629Z",
  "updatedAt": "2026-08-09T17:09:52.740Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Correct disposable Unisane Ops extraction hygiene verification and privacy-safe owner-review locators",
  "goal": "Correct disposable Unisane Ops extraction hygiene verification and privacy-safe owner-review locators",
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
      "Proof check recomputes exact candidate HEAD/tree/ref/object inventory and strict no-reflog unreachable hygiene, failing on any drift or residue.",
      "Committed receipts contain deterministic redacted per-category, per-rule, and subject-type aggregates without raw matched values or sensitive paths.",
      "A deterministic uncommitted mode-0600 owner-review locator bundle covers every finding with safe candidate locators and is digest-bound and verified by proof check.",
      "Completed Task T-b222cdbf archive and immutable snapshot remain byte-identical, focused proof passes, strict closure completes, and one local correction commit is produced."
    ],
    "nonGoals": [
      "Do not integrate, materialize a final repository, create remotes, push, publish, deploy, activate target Skopos, generate a target lockfile, invent approvals, or start further work."
    ],
    "constraints": [
      "Keep the permanent standalone repository-integrity guard separate from disposable extraction/privacy proof hygiene."
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
      "The goal contains high-impact signal: privacy."
    ],
    "signals": {
      "goalSignals": [
        "privacy"
      ],
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
    "baselineId": "baseline-6c476864c904409c"
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
      "detail": "Carry out \"Correct disposable Unisane Ops extraction hygiene verification and privacy-safe owner-review locators\" inside the resolved scope before widening impact to adjacent areas.",
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
    }
  ],
  "selectedActions": [
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
    }
  ],
  "selectedGuardIds": [
    "unisane.ops.console.validate",
    "unisane.ops.growth.validate",
    "unisane.ops.provider-google.validate",
    "unisane.ops.provider-meta.validate"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "Proof check recomputes exact candidate HEAD/tree/ref/object inventory and strict no-reflog unreachable hygiene, failing on any drift or residue.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Committed receipts contain deterministic redacted per-category, per-rule, and subject-type aggregates without raw matched values or sensitive paths.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "A deterministic uncommitted mode-0600 owner-review locator bundle covers every finding with safe candidate locators and is digest-bound and verified by proof check.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Completed Task T-b222cdbf archive and immutable snapshot remain byte-identical, focused proof passes, strict closure completes, and one local correction commit is produced.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
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
      "resolutionReason": "Updated the canonical transition Standard to keep detailed proof outside the public boundary, distinguish durable receipt validation from live disposable verification, document exact generated-output ownership and pnpm setup ordering, and preserve fail-closed owner gates.",
      "resolvedAt": "2026-08-09T17:08:20.650Z",
      "resolvedByActorId": "codex-unisane-ops-proof-correction"
    }
  ],
  "questions": [],
  "recommendations": [
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
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "unisane-infrastructure/repository-system/private-audit/unisane-ops/T-b222cdbf"
      ],
      "reason": "Reviewer requires detailed extraction, scanner, locator, and task-specific proof sources to leave the future public product boundary and remain under Infrastructure-owned private audit control.",
      "actorId": "codex-unisane-ops-proof-correction",
      "recordedAt": "2026-08-09T16:49:27.296Z",
      "baselinePaths": [
        {
          "path": "unisane-infrastructure/repository-system/private-audit/unisane-ops/T-b222cdbf",
          "digest": "ffa63583dfa6706b87d284b86b0d693a161e4840aad2c5cf6b5d27c3b9621f7d"
        }
      ]
    }
  ],
  "declaredOwnedPaths": [
    "unisane-infrastructure/repository-system/private-audit/unisane-ops/T-b222cdbf",
    "unisane-ops"
  ]
}
```
<!-- skopos:task-state:end -->
