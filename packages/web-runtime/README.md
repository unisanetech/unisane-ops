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

## Migration

| Previous coordinate                        | Canonical coordinate                          |
| ------------------------------------------ | --------------------------------------------- |
| `@unisane/web-tracking`                    | `@unisane/web-runtime/tracking`               |
| `@unisane/web-tracking/react`              | `@unisane/web-runtime/tracking/react`         |
| `@unisane/web-tracking/next`               | `@unisane/web-runtime/tracking/next`          |
| `@unisane/web-conversions`                 | `@unisane/web-runtime/conversions`            |
| `@unisane/web-conversions/testing`         | `@unisane/web-runtime/testing`                |
| `@unisane/web-conversions-google-ads`      | `@unisane/web-runtime/conversions/google-ads` |
| `@unisane/web-conversions-meta-capi`       | `@unisane/web-runtime/conversions/meta`       |
| pure `@unisane/web-seo` helpers and types  | `@unisane/web-runtime/seo`                    |
| Next metadata, robots, and sitemap helpers | `@unisane/web-runtime/seo/next`               |

GTM management workflows, Growth operations, reporting, campaign decisions, and
persistent public URL state are deliberately outside Web Runtime.
