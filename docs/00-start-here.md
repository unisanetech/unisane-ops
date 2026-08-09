---
id: 'DOC-b939888a0c84'
owner: 'unisane-ops'
scope: unisane-ops
role: router
lifecycle: durable
authority: canonical
provenance: accepted
view: transition
---

# Unisane Ops Documentation

This is the compact router for the future standalone `unisane-ops` repository.
It belongs to the temporary umbrella child Scope `unisane-ops`; that registration makes
this directory current Project Memory but does not create an independent repository or
Skopos authority. The umbrella repository remains the sole writable source authority
until an approved cutover records otherwise.

## Start Here

1. Read [Overview](overview.md) for product and repository boundaries.
2. Read
   [Standalone Repository Transition Readiness](standards/01-standalone-repository-transition-readiness.md)
   before source convergence, history filtering, remote creation, publication, or
   deployment work.
3. Inspect the generated [source disposition ledger](reference/generated/repository/source-disposition-ledger.json),
   [history filter specification](reference/generated/repository/history-filter-spec.json),
   and [public-safety scan specification](reference/generated/repository/public-safety-scan-spec.json)
   for the current no-shadow convergence checkpoint.
4. For the disposable extraction proof, inspect the
   [provenance receipt](reference/generated/repository/extraction-proof/T-b222cdbf/provenance-receipt.json),
   [commit map](reference/generated/repository/extraction-proof/T-b222cdbf/commit-map.json),
   [redacted safety receipt](reference/generated/repository/extraction-proof/T-b222cdbf/public-safety-scan-receipt.json),
   and [owner-decision ledger](reference/generated/repository/extraction-proof/T-b222cdbf/owner-decision-ledger.json).

## Authority During Transition

- The transition Standard owns the target-local readiness gates, blocker ledger, and
  one-authority cutover contract.
- The umbrella Ops product Architecture, provider-safety Standard, accepted Decisions,
  and extraction Plan remain authoritative inputs until their reviewed owner-local
  versions move here.
- Skopos Tasks own execution and Evidence. This router is not a Task index or a release
  checklist.
- Generated references belong under `docs/reference/generated/**` and are changed only
  through their owner.

## Fail-Closed Rule

No local shadow, remote, public history, package release, or production deployment is
ready merely because source exists under `unisane-ops/**`. Use the transition Standard's
gate status and blocker ledger.
