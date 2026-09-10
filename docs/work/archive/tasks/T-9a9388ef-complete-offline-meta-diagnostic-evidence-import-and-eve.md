---
title: "Task: Complete offline Meta diagnostic evidence import and event issue investigation through shared interfaces before live validation"
status: complete
owner: "codex"
id: T-9a9388ef
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-4e83953ee8a06766
lastUpdated: 2026-09-06
---

# Task: Complete offline Meta diagnostic evidence import and event issue investigation through shared interfaces before live validation

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Complete offline Meta diagnostic evidence import and event issue investigation through shared interfaces before live validation

## Acceptance

- Document domain contracts and exact ownership before implementing diagnostics
- Imported diagnostics validate dataset binding provenance event scores and issues without inferring provider metrics
- CLI MCP and console share import and review with evidence-based repair handoffs and no provider mutation
- Tests verify isolation malformed evidence stale imports and interface paths with no live credentials

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
- `packages/growth/src`
- `packages/ops-mcp/src`
- `packages/unisane-ops/src`
- `packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete offline Meta diagnostic evidence import and event issue investigation through shared interfaces before live validation" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Document domain contracts and exact ownership before implementing diagnostics (closure, agent-observation)
- Imported diagnostics validate dataset binding provenance event scores and issues without inferring provider metrics (closure, agent-observation)
- CLI MCP and console share import and review with evidence-based repair handoffs and no provider mutation (closure, agent-observation)
- Tests verify isolation malformed evidence stale imports and interface paths with no live credentials (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-9a9388ef",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-05T23:55:15.182Z",
  "updatedAt": "2026-09-06T00:05:21.745Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Complete offline Meta diagnostic evidence import and event issue investigation through shared interfaces before live validation",
  "goal": "Complete offline Meta diagnostic evidence import and event issue investigation through shared interfaces before live validation",
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
      "Document domain contracts and exact ownership before implementing diagnostics",
      "Imported diagnostics validate dataset binding provenance event scores and issues without inferring provider metrics",
      "CLI MCP and console share import and review with evidence-based repair handoffs and no provider mutation",
      "Tests verify isolation malformed evidence stale imports and interface paths with no live credentials"
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
    "baselineId": "baseline-4e83953ee8a06766"
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
      "detail": "Carry out \"Complete offline Meta diagnostic evidence import and event issue investigation through shared interfaces before live validation\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Document domain contracts and exact ownership before implementing diagnostics",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Imported diagnostics validate dataset binding provenance event scores and issues without inferring provider metrics",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "CLI MCP and console share import and review with evidence-based repair handoffs and no provider mutation",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Tests verify isolation malformed evidence stale imports and interface paths with no live credentials",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
  "questions": [],
  "recommendations": [],
  "declaredOwnedPaths": [
    "apps/console/src",
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "docs/work/plans/unisane-ops-meta-capability-implementation-plan.md",
    "packages/growth/pack.manifest.json",
    "packages/growth/src",
    "packages/ops-mcp/src",
    "packages/unisane-ops/src",
    "packages/unisane-ops/test/mcp-codex-binding.integration.test.mjs"
  ]
}
```
<!-- skopos:task-state:end -->
