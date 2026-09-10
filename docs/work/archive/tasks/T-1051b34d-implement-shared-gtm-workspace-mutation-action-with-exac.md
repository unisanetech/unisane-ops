---
title: "Task: Implement shared GTM workspace mutation action with exact approvals and persisted attempt recovery"
status: complete
owner: "codex"
id: T-1051b34d
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-1af3d6536cd3cdaa
lastUpdated: 2026-09-06
---

# Task: Implement shared GTM workspace mutation action with exact approvals and persisted attempt recovery

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Implement shared GTM workspace mutation action with exact approvals and persisted attempt recovery

## Acceptance

- Document execution and recovery contracts before code
- Use engine plans approvals locks and receipts for an exact GTM workspace mutation action
- Persist a start marker before provider writes and reconcile uncertain outcomes without replay
- Test drift approval isolation crash recovery and verification using fixtures only

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `automatic`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.

## Owned Paths

- `apps/console/src`
- `docs/guides/manage-google-tag-manager-with-llm.md`
- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `docs/work/plans/unisane-ops-gtm-completion-plan.md`
- `packages/growth/pack.manifest.json`
- `packages/growth/src`
- `packages/ops-mcp/src`
- `packages/provider-google/src/google/tag-manager`
- `packages/unisane-ops/src`
- `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs`

## Ownership Expansions

- `2026-09-06T08:06:53.069Z` by `codex`: `apps/console/src`, `packages/ops-mcp/src`, `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs` — Expose the shared workspace lifecycle through bound MCP and console adapters and verify tool discovery.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement shared GTM workspace mutation action with exact approvals and persisted attempt recovery" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Document execution and recovery contracts before code (closure, agent-observation)
- Use engine plans approvals locks and receipts for an exact GTM workspace mutation action (closure, agent-observation)
- Persist a start marker before provider writes and reconcile uncertain outcomes without replay (closure, agent-observation)
- Test drift approval isolation crash recovery and verification using fixtures only (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-1051b34d",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T08:01:49.011Z",
  "updatedAt": "2026-09-06T08:18:50.501Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Implement shared GTM workspace mutation action with exact approvals and persisted attempt recovery",
  "goal": "Implement shared GTM workspace mutation action with exact approvals and persisted attempt recovery",
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
      "Document execution and recovery contracts before code",
      "Use engine plans approvals locks and receipts for an exact GTM workspace mutation action",
      "Persist a start marker before provider writes and reconcile uncertain outcomes without replay",
      "Test drift approval isolation crash recovery and verification using fixtures only"
    ],
    "nonGoals": [],
    "constraints": []
  },
  "risk": "standard",
  "admission": {
    "recommendedRisk": "standard",
    "recommendedDetail": "standard",
    "selectedRisk": "standard",
    "selectedDetail": "standard",
    "selectionSource": "automatic",
    "workflow": "tracked",
    "reasons": [
      "The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 7,
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
    "baselineId": "baseline-1af3d6536cd3cdaa"
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
      "detail": "Carry out \"Implement shared GTM workspace mutation action with exact approvals and persisted attempt recovery\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Document execution and recovery contracts before code",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Use engine plans approvals locks and receipts for an exact GTM workspace mutation action",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Persist a start marker before provider writes and reconcile uncertain outcomes without replay",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Test drift approval isolation crash recovery and verification using fixtures only",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
  "questions": [],
  "recommendations": [],
  "ownershipExpansions": [
    {
      "paths": [
        "apps/console/src",
        "packages/ops-mcp/src",
        "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
      ],
      "reason": "Expose the shared workspace lifecycle through bound MCP and console adapters and verify tool discovery.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T08:06:53.069Z",
      "baselinePaths": [
        {
          "path": "apps/console/src",
          "digest": "c488a1bc1e4f52b285b0829700766b61e136d4cd764debde5eadea1644ecad7f",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/ops-mcp/src",
          "digest": "f3e48e83f29eeaecaca4baa2ec097726ff3a3d7f0b259ae4028af6e9ed5464d4",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs",
          "digest": "4e7eec2bdab064ac6d286028faa310add89bac6d0e3388831d1bdd74fd376478",
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
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-gtm-completion-plan.md",
    "packages/growth/pack.manifest.json",
    "packages/growth/src",
    "packages/ops-mcp/src",
    "packages/provider-google/src/google/tag-manager",
    "packages/unisane-ops/src",
    "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
  ]
}
```
<!-- skopos:task-state:end -->
