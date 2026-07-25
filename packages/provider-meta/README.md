# @unisane/provider-meta

Meta provider-family connection and management implementation for Unisane Ops.

The root export owns saved access-token profiles, Keychain/default secret storage,
controlled file-store support for CI/tests, scopes, expiry, status, and token resolution.
The `@unisane/provider-meta/marketing` subpath owns Graph API discovery and inventory,
Ads reporting, image/video asset upload, and guarded campaign pause or paused
campaign/ad-set/creative/ad mutation behind Growth-owned contracts.

Growth owns configuration schemas, normalized reporting, plans, campaign and creative
policy, confirmations, approvals, locks, blockers, and receipts.

The package owns the sealed expert command pack and exact handler:

```bash
unisane provider meta ...
```

The Devtools Meta root is a thin compatibility registrar over this owner.

Meta CAPI remains `@unisane/web-runtime/conversions/meta`; it is an application runtime
connector and does not depend on this management provider package.
