---
title: "Task: Complete generated GTM tracking setup through existing recipes and shared diagnosis"
status: complete
owner: "codex"
id: T-3bb1d955
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-7b9eb3adc9dae0af
lastUpdated: 2026-09-06
---

# Task: Complete generated GTM tracking setup through existing recipes and shared diagnosis

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Complete generated GTM tracking setup through existing recipes and shared diagnosis

## Acceptance

- Specify typed tracking setup before implementation and reuse existing tag recipe builders
- Generate explicit consent-aware event configuration without inventing business outcomes or silently replacing existing manifests
- Expose deterministic validation and review output through shared offline action CLI MCP and console
- Verify malformed identifiers consent references dedupe and integration with fixtures

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
- `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs`

## Ownership Expansions

- `2026-09-06T08:47:10.370Z` by `codex`: `packages/provider-google/src/google/tag-manager` — Generated Meta events need the existing provider renderer to preserve value/currency and initialize each pixel once; test these lowering gaps alongside setup generation.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete generated GTM tracking setup through existing recipes and shared diagnosis" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Specify typed tracking setup before implementation and reuse existing tag recipe builders (closure, agent-observation)
- Generate explicit consent-aware event configuration without inventing business outcomes or silently replacing existing manifests (closure, agent-observation)
- Expose deterministic validation and review output through shared offline action CLI MCP and console (closure, agent-observation)
- Verify malformed identifiers consent references dedupe and integration with fixtures (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-3bb1d955",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T08:45:06.801Z",
  "updatedAt": "2026-09-06T08:56:03.818Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Complete generated GTM tracking setup through existing recipes and shared diagnosis",
  "goal": "Complete generated GTM tracking setup through existing recipes and shared diagnosis",
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
      "Specify typed tracking setup before implementation and reuse existing tag recipe builders",
      "Generate explicit consent-aware event configuration without inventing business outcomes or silently replacing existing manifests",
      "Expose deterministic validation and review output through shared offline action CLI MCP and console",
      "Verify malformed identifiers consent references dedupe and integration with fixtures"
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
      "ownedPathCount": 8,
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
    "baselineId": "baseline-7b9eb3adc9dae0af"
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
      "detail": "Carry out \"Complete generated GTM tracking setup through existing recipes and shared diagnosis\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Specify typed tracking setup before implementation and reuse existing tag recipe builders",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Generate explicit consent-aware event configuration without inventing business outcomes or silently replacing existing manifests",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Expose deterministic validation and review output through shared offline action CLI MCP and console",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Verify malformed identifiers consent references dedupe and integration with fixtures",
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
        "packages/provider-google/src/google/tag-manager"
      ],
      "reason": "Generated Meta events need the existing provider renderer to preserve value/currency and initialize each pixel once; test these lowering gaps alongside setup generation.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T08:47:10.370Z",
      "baselinePaths": [
        {
          "path": "packages/provider-google/src/google/tag-manager",
          "digest": "47df55c92dc01bfafbd23a824d76275a97fb7b6be8784a624c1162de8894dd22",
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
    "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
  ]
}
```
<!-- skopos:task-state:end -->
