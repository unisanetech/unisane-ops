---
id: 'DOC-b15c78a43f2e'
owner: 'unisane'
scope: workspace
role: guide
lifecycle: durable
authority: supporting
provenance: accepted
view: current
---

# Migrate Growth To Unisane Ops

Use this guide once when a project has Growth intent from the retired pre-Ops schema.

## Changelog

- `2026-07-30`: Added the one-shot clean-cut migration workflow.

## Migration

Initialize Ops without selecting Growth, then run the explicit migrator:

```bash
unisane ops init --yes
unisane ops migrate growth-config --input <retired-config-module> --yes
unisane check
```

The input path is explicit. Normal config loading never searches for or accepts the
retired schema.

The migrator:

- converts non-secret capability, environment, manifest, runtime, and policy intent;
- sets Growth adoption mode to `migrate`;
- does not copy provider credentials or resource environment references;
- leaves provider connections and resource selections unresolved;
- returns the exact reconnect and verification actions.

Complete the new connection lifecycle:

```bash
unisane connect google --environment <environment>
unisane check
```

Resolve ambiguous provider resources explicitly. Review instrumentation in
`adopt-existing` style before enabling any remote mutation.

After successful verification, delete the retired input module. Do not retain a wrapper,
dual loader, alias, or second config source.
