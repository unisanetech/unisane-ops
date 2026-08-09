---
title: "Task: Execute and certify the history-preserving disposable Unisane Ops extraction and public-safety proof without promoting a final repository"
status: complete
owner: "codex-unisane-ops-extraction-proof"
id: T-b222cdbf
scope: "unisane-ops"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-c621b15c62ebe338
lastUpdated: 2026-08-09
---

# Task: Execute and certify the history-preserving disposable Unisane Ops extraction and public-safety proof without promoting a final repository

## Changelog

- `2026-08-09`: Synchronized Task state `complete` from Skopos.

## Goal

Execute and certify the history-preserving disposable Unisane Ops extraction and public-safety proof without promoting a final repository

## Acceptance

- Exact integrated source, freeze checkpoint, filter specification, tool identity, and normalized filter inputs are frozen and receipted.
- The approved 507 lineage mappings and 91 additions are executed in a disposable task-local candidate with a complete source-to-filtered commit map and deterministic digests.
- Current target file content and modes match integrated source exactly and every excluded foreign path is absent.
- Refs, tags, signatures, Git integrity, object inventory, filter metadata, alternates, remotes, reflogs, and unreachable residue are inspected and cleaned in the disposable candidate.
- Every reachable commit, blob, ref, working-tree path, commit message, and contributor identity is scanned under the integrated public-safety specification with only redacted identifiers and digests recorded.
- Unavailable security, legal, license, asset, contributor, scanner-policy, and provider-state owner facts remain explicit fail-closed decisions.
- The exact @unisane/ui, @unisane/data-table, and @unisane/devtools blockers remain open with no guessed versions, copied sibling source, fallback, target lockfile, or target Skopos activation.
- Strict closure and immutable snapshot support a complete review packet and a bounded final-materialization route that requires separate approval.

## Non-Goals

- Create or write the final standalone repository.
- Create a remote, push, publish, deploy, cut over authority, activate target Skopos, or generate a target lockfile.

## Constraints

- Use only a disposable task-local extraction candidate and record suspected safety findings only as redacted identifiers and digests.
- Do not start final materialization before reviewer approval and blocker resolution or an explicitly approved fail-closed materialization contract.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.
- Reason: The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible.

## Owned Paths

- `unisane-infrastructure/repository-system/manifests/unisane-ops.json`
- `unisane-ops`

## Ownership Expansions

- `2026-08-09T16:15:30.186Z` by `codex-unisane-ops-extraction-proof`: `unisane-infrastructure/repository-system/manifests/unisane-ops.json` — Reviewer explicitly requires reconciling the Ops repository-system typecheck declaration with the staged root command during disposable proof.

## Steps

- [x] **Should this plan change a public contract, route, or SDK surface?** (decision, complete) — Public-facing changes need explicit confirmation so the agent does not silently ship a breaking contract.
- [x] **Resolve plan decisions** (implementation, complete) — Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.
- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in Unisane Ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Execute and certify the history-preserving disposable Unisane Ops extraction and public-safety proof without promoting a final repository" inside the resolved scope before widening impact to adjacent areas.
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

- Exact integrated source, freeze checkpoint, filter specification, tool identity, and normalized filter inputs are frozen and receipted. (closure, agent-observation)
- The approved 507 lineage mappings and 91 additions are executed in a disposable task-local candidate with a complete source-to-filtered commit map and deterministic digests. (closure, agent-observation)
- Current target file content and modes match integrated source exactly and every excluded foreign path is absent. (closure, agent-observation)
- Refs, tags, signatures, Git integrity, object inventory, filter metadata, alternates, remotes, reflogs, and unreachable residue are inspected and cleaned in the disposable candidate. (closure, agent-observation)
- Every reachable commit, blob, ref, working-tree path, commit message, and contributor identity is scanned under the integrated public-safety specification with only redacted identifiers and digests recorded. (closure, agent-observation)
- Unavailable security, legal, license, asset, contributor, scanner-policy, and provider-state owner facts remain explicit fail-closed decisions. (closure, agent-observation)
- The exact @unisane/ui, @unisane/data-table, and @unisane/devtools blockers remain open with no guessed versions, copied sibling source, fallback, target lockfile, or target Skopos activation. (closure, agent-observation)
- Strict closure and immutable snapshot support a complete review packet and a bounded final-materialization route that requires separate approval. (closure, agent-observation)
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
  "id": "T-b222cdbf",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-09T16:13:29.417Z",
  "updatedAt": "2026-08-09T16:40:09.704Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Execute and certify the history-preserving disposable Unisane Ops extraction and public-safety proof without promoting a final repository",
  "goal": "Execute and certify the history-preserving disposable Unisane Ops extraction and public-safety proof without promoting a final repository",
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
      "Exact integrated source, freeze checkpoint, filter specification, tool identity, and normalized filter inputs are frozen and receipted.",
      "The approved 507 lineage mappings and 91 additions are executed in a disposable task-local candidate with a complete source-to-filtered commit map and deterministic digests.",
      "Current target file content and modes match integrated source exactly and every excluded foreign path is absent.",
      "Refs, tags, signatures, Git integrity, object inventory, filter metadata, alternates, remotes, reflogs, and unreachable residue are inspected and cleaned in the disposable candidate.",
      "Every reachable commit, blob, ref, working-tree path, commit message, and contributor identity is scanned under the integrated public-safety specification with only redacted identifiers and digests recorded.",
      "Unavailable security, legal, license, asset, contributor, scanner-policy, and provider-state owner facts remain explicit fail-closed decisions.",
      "The exact @unisane/ui, @unisane/data-table, and @unisane/devtools blockers remain open with no guessed versions, copied sibling source, fallback, target lockfile, or target Skopos activation.",
      "Strict closure and immutable snapshot support a complete review packet and a bounded final-materialization route that requires separate approval."
    ],
    "nonGoals": [
      "Create or write the final standalone repository.",
      "Create a remote, push, publish, deploy, cut over authority, activate target Skopos, or generate a target lockfile."
    ],
    "constraints": [
      "Use only a disposable task-local extraction candidate and record suspected safety findings only as redacted identifiers and digests.",
      "Do not start final materialization before reviewer approval and blocker resolution or an explicitly approved fail-closed materialization contract."
    ]
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "standard",
    "recommendedDetail": "standard",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "explicit-override",
    "workflow": "strict",
    "reasons": [
      "The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.",
      "The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible."
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
    "baselineId": "baseline-c621b15c62ebe338"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "decision-plan.public-api-change",
      "kind": "decision",
      "title": "Should this plan change a public contract, route, or SDK surface?",
      "detail": "Public-facing changes need explicit confirmation so the agent does not silently ship a breaking contract.",
      "status": "complete"
    },
    {
      "id": "step-resolve-decisions",
      "kind": "implementation",
      "title": "Resolve plan decisions",
      "detail": "Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.",
      "status": "complete"
    },
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
      "title": "Review the current pattern in Unisane Ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "complete"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Execute and certify the history-preserving disposable Unisane Ops extraction and public-safety proof without promoting a final repository\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Exact integrated source, freeze checkpoint, filter specification, tool identity, and normalized filter inputs are frozen and receipted.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "The approved 507 lineage mappings and 91 additions are executed in a disposable task-local candidate with a complete source-to-filtered commit map and deterministic digests.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Current target file content and modes match integrated source exactly and every excluded foreign path is absent.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Refs, tags, signatures, Git integrity, object inventory, filter metadata, alternates, remotes, reflogs, and unreachable residue are inspected and cleaned in the disposable candidate.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Every reachable commit, blob, ref, working-tree path, commit message, and contributor identity is scanned under the integrated public-safety specification with only redacted identifiers and digests recorded.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-6",
      "acceptanceCriterion": "Unavailable security, legal, license, asset, contributor, scanner-policy, and provider-state owner facts remain explicit fail-closed decisions.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-7",
      "acceptanceCriterion": "The exact @unisane/ui, @unisane/data-table, and @unisane/devtools blockers remain open with no guessed versions, copied sibling source, fallback, target lockfile, or target Skopos activation.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-8",
      "acceptanceCriterion": "Strict closure and immutable snapshot support a complete review packet and a bounded final-materialization route that requires separate approval.",
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
      "resolutionReason": "Updated the canonical readiness Standard with executed disposable extraction facts, deterministic receipt authority, standalone proof-stage gates, and fail-closed public-readiness status.",
      "resolvedAt": "2026-08-09T16:36:35.192Z",
      "resolvedByActorId": "codex-unisane-ops-extraction-proof"
    }
  ],
  "questions": [
    {
      "id": "plan.public-api-change",
      "category": "public-api",
      "escalation": "must-ask",
      "question": "Should this plan change a public contract, route, or SDK surface?",
      "whyItMatters": "Public-facing changes need explicit confirmation so the agent does not silently ship a breaking contract.",
      "recommendedOptionId": "confirm-contract-first",
      "options": [
        {
          "id": "confirm-contract-first",
          "label": "Confirm contract first",
          "rationale": "Recommended because contract decisions should be explicit before implementation starts."
        },
        {
          "id": "internal-only-change",
          "label": "Keep change internal",
          "rationale": "Use this when the goal should not affect public behavior or external consumers."
        }
      ],
      "blocking": true,
      "status": "resolved",
      "resolvedOptionId": "internal-only-change",
      "resolvedAt": "2026-08-09T16:13:41.788Z",
      "resolvedByActorId": "codex-unisane-ops-extraction-proof"
    }
  ],
  "recommendations": [
    {
      "id": "resolve-plan.public-api-change",
      "title": "Resolve: Should this plan change a public contract, route, or SDK surface?",
      "summary": "Public-facing changes need explicit confirmation so the agent does not silently ship a breaking contract.",
      "priority": "high",
      "actionKind": "resolve-question",
      "linkedQuestionId": "plan.public-api-change",
      "blocking": true,
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
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "unisane-infrastructure/repository-system/manifests/unisane-ops.json"
      ],
      "reason": "Reviewer explicitly requires reconciling the Ops repository-system typecheck declaration with the staged root command during disposable proof.",
      "actorId": "codex-unisane-ops-extraction-proof",
      "recordedAt": "2026-08-09T16:15:30.186Z",
      "baselinePaths": [
        {
          "path": "unisane-infrastructure/repository-system/manifests/unisane-ops.json",
          "digest": "8b57ae3ac9b2d33396433f00dc7d62cc198b86fceef8b64346a01647ee8f8471"
        }
      ]
    }
  ],
  "declaredOwnedPaths": [
    "unisane-infrastructure/repository-system/manifests/unisane-ops.json",
    "unisane-ops"
  ]
}
```
<!-- skopos:task-state:end -->
