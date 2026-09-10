---
title: "Task: Complete shared GTM release workflows and review remaining host capability gaps"
status: complete
owner: "codex"
id: T-13880da2
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-4dabf9097c44c1a0
lastUpdated: 2026-09-06
---

# Task: Complete shared GTM release workflows and review remaining host capability gaps

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Complete shared GTM release workflows and review remaining host capability gaps

## Acceptance

- Document release lifecycle and honest remaining capability statuses before implementation
- Expose exact reviewed preview version and publish lifecycle through shared typed provider and host contracts
- Persist attempts before release writes and recover without replay, retaining target and content identity
- Verify release drift failure recovery isolation and interface behavior with offline tests

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `automatic`
- Reason: The goal contains high-impact signal: release.

## Owned Paths

- `apps/console/src`
- `docs/guides/manage-google-tag-manager-with-llm.md`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `docs/work/plans/unisane-ops-gtm-completion-plan.md`
- `packages/growth/pack.manifest.json`
- `packages/growth/src`
- `packages/ops-engine/src`
- `packages/ops-mcp/src`
- `packages/provider-google/src/google/tag-manager`
- `packages/unisane-ops/src`
- `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs`

## Ownership Expansions

- `2026-09-06T08:32:27.134Z` by `codex`: `packages/ops-engine/src` — Implement and verify the remaining durable execution backend against existing engine state ports; GTM host will select it explicitly.
- `2026-09-06T08:36:16.031Z` by `codex`: `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs` — Update verified canonical MCP tool discovery for shared GTM release workflow.
- `2026-09-06T08:39:30.363Z` by `codex`: `docs/standards/13-unisane-ops-product-architecture-baseline.md` — Synchronize the existing architecture baseline with the implemented shared GTM release lifecycle and optional single-host durable state backend.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete shared GTM release workflows and review remaining host capability gaps" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Document release lifecycle and honest remaining capability statuses before implementation (closure, agent-observation)
- Expose exact reviewed preview version and publish lifecycle through shared typed provider and host contracts (closure, agent-observation)
- Persist attempts before release writes and recover without replay, retaining target and content identity (closure, agent-observation)
- Verify release drift failure recovery isolation and interface behavior with offline tests (closure, agent-observation)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope workspace. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-13880da2",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T08:24:21.775Z",
  "updatedAt": "2026-09-06T08:44:37.399Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Complete shared GTM release workflows and review remaining host capability gaps",
  "goal": "Complete shared GTM release workflows and review remaining host capability gaps",
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
      "Document release lifecycle and honest remaining capability statuses before implementation",
      "Expose exact reviewed preview version and publish lifecycle through shared typed provider and host contracts",
      "Persist attempts before release writes and recover without replay, retaining target and content identity",
      "Verify release drift failure recovery isolation and interface behavior with offline tests"
    ],
    "nonGoals": [],
    "constraints": []
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "automatic",
    "workflow": "strict",
    "reasons": [
      "The goal contains high-impact signal: release."
    ],
    "signals": {
      "goalSignals": [
        "release"
      ],
      "ownedPathCount": 9,
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
    "baselineId": "baseline-4dabf9097c44c1a0"
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
      "detail": "Carry out \"Complete shared GTM release workflows and review remaining host capability gaps\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Document release lifecycle and honest remaining capability statuses before implementation",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Expose exact reviewed preview version and publish lifecycle through shared typed provider and host contracts",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Persist attempts before release writes and recover without replay, retaining target and content identity",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Verify release drift failure recovery isolation and interface behavior with offline tests",
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
      "reason": "High-impact work must review and synchronize the existing standard Memory for Scope workspace.",
      "status": "complete",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
      "resolution": "memory-updated",
      "resolutionReason": "Architecture baseline now distinguishes durable shared GTM execution from unchanged local Cloud resource execution and retains host/provider/domain ownership.",
      "resolvedAt": "2026-09-06T08:42:05.728Z",
      "resolvedByActorId": "codex"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 3 times. Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "medium",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-13880da2' 'Continue Complete shared GTM release workflows and review remaining host capability gaps as bounded follow-up work' . --scope 'workspace' --own 'docs/standards/13-unisane-ops-product-architecture-baseline.md' --own 'packages/ops-engine/src' --own 'packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs' --reason 'The Task may be drifting from its admitted subject because ownership expanded 3 times.' --actor 'codex'",
      "ownedPaths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "packages/ops-engine/src",
        "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 3 times.",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "packages/ops-engine/src"
      ],
      "reason": "Implement and verify the remaining durable execution backend against existing engine state ports; GTM host will select it explicitly.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T08:32:27.134Z",
      "baselinePaths": [
        {
          "path": "packages/ops-engine/src",
          "digest": "2b6e462b09d82214d0e34a743895a6ab5323723148ef3a880a1815165958d19a",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "workspace",
      "nextScopeId": "workspace",
      "affectedScopeIds": [
        "workspace"
      ]
    },
    {
      "paths": [
        "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
      ],
      "reason": "Update verified canonical MCP tool discovery for shared GTM release workflow.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T08:36:16.031Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs",
          "digest": "1a8529d4154cfdd7e7f2c25a00cedc0e0a1c7b6b48ed4946ad4de0c32dc3b8c7",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "workspace",
      "nextScopeId": "workspace",
      "affectedScopeIds": [
        "workspace"
      ]
    },
    {
      "paths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md"
      ],
      "reason": "Synchronize the existing architecture baseline with the implemented shared GTM release lifecycle and optional single-host durable state backend.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T08:39:30.363Z",
      "baselinePaths": [
        {
          "path": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
          "digest": "6eab07123a423a8aa53d13861946e45969542589f5860f25664e6f7ef63f62a1",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "workspace",
      "nextScopeId": "workspace",
      "affectedScopeIds": [
        "workspace"
      ]
    }
  ],
  "declaredOwnedPaths": [
    "apps/console/src",
    "docs/guides/manage-google-tag-manager-with-llm.md",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-gtm-completion-plan.md",
    "packages/growth/pack.manifest.json",
    "packages/growth/src",
    "packages/ops-engine/src",
    "packages/ops-mcp/src",
    "packages/provider-google/src/google/tag-manager",
    "packages/unisane-ops/src",
    "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
  ]
}
```
<!-- skopos:task-state:end -->
