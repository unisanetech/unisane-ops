# @unisane/growth

Provider-neutral Growth contracts, readiness, desired state, analysis, planning, and
mutation policy for Unisane Ops.

## Ownership

- `@unisane/growth/contracts` owns the versioned `growthConfigContribution` and
  provider-neutral contracts.
- `@unisane/growth/gtm` owns Tag Manager manifests, validation, deterministic planning,
  policy, and receipts.
- `@unisane/growth/seo` owns research, opportunities, briefs, performance feedback, and
  health evaluation.
- `@unisane/growth/marketing` owns event/conversion truth, normalized reporting,
  recommendations, experiments, tracking audits, and ads plans.

Growth does not own OAuth, token storage, provider resource discovery, or provider
transport. Those are host-injected from provider packages through canonical connection
bindings.

## Lifecycle

Growth is selected through the root lifecycle:

```bash
unisane ops init --growth --yes
unisane add growth --capability seo --capability analytics --yes
unisane connect google
unisane check
```

Project intent lives only in `unisane.config.ts`. Readiness is derived from shared
project, connection, resource, instrumentation, data, business-truth, decision, and
mutation findings.

After readiness permits the operation:

```bash
unisane growth seo ...
unisane growth marketing ...
unisane growth ads ...
unisane growth gtm ...
unisane growth console
```

Offline imports and planning do not load provider SDKs. Provider-backed commands resolve
the selected connection and selected resource through the canonical host.

## Audit-only tracking reconciliation

Use the read-only tracking audit to reconcile project source, the event and conversion
manifests, Tag Manager intent, and captured browser/server evidence:

```bash
unisane growth marketing audit --cwd . --json
unisane growth marketing audit --cwd . --observations ops/growth/tracking-observations.json --json
```

The JSON result is the canonical headless contract for agents, CI, and the console's
`Analytics > Tracking health` view. The command is declared `offline`, has no write
targets, and never installs scripts, publishes Tag Manager changes, or mutates provider
accounts.

An optional observation artifact uses this versioned shape:

```json
{
  "kind": "unisane.growth.tracking-observations",
  "version": 1,
  "environment": "production",
  "capturedAt": "2026-07-31T00:00:00.000Z",
  "observations": [
    {
      "eventName": "purchase_confirmed",
      "eventId": "evt-example",
      "conversionId": "purchase",
      "channel": "server",
      "emitter": "meta-capi",
      "outcome": "emitted",
      "payload": {
        "transactionId": "order-example",
        "value": 25,
        "currency": "USD"
      }
    }
  ]
}
```

Observation artifacts are evidence, not configuration. Keep them free of secrets and
raw personal data; use stable redacted identifiers when payload proof is required.
