# @unisane/provider-google

Google provider-family connection and control-plane implementation for Unisane Ops.

The package owns one reusable Google OAuth profile/token lifecycle, Google Cloud project
and API inventory/plan/apply, setup/readiness reporting, and read-only GTM, GA4, Search
Console, and Google Ads discovery clients. The `@unisane/provider-google/gtm` subpath
also owns GTM API transport, remote snapshot translation, controlled workspace mutation,
preview, version creation, publish, and rollback execution behind Growth-owned contracts.
The `@unisane/provider-google/seo` subpath owns Google OAuth refresh, GA4 reporting,
Search Console queries, Google Ads Keyword Planner execution, and translation into
Growth-owned SEO contracts.
The `@unisane/provider-google/marketing` subpath owns read-only Google Ads reporting,
GA4 Data API pagination, Search Console Search Analytics report transport, and Google Ads
live campaign pause or paused Search-campaign creation behind Growth-owned provider
contracts. Growth retains all plan, approval, lock, blocker, and receipt policy.

It intentionally does not own Growth strategy, SEO recommendations, campaign decisions,
GTM manifests, validation, policy, desired-state planning, or UI presentation. Those
remain with Growth or their composition/presentation surface.

The package owns the sealed expert command pack and exact handler:

```bash
unisane provider google ...
```

Growth owns `unisane growth gtm ...` presentation and calls this provider through the
canonical host binding. Devtools Google and GTM roots are thin compatibility facades.
