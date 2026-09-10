---
title: "Task: Implement Growth event registry v2 and channel-aware tracking observation reconciliation"
status: complete
owner: "bhaskarbarma"
id: T-25344928
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-7e9485684371ad89
lastUpdated: 2026-08-31
---

# Task: Implement Growth event registry v2 and channel-aware tracking observation reconciliation

## Changelog

- `2026-08-31`: Synchronized Task state `complete` from Skopos.

## Goal

Implement Growth event registry v2 and channel-aware tracking observation reconciliation

## Acceptance

- Event registry v2 models browser-only, server-only, and browser-and-server delivery expectations, rejects ambiguous declarations, and provides an explicit one-shot v1 migration while ordinary runtime rejects v1.
- Tracking observation v2 and reconciliation distinguish a valid browser/server pair from event-id mismatch, same-channel duplicates, stable server retries, event-id collisions, and missing required channels.
- The tracking audit result exposes provider-neutral dual-delivery coverage without changing Meta providers, console, MCP, ECOM, GTM, or other adopter behavior.
- Focused schema, migration, and reconciliation tests plus Growth lint, typecheck, test, and build checks pass.

## Non-Goals

- Connect Meta, call provider APIs, change provider-meta, alter console or MCP surfaces, modify ECOM or GTM, or publish anything.

## Constraints

- Canonical outcomes, delivery observations, provider diagnostics, and provider attribution remain separate; no raw PII, credentials, or ECOM-specific contracts enter Growth.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__growth.symbols.json`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `packages/growth/dist`
- `packages/growth/src/actions/measurement-audit.test.ts`
- `packages/growth/src/console/analytics.test.ts`
- `packages/growth/src/marketing`
- `packages/growth/src/workflows/measurement-audit-execution.test.ts`
- `packages/growth/src/workflows/measurement-audit-execution.ts`

## Ownership Expansions

- `2026-08-31T19:21:24.909Z` by `bhaskarbarma`: `packages/growth/src/actions/measurement-audit.test.ts`, `packages/growth/src/console/analytics.test.ts`, `packages/growth/src/workflows/measurement-audit-execution.test.ts`, `packages/growth/src/workflows/measurement-audit-execution.ts` — The public tracking coverage contract gained required dual-delivery fields, so existing typed audit fixtures and the missing-registry audit constructor must initialize the complete v2 coverage shape without changing their behavior.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement Growth event registry v2 and channel-aware tracking observation reconciliation" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Event registry v2 models browser-only, server-only, and browser-and-server delivery expectations, rejects ambiguous declarations, and provides an explicit one-shot v1 migration while ordinary runtime rejects v1. (closure, agent-observation)
- Tracking observation v2 and reconciliation distinguish a valid browser/server pair from event-id mismatch, same-channel duplicates, stable server retries, event-id collisions, and missing required channels. (closure, agent-observation)
- The tracking audit result exposes provider-neutral dual-delivery coverage without changing Meta providers, console, MCP, ECOM, GTM, or other adopter behavior. (closure, agent-observation)
- Focused schema, migration, and reconciliation tests plus Growth lint, typecheck, test, and build checks pass. (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-25344928",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-31T19:06:55.599Z",
  "updatedAt": "2026-08-31T19:48:28.873Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Implement Growth event registry v2 and channel-aware tracking observation reconciliation",
  "goal": "Implement Growth event registry v2 and channel-aware tracking observation reconciliation",
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
      "Event registry v2 models browser-only, server-only, and browser-and-server delivery expectations, rejects ambiguous declarations, and provides an explicit one-shot v1 migration while ordinary runtime rejects v1.",
      "Tracking observation v2 and reconciliation distinguish a valid browser/server pair from event-id mismatch, same-channel duplicates, stable server retries, event-id collisions, and missing required channels.",
      "The tracking audit result exposes provider-neutral dual-delivery coverage without changing Meta providers, console, MCP, ECOM, GTM, or other adopter behavior.",
      "Focused schema, migration, and reconciliation tests plus Growth lint, typecheck, test, and build checks pass."
    ],
    "nonGoals": [
      "Connect Meta, call provider APIs, change provider-meta, alter console or MCP surfaces, modify ECOM or GTM, or publish anything."
    ],
    "constraints": [
      "Canonical outcomes, delivery observations, provider diagnostics, and provider attribution remain separate; no raw PII, credentials, or ECOM-specific contracts enter Growth."
    ]
  },
  "risk": "standard",
  "admission": {
    "recommendedRisk": "standard",
    "recommendedDetail": "standard",
    "selectedRisk": "standard",
    "selectedDetail": "standard",
    "selectionSource": "explicit-override",
    "workflow": "tracked",
    "reasons": [
      "The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 5,
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
    "baselineId": "baseline-7e9485684371ad89"
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
      "detail": "Carry out \"Implement Growth event registry v2 and channel-aware tracking observation reconciliation\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Event registry v2 models browser-only, server-only, and browser-and-server delivery expectations, rejects ambiguous declarations, and provides an explicit one-shot v1 migration while ordinary runtime rejects v1.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Tracking observation v2 and reconciliation distinguish a valid browser/server pair from event-id mismatch, same-channel duplicates, stable server retries, event-id collisions, and missing required channels.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "The tracking audit result exposes provider-neutral dual-delivery coverage without changing Meta providers, console, MCP, ECOM, GTM, or other adopter behavior.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused schema, migration, and reconciliation tests plus Growth lint, typecheck, test, and build checks pass.",
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
        "packages/growth/src/actions/measurement-audit.test.ts",
        "packages/growth/src/console/analytics.test.ts",
        "packages/growth/src/workflows/measurement-audit-execution.test.ts",
        "packages/growth/src/workflows/measurement-audit-execution.ts"
      ],
      "reason": "The public tracking coverage contract gained required dual-delivery fields, so existing typed audit fixtures and the missing-registry audit constructor must initialize the complete v2 coverage shape without changing their behavior.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T19:21:24.909Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/actions/measurement-audit.test.ts",
          "digest": "324c761246651f7466944942737be1d37ed95f224b3bcaf6f0dac779401497d3",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/console/analytics.test.ts",
          "digest": "dba8397a8de287ba38c1dea0706d1fa307b83c8aef0daed4bf3772da941d1cb7",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/workflows/measurement-audit-execution.test.ts",
          "digest": "292f880f89011c191671d7542e0c882dd83b37b83163694974c0b7892a271135",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/workflows/measurement-audit-execution.ts",
          "digest": "f5b6e2373e1be3e7ef3bc130d1113d7780673d12ff41df65fe4cf93fe9d11285",
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
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "packages/growth/dist",
    "packages/growth/src/actions/measurement-audit.test.ts",
    "packages/growth/src/console/analytics.test.ts",
    "packages/growth/src/marketing",
    "packages/growth/src/workflows/measurement-audit-execution.test.ts",
    "packages/growth/src/workflows/measurement-audit-execution.ts"
  ]
}
```
<!-- skopos:task-state:end -->
