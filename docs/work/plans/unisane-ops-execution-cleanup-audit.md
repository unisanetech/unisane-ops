---
id: DOC-ops-execution-cleanup-audit-20260906
owner: unisane-ops
scope: workspace
role: plan
lifecycle: active
authority: supporting
provenance: accepted
view: current
---

# Ops, Growth and Meta execution cleanup audit

## Scope and acceptance (2026-09-06, before implementation)

Repair the four host integration failures, then inspect Ops/Growth/Meta action dispatch,
configuration compatibility and capability reporting. Preserve exact approvals and stored
execution history. Remove only confirmed obsolete behavior; document remaining workflows
that still require action consolidation. No real provider account access or mutations.

The config loader must reject simultaneous standalone default and named Ops configuration
whether imported as ESM or a TypeScript CommonJS module wrapper. Supporting the loader's
module format must not introduce an alternate project config shape. Host tests must exercise
the actual declared CLI binary, canonical MCP tool catalog and installed optional packs.

Audit distinctions: provider SDK functions used by shared adapters are not duplicate user
workflows; explicit migrations and historical evidence are not silent runtime fallbacks;
implementation, exposure, configuration and live verification are separate capability facts.

## Findings and disposition

| Area | Finding | Disposition |
| --- | --- | --- |
| Config loading | TypeScript CommonJS interop could hide conflicting exports and accidentally accept a named-only Ops config. | Normalize the module wrapper before selecting exports; reject ambiguity and named-only config. Exercise CommonJS and ESM. Update host fixtures to the canonical standalone default. |
| Host integration | Pack tests assumed the optional private console was installed; MCP used removed `bin/cli.js`, a stale tool list, and incomplete research evidence. | Use installed-pack identity, current `dist/cli.js`, canonical MCP catalog and complete synthetic research evidence. Keep evidence validation intact. |
| Host package metadata | Duplicate `repository` keys in package.json. | Remove the duplicate declaration. |
| Meta versions | Four copies of the default Graph version, plus a separate campaign-control version. | Centralize pins in `provider-meta/src/meta/api-version.ts`. Preserve current v25.0 and campaign-control v23.0 behavior; compatibility and live verification are still required before converging the pins. |
| Meta upload identity | When several unkeyed image results were returned, the uploader could silently choose the first. | Require the requested filename or exactly one candidate; otherwise fail with missing identity. |
| Meta mutation errors | Upload and campaign-creation errors could include raw provider bodies. | Share a mutation-response reader that exposes stable codes/status and no provider error body. Unreadable success requires recovery. |
| Meta pause/status | Any successful HTTP response was considered an acknowledgement; unknown status strings were reported as active. | Require positive pause acknowledgement; retain uncertain outcomes and map only explicit ACTIVE/PAUSED statuses. |
| Capability reporting | Provider facts, host binding, account prerequisites, interfaces and live verification are separate. Campaign pause now uses the shared host callback; creation and upload still lack their execution callbacks. | Keep explicit blocked states. Do not report provider SDK implementation as an executable or live-verified feature. |
| Evidence migration | Observation v1 and confirmed-conversion v1 have migration code. | Keep explicit migration utilities. Ordinary loaders require current artifacts; this is not automatic runtime fallback. |
| Persisted execution | GTM local/SQLite history and remote-name recognition guard existing state. | Retain pending deliberate migration; no history deletion or silent backend switching. |

## Remaining structural work

- `growth/src/cli/commands/ads/apply/run.ts` and asset commands still compose older reviewed
  marketing execution services. These have live callers and are not dead code. Their
  approval-reference/environment-gate model must be deliberately migrated to shared engine
  actions; deleting them would remove working Google workflows rather than remove aliases.
- Google conversion-goal and asset HTTP transport now lives in provider-google (details
  below). Remaining legacy campaign execution and shared engine migration still require a
  deliberate audit; this is not a proof of zero provider-specific code in Growth.
- Meta creation and asset-upload host operations remain blocked. Exact pause and its
  verification now use `growth.campaign.pause`; raw campaign mutation routes stay blocked.
  The shared workflow contains credentials, approval, attempts and recovery. Broader resource
  changes still need implementation and live acceptance.
- A single production-ready Meta lifecycle still needs the approved host callbacks, durable
  mutation execution/recovery and real-account proof. Fixture tests do not establish those.

This was a targeted audit of dispatch, config loading, provider capability reporting, key
Meta mutation responses and evidence migrations. It is not a proof of zero dead code across
all packages. Browser/server observation coverage, store migration and Google extraction
remain separately tracked work.

## Verification

46/46 full host integration tests, 17/17 host runtime unit tests and 113/113 Meta provider
tests pass. Both affected runtime packages build, type-check and lint. Regressions cover
module-export ambiguity, canonical MCP discovery/preparation, missing pause acknowledgement,
unknown status, ambiguous image identity and credential-safe response failures. All account
and research data used for tests are synthetic. No real provider was contacted or changed.

## Conversion-goal transport extraction (before code)

Extract Google conversion-action listing/mutation from Growth into provider-google. Growth
retains registry planning, typed plan/result contracts and a mandatory provider port. The CLI
uses the host binding; it does not receive credentials. The host rechecks the selected
customer and environment and resolves canonical Google credentials. Retain validate-only and
explicit test-account confirmation; live non-test execution remains blocked pending shared
engine approval migration. Provider responses must not invent success when IDs are missing,
select ambiguous names or echo raw credential-bearing errors. Preserve the existing v22 pin
for this extraction; version compatibility and real-account acceptance remain unproven.

## Conversion-goal extraction outcome

Growth now owns the canonical Zod plan/result contracts, registry planning and required typed
provider port. Google conversion-action discovery, mutation shaping and HTTP execution live
in `provider-google/src/google/marketing/conversion-goals.ts`. The CLI dispatches
`google.marketing.apply-goals` through the host; the host validates the selected customer,
resolves canonical credentials and supplies them directly to the provider.

Validation remains available through the existing CLI workflow. Live execution requires the
exact customer confirmation and the configured non-production `test` environment. This is
an environment restriction, not proof that Google identifies the customer as a test account.
Other live environments are blocked until shared engine approvals are implemented. The
legacy confirmation workflow is still a migration item; this extraction does not make it a
shared console/MCP action or provide durable execution/recovery records.

Duplicate action names, malformed inventory, foreign resource identities, incomplete live
receipts and unreadable responses fail explicitly. Transport errors and provider bodies are
not exposed. Uncertain outcomes require reconciliation before retry; no automatic mutation
retry was added. Returned resource IDs are acknowledgements, not post-write verification.
The existing v22 default is preserved without a claim of current API compatibility.

Regression coverage includes offline registry planning, mandatory execution modes, result
binding, host resource and confirmation checks, create/update/validate-only responses,
ambiguous inventory, incomplete receipts and credential-safe transport/JSON failures.
All tests use synthetic fixtures; real-account acceptance remains pending.

Extraction verification: 322 Growth, 53 Google provider, 18 host runtime and 46 host
integration tests pass (439 total). Growth, provider-google and host builds, type checks and
lint pass. The two domain tests were rerun after correcting the asynchronous test double.

## Asset transport extraction plan (before code)

Remove the Google upload fallback and campaign-asset HTTP calls from Growth. Reuse the
injected uploader contract and add a credential-free campaign-link provider port. Keep
source files, registry planning and receipt persistence in Growth; put HTTP serialization
and response validation in provider-google. Route CLI upload/link execution through a
strict host request, selected environment/customer checks and host-only credential resolution.
Previews should not require credentials. Preserve upload receipt/confirmation checks;
block non-test live workflows pending engine approval migration and require exact confirmation
for campaign linking. Retain Meta's unavailable host callback and existing API version pins.
Do not claim provider acknowledgement is post-write verification or durable retry recovery.

## Asset transport extraction outcome

Google image upload and campaign-asset linking now execute in
`provider-google/src/google/marketing/assets.ts`. Growth keeps file validation, registry and
receipt persistence, requires injected uploaders and exposes a typed, validated campaign-link
port in `marketing/ads/asset-provider.ts`. The Google-specific upload fallback is removed.
The shared SDK uploader contract remains in use by Meta and retains its existing context
fields; Google host credentials are captured by the provider factory, not passed to the CLI.

The CLI dispatches `google.marketing.assets` to the host. It selects the configured environment
and customer, rejects credential fields in requests, and resolves credentials only when a
validated workflow invokes the provider. Preview paths need no credentials. Meta-only previews
remain local; Meta live uploads still require the unavailable approved host callback. Mixed
plans with missing uploaders are blocked before any upload.

Google live execution is restricted to the configured non-production `test` environment.
This does not establish that the customer is a Google test account. Existing upload dry-run
receipt, plan hash and explicit confirmations remain required. Linking additionally requires
`--account-confirm test:googleAds:<customer-id>:ads-assets-link`; its preview accepts the same
campaign and asset arguments without `--yes`. A full engine-reviewed link plan is still needed.

Project/receipt bindings and source hashes are checked before upload. Link contracts reject
foreign customers, empty operations and duplicate refs. Google receipt validation requires
complete resource identities, preserves their ordering and checks link campaign/asset targets.
Partial failure, malformed responses and transport errors do not become successful results
or expose raw provider bodies. The provider performs no automatic retries.

Remaining limitations: this extraction adds no shared console/MCP engine action, durable
attempt store, reconciliation-before-retry workflow or post-write provider verification.
Legacy upload failure receipts still use coarse failure/sent fields; these are insufficient
for automatic replay decisions and must migrate with the execution lifecycle. API compatibility
and real-account proof remain pending; the existing asset v24 default is retained.

Asset extraction verification: 325 Growth, 57 Google provider, 19 host runtime and 46 host
integration tests pass (447 total). All three packages build, type-check and lint. Tests cover
provider injection, reviewed source bytes, offline linking, foreign/duplicate targets, missing
receipts, redaction, host production/confirmation guards, Meta-only previews and CLI dispatch.
No real provider accounts were contacted or changed.

## Durable campaign-control batch specification (before code)

Converge campaign-pause CLI, MCP and console approval onto host-owned workflows. Reuse the
existing action and engine stores, add persisted pre-dispatch attempts, prevent replay after
crashes or lost receipts, and recover through delayed read-only verification. Existing records
without the new execution marker remain readable but need a new plan before applying. Add an
explicit ads SQLite backend while preserving existing local record locations and refusing
silent backend changes. Local storage remains unsuitable for automated/production writes.

Compose Meta credentials only inside the provider's host callback, verify the campaign's
account identity before mutation and readback, and check selected account/grants. Raw provider
mutation routes stay blocked; only the shared approved host workflow invokes the provider.
All tests use synthetic credentials and providers. Campaign breadth, measurement ingestion,
catalogs and real-account acceptance remain separate work; do not claim this batch completes
all Growth capabilities.

## Durable campaign-control batch outcome

`growth.campaign.pause` is the shared host boundary for plan, list/show, human approval, apply
and verification/recovery. CLI and MCP use a typed host client; console review listing and
human approval use the same host stores. The unused direct CLI campaign adapters are removed.
Console provides review/approval; this batch does not add a full console apply/verify screen.

The host selects the canonical account and reads actual campaign state for plan and apply
revision checks. Caller-provided evidence labels are not trusted as provider state. Meta reads
verify campaign ID and account ID before execution and verification. Credential access remains
inside the provider callback, and writes require recorded ads_management permission. The
lease is rechecked immediately before provider writes; request deadlines bound transport.
Raw Meta and Google campaign mutation dispatch cannot bypass the shared workflow.

Apply records an atomic attempt and a campaign-target guard before contacting the provider.
Lost receipts, worker interruption and uncertain results cannot replay the plan or admit a
second plan's attempt on the same target until recovery. Recovery waits beyond the original
lease and transport settlement interval, reads provider state and retains the unknown execution
outcome even when the campaign is verified paused. Records created before execution revision 2
remain readable but cannot be applied; create a new plan. This is explicit persisted-history
handling, not an alternate execution path.

Configure `execution: { ads: { backend: 'sqlite' } }` in the Ops configuration **before the first
campaign workflow** for automated/production use. Existing GTM backend selection remains
independent. SQLite uses the engine's durable, atomic store interfaces on one persistent host.
The default local backend supports human-driven non-production execution only. Existing local
approvals/runs block a switch to SQLite until an explicit migration exists; records must not be
deleted or silently skipped. Empty console review listing does not select a backend.

MCP reports specific recovery, target, permission, durability and migration errors without
provider secrets. Meta capability discovery points campaign pause/verification at the shared
host workflow while keeping live verification separate and creation/upload unavailable.
API field/permission references were checked against Meta's official
[Marketing API collection](https://www.postman.com/meta/facebook-marketing-api/documentation/0zr4mes/facebook-marketing-api-mapi)
and [Business SDK guidance](https://github.com/facebook/facebook-python-business-sdk).
The campaign-control API version pin is preserved; current account acceptance is not proven.

Remaining program: resume/budget/schedule/targeting changes, durable creation/assets/goals,
authenticated measurement ingestion, automatic event diagnostics, catalog workflows, scheduling,
complete guided onboarding and broader Google/TikTok functionality. Campaign snapshot identity
and state verification are not proof of delivery attribution or improved business outcomes.

Campaign batch verification: 326 Growth, 113 Meta provider, 22 host runtime, 46 host
integration, 43 MCP and 48 console tests pass (598 total). All five affected packages build,
type-check and lint. Focused tests exercise interrupted receipt storage, same-plan replay
rejection, competing-plan target guards, delayed recovery without invented success, old-record
replan requirements, SQLite reopen, human-only approval, foreign campaign identity, missing
mutation grants, production/agent local-store denial and migration refusal. Console fixtures
now use host review dispatch; MCP without account evidence fails with an actionable target
error. No real provider account was contacted or changed.

### Console startup acceptance — 2026-09-07

The console now accepts `--environment <id>` and propagates the resolved environment to account context, campaign approval, page state and state-bound action requests. Missing event/conversion registries produce blocked setup diagnostics through shared missing-evidence classification instead of preventing the console from opening; malformed registries still fail. Verified the existing ecom-front project with `growth console --environment local --host 127.0.0.1 --port 4174`: HTTP page returned, project ecom-front, environment local. Focused console tests (6) and measurement tests (5), Growth/console builds and types, and scoped lint passed. No remote advertising or GTM mutations.
