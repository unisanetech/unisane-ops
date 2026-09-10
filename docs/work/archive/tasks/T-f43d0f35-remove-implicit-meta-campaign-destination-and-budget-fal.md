---
title: "Task: Remove implicit Meta campaign destination and budget fallbacks before provider writes"
status: complete
owner: "codex"
id: T-f43d0f35
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-33c668ace8db3c18
lastUpdated: 2026-09-05
---

# Task: Remove implicit Meta campaign destination and budget fallbacks before provider writes

## Changelog

- `2026-09-05`: Synchronized Task state `complete` from Skopos.

## Goal

Remove implicit Meta campaign destination and budget fallbacks before provider writes

## Acceptance

- Missing or invalid Meta destination and budget fail before any provider request
- Explicit reviewed destinations and budgets remain deterministic

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.

## Owned Paths

- `docs/work/plans/unisane-ops-growth-capability-checklist.md`
- `packages/provider-meta/src/meta/marketing/__tests__/campaign-input.test.ts`
- `packages/provider-meta/src/meta/marketing/campaign-input.ts`
- `packages/provider-meta/src/meta/marketing/live-ads-executor.ts`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Does this plan require a destructive rename, removal, or migration path?** (decision, complete) — Destructive changes need an explicit cutover strategy instead of an implicit agent decision.
- [x] **Resolve plan decisions** (implementation, complete) — Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.
- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Remove implicit Meta campaign destination and budget fallbacks before provider writes" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Missing or invalid Meta destination and budget fail before any provider request (closure, agent-observation)
- Explicit reviewed destinations and budgets remain deterministic (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-f43d0f35",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-05T18:58:39.124Z",
  "updatedAt": "2026-09-05T19:00:19.736Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Remove implicit Meta campaign destination and budget fallbacks before provider writes",
  "goal": "Remove implicit Meta campaign destination and budget fallbacks before provider writes",
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
      "Missing or invalid Meta destination and budget fail before any provider request",
      "Explicit reviewed destinations and budgets remain deterministic"
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
    "selectionSource": "explicit-override",
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
    "baselineId": "baseline-33c668ace8db3c18"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "decision-plan.destructive-migration",
      "kind": "decision",
      "title": "Does this plan require a destructive rename, removal, or migration path?",
      "detail": "Destructive changes need an explicit cutover strategy instead of an implicit agent decision.",
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
      "detail": "Carry out \"Remove implicit Meta campaign destination and budget fallbacks before provider writes\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Missing or invalid Meta destination and budget fail before any provider request",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Explicit reviewed destinations and budgets remain deterministic",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
  "questions": [
    {
      "id": "plan.destructive-migration",
      "category": "migration",
      "escalation": "must-ask",
      "question": "Does this plan require a destructive rename, removal, or migration path?",
      "whyItMatters": "Destructive changes need an explicit cutover strategy instead of an implicit agent decision.",
      "recommendedOptionId": "stage-the-change",
      "options": [
        {
          "id": "stage-the-change",
          "label": "Stage the change",
          "rationale": "Recommended because staged rollouts reduce drift and make Readiness easier to reason about."
        },
        {
          "id": "hard-cutover",
          "label": "Hard cutover",
          "rationale": "Use only when an immediate break is intentional and fully understood."
        },
        {
          "id": "no-destructive-change",
          "label": "No destructive change",
          "rationale": "Use when the classified wording does not actually rename, remove, or migrate persisted or public state."
        }
      ],
      "blocking": true,
      "status": "resolved",
      "resolvedOptionId": "no-destructive-change",
      "resolvedAt": "2026-09-05T18:58:55.069Z",
      "resolvedByActorId": "codex",
      "disposition": {
        "kind": "answered",
        "reason": "Selected Task question option no-destructive-change.",
        "actorId": "codex",
        "recordedAt": "2026-09-05T18:58:55.069Z",
        "target": {
          "kind": "option",
          "ref": "no-destructive-change"
        }
      }
    }
  ],
  "recommendations": [
    {
      "id": "resolve-plan.destructive-migration",
      "title": "Resolve: Does this plan require a destructive rename, removal, or migration path?",
      "summary": "Destructive changes need an explicit cutover strategy instead of an implicit agent decision.",
      "priority": "high",
      "actionKind": "resolve-question",
      "linkedQuestionId": "plan.destructive-migration",
      "blocking": true,
      "status": "complete"
    }
  ],
  "declaredOwnedPaths": [
    "docs/work/plans/unisane-ops-growth-capability-checklist.md",
    "packages/provider-meta/src/meta/marketing/__tests__/campaign-input.test.ts",
    "packages/provider-meta/src/meta/marketing/campaign-input.ts",
    "packages/provider-meta/src/meta/marketing/live-ads-executor.ts"
  ]
}
```
<!-- skopos:task-state:end -->
