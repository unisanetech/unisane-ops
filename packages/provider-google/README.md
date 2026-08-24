# @unisane/provider-google

Provider-owned Google connection and transport implementation for Unisane Ops.

## Connection Contract

`unisane-ops connect google` creates one named connection carrying incremental grants for
Search Console, Analytics, Tag Manager, Ads, and project administration. This package
owns OAuth, secure local credentials, refresh, revocation state, discovery, explicit
resource selection, and connection readiness.

`unisane-ops disconnect google` removes the local connection record and locally owned
credential material after explicit confirmation. It does not delete historical reports
or mutate provider-side tags, properties, containers, accounts, or campaigns.

Zero discovered resources produces a missing finding. One is selected automatically.
Multiple resources remain ambiguous until the user selects one. Partial permissions,
expired access, revoked access, and unavailable Ads developer access remain explicit
states; none silently falls back to another credential or resource.

Growth calls Provider Google through the canonical host binding. The `./gtm`, `./seo`,
and `./marketing` subpaths own provider transport and normalization while Growth retains
desired state, strategy, policy, plans, approvals, locks, and receipts.

The narrow expert lane remains:

```bash
unisane-ops provider google ...
```

It is for provider-specific inventory and transport diagnostics, not a second
onboarding or credential path.
