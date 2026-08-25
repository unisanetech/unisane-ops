---
id: 'DOC-b939888a0c84'
owner: 'unisane-ops'
scope: workspace
role: router
lifecycle: active
authority: canonical
provenance: accepted
view: current
---

# Unisane Ops Documentation

This is the repository-local documentation router for the standalone `unisane-ops`
candidate. Product Architecture, Standards, Guides, Decisions, Findings, Patterns,
generated references, and tracked Tasks belong under this repository's `docs/**`
authority. The umbrella repository remains the sole writable product-source authority
until an approved cutover records otherwise.

## Start Here

1. Read [Overview](overview.md) for product and repository boundaries.
2. Read
   [Standalone Repository Transition Readiness](standards/01-standalone-repository-transition-readiness.md)
   before source convergence, history filtering, remote creation, publication, or
   deployment work.
3. Use the transition Standard for the safe no-shadow convergence and disposable-proof
   summaries. Detailed lineage, scanner, locator, and Task receipts are private
   Infrastructure-owned audit Evidence and are deliberately not linked into this future
   public product boundary.
4. The current controlled receipt ID is `OPS-EXTRACTION-T-b222cdbf`. It is not a public
   provenance record, approval, or materialization authority.

## Owner-Local Product Memory

- [Ops product architecture Standard](standards/13-unisane-ops-product-architecture-baseline.md)
- [Accepted Ops Decisions](decisions/)
- [Active Ops Findings](findings/)
- [Ops operator and migration Guides](guides/)
- [Ops documentation Pattern](patterns/)
- [Three active Ops Plans](work/plans/)

## Authority During Transition

- The transition Standard owns the target-local readiness gates, blocker ledger, and
  one-authority cutover contract.
- The migrated Architecture, Standards, Decisions, Findings, Guides, Pattern, and Plans
  are owner-local shadow truth in this candidate. The umbrella remains the sole writable
  authority until the approved cutover; the two copies must not be developed in
  parallel.
- Skopos Tasks own execution and Evidence. This router is not a Task index or a release
  checklist.
- Generated references belong under `docs/reference/generated/**` and are changed only
  through their owner.

## Fail-Closed Rule

No remote, public history, package release, production deployment, or authority cutover
is ready merely because this local candidate exists. Use the transition Standard's gate
status and blocker ledger.
