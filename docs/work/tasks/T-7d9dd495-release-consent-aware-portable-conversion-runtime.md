---
title: "Task: Release consent-aware portable conversion runtime"
status: active
owner: "codex-trueresume-release"
id: T-7d9dd495
scope: "workspace"
role: task
lifecycle: active
authority: canonical
provenance: accepted
view: current
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-4bc4a3a367263c92
lastUpdated: 2026-09-12
---

# Task: Release consent-aware portable conversion runtime

## Changelog

- `2026-09-12`: Synchronized Task state `active` from Skopos.

## Goal

Release consent-aware portable conversion runtime

## Acceptance

- Publish the reviewed consent-aware transports and browser tracking corrections from remote main as a coherent private Ops canary.

## Non-Goals

- None declared.

## Constraints

- None declared.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: release.

## Owned Paths

- `.changeset/portable-conversion-delivery.md`
- `docs/guides/portable-conversion-delivery.md`
- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `packages/cloud/pack.manifest.json`
- `packages/cloud/package.json`
- `packages/framework-ops/package.json`
- `packages/growth/pack.manifest.json`
- `packages/growth/package.json`
- `packages/ops-engine/package.json`
- `packages/ops-mcp/package.json`
- `packages/provider-aws/pack.manifest.json`
- `packages/provider-aws/package.json`
- `packages/provider-cloudflare/pack.manifest.json`
- `packages/provider-cloudflare/package.json`
- `packages/provider-google/pack.manifest.json`
- `packages/provider-google/package.json`
- `packages/provider-meta/pack.manifest.json`
- `packages/provider-meta/package.json`
- `packages/provider-meta/src/meta/api-version.ts`
- `packages/unisane-ops/core.manifest.json`
- `packages/unisane-ops/package.json`
- `packages/web-runtime/integration/core-outbox.mjs`
- `packages/web-runtime/integration/run.mjs`
- `packages/web-runtime/package.json`
- `packages/web-runtime/README.md`
- `packages/web-runtime/src/contracts.ts`
- `packages/web-runtime/src/contracts/provider-api-versions.ts`
- `packages/web-runtime/src/conversions/__tests__/conversion-envelope.test.ts`
- `packages/web-runtime/src/conversions/__tests__/dedupe-and-testing.test.ts`
- `packages/web-runtime/src/conversions/conversion-envelope.ts`
- `packages/web-runtime/src/conversions/dedupe-key.ts`
- `packages/web-runtime/src/conversions/delivery/__tests__/provider-completion.test.ts`
- `packages/web-runtime/src/conversions/delivery/__tests__/reliable-delivery.test.ts`
- `packages/web-runtime/src/conversions/delivery/contract.ts`
- `packages/web-runtime/src/conversions/delivery/error.ts`
- `packages/web-runtime/src/conversions/delivery/evidence.ts`
- `packages/web-runtime/src/conversions/delivery/index.ts`
- `packages/web-runtime/src/conversions/delivery/migration.ts`
- `packages/web-runtime/src/conversions/delivery/publisher.ts`
- `packages/web-runtime/src/conversions/delivery/retry.ts`
- `packages/web-runtime/src/conversions/delivery/subscriber.ts`
- `packages/web-runtime/src/conversions/ga4/index.test.ts`
- `packages/web-runtime/src/conversions/ga4/index.ts`
- `packages/web-runtime/src/conversions/google-ads/__tests__/google-ads-web-conversions.test.ts`
- `packages/web-runtime/src/conversions/google-ads/evidence.ts`
- `packages/web-runtime/src/conversions/google-ads/google-ads-http-client.ts`
- `packages/web-runtime/src/conversions/google-ads/google-ads-payload.ts`
- `packages/web-runtime/src/conversions/google-ads/send-google-ads-conversion.ts`
- `packages/web-runtime/src/conversions/google-ads/types.ts`
- `packages/web-runtime/src/conversions/google-ads/upload-failure.ts`
- `packages/web-runtime/src/conversions/google-ads/user-identifiers.ts`
- `packages/web-runtime/src/conversions/google-data-manager/google-data-manager.test.ts`
- `packages/web-runtime/src/conversions/google-data-manager/index.ts`
- `packages/web-runtime/src/conversions/index.ts`
- `packages/web-runtime/src/conversions/meta/__tests__/delivery-safety.test.ts`
- `packages/web-runtime/src/conversions/meta/__tests__/meta-capi-web-conversions.test.ts`
- `packages/web-runtime/src/conversions/meta/config.ts`
- `packages/web-runtime/src/conversions/meta/evidence.ts`
- `packages/web-runtime/src/conversions/meta/index.ts`
- `packages/web-runtime/src/conversions/meta/meta-capi-http-client.ts`
- `packages/web-runtime/src/conversions/meta/meta-capi-payload.ts`
- `packages/web-runtime/src/conversions/meta/send-meta-capi-conversion.ts`
- `packages/web-runtime/src/conversions/meta/types.ts`
- `packages/web-runtime/src/conversions/meta/user-data.ts`
- `packages/web-runtime/src/conversions/types.ts`
- `packages/web-runtime/src/observations/adapter.ts`
- `packages/web-runtime/src/observations/conversion-receipt.ts`
- `packages/web-runtime/src/observations/index.ts`
- `packages/web-runtime/src/tracking/__tests__/client-reliability.test.ts`
- `packages/web-runtime/src/tracking/__tests__/event-payload.test.ts`
- `packages/web-runtime/src/tracking/__tests__/gtm.test.ts`
- `packages/web-runtime/src/tracking/attribution.ts`
- `packages/web-runtime/src/tracking/client.ts`
- `packages/web-runtime/src/tracking/config.ts`
- `packages/web-runtime/src/tracking/dedupe.ts`
- `packages/web-runtime/src/tracking/event-payload.ts`
- `packages/web-runtime/src/tracking/next/gtm.ts`
- `packages/web-runtime/src/tracking/next/web-tracking-runtime.tsx`
- `packages/web-runtime/src/tracking/types.ts`
- `pnpm-lock.yaml`
- `tools/skopos/actions/measurement-runtime-check.yaml`

## Ownership Expansions

- `2026-09-12T20:42:10.944Z` by `codex-trueresume-release`: `.changeset/portable-conversion-delivery.md`, `docs/guides/portable-conversion-delivery.md`, `docs/reference/generated/repository/standalone-repository-integrity.json`, `docs/standards/13-unisane-ops-product-architecture-baseline.md`, `packages/cloud/pack.manifest.json`, `packages/cloud/package.json`, `packages/framework-ops/package.json`, `packages/growth/pack.manifest.json`, `packages/growth/package.json`, `packages/ops-engine/package.json`, `packages/ops-mcp/package.json`, `packages/provider-aws/pack.manifest.json`, `packages/provider-aws/package.json`, `packages/provider-cloudflare/pack.manifest.json`, `packages/provider-cloudflare/package.json`, `packages/provider-google/pack.manifest.json`, `packages/provider-google/package.json`, `packages/provider-meta/pack.manifest.json`, `packages/provider-meta/src/meta/api-version.ts`, `packages/unisane-ops/core.manifest.json`, `packages/unisane-ops/package.json`, `packages/web-runtime/integration/core-outbox.mjs`, `packages/web-runtime/integration/run.mjs`, `packages/web-runtime/README.md`, `packages/web-runtime/src/contracts.ts`, `packages/web-runtime/src/contracts/provider-api-versions.ts`, `packages/web-runtime/src/conversions/__tests__/conversion-envelope.test.ts`, `packages/web-runtime/src/conversions/__tests__/dedupe-and-testing.test.ts`, `packages/web-runtime/src/conversions/conversion-envelope.ts`, `packages/web-runtime/src/conversions/dedupe-key.ts`, `packages/web-runtime/src/conversions/delivery/__tests__/provider-completion.test.ts`, `packages/web-runtime/src/conversions/delivery/__tests__/reliable-delivery.test.ts`, `packages/web-runtime/src/conversions/delivery/contract.ts`, `packages/web-runtime/src/conversions/delivery/error.ts`, `packages/web-runtime/src/conversions/delivery/evidence.ts`, `packages/web-runtime/src/conversions/delivery/index.ts`, `packages/web-runtime/src/conversions/delivery/migration.ts`, `packages/web-runtime/src/conversions/delivery/publisher.ts`, `packages/web-runtime/src/conversions/delivery/retry.ts`, `packages/web-runtime/src/conversions/delivery/subscriber.ts`, `packages/web-runtime/src/conversions/ga4/index.test.ts`, `packages/web-runtime/src/conversions/ga4/index.ts`, `packages/web-runtime/src/conversions/google-ads/__tests__/google-ads-web-conversions.test.ts`, `packages/web-runtime/src/conversions/google-ads/evidence.ts`, `packages/web-runtime/src/conversions/google-ads/google-ads-http-client.ts`, `packages/web-runtime/src/conversions/google-ads/google-ads-payload.ts`, `packages/web-runtime/src/conversions/google-ads/send-google-ads-conversion.ts`, `packages/web-runtime/src/conversions/google-ads/types.ts`, `packages/web-runtime/src/conversions/google-ads/upload-failure.ts`, `packages/web-runtime/src/conversions/google-ads/user-identifiers.ts`, `packages/web-runtime/src/conversions/google-data-manager/google-data-manager.test.ts`, `packages/web-runtime/src/conversions/google-data-manager/index.ts`, `packages/web-runtime/src/conversions/index.ts`, `packages/web-runtime/src/conversions/meta/__tests__/delivery-safety.test.ts`, `packages/web-runtime/src/conversions/meta/__tests__/meta-capi-web-conversions.test.ts`, `packages/web-runtime/src/conversions/meta/config.ts`, `packages/web-runtime/src/conversions/meta/evidence.ts`, `packages/web-runtime/src/conversions/meta/index.ts`, `packages/web-runtime/src/conversions/meta/meta-capi-http-client.ts`, `packages/web-runtime/src/conversions/meta/meta-capi-payload.ts`, `packages/web-runtime/src/conversions/meta/send-meta-capi-conversion.ts`, `packages/web-runtime/src/conversions/meta/types.ts`, `packages/web-runtime/src/conversions/meta/user-data.ts`, `packages/web-runtime/src/conversions/types.ts`, `packages/web-runtime/src/observations/adapter.ts`, `packages/web-runtime/src/observations/conversion-receipt.ts`, `packages/web-runtime/src/observations/index.ts`, `packages/web-runtime/src/tracking/__tests__/client-reliability.test.ts`, `packages/web-runtime/src/tracking/__tests__/event-payload.test.ts`, `packages/web-runtime/src/tracking/__tests__/gtm.test.ts`, `packages/web-runtime/src/tracking/attribution.ts`, `packages/web-runtime/src/tracking/client.ts`, `packages/web-runtime/src/tracking/config.ts`, `packages/web-runtime/src/tracking/dedupe.ts`, `packages/web-runtime/src/tracking/event-payload.ts`, `packages/web-runtime/src/tracking/next/gtm.ts`, `packages/web-runtime/src/tracking/next/web-tracking-runtime.tsx`, `packages/web-runtime/src/tracking/types.ts`, `pnpm-lock.yaml`, `tools/skopos/actions/measurement-runtime-check.yaml` — Adopt the reviewed producer implementation and exact release manifests into this isolated main-based release.

## Steps

- [ ] **Record Task risk and detail before editing** (implementation, pending) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [ ] **Review the current pattern in unisane-ops** (implementation, pending) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [ ] **Implement the smallest scoped change** (implementation, pending) — Carry out "Release consent-aware portable conversion runtime" inside the resolved scope before widening impact to adjacent areas.
- [ ] **Sync docs and instruction surfaces if touched** (docs, pending) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Publish the reviewed consent-aware transports and browser tracking corrections from remote main as a coherent private Ops canary. (closure, agent-observation)

## Memory Obligations

- [open] guide: The declared Task scope owns canonical guide Memory at docs/guides/portable-conversion-delivery.md; review and synchronize it if project truth changes. (target: `docs/guides/portable-conversion-delivery.md`)
- [open] standard: High-impact work must review and synchronize the existing standard Memory for Scope workspace. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`)

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-7d9dd495",
  "type": "task",
  "status": "active",
  "generatedAt": "2026-09-12T20:37:39.818Z",
  "updatedAt": "2026-09-12T20:42:10.944Z",
  "planIds": [],
  "childTasks": [],
  "state": "active",
  "detail": "detailed",
  "title": "Release consent-aware portable conversion runtime",
  "goal": "Release consent-aware portable conversion runtime",
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
      "Publish the reviewed consent-aware transports and browser tracking corrections from remote main as a coherent private Ops canary."
    ],
    "nonGoals": [],
    "constraints": []
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
      "The goal contains high-impact signal: release."
    ],
    "signals": {
      "goalSignals": [
        "release"
      ],
      "ownedPathCount": 2,
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
    "baselineId": "baseline-4bc4a3a367263c92"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "step-record-task-risk",
      "kind": "implementation",
      "title": "Record Task risk and detail before editing",
      "detail": "Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.",
      "status": "pending"
    },
    {
      "id": "step-review-current-pattern",
      "kind": "implementation",
      "title": "Review the current pattern in unisane-ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "pending"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Release consent-aware portable conversion runtime\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Publish the reviewed consent-aware transports and browser tracking corrections from remote main as a coherent private Ops canary.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-guide-9b94585cde",
      "role": "guide",
      "reason": "The declared Task scope owns canonical guide Memory at docs/guides/portable-conversion-delivery.md; review and synchronize it if project truth changes.",
      "status": "open",
      "targetPath": "docs/guides/portable-conversion-delivery.md"
    },
    {
      "id": "memory-standard-2653e0fd89",
      "role": "standard",
      "reason": "High-impact work must review and synchronize the existing standard Memory for Scope workspace.",
      "status": "open",
      "targetPath": "docs/standards/13-unisane-ops-product-architecture-baseline.md"
    }
  ],
  "questions": [],
  "recommendations": [
    {
      "id": "start-bounded-child-task",
      "title": "Start a bounded child Task",
      "summary": "The Task may be drifting from its admitted subject because new impact categories appeared (docs). Keep this Task intact and move the suggested paths into focused follow-up work.",
      "priority": "high",
      "actionKind": "start-child-task",
      "command": "skopos task child start 'T-7d9dd495' 'Continue Release consent-aware portable conversion runtime as bounded follow-up work' . --scope 'workspace' --own '.changeset/portable-conversion-delivery.md' --own 'docs/guides/portable-conversion-delivery.md' --own 'docs/reference/generated/repository/standalone-repository-integrity.json' --own 'docs/standards/13-unisane-ops-product-architecture-baseline.md' --own 'packages/cloud/pack.manifest.json' --own 'packages/cloud/package.json' --own 'packages/framework-ops/package.json' --own 'packages/growth/pack.manifest.json' --own 'packages/growth/package.json' --own 'packages/ops-engine/package.json' --own 'packages/ops-mcp/package.json' --own 'packages/provider-aws/pack.manifest.json' --own 'packages/provider-aws/package.json' --own 'packages/provider-cloudflare/pack.manifest.json' --own 'packages/provider-cloudflare/package.json' --own 'packages/provider-google/pack.manifest.json' --own 'packages/provider-google/package.json' --own 'packages/provider-meta/pack.manifest.json' --own 'packages/provider-meta/src/meta/api-version.ts' --own 'packages/unisane-ops/core.manifest.json' --own 'packages/unisane-ops/package.json' --own 'packages/web-runtime/integration/core-outbox.mjs' --own 'packages/web-runtime/integration/run.mjs' --own 'packages/web-runtime/README.md' --own 'packages/web-runtime/src/contracts.ts' --own 'packages/web-runtime/src/contracts/provider-api-versions.ts' --own 'packages/web-runtime/src/conversions/__tests__/conversion-envelope.test.ts' --own 'packages/web-runtime/src/conversions/__tests__/dedupe-and-testing.test.ts' --own 'packages/web-runtime/src/conversions/conversion-envelope.ts' --own 'packages/web-runtime/src/conversions/dedupe-key.ts' --own 'packages/web-runtime/src/conversions/delivery/__tests__/provider-completion.test.ts' --own 'packages/web-runtime/src/conversions/delivery/__tests__/reliable-delivery.test.ts' --own 'packages/web-runtime/src/conversions/delivery/contract.ts' --own 'packages/web-runtime/src/conversions/delivery/error.ts' --own 'packages/web-runtime/src/conversions/delivery/evidence.ts' --own 'packages/web-runtime/src/conversions/delivery/index.ts' --own 'packages/web-runtime/src/conversions/delivery/migration.ts' --own 'packages/web-runtime/src/conversions/delivery/publisher.ts' --own 'packages/web-runtime/src/conversions/delivery/retry.ts' --own 'packages/web-runtime/src/conversions/delivery/subscriber.ts' --own 'packages/web-runtime/src/conversions/ga4/index.test.ts' --own 'packages/web-runtime/src/conversions/ga4/index.ts' --own 'packages/web-runtime/src/conversions/google-ads/__tests__/google-ads-web-conversions.test.ts' --own 'packages/web-runtime/src/conversions/google-ads/evidence.ts' --own 'packages/web-runtime/src/conversions/google-ads/google-ads-http-client.ts' --own 'packages/web-runtime/src/conversions/google-ads/google-ads-payload.ts' --own 'packages/web-runtime/src/conversions/google-ads/send-google-ads-conversion.ts' --own 'packages/web-runtime/src/conversions/google-ads/types.ts' --own 'packages/web-runtime/src/conversions/google-ads/upload-failure.ts' --own 'packages/web-runtime/src/conversions/google-ads/user-identifiers.ts' --own 'packages/web-runtime/src/conversions/google-data-manager/google-data-manager.test.ts' --own 'packages/web-runtime/src/conversions/google-data-manager/index.ts' --own 'packages/web-runtime/src/conversions/index.ts' --own 'packages/web-runtime/src/conversions/meta/__tests__/delivery-safety.test.ts' --own 'packages/web-runtime/src/conversions/meta/__tests__/meta-capi-web-conversions.test.ts' --own 'packages/web-runtime/src/conversions/meta/config.ts' --own 'packages/web-runtime/src/conversions/meta/evidence.ts' --own 'packages/web-runtime/src/conversions/meta/index.ts' --own 'packages/web-runtime/src/conversions/meta/meta-capi-http-client.ts' --own 'packages/web-runtime/src/conversions/meta/meta-capi-payload.ts' --own 'packages/web-runtime/src/conversions/meta/send-meta-capi-conversion.ts' --own 'packages/web-runtime/src/conversions/meta/types.ts' --own 'packages/web-runtime/src/conversions/meta/user-data.ts' --own 'packages/web-runtime/src/conversions/types.ts' --own 'packages/web-runtime/src/observations/adapter.ts' --own 'packages/web-runtime/src/observations/conversion-receipt.ts' --own 'packages/web-runtime/src/observations/index.ts' --own 'packages/web-runtime/src/tracking/__tests__/client-reliability.test.ts' --own 'packages/web-runtime/src/tracking/__tests__/event-payload.test.ts' --own 'packages/web-runtime/src/tracking/__tests__/gtm.test.ts' --own 'packages/web-runtime/src/tracking/attribution.ts' --own 'packages/web-runtime/src/tracking/client.ts' --own 'packages/web-runtime/src/tracking/config.ts' --own 'packages/web-runtime/src/tracking/dedupe.ts' --own 'packages/web-runtime/src/tracking/event-payload.ts' --own 'packages/web-runtime/src/tracking/next/gtm.ts' --own 'packages/web-runtime/src/tracking/next/web-tracking-runtime.tsx' --own 'packages/web-runtime/src/tracking/types.ts' --own 'pnpm-lock.yaml' --own 'tools/skopos/actions/measurement-runtime-check.yaml' --reason 'The Task may be drifting from its admitted subject because new impact categories appeared (docs).' --actor 'codex-trueresume-release'",
      "ownedPaths": [
        ".changeset/portable-conversion-delivery.md",
        "docs/guides/portable-conversion-delivery.md",
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "packages/cloud/pack.manifest.json",
        "packages/cloud/package.json",
        "packages/framework-ops/package.json",
        "packages/growth/pack.manifest.json",
        "packages/growth/package.json",
        "packages/ops-engine/package.json",
        "packages/ops-mcp/package.json",
        "packages/provider-aws/pack.manifest.json",
        "packages/provider-aws/package.json",
        "packages/provider-cloudflare/pack.manifest.json",
        "packages/provider-cloudflare/package.json",
        "packages/provider-google/pack.manifest.json",
        "packages/provider-google/package.json",
        "packages/provider-meta/pack.manifest.json",
        "packages/provider-meta/src/meta/api-version.ts",
        "packages/unisane-ops/core.manifest.json",
        "packages/unisane-ops/package.json",
        "packages/web-runtime/integration/core-outbox.mjs",
        "packages/web-runtime/integration/run.mjs",
        "packages/web-runtime/README.md",
        "packages/web-runtime/src/contracts.ts",
        "packages/web-runtime/src/contracts/provider-api-versions.ts",
        "packages/web-runtime/src/conversions/__tests__/conversion-envelope.test.ts",
        "packages/web-runtime/src/conversions/__tests__/dedupe-and-testing.test.ts",
        "packages/web-runtime/src/conversions/conversion-envelope.ts",
        "packages/web-runtime/src/conversions/dedupe-key.ts",
        "packages/web-runtime/src/conversions/delivery/__tests__/provider-completion.test.ts",
        "packages/web-runtime/src/conversions/delivery/__tests__/reliable-delivery.test.ts",
        "packages/web-runtime/src/conversions/delivery/contract.ts",
        "packages/web-runtime/src/conversions/delivery/error.ts",
        "packages/web-runtime/src/conversions/delivery/evidence.ts",
        "packages/web-runtime/src/conversions/delivery/index.ts",
        "packages/web-runtime/src/conversions/delivery/migration.ts",
        "packages/web-runtime/src/conversions/delivery/publisher.ts",
        "packages/web-runtime/src/conversions/delivery/retry.ts",
        "packages/web-runtime/src/conversions/delivery/subscriber.ts",
        "packages/web-runtime/src/conversions/ga4/index.test.ts",
        "packages/web-runtime/src/conversions/ga4/index.ts",
        "packages/web-runtime/src/conversions/google-ads/__tests__/google-ads-web-conversions.test.ts",
        "packages/web-runtime/src/conversions/google-ads/evidence.ts",
        "packages/web-runtime/src/conversions/google-ads/google-ads-http-client.ts",
        "packages/web-runtime/src/conversions/google-ads/google-ads-payload.ts",
        "packages/web-runtime/src/conversions/google-ads/send-google-ads-conversion.ts",
        "packages/web-runtime/src/conversions/google-ads/types.ts",
        "packages/web-runtime/src/conversions/google-ads/upload-failure.ts",
        "packages/web-runtime/src/conversions/google-ads/user-identifiers.ts",
        "packages/web-runtime/src/conversions/google-data-manager/google-data-manager.test.ts",
        "packages/web-runtime/src/conversions/google-data-manager/index.ts",
        "packages/web-runtime/src/conversions/index.ts",
        "packages/web-runtime/src/conversions/meta/__tests__/delivery-safety.test.ts",
        "packages/web-runtime/src/conversions/meta/__tests__/meta-capi-web-conversions.test.ts",
        "packages/web-runtime/src/conversions/meta/config.ts",
        "packages/web-runtime/src/conversions/meta/evidence.ts",
        "packages/web-runtime/src/conversions/meta/index.ts",
        "packages/web-runtime/src/conversions/meta/meta-capi-http-client.ts",
        "packages/web-runtime/src/conversions/meta/meta-capi-payload.ts",
        "packages/web-runtime/src/conversions/meta/send-meta-capi-conversion.ts",
        "packages/web-runtime/src/conversions/meta/types.ts",
        "packages/web-runtime/src/conversions/meta/user-data.ts",
        "packages/web-runtime/src/conversions/types.ts",
        "packages/web-runtime/src/observations/adapter.ts",
        "packages/web-runtime/src/observations/conversion-receipt.ts",
        "packages/web-runtime/src/observations/index.ts",
        "packages/web-runtime/src/tracking/__tests__/client-reliability.test.ts",
        "packages/web-runtime/src/tracking/__tests__/event-payload.test.ts",
        "packages/web-runtime/src/tracking/__tests__/gtm.test.ts",
        "packages/web-runtime/src/tracking/attribution.ts",
        "packages/web-runtime/src/tracking/client.ts",
        "packages/web-runtime/src/tracking/config.ts",
        "packages/web-runtime/src/tracking/dedupe.ts",
        "packages/web-runtime/src/tracking/event-payload.ts",
        "packages/web-runtime/src/tracking/next/gtm.ts",
        "packages/web-runtime/src/tracking/next/web-tracking-runtime.tsx",
        "packages/web-runtime/src/tracking/types.ts",
        "pnpm-lock.yaml",
        "tools/skopos/actions/measurement-runtime-check.yaml"
      ],
      "scopeId": "workspace",
      "reason": "The Task may be drifting from its admitted subject because new impact categories appeared (docs).",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        ".changeset/portable-conversion-delivery.md",
        "docs/guides/portable-conversion-delivery.md",
        "docs/reference/generated/repository/standalone-repository-integrity.json",
        "docs/standards/13-unisane-ops-product-architecture-baseline.md",
        "packages/cloud/pack.manifest.json",
        "packages/cloud/package.json",
        "packages/framework-ops/package.json",
        "packages/growth/pack.manifest.json",
        "packages/growth/package.json",
        "packages/ops-engine/package.json",
        "packages/ops-mcp/package.json",
        "packages/provider-aws/pack.manifest.json",
        "packages/provider-aws/package.json",
        "packages/provider-cloudflare/pack.manifest.json",
        "packages/provider-cloudflare/package.json",
        "packages/provider-google/pack.manifest.json",
        "packages/provider-google/package.json",
        "packages/provider-meta/pack.manifest.json",
        "packages/provider-meta/src/meta/api-version.ts",
        "packages/unisane-ops/core.manifest.json",
        "packages/unisane-ops/package.json",
        "packages/web-runtime/integration/core-outbox.mjs",
        "packages/web-runtime/integration/run.mjs",
        "packages/web-runtime/README.md",
        "packages/web-runtime/src/contracts.ts",
        "packages/web-runtime/src/contracts/provider-api-versions.ts",
        "packages/web-runtime/src/conversions/__tests__/conversion-envelope.test.ts",
        "packages/web-runtime/src/conversions/__tests__/dedupe-and-testing.test.ts",
        "packages/web-runtime/src/conversions/conversion-envelope.ts",
        "packages/web-runtime/src/conversions/dedupe-key.ts",
        "packages/web-runtime/src/conversions/delivery/__tests__/provider-completion.test.ts",
        "packages/web-runtime/src/conversions/delivery/__tests__/reliable-delivery.test.ts",
        "packages/web-runtime/src/conversions/delivery/contract.ts",
        "packages/web-runtime/src/conversions/delivery/error.ts",
        "packages/web-runtime/src/conversions/delivery/evidence.ts",
        "packages/web-runtime/src/conversions/delivery/index.ts",
        "packages/web-runtime/src/conversions/delivery/migration.ts",
        "packages/web-runtime/src/conversions/delivery/publisher.ts",
        "packages/web-runtime/src/conversions/delivery/retry.ts",
        "packages/web-runtime/src/conversions/delivery/subscriber.ts",
        "packages/web-runtime/src/conversions/ga4/index.test.ts",
        "packages/web-runtime/src/conversions/ga4/index.ts",
        "packages/web-runtime/src/conversions/google-ads/__tests__/google-ads-web-conversions.test.ts",
        "packages/web-runtime/src/conversions/google-ads/evidence.ts",
        "packages/web-runtime/src/conversions/google-ads/google-ads-http-client.ts",
        "packages/web-runtime/src/conversions/google-ads/google-ads-payload.ts",
        "packages/web-runtime/src/conversions/google-ads/send-google-ads-conversion.ts",
        "packages/web-runtime/src/conversions/google-ads/types.ts",
        "packages/web-runtime/src/conversions/google-ads/upload-failure.ts",
        "packages/web-runtime/src/conversions/google-ads/user-identifiers.ts",
        "packages/web-runtime/src/conversions/google-data-manager/google-data-manager.test.ts",
        "packages/web-runtime/src/conversions/google-data-manager/index.ts",
        "packages/web-runtime/src/conversions/index.ts",
        "packages/web-runtime/src/conversions/meta/__tests__/delivery-safety.test.ts",
        "packages/web-runtime/src/conversions/meta/__tests__/meta-capi-web-conversions.test.ts",
        "packages/web-runtime/src/conversions/meta/config.ts",
        "packages/web-runtime/src/conversions/meta/evidence.ts",
        "packages/web-runtime/src/conversions/meta/index.ts",
        "packages/web-runtime/src/conversions/meta/meta-capi-http-client.ts",
        "packages/web-runtime/src/conversions/meta/meta-capi-payload.ts",
        "packages/web-runtime/src/conversions/meta/send-meta-capi-conversion.ts",
        "packages/web-runtime/src/conversions/meta/types.ts",
        "packages/web-runtime/src/conversions/meta/user-data.ts",
        "packages/web-runtime/src/conversions/types.ts",
        "packages/web-runtime/src/observations/adapter.ts",
        "packages/web-runtime/src/observations/conversion-receipt.ts",
        "packages/web-runtime/src/observations/index.ts",
        "packages/web-runtime/src/tracking/__tests__/client-reliability.test.ts",
        "packages/web-runtime/src/tracking/__tests__/event-payload.test.ts",
        "packages/web-runtime/src/tracking/__tests__/gtm.test.ts",
        "packages/web-runtime/src/tracking/attribution.ts",
        "packages/web-runtime/src/tracking/client.ts",
        "packages/web-runtime/src/tracking/config.ts",
        "packages/web-runtime/src/tracking/dedupe.ts",
        "packages/web-runtime/src/tracking/event-payload.ts",
        "packages/web-runtime/src/tracking/next/gtm.ts",
        "packages/web-runtime/src/tracking/next/web-tracking-runtime.tsx",
        "packages/web-runtime/src/tracking/types.ts",
        "pnpm-lock.yaml",
        "tools/skopos/actions/measurement-runtime-check.yaml"
      ],
      "reason": "Adopt the reviewed producer implementation and exact release manifests into this isolated main-based release.",
      "actorId": "codex-trueresume-release",
      "recordedAt": "2026-09-12T20:42:10.944Z",
      "baselinePaths": [
        {
          "path": ".changeset/portable-conversion-delivery.md",
          "digest": "568986190a14eb4b52a62a958cabfd7b0445bd9149f8d801a3e4c1e82caf183d",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/guides/portable-conversion-delivery.md",
          "digest": "c663cad002ee3333afea03f0b30a4ed185a656aca542d325b4bc08f2b6fe4f1d",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "f4df61beb786db0ede82994bfbd28bd38bfc95c20013a8f967d96929c0cca428",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "docs/standards/13-unisane-ops-product-architecture-baseline.md",
          "digest": "3f225157d1ef8446ecc84b19fd743e4596ad929ad76b1d382a3c169ec3264e6a",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/cloud/pack.manifest.json",
          "digest": "e50019080a127e47577492a3d984e78f7a7e2456e50c55abab536fde9ff5945e",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/cloud/package.json",
          "digest": "9e047a5c0db093f75846f369b818dc08079e5879d773c8158afbe315b1c78caf",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/framework-ops/package.json",
          "digest": "3ee69ee93c77e675ef08f742e551ee48e1d22bb7ae57251f483cdcf40c61d204",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/pack.manifest.json",
          "digest": "145b46126dc94937b17d71cc14582f4f2cff23df8d8e71c012c5bc65bc8bc16c",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/growth/package.json",
          "digest": "a373f2d0e3829d5aa2908d140a7b9ed5d59b435c64d5af5f72473a50785102a9",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/ops-engine/package.json",
          "digest": "d520054073039e7a1679f5e49b98bc1de99d14a3796e2064a592d30d5eacf0e1",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/ops-mcp/package.json",
          "digest": "9ec36ff9f324706b3b315a21b19c4b6f7dd474fa03a6e0a4b927dc44453987fc",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-aws/pack.manifest.json",
          "digest": "432ba59e1a1c34925d92470402078090b569531262bd5685f9b7366211ba9c34",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-aws/package.json",
          "digest": "559929334df2bfa9542d76eb570423e4943597d2b27414076639d5ebbf8caf86",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-cloudflare/pack.manifest.json",
          "digest": "033f57117cc284f2f5f2b1f88324702a0e3faa7a8480ffdeb61e35dc3192697e",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-cloudflare/package.json",
          "digest": "f15195d0ed4bdf0e9f898f1eb84a265cd6bba724d50d637ba836453be3eeb440",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-google/pack.manifest.json",
          "digest": "3d9e2ab9b3349c06f77aef81597bc001bff52d4a4ab6e108d9d459dbbdeb5196",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-google/package.json",
          "digest": "7192ab3448a09f5092b3161ba255f8883e50f629a1ddad239e722081919b7a23",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-meta/pack.manifest.json",
          "digest": "2af02dd3b0f9d48bc9437c6b315f57470aca3612c22d2e8272d5d1c68de4d074",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/provider-meta/src/meta/api-version.ts",
          "digest": "414f3304d67655f28943f7a9f9794a00712e327ad75e322ed9ee1113365f24dd",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/unisane-ops/core.manifest.json",
          "digest": "0222faf08eea40ecb99ed633404441f555e5a081a7335fc6ad3b95cc4d3e3b57",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/unisane-ops/package.json",
          "digest": "497cd106112c5f580c765d4063dd857377ec4b7ee18e090650d596b90f63149b",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/README.md",
          "digest": "4866b2e56be4e7b9cb8a4852f6e3a4b652aa70760863d1971e38adc44b202b30",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/integration/core-outbox.mjs",
          "digest": "63a45d785fe729600938a1c4cc661c0e9f3bc400da224d3621da42401e38ae23",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/integration/run.mjs",
          "digest": "7e1994866264e2a60cfeba8443c2e3679de1c46d5eaa7f6525b7934211d8b00d",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/contracts.ts",
          "digest": "a3ec4aae486362fb8d7e6b4145ff99945cb0c17fefe3f22352f87876e9d1b33b",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/contracts/provider-api-versions.ts",
          "digest": "6cacd1bd9f20c7fcab1795ae223d26f9672280600d2ae49d03724a384568c707",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/__tests__/conversion-envelope.test.ts",
          "digest": "6c269facfe8eabdddb3b55bac52911d40084b238b508672f1d5c7dcb1a5bd827",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/__tests__/dedupe-and-testing.test.ts",
          "digest": "b4d8fe6df512b8ae3bfe8e92b0971255d419fbe3a94b68f87b9b263b07ab1166",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/conversion-envelope.ts",
          "digest": "066ddcb6f1a852dd7af7ed7585f666645fa10c3b5dbb2dad86447e858dd1b078",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/dedupe-key.ts",
          "digest": "d47101cdf4d45f89be2d3cb727bc2b820ace4de59530c7b5b7f3d01dfd2e65c4",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/__tests__/provider-completion.test.ts",
          "digest": "6708cf1b430ed851ca160c7db50125a6dcc6465c19d2d9aefc22bc91d30a6848",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/__tests__/reliable-delivery.test.ts",
          "digest": "9135f2dbe3fd0dc870c2570c9e6865e17dbc2fcd112864f9333839962fd9d9c6",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/contract.ts",
          "digest": "fb48ad5d59d72cee79315b42e138ecd498827169e8034a1cb338153b2b35414e",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/error.ts",
          "digest": "2d4432000d172f746a60f16f19c3457dc0461e0f0d3e17b6cd246db1aa71bd00",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/evidence.ts",
          "digest": "8ca18a8ff990cf9f59d1fe7aa6e0cc72e108aec1fd87cbfc8241d894552eaae9",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/index.ts",
          "digest": "2813e0066d78ab3c117c659ca2ff71e0a7bdfad03a69987f8f0407cf6d9de5d9",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/migration.ts",
          "digest": "ac56d69919d388a03581cd59a236109f06f2884af408e3eba372a8b343a0ed3a",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/publisher.ts",
          "digest": "52f665b970574c455c0540e3ba6fdea4d311143eb2b45414d2ed0dcfee7bd888",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/retry.ts",
          "digest": "13b155a4473a2a09a66d16e63982ac35f519f521feabb366d3c385e7b51847fb",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/delivery/subscriber.ts",
          "digest": "83235d5c3ea81541ae903af1c430d0e5101d66e6947b4011ba38db5cf88c02e6",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/ga4/index.test.ts",
          "digest": "2fb3bd41d4c68265488f90a351f71cdf78b07d7646b87f92ba846ead4909a63d",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/ga4/index.ts",
          "digest": "7228aabe9af401f09d690c521b67c6c7c505cbb311c40fa65b19511780adb03f",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/__tests__/google-ads-web-conversions.test.ts",
          "digest": "17e196772d8a9187910af4ae5a7921000e97b1fa1ae30a41753e5c9bdab1bd58",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/evidence.ts",
          "digest": "cfae94d803eac86a67f2c7dfdb151099b21c74628537d89ae57c3d8c8145384f",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/google-ads-http-client.ts",
          "digest": "625d17d3604a36cba78f307a0183a6d8cd11ab75221ecbdec3a7490974415b44",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/google-ads-payload.ts",
          "digest": "99d53c9a8a2c3ce71962e0cbfe47c3d03455620d25096b1f7d7ab6b6052fb032",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/send-google-ads-conversion.ts",
          "digest": "6fa1dff5b0012241594bc1ada16acf8e5374035bfcc7e75fde550f989d6f703a",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/types.ts",
          "digest": "45d7bf32a52bf7f87eb9b46831e6f3adec465bbbb4da5ec84e39939ccbaad915",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/upload-failure.ts",
          "digest": "fa02980de480977a68aa2b1a8838cfe145ddf396ef374dd372e547e5da812dcd",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-ads/user-identifiers.ts",
          "digest": "c782b909122dffde32b0e2f1bfc2a888d6e75c5a2e4587e677793ec6c8a93fb8",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-data-manager/google-data-manager.test.ts",
          "digest": "512ec2177911f761bca1fae5def96a647131711833b4c3a098114b8c61d397e1",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/google-data-manager/index.ts",
          "digest": "330175e80fc754a43b1bc8237d673501353a06fb7b4ed1cba273685bea82dde3",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/index.ts",
          "digest": "2da5092cae26deafbb620f255810383726f340427c60b7dadff357c2e54dc5b7",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/__tests__/delivery-safety.test.ts",
          "digest": "52252e2130cf37819ae5b6712265e174db158f5fff5e6badf436d04e037183fd",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/__tests__/meta-capi-web-conversions.test.ts",
          "digest": "1d91f527b92c04285dc45af166d6c19079de72fe4aacf55a80e6dc2f07705dd5",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/config.ts",
          "digest": "90af0408864cf9525836c520264cebf1a6fd15ca0fbdd2c8974ef4bd45e7dfb4",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/evidence.ts",
          "digest": "cf9334a80019d616b265b976f2cd6480635119032356dbd98465edd571a83009",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/index.ts",
          "digest": "ea472a30fbdb7715ef4e7144dd2af97444f5ab6eceff43bb996eca5ca69b5ca9",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/meta-capi-http-client.ts",
          "digest": "96cd315237abeac70b68eca4913dc66673f6e7728f3a7bc7cad79ac747002e94",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/meta-capi-payload.ts",
          "digest": "85be429e24ddde208390e79450076ace307acfa3cb16371b3cdc21f2e0299a3a",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/send-meta-capi-conversion.ts",
          "digest": "9cb2084803d813361c4650ff4e4e08be773b0eaa3869661323f573f36159cc3f",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/types.ts",
          "digest": "124dc488639dbe303c274a1c8f2a940acc4de42ec05cf9ca4b980bb1748a219e",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/meta/user-data.ts",
          "digest": "48500221620fbf0af652c230a11a358ee4f9335fa54480e7f64bd5f737caaa95",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/conversions/types.ts",
          "digest": "827342f52016eb49820dfc311ffc13bf928dcf36e340b8d5692c097acdcf0c8e",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/observations/adapter.ts",
          "digest": "56d725379e5edcc3f1d5e0b00918e06538e7f0e060921cc981de3895f46a714e",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/observations/conversion-receipt.ts",
          "digest": "fc92683a6997517353f9f03cd1701f33cb50d75bc5961a5cbd8cd14d10f339d2",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/observations/index.ts",
          "digest": "6131c55359ef7d456dbec8d860817123cc6209d377e2da993d100ff9d4069576",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/__tests__/client-reliability.test.ts",
          "digest": "3fa16aaf2c8162b2c9103df62176d3763fc4cc3232025d0ccddac056b302530d",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/__tests__/event-payload.test.ts",
          "digest": "7aefcd62f80e6110151594e7f48e5d6e26153236d50ead2f34d58e392f1a7f3f",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/__tests__/gtm.test.ts",
          "digest": "ba629d30136c50c5d6092a6bef0eec03e2c0ef66235094db4ed712a1d692d3ea",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/attribution.ts",
          "digest": "ca7c7e86167e01eeb909e83cc11109ca00928f965d3e08eb82bf4d227be02caf",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/client.ts",
          "digest": "27cfb185ff580e879870470b433b35bbf93b0217de2d93d5e60c292fab68db65",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/config.ts",
          "digest": "ba256b21fbeef618e3dc218ad1c692d3e41f11f26263bcbfd1bb0a0de437209e",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/dedupe.ts",
          "digest": "77b4a9abbd7affe35bde23862afae0b2eb2c92df18210ff160d4b471007a83be",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/event-payload.ts",
          "digest": "eef753c3f41a5ea00d3f822eb13daf82e5c6e3c457e8aa3d10ef4a4e4e649fc9",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/next/gtm.ts",
          "digest": "b37b6ff978b296a7cbd089c5b098ede97f4bee3fbf23a7d59c0e6e13d6b55e03",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/next/web-tracking-runtime.tsx",
          "digest": "ab99e08573d947467e219f1464773985cd0b5a026adeead277aa8e8a00be63e5",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "packages/web-runtime/src/tracking/types.ts",
          "digest": "823953a366b23019b1a61061dca88e5c1468d95845e02482c3201283647bee85",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "pnpm-lock.yaml",
          "digest": "1eb981f16df502b26ca7a7ab6fa0eb45b56844189862a6f3028aced261cb7efa",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "tools/skopos/actions/measurement-runtime-check.yaml",
          "digest": "51c40552365e35af5a9a78b4d3593fde5558206e1d3fa522655421ceaf1a72b4",
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
    ".changeset/portable-conversion-delivery.md",
    "docs/guides/portable-conversion-delivery.md",
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "packages/cloud/pack.manifest.json",
    "packages/cloud/package.json",
    "packages/framework-ops/package.json",
    "packages/growth/pack.manifest.json",
    "packages/growth/package.json",
    "packages/ops-engine/package.json",
    "packages/ops-mcp/package.json",
    "packages/provider-aws/pack.manifest.json",
    "packages/provider-aws/package.json",
    "packages/provider-cloudflare/pack.manifest.json",
    "packages/provider-cloudflare/package.json",
    "packages/provider-google/pack.manifest.json",
    "packages/provider-google/package.json",
    "packages/provider-meta/pack.manifest.json",
    "packages/provider-meta/package.json",
    "packages/provider-meta/src/meta/api-version.ts",
    "packages/unisane-ops/core.manifest.json",
    "packages/unisane-ops/package.json",
    "packages/web-runtime/integration/core-outbox.mjs",
    "packages/web-runtime/integration/run.mjs",
    "packages/web-runtime/package.json",
    "packages/web-runtime/README.md",
    "packages/web-runtime/src/contracts.ts",
    "packages/web-runtime/src/contracts/provider-api-versions.ts",
    "packages/web-runtime/src/conversions/__tests__/conversion-envelope.test.ts",
    "packages/web-runtime/src/conversions/__tests__/dedupe-and-testing.test.ts",
    "packages/web-runtime/src/conversions/conversion-envelope.ts",
    "packages/web-runtime/src/conversions/dedupe-key.ts",
    "packages/web-runtime/src/conversions/delivery/__tests__/provider-completion.test.ts",
    "packages/web-runtime/src/conversions/delivery/__tests__/reliable-delivery.test.ts",
    "packages/web-runtime/src/conversions/delivery/contract.ts",
    "packages/web-runtime/src/conversions/delivery/error.ts",
    "packages/web-runtime/src/conversions/delivery/evidence.ts",
    "packages/web-runtime/src/conversions/delivery/index.ts",
    "packages/web-runtime/src/conversions/delivery/migration.ts",
    "packages/web-runtime/src/conversions/delivery/publisher.ts",
    "packages/web-runtime/src/conversions/delivery/retry.ts",
    "packages/web-runtime/src/conversions/delivery/subscriber.ts",
    "packages/web-runtime/src/conversions/ga4/index.test.ts",
    "packages/web-runtime/src/conversions/ga4/index.ts",
    "packages/web-runtime/src/conversions/google-ads/__tests__/google-ads-web-conversions.test.ts",
    "packages/web-runtime/src/conversions/google-ads/evidence.ts",
    "packages/web-runtime/src/conversions/google-ads/google-ads-http-client.ts",
    "packages/web-runtime/src/conversions/google-ads/google-ads-payload.ts",
    "packages/web-runtime/src/conversions/google-ads/send-google-ads-conversion.ts",
    "packages/web-runtime/src/conversions/google-ads/types.ts",
    "packages/web-runtime/src/conversions/google-ads/upload-failure.ts",
    "packages/web-runtime/src/conversions/google-ads/user-identifiers.ts",
    "packages/web-runtime/src/conversions/google-data-manager/google-data-manager.test.ts",
    "packages/web-runtime/src/conversions/google-data-manager/index.ts",
    "packages/web-runtime/src/conversions/index.ts",
    "packages/web-runtime/src/conversions/meta/__tests__/delivery-safety.test.ts",
    "packages/web-runtime/src/conversions/meta/__tests__/meta-capi-web-conversions.test.ts",
    "packages/web-runtime/src/conversions/meta/config.ts",
    "packages/web-runtime/src/conversions/meta/evidence.ts",
    "packages/web-runtime/src/conversions/meta/index.ts",
    "packages/web-runtime/src/conversions/meta/meta-capi-http-client.ts",
    "packages/web-runtime/src/conversions/meta/meta-capi-payload.ts",
    "packages/web-runtime/src/conversions/meta/send-meta-capi-conversion.ts",
    "packages/web-runtime/src/conversions/meta/types.ts",
    "packages/web-runtime/src/conversions/meta/user-data.ts",
    "packages/web-runtime/src/conversions/types.ts",
    "packages/web-runtime/src/observations/adapter.ts",
    "packages/web-runtime/src/observations/conversion-receipt.ts",
    "packages/web-runtime/src/observations/index.ts",
    "packages/web-runtime/src/tracking/__tests__/client-reliability.test.ts",
    "packages/web-runtime/src/tracking/__tests__/event-payload.test.ts",
    "packages/web-runtime/src/tracking/__tests__/gtm.test.ts",
    "packages/web-runtime/src/tracking/attribution.ts",
    "packages/web-runtime/src/tracking/client.ts",
    "packages/web-runtime/src/tracking/config.ts",
    "packages/web-runtime/src/tracking/dedupe.ts",
    "packages/web-runtime/src/tracking/event-payload.ts",
    "packages/web-runtime/src/tracking/next/gtm.ts",
    "packages/web-runtime/src/tracking/next/web-tracking-runtime.tsx",
    "packages/web-runtime/src/tracking/types.ts",
    "pnpm-lock.yaml",
    "tools/skopos/actions/measurement-runtime-check.yaml"
  ]
}
```
<!-- skopos:task-state:end -->
