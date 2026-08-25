---
id: 'PAT-92408382ad1e'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: pattern
lifecycle: durable
authority: supporting
provenance: accepted
view: current
kind: failure-pattern
status: accepted
appliesTo:
  - 'product-design'
  - 'data-workflows'
  - 'progressive-disclosure'
---

# Human-Friendly Summary Erases Decision Depth

## Wrong Pattern

A machine-heavy workflow is made “human friendly” by replacing its complete decision
model with a small fixed set of summary cards.

## Symptom / Failure Mode

The underlying state still contains the full research, comparison, or planning evidence,
but the operator can see only a capped sample. The interface looks cleaner while no
longer answering the product's primary question or supporting real decisions.

## Root Cause

Visual density was treated as the problem instead of hierarchy, navigation, filtering,
pagination, vocabulary, and progressive disclosure. Simplification was measured by how
little data remained visible rather than how easily a user could move from summary to
the exact supporting evidence.

## Correct Pattern

Preserve the complete decision model and simplify how users enter and navigate it. Lead
with a clear purpose and a few truthful summaries, then provide focused views, filters,
sorting, pagination, and drill-downs for the full evidence. Remove machine terminology,
duplicate ownership, and raw implementation detail—not domain capabilities needed to do
the job.

When provider performance data and independent research both exist, keep their roles
explicit. Performance evidence validates what happened; research evidence supports what
to target next. One must not silently replace the other.

## Detection Rule

- the headless state contains materially more decision evidence than any reachable UI
- a capped `slice()` or fixed card grid is the only presentation of a large dataset
- “human friendly” acceptance checks cover visual cleanliness but not task completion
- independent research disappears when a performance provider is missing
- the old workflow could answer a core user question that the replacement cannot

## Fix Recipe

1. Restate the product question and identify every evidence family needed to answer it.
2. Compare the old reachable capabilities with both the new state and new UI.
3. Remove duplicate or implementation-oriented views, but retain unique decision
   capabilities.
4. Build one clear default view plus progressive views for the remaining evidence.
5. Add search, filters, sorting, pagination, responsive presentation, and honest source
   labels in proportion to dataset size.
6. Prove the real project dataset is reachable, not merely present in serialized state.

## Linked Artifacts

- Decision:
  `docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md`
- Plan:
  `docs/work/plans/unisane-ops-growth-onboarding-and-developer-experience-convergence-plan.md`
- Historical execution record: `docs/work/archive/tasks/P120-W3.md`

## Changelog

- `2026-07-30`: Added after the P120-W3 Research redesign retained thousands of
  keyword and supporting research records in state but exposed only a capped card
  sample, weakening Growth's research-led product position.
