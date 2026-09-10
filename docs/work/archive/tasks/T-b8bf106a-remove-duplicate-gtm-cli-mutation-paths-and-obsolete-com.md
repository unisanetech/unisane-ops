---
title: "Task: Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers"
status: complete
owner: "codex"
id: T-b8bf106a
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-155ec0e5e8a23c74
lastUpdated: 2026-09-06
---

# Task: Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers

## Changelog

- `2026-09-06`: Synchronized Task state `complete` from Skopos.

## Goal

Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers

## Acceptance

- Only shared workspace and release commands perform GTM mutations; old CLI commands and private approval helpers are removed without aliases
- Preserve read-only tools, canonical action safety and stored-history guards; audit other fallbacks by their callers
- Update active documentation and command inventory and prove command discovery plus affected tests build types lint

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

- `apps/console/src/browser/screens/analytics/tag-manager-workspace.tsx`
- `docs`
- `packages/growth/pack.manifest.json`
- `packages/growth/src/cli/commands/gtm`
- `packages/growth/src/cli/provider-runtime.ts`
- `packages/growth/src/cli/register.ts`
- `packages/growth/src/console/tag-manager.test.ts`
- `packages/growth/src/console/tag-manager.ts`
- `packages/growth/src/gtm/contracts.ts`
- `packages/growth/src/gtm/provider.ts`
- `packages/growth/src/gtm/release/adapter.ts`
- `packages/provider-google/src/google/tag-manager/apply.test.ts`
- `packages/provider-google/src/google/tag-manager/apply.ts`
- `packages/provider-google/src/google/tag-manager/index.ts`
- `packages/provider-google/src/google/tag-manager/provider.ts`
- `packages/provider-google/src/google/tag-manager/versioning.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.test.ts`
- `packages/unisane-ops/src/runtime-adapters/growth.ts`
- `packages/unisane-ops/test`

## Ownership Expansions

- `2026-09-06T09:31:45.870Z` by `codex`: `packages/growth/src/cli/provider-runtime.ts`, `packages/unisane-ops/src/runtime-adapters/growth.ts` — Remove now-unused raw provider mutation dispatch routes along with duplicate CLI callers.
- `2026-09-06T09:32:50.866Z` by `codex`: `packages/provider-google/src/google/tag-manager/apply.test.ts`, `packages/provider-google/src/google/tag-manager/apply.ts` — Replace unsafe fabricated provider resource-ID fallback with an explicit incomplete-response error.
- `2026-09-06T09:34:05.975Z` by `codex`: `apps/console/src/browser/screens/analytics/tag-manager-workspace.tsx`, `packages/growth/src/console/tag-manager.test.ts`, `packages/growth/src/console/tag-manager.ts`, `packages/growth/src/gtm/contracts.ts`, `packages/growth/src/gtm/provider.ts`, `packages/provider-google/src/google/tag-manager/index.ts`, `packages/provider-google/src/google/tag-manager/provider.ts`, `packages/provider-google/src/google/tag-manager/versioning.ts` — Remove stale console command-overlay suggestions and the unused rollback alias/type; shared controls and exact prior-version publication already replace them.
- `2026-09-06T09:34:46.840Z` by `codex`: `packages/growth/src/gtm/release/adapter.ts` — Require the version-read methods supplied by the canonical provider instead of optional legacy adapter methods.
- `2026-09-06T09:35:11.298Z` by `codex`: `packages/growth/src/cli/register.ts` — Update the CLI public barrel to the canonical GTM exports after removing the redundant barrel.
- `2026-09-06T09:35:40.896Z` by `codex`: `packages/unisane-ops/src/runtime-adapters/growth.test.ts` — Prove removed raw GTM provider routes reject requests before reaching a provider.

## Steps

- [x] **Should this plan change a public contract, route, or SDK surface?** (decision, complete) — Public-facing changes need explicit confirmation so the agent does not silently ship a breaking contract.
- [x] **Resolve plan decisions** (implementation, complete) — Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.
- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Only shared workspace and release commands perform GTM mutations; old CLI commands and private approval helpers are removed without aliases (closure, agent-observation)
- Preserve read-only tools, canonical action safety and stored-history guards; audit other fallbacks by their callers (closure, agent-observation)
- Update active documentation and command inventory and prove command discovery plus affected tests build types lint (closure, agent-observation)

## Memory Obligations

- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md`); resolution: reviewed-no-change
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md`); resolution: reviewed-no-change
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md`); resolution: reviewed-no-change
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md`); resolution: reviewed-no-change
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md`); resolution: reviewed-no-change
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/README.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/README.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/growth-provider-operations.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/research-provider-evidence.md`); resolution: reviewed-no-change
- [complete] guide: The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes. (target: `docs/guides/true-resume/ads-asset-provider-operations.md`); resolution: reviewed-no-change
- [complete] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-b8bf106a",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-06T09:31:14.727Z",
  "updatedAt": "2026-09-06T09:38:04.205Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers",
  "goal": "Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers",
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
      "Only shared workspace and release commands perform GTM mutations; old CLI commands and private approval helpers are removed without aliases",
      "Preserve read-only tools, canonical action safety and stored-history guards; audit other fallbacks by their callers",
      "Update active documentation and command inventory and prove command discovery plus affected tests build types lint"
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
    "baselineId": "baseline-155ec0e5e8a23c74"
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
      "detail": "Carry out \"Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Only shared workspace and release commands perform GTM mutations; old CLI commands and private approval helpers are removed without aliases",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Preserve read-only tools, canonical action safety and stored-history guards; audit other fallbacks by their callers",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Update active documentation and command inventory and prove command discovery plus affected tests build types lint",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-decision-341f18b2e8",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:53.904Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-decision-a11c64f03d",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:54.731Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-decision-c88570410c",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:55.562Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-decision-cfb606b23c",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:56.390Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-decision-d104bbc751",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:57.222Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-decision-e72ef0e604",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:58.057Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-03b65e013f",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/README.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/README.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:58.898Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-be05fc0cf4",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/growth-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/growth-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:37:59.734Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-d5ad057196",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/research-provider-evidence.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/research-provider-evidence.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:38:00.576Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-guide-e15f796386",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/true-resume/ads-asset-provider-operations.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/guides/true-resume/ads-asset-provider-operations.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Reviewed GTM and mutation guidance; cleanup implements existing shared-action ownership. Historical decisions and adopter guides need no contract change.",
      "resolvedAt": "2026-09-06T09:38:01.416Z",
      "resolvedByActorId": "codex"
    },
    {
      "id": "memory-standard-2653e0fd89",
      "role": "standard",
      "reason": "The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
      "resolution": "memory-updated",
      "resolutionReason": "Documented the single shared GTM execution path in the architecture baseline.",
      "resolvedAt": "2026-09-06T09:36:28.258Z",
      "resolvedByActorId": "codex"
    }
  ],
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
      "resolvedAt": "2026-09-06T09:31:30.314Z",
      "resolvedByActorId": "codex",
      "disposition": {
        "kind": "answered",
        "reason": "Selected Task question option confirm-contract-first.",
        "actorId": "codex",
        "recordedAt": "2026-09-06T09:31:30.314Z",
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
    },
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 6 times. Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "medium",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-b8bf106a' 'Continue Remove duplicate GTM CLI mutation paths and obsolete compatibility helpers as bounded follow-up work' . --scope 'workspace' --own 'apps/console/src/browser/screens/analytics/tag-manager-workspace.tsx' --own 'packages/growth/src/cli/provider-runtime.ts' --own 'packages/growth/src/cli/register.ts' --own 'packages/growth/src/console/tag-manager.test.ts' --own 'packages/growth/src/console/tag-manager.ts' --own 'packages/growth/src/gtm/contracts.ts' --own 'packages/growth/src/gtm/provider.ts' --own 'packages/growth/src/gtm/release/adapter.ts' --own 'packages/provider-google/src/google/tag-manager/apply.test.ts' --own 'packages/provider-google/src/google/tag-manager/apply.ts' --own 'packages/provider-google/src/google/tag-manager/index.ts' --own 'packages/provider-google/src/google/tag-manager/provider.ts' --own 'packages/provider-google/src/google/tag-manager/versioning.ts' --own 'packages/unisane-ops/src/runtime-adapters/growth.test.ts' --own 'packages/unisane-ops/src/runtime-adapters/growth.ts' --reason 'The Task may be drifting from its admitted subject because ownership expanded 6 times.' --actor 'codex'",
      "ownedPaths": [
        "apps/console/src/browser/screens/analytics/tag-manager-workspace.tsx",
        "packages/growth/src/cli/provider-runtime.ts",
        "packages/growth/src/cli/register.ts",
        "packages/growth/src/console/tag-manager.test.ts",
        "packages/growth/src/console/tag-manager.ts",
        "packages/growth/src/gtm/contracts.ts",
        "packages/growth/src/gtm/provider.ts",
        "packages/growth/src/gtm/release/adapter.ts",
        "packages/provider-google/src/google/tag-manager/apply.test.ts",
        "packages/provider-google/src/google/tag-manager/apply.ts",
        "packages/provider-google/src/google/tag-manager/index.ts",
        "packages/provider-google/src/google/tag-manager/provider.ts",
        "packages/provider-google/src/google/tag-manager/versioning.ts",
        "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
        "packages/unisane-ops/src/runtime-adapters/growth.ts"
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
        "packages/growth/src/cli/provider-runtime.ts",
        "packages/unisane-ops/src/runtime-adapters/growth.ts"
      ],
      "reason": "Remove now-unused raw provider mutation dispatch routes along with duplicate CLI callers.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T09:31:45.870Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/cli/provider-runtime.ts",
          "digest": "ee4de222cdb41b2f66cc13d7441835e8876734aa308bb188210cfee3cb986c76",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/unisane-ops/src/runtime-adapters/growth.ts",
          "digest": "582410b98f10680810cca37ec1ad88d3de4f3918f15a4ccdcad481a0d75af0f3",
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
        "packages/provider-google/src/google/tag-manager/apply.test.ts",
        "packages/provider-google/src/google/tag-manager/apply.ts"
      ],
      "reason": "Replace unsafe fabricated provider resource-ID fallback with an explicit incomplete-response error.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T09:32:50.866Z",
      "baselinePaths": [
        {
          "path": "packages/provider-google/src/google/tag-manager/apply.test.ts",
          "digest": "e7615ec593ac3cdbb237668cb8fb3de40194ac5fda9b961e96432e389cd10c64",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-google/src/google/tag-manager/apply.ts",
          "digest": "0b72f3c083f578709c25982791e89cc8d40b1719d977c2b16c6ec4bed2e038bc",
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
        "apps/console/src/browser/screens/analytics/tag-manager-workspace.tsx",
        "packages/growth/src/console/tag-manager.test.ts",
        "packages/growth/src/console/tag-manager.ts",
        "packages/growth/src/gtm/contracts.ts",
        "packages/growth/src/gtm/provider.ts",
        "packages/provider-google/src/google/tag-manager/index.ts",
        "packages/provider-google/src/google/tag-manager/provider.ts",
        "packages/provider-google/src/google/tag-manager/versioning.ts"
      ],
      "reason": "Remove stale console command-overlay suggestions and the unused rollback alias/type; shared controls and exact prior-version publication already replace them.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T09:34:05.975Z",
      "baselinePaths": [
        {
          "path": "apps/console/src/browser/screens/analytics/tag-manager-workspace.tsx",
          "digest": "d0e0855fd045740fb3eebae903da0342ca8e70a3e6be05f3973396e026e63cec",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/console/tag-manager.test.ts",
          "digest": "87745b4490a850453b4e364f9bd10f42e78f1677334a99c9b535317248531247",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/console/tag-manager.ts",
          "digest": "2d46a149e7aa74de0ba3b1d93a94206cb185c233ff953e32007df09962b4f172",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/gtm/contracts.ts",
          "digest": "2a4c84bb792b02410b19b33c68e5231436ca71c4f25430471070b395d6470de7",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/src/gtm/provider.ts",
          "digest": "dada52b63618a62663d26e7fb808fdcf77268ea2cd454ffd4f8321acf021f557",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-google/src/google/tag-manager/index.ts",
          "digest": "eccd89fdc3b151846da9705333baf1567d7d968b3f074f065369875ec337cb8f",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-google/src/google/tag-manager/provider.ts",
          "digest": "99b94956be98e7a4e188701b47a34e116564b6d2df6910cdbdd6fb769d1d370a",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-google/src/google/tag-manager/versioning.ts",
          "digest": "90bf72aeffe53bc227a0eb7da1c5fcfd1081242abc4f2cfb07b983394813041a",
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
        "packages/growth/src/gtm/release/adapter.ts"
      ],
      "reason": "Require the version-read methods supplied by the canonical provider instead of optional legacy adapter methods.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T09:34:46.840Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/gtm/release/adapter.ts",
          "digest": "61843dedf1e08253014874a096df449696415a98c06c7efec6c908e7132ae649",
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
        "packages/growth/src/cli/register.ts"
      ],
      "reason": "Update the CLI public barrel to the canonical GTM exports after removing the redundant barrel.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T09:35:11.298Z",
      "baselinePaths": [
        {
          "path": "packages/growth/src/cli/register.ts",
          "digest": "ecdcbb60c51aca25af60c2a38f505cb4bd433ca126e64a9ce5766287805cba47",
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
        "packages/unisane-ops/src/runtime-adapters/growth.test.ts"
      ],
      "reason": "Prove removed raw GTM provider routes reject requests before reaching a provider.",
      "actorId": "codex",
      "recordedAt": "2026-09-06T09:35:40.896Z",
      "baselinePaths": [
        {
          "path": "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
          "digest": "72ced5d460e22d3badfea4801d178b5f2b3945499f1cd6e1631db96e79bbe20d",
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
    "apps/console/src/browser/screens/analytics/tag-manager-workspace.tsx",
    "docs",
    "packages/growth/pack.manifest.json",
    "packages/growth/src/cli/commands/gtm",
    "packages/growth/src/cli/provider-runtime.ts",
    "packages/growth/src/cli/register.ts",
    "packages/growth/src/console/tag-manager.test.ts",
    "packages/growth/src/console/tag-manager.ts",
    "packages/growth/src/gtm/contracts.ts",
    "packages/growth/src/gtm/provider.ts",
    "packages/growth/src/gtm/release/adapter.ts",
    "packages/provider-google/src/google/tag-manager/apply.test.ts",
    "packages/provider-google/src/google/tag-manager/apply.ts",
    "packages/provider-google/src/google/tag-manager/index.ts",
    "packages/provider-google/src/google/tag-manager/provider.ts",
    "packages/provider-google/src/google/tag-manager/versioning.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.test.ts",
    "packages/unisane-ops/src/runtime-adapters/growth.ts",
    "packages/unisane-ops/test"
  ]
}
```
<!-- skopos:task-state:end -->
