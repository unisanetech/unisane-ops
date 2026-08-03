# Unisane Ops Console

The optional human-first local console for Unisane Ops. It owns presentation, static
assets, build output, and the exact `unisane growth console` pack contribution.

Growth data and actions come only from the UI-neutral `@unisane/growth/console`
contract.

The local console may record human approval for one exact current campaign-pause plan.
That approval crosses a same-origin host action into the canonical Growth workflow; the
browser cannot access lifecycle stores or provider adapters. Approval has no provider
effect, and the console exposes no apply or verify endpoint. An explicit local operator
identity may be bound when starting the console:

```bash
unisane growth console --operator user.alice
```
