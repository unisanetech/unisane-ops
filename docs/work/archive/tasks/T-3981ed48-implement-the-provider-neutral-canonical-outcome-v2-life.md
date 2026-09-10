---
title: "Task: Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating"
status: complete
owner: "bhaskarbarma"
id: T-3981ed48
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-00648760caeb78a4
lastUpdated: 2026-08-31
---

# Task: Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating

## Changelog

- `2026-08-31`: Synchronized Task state `complete` from Skopos.

## Goal

Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating

## Acceptance

- Canonical outcome v2 strictly binds project, environment, source identity, exact window, revision, server-confirmed finality, status, occurred-at time, redacted correlation, count, value, and uppercase currency without raw customer data.
- Corrections and reversals are append-only revisions; ingestion is idempotent, rejects collisions/conflicting revisions, preserves history, provides an explicit v1 migration, and rejects v1 during ordinary loading.
- Local artifact ingestion and Growth loading validate project, environment, source, window, revision, bounded size, finality, currency/value consistency, freshness, and partial/conflicting evidence without deriving canonical truth from providers.
- The measurement audit remains blocked when canonical outcomes are missing, stale, partial, conflicting, non-final, or fully reversed, while provider-attributed conversions remain a separate comparison model.
- Focused lifecycle, migration, privacy, aggregation, trust-gating, compatibility, type, lint, build, format, symbol, generated-output, and repository-integrity proof passes.

## Non-Goals

- Do not integrate ECOM source, call Meta or another provider, publish GTM, add provider credentials, or infer business truth from tracking or attribution.

## Constraints

- Growth owns canonical business-outcome semantics; adopters own business finality and submit only bounded redacted evidence.
- Preserve correction and reversal history; never rewrite an earlier accepted revision or invent missing values.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: Declared ownership spans 14 paths.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__growth.symbols.json`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks/snapshots/T-3981ed48-S-111461b88e45.json`
- `packages/growth/src/actions/measurement-audit.test.ts`
- `packages/growth/src/actions/measurement-audit.ts`
- `packages/growth/src/cli/commands/marketing/conversion-pull`
- `packages/growth/src/cli/commands/marketing/register.ts`
- `packages/growth/src/marketing/ads/readiness.ts`
- `packages/growth/src/marketing/index.ts`
- `packages/growth/src/marketing/reports/confirmed-conversions.test.ts`
- `packages/growth/src/marketing/reports/confirmed-conversions.ts`
- `packages/growth/src/marketing/reports/metrics.ts`
- `packages/growth/src/marketing/reports/status.ts`
- `packages/growth/src/marketing/reports/strategy-object-report.ts`
- `packages/growth/src/marketing/reports/unified-report.ts`
- `packages/growth/src/marketing/schema/report.ts`
- `packages/growth/src/playbooks/measurement-audit.test.ts`
- `packages/growth/src/playbooks/measurement-audit.ts`
- `packages/growth/src/workflows/measurement-audit-execution.test.ts`
- `packages/growth/src/workflows/measurement-audit-execution.ts`

## Ownership Expansions

- `2026-08-31T22:18:18.197Z` by `bhaskarbarma`: `packages/growth/src/marketing/reports/confirmed-conversions.test.ts` — Add focused v2 schema, migration, replay, collision, and append-only ingestion coverage.
- `2026-08-31T22:18:45.023Z` by `bhaskarbarma`: `packages/growth/src/marketing/reports/strategy-object-report.ts` — Update the only canonical-record consumer to match provider-neutral v2 outcome and strategy-object references.
- `2026-08-31T22:36:17.493Z` by `bhaskarbarma`: `packages/growth/src/cli/commands/marketing/register.ts` — Align conversion-pull CLI help with strict v2 artifact ingestion and remove misleading normalization flags.
- `2026-08-31T22:37:45.961Z` by `bhaskarbarma`: `packages/growth/src/marketing/ads/readiness.ts`, `packages/growth/src/marketing/reports/status.ts`, `packages/growth/src/marketing/reports/unified-report.ts` — Ensure every existing Growth consumer treats non-fresh canonical outcomes as unavailable for optimization rather than only checking parse errors.
- `2026-08-31T22:41:39.447Z` by `bhaskarbarma`: `docs/standards/13-unisane-ops-product-architecture-baseline.md` — Synchronize the required architecture Memory with the canonical outcome v2 authority, privacy, revision, and trust-gating rules.
- `2026-08-31T22:51:38.565Z` by `bhaskarbarma`: `docs/work/tasks/snapshots/T-3981ed48-S-111461b88e45.json` — Adopt the immutable Task snapshot generated by Skopos for this high-impact closure.

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Canonical outcome v2 strictly binds project, environment, source identity, exact window, revision, server-confirmed finality, status, occurred-at time, redacted correlation, count, value, and uppercase currency without raw customer data. (closure, agent-observation)
- Corrections and reversals are append-only revisions; ingestion is idempotent, rejects collisions/conflicting revisions, preserves history, provides an explicit v1 migration, and rejects v1 during ordinary loading. (closure, agent-observation)
- Local artifact ingestion and Growth loading validate project, environment, source, window, revision, bounded size, finality, currency/value consistency, freshness, and partial/conflicting evidence without deriving canonical truth from providers. (closure, agent-observation)
- The measurement audit remains blocked when canonical outcomes are missing, stale, partial, conflicting, non-final, or fully reversed, while provider-attributed conversions remain a separate comparison model. (closure, agent-observation)
- Focused lifecycle, migration, privacy, aggregation, trust-gating, compatibility, type, lint, build, format, symbol, generated-output, and repository-integrity proof passes. (closure, agent-observation)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope workspace. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-3981ed48",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-31T22:11:26.237Z",
  "updatedAt": "2026-08-31T22:52:18.663Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating",
  "goal": "Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating",
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
      "Canonical outcome v2 strictly binds project, environment, source identity, exact window, revision, server-confirmed finality, status, occurred-at time, redacted correlation, count, value, and uppercase currency without raw customer data.",
      "Corrections and reversals are append-only revisions; ingestion is idempotent, rejects collisions/conflicting revisions, preserves history, provides an explicit v1 migration, and rejects v1 during ordinary loading.",
      "Local artifact ingestion and Growth loading validate project, environment, source, window, revision, bounded size, finality, currency/value consistency, freshness, and partial/conflicting evidence without deriving canonical truth from providers.",
      "The measurement audit remains blocked when canonical outcomes are missing, stale, partial, conflicting, non-final, or fully reversed, while provider-attributed conversions remain a separate comparison model.",
      "Focused lifecycle, migration, privacy, aggregation, trust-gating, compatibility, type, lint, build, format, symbol, generated-output, and repository-integrity proof passes."
    ],
    "nonGoals": [
      "Do not integrate ECOM source, call Meta or another provider, publish GTM, add provider credentials, or infer business truth from tracking or attribution."
    ],
    "constraints": [
      "Growth owns canonical business-outcome semantics; adopters own business finality and submit only bounded redacted evidence.",
      "Preserve correction and reversal history; never rewrite an earlier accepted revision or invent missing values."
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
      "Declared ownership spans 14 paths."
    ],
    "signals": {
      "goalSignals": [],
      "ownedPathCount": 14,
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
    "baselineId": "baseline-00648760caeb78a4"
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
      "detail": "Carry out \"Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Canonical outcome v2 strictly binds project, environment, source identity, exact window, revision, server-confirmed finality, status, occurred-at time, redacted correlation, count, value, and uppercase currency without raw customer data.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Corrections and reversals are append-only revisions; ingestion is idempotent, rejects collisions/conflicting revisions, preserves history, provides an explicit v1 migration, and rejects v1 during ordinary loading.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Local artifact ingestion and Growth loading validate project, environment, source, window, revision, bounded size, finality, currency/value consistency, freshness, and partial/conflicting evidence without deriving canonical truth from providers.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "The measurement audit remains blocked when canonical outcomes are missing, stale, partial, conflicting, non-final, or fully reversed, while provider-attributed conversions remain a separate comparison model.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Focused lifecycle, migration, privacy, aggregation, trust-gating, compatibility, type, lint, build, format, symbol, generated-output, and repository-integrity proof passes.",
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
      "resolutionReason": "Recorded the canonical outcome v2 authority, redaction, revision-chain, migration, and fail-closed trust rules in the architecture baseline.",
      "resolvedAt": "2026-08-31T22:46:02.719Z",
      "resolvedByActorId": "bhaskarbarma"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 6 times. Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "medium",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-3981ed48' 'Continue Implement the provider-neutral canonical outcome v2 lifecycle and measurement trust gating as bounded follow-up work' . --scope 'workspace' --own 'docs/standards/13-unisane-ops-product-architecture-baseline.md' --own 'docs/work/tasks/snapshots/T-3981ed48-S-111461b88e45.json' --own 'packages/growth/src/cli/commands/marketing/register.ts' --own 'packages/growth/src/marketing/ads/readiness.ts' --own 'packages/growth/src/marketing/reports/confirmed-conversions.test.ts' --own 'packages/growth/src/marketing/reports/status.ts' --own 'packages/growth/src/marketing/reports/strategy-object-report.ts' --own 'packages/growth/src/marketing/reports/unified-report.ts' --reason 'The Task may be drifting from its admitted subject because ownership expanded 6 times.' --actor 'bhaskarbarma'",
      "ownedPaths": [
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "docs/work/tasks/snapshots/T-3981ed48-S-111461b88e45.json",
        "packages/growth/src/cli/commands/marketing/register.ts",
        "packages/growth/src/marketing/ads/readiness.ts",
        "packages/growth/src/marketing/reports/confirmed-conversions.test.ts",
        "packages/growth/src/marketing/reports/status.ts",
        "packages/growth/src/marketing/reports/strategy-object-report.ts",
        "packages/growth/src/marketing/reports/unified-report.ts"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 6 times.",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "packages/growth/src/marketing/reports/confirmed-conversions.test.ts"
      ],
      "reason": "Add focused v2 schema, migration, replay, collision, and append-only ingestion coverage.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T22:18:18.197Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/marketing/reports/confirmed-conversions.test.ts",
          "digest": "c741529fff138771ffe43897f86e2e2b8d499014fabec9dec3d459ae8419bb24",
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
        "packages/growth/src/marketing/reports/strategy-object-report.ts"
      ],
      "reason": "Update the only canonical-record consumer to match provider-neutral v2 outcome and strategy-object references.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T22:18:45.023Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/marketing/reports/strategy-object-report.ts",
          "digest": "36923cece7a28bcba720292e8fc506364da512b204ab34442f582c883b0b74b5",
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
        "packages/growth/src/cli/commands/marketing/register.ts"
      ],
      "reason": "Align conversion-pull CLI help with strict v2 artifact ingestion and remove misleading normalization flags.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T22:36:17.493Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/cli/commands/marketing/register.ts",
          "digest": "fdabe8992bafcebc62dab7ac4ea82178e22fc0780c9e387a6bb88ae899f71860",
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
        "packages/growth/src/marketing/ads/readiness.ts",
        "packages/growth/src/marketing/reports/status.ts",
        "packages/growth/src/marketing/reports/unified-report.ts"
      ],
      "reason": "Ensure every existing Growth consumer treats non-fresh canonical outcomes as unavailable for optimization rather than only checking parse errors.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T22:37:45.961Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/marketing/ads/readiness.ts",
          "digest": "abd932964e5bc3fc69ab63da6f3102be459272c93f3a50df320b47d931880ead",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/marketing/reports/status.ts",
          "digest": "d17297763940021ff6bd79cd34863fc81da3ff18898b694e57381e42e52fe322",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/marketing/reports/unified-report.ts",
          "digest": "e4b4348769734be6934a81b7920ef891f98c46d6abb8c46907538a5d9e50d62a",
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
        "docs/standards/13-unisane-ops-product-architecture-baseline.md"
      ],
      "reason": "Synchronize the required architecture Memory with the canonical outcome v2 authority, privacy, revision, and trust-gating rules.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T22:41:39.447Z",
      "baselinePaths": [
        {
          "path": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
          "digest": "fc9437ec39dd1d098d6c3d23a7eb6f73ca53d90150df78d3c03411178f4c8102",
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
        "docs/work/tasks/snapshots/T-3981ed48-S-111461b88e45.json"
      ],
      "reason": "Adopt the immutable Task snapshot generated by Skopos for this high-impact closure.",
      "actorId": "bhaskarbarma",
      "recordedAt": "2026-08-31T22:51:38.565Z",
      "baselinePaths": [
        {
          "path": "docs/work/tasks/snapshots/T-3981ed48-S-111461b88e45.json",
          "digest": "5acc97c28647e6731bea2fb1aaefdb9f96111d2eb2c9f4d32790f2b70a56c416",
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
    "reason": "Adopt the Skopos-generated immutable snapshot before final source-bound verification.",
    "actorId": "bhaskarbarma",
    "recordedAt": "2026-08-31T22:51:27.093Z",
    "priorState": "verifying",
    "nextState": "active"
  },
  "declaredOwnedPaths": [
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks/snapshots/T-3981ed48-S-111461b88e45.json",
    "packages/growth/src/actions/measurement-audit.test.ts",
    "packages/growth/src/actions/measurement-audit.ts",
    "packages/growth/src/cli/commands/marketing/conversion-pull",
    "packages/growth/src/cli/commands/marketing/register.ts",
    "packages/growth/src/marketing/ads/readiness.ts",
    "packages/growth/src/marketing/index.ts",
    "packages/growth/src/marketing/reports/confirmed-conversions.test.ts",
    "packages/growth/src/marketing/reports/confirmed-conversions.ts",
    "packages/growth/src/marketing/reports/metrics.ts",
    "packages/growth/src/marketing/reports/status.ts",
    "packages/growth/src/marketing/reports/strategy-object-report.ts",
    "packages/growth/src/marketing/reports/unified-report.ts",
    "packages/growth/src/marketing/schema/report.ts",
    "packages/growth/src/playbooks/measurement-audit.test.ts",
    "packages/growth/src/playbooks/measurement-audit.ts",
    "packages/growth/src/workflows/measurement-audit-execution.test.ts",
    "packages/growth/src/workflows/measurement-audit-execution.ts"
  ]
}
```
<!-- skopos:task-state:end -->
