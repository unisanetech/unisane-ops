# Unisane Ops Console

The optional human-first local console for Unisane Ops. It owns presentation, static
assets, build output, and the exact `unisane growth console` pack contribution.

Growth data and actions come only from the UI-neutral `@unisane/growth/console`
contract.

The SEO opportunities screen projects the local implementation lifecycle from
schema-valid opportunity, packet, publication, and verification artifacts. It can
copy the exact canonical CLI command for the next supported step, but it does not
edit a repository or CMS, approve content, publish a page, deploy a site, or claim
that an observed result was caused by the page change. Publication remains an
external, human-reviewed action whose record is captured separately before the
measurement window begins.

The local console may record human approval for one exact current campaign-pause plan.
That approval crosses a same-origin host action into the canonical Growth workflow; the
browser cannot access lifecycle stores or provider adapters. Approval has no provider
effect, and the console exposes no apply or verify endpoint. An explicit local operator
identity may be bound when starting the console:

```bash
unisane growth console --operator user.alice
```
