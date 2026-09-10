---
title: "Task: Add a hidden developer-friendly Meta credential prompt"
status: complete
owner: "bhaskarbarma"
id: T-04cfd129
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: high-impact
proofSubject: task-closure
proofBaseline: baseline-a9d98a5a5b56fc8d
lastUpdated: 2026-09-02
---

# Task: Add a hidden developer-friendly Meta credential prompt

## Changelog

- `2026-09-02`: Synchronized Task state `complete` from Skopos.

## Goal

Add a hidden developer-friendly Meta credential prompt

## Acceptance

- Interactive local Meta connect prompts for the access token with input hidden when no credential environment value is available
- The prompt never echoes, logs, returns, persists in project config, or passes credential bytes as process arguments
- Non-interactive and JSON execution fail closed unless a credential is supplied through the approved environment ingress
- Environment ingress remains supported for CI and automation, and token-shaped CLI flags remain rejected
- Focused tests cover prompt success, cancellation, non-interactive failure, environment fallback, redaction, and Keychain persistence

## Non-Goals

- Real Meta authorization, live Graph calls, browser OAuth, hosted secret managers, ECOM changes, commit, or push

## Constraints

- Never record a real credential in fixtures, logs, process arguments, config, or returned values

## Admission And Workflow

- Workflow: `strict`
- Selected risk/detail: `high-impact` / `detailed`
- Recommended risk/detail: `standard` / `standard`
- Selection source: `explicit-override`
- Reason: The work changes multiple paths, durable guidance, configuration, or a normal coordinated surface.
- Reason: The caller explicitly selected high-impact; Skopos recommended standard and kept both values visible.

## Owned Paths

- `docs/reference/generated`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `docs/work/tasks`
- `packages/provider-meta`
- `packages/provider-meta/README.md`
- `packages/unisane-ops/src/handlers/connect.ts`
- `packages/unisane-ops/src/host.ts`
- `packages/unisane-ops/src/runtime-adapters/cloud-dns.ts`
- `packages/unisane-ops/test`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Does this plan change authentication, authorization, privacy, or security-sensitive behavior?** (decision, complete) — Security and privacy decisions should be confirmed explicitly before the agent modifies behavior.
- [x] **Resolve plan decisions** (implementation, complete) — Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.
- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Add a hidden developer-friendly Meta credential prompt" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Interactive local Meta connect prompts for the access token with input hidden when no credential environment value is available (closure, agent-observation)
- The prompt never echoes, logs, returns, persists in project config, or passes credential bytes as process arguments (closure, agent-observation)
- Non-interactive and JSON execution fail closed unless a credential is supplied through the approved environment ingress (closure, agent-observation)
- Environment ingress remains supported for CI and automation, and token-shaped CLI flags remain rejected (closure, agent-observation)
- Focused tests cover prompt success, cancellation, non-interactive failure, environment fallback, redaction, and Keychain persistence (closure, agent-observation)

## Memory Obligations

- [complete] standard: The declared Task scope owns canonical standard Memory at docs/standards/13-unisane-ops-product-architecture-baseline.md; review and synchronize it if project truth changes. (target: `docs/standards/13-unisane-ops-product-architecture-baseline.md`); resolution: memory-updated

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-04cfd129",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-09-02T13:08:10.701Z",
  "updatedAt": "2026-09-02T20:24:41.956Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "detailed",
  "title": "Add a hidden developer-friendly Meta credential prompt",
  "goal": "Add a hidden developer-friendly Meta credential prompt",
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
      "Interactive local Meta connect prompts for the access token with input hidden when no credential environment value is available",
      "The prompt never echoes, logs, returns, persists in project config, or passes credential bytes as process arguments",
      "Non-interactive and JSON execution fail closed unless a credential is supplied through the approved environment ingress",
      "Environment ingress remains supported for CI and automation, and token-shaped CLI flags remain rejected",
      "Focused tests cover prompt success, cancellation, non-interactive failure, environment fallback, redaction, and Keychain persistence"
    ],
    "nonGoals": [
      "Real Meta authorization, live Graph calls, browser OAuth, hosted secret managers, ECOM changes, commit, or push"
    ],
    "constraints": [
      "Never record a real credential in fixtures, logs, process arguments, config, or returned values"
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
    "baselineId": "baseline-a9d98a5a5b56fc8d"
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
      "detail": "Carry out \"Add a hidden developer-friendly Meta credential prompt\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Interactive local Meta connect prompts for the access token with input hidden when no credential environment value is available",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "The prompt never echoes, logs, returns, persists in project config, or passes credential bytes as process arguments",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Non-interactive and JSON execution fail closed unless a credential is supplied through the approved environment ingress",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Environment ingress remains supported for CI and automation, and token-shaped CLI flags remain rejected",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-5",
      "acceptanceCriterion": "Focused tests cover prompt success, cancellation, non-interactive failure, environment fallback, redaction, and Keychain persistence",
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
      "resolutionReason": "Documented the approved hidden interactive Meta credential prompt, CI-only environment ingress, Keychain custody, redaction, and fail-closed non-interactive contract.",
      "resolvedAt": "2026-09-02T20:22:32.686Z",
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
      "resolvedOptionId": "confirm-security-policy",
      "resolvedAt": "2026-09-02T20:15:28.219Z",
      "resolvedByActorId": "bhaskarbarma",
      "disposition": {
        "kind": "answered",
        "reason": "Selected Task question option confirm-security-policy.",
        "actorId": "bhaskarbarma",
        "recordedAt": "2026-09-02T20:15:28.219Z",
        "target": {
          "kind": "option",
          "ref": "confirm-security-policy"
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
  "declaredOwnedPaths": [
    "docs/reference/generated",
    "docs/standards/13-unisane-ops-product-architecture-baseline.md",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "docs/work/tasks",
    "packages/provider-meta",
    "packages/provider-meta/README.md",
    "packages/unisane-ops/src/handlers/connect.ts",
    "packages/unisane-ops/src/host.ts",
    "packages/unisane-ops/src/runtime-adapters/cloud-dns.ts",
    "packages/unisane-ops/test"
  ]
}
```
<!-- skopos:task-state:end -->
