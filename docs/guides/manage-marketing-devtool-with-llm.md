---
id: 'DOC-69904c963efd'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: guide
lifecycle: durable
authority: supporting
provenance: accepted
view: current
---

# Manage Growth With An LLM

Use this guide when an agent adopts, checks, or operates Growth through Unisane Ops.
Project intent comes only from `unisane.config.ts`; provider access comes only from a
named provider connection.

## Changelog

- `2026-08-15`: Moved all current Growth guidance to the separate `unisane-ops` CLI,
  descriptor-only Framework context, and one typed action path. Earlier combined
  command history is superseded.
- `2026-07-30`: Added the confirmed Google disconnect lifecycle and documented that
  historical evidence remains while provider-side resources stay unchanged.
- `2026-07-30`: Replaced the separate setup, authentication-profile, provider-id
  environment, and readiness workflows with the canonical Ops lifecycle.

## Adoption

For an existing project:

```bash
unisane-ops init --growth --mode adopt-existing --environment production --production --yes
unisane-ops connect google --environment production
unisane-ops check
```

For audit-only adoption, use `--mode audit-only`. It records intent and reports
findings without installing instrumentation or enabling remote mutation. A Framework
project keeps its Framework default export and receives one named `ops` export. A plain
project receives one `defineUnisaneProject(...)` config.

If Ops is already initialized, add or update Growth with:

```bash
unisane-ops add growth --mode adopt-existing \
  --capability seo \
  --capability analytics \
  --capability tag-manager \
  --yes
```

Use `unisane-ops init` to adopt Ops and `create-unisane` to create a Framework
application. Framework `unisane` is a separate developer CLI; Ops never intercepts or
forwards it.

## Connections And Resources

`unisane-ops connect google` owns OAuth, incremental grants, resource discovery, explicit
selection, verification, refresh, and revocation state. Search Console sites, Analytics
properties, Tag Manager containers, and Ads customers are selected resources; they are
not copied into project environment files.

If discovery returns more than one resource, select one explicitly:

```bash
unisane-ops connect google --environment production \
  --search-console-site <site> \
  --analytics-property <property> \
  --tag-manager-container <container> \
  --ads-customer <customer>
```

The project config stores only non-secret connection and resource references. Local
credentials stay in provider-owned secure storage. CI and team secret-store bindings are
explicit adapters; there is no one-off credential bypass.

To remove Google from one environment:

```bash
unisane-ops disconnect google --environment production --yes
```

The command confirms the consequences, removes the selected local connection and its
local credential material, and clears its project resource references. Historical
reports remain available. Google-side tags, properties, containers, accounts, and
campaigns are not changed.

## Readiness

Run:

```bash
unisane-ops check
unisane-ops check --json
```

The same typed findings serve humans, agents, CI, and the console. Read project,
connection, resource, instrumentation, data, business-truth, decision, and mutation
dimensions independently. A valid config does not imply fresh data, correct
instrumentation, or mutation authority.

Follow the finding's single recommended next action. Use domain commands only after the
required connection and resource findings are ready:

```bash
unisane-ops growth seo ...
unisane-ops growth marketing ...
unisane-ops growth ads ...
unisane-ops growth gtm ...
unisane-ops growth console
```

Read-only imports and offline planning may run without provider access. Provider reads
resolve short-lived credentials from the selected connection. Mutations still require
the normal plan, approval, confirmation, lock, receipt, and drift controls.

## One-Shot Migration

A previous Growth config is accepted only by the explicit migrator:

```bash
unisane-ops migrate growth-config --input <retired-config-module> --yes
```

The migrator copies non-secret intent once, marks adoption as `migrate`, and requires
providers to be reconnected. Normal project loading rejects the retired schema.

## Agent Rules

- Inspect `unisane.config.ts`, the selected domain manifests, and relevant source.
- Run `unisane-ops check --json` before recommending provider work.
- Never request or print credential values.
- Never select the first discovered resource when discovery is ambiguous.
- Never infer readiness from a hand-authored label.
- Keep remote writes behind reviewed plans and explicit approval.
- Invoke one typed `ActionDefinition` directly through the admitted adapter; never call
  a nested product CLI, capture stdout/stderr or `process.exitCode`, or parse terminal
  prose for state.

In a Framework project, optional context arrives only through the non-default serialized
descriptor adapter, which has zero Framework npm dependencies and never invokes
compilation. Provider mutations belong to Ops actions, not Framework Compiler or
Devtools. The Framework remains private under its founder hold; this guide authorizes no
publication or visibility transition.
