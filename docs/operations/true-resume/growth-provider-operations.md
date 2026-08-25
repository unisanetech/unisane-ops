---
id: 'DOC-4e3a5c445526'
owner: 'unisane-ops'
repository: unisane-ops
scope: unisane-ops
role: guide
lifecycle: durable
authority: canonical
provenance: accepted
view: transition
---

# True Resume Growth Provider Operations

True Resume adopts existing SEO, Analytics, Tag Manager, Advertising, and
Recommendations resources. Unisane Ops owns connection selection, resource selection,
provider reads, reconciliation, validation, approval, and guarded mutation policy.

The safe operator sequence is:

```bash
unisane check
unisane connect google --environment production
unisane check
unisane growth marketing audit --cwd <true-resume-app>
unisane growth gtm validate --env production --cwd <true-resume-app>
unisane growth ads plan --provider googleAds --cwd <true-resume-app>
```

Provider reads require an explicitly selected connection and resource. Live mutation
and spend remain disabled unless an independently reviewed plan, human approval, exact
resource confirmations, and the provider-specific live executor are present.

Connections, resource identifiers, credentials, raw provider payloads, and mutable
receipts remain in private Ops state. The product repository may retain public browser
instrumentation identifiers and normalized product outcomes, but those facts do not
prove provider readiness.
