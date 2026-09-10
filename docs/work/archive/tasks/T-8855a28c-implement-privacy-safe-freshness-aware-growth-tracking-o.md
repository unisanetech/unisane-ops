---
title: "Task: Implement privacy-safe, freshness-aware Growth tracking observation v2 ingestion"
status: complete
owner: "bhaskarbarma"
id: T-8855a28c
scope: "workspace"
role: task
lifecycle: historical
authority: canonical
provenance: accepted
view: exception
risk: standard
proofSubject: task-closure
proofBaseline: baseline-46e28501f4ee4eb9
lastUpdated: 2026-08-31
---

# Task: Implement privacy-safe, freshness-aware Growth tracking observation v2 ingestion

## Changelog

- `2026-08-31`: Synchronized Task state `complete` from Skopos.

## Goal

Implement privacy-safe, freshness-aware Growth tracking observation v2 ingestion

## Acceptance

- Observation v2 requires occurrence and capture timing, bounded provenance, consent, validity, customer-field, transport-field, attempt, latency, status, and diagnostic evidence without raw customer or secret values.
- Artifact ingestion rejects legacy unrestricted payload copies, raw PII, tokens, cookies, full IP addresses, user agents, source URLs, and unbounded provider bodies; the explicit v1 migrator emits only redacted field-state evidence.
- Deduplication groups by environment, logical event, canonical correlation, and a bounded occurrence window, and missing-channel findings appear only after the configured freshness window.
- Focused migration, schema, freshness, redaction, correlation, and reconciliation tests pass together with Growth typecheck, lint, build, formatting, symbols, and repository integrity checks.

## Non-Goals

- Do not connect Meta, ingest live provider data, implement adopter-specific ECOM behavior, publish GTM, or mutate provider configuration.

## Constraints

- Keep canonical outcomes, delivery observations, and provider attribution as separate evidence models.
- Never persist raw customer values or credentials in Growth observation artifacts.

## Admission And Workflow

- Workflow: `tracked`
- Selected risk/detail: `standard` / `standard`
- Recommended risk/detail: `high-impact` / `detailed`
- Selection source: `explicit-override`
- Reason: The goal contains high-impact signal: privacy.
- Reason: The caller explicitly selected standard; Skopos recommended high-impact and kept both values visible.

## Owned Paths

- `docs/reference/generated/repository/standalone-repository-integrity.json`
- `docs/reference/generated/symbols/packages/@unisane__growth.symbols.json`
- `docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md`
- `packages/growth/src/actions/measurement-audit.test.ts`
- `packages/growth/src/console/analytics.test.ts`
- `packages/growth/src/marketing/index.ts`
- `packages/growth/src/marketing/tracking`
- `packages/growth/src/workflows/measurement-audit-execution.test.ts`
- `packages/growth/src/workflows/measurement-audit-execution.ts`

## Ownership Expansions

- None recorded.

## Steps

- [x] **Does this plan change authentication, authorization, privacy, or security-sensitive behavior?** (decision, complete) — Security and privacy decisions should be confirmed explicitly before the agent modifies behavior.
- [x] **Resolve plan decisions** (implementation, complete) — Answer the recommended ask-back questions before implementation so the agent does not guess on high-impact choices.
- [x] **Record Task risk and detail before editing** (implementation, complete) — Confirm whether Task risk is light, standard, or high-impact. Keep the active Task current, use a Plan only for multi-Task direction, add a Decision for durable choices, and add or update a Finding for structural gaps.
- [x] **Review the current pattern in unisane-ops** (implementation, complete) — Use the compact references to confirm the current scope, command surface, and docs entrypoints before editing code.
- [x] **Implement the smallest scoped change** (implementation, complete) — Carry out "Implement privacy-safe, freshness-aware Growth tracking observation v2 ingestion" inside the resolved scope before widening impact to adjacent areas.
- [x] **Sync docs and instruction surfaces if touched** (docs, complete) — Keep docs, instruction mirrors, and generated project knowledge aligned with the implementation.

## Actions And Guards

- No Action or Guard is selected.

## Evidence And Readiness

- Observation v2 requires occurrence and capture timing, bounded provenance, consent, validity, customer-field, transport-field, attempt, latency, status, and diagnostic evidence without raw customer or secret values. (closure, agent-observation)
- Artifact ingestion rejects legacy unrestricted payload copies, raw PII, tokens, cookies, full IP addresses, user agents, source URLs, and unbounded provider bodies; the explicit v1 migrator emits only redacted field-state evidence. (closure, agent-observation)
- Deduplication groups by environment, logical event, canonical correlation, and a bounded occurrence window, and missing-channel findings appear only after the configured freshness window. (closure, agent-observation)
- Focused migration, schema, freshness, redaction, correlation, and reconciliation tests pass together with Growth typecheck, lint, build, formatting, symbols, and repository integrity checks. (closure, agent-observation)

## Memory Obligations

- No durable Memory obligation is inferred.

## Portable Task State

This machine-readable block is the durable source used to rebuild local Skopos state.

<!-- skopos:task-state:start -->
```json
{
  "schemaVersion": 1,
  "id": "T-8855a28c",
  "type": "task",
  "status": "durable",
  "generatedAt": "2026-08-31T20:42:18.390Z",
  "updatedAt": "2026-08-31T21:27:37.836Z",
  "planIds": [],
  "childTasks": [],
  "state": "complete",
  "detail": "standard",
  "title": "Implement privacy-safe, freshness-aware Growth tracking observation v2 ingestion",
  "goal": "Implement privacy-safe, freshness-aware Growth tracking observation v2 ingestion",
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
      "Observation v2 requires occurrence and capture timing, bounded provenance, consent, validity, customer-field, transport-field, attempt, latency, status, and diagnostic evidence without raw customer or secret values.",
      "Artifact ingestion rejects legacy unrestricted payload copies, raw PII, tokens, cookies, full IP addresses, user agents, source URLs, and unbounded provider bodies; the explicit v1 migrator emits only redacted field-state evidence.",
      "Deduplication groups by environment, logical event, canonical correlation, and a bounded occurrence window, and missing-channel findings appear only after the configured freshness window.",
      "Focused migration, schema, freshness, redaction, correlation, and reconciliation tests pass together with Growth typecheck, lint, build, formatting, symbols, and repository integrity checks."
    ],
    "nonGoals": [
      "Do not connect Meta, ingest live provider data, implement adopter-specific ECOM behavior, publish GTM, or mutate provider configuration."
    ],
    "constraints": [
      "Keep canonical outcomes, delivery observations, and provider attribution as separate evidence models.",
      "Never persist raw customer values or credentials in Growth observation artifacts."
    ]
  },
  "risk": "standard",
  "admission": {
    "recommendedRisk": "high-impact",
    "recommendedDetail": "detailed",
    "selectedRisk": "standard",
    "selectedDetail": "standard",
    "selectionSource": "explicit-override",
    "workflow": "tracked",
    "reasons": [
      "The goal contains high-impact signal: privacy.",
      "The caller explicitly selected standard; Skopos recommended high-impact and kept both values visible."
    ],
    "signals": {
      "goalSignals": [
        "privacy"
      ],
      "ownedPathCount": 9,
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
    "baselineId": "baseline-46e28501f4ee4eb9"
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
      "detail": "Carry out \"Implement privacy-safe, freshness-aware Growth tracking observation v2 ingestion\" inside the resolved scope before widening impact to adjacent areas.",
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
      "acceptanceCriterion": "Observation v2 requires occurrence and capture timing, bounded provenance, consent, validity, customer-field, transport-field, attempt, latency, status, and diagnostic evidence without raw customer or secret values.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-2",
      "acceptanceCriterion": "Artifact ingestion rejects legacy unrestricted payload copies, raw PII, tokens, cookies, full IP addresses, user agents, source URLs, and unbounded provider bodies; the explicit v1 migrator emits only redacted field-state evidence.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-3",
      "acceptanceCriterion": "Deduplication groups by environment, logical event, canonical correlation, and a bounded occurrence window, and missing-channel findings appear only after the configured freshness window.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    },
    {
      "id": "acceptance-4",
      "acceptanceCriterion": "Focused migration, schema, freshness, redaction, correlation, and reconciliation tests pass together with Growth typecheck, lint, build, formatting, symbols, and repository integrity checks.",
      "phase": "closure",
      "actionIds": [],
      "guardIds": [],
      "evidence": "agent-observation"
    }
  ],
  "memoryObligations": [],
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
      "resolvedAt": "2026-08-31T20:55:22.233Z",
      "resolvedByActorId": "bhaskarbarma",
      "disposition": {
        "kind": "answered",
        "reason": "Selected Task question option confirm-security-policy.",
        "actorId": "bhaskarbarma",
        "recordedAt": "2026-08-31T20:55:22.233Z",
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
    "docs/reference/generated/repository/standalone-repository-integrity.json",
    "docs/reference/generated/symbols/packages/@unisane__growth.symbols.json",
    "docs/work/plans/unisane-ops-growth-meta-measurement-roadmap.md",
    "packages/growth/src/actions/measurement-audit.test.ts",
    "packages/growth/src/console/analytics.test.ts",
    "packages/growth/src/marketing/index.ts",
    "packages/growth/src/marketing/tracking",
    "packages/growth/src/workflows/measurement-audit-execution.test.ts",
    "packages/growth/src/workflows/measurement-audit-execution.ts"
  ]
}
```
<!-- skopos:task-state:end -->
