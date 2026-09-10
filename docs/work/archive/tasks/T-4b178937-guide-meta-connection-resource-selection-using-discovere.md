---
title: "Task: Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior"
status: complete
owner: "codex"
id: T-4b178937
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-3228b23d9321c65f
lastUpdated: 2026-09-05
---

# Task: Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior

## Changelog

- `2026-09-05`: Synchronized Task state `complete` from Skopos.

## Goal

Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior

## Acceptance

- Document M1.1 scope and failure handling before code changes
- Interactive connection selects required account and event source by discovered names and IDs without automatic ambiguity resolution
- JSON and non-TTY execution never prompt; explicit and previous selections remain authoritative; cancel or invalid choices cause no record or credential writes
- Provider tests typecheck lint and build plus host connection regression checks pass; live verification remains separately unproven

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

- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `docs/work/plans/unisane-ops-meta-capability-implementation-plan.md`
- `packages/provider-meta/README.md`
- `packages/provider-meta/src`
- `packages/unisane-ops/src/mcp/codex-binding.ts`
- `packages/unisane-ops/test/growth-onboarding.integration.test.mjs`
- `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs`

## Ownership Expansions

- `2026-09-05T19:52:44.299Z` by `codex`: `packages/unisane-ops/src/mcp/codex-binding.ts` — Host regression check found one leftover TOOL_NAMES reference from the previous canonical MCP list refactor; update it to the imported canonical list.
- `2026-09-05T19:53:38.490Z` by `codex`: `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs` — Update the Codex binding integration expectation to include the already-implemented capability-review tool while verifying the leftover list-reference repair.
- `2026-09-05T19:54:07.537Z` by `codex`: `packages/unisane-ops/test/growth-onboarding.integration.test.mjs` — Onboarding regression fixtures point above the standalone repository and omit the installed host dependency. Keep fixtures inside this repository and explicitly link the local package under test.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Document M1.1 scope and failure handling before code changes (closure, agent-observation)
- Interactive connection selects required account and event source by discovered names and IDs without automatic ambiguity resolution (closure, agent-observation)
- JSON and non-TTY execution never prompt; explicit and previous selections remain authoritative; cancel or invalid choices cause no record or credential writes (closure, agent-observation)
- Provider tests typecheck lint and build plus host connection regression checks pass; live verification remains separately unproven (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-4b178937",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-05T19:48:43.886Z",
  "updatedAt": "2026-09-05T19:55:32.189Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior",
  "goal": "Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior",
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
      "Document M1.1 scope and failure handling before code changes",
      "Interactive connection selects required account and event source by discovered names and IDs without automatic ambiguity resolution",
      "JSON and non-TTY execution never prompt; explicit and previous selections remain authoritative; cancel or invalid choices cause no record or credential writes",
      "Provider tests typecheck lint and build plus host connection regression checks pass; live verification remains separately unproven"
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
      "ownedPathCount": 4,
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
    "baselineId": "baseline-3228b23d9321c65f"
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
      "detail": "Carry out \"Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Document M1.1 scope and failure handling before code changes",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Interactive connection selects required account and event source by discovered names and IDs without automatic ambiguity resolution",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "JSON and non-TTY execution never prompt; explicit and previous selections remain authoritative; cancel or invalid choices cause no record or credential writes",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Provider tests typecheck lint and build plus host connection regression checks pass; live verification remains separately unproven",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 3 times. Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "medium",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-4b178937' 'Continue Guide Meta connection resource selection using discovered names and exact IDs while preserving non-interactive and refresh behavior as bounded follow-up work' . --scope 'workspace' --own 'packages/unisane-ops/src/mcp/codex-binding.ts' --own 'packages/unisane-ops/test/growth-onboarding.integration.test.mjs' --own 'packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs' --reason 'The Task may be drifting from its admitted subject because ownership expanded 3 times.' --actor 'codex'",
      "ownedPaths": [
        "packages/unisane-ops/src/mcp/codex-binding.ts",
        "packages/unisane-ops/test/growth-onboarding.integration.test.mjs",
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
        "packages/unisane-ops/src/mcp/codex-binding.ts"
      ],
      "reason": "Host regression check found one leftover TOOL_NAMES reference from the previous canonical MCP list refactor; update it to the imported canonical list.",
      "actorId": "codex",
      "recordedAt": "2026-09-05T19:52:44.299Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/src/mcp/codex-binding.ts",
          "digest": "77e7033c3a62723a8ee0e1c552ee126db01eb0e873285bf61926d2977691091c",
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
      "reason": "Update the Codex binding integration expectation to include the already-implemented capability-review tool while verifying the leftover list-reference repair.",
      "actorId": "codex",
      "recordedAt": "2026-09-05T19:53:38.490Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs",
          "digest": "a39e8d3b1bf60515f2af344f4f6744a2d765e6cc5607e9456e2662cc2371850f",
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
        "packages/unisane-ops/test/growth-onboarding.integration.test.mjs"
      ],
      "reason": "Onboarding regression fixtures point above the standalone repository and omit the installed host dependency. Keep fixtures inside this repository and explicitly link the local package under test.",
      "actorId": "codex",
      "recordedAt": "2026-09-05T19:54:07.537Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/test/growth-onboarding.integration.test.mjs",
          "digest": "142fe9c42badc7648c0aeed7c4b23ffbcacf2b6ba8431f4a6ee06804b44b1dd1",
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
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-meta-capability-implementation-plan.md",
    "packages/provider-meta/README.md",
    "packages/provider-meta/src",
    "packages/unisane-ops/src/mcp/codex-binding.ts",
    "packages/unisane-ops/test/growth-onboarding.integration.test.mjs",
    "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
  ]
}
```
<!-- skopos:task-state:end -->
