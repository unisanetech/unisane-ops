---
title: "Task: Complete GTM offline safety and review gaps with strict receipts, deterministic planning, publish verification and shared audit interfaces"
status: complete
owner: "codex"
id: T-449cae48
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-72ca3ba3cbc44c88
lastUpdated: 2026-09-06
---

# Task: Complete GTM offline safety and review gaps with strict receipts, deterministic planning, publish verification and shared audit interfaces

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Complete GTM offline safety and review gaps with strict receipts, deterministic planning, publish verification and shared audit interfaces

## Acceptance

- Document GTM inventory and implementation boundaries before edits
- Reject malformed or mismatched plans receipts and transport evidence; preserve deterministic safe deactivation
- Bind version creation and publication to reviewed evidence and verify provider state using fixtures
- Expose reusable offline GTM diagnosis through typed actions CLI MCP and console with tests

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

- None recorded.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Complete GTM offline safety and review gaps with strict receipts, deterministic planning, publish verification and shared audit interfaces" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Document GTM inventory and implementation boundaries before edits (closure, agent-observation)
- Reject malformed or mismatched plans receipts and transport evidence; preserve deterministic safe deactivation (closure, agent-observation)
- Bind version creation and publication to reviewed evidence and verify provider state using fixtures (closure, agent-observation)
- Expose reusable offline GTM diagnosis through typed actions CLI MCP and console with tests (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-449cae48",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T00:22:58.749Z",
  "updatedAt": "2026-09-06T00:32:23.674Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Complete GTM offline safety and review gaps with strict receipts, deterministic planning, publish verification and shared audit interfaces",
  "goal": "Complete GTM offline safety and review gaps with strict receipts, deterministic planning, publish verification and shared audit interfaces",
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
      "Document GTM inventory and implementation boundaries before edits",
      "Reject malformed or mismatched plans receipts and transport evidence; preserve deterministic safe deactivation",
      "Bind version creation and publication to reviewed evidence and verify provider state using fixtures",
      "Expose reusable offline GTM diagnosis through typed actions CLI MCP and console with tests"
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
    "baselineId": "baseline-72ca3ba3cbc44c88"
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
      "detail": "Carry out \"Complete GTM offline safety and review gaps with strict receipts, deterministic planning, publish verification and shared audit interfaces\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Document GTM inventory and implementation boundaries before edits",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Reject malformed or mismatched plans receipts and transport evidence; preserve deterministic safe deactivation",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Bind version creation and publication to reviewed evidence and verify provider state using fixtures",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Expose reusable offline GTM diagnosis through typed actions CLI MCP and console with tests",
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
