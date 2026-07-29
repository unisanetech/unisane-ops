# unisane

`unisane` is the sole public CLI host for the Unisane brand. It is owned by the
Unisane Ops product boundary while remaining the entrypoint for Framework
developer workflows.

## Canonical host

The host discovers a fixed first-party pack list from static JSON manifests. It
validates package identity, installed version, first-party trust, manifest
integrity, and namespace collisions before loading an exact command handler.
There is no filesystem scanning, remote download, or arbitrary package import.

```bash
unisane status
unisane status --json
unisane inspect packs
unisane inspect packs --json
unisane connect cloudflare check --connection edge
unisane cloud dns inventory --target website --env dev
unisane cloud dns import --inventory .unisane/ops/website/dev/inventory/<artifact>.json \
  --zone <zone-id>
unisane cloud dns plan --inventory .unisane/ops/website/dev/inventory/<artifact>.json
unisane cloud dns apply --plan .unisane/ops/website/dev/plans/<artifact>.json \
  --account-confirm <account-id> --yes
unisane provider cloudflare dns plan --inventory <artifact>
unisane cloud inventory
unisane cloud check
unisane cloud env
unisane cloud queues plan --inventory <artifact>
unisane cloud queues apply --plan <artifact> --account-confirm <account-id> --yes
unisane cloud workers plan --inventory <artifact>
unisane cloud workers apply --plan <artifact> --account-confirm <account-id> --yes
unisane cloud cron plan --inventory <artifact>
unisane cloud cron apply --plan <artifact> --account-confirm <account-id> --yes
unisane provider cloudflare queues plan --inventory <artifact>
unisane provider aws doctor
unisane provider google status
unisane provider meta status
unisane growth marketing status
unisane growth seo report
unisane growth ads plan
unisane growth analytics status
unisane growth gtm validate --manifest gtm.manifest.mjs --env production
```

The core commands are offline and read-only. Cloudflare connection checking and Cloud DNS
inventory read the selected provider. DNS import and plan stay offline from explicit
inventory artifacts, while apply is a guarded remote write. Import produces a reviewable
proposal and never rewrites `unisane.config.ts`. The expert provider command family is an
alias over the same Cloud workflow rather than a second implementation. Queue, Worker,
and Cron plans are also offline from explicit inventory. Apply uses immutable
operation-bound safety plans, explicit confirmation, local approvals and fencing locks,
receipts, replay protection, source-hash revalidation, secret references, and post-apply
drift. The built-in host allows this only for non-production single-developer execution;
production, automation, and multi-process use requires a durable host state adapter.
JSON mode emits one structured result document with declared and actual effects, write
targets, risk guards,
diagnostics, artifacts, and next actions.

Canonical Ops configuration is exported from the project’s exact
`unisane.config.ts`. Plain websites and other standalone projects use
`defineUnisaneProject(...)`; Framework
projects may export a named `ops = defineUnisaneOps(...)`. Connections contain only
environment-variable secret references, never inline credential values. A Cloudflare
connection may be checked before selecting its `accountId`; DNS target operations require
the account selection.

## Framework integration

Framework lifecycle and authoring commands are contributed by the optional
`@unisane/framework-ops` static pack through the narrow
`@unisane/devtools/framework-integration` bridge:

```bash
unisane create my-app
unisane generate routes
unisane sync
unisane doctor
```

The Framework pack is selected by exact package name and manifest export; the host does
not scan installed packages. Framework implementation remains in Devtools. Growth is
selected independently from the sealed `@unisane/growth` pack and resolves provider
execution through lazy host bindings. AWS, Google, and Meta expert commands are selected
from their sealed provider packs; GTM is selected from Growth; UI is selected from the
optional Framework pack. Unknown commands fail closed. The canonical host has no
Devtools dependency or catch-all subprocess fallback.

## Current boundary

The Cloud pack directly owns DNS plus Cloudflare resource inventory/readiness/environment
and Queue/Worker/Cron plan/apply. The Cloudflare provider pack owns connection checking
and all provider transport. The host constructs it lazily for network inventory/apply
and does not load it for offline import, plan, env, or check. `unisane cloud ...` and
`unisane provider cloudflare ...` are the only live Cloudflare command surfaces.

The `unisane` package is the only owner of the public `unisane` executable.
`@unisane/devtools` publishes only the internal `unisane-devtools` executable.

## License

MIT
