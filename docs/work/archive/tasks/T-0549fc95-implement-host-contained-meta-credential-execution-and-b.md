---
title: "Task: Implement host-contained Meta credential execution and bounded read-only resource discovery"
status: complete
owner: "bhaskarbarma"
id: T-0549fc95
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-e63340272f50d842
lastUpdated: 2026-09-01
---

# Task: Implement host-contained Meta credential execution and bounded read-only resource discovery

## Changelog

- `2026-09-01`: Synchronized Task state `complete` from Skopos.

## Goal

Implement host-contained Meta credential execution and bounded read-only resource discovery

## Acceptance

- Provider Meta validates a host-owned callback context and performs bounded read-only identity, grant, business, ad-account, Pixel, dataset, Page, and Instagram discovery without returning credential material.
- Discovery enforces page and item bounds, safe error normalization, independent service failures, and no provider mutation.
- The host operation removes the retired token-returning placeholder and can execute discovery only through a supplied credential callback bound to the canonical connection context.
- Focused provider and host tests prove context rejection, secret non-exposure, resource normalization, pagination bounds, and partial-access behavior.

## Non-Goals

- Do not implement browser OAuth, accept raw access-token CLI/MCP arguments, publish credentials, select resources automatically, or make live Meta Graph calls.

## Constraints

- Preserve Unisane Ops, Growth, Provider Meta, and ECOM product boundaries.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.
- Reason: The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json`
- `docs/reference/generated/symbols/packages/unisane-ops.symbols.json`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks/snapshots/T-0549fc95-S-b0d15bb273ef.json`
- `packages/provider-meta/README.md`
- `packages/provider-meta/src/index.ts`
- `packages/provider-meta/src/meta`
- `packages/provider-meta/src/meta/marketing`
- `packages/unisane-ops/src/runtime-adapters/growth.test.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.ts`

## Ownership Expansions

- `2026-09-01T23:03:45.022Z` by `bhaskarbarma`: `docs/reference/generated/repository/standalone-repository-integrity.json`, `docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json`, `docs/reference/generated/symbols/packages/unisane-ops.symbols.json` — The new exported discovery contract and host adapter require their generated package slices and repository-integrity artifact to remain exact.
- `2026-09-01T23:08:50.386Z` by `bhaskarbarma`: `docs/work/tasks/snapshots/T-0549fc95-S-b0d15bb273ef.json` — The first high-impact snapshot is a generated artifact of this task and must be explicitly attributed before final closure.

## Steps

- [x] **Does this plan change authentication, authorization, privacy, or security-sensitive behavior?** (decision, complete) — Security and privacy decisions should be confirmed explicitly before the agent modifies behavior.
- [x] **Resolve plan decisions** (implementation, complete) — Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.
- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement host-contained Meta credential execution and bounded read-only resource discovery" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Provider Meta validates a host-owned callback context and performs bounded read-only identity, grant, business, ad-account, Pixel, dataset, Page, and Instagram discovery without returning credential material. (closure, agent-observation)
- Discovery enforces page and item bounds, safe error normalization, independent service failures, and no provider mutation. (closure, agent-observation)
- The host operation removes the retired token-returning placeholder and can execute discovery only through a supplied credential callback bound to the canonical connection context. (closure, agent-observation)
- Focused provider and host tests prove context rejection, secret non-exposure, resource normalization, pagination bounds, and partial-access behavior. (closure, agent-observation)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-0549fc95",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-01T22:49:35.493Z",
  "updatedAt": "2026-09-01T23:09:02.495Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Implement host-contained Meta credential execution and bounded read-only resource discovery",
  "goal": "Implement host-contained Meta credential execution and bounded read-only resource discovery",
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
      "Provider Meta validates a host-owned callback context and performs bounded read-only identity, grant, business, ad-account, Pixel, dataset, Page, and Instagram discovery without returning credential material.",
      "Discovery enforces page and item bounds, safe error normalization, independent service failures, and no provider mutation.",
      "The host operation removes the retired token-returning placeholder and can execute discovery only through a supplied credential callback bound to the canonical connection context.",
      "Focused provider and host tests prove context rejection, secret non-exposure, resource normalization, pagination bounds, and partial-access behavior."
    ],
    "nonGoals": [
      "Do not implement browser OAuth, accept raw access-token CLI/MCP arguments, publish credentials, select resources automatically, or make live Meta Graph calls."
    ],
    "constraints": [
      "Preserve Unisane Ops, Growth, Provider Meta, and ECOM product boundaries."
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
    "baselineId": "baseline-e63340272f50d842"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "decision-plan.security-privacy-change",
      "kind": "decision",
      "title": "Does this plan change authentication, authorization, privacy, or security-sensitive behavior?",
      "detail": "Security and privacy decisions should be confirmed explicitly before the agent modifies behavior.",
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
      "detail": "Carry out \"Implement host-contained Meta credential execution and bounded read-only resource discovery\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Provider Meta validates a host-owned callback context and performs bounded read-only identity, grant, business, ad-account, Pixel, dataset, Page, and Instagram discovery without returning credential material.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Discovery enforces page and item bounds, safe error normalization, independent service failures, and no provider mutation.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "The host operation removes the retired token-returning placeholder and can execute discovery only through a supplied credential callback bound to the canonical connection context.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused provider and host tests prove context rejection, secret non-exposure, resource normalization, pagination bounds, and partial-access behavior.",
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
      "reason": "The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
      "resolution": "memory-updated",
      "resolutionReason": "The architecture changelog and Meta discovery section now record the callback-only credential boundary, bounded discovery behavior, remaining onboarding/composition limits, and no-selection/no-mutation rule.",
      "resolvedAt": "2026-09-01T23:04:08.815Z",
      "resolvedByActorId": "bhaskarbarma"
    }
  ],
  "questions": [
    {
      "id": "plan.security-privacy-change",
      "category": "security",
      "escalation": "must-ask",
      "question": "Does this plan change authentication, authorization, privacy, or security-sensitive behavior?",
      "whyItMatters": "Security and privacy decisions should be confirmed explicitly before the agent modifies behavior.",
      "recommendedOptionId": "confirm-security-policy",
      "options": [
        {
          "id": "confirm-security-policy",
          "label": "Confirm policy first",
          "rationale": "Recommended because security-sensitive changes should follow an explicit policy choice."
        },
        {
          "id": "implement-fast-path",
          "label": "Implement fast path",
          "rationale": "Use only when the required policy is already settled and documented."
        },
        {
          "id": "no-security-change",
          "label": "No security change",
          "rationale": "Use when the classified wording does not actually change authentication, authorization, privacy, or security behavior."
        }
      ],
      "blocking": true,
      "status": "resolved",
      "resolvedOptionId": "implement-fast-path",
      "resolvedAt": "2026-09-01T22:50:05.139Z",
      "resolvedByActorId": "bhaskarbarma",
      "disposition": {
        "kind": "answered",
        "reason": "Selected Task question option implement-fast-path.",
        "actorId": "bhaskarbarma",
        "recordedAt": "2026-09-01T22:50:05.139Z",
        "target": {
          "kind": "option",
          "ref": "implement-fast-path"
        }
      }
    }
  ],
  "recommendations": [
    {
      "id": "resolve-plan.security-privacy-change",
      "title": "Resolve: Does this plan change authentication, authorization, privacy, or security-sensitive behavior?",
      "summary": "Security and privacy decisions should be confirmed explicitly before the agent modifies behavior.",
      "priority": "high",
      "actionKind": "resolve-question",
      "linkedQuestionId": "plan.security-privacy-change",
      "blocking": true,
      "status": "complete"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
        "docs/reference/generated/symbols/packages/unisane-ops.symbols.json"
      ],
      "reason": "The new exported discovery contract and host adapter require their generated package slices and repository-integrity artifact to remain exact.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T23:03:45.022Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "408707e934aee42571f85328ccf5ed32d52efb00006ab7da13205143de73b8de",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
          "digest": "0d733359b5d9c68dbe29c9897321d43098f443982f8f78d47312edd5598f583c",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/reference/generated/symbols/packages/unisane-ops.symbols.json",
          "digest": "0f6ee43c7eb65458c192dc7069cbba14234c93d355827671557a2c2f3573a495",
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
        "docs/work/tasks/snapshots/T-0549fc95-S-b0d15bb273ef.json"
      ],
      "reason": "The first high-impact snapshot is a generated artifact of this task and must be explicitly attributed before final closure.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-01T23:08:50.386Z",
      "baselinePaths": [
        {
          "path": "docs/work/tasks/snapshots/T-0549fc95-S-b0d15bb273ef.json",
          "digest": "884628974f55188d21ab3f81f5f852a630427e805e5f0b2393dda20e387d8383",
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
  "disposition": {
    "kind": "return-from-verification",
    "reason": "The first immutable snapshot was created; return briefly to add that artifact to explicit task ownership before final verification.",
    "actorId": "bhaskarbarma",
    "recordedAt": "2026-09-01T23:08:49.164Z",
    "priorState": "verifying",
    "nextState": "active"
  },
  "declaredOwnedPaths": [
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
    "docs/reference/generated/symbols/packages/unisane-ops.symbols.json",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks/snapshots/T-0549fc95-S-b0d15bb273ef.json",
    "packages/provider-meta/README.md",
    "packages/provider-meta/src/index.ts",
    "packages/provider-meta/src/meta",
    "packages/provider-meta/src/meta/marketing",
    "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.ts"
  ]
}
```
<!-- skopos:task-state:end -->
