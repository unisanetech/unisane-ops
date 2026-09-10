---
title: "Task: Prepare private Ops npm packages and scoped CLI for hosted consumers"
status: active
owner: "codex-ops-release"
id: T-02360489
scope: "workspace"
role: task
lifecycle: active
authority: canonical
provenance: accepted
view: current
risk: standard
proofSubject: task-closure
proofBaseline: baseline-fd78fbe0fa06a191
lastUpdated: 2026-09-10
---

# Task: Prepare private Ops npm packages and scoped CLI for hosted consumers

## Changelog

- `2026-09-10`: Synchronized Task state `active` from Skopos.

## Goal

Prepare private Ops npm packages and scoped CLI for hosted consumers

## Acceptance

- Private npm artifacts use a scoped CLI package, exact dependencies, verified exports and a clean consumer proof

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

- `.github/workflows`
- `.gitignore`
- `apps/console/package.json`
- `docs/decisions`
- `docs/reference/generated`
- `packages`
- `packages/unisane-ops`
- `pnpm-lock.yaml`
- `release`
- `scripts`
- `tests`
- `tools/repository/console-release-boundary-policy.json`
- `tools/repository/standalone-integrity-policy.json`

## Ownership Expansions

- `2026-09-10T15:27:59.199Z` by `codex-ops-release`: `docs/decisions`, `docs/reference/generated`, `packages`, `tools/repository/standalone-integrity-policy.json` — Private Ops publication requires consistent package identities, admission policy and generated references
- `2026-09-10T15:36:09.461Z` by `codex-ops-release`: `.gitignore`, `apps/console/package.json` — Exclude release outputs and align the console with its already admitted published UI versions
- `2026-09-10T18:23:33.116Z` by `codex-ops-release`: `tests`, `tools/repository/console-release-boundary-policy.json` — Refresh actual published UI consumer evidence and verify cold CI installation before Ops release

## Steps

- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [ ] **Implement the smallest scoped change** (implementation, pending) — Carry out "Prepare private Ops npm packages and scoped CLI for hosted consumers" inside the resolved scope before widening impact to adjacent areas.
- [ ] **Sync docs and instruction surfaces if touched** (docs, pending) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Private npm artifacts use a scoped CLI package, exact dependencies, verified exports and a clean consumer proof (closure, agent-observation)

## Memory Obligations

- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260910-private-npm-canary.md`); resolution: memory-updated
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md`); resolution: reviewed-no-change
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260910-private-npm-canary.md`); resolution: memory-updated
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260910-private-npm-canary.md`); resolution: memory-updated
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md`); resolution: reviewed-no-change
- [complete] decision: The declared Task scope owns canonical decision Memory at docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md; review and synchronize it if project truth changes. (target: `docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md`); resolution: reviewed-no-change

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-02360489",
  "type": "task",
  "status": "active",
  "generatedAt": "2026-09-10T15:25:55.497Z",
  "updatedAt": "2026-09-10T19:12:35.081Z",
  "planIds": [],
  "childTasks": [],
  "state": "active",
  "detail": "standard",
  "title": "Prepare private Ops npm packages and scoped CLI for hosted consumers",
  "goal": "Prepare private Ops npm packages and scoped CLI for hosted consumers",
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
      "Private npm artifacts use a scoped CLI package, exact dependencies, verified exports and a clean consumer proof"
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
      "ownedPathCount": 5,
      "affectedScopeIds": [
        "workspace"
      ],
      "impactCategories": [
        "workspace-file"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-fd78fbe0fa06a191"
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
      "detail": "Carry out \"Prepare private Ops npm packages and scoped CLI for hosted consumers\" inside the resolved scope before widening impact to adjacent areas.",
      "status": "pending"
    },
    {
      "id": "step-sync-knowledge",
      "kind": "docs",
      "title": "Sync docs and instruction surfaces if touched",
      "detail": "Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.",
      "status": "pending"
    }
  ],
  "selectedActions": [],
  "selectedGuardIds": [],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "Private npm artifacts use a scoped CLI package, exact dependencies, verified exports and a clean consumer proof",
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
      "targetPath": "docs/decisions/D-20260910-private-npm-canary.md",
      "resolution": "memory-updated",
      "resolutionReason": "Routed current package identity and restricted distribution to the approved September 10 decision; descriptor-only action ownership is unchanged.",
      "resolvedAt": "2026-09-10T18:43:46.044Z",
      "resolvedByActorId": "codex-ops-release"
    },
    {
      "id": "memory-decision-a11c64f03d",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Private npm packaging does not change AI action or hosted runtime behavior and ownership.",
      "resolvedAt": "2026-09-10T18:43:49.052Z",
      "resolvedByActorId": "codex-ops-release"
    },
    {
      "id": "memory-decision-c88570410c",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260910-private-npm-canary.md",
      "resolution": "memory-updated",
      "resolutionReason": "Documented the approved private package distribution and scoped CLI as superseding earlier distribution statements.",
      "resolvedAt": "2026-09-10T18:43:47.064Z",
      "resolvedByActorId": "codex-ops-release"
    },
    {
      "id": "memory-decision-cfb606b23c",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260910-private-npm-canary.md",
      "resolution": "memory-updated",
      "resolutionReason": "Provider Meta is included in the approved restricted package release; provider capability ownership is unchanged.",
      "resolvedAt": "2026-09-10T18:43:48.126Z",
      "resolvedByActorId": "codex-ops-release"
    },
    {
      "id": "memory-decision-d104bbc751",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "The executable remains unisane-ops and onboarding behavior is unchanged; current scoped npm identity is owned by the new release decision.",
      "resolvedAt": "2026-09-10T18:43:50.412Z",
      "resolvedByActorId": "codex-ops-release"
    },
    {
      "id": "memory-decision-e72ef0e604",
      "role": "decision",
      "reason": "The declared Task scope owns canonical decision Memory at docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md; review and synchronize it if project truth changes.",
      "status": "complete",
      "targetPath": "docs/decisions/D-20260615-marketing-devtools-production-mutation-contract.md",
      "resolution": "reviewed-no-change",
      "resolutionReason": "Package publication changes no campaign intent or provider mutation policy.",
      "resolvedAt": "2026-09-10T18:43:51.462Z",
      "resolvedByActorId": "codex-ops-release"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (docs). Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "high",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-02360489' 'Continue Prepare private Ops npm packages and scoped CLI for hosted consumers as bounded follow-up work' . --scope 'workspace' --own '.gitignore' --own 'apps/console/package.json' --own 'docs/decisions' --own 'docs/reference/generated' --own 'packages' --own 'tests' --own 'tools/repository/console-release-boundary-policy.json' --own 'tools/repository/standalone-integrity-policy.json' --reason 'The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (docs).' --actor 'codex-ops-release'",
      "ownedPaths": [
        ".gitignore",
        "apps/console/package.json",
        "docs/decisions",
        "docs/reference/generated",
        "packages",
        "tests",
        "tools/repository/console-release-boundary-policy.json",
        "tools/repository/standalone-integrity-policy.json"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (docs).",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "docs/decisions",
        "docs/reference/generated",
        "packages",
        "tools/repository/standalone-integrity-policy.json"
      ],
      "reason": "Private Ops publication requires consistent package identities, admission policy and generated references",
      "actorId": "codex-ops-release",
      "recordedAt": "2026-09-10T15:27:59.199Z",
      "baselinePaths": [
        {
          "path": "docs/decisions",
          "digest": "b5bfe4202c1c938ac623b7a75e573d6d00c543ce8f00992f102c560781293d1f",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/reference/generated",
          "digest": "abe61461c56901c68effcac351790ea74254db9de6f37a73faefc06c9f55302b",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages",
          "digest": "a7839372892125e22ca04eaa7eae1c5dc7b1523b2efece2eed76e62ad2958b0c",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "tools/repository/standalone-integrity-policy.json",
          "digest": "08702c9d71700a284709a40da04a3e12f16fc3b6f5e07f809d7dd7c344728f31",
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
        ".gitignore",
        "apps/console/package.json"
      ],
      "reason": "Exclude release outputs and align the console with its already admitted published UI versions",
      "actorId": "codex-ops-release",
      "recordedAt": "2026-09-10T15:36:09.461Z",
      "baselinePaths": [
        {
          "path": ".gitignore",
          "digest": "c09b5f5ec1865d63b13ecb97e50f27aa29280904e7c882dba6618a76cd94dc2c",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "apps/console/package.json",
          "digest": "389533b3af88d0a97698a5dacdcbc9bff4b4348438ea8046fa5b557c2b4404b2",
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
        "tests",
        "tools/repository/console-release-boundary-policy.json"
      ],
      "reason": "Refresh actual published UI consumer evidence and verify cold CI installation before Ops release",
      "actorId": "codex-ops-release",
      "recordedAt": "2026-09-10T18:23:33.116Z",
      "baselinePaths": [
        {
          "path": "tests",
          "digest": "594449f1750aead9cfcf2975f4be24b63618931d3e93d1550f2a201b8d171477",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "tools/repository/console-release-boundary-policy.json",
          "digest": "a0e0148bf3c6f578494ad9afa8f7be716f719cdcdf4f2133432c1a87c5df1cf1",
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
    ".github/workflows",
    ".gitignore",
    "apps/console/package.json",
    "docs/decisions",
    "docs/reference/generated",
    "packages",
    "packages/unisane-ops",
    "pnpm-lock.yaml",
    "release",
    "scripts",
    "tests",
    "tools/repository/console-release-boundary-policy.json",
    "tools/repository/standalone-integrity-policy.json"
  ]
}
```
<!-- skopos:task-state:end -->
