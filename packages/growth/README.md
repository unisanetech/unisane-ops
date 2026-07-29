# @unisane/growth

Provider-neutral growth operations contracts and workflows.

Admitted capabilities:

- `@unisane/growth/contracts` exposes schema/type and provider-interface contracts.
- `@unisane/growth/gtm` exposes manifest authoring, recipes, validation, policy,
  normalization, and deterministic planning.
- `@unisane/growth/seo` exposes SEO research workspaces, schemas, CSV ingestion, keyword
  expansion and clustering, competitor research, opportunities, briefs, internal-link
  planning, performance feedback, trends, reports, and health evaluation.
- `@unisane/growth/marketing` exposes marketing configuration, registries, normalized
  reporting, research memory, recommendations, experiments, tracking audits, provider
  discovery state, proof workflows, and ads planning/policy/apply behavior.

Google authentication and remote execution live under the matching
`@unisane/provider-google/gtm` and `@unisane/provider-google/seo` subpaths. Growth never
imports the provider package. A host or CLI composition root binds provider execution to
Growth-owned contracts and workflows.

Google Ads, GA4, and Search Console report transports live at
`@unisane/provider-google/marketing` and are injected into Growth-owned normalization,
caching, and reporting. Google Ads live campaign mutation is injected from the same
provider subpath; Growth still owns plan validation, confirmations, approvals, locks,
blockers, and receipts. Saved Meta auth, Graph discovery/inventory, report transport,
asset upload, and remote campaign execution live at `@unisane/provider-meta` and its
`./marketing` subpath. Hosts inject those implementations through Growth-owned
contracts; Growth does not import Provider Meta.

## CLI pack

Growth owns one static command pack and one embedded-safe handler:

```bash
unisane growth seo ...
unisane growth marketing ...
unisane growth ads ...
unisane growth analytics ...
unisane growth gtm ...
```

Provider-backed commands resolve exact typed bindings from the canonical host; offline
commands do not load provider SDKs.
