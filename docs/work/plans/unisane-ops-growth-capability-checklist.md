---
id: 'PLAN-20260906-growth-capabilities'
owner: 'unisane-ops'
repository: unisane-ops
scope: workspace
role: plan
lifecycle: durable
authority: supporting
provenance: accepted
view: current
status: active
---

# Growth Capability Checklist — Meta First

Implementation follows the [Meta capability implementation plan](unisane-ops-meta-capability-implementation-plan.md),
which records each batch's ownership, file layout, contract changes and validation before code edits.

## Goal and priority

Unisane Ops should let AI agents handle marketing end to end: connect accounts, understand
business context, inspect settings and trustworthy reports, configure measurement, recommend
changes, obtain required review, apply changes, verify provider state, and measure results.
Humans and agents should accomplish supported work from Ops without coordinating multiple
provider dashboards. When an API cannot support a step, Ops must explain the exact limitation,
provide a bounded manual/import path, and preserve the state needed to resume.

On 2026-09-06 the user selected **complete Meta capability as the first delivery focus**.
Google Ads, GA4, Merchant Center and TikTok remain in the roadmap. Google/GTM and shared
measurement work needed to complete the Meta journey are dependencies of that focus.
Existing SEO capabilities remain supported; this priority does not authorize hosted SaaS work
or change the existing hosted admission gate.

“Complete Meta capability” means complete supported operational workflows across connections,
account/resource settings, reporting, measurement, advertising, audiences, assets and catalogs.
It does not mean promising every Ads Manager feature regardless of API support or access.
Provider availability, restricted access and dashboard-only features must be explicitly recorded.

This Plan extends the [architecture baseline](../../standards/13-unisane-ops-product-architecture-baseline.md)
and the [Meta measurement roadmap](unisane-ops-growth-meta-measurement-roadmap.md).
The measurement roadmap retains detailed event/outcome contracts and implementation milestones;
this document owns the broader capability checklist and Meta-first delivery order.
Skopos Tasks own execution, validation evidence and closure. This Plan is not provider-operation,
publication, deployment or source-cutover approval.

## Status interpretation

Baseline: source and documentation inspected on 2026-09-06, including uncommitted work.
This is not a release certification or a new live-account test. Console coverage was inspected
in source, not visually tested. Recheck affected capabilities when starting implementation.

- Checked items mean the named implementation exists; they do not mean production-ready.
- Unchecked items need implementation, integration, interface exposure or explicit verification.
- “Not established” means this review did not establish a complete workflow; inventory before
  building replacements.

For every capability, record these dimensions independently:

| Dimension | Required facts |
| --- | --- |
| Provider support | Public API, restricted, import only, unsupported, or unverified; documentation reference |
| Implementation | Missing, partial or complete; owning action and source |
| Host execution | Bound, blocked or environment-restricted; exact reason |
| Interfaces | CLI, console, MCP and any admitted API availability |
| Account readiness | Selected resources, grants, credential health and prerequisites |
| Proof | Fixture, integration and live evidence separately; date, API version and scope |

## Architecture and agent experience

Interfaces invoke typed actions. Growth owns domain rules and orchestrates injected provider
adapters and evidence stores. The Ops engine owns execution, approval, receipts and recovery;
hosts supply credentials, persistence and scheduling. Provider packages own API transport,
discovery and normalization. Web Runtime supplies optional portable observation adapters.
Adopters own orders, consent, customer information, catalog source data and business rules.

Ops must not import adopter source, query its database directly or become a checkout dependency.
Use versioned artifacts, adapters or an explicitly authenticated ingestion boundary.
The model reasons about goals and evidence; application code executes and enforces operations.

- [x] Shared typed read/mutation definitions, context and execution contracts.
- [x] Plans, approvals, leases/locks, receipts, recovery and evidence foundations.
- [x] Project setup, Growth selection and explicit environment/resource configuration.
- [ ] One capability inventory derived from the dimensions above, with account-specific availability.
- [x] Provider Meta source-inventory slice: 18 capabilities with separate implementation,
  fixture evidence, prerequisites and host-operation references; account readiness is explicitly
  not evaluated (M0.1, Task `T-5707aaab`).
- [x] Meta account-aware offline Growth action, CLI and MCP projections (M0.2, Task `T-57103658`):
  exact target/resource matching, freshness, grants, host support and explicit blockers.
- [x] M0.2 console verification: shared result in Connections and Meta detail; typecheck, lint,
  all 28 console tests, production builds and desktop/narrow visual checks pass with published
  UI/data-table 0.1.1. No live account verification is claimed. See the implementation plan record.
- [ ] Guided setup that resolves ordinary choices without manual configuration editing.
- [x] M1.1 Meta terminal selection: discovered account/Pixel/dataset names and IDs, explicit choices,
  cancel-before-save behavior, existing-selection preservation, and deterministic JSON/flag use.
  Browser OAuth, guided console/MCP setup and real-account proof remain pending.
- [ ] Shared actions for remaining specialist CLI/provider workflows; no shell or output parsing in MCP/UI.
- [ ] Discoverable supported reports, dimensions, filters, settings and resource relationships.
- [ ] Readable before/after plans with exact account, target, currency and effects.
- [ ] Approval reuse for the same unchanged plan; invalidate on material drift or revised effects.
- [ ] Actionable errors, bounded results, persistent references and resumable handoffs.
- [ ] Business-context briefs containing relevant goals, constraints, evidence and past decisions.
- [ ] Adapter examples for commerce and lead-generation products.
- [ ] Agent evaluations covering complete workflows, missing evidence, failed operations and recovery.

The canonical MCP tool list is `OPS_MCP_TOOL_NAMES`. It includes capability review, report read,
explicit report collection and offline history alongside Growth health, SEO, measurement audit
and the campaign-pause lifecycle. Host configuration may expose a subset. This is not yet full
marketing control.

## Meta — first delivery focus

### Connections, account settings and resources

- [x] Local system-user credential onboarding and context-bound macOS Keychain custody.
- [x] Connection refresh, rotation, disconnect and token-free connection records.
- [x] Identity/grant and business/ad-account/Pixel/dataset/Page/Instagram discovery.
- [x] Explicit resource selection and ambiguity/readiness checks.
- [ ] Prove connection and recovery against the selected real account.
- [ ] Guided CLI, console and agent setup with names alongside IDs and permission explanations.
- [ ] Browser OAuth where appropriate; retain supported system-user setup.
- [ ] Inventory supported account settings, relationships and editability before exposing changes.
- [ ] Implement supported account-setting and asset-link changes through reviewed actions.
- [ ] Explain expired/revoked/partial access and provide reconnect/rotation recovery.
- [ ] Show connected, configured, observed and verified as distinct states.

### Reports and diagnosis

- [x] Account, campaign, ad-set, ad, creative and device report paths.
- [x] Selected-account reporting through a host-contained credential callback.
- [x] Bounded pagination, retry, timeout and redacted transport failures.
- [ ] Verify report families against real resources, including empty and partial results.
- [x] Bounded current account/campaign/ad-set/ad report snapshots through `growth.reports.read`,
  CLI `growth reports read`, MCP `read_growth_report`, and the Meta Advertising console form.
  Fixture-proven; exact target/window checks, separate action types, explicit partiality and no
  history persistence. Account timezone and attribution defaults remain unverified.
- [x] M1.2b: explicit report collection, content-derived evidence references, isolated local storage,
  offline history and exact snapshot retrieval through CLI, MCP and console. Bounded snapshots
  retain partiality and omitted-row counts; duplicate snapshots are not added together.
- [ ] Compatible-window/currency/attribution aggregation of saved snapshots into performance summaries.
- [ ] Inventory and add supported breakdowns, filters, attribution settings and diagnostics.
- [ ] Preserve timezone, currency, window, completeness, capture time and revision in comparisons.
- [ ] Explain delivery problems and supported policy/account issues with evidence and next actions.
- [ ] Separate resource configuration, delivery status and performance metrics.

### Measurement

- [x] Event registry v2 and browser/server deduplication/retry/collision reconciliation foundations.
- [x] Redacted browser, server, outbox and consent observation adapters and ingestion foundations.
- [x] Canonical outcome v2 ledger, corrections/reversals and local ingestion.
- [x] Measurement audit distinguishing canonical outcomes from provider attribution.
- [ ] Complete adopter integration and authenticated ingestion where needed.
- [ ] Bind producer, project/environment, revisions, replay handling, limits and retention explicitly.
- [ ] Trace real Purchase and other selected events from business trigger through delivery.
- [ ] Validate value, currency, timestamps, event identity, consent and matching-field availability.
- [ ] Ingest application CAPI receipts and durable outbox attempts as normalized evidence.
- [ ] Acquire supported provider diagnostics; establish Dataset Quality API access/support with evidence.
- [x] Provide bounded, versioned manual diagnostic import and offline event review through CLI,
  MCP and console (M2.1). Imports preserve source and target; no live API parity is claimed.
- [ ] Show expected, suppressed, accepted, rejected, retried and missing event evidence.
- [ ] Turn discrepancies into reviewable repair proposals and verify repairs.
- [ ] Complete the detailed live event and outcome proof in the measurement roadmap.

Keep canonical business outcomes, delivery observations, provider diagnostics and attributed
conversions separate. Provider acceptance does not prove attribution or business success.

### Events Manager issues and recommendations

The user supplied Events Manager Overview and Actions screenshots on 2026-09-06 as concrete
product requirements. Ops must support the corresponding investigation and repair journey for
humans and agents. Screenshots demonstrate desired information, not API availability or live
verification. Do not copy account identifiers or customer-specific evidence into this public
product checklist.

M2.1 supplies labelled manual observations with optional reported totals, last receipt, channels,
match quality and coded issues; exact event filtering, freshness, reported lifecycle and
unverified owner handoffs work across all three interfaces. The broader requirements below
remain open where they need live acquisition, delivery joins, linked ad sets or repair execution.

- [ ] Event inventory with event name, activity status, selected-window totals, last received time,
  integration channels, issue count and linked ad-set usage where evidence is available.
- [ ] Per-event detail for PageView, ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo,
  Purchase and adopter-defined events, preserving provider names and business mappings.
- [ ] Provider-reported Event Match Quality with source, capture time and availability reason;
  never synthesize Meta's proprietary score from Ops field-coverage checks.
- [ ] Event issues with provider code where available, severity, affected event/resource,
  first/last observed time, evidence and actionable explanation.
- [ ] Active, previously detected and ignored issue views. Distinguish an Ops acknowledgement
  from a provider-side dismissal, and require fresh evidence before calling an issue resolved.
- [ ] Browser/server coverage and deduplication views with explicit denominators, windows,
  retries, collisions and unavailable evidence; no inferred coverage from connection status.
- [ ] Matching-input availability/validity diagnostics, including external ID and browser IDs
  where applicable and consent permits, without exposing unnecessary raw personal data.
- [ ] Recommendations showing whether they originate from Meta or Ops, their supporting evidence,
  affected events/ad sets, priority, limitations and exact proposed next step.
- [ ] Preserve provider-reported CAPI uplift and benchmark claims as attributed provider evidence;
  do not present more reported conversions as more actual orders, or advertised percentage
  improvements as a forecast or causal result for this business.
- [ ] Shared typed actions to list events/issues, inspect details, retrieve supported diagnostics,
  prepare repairs and verify outcomes, consumed by both the console and MCP.
- [ ] Repair handoff to the correct owner: GTM configuration, adopter browser/server code,
  outbox behavior or supported provider settings, followed by event/provider verification.
- [ ] API/access inventory for every displayed field. Use explicit evidence imports for
  dashboard-only diagnostics and clearly mark missing, stale or unsupported fields.

Acceptance example: an agent asked “Why does Purchase have an error?” identifies the selected
dataset and window, retrieves the actual diagnostic, explains affected delivery or reporting,
proposes an evidence-supported repair, follows the required review/apply or adopter handoff,
and verifies the result with fresh evidence. An aggregate “1 error” badge alone does not reveal
the root cause. Imported screenshots are historical observations, not a live connection.

### Advertising, audiences and assets

- [x] Exact campaign pause/status provider implementations.
- [x] Limited paused campaign creation and asset-upload implementations.
- [x] Exact campaign pause and status verification through the shared host lifecycle with
  account identity, permissions, approvals and durable attempts (fixture-proven).
- [ ] Complete host execution for campaign creation and asset uploads.
  The current local host blocks these Meta paths; provider code is not an available workflow.
- [ ] Browse current campaign/ad-set/ad configuration and resource relationships.
- [ ] Pause/resume supported hierarchy levels.
- [ ] Edit budgets, schedules, bidding and optimization settings.
- [ ] Edit supported targeting, placements and exclusions.
- [ ] Replace creatives and destination URLs; provide supported previews.
- [ ] Rename, duplicate and perform supported archival operations.
- [ ] Add custom/lookalike audiences and audience exclusions where access permits.
- [ ] Add existing-post creatives, carousels and catalog-backed advertising.
- [ ] Inventory and implement supported Advantage+ settings with exact provider semantics.
- [x] Meta provider creation rejects missing/invalid destinations and daily budgets before any
  provider request; relative destinations require an explicit origin. The unrelated product-domain
  and implicit daily-budget fallbacks are removed (Task `T-f43d0f35`, 2026-09-06).
- [ ] Complete shared plan currency/default review and account-specific budget-unit validation.
- [ ] Persist created resource IDs per step; reconcile uncertain or partially created campaigns.
- [ ] Expose review/apply/verify through shared CLI, MCP and console actions.
- [ ] Verify provider acceptance, resulting resource state and delivery separately.
- [ ] Record a later business measurement window without claiming causation from a state change.

### Meta catalogs

No complete catalog suite was established by this review. Reuse existing contracts where found.

- [ ] Portable product/variant projection with stable IDs, revisions and source ownership.
- [ ] Business exclusions and per-channel eligibility with explicit reasons.
- [ ] Meta required-field validation and included/excluded preview.
- [ ] Catalog connection/resource binding, synchronization and processing receipts.
- [ ] Product sets, labels and supported grouping operations.
- [ ] Price, stock, images, identifiers and landing-page reconciliation.
- [ ] Rejection/disapproval ingestion and actionable repairs.
- [ ] Incremental updates, tombstones, retry handling and partial-snapshot deletion protection.
- [ ] Revalidation after source or provider-rule changes.
- [ ] Complete catalog-backed advertising against the selected real account.

Business eligibility, Ops validation and provider approval are separate states. Validation
must not promise approval or override adopter business exclusions.

## Google Tag Manager — reuse for Meta measurement

- [x] Canonical connection with read, workspace and publish access levels.
- [x] Remote snapshots, extended inspection, manifest validation, diff and plans.
- [x] Controlled workspace and tag/trigger/variable/folder create/update paths.
- [x] Built-in variables and typed existing-Gallery-template adoption.
- [x] Preview, version creation, reviewed publish and rollback with receipts/fingerprints.
- [x] Shared offline GTM diagnosis through CLI `growth gtm diagnose`, MCP `diagnose_gtm`
  and console Tracking health, including policy/ownership findings and verification gaps.
- [x] Reject foreign/ambiguous planning snapshots and avoid repeated pauses for inactive tags.
- [x] Bind preview → version content, require exact version receipts/fingerprints and verify
  live-version identity/content after publish or rollback (fixture-tested, not live-proven).
- [x] Bound provider inventory pagination and redact transport failures.
- [ ] Expose the complete mutation lifecycle through shared approval/job actions, MCP and console review.
- [ ] Generate a reviewable configuration from business events and selected destinations.
- [ ] Diagnose existing installations, duplicate tags and conflicting ownership.
- [x] Inventory resource operations and retain unmanaged resources; removed managed tags pause.
  See [GTM completion plan](unisane-ops-gtm-completion-plan.md) for per-resource limitations.
- [ ] Add dependency-aware destructive deletion/revert and durable partial-write recovery.
- [ ] Verify site installation, actual journeys, data-layer values and consent behavior.
- [ ] Verify destination receipt after publishing; preview alone is insufficient.
- [ ] Complete a repair-and-verification workflow and separately inventory server-side GTM.

The measurement roadmap records a bounded live GTM read/dry-run/compiler-preview proof.
It does not establish workspace writes, publication or complete production tracking verification.

## Google Ads and GA4 — subsequent expansion

- [x] Google OAuth, discovery, selected resources and connection lifecycle.
- [x] Account/campaign/ad-group/keyword/search-term/device reporting paths.
- [x] Conversion-action inventory and campaign configuration reporting.
- [x] Keyword research, search-term analysis and negative-keyword recommendations.
- [x] Ads plans, validation, differences, readiness and exact campaign pause/status paths.
- [x] Limited paused Search creation and selected conversion-action planning/creation.
- [x] GA4 connection/discovery and reporting.
- [ ] Complete supported account settings and resource relationship control.
- [ ] Campaign/ad-group/ad/keyword browsing and editing through shared actions.
- [ ] Pause/resume, budgets, schedules, bidding and shared-resource dependency handling.
- [ ] Apply reviewed keywords/negatives to existing campaigns; manage assets and destinations.
- [ ] Complete default/campaign conversion goals, enhanced/offline conversions and adjustments.
- [ ] Complete GA4 property/stream/key-event configuration workflows where supported.
- [ ] Reconcile GA4 and Google Ads with canonical outcomes and declared attribution windows.
- [ ] Shopping, Performance Max and asset groups; later Demand Gen, Display and Video.
- [ ] Policy/disapproval diagnosis, partial-creation recovery and live proof per action.
- [ ] Replace Auction Insights API queries/recommendations with an explicit supported import path.
- [ ] Label conversion-action inventory correctly; it is not a conversion-performance report.

Google documents Auction Insights metrics as not publicly available in the
[Ads API field reference](https://developers.google.com/google-ads/api/fields/v25/metrics).
Recheck support and version compatibility during implementation.

## Merchant Center and TikTok — subsequent expansion

- [ ] Extend the portable catalog projection to Google Merchant Center and TikTok.
- [ ] Merchant API connection, ingestion, diagnostics, processing state and supported settings.
- [ ] TikTok provider package, credentials, grants, discovery and reporting.
- [ ] TikTok assets and reviewed campaign/ad-group/ad operations.
- [ ] TikTok supported event diagnostics, audiences and catalog advertising.
- [ ] Shared contracts, interface exposure, recovery and live proof for each provider.

Target Merchant API. Google's Content API reached sunset on 2026-08-18 with progressive
degradation from 2026-09-01; see the
[official migration status](https://developers.google.com/shopping-content/guides/deprecation-and-sunset).

## Console, scheduling and production execution

- [x] Console source routes for SEO, Advertising, Analytics, Connections, Activity and Automations.
- [x] Local campaign-pause approval surface; it does not expose provider apply/verify endpoints.
- [x] Historical evidence/backfill and durable job/scheduler foundations.
- [ ] Extend existing screens with shared actions rather than treating route presence as completion.
- [ ] Guided connections, account settings, report refresh and readable change review.
- [ ] Per-event measurement, GTM workflows, catalogs and execution/verification progress.
- [ ] Durable approval/run/receipt storage and atomic claims before production account writes.
- [ ] Interrupted-run, uncertain-outcome and partial-creation recovery before broad mutation.
- [ ] Scheduled collection, resumable backfills and bounded approved automation rules.
- [ ] Alerts for delivery failures, duplicate spikes, invalid currency and catalog rejections.
- [ ] Evidence-qualified spend/CPA/ROAS anomalies; deduplication, acknowledgement and quiet periods.
- [ ] Visible last success, next run, failure reason and local-host-running requirement.
- [ ] Keep GitHub Actions optional; preserve the separate hosted SaaS admission gate.

## Meta delivery batches and completion

Each batch delivers domain logic, provider execution, relevant interfaces, failure handling,
documentation and evidence together. Meta completeness is the destination; the first workflow
does not reduce that scope. Run broader Google/TikTok work after Meta except required dependencies.

| Batch | Usable result |
| --- | --- |
| M0 | Accurate Meta capability inventory, provider/API access map and repairs for selected workflows |
| M1 | Connect a real account, select resources and retrieve trustworthy reports from Ops |
| M2 | Trace real business events through GTM/browser/server/provider evidence and verify repairs |
| M3 | Review, apply and verify exact campaign control, then budgets/schedules/settings with durable execution |
| M4 | Complete supported campaign creation/editing, creatives, audiences and partial-operation recovery |
| M5 | Catalog ingestion, synchronization, diagnostics and catalog-backed advertising |
| M6 | Scheduled evidence, bounded approved rules, alerts and complete agent/console acceptance |

For every admitted capability:

- [ ] Provider support, required access and documented limitations recorded.
- [ ] Existing code reused or its replacement justified; one owning typed action.
- [ ] Host binding, domain rules and provider implementation complete.
- [ ] CLI/MCP and appropriate console flow consume the same results and approval lifecycle.
- [ ] Fixtures, contract tests, isolation/redaction and relevant migration/recovery tests pass.
- [ ] Real-account proof records exact scope, date, API version and resulting state safely.
- [ ] Agent completes the workflow without undocumented dashboard steps.
- [ ] Unsupported/restricted features explain why and provide an honest fallback.
- [ ] Immediate operation verification and later outcome measurement are distinguished.

## Baseline source references

- [Engine actions](../../../packages/ops-engine/src/actions.ts)
- [MCP tools](../../../packages/ops-mcp/src/server.ts)
- [Meta capabilities](../../../packages/provider-meta/src/meta/capabilities.ts)
- [Host provider bindings](../../../packages/unisane-ops/src/runtime-adapters/growth.ts)
- [Meta executor](../../../packages/provider-meta/src/meta/marketing/live-ads-executor.ts)
- [Google executor](../../../packages/provider-google/src/google/marketing/live-ads-executor.ts)
- [Google reports](../../../packages/provider-google/src/google/marketing/google-ads/api-pull.ts)
- [GTM commands](../../../packages/growth/src/cli/commands/gtm/register.ts)
- [Console routes](../../../apps/console/src/routes.ts)


### GTM shared workspace execution update

- [x] Shared typed workspace plan/review/apply/recovery workflow with exact human approval.
- [x] CLI and console lifecycle; MCP plan/review/apply-approved/recover without self-approval.
- [x] Drift checks, workspace leases, persisted started attempts and recovery without replay.
- [x] Offline tests for failures, isolation and local host durability restrictions.
- [ ] Durable production/agent host execution backend and verified live Google acceptance.
- [ ] Migrate preview/version/publish into the same shared mutation lifecycle.
- [ ] Generated event configuration, conflict resolution, destructive operations, server-side
      GTM administration and actual journey/destination proof.

See the [GTM completion plan](unisane-ops-gtm-completion-plan.md) for ownership and verification
limits. This update completes the workspace mutation batch, not every GTM capability.

### GTM release and host completion update

- [x] Shared preview, create-version and publish planning/apply/recovery through CLI, console and MCP.
- [x] Exact known-version rollback through a reviewed publication plan.
- [x] Enforced publish policy, reviewed fingerprints/live revision and container-wide attempt guards.
- [x] Durable single-host SQLite state for approved production/agent execution, with crash/CAS/fencing tests.
- [ ] Reviewed migration for projects with existing local execution records.
- [ ] Generated tracking recipes and dependency-aware removal/revert.
- [ ] Workspace conflict resolution and environment/destination/permission administration.
- [ ] Server-container mutations/hosting and actual journey/destination verification.
- [ ] Live Google account acceptance and operational deployment/backup proof.

Earlier unchecked shared release and durable backend entries are superseded by this update;
the remaining resource administration and live verification items remain open.

### GTM setup compiler increment

- [x] Offline typed setup proposals for explicitly mapped GA4, Meta and Google Ads events,
  shared by CLI (`gtm generate-setup`), MCP (`generate_gtm_tracking_setup`) and console.
- [x] Explicit consent defaults, event-ID/value/currency/transaction-ID observation paths,
  generated variable references and diagnosis, without replacing the canonical manifest.
- [x] Meta pixel-specific calls preserve monetary fields and deduplication ID; generated tags
  initialize each selected pixel once among themselves.
- [ ] Real resource/permission acceptance, CMP/browser execution and destination-delivery proof.

See the GTM completion plan for the separate remaining administration, migration and server
container work. A generated proposal or successful publication does not verify tracking.

### GTM execution cleanup

- [x] Removed duplicate root CLI plan/apply/preview/create-version/publish/rollback commands,
  their private file-plan approval/receipt helpers, and raw host mutation dispatch routes.
- [x] Removed obsolete console command-overlay suggestions and redundant rollback provider
  alias. Use shared workspace actions and release publication of an exact prior version.
- [x] Require provider version-reading methods in the typed port and reject mutation responses
  missing real resource IDs; do not substitute a local slug for a remote identifier.
- [x] Preserve explicit backend/history guards and remote resource-name recognition needed
  for existing managed resources. Neither silently switches an execution backend.

The cleanup is scoped to the GTM paths introduced and superseded in this work. It is not a
claim that every package in the repository has undergone dead-code analysis.

### Ops/Growth/Meta cleanup audit

- [x] Repair host integration fixtures and config module ambiguity; preserve strict canonical
  config shapes across CommonJS and ESM.
- [x] Centralize existing Meta API pins, remove arbitrary multi-image response selection and
  share credential-safe mutation errors. Keep unknown pause/status outcomes explicit.
- [x] Audit capability claims against host dispatch; implemented SDK code does not imply
  configured, exposed or live-verified functionality.
- [ ] Migrate older ads/asset approval-reference workflows to shared engine actions.
- [x] Extract Google conversion-goal and asset upload/link transport from Growth into provider-google.
- [ ] Audit other provider transport boundaries and consolidate compatible Google versions.
- [ ] Compose approved Meta host mutation callbacks and prove durable execution on real accounts.

Details and retained safety behavior: [execution cleanup audit](unisane-ops-execution-cleanup-audit.md).

### Durable campaign control update

- [x] CLI/MCP campaign pause and console review/approval use shared host execution stores.
- [x] Meta host credentials, exact campaign/account readback and mutation permission checks.
- [x] Provider-derived state revisions; caller labels do not establish current provider state.
- [x] Pre-dispatch attempts, target guards, no replay after interruption and delayed recovery.
- [x] Optional ads SQLite backend for approved agent/production writes on one persistent host.
- [x] Reject direct campaign mutation bypass and require new plans for pre-attempt records.
- [ ] Explicit local-to-SQLite history migration and operational backup/deployment proof.
- [ ] Full console apply/verification controls beyond current review and human approval.
- [ ] Extend the same lifecycle to resume, budgets, schedules, assets, goals and creation.
- [ ] Real Meta/Google account acceptance, permission recovery and later outcome measurement.

See the execution cleanup audit for this batch's boundaries. This update completes exact
campaign pause infrastructure, not the remaining Meta advertising or measurement program.
