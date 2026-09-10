---
id: 'DOC-8cd9af7c084b'
owner: 'unisane'
repository: unisane-ops
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

- `2026-09-03`: Added explicit `read`, `workspace`, and `publish` Tag Manager access
  profiles and required a digest-bound reviewed plan artifact before apply.
- `2026-08-15`: Moved current Tag Manager guidance to `unisane-ops` and one typed Ops
  action path; Framework/Devtools have no provider mutation role.
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
unisane-ops init --growth --mode adopt-existing --yes
unisane-ops connect google --service tag-manager --tag-manager-access read
unisane-ops check
```

`read` is the default and is sufficient for inventory, audits, diffs, and plans. Create a
separate connection when workspace mutation is needed so routine reporting keeps read-only
authority:

```bash
unisane-ops connect google --environment <environment> \
  --connection google-gtm-writer \
  --service tag-manager \
  --tag-manager-access workspace \
  --tag-manager-container <numeric-container-id>
```

Use `--tag-manager-access publish` only for a connection that is intentionally allowed to
create and publish reviewed versions. Tokens remain in provider-owned secret custody; neither
the access token nor refresh token belongs in project environment files. A named secondary
connection does not replace the environment's existing Google default. Pass `--set-default`
only when changing that default is intentional.

Extended snapshots include templates and other read-only container resources without reading
account user permissions. Permission inventory is separately opt-in with
`--include-user-permissions` and requires the broader `tagmanager.manage.users` scope.

When multiple containers are visible, pass
`--tag-manager-container <container>` to `unisane-ops connect google`. Never silently use
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

Use `validate`, `pull` and `diff` for inspection. Use the shared workspace and release
commands below for all changes. The former root plan/apply/preview/create-version/publish/rollback
commands have been removed; there are no aliases or separate file-receipt approval paths.
Workspace plans bind manifest, target and current provider evidence to one engine approval.

The manifest is loaded from the canonical Growth runtime location. `--manifest` is an
explicit expert override for a reviewed alternate desired-state artifact, not a second
project config.

The shared offline `growth.gtm.diagnose` action is available through CLI, MCP and console.
Workspace and release mutations use shared approval/job actions across CLI, console and MCP.
Nested product CLIs, raw-argv engine APIs, terminal/output
capture, and duplicate action handlers are forbidden. Optional Framework context is
descriptor-only with zero Framework npm dependencies. The Framework remains private,
and this guide authorizes no publication or visibility change.

## Guardrails

- Keep secrets and mutable provider snapshots out of committed manifests.
- Keep read-only and mutation authority on separate named connections when practical.
- Treat container identity as a selected connection resource.
- Require an unchanged reviewed engine plan and matching human approval for workspace apply.
- Require consent defaults and declared vendor domains.
- Block duplicate browser emitters and duplicate event tags.
- Preserve preview, version, publish, rollback, and receipt boundaries.
- Do not publish when connection, resource, validation, or drift findings block the
  operation.


## Offline diagnosis and strengthened receipts

Run `unisane-ops growth gtm diagnose --env production --snapshot <normalized-snapshot> --json`
to inspect the canonical manifest and local evidence without provider access. Omitting the
snapshot reports that evidence is missing. MCP `diagnose_gtm` takes projectId, environmentId,
the manifest and optional normalized snapshot. Console Analytics → Tracking health → Tag Manager workspace provides the
same diagnosis from JSON with projectId, environment, manifest and optional snapshot.

Diagnosis is transient and does not approve or apply its operation summaries. Unmanaged
resources are retained; ambiguous duplicate identities and foreign snapshots fail closed.
Already-paused removed tags no longer produce another pause operation. Destructive deletion,
server-side GTM mutation and automatic repair are not implemented by this action.

Preview receipts now include a content digest. Create-version selects the exact receipt
workspace and compares a fresh preview before creating a version; created content is checked
again. Old incomplete receipts must be regenerated. Version receipts must include the exact
version path/ID and fingerprint. Publish and ordinary rollback use that fingerprint, reject
pre-write drift and read back the live version before reporting verified publication.
A failed readback is an uncertain outcome: inspect live state before retrying. Compilation and
live-version readback still do not verify browser journeys, consent or destination event receipt.

The API does not provide an atomic preview-to-create precondition. The before/after content
checks detect drift, but a conflicting version can already have been created when a post-check
fails. Inspect that version; do not publish it or blindly repeat creation.


## Reviewed workspace changes through shared Ops actions

Use a selected canonical Google connection and an existing workspace. The canonical Growth
manifest supplies desired state; credentials stay with the host. For a non-production local
environment:

```sh
unisane-ops growth gtm workspace plan --connection google --workspace-id 3 --environment test --json
unisane-ops growth gtm workspace review --plan-hash <hash> --environment test --json
unisane-ops growth gtm workspace approve --plan-hash <hash> --confirm <hash> --yes --environment test
unisane-ops growth gtm workspace apply --plan-hash <hash> --environment test --json
unisane-ops growth gtm workspace recover --run-id gtm.<hash> --environment test --json
```

The human approval binds the displayed plan hash. Review the exact target and resource changes
before approving. Plans expire after ten minutes. Inventory drift requires a fresh reviewed
plan. Do not repeat an apply after an uncertain response: recover the recorded attempt instead.
Recovery reports when the settlement delay has elapsed, then reads provider state. A mismatch
requires a new plan for remaining changes. Workspace verification does not publish a container
or verify browser/server event delivery.

The console has equivalent controls under Analytics → Tracking health → Tag Manager workspace.
MCP tools are `plan_gtm_workspace`, `review_gtm_workspace`, `apply_approved_gtm_workspace` and
`recover_gtm_workspace`. MCP does not expose approval. Default local storage does not satisfy
engine requirements for production or automated agent writes; use a durable host backend
before enabling those workflows. Preview/version/publish use the shared release workflow below.

## Shared preview, version and publish workflow

For a new project that needs approved agent or production writes, select durable host storage
before its first GTM workflow:

```ts
execution: { gtm: { backend: 'sqlite' } }
```

Place this in `unisane.config.ts`, or under `ops` in unified project configuration. Use Node.js
22.13+ and a persistent local disk. Existing local records block switching backends until a
reviewed migration is available; do not remove history to bypass that check.

```sh
unisane-ops growth gtm release preview --connection google --workspace-id 3 --environment test
unisane-ops growth gtm release plan-version --connection google --workspace-id 3 --name "Purchase tracking" --environment test
unisane-ops growth gtm release review --plan-hash <hash> --environment test
unisane-ops growth gtm release approve --plan-hash <hash> --confirm <hash> --yes --environment test
unisane-ops growth gtm release apply --plan-hash <hash> --environment test
unisane-ops growth gtm release recover --run-id gtmrelease.<hash> --environment test
unisane-ops growth gtm release plan-publish --connection google --version-id <verified-version-id> --environment test
```

Review, approve, apply and recover the publication plan separately. Creating a version removes
its source workspace; publication changes the live container. The exact reviewed version name
includes an Ops identifier for recovery. After a lost response, use the recorded run ID rather
than repeating creation. Ambiguous recovery stays blocked. To roll back, prepare a publication
plan for an exact prior version, review its content and apply the recorded human approval.

Console exposes these controls under Analytics → Tracking health → Tag Manager workspace.
MCP uses `manage_gtm_release`; approval remains in the human interface. Preview and version
creation require `tagmanager.edit.containerversions`; publication requires `tagmanager.publish`
and the workflow also needs read access for version discovery and verification. Compiler and
live-version verification do not prove browser consent behavior or destination event acceptance.

## Generate a tracking setup proposal

Use `growth gtm generate-setup --input setup.json --output proposal.mjs --environment test --json`
from the configured project. `--output` is optional and refuses to overwrite an existing file.
The same offline action is available as MCP `generate_gtm_tracking_setup` and under **Generate
tracking setup proposal** in the console Tag Manager workspace. MCP exposes the generated input
schema; conditional requirements are validated by the shared compiler.

Example `setup.json` (replace the illustrative IDs and event paths with the selected resources
and actual adopter contract):

```json
{
  "projectId": "shop",
  "appId": "storefront",
  "environment": "test",
  "accountId": "123456",
  "containerId": "789012",
  "namespace": "shop",
  "workspacePrefix": "test",
  "consentDefaults": {
    "analytics_storage": "denied",
    "ad_storage": "denied",
    "ad_user_data": "denied",
    "ad_personalization": "denied"
  },
  "ga4MeasurementId": "G-EXAMPLE123",
  "metaPixelId": "123456789",
  "events": [
    {
      "slug": "purchase",
      "sourceEvent": "order_completed",
      "eventIdPath": "tracking.event_id",
      "ga4EventName": "purchase",
      "metaEventName": "Purchase",
      "valuePath": "ecommerce.value",
      "currencyPath": "ecommerce.currency",
      "transactionIdPath": "ecommerce.transaction_id",
      "googleAds": {
        "conversionId": "123456789",
        "conversionLabel": "example_label"
      }
    }
  ]
}
```

Omit destinations you do not use. Every event needs an explicit source and event-ID path;
purchases require value, currency and transaction-ID paths. Google Ads conversions require a
transaction-ID path. The compiler generates shared recipe resources, consent gates, variables,
trigger mappings and diagnosis. Google Tag configuration disables implicit page views; add an
explicit event mapping when required. Conversion labels use constant variables and typed references.

Review the returned manifest and required observations before merging into the canonical manifest.
Existing configurations may already contain equivalent tags: reconcile those deliberately to avoid
duplicate delivery. Continue through workspace plan/review/apply, release preview, then separately
reviewed version creation/publication. Generation does not discover resources, install a CMP,
configure server delivery or prove tracking. The adopter supplies consent updates and real event
observations; matching browser/server event IDs must come from the same business event.

Meta Custom HTML targets the selected pixel (`trackSingle`) and preserves supplied event ID,
value and currency. Generated tags initialize each pixel once among themselves. Invalid observed
IDs or monetary values suppress that Meta call; this is not a substitute for observation ingestion
and diagnosis. Existing separately installed pixels, Custom HTML permission/CSP, CMP behavior,
actual tag firing and destination acceptance still require browser and live-account verification.
