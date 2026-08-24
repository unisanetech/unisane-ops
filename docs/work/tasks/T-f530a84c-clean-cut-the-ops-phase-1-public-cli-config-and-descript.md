---
title: "Task: Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter"
status: deferred
owner: "project"
id: T-f530a84c
scope: "unisane-ops"
role: task
lifecycle: active
authority: canonical
provenance: accepted
view: current
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-a402c3faea72685d
lastUpdated: 2026-08-24
---

# Task: Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter

## Changelog

- `2026-08-24`: Synchronized Task state `deferred` from Skopos.

## Goal

Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter

## Acceptance

- The Ops CLI npm package is unisane-ops, exports only the unisane-ops binary and unisane-ops/config, and no transitional unisane package, binary, alias, or forwarding wrapper remains.
- unisane-ops/config exports defineUnisaneProject and defineUnisaneOps, and the loader accepts only unisane.config.ts with either the standalone default export or the exact Framework named ops export.
- @unisane/framework-ops is a serialized-descriptor validator/mapper with zero Framework, Compiler, or Devtools dependencies and no executable bridge, command contribution, implicit compilation, nested CLI, terminal parsing, or process capture.
- Focused Ops-owned package, config-loader, descriptor compatibility/tamper/capability, dependency-boundary, and CLI tests pass without editing Framework/compiler/devtools source.

## Non-Goals

- Do not edit Framework, Compiler, Devtools, the central repository-separation Plan, remotes, registries, hosted governance, provider state, or ordinary feature work.

## Constraints

- Stop at the Framework-owned serialized descriptor typed seam if the exact cross-lane contract is unavailable; do not invent a parallel descriptor schema.

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.
- Reason: The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible.

## Owned Paths

- `unisane-ops/apps/console/README.md`
- `unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx`
- `unisane-ops/docs/overview.md`
- `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`
- `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`
- `unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts`
- `unisane-ops/packages/cloud/src/handlers/dns.ts`
- `unisane-ops/packages/framework-ops`
- `unisane-ops/packages/growth`
- `unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts`
- `unisane-ops/packages/ops-mcp/README.md`
- `unisane-ops/packages/provider-aws`
- `unisane-ops/packages/provider-google`
- `unisane-ops/packages/unisane`
- `unisane-ops/packages/unisane-ops`
- `unisane-ops/plugins/unisane-ops`
- `unisane-ops/scripts/check-package-contents.mjs`
- `unisane-ops/tools/repository/standalone-integrity-policy.json`
- `unisane-ops/tools/skopos/AGENTS.staged.md`

## Ownership Expansions

- `2026-08-24T19:37:11.849Z` by `codex-ops-phase1`: `unisane-ops/apps/console/README.md`, `unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx`, `unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json`, `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`, `unisane-ops/packages/growth`, `unisane-ops/packages/ops-mcp/README.md`, `unisane-ops/packages/provider-aws`, `unisane-ops/packages/provider-google`, `unisane-ops/plugins/unisane-ops`, `unisane-ops/scripts/check-package-contents.mjs`, `unisane-ops/tools/repository/standalone-integrity-policy.json` — The public CLI coordinate clean cut must update every current Ops-owned command/config consumer and the owner-local package/readiness projections in the same unreleased cut.
- `2026-08-24T19:37:52.421Z` by `codex-ops-phase1`: `unisane-ops/docs/overview.md`, `unisane-ops/tools/skopos/AGENTS.staged.md` — Owner-local Ops product and staged agent routing must name the final unisane-ops CLI in the same clean cut.
- `2026-08-24T19:45:57.907Z` by `codex-ops-phase1`: `unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts`, `unisane-ops/packages/cloud/src/handlers/dns.ts`, `unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts` — Adopt exact active Ops-owned command-coordinate consumers identified during implementation; no Framework-owned source is included.

## Steps

- [ ] **Review the current pattern in Unisane Ops** (implementation, pending) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [ ] **Implement the smallest scoped change** (implementation, pending) — Carry out "Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter" inside the resolved scope before widening impact to adjacent areas.
- [ ] **Sync docs and instruction surfaces if touched** (docs, pending) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.
- [ ] **Check canonical Unisane core docs** (action, pending) — Required by Guard unisane.docs.check-core.
- [ ] **Check Unisane Ops package architecture** (action, pending) — Required by Guard unisane.ops.architecture-check.
- [ ] **Validate the Unisane Ops console** (action, pending) — Required by Guard unisane.ops.console.validate.
- [ ] **Validate Unisane Ops growth** (action, pending) — Required by Guard unisane.ops.growth.validate.
- [ ] **Validate the Unisane Ops Google provider** (action, pending) — Required by Guard unisane.ops.provider-google.validate.
- [ ] **Check the Platforms current-source disposition ledger** (action, pending) — Required by Guard unisane.platforms-disposition.check.
- [ ] **Check the Unisane repository source boundary** (action, pending) — Required by Guard unisane.repository-source-boundary.check.
- [ ] **Check the Unisane symbol reference** (action, pending) — Required by Guard unisane.symbol-reference.check.
- [ ] **Verify packed UI producer artifacts** (action, pending) — Required by Guard unisane.ui.packed-producer-certificate.
- [ ] **Typecheck the Unisane workspace** (action, pending) — Required by Guard quality.typecheck.

## Actions And Guards

- Action `unisane.docs.check-core`: Required by Guard unisane.docs.check-core.
- Action `unisane.ops.architecture-check`: Required by Guard unisane.ops.architecture-check.
- Action `unisane.ops.console.validate`: Required by Guard unisane.ops.console.validate.
- Action `unisane.ops.growth.validate`: Required by Guard unisane.ops.growth.validate.
- Action `unisane.ops.provider-google.validate`: Required by Guard unisane.ops.provider-google.validate.
- Action `unisane.platforms-disposition.check`: Required by Guard unisane.platforms-disposition.check.
- Action `unisane.repository-source-boundary.check`: Required by Guard unisane.repository-source-boundary.check.
- Action `unisane.symbol-reference.check`: Required by Guard unisane.symbol-reference.check.
- Action `unisane.ui.packed-producer-certificate`: Required by Guard unisane.ui.packed-producer-certificate.
- Action `unisane.workspace.typecheck`: Required by Guard quality.typecheck.
- Guard `quality.focused-behavior-proof`
- Guard `quality.typecheck`
- Guard `unisane.docs.check-core`
- Guard `unisane.ops.architecture-check`
- Guard `unisane.ops.console.validate`
- Guard `unisane.ops.growth.validate`
- Guard `unisane.ops.provider-google.validate`
- Guard `unisane.platforms-disposition.check`
- Guard `unisane.repository-source-boundary.check`
- Guard `unisane.symbol-reference.check`
- Guard `unisane.ui.packed-producer-certificate`

## Evidence And Readiness

- The Ops CLI npm package is unisane-ops, exports only the unisane-ops binary and unisane-ops/config, and no transitional unisane package, binary, alias, or forwarding wrapper remains. (closure, agent-observation)
- unisane-ops/config exports defineUnisaneProject and defineUnisaneOps, and the loader accepts only unisane.config.ts with either the standalone default export or the exact Framework named ops export. (closure, agent-observation)
- @unisane/framework-ops is a serialized-descriptor validator/mapper with zero Framework, Compiler, or Devtools dependencies and no executable bridge, command contribution, implicit compilation, nested CLI, terminal parsing, or process capture. (closure, agent-observation)
- Focused Ops-owned package, config-loader, descriptor compatibility/tamper/capability, dependency-boundary, and CLI tests pass without editing Framework/compiler/devtools source. (closure, agent-observation)
- Guard quality.focused-behavior-proof: Behavior changes require focused proof (closure, agent-observation)
- Guard quality.typecheck: High-impact TypeScript changes require workspace type proof (closure, source-bound-action)
- Guard unisane.docs.check-core: Project Memory changes require docs proof (closure, source-bound-action)
- Guard unisane.ops.architecture-check: Unisane Ops structural changes require package-boundary proof (closure, source-bound-action)
- Guard unisane.ops.console.validate: Ops console changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.growth.validate: Ops growth changes require focused package proof (closure, source-bound-action)
- Guard unisane.ops.provider-google.validate: Ops Google-provider changes require focused package proof (closure, source-bound-action)
- Guard unisane.platforms-disposition.check: Platforms topology inputs require an exhaustive disposition ledger (closure, source-bound-action)
- Guard unisane.repository-source-boundary.check: Stable repository sources require source-boundary freshness proof (closure, source-bound-action)
- Guard unisane.symbol-reference.check: Symbol reference inputs require freshness proof (closure, source-bound-action)
- Guard unisane.ui.packed-producer-certificate: UI producer changes require immutable packed-consumer proof (closure, source-bound-action)

## Memory Obligations

- [complete] standard: High-impact work must review and synchronize the existing standard Memory for Scope unisane-ops. (target: `unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-f530a84c",
  "type": "task",
  "status": "active",
  "generatedAt": "2026-08-24T19:31:03.488Z",
  "updatedAt": "2026-08-24T19:56:44.553Z",
  "planIds": [],
  "childTasks": [],
  "state": "deferred",
  "detail": "detailed",
  "title": "Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter",
  "goal": "Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter",
  "scope": {
    "query": "unisane-ops",
    "matchedBy": "id",
    "scope": {
      "id": "unisane-ops",
      "kind": "product",
      "title": "Unisane Ops",
      "path": "unisane-ops",
      "aliases": [
        "ops"
      ],
      "summary": "Unisane Ops (platform-product).",
      "confidence": "high",
      "parent": "workspace",
      "ancestorIds": [
        "workspace"
      ],
      "profile": "platform-product",
      "memoryRoot": "unisane-ops/docs",
      "codeRoots": [
        "unisane-ops"
      ],
      "dependsOn": [
        "workspace"
      ],
      "owners": [
        "unisane-ops"
      ]
    }
  },
  "contract": {
    "acceptanceCriteria": [
      "The Ops CLI npm package is unisane-ops, exports only the unisane-ops binary and unisane-ops/config, and no transitional unisane package, binary, alias, or forwarding wrapper remains.",
      "unisane-ops/config exports defineUnisaneProject and defineUnisaneOps, and the loader accepts only unisane.config.ts with either the standalone default export or the exact Framework named ops export.",
      "@unisane/framework-ops is a serialized-descriptor validator/mapper with zero Framework, Compiler, or Devtools dependencies and no executable bridge, command contribution, implicit compilation, nested CLI, terminal parsing, or process capture.",
      "Focused Ops-owned package, config-loader, descriptor compatibility/tamper/capability, dependency-boundary, and CLI tests pass without editing Framework/compiler/devtools source."
    ],
    "nonGoals": [
      "Do not edit Framework, Compiler, Devtools, the central repository-separation Plan, remotes, registries, hosted governance, provider state, or ordinary feature work."
    ],
    "constraints": [
      "Stop at the Framework-owned serialized descriptor typed seam if the exact cross-lane contract is unavailable; do not invent a parallel descriptor schema."
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
      "ownedPathCount": 3,
      "affectedScopeIds": [
        "unisane-ops",
        "workspace"
      ],
      "impactCategories": [
        "scope-source"
      ],
      "proofSubjectKind": "task-closure"
    }
  },
  "proofSubject": {
    "kind": "task-closure",
    "baselineId": "baseline-a402c3faea72685d"
  },
  "priority": 0,
  "dependencyTaskIds": [],
  "steps": [
    {
      "id": "step-review-current-pattern",
      "kind": "implementation",
      "title": "Review the current pattern in Unisane Ops",
      "detail": "Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.",
      "status": "pending"
    },
    {
      "id": "step-implement-scoped-change",
      "kind": "implementation",
      "title": "Implement the smallest scoped change",
      "detail": "Carry out \"Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter\" inside the resolved scope before widening impact to adjacent areas.",
      "status": "pending"
    },
    {
      "id": "step-sync-knowledge",
      "kind": "docs",
      "title": "Sync docs and instruction surfaces if touched",
      "detail": "Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.",
      "status": "pending"
    },
    {
      "id": "action-unisane.docs.check-core",
      "kind": "action",
      "title": "Check canonical Unisane core docs",
      "detail": "Required by Guard unisane.docs.check-core.",
      "status": "pending"
    },
    {
      "id": "action-unisane.ops.architecture-check",
      "kind": "action",
      "title": "Check Unisane Ops package architecture",
      "detail": "Required by Guard unisane.ops.architecture-check.",
      "status": "pending"
    },
    {
      "id": "action-unisane.ops.console.validate",
      "kind": "action",
      "title": "Validate the Unisane Ops console",
      "detail": "Required by Guard unisane.ops.console.validate.",
      "status": "pending"
    },
    {
      "id": "action-unisane.ops.growth.validate",
      "kind": "action",
      "title": "Validate Unisane Ops growth",
      "detail": "Required by Guard unisane.ops.growth.validate.",
      "status": "pending"
    },
    {
      "id": "action-unisane.ops.provider-google.validate",
      "kind": "action",
      "title": "Validate the Unisane Ops Google provider",
      "detail": "Required by Guard unisane.ops.provider-google.validate.",
      "status": "pending"
    },
    {
      "id": "action-unisane.platforms-disposition.check",
      "kind": "action",
      "title": "Check the Platforms current-source disposition ledger",
      "detail": "Required by Guard unisane.platforms-disposition.check.",
      "status": "pending"
    },
    {
      "id": "action-unisane.repository-source-boundary.check",
      "kind": "action",
      "title": "Check the Unisane repository source boundary",
      "detail": "Required by Guard unisane.repository-source-boundary.check.",
      "status": "pending"
    },
    {
      "id": "action-unisane.symbol-reference.check",
      "kind": "action",
      "title": "Check the Unisane symbol reference",
      "detail": "Required by Guard unisane.symbol-reference.check.",
      "status": "pending"
    },
    {
      "id": "action-unisane.ui.packed-producer-certificate",
      "kind": "action",
      "title": "Verify packed UI producer artifacts",
      "detail": "Required by Guard unisane.ui.packed-producer-certificate.",
      "status": "pending"
    },
    {
      "id": "action-unisane.workspace.typecheck",
      "kind": "action",
      "title": "Typecheck the Unisane workspace",
      "detail": "Required by Guard quality.typecheck.",
      "status": "pending"
    }
  ],
  "selectedActions": [
    {
      "id": "unisane.docs.check-core",
      "title": "Check canonical Unisane core docs",
      "category": "docs-validator",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-docs-check-core.yaml",
      "reason": "Required by Guard unisane.docs.check-core.",
      "matchedPaths": [
        "unisane-ops/docs/overview.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.architecture-check",
      "title": "Check Unisane Ops package architecture",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-architecture-check.yaml",
      "reason": "Required by Guard unisane.ops.architecture-check.",
      "matchedPaths": [
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
        "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
        "unisane-ops/packages/cloud/src/handlers/dns.ts",
        "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.console.validate",
      "title": "Validate the Unisane Ops console",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-console-validate.yaml",
      "reason": "Required by Guard unisane.ops.console.validate.",
      "matchedPaths": [
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.growth.validate",
      "title": "Validate Unisane Ops growth",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-growth-validate.yaml",
      "reason": "Required by Guard unisane.ops.growth.validate.",
      "matchedPaths": [
        "unisane-ops/packages/growth"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ops.provider-google.validate",
      "title": "Validate the Unisane Ops Google provider",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-ops-provider-google-validate.yaml",
      "reason": "Required by Guard unisane.ops.provider-google.validate.",
      "matchedPaths": [
        "unisane-ops/packages/provider-google"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.platforms-disposition.check",
      "title": "Check the Platforms current-source disposition ledger",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-platforms-disposition-check.yaml",
      "reason": "Required by Guard unisane.platforms-disposition.check.",
      "matchedPaths": [
        "unisane-ops/apps/console/README.md",
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
        "unisane-ops/docs/overview.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
        "unisane-ops/packages/cloud/src/handlers/dns.ts",
        "unisane-ops/packages/framework-ops",
        "unisane-ops/packages/growth",
        "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts",
        "unisane-ops/packages/ops-mcp/README.md",
        "unisane-ops/packages/provider-aws",
        "unisane-ops/packages/provider-google",
        "unisane-ops/packages/unisane",
        "unisane-ops/packages/unisane-ops",
        "unisane-ops/plugins/unisane-ops",
        "unisane-ops/scripts/check-package-contents.mjs",
        "unisane-ops/tools/repository/standalone-integrity-policy.json",
        "unisane-ops/tools/skopos/AGENTS.staged.md"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.repository-source-boundary.check",
      "title": "Check the Unisane repository source boundary",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-repository-source-boundary-check.yaml",
      "reason": "Required by Guard unisane.repository-source-boundary.check.",
      "matchedPaths": [
        "unisane-ops/apps/console/README.md",
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
        "unisane-ops/docs/overview.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
        "unisane-ops/packages/cloud/src/handlers/dns.ts",
        "unisane-ops/packages/framework-ops",
        "unisane-ops/packages/growth",
        "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts",
        "unisane-ops/packages/ops-mcp/README.md",
        "unisane-ops/packages/provider-aws",
        "unisane-ops/packages/provider-google",
        "unisane-ops/packages/unisane",
        "unisane-ops/packages/unisane-ops",
        "unisane-ops/plugins/unisane-ops",
        "unisane-ops/scripts/check-package-contents.mjs",
        "unisane-ops/tools/repository/standalone-integrity-policy.json",
        "unisane-ops/tools/skopos/AGENTS.staged.md"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.symbol-reference.check",
      "title": "Check the Unisane symbol reference",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-symbol-reference-check.yaml",
      "reason": "Required by Guard unisane.symbol-reference.check.",
      "matchedPaths": [
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
        "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
        "unisane-ops/packages/cloud/src/handlers/dns.ts",
        "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts"
      ],
      "outputPaths": [],
      "requiresApproval": false
    },
    {
      "id": "unisane.ui.packed-producer-certificate",
      "title": "Verify packed UI producer artifacts",
      "category": "quality-check",
      "safety": "mutating",
      "sourcePath": "tools/skopos/actions/unisane-ui-packed-producer-certificate.yaml",
      "reason": "Required by Guard unisane.ui.packed-producer-certificate.",
      "matchedPaths": [
        "unisane-ops/apps/console/README.md",
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx"
      ],
      "outputPaths": [
        "unisane-ui/packed-producer-certificate.json"
      ],
      "requiresApproval": false
    },
    {
      "id": "unisane.workspace.typecheck",
      "title": "Typecheck the Unisane workspace",
      "category": "quality-check",
      "safety": "read-only",
      "sourcePath": "tools/skopos/actions/unisane-workspace-typecheck.yaml",
      "reason": "Required by Guard quality.typecheck.",
      "matchedPaths": [
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
        "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
        "unisane-ops/packages/cloud/src/handlers/dns.ts",
        "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts"
      ],
      "outputPaths": [],
      "requiresApproval": false
    }
  ],
  "selectedGuardIds": [
    "quality.focused-behavior-proof",
    "quality.typecheck",
    "unisane.docs.check-core",
    "unisane.ops.architecture-check",
    "unisane.ops.console.validate",
    "unisane.ops.growth.validate",
    "unisane.ops.provider-google.validate",
    "unisane.platforms-disposition.check",
    "unisane.repository-source-boundary.check",
    "unisane.symbol-reference.check",
    "unisane.ui.packed-producer-certificate"
  ],
  "evidenceRequirements": [
    {
      "id": "acceptance-1",
      "acceptanceCriterion": "The Ops CLI npm package is unisane-ops, exports only the unisane-ops binary and unisane-ops/config, and no transitional unisane package, binary, alias, or forwarding wrapper remains.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "unisane-ops/config exports defineUnisaneProject and defineUnisaneOps, and the loader accepts only unisane.config.ts with either the standalone default export or the exact Framework named ops export.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "@unisane/framework-ops is a serialized-descriptor validator/mapper with zero Framework, Compiler, or Devtools dependencies and no executable bridge, command contribution, implicit compilation, nested CLI, terminal parsing, or process capture.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused Ops-owned package, config-loader, descriptor compatibility/tamper/capability, dependency-boundary, and CLI tests pass without editing Framework/compiler/devtools source.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "guard-quality.focused-behavior-proof",
      "acceptanceCriterion": "Guard quality.focused-behavior-proof: Behavior changes require focused proof",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [
        "quality.focused-behavior-proof"
      ],
      "evidence": "agent-observation"
    },
    {
      "id": "guard-quality.typecheck",
      "acceptanceCriterion": "Guard quality.typecheck: High-impact TypeScript changes require workspace type proof",
      "phase": "closure",
      "actionIds": [
        "unisane.workspace.typecheck"
      ],
      "guardIds": [
        "quality.typecheck"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.docs.check-core",
      "acceptanceCriterion": "Guard unisane.docs.check-core: Project Memory changes require docs proof",
      "phase": "closure",
      "actionIds": [
        "unisane.docs.check-core"
      ],
      "guardIds": [
        "unisane.docs.check-core"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.architecture-check",
      "acceptanceCriterion": "Guard unisane.ops.architecture-check: Unisane Ops structural changes require package-boundary proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.architecture-check"
      ],
      "guardIds": [
        "unisane.ops.architecture-check"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.console.validate",
      "acceptanceCriterion": "Guard unisane.ops.console.validate: Ops console changes require focused package proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.console.validate"
      ],
      "guardIds": [
        "unisane.ops.console.validate"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.growth.validate",
      "acceptanceCriterion": "Guard unisane.ops.growth.validate: Ops growth changes require focused package proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.growth.validate"
      ],
      "guardIds": [
        "unisane.ops.growth.validate"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ops.provider-google.validate",
      "acceptanceCriterion": "Guard unisane.ops.provider-google.validate: Ops Google-provider changes require focused package proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ops.provider-google.validate"
      ],
      "guardIds": [
        "unisane.ops.provider-google.validate"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.platforms-disposition.check",
      "acceptanceCriterion": "Guard unisane.platforms-disposition.check: Platforms topology inputs require an exhaustive disposition ledger",
      "phase": "closure",
      "actionIds": [
        "unisane.platforms-disposition.check"
      ],
      "guardIds": [
        "unisane.platforms-disposition.check"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.repository-source-boundary.check",
      "acceptanceCriterion": "Guard unisane.repository-source-boundary.check: Stable repository sources require source-boundary freshness proof",
      "phase": "closure",
      "actionIds": [
        "unisane.repository-source-boundary.check"
      ],
      "guardIds": [
        "unisane.repository-source-boundary.check"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.symbol-reference.check",
      "acceptanceCriterion": "Guard unisane.symbol-reference.check: Symbol reference inputs require freshness proof",
      "phase": "closure",
      "actionIds": [
        "unisane.symbol-reference.check"
      ],
      "guardIds": [
        "unisane.symbol-reference.check"
      ],
      "evidence": "source-bound-action"
    },
    {
      "id": "guard-unisane.ui.packed-producer-certificate",
      "acceptanceCriterion": "Guard unisane.ui.packed-producer-certificate: UI producer changes require immutable packed-consumer proof",
      "phase": "closure",
      "actionIds": [
        "unisane.ui.packed-producer-certificate"
      ],
      "guardIds": [
        "unisane.ui.packed-producer-certificate"
      ],
      "evidence": "source-bound-action"
    }
  ],
  "memoryObligations": [
    {
      "id": "memory-standard-ca03a29925",
      "role": "standard",
      "reason": "High-impact work must review and synchronize the existing standard Memory for Scope unisane-ops.",
      "status": "complete",
      "targetPath": "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
      "resolution": "memory-updated",
      "resolutionReason": "Updated the owner-local transition Standard for the final unisane-ops package/binary/config coordinate, removed executable Framework bridge, private typed descriptor seam, and exact Migration 1 dependency.",
      "resolvedAt": "2026-08-24T19:53:05.868Z",
      "resolvedByActorId": "codex-ops-phase1"
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
      "command": "skopos task child start 'T-f530a84c' 'Continue Clean-cut the Ops Phase 1 public CLI, config, and descriptor adapter as bounded follow-up work' . --scope 'unisane-ops' --own 'unisane-ops/apps/console/README.md' --own 'unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx' --own 'unisane-ops/docs/overview.md' --own 'unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json' --own 'unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md' --own 'unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts' --own 'unisane-ops/packages/cloud/src/handlers/dns.ts' --own 'unisane-ops/packages/growth' --own 'unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts' --own 'unisane-ops/packages/ops-mcp/README.md' --own 'unisane-ops/packages/provider-aws' --own 'unisane-ops/packages/provider-google' --own 'unisane-ops/plugins/unisane-ops' --own 'unisane-ops/scripts/check-package-contents.mjs' --own 'unisane-ops/tools/repository/standalone-integrity-policy.json' --own 'unisane-ops/tools/skopos/AGENTS.staged.md' --reason 'The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (docs).' --actor 'codex-ops-phase1'",
      "ownedPaths": [
        "unisane-ops/apps/console/README.md",
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
        "unisane-ops/docs/overview.md",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
        "unisane-ops/packages/cloud/src/handlers/dns.ts",
        "unisane-ops/packages/growth",
        "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts",
        "unisane-ops/packages/ops-mcp/README.md",
        "unisane-ops/packages/provider-aws",
        "unisane-ops/packages/provider-google",
        "unisane-ops/plugins/unisane-ops",
        "unisane-ops/scripts/check-package-contents.mjs",
        "unisane-ops/tools/repository/standalone-integrity-policy.json",
        "unisane-ops/tools/skopos/AGENTS.staged.md"
      ],
      "scopeId": "unisane-ops",
      "reason": "The Task may be drifting from its admitted subject because ownership expanded 3 times and new impact categories appeared (docs).",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.docs.check-core",
      "title": "Check canonical Unisane core docs",
      "summary": "Required by Guard unisane.docs.check-core.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.docs.check-core",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.ops.architecture-check",
      "title": "Check Unisane Ops package architecture",
      "summary": "Required by Guard unisane.ops.architecture-check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.architecture-check",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.ops.console.validate",
      "title": "Validate the Unisane Ops console",
      "summary": "Required by Guard unisane.ops.console.validate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.console.validate",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.ops.growth.validate",
      "title": "Validate Unisane Ops growth",
      "summary": "Required by Guard unisane.ops.growth.validate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.growth.validate",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.ops.provider-google.validate",
      "title": "Validate the Unisane Ops Google provider",
      "summary": "Required by Guard unisane.ops.provider-google.validate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ops.provider-google.validate",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.platforms-disposition.check",
      "title": "Check the Platforms current-source disposition ledger",
      "summary": "Required by Guard unisane.platforms-disposition.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.platforms-disposition.check",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.repository-source-boundary.check",
      "title": "Check the Unisane repository source boundary",
      "summary": "Required by Guard unisane.repository-source-boundary.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.repository-source-boundary.check",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.symbol-reference.check",
      "title": "Check the Unisane symbol reference",
      "summary": "Required by Guard unisane.symbol-reference.check.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.symbol-reference.check",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.ui.packed-producer-certificate",
      "title": "Verify packed UI producer artifacts",
      "summary": "Required by Guard unisane.ui.packed-producer-certificate.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.ui.packed-producer-certificate",
      "blocking": false,
      "status": "open"
    },
    {
      "id": "run-unisane.workspace.typecheck",
      "title": "Typecheck the Unisane workspace",
      "summary": "Required by Guard quality.typecheck.",
      "priority": "medium",
      "actionKind": "run-action",
      "actionId": "unisane.workspace.typecheck",
      "blocking": false,
      "status": "open"
    }
  ],
  "ownershipExpansions": [
    {
      "paths": [
        "unisane-ops/apps/console/README.md",
        "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
        "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
        "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
        "unisane-ops/packages/growth",
        "unisane-ops/packages/ops-mcp/README.md",
        "unisane-ops/packages/provider-aws",
        "unisane-ops/packages/provider-google",
        "unisane-ops/plugins/unisane-ops",
        "unisane-ops/scripts/check-package-contents.mjs",
        "unisane-ops/tools/repository/standalone-integrity-policy.json"
      ],
      "reason": "The public CLI coordinate clean cut must update every current Ops-owned command/config consumer and the owner-local package/readiness projections in the same unreleased cut.",
      "actorId": "codex-ops-phase1",
      "recordedAt": "2026-08-24T19:37:11.849Z",
      "baselinePaths": [
        {
          "path": "unisane-ops/apps/console/README.md",
          "digest": "16223dc2fedd8b45c5be6a901ba4cdeb564bcdd13dfc71fa213b36161653c267",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
          "digest": "359a3038e54f305d92d386bc2cedaf9d5776436007c6fadaeae656150f792590",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
          "digest": "8a3a358269ae3ce616a601df645643f43b2d2a6979c1178d589d790f8906df76",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
          "digest": "aea7e7ff6f9ab371fde9b831f553090af9070f72aac959e7150dc61fc68fba56",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/packages/growth",
          "digest": "bc36ac4593b5ca1cff804721d0b13211f01c642e12338f30f6a17f40377b70c7",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/packages/ops-mcp/README.md",
          "digest": "306f6f74ae33afbcb7ac4236db866fa5cdaab8b0fcdb4d33948af500244009c3",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/packages/provider-aws",
          "digest": "a03b16d7ee2783964c560b67b987fd0cbb9e9a928d551d96f8c0dc39b68d8c88",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/packages/provider-google",
          "digest": "0bae327508d4d9eb10144284856b6282c28db76c2b1ff5bdffe384a6a4ac9295",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/plugins/unisane-ops",
          "digest": "9653b5db9e795f19e3274b6b6d822ca5bc4521a4d75c8b38f78f9ac5335f19dd",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/scripts/check-package-contents.mjs",
          "digest": "56dae5d2a4e8bc97b3a82caa70108e91fcc03a43055f66f20a1323988d357699",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/tools/repository/standalone-integrity-policy.json",
          "digest": "a77d1dde3028758644b1f3e16cc6f22e5f626a4d8561afe8b7507594a86e9029",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "unisane-ops",
      "nextScopeId": "unisane-ops",
      "affectedScopeIds": [
        "unisane-ops"
      ]
    },
    {
      "paths": [
        "unisane-ops/docs/overview.md",
        "unisane-ops/tools/skopos/AGENTS.staged.md"
      ],
      "reason": "Owner-local Ops product and staged agent routing must name the final unisane-ops CLI in the same clean cut.",
      "actorId": "codex-ops-phase1",
      "recordedAt": "2026-08-24T19:37:52.421Z",
      "baselinePaths": [
        {
          "path": "unisane-ops/docs/overview.md",
          "digest": "dc5e60536e48bca9edb6a3ab97a0b4cbe23b984030b041a961d11d72d42a4acc",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/tools/skopos/AGENTS.staged.md",
          "digest": "2369e563867475d0b3621ef83df45099749875fe5d897c72129ccbe6283374cc",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "unisane-ops",
      "nextScopeId": "unisane-ops",
      "affectedScopeIds": [
        "unisane-ops"
      ]
    },
    {
      "paths": [
        "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
        "unisane-ops/packages/cloud/src/handlers/dns.ts",
        "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts"
      ],
      "reason": "Adopt exact active Ops-owned command-coordinate consumers identified during implementation; no Framework-owned source is included.",
      "actorId": "codex-ops-phase1",
      "recordedAt": "2026-08-24T19:45:57.907Z",
      "baselinePaths": [
        {
          "path": "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
          "digest": "83975844d07c43fbb39b5676a34fb569b4032d90fc86c15108a7918d9cc6f2a3",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/packages/cloud/src/handlers/dns.ts",
          "digest": "9411db0c979f649925722e7d760c8d66245bf5b109396536b72fc18929be50f5",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        },
        {
          "path": "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts",
          "digest": "64f83946da0f7dcb4608a65101d5e5300e6f83ab79c5a760d4aa6e76b4b7c110",
          "digestAlgorithm": "skopos-path-v2-code-unit-segment-dfs"
        }
      ],
      "classification": "within-scope",
      "priorScopeId": "unisane-ops",
      "nextScopeId": "unisane-ops",
      "affectedScopeIds": [
        "unisane-ops"
      ]
    }
  ],
  "disposition": {
    "kind": "defer",
    "reason": "Stopped at the required typed seam: Migration 1 has not supplied the canonical serialized Framework descriptor schema/version, digest canonicalization, compatibility semantics, or valid/tampered fixtures. Focused Actions also cannot materialize local dependencies until the coordinator migrates the root lock and remaining Platform consumers from workspace package unisane to unisane-ops.",
    "actorId": "codex-ops-phase1",
    "recordedAt": "2026-08-24T19:56:44.553Z",
    "priorState": "active",
    "nextState": "deferred"
  },
  "declaredOwnedPaths": [
    "unisane-ops/apps/console/README.md",
    "unisane-ops/apps/console/src/browser/screens/seo/seo-opportunity-review-pane.test.tsx",
    "unisane-ops/docs/overview.md",
    "unisane-ops/docs/reference/generated/repository/standalone-repository-integrity.json",
    "unisane-ops/docs/standards/01-standalone-repository-transition-readiness.md",
    "unisane-ops/packages/cloud/src/handlers/cloudflare-resources.ts",
    "unisane-ops/packages/cloud/src/handlers/dns.ts",
    "unisane-ops/packages/framework-ops",
    "unisane-ops/packages/growth",
    "unisane-ops/packages/ops-engine/src/__tests__/pack.test.ts",
    "unisane-ops/packages/ops-mcp/README.md",
    "unisane-ops/packages/provider-aws",
    "unisane-ops/packages/provider-google",
    "unisane-ops/packages/unisane",
    "unisane-ops/packages/unisane-ops",
    "unisane-ops/plugins/unisane-ops",
    "unisane-ops/scripts/check-package-contents.mjs",
    "unisane-ops/tools/repository/standalone-integrity-policy.json",
    "unisane-ops/tools/skopos/AGENTS.staged.md"
  ]
}
```
<!-- skopos:task-state:end -->
