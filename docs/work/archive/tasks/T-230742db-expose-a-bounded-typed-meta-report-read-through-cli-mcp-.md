---
title: "Task: Expose a bounded typed Meta report read through CLI MCP and console with exact account binding and honest measurement evidence"
status: complete
owner: "codex"
id: T-230742db
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-018ee514fbc2b06d
lastUpdated: 2026-09-05
---

# Task: Expose a bounded typed Meta report read through CLI MCP and console with exact account binding and honest measurement evidence

## Changelog

- `2026-09-05`: Synchronized Task state `complete` from Skopos.

## Goal

Expose a bounded typed Meta report read through CLI MCP and console with exact account binding and honest measurement evidence

## Acceptance

- Document bounded read scope evidence semantics and ownership before edits
- Shared typed report action validates exact project environment connection account and bounds while provider credentials stay in the host
- CLI MCP and loopback console use the shared result with separate Meta action types and explicit partial timezone attribution and persistence limitations
- Focused report provider action host MCP CLI and console tests plus affected typechecks builds and visual verification pass without real account calls

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
- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `docs/work/plans/unisane-ops-meta-capability-implementation-plan.md`
- `packages/growth/pack.manifest.json`
- `packages/growth/package.json`
- `packages/growth/src`
- `packages/ops-mcp/src`
- `packages/provider-meta/src`
- `packages/unisane-ops/src/mcp`
- `packages/unisane-ops/src/runtime-adapters`
- `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs`
- `pnpm-lock.yaml`

## Ownership Expansions

- `2026-09-05T23:27:44.359Z` by `codex`: `packages/growth/package.json`, `pnpm-lock.yaml` — Declare the existing installed Zod version required by the shared MCP-compatible input schema

## Steps

- [x] **Should this plan change a public contract, route, or SDK surface?** (decision, complete) — Public-facing changes need explicit confirmation so the agent does not silently ship a breaking contract.
- [x] **Resolve plan decisions** (implementation, complete) — Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.
- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Expose a bounded typed Meta report read through CLI MCP and console with exact account binding and honest measurement evidence" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Document bounded read scope evidence semantics and ownership before edits (closure, agent-observation)
- Shared typed report action validates exact project environment connection account and bounds while provider credentials stay in the host (closure, agent-observation)
- CLI MCP and loopback console use the shared result with separate Meta action types and explicit partial timezone attribution and persistence limitations (closure, agent-observation)
- Focused report provider action host MCP CLI and console tests plus affected typechecks builds and visual verification pass without real account calls (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-230742db",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-05T23:19:12.850Z",
  "updatedAt": "2026-09-05T23:32:21.628Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Expose a bounded typed Meta report read through CLI MCP and console with exact account binding and honest measurement evidence",
  "goal": "Expose a bounded typed Meta report read through CLI MCP and console with exact account binding and honest measurement evidence",
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
      "Document bounded read scope evidence semantics and ownership before edits",
      "Shared typed report action validates exact project environment connection account and bounds while provider credentials stay in the host",
      "CLI MCP and loopback console use the shared result with separate Meta action types and explicit partial timezone attribution and persistence limitations",
      "Focused report provider action host MCP CLI and console tests plus affected typechecks builds and visual verification pass without real account calls"
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
      "ownedPathCount": 10,
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
    "baselineId": "baseline-018ee514fbc2b06d"
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
      "title": "Review the current pattern in unisane-ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "complete"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Expose a bounded typed Meta report read through CLI MCP and console with exact account binding and honest measurement evidence\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Document bounded read scope evidence semantics and ownership before edits",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Shared typed report action validates exact project environment connection account and bounds while provider credentials stay in the host",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "CLI MCP and loopback console use the shared result with separate Meta action types and explicit partial timezone attribution and persistence limitations",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused report provider action host MCP CLI and console tests plus affected typechecks builds and visual verification pass without real account calls",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
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
          "id": "no-public-contract-change",
          "label": "No public contract change",
          "rationale": "Use when the wording does not actually change an API, CLI, SDK, schema, or other external contract."
        }
      ],
      "blocking": true,
      "status": "resolved",
      "resolvedOptionId": "confirm-contract-first",
      "resolvedAt": "2026-09-05T23:19:50.777Z",
      "resolvedByActorId": "codex",
      "disposition": {
        "kind": "answered",
        "reason": "Selected Task question option confirm-contract-first.",
        "actorId": "codex",
        "recordedAt": "2026-09-05T23:19:50.777Z",
        "target": {
          "kind": "option",
          "ref": "confirm-contract-first"
        }
      }
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
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "packages/growth/package.json",
        "pnpm-lock.yaml"
      ],
      "reason": "Declare the existing installed Zod version required by the shared MCP-compatible input schema",
      "actorId": "codex",
      "recordedAt": "2026-09-05T23:27:44.359Z",
      "baselinePaths": [
        {
          "path": "packages/growth/package.json",
          "digest": "2d97482e2d525ad09ee17b5cac8293780d8717b0e3f466e598d5130c7b9aa459",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "pnpm-lock.yaml",
          "digest": "d09ebc1ef6c74e25127d437575e7e11defe8a79636f1682ab57b13c6fc7ec47d",
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
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-meta-capability-implementation-plan.md",
    "packages/growth/pack.manifest.json",
    "packages/growth/package.json",
    "packages/growth/src",
    "packages/ops-mcp/src",
    "packages/provider-meta/src",
    "packages/unisane-ops/src/mcp",
    "packages/unisane-ops/src/runtime-adapters",
    "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs",
    "pnpm-lock.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
