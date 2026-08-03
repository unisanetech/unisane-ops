# @unisane/growth

Provider-neutral Growth contracts, readiness, desired state, analysis, planning, and
mutation policy for Unisane Ops.

## Ownership

- `@unisane/growth/contracts` owns the versioned `growthConfigContribution` and
  provider-neutral contracts.
- `@unisane/growth/actions` owns Growth action adapters over domain logic. The
  `createGrowthHealthReviewAction(...)` and
  `createGrowthSeoOpportunityResearchAction(...)` and
  `createGrowthMeasurementAuditAction(...)` factories bind authoritative Growth
  evidence to registered read actions. They return bounded evidence plus the shared
  workflow projection through the Ops execution contract without accepting config as
  tool input or importing a CLI or UI adapter.
- `@unisane/growth/playbooks` owns versioned Growth goals, playbook stages, action
  references, and plain-language presentation. Health review proves diagnosis; SEO
  opportunity research proves evidence-backed opportunity synthesis; measurement audit
  proves trust gating while keeping canonical outcomes distinct from provider-attributed
  conversions. None executes providers or duplicates tracking, Ops readiness, workflow,
  evidence, or resume state.
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

Growth health review is the canonical readiness diagnosis for headless callers, the
CLI, and the console Overview:

```bash
unisane growth health review
unisane growth health review --environment production --finding-limit 20 --json
```

The review reads canonical Growth intent and only the provider report families required
by the selected capabilities. Human output and the Overview summary lower from the same
action-owned status, primary finding, recovery step, bounded findings, and freshness
evidence. Disabled mutation is treated as a valid safe policy, not as missing setup.

The guided measurement audit is available through the same structured workflow result:

```bash
unisane growth measurement audit
unisane growth measurement audit --json
```

Human CLI output and `Analytics > Tracking health` lower from the action-owned workflow
presentation. JSON returns the complete action result unchanged. Canonical
server-confirmed outcomes and provider-attributed conversions remain separate on every
surface.

SEO opportunity review follows the same contract:

```bash
unisane growth seo opportunities review
unisane growth seo opportunities review --market "US / en" --limit 5 --json
```

The CLI and `SEO > Opportunities` consume the action-owned ranking, confidence,
limitations, provenance, truncation, and next-step presentation. Missing or stale
research remains visible instead of becoming an unsupported recommendation.

## Controlled campaign pause

Local development exposes one deliberately narrow provider mutation through separate
commands. Planning is non-provider work; approval binds one exact plan hash; apply
requires the exact `provider:account:campaign` target; verification is a separate
provider read:

```bash
unisane growth campaign pause plan \
  --provider googleAds \
  --account-id 1234567890 \
  --campaign-id 42 \
  --evidence-revision evidence-3 \
  --json

unisane growth campaign pause show --run-id <run-id>
unisane growth campaign pause approve \
  --run-id <run-id> \
  --plan-hash <exact-plan-hash> \
  --approved-by <operator>
unisane growth campaign pause apply \
  --run-id <run-id> \
  --evidence-revision evidence-3 \
  --confirm-target googleAds:1234567890:42
unisane growth campaign pause verify --run-id <run-id>
```

Every command reads or advances the same canonical local mutation-run record. Human and
JSON output lower from the same Growth review projection used by the console. The local
console may record the exact approval through its host-owned same-origin action, but it
cannot apply or verify a provider change.
Local state is admitted only for a single developer process in a non-production
environment. Production, automation, and multi-process execution fail closed until an
atomic durable run, approval, receipt, and lock implementation is injected.

Apply never delegates to the broad Ads live executor. Google Ads and Meta Ads have
separate exact pause and status-read operations. Google resolves its canonical
connection at the host. Meta remains unavailable in the local host until its ordinary
canonical connection lifecycle exists; it does not accept a token option or environment
fallback.

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
