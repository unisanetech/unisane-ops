---
title: "Task: Keep Meta Ads report credentials inside the host callback"
status: complete
owner: "project"
id: T-877f08de
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-fcc742db6ef4c2b7
lastUpdated: 2026-09-02
---

# Task: Keep Meta Ads report credentials inside the host callback

## Changelog

- `2026-09-02`: Synchronized Task state `complete` from Skopos.

## Goal

Keep Meta Ads report credentials inside the host callback

## Acceptance

- Growth Meta API report pulls never receive or return a raw access token
- The host validates the canonical project, environment, selected connection, ads_read grant, and exact selected ad account before the provider call
- Meta report pagination is bounded and pinned to the configured Graph API origin/version without leaking response bodies
- Meta live apply and asset upload fail closed until separately authorized credential callbacks exist
- Focused tests prove the credential and account-selection boundaries

## Non-Goals

- Live Meta API calls, OAuth setup, campaign mutations, asset uploads, or canonical outcome creation

## Constraints

- No secrets in logs, artifacts, errors, command inputs, or returned values
- No external provider mutation, commit, or push

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: Declared ownership spans 13 paths.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__growth.symbols.json`
- `docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json`
- `docs/reference/generated/symbols/packages/unisane-ops.symbols.json`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/current-plan.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks`
- `packages/growth/src/cli/commands/ads/apply/run.ts`
- `packages/growth/src/cli/commands/ads/assets/run.ts`
- `packages/growth/src/cli/commands/ads/pull/run.ts`
- `packages/growth/src/cli/commands/marketing/pull-api/run.ts`
- `packages/growth/src/cli/connections/meta.ts`
- `packages/growth/src/cli/provider-adapters.test.ts`
- `packages/growth/src/cli/provider-adapters.ts`
- `packages/growth/src/cli/provider-runtime.ts`
- `packages/growth/src/marketing/providers/api-pull-types.ts`
- `packages/provider-meta/src/index.ts`
- `packages/provider-meta/src/meta/credential-execution.ts`
- `packages/provider-meta/src/meta/marketing/__tests__/marketing-provider.test.ts`
- `packages/provider-meta/src/meta/marketing/report-pull.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.test.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.ts`

## Ownership Expansions

- `2026-09-02T07:47:30.118Z` by `bhaskarbarma`: `docs/standards/13-unisane-ops-product-architecture-baseline.md`, `packages/growth/src/cli/connections/meta.ts`, `packages/provider-meta/src/meta/marketing/__tests__/marketing-provider.test.ts` — The obsolete token-return helper must be removed, provider transport protections need focused tests, and the high-impact credential-boundary standard must be synchronized.
- `2026-09-02T08:00:30.089Z` by `bhaskarbarma`: `packages/growth/src/cli/provider-adapters.test.ts` — A focused Growth-side regression test must prove that even an accidentally supplied credential is stripped before the host command boundary.
- `2026-09-02T08:00:46.253Z` by `bhaskarbarma`: `packages/growth/src/marketing/providers/api-pull-types.ts` — The token-free report routing fields are part of the reviewed Growth API pull contract.
- `2026-09-02T08:03:51.819Z` by `bhaskarbarma`: `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md` — The authoritative Meta measurement roadmap must record that read-only Ads reporting is now host-contained while lifecycle onboarding and mutation remain open.
- `2026-09-02T08:09:07.218Z` by `bhaskarbarma`: `docs/reference/generated/repository/standalone-repository-integrity.json`, `docs/reference/generated/symbols/packages/@unisane__growth.symbols.json`, `docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json`, `docs/reference/generated/symbols/packages/unisane-ops.symbols.json` — The source contract changes make these generated symbol and repository-integrity artifacts stale; regeneration is required proof.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Keep Meta Ads report credentials inside the host callback" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Growth Meta API report pulls never receive or return a raw access token (closure, agent-observation)
- The host validates the canonical project, environment, selected connection, ads_read grant, and exact selected ad account before the provider call (closure, agent-observation)
- Meta report pagination is bounded and pinned to the configured Graph API origin/version without leaking response bodies (closure, agent-observation)
- Meta live apply and asset upload fail closed until separately authorized credential callbacks exist (closure, agent-observation)
- Focused tests prove the credential and account-selection boundaries (closure, agent-observation)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope workspace. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-877f08de",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-02T07:45:08.164Z",
  "updatedAt": "2026-09-02T08:17:04.822Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Keep Meta Ads report credentials inside the host callback",
  "goal": "Keep Meta Ads report credentials inside the host callback",
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
      "Growth Meta API report pulls never receive or return a raw access token",
      "The host validates the canonical project, environment, selected connection, ads_read grant, and exact selected ad account before the provider call",
      "Meta report pagination is bounded and pinned to the configured Graph API origin/version without leaking response bodies",
      "Meta live apply and asset upload fail closed until separately authorized credential callbacks exist",
      "Focused tests prove the credential and account-selection boundaries"
    ],
    "nonGoals": [
      "Live Meta API calls, OAuth setup, campaign mutations, asset uploads, or canonical outcome creation"
    ],
    "constraints": [
      "No secrets in logs, artifacts, errors, command inputs, or returned values",
      "No external provider mutation, commit, or push"
    ]
  },
  "risk": "high-impact",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "high-impact",
    "selectedDetail": "detailed",
    "selectionSource": "explicit-override",
    "workflow": "strict",
    "reasons": [
      "Declared ownership spans 13 paths."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 13,
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
    "baselineId": "baseline-fcc742db6ef4c2b7"
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
      "detail": "Carry out \"Keep Meta Ads report credentials inside the host callback\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Growth Meta API report pulls never receive or return a raw access token",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "The host validates the canonical project, environment, selected connection, ads_read grant, and exact selected ad account before the provider call",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Meta report pagination is bounded and pinned to the configured Graph API origin/version without leaking response bodies",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Meta live apply and asset upload fail closed until separately authorized credential callbacks exist",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Focused tests prove the credential and account-selection boundaries",
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
      "resolutionReason": "Updated the architecture baseline with the host-contained Meta Ads reporting boundary, exact selection/grant checks, bounded Graph pagination, safe errors, and mutation fail-closed state.",
      "resolvedAt": "2026-09-02T08:12:29.140Z",
      "resolvedByActorId": "bhaskarbarma"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 5 times. Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "medium",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-877f08de' 'Continue Keep Meta Ads report credentials inside the host callback as bounded follow-up work' . --scope 'workspace' --own 'docs/reference/generated/repository/standalone-repository-integrity.json' --own 'docs/reference/generated/symbols/packages/@unisane__growth.symbols.json' --own 'docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json' --own 'docs/reference/generated/symbols/packages/unisane-ops.symbols.json' --own 'docs/standards/13-unisane-ops-product-architecture-baseline.md' --own 'docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md' --own 'packages/growth/src/cli/connections/meta.ts' --own 'packages/growth/src/cli/provider-adapters.test.ts' --own 'packages/growth/src/marketing/providers/api-pull-types.ts' --own 'packages/provider-meta/src/meta/marketing/__tests__/marketing-provider.test.ts' --reason 'The Task may be drifting from its admitted subject because ownership expanded 5 times.' --actor 'bhaskarbarma'",
      "ownedPaths": [
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
        "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
        "docs/reference/generated/symbols/packages/unisane-ops.symbols.json",
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
        "packages/growth/src/cli/connections/meta.ts",
        "packages/growth/src/cli/provider-adapters.test.ts",
        "packages/growth/src/marketing/providers/api-pull-types.ts",
        "packages/provider-meta/src/meta/marketing/__tests__/marketing-provider.test.ts"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 5 times.",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "packages/growth/src/cli/connections/meta.ts",
        "packages/provider-meta/src/meta/marketing/__tests__/marketing-provider.test.ts"
      ],
      "reason": "The obsolete token-return helper must be removed, provider transport protections need focused tests, and the high-impact credential-boundary standard must be synchronized.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-02T07:47:30.118Z",
      "baselinePaths": [
        {
          "path": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
          "digest": "86234d64cc7c3ff5e1f38fa0efc34bf0b4b74dafae7950ab4d9dcdc4524d03d8",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/cli/connections/meta.ts",
          "digest": "bd6fb2874ba1271c147c75f4e00555920ddc72899c7b3d7e745197c2d4b7a459",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-meta/src/meta/marketing/__tests__/marketing-provider.test.ts",
          "digest": "e9ae17a180382883762d876aa8533ac7e7d059f6692d5a5e6cad90e3559b10f3",
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
        "packages/growth/src/cli/provider-adapters.test.ts"
      ],
      "reason": "A focused Growth-side regression test must prove that even an accidentally supplied credential is stripped before the host command boundary.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-02T08:00:30.089Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/cli/provider-adapters.test.ts",
          "digest": "23c542ba66c19330a4d56fd7ca057aff15fa4a97db11078a89dfb84a9c9a0fe6",
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
        "packages/growth/src/marketing/providers/api-pull-types.ts"
      ],
      "reason": "The token-free report routing fields are part of the reviewed Growth API pull contract.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-02T08:00:46.253Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/marketing/providers/api-pull-types.ts",
          "digest": "2db7d7bc0981e893e5d5ae707c5b5ca0ae78ac469703bd9d5cf61f13d18cf784",
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
        "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md"
      ],
      "reason": "The authoritative Meta measurement roadmap must record that read-only Ads reporting is now host-contained while lifecycle onboarding and mutation remain open.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-02T08:03:51.819Z",
      "baselinePaths": [
        {
          "path": "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
          "digest": "2c1ce6bebc10e721267669be00b279c9747e8abfaa40d992210e6e2231e0dc1c",
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
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
        "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
        "docs/reference/generated/symbols/packages/unisane-ops.symbols.json"
      ],
      "reason": "The source contract changes make these generated symbol and repository-integrity artifacts stale; regeneration is required proof.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-09-02T08:09:07.218Z",
      "baselinePaths": [
        {
          "path": "docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "408707e934aee42571f85328ccf5ed32d52efb00006ab7da13205143de73b8de",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
          "digest": "db61d70d83b293c8c60d00af4299ae947292bbba77a3cb0aecbc8e34ed37e5e4",
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
    }
  ],
  "declaredOwnedPaths": [
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
    "docs/reference/generated/symbols/packages/@unisane__provider-meta.symbols.json",
    "docs/reference/generated/symbols/packages/unisane-ops.symbols.json",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/current-plan.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks",
    "packages/growth/src/cli/commands/ads/apply/run.ts",
    "packages/growth/src/cli/commands/ads/assets/run.ts",
    "packages/growth/src/cli/commands/ads/pull/run.ts",
    "packages/growth/src/cli/commands/marketing/pull-api/run.ts",
    "packages/growth/src/cli/connections/meta.ts",
    "packages/growth/src/cli/provider-adapters.test.ts",
    "packages/growth/src/cli/provider-adapters.ts",
    "packages/growth/src/cli/provider-runtime.ts",
    "packages/growth/src/marketing/providers/api-pull-types.ts",
    "packages/provider-meta/src/index.ts",
    "packages/provider-meta/src/meta/credential-execution.ts",
    "packages/provider-meta/src/meta/marketing/__tests__/marketing-provider.test.ts",
    "packages/provider-meta/src/meta/marketing/report-pull.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.ts"
  ]
}
```
<!-- skopos:task-state:end -->
