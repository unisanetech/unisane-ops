---
id: 'DOC-8cd9af7c084b'
owner: 'unisane'
scope: workspace
role: guide
lifecycle: durable
authority: supporting
provenance: accepted
view: current
---

# Manage Google Tag Manager With An LLM

Use this guide for Tag Manager desired state, validation, remote inventory, plans,
publishing, rollback, or drift.

## Changelog

- `2026-07-30`: Routed Tag Manager through the canonical Growth intent and Google
  connection, with one project-owned manifest location and no separate credential flow.

## Ownership

- `unisane.config.ts` selects Growth, the environment, the Google connection, and the
  Growth runtime manifest location.
- A project-specific manifest such as `ops/growth/tag-manager.ts` owns desired tags,
  triggers, variables, consent, and mutation policy.
- Provider Google owns OAuth, grants, selected container identity, token refresh, and
  remote transport.
- Growth owns manifest validation, deterministic planning, safety policy, and receipts.

Adopt and connect first:

```bash
unisane ops init --growth --mode adopt-existing --yes
unisane connect google --service tag-manager
unisane check
```

When multiple containers are visible, pass
`--tag-manager-container <container>` to `unisane connect google`. Never silently use
the first result.

## Safe Workflow

```text
validate desired state
-> read remote inventory
-> build deterministic plan
-> review exact operations
-> apply to an isolated workspace
-> preview and verify
-> create a version
-> publish with approval
-> store receipt and check drift
```

Typical commands:

```bash
unisane growth gtm validate --env production
unisane growth gtm pull --env production --connection google-primary
unisane growth gtm plan --env production --snapshot <snapshot>
unisane growth gtm apply --env production --plan <plan> --dry-run
unisane growth gtm publish --env production --version-receipt <receipt>
```

The manifest is loaded from the canonical Growth runtime location. `--manifest` is an
explicit expert override for a reviewed alternate desired-state artifact, not a second
project config.

## Guardrails

- Keep secrets and mutable provider snapshots out of committed manifests.
- Treat container identity as a selected connection resource.
- Require consent defaults and declared vendor domains.
- Block duplicate browser emitters and duplicate event tags.
- Preserve preview, version, publish, rollback, and receipt boundaries.
- Do not publish when connection, resource, validation, or drift findings block the
  operation.
