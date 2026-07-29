# @unisane/web-runtime

Portable runtime capabilities for websites built with Unisane or any compatible
TypeScript application.

The package owns browser-neutral tracking, consent and attribution, explicit React and
Next adapters, server-side conversion contracts and delivery adapters, pure SEO helpers,
Next metadata adapters, and deterministic test utilities. React and Next are optional
peers; applications install them only when they use the matching adapter entrypoints.

## Entrypoints

- `@unisane/web-runtime/tracking`
- `@unisane/web-runtime/tracking/react`
- `@unisane/web-runtime/tracking/next`
- `@unisane/web-runtime/conversions`
- `@unisane/web-runtime/conversions/google-ads`
- `@unisane/web-runtime/conversions/meta`
- `@unisane/web-runtime/seo`
- `@unisane/web-runtime/seo/next`
- `@unisane/web-runtime/contracts`
- `@unisane/web-runtime/testing`

GTM management workflows, Growth operations, reporting, campaign decisions, and
persistent public URL state are deliberately outside Web Runtime.
