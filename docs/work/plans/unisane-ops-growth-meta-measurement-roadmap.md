---
id: 'PLAN-50c73c7bd468'
owner: 'unisane-ops'
repository: unisane-ops
scope: workspace
role: plan
lifecycle: durable
authority: supporting
provenance: accepted
view: current
status: active
appliesTo:
  - 'ops'
  - 'growth'
  - 'measurement'
  - 'meta'
  - 'tracking'
---

# Unisane Ops Growth Meta Measurement Roadmap

Build a provider-neutral, evidence-driven Meta measurement lifecycle in Unisane Ops so operators can
diagnose most Pixel, Conversions API, attribution, deduplication, and customer-data coverage
problems without treating Meta's dashboard as the system of record.

## Changelog

- `2026-09-06`: The user selected complete Meta capability as the first Growth delivery focus.
  The [Growth capability checklist](unisane-ops-growth-capability-checklist.md) owns the broader
  account, reporting, advertising, catalog, agent and console sequence. This roadmap remains the
  detailed measurement contract and milestone reference; required Google/GTM dependencies are
  included in the Meta focus. Hosted admission and provider-operation approval remain separate.
- `2026-09-03`: Completed typed existing-Gallery-template adoption for GTM: pinned repository
  identity/version, recursive parameters, built-in trigger references, scalar normalization, and
  raw-snapshot rebinding. A separate workspace-only Google connection completed a live extended
  pull, exact digest-bound dry run, and compiler quick preview against the ECOM characterization
  container without publish scope or workspace writes.
- `2026-09-03`: Clarified the boundary between the read-only Meta measurement audit and the
  existing Google-owned GTM control plane. Added least-privilege GTM connection profiles and
  digest-bound reviewed-plan apply. Existing third-party template adoption and controlled live
  six-event evidence remain explicit gaps; the measurement audit still cannot auto-publish GTM.
- `2026-09-01`: Completed the canonical outcome v2 source milestone under Skopos Task `T-3981ed48`:
  strict project/environment/source/window binding, server-confirmed finality, redacted correlation
  references, uppercase currencies, append-only corrections and reversals, immutable digest-linked
  artifact revisions, replay/collision protection, explicit v1 migration, and fail-closed Growth
  trust gating. Local CLI ingestion is available; scheduled ingestion and an adopter-side
  authenticated adapter remain later work. Provider attribution remains a separate evidence family
  and cannot satisfy canonical truth.
- `2026-09-01`: Completed the provider-neutral observation adapter source under Skopos Task
  `T-3ac6fa71`: runtime-neutral schemas moved to `@unisane/web-runtime/contracts`; browser, server,
  outbox, and consent adapters hash identity inputs and emit only redacted field states; project and
  environment validation plus replay-safe ingestion preserve distinct delivery attempts; and
  portable commerce and lead fixtures prove two unrelated adopter shapes. Growth consumes only the
  contract subpath. No ECOM source, Meta provider, GTM publication, or canonical outcome behavior
  was added.
- `2026-09-01`: Completed the source implementation for the privacy-safe observation contract under
  Skopos Task `T-8855a28c`: status-only customer, transport, commerce, consent, capture, and bounded
  diagnostic evidence; deterministic digest migration for legacy private references; source and
  receive clocks; evidence freshness; delivery freshness gating; and canonical-correlation plus
  bounded-occurrence grouping. No Meta connection, ECOM adapter, provider read, or provider mutation
  was added.
- `2026-09-01`: Completed the source implementation for work package 1 under Skopos Task
  `T-25344928`: event registry v2, tracking observation v2, explicit v1 migrations and runtime
  rejection, channel-aware deduplication, retry/collision/missing-channel findings, expanded audit
  coverage, and focused regression tests. Provider connection, provider evidence acquisition, match
  diagnostics, console changes, and adopter work remain later phases.
- `2026-09-01`: Opened the roadmap under Skopos Task `T-ea4595df`. Defined the Unisane Ops versus
  adopter-product boundary, corrected the target dual-delivery and deduplication semantics, and
  added phased connection, evidence, diagnostics, console, privacy, migration, testing, rollout, and
  completion checklists.

## Authority And Execution

This plan owns multi-task direction only. Skopos Tasks own implementation, exact path ownership,
Evidence, Readiness, and closure. An unchecked item is target state, not a claim that the capability
exists.

Accepted Decisions and Standards remain authoritative where they are more specific:

- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/decisions/D-20260725-unisane-meta-provider-admission-contract.md`
- `docs/decisions/D-20260729-unisane-ops-growth-onboarding-and-clean-cutover-contract.md`
- `docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md`

This plan grants no provider credential, OAuth consent, production access, tracking installation,
GTM publication, campaign mutation, or spend authority.

## Outcome

An operator can answer these questions from one Growth workflow and one shared result:

1. Which events were expected, emitted, suppressed, accepted, rejected, duplicated, or missing?
2. Did browser and server events form valid deduplication pairs?
3. Which legitimate customer identifiers were available, normalized, and sent?
4. Did Meta accept the events, and what provider diagnostics are available?
5. Do canonical business outcomes agree with recorded tracking delivery?
6. How do Meta-attributed conversions differ from canonical outcomes?
7. Is the evidence fresh and trustworthy enough to guide optimization?
8. What exact repair should be reviewed next?

The product must never replace missing evidence with assumptions, combine canonical and
provider-attributed outcomes into one number, or call measurement ready because a connection or
configuration merely exists.

## Product And Repository Boundaries

| Owner                                    | Owns                                                                                                                                              | Must not own                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@unisane/growth`                        | provider-neutral event policy, outcome, attribution, reconciliation, recommendation, freshness, and safety contracts                              | Runtime observation emission, Meta Graph transport, credentials, adopter checkout logic            |
| `@unisane/provider-meta`                 | Meta connection transport, Graph pagination, grant/resource discovery, supported reporting and diagnostics reads, provider response normalization | Growth trust decisions, canonical business truth, cross-provider policy, CAPI application delivery |
| `@unisane/web-runtime`                   | runtime-neutral observation schemas, portable browser/server/outbox/consent adapters, and optional application-runtime delivery adapters          | Meta management credentials, Ads reporting, Growth reconciliation or audit truth                   |
| `@unisane/ops-engine` and hosted runtime | typed action admission, durable jobs, leases, retries, secret-custody ports, receipts, identity, and effect ceilings                              | Growth semantics or provider-specific recommendations                                              |
| `unisane-ops` CLI, MCP, API, and console | adapters over one typed action result                                                                                                             | duplicate handlers, raw command invocation, independent trust logic                                |
| Adopter products                         | business triggers, consent, customer-data collection, browser emitters, server emitters, canonical outcomes, and durable domain workflows         | Unisane Ops package internals or Ops-wide policy                                                   |
| ECOM                                     | one external adopter and controlled integration scenario                                                                                          | an Ops dependency, package owner, universal event contract, or source of Ops-wide truth            |
| Meta                                     | provider receipt, attribution, supported diagnostics, and proprietary match scoring                                                               | canonical order truth                                                                              |

Unisane Ops must not import ECOM source, resolve ECOM repository paths, depend on ECOM schemas, or
encode ECOM-only checkout rules. Integration uses versioned provider-neutral artifacts, typed
adapters, or authenticated APIs. Redacted ECOM-derived scenarios may be fixtures only when their
facts are portable and contain no customer data or secrets.

## Trust Model

Growth keeps four evidence families separate:

| Evidence family       | Meaning                                                                               | Authority                              |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| Canonical outcomes    | Server-confirmed business results such as completed orders and real revenue           | Adopter business system                |
| Delivery observations | What browser/server emitters attempted, suppressed, accepted, retried, or rejected    | Instrumentation and transport evidence |
| Provider diagnostics  | What Meta reports about received events, fields, resources, and supported diagnostics | Provider operational evidence          |
| Provider attribution  | Conversions Meta attributes under its model and window                                | Provider-attributed evidence only      |

Safe-to-scale guidance requires current canonical outcomes plus trustworthy tracking. Provider
attribution can explain channel reporting but cannot replace either.

## Baseline Gaps And Current Status

1. Resolved in `T-25344928`: the event registry now models one logical event delivered by browser,
   server, or both.
2. Resolved in `T-25344928`: observation reconciliation now distinguishes correct dual delivery,
   duplicates, retries, missing channels, and event-ID collisions.
3. Resolved across `T-25344928`, `T-8855a28c`, and `T-3ac6fa71`: observation version 2 now carries
   redacted logical identity, attempt, receipt, timing, field-coverage, project, environment, and
   correlation evidence through a portable adapter boundary.
4. Tracking source audits can detect transports but cannot prove live provider receipt or
   customer-field coverage.
5. Resolved across `T-a19b0534`, `T-0549fc95`, `T-877f08de`, and `T-ca0afd58`: the local host uses a
   canonical token-free Meta connection record and executes discovery plus Ads reporting only inside
   a provider-owned callback backed by a context-bound macOS Keychain lookup.
6. Provider Meta now exposes its canonical connection lifecycle, bounded resource discovery, and
   host-contained read-only Ads reporting through the package root; it has no provider CLI.
7. Meta discovery now covers business, ad account, Pixel, dataset, Page, and Instagram candidates,
   but explicit user-facing resource selection and full OAuth/system-user onboarding remain open.
8. Resolved in `T-877f08de`: Growth Ads reports use the exact selected `ads-insights` account, date
   window, and bounded options without receiving the token; the host reconciles canonical resource
   and `ads_read` evidence before transport.
9. CAPI application responses and durable outbox results are not ingested as normalized tracking
   evidence.
10. Canonical outcome loading exists as an injected measurement-audit dependency but no ordinary
    adopter contract completes the lifecycle.
11. The console shows aggregate tracking health but no per-event browser/server pair, match-input
    coverage, rejection, or outbox history.
12. Some Meta Events Manager diagnostics and proprietary Event Match Quality scores may not be
    available through supported APIs; the product needs an explicit limitation and evidence-import
    path.

## Target Architecture

```text
Adopter browser emitters ─┐
                         ├─> versioned observation adapters ─┐
Adopter server/outbox ───┘                                   │
                                                             ├─> Growth reconciliation
Adopter canonical outcomes ─> canonical outcome adapter ────┤    and trust decision
                                                             │
Canonical Meta connection ─> Provider Meta reads ───────────┘
       │
       ├─ ad account / Pixel / dataset inventory
       ├─ Meta Ads attributed reporting
       └─ supported receipt and diagnostic evidence

Growth result ─> CLI JSON / human CLI / Console / MCP / API / automation
```

Every presentation surface consumes the same typed action output. Provider reads never silently run
because a page, audit, or agent response is rendered.

## GTM Control-Plane Boundary

GTM mutation is a separate Google-provider workflow, not an effect of the Meta measurement audit.
The audit may recommend a change, but an operator must move through the GTM manifest, exact plan,
workspace apply, preview, version, and publication approvals independently.

- [x] Keep the routine Tag Manager connection read-only by default.
- [x] Support explicit `workspace` and `publish` OAuth profiles on a separately named connection.
- [x] Bind apply to an unchanged, digest-verified plan, manifest, container, environment, and
      workspace.
- [x] Require explicit confirmation for workspace apply and stronger production confirmation for
      publish.
- [x] Preserve apply, preview, version, publish, and rollback receipts.
- [x] Add typed adoption of existing third-party Gallery templates and their nested parameters,
      including pinned Gallery identity/version and lossless recursive parameter preservation.
- [x] Add a controlled characterization of the workspace-scoped Google connection: extended pull,
      digest-bound zero-write dry run, and compiler quick preview without publish authority.
- [ ] Add a six-event browser/server preview evidence adapter; compiler quick-preview alone is not
      event-delivery proof.

## Contract Direction

### Event Registry Version 2

The event registry must represent logical events independently from delivery channels.

- [x] Add `deliveryExpectation`: `browser-only`, `server-only`, or `browser-and-server`.
- [x] Add per-channel emitter expectations without embedding provider credentials.
- [x] Declare the event-ID rule once and channel-specific derivation only when needed.
- [x] Declare the canonical correlation key separately from provider event ID.
- [ ] Declare value, currency, catalog, consent, and customer-field requirements.
- [ ] Declare whether the event is a business outcome, funnel event, or observation only.
- [x] Keep event names configurable per adopter; do not hardcode ECOM's event set as a universal
      platform rule.
- [x] Reject ambiguous or contradictory delivery declarations.
- [x] Provide a one-shot migration from version 1 and reject version 1 at ordinary runtime after the
      cutover.

### Tracking Observation Version 2

The normalized observation must support:

- [x] `logicalEventId`, provider event name, event ID, channel, emitter, environment, and occurrence
      time.
- [x] Outcome: attempted, emitted, suppressed, accepted, rejected, retried, dead, or unknown.
- [x] Provider/resource reference without access tokens or private resource names.
- [x] Canonical correlation reference and transaction/order reference where permitted.
- [x] Attempt number, latency, HTTP status class, bounded provider message code, and trace
      reference.
- [x] Value/currency/catalog validity states rather than uncontrolled payload copies.
- [x] Customer-field coverage states: absent, present, normalized, hashed, invalid, or
      not-applicable.
- [x] `_fbp`, `_fbc`, client IP, user agent, and source URL presence/validity states.
- [x] Consent state and suppression reason.
- [x] Capture source, schema version, freshness, and provenance.
- [x] Bounded extension space for provider-specific diagnostic codes.
- [x] Strict redaction that rejects raw PII, access tokens, cookies, full IP addresses, user agents
      when policy prohibits retention, and unbounded provider bodies.

### Correct Deduplication Semantics

| Observation pattern                                                        | Result                         |
| -------------------------------------------------------------------------- | ------------------------------ |
| One browser + one server event, same logical event and event ID            | valid deduplication pair       |
| One browser + one server event, same logical event but different event IDs | deduplication failure          |
| Multiple browser events for one logical event                              | browser duplicate              |
| Multiple server events for one logical event                               | server duplicate or retry leak |
| Server retries with one stable event ID and one provider acceptance        | valid durable retry            |
| Same event ID reused across different logical events or transactions       | collision error                |
| Browser-only or server-only event matching its declared expectation        | valid single-channel event     |
| Missing required channel after the freshness window                        | missing-delivery warning/error |

- [x] Group by environment, logical event identity, canonical correlation, and bounded occurrence
      window before classifying duplicates.
- [x] Do not use event ID alone as the business identity.
- [x] Treat retry attempts separately from accepted provider deliveries.
- [x] Preserve provider deduplication uncertainty when Meta supplies no definitive readback.
- [x] Unit-test every row of the table.

## Delivery Roadmap

### Phase 0 — Correct Current Truth And Admission

- [ ] Reconcile the accepted Meta provider Decision with executable current state.
- [ ] Publish one capability matrix: implemented, fixture-proven, host-blocked,
      provider-unsupported, and target-only.
- [ ] Keep `docs/00-start-here.md` as the sole workspace documentation router.
- [ ] Record structural gaps as Findings rather than hiding them in plan prose.
- [ ] Create one Skopos child Task per independently verifiable slice.
- [ ] Prohibit live credentials and provider calls in schema/audit correctness tasks.

Acceptance gate:

- Current documentation makes no false claim that Meta local connection or diagnostic acquisition is
  already operational.

### Phase 1 — Dual-Delivery And Observation Correctness

- [x] Add event registry version 2.
- [x] Add tracking observation version 2.
- [x] Replace event-ID-only duplicate detection with channel-aware reconciliation.
- [x] Add correlation, collision, retry, missing-channel, and freshness findings.
- [x] Preserve canonical outcomes and provider attribution as different models.
- [x] Update tracking audit summaries and readiness consequences.
- [x] Add migration and version rejection tests.
- [x] Update generated/public exports without compatibility shims.

Acceptance gate:

- A browser/server pair with one shared event ID passes; duplicate browser or server deliveries
  fail; different IDs for one dual-delivery event fail.

### Phase 2 — Provider-Neutral Adopter Evidence SDK

- [x] Define an adapter contract for browser, server, outbox, and consent observations.
- [x] Provide a Web Runtime adapter without requiring the adopter to use a specific framework, GTM
      container, database, or checkout model.
- [ ] Provide a file/stream/API ingestion path for non-Web-Runtime adopters.
- [x] Validate environment, project, schema version, bounded size, and redaction at ingestion.
- [x] Make ingestion idempotent and replay-safe.
- [x] Record source clock and receive clock to expose skew.
- [x] Add redacted portable fixtures covering common commerce and lead funnels.
- [ ] Use ECOM only as an external consumer proof after the generic contract passes.

Acceptance gate:

- Two unrelated sample adopters can submit the same normalized contract without either product
  becoming an Ops dependency.

### Phase 3 — Canonical Outcome Lifecycle

- [x] Define a versioned canonical outcome adapter for count, value, currency, status, occurred-at
      time, correlation reference, and freshness.
- [x] Require server-confirmed finality rules from the adopter contract.
- [x] Support corrections and reversals without rewriting historical evidence.
- [x] Prevent provider attribution from creating canonical outcomes.
- [x] Add project, source identity, environment, exact-window, and revision checks.
- [x] Add replay-safe local artifact ingestion and load it through the typed measurement read
      action.
- [ ] Add scheduled ingestion after the hosted runtime can authenticate an adopter business source.
- [x] Expose missing, stale, partial, conflicting, empty, and fully reversed outcome evidence.

Acceptance gate:

- Measurement remains blocked when provider conversions exist but canonical outcomes are missing,
  stale, partial, conflicting, non-final, out of scope, or fully reversed.

### Phase 4 — Canonical Meta Connection Lifecycle

Provider Meta owns transport; the host owns credential custody; Growth owns normalized connection
requirements and readiness.

- [x] Implement one canonical connect, status, refresh/rotation, revoke, and disconnect lifecycle.
- [x] Use OAuth or approved system-user credentials through a host-owned secret store.
- [x] Never accept access tokens through ordinary CLI/MCP arguments or committed files.
- [x] Bind credentials to provider, connection, project/scope, environment, identity, and version.
- [ ] Encrypt hosted credentials with authenticated scope metadata.
- [x] Resolve decrypted credentials only through a short-lived worker callback.
- [x] Inspect exact grants and expiration; fail partial access per service rather than calling the
      whole connection healthy.
- [x] Discover and explicitly select business, ad account, Pixel, dataset, Page, and Instagram
      resources where relevant.
- [x] Refuse ambiguous ad-account, Pixel, and dataset selection in Growth readiness.
- [x] Default Growth measurement readiness to an explicit read-scope allowlist and reject
      campaign-management or unknown authority.
- [x] Preserve historical evidence after disconnect while stopping new reads.
- [x] Add rate-limit, retry-after, pagination, timeout, and revocation handling.
- [ ] Add mocked Graph characterization and controlled non-production verification.

Acceptance gate:

- A user can connect, inspect grants/resources, select exact measurement resources, run a bounded
  read, rotate/revoke access, and disconnect without exposing a credential or granting mutation
  authority.

Implemented foundation:

- Growth now owns a strict, token-free normalized status contract for Meta Ads insights and event
  measurement. It evaluates credential and grant expiry deterministically, keeps service failures
  independent, requires one exact ad account plus at least one exact Pixel or dataset, and exposes
  those states in the console without treating connection readiness as delivery evidence.
- Provider Meta now owns bounded, read-only discovery for the verified identity, exact permissions,
  businesses, ad accounts, Pixels, datasets, Pages, and Instagram accounts. Candidate inventory is
  never auto-selected. Graph pagination is page- and business-bounded, pinned to the selected Graph
  origin/version, stripped of credential query parameters, and represented as ready, partial, or
  unavailable without provider response bodies.
- The local host removed its token-returning Meta placeholder and now composes Provider Meta's
  callback-only macOS Keychain resolver for ordinary discovery and Ads-report execution. The lookup
  is bound to the canonical scope, project, connection, opaque credential reference, provider,
  secret kind, and credential version; bytes are bounded, callback-confined, cleared, and excluded
  from results and safe failures. Process-scoped system-user ingress, local Keychain provisioning,
  explicit selection, refresh/rotation, and disconnect are now composed through the ordinary Ops
  lifecycle. Browser OAuth, production hosted resolver composition, the legacy Growth call-site
  migration, and controlled live verification remain required before the Phase 4 acceptance gate can
  close.
- Provider Meta now owns a strict, atomic, token-free connection record bound to scope, project,
  environment, connection, identity, opaque host secret reference, credential version/state, grants,
  and resources. Host-attested refresh, one-version rotation, revocation, and local disconnect
  transitions fail on stale, mismatched, or conflicting evidence. Growth can project this record
  into connection readiness without receiving the secret reference. The local system-user and
  user-facing lifecycle paths are now implemented; browser OAuth, hosted resolver composition, and
  controlled live verification remain open.
- Growth no longer calls a token-returning Meta helper for Ads reports, live apply, or asset upload.
  Read-only report commands cross the host boundary with only exact routing, account, window, and
  bounded pagination/report options. The host requires one matching Growth and canonical
  `ads-insights` account plus a granted `ads_read` scope, then invokes Provider Meta inside the same
  credential callback model used by discovery. Pagination stays on the configured Graph
  origin/version, credential query parameters are removed, provider response bodies are excluded
  from safe errors, and live mutation and asset upload remain explicitly blocked.
- Provider Meta is now a sealed first-party provider-binding pack in the ordinary Ops host. Local
  interactive connect uses a bounded, non-echoed one-time terminal prompt and never a token
  argument; CI and other non-interactive hosts retain named process-environment ingress. The
  provider verifies identity and read scopes, writes bounded bytes to a
  context/environment/version-bound macOS Keychain item through prompt input, and returns only safe
  resource candidates. Explicit ad-account plus Pixel/dataset selectors are validated against
  discovery; no candidate is auto-selected. Refresh reuses the same version, rotation advances by
  one and removes the prior binding after persistence, disconnect removes local custody and intent
  while preserving history, and offline readiness excludes secret references. Shared reads now bound
  timeout, retry count, capped `Retry-After`, pagination, revocation, and redacted failure behavior.
  The static capability matrix records application receipt/outbox ingestion as host-blocked and Test
  Events/Match Quality as live-evidence-required.

### Phase 5 — Meta Evidence Acquisition

- [x] Pull Meta Ads insights for exact windows and normalize attributed conversions and values
      separately from canonical outcomes.
- [x] Discover exact Pixel/dataset resources and record stable provider references.
- [ ] Add only supported read APIs for event statistics and diagnostics.
- [x] Record unavailable API capabilities explicitly; never scrape or infer them.
- [ ] Ingest application CAPI response receipts, bounded messages, trace references, attempts, and
      transport latency.
- [ ] Ingest durable outbox queued/sent/retry/dead state through the generic observation contract.
- [ ] Support controlled Test Events preparation and receipt evidence without making a test event a
      canonical business outcome.
- [ ] Keep raw provider responses in bounded immutable evidence storage with normalized derived
      facts.
- [ ] Record provider API version, window, resource, partial-page state, and freshness.

Acceptance gate:

- The audit can distinguish not emitted, emitted but transport-rejected, accepted by Meta, provider
  status unavailable, and attributed conversion evidence.

### Phase 6 — Match Input And Payload Diagnostics

“Maximum match quality” means maximum legitimate, consented, correctly normalized coverage. Growth
must never recommend invented customer data.

- [ ] Measure per-event availability and validity of email, phone, first name, last name, city,
      region, postcode, country, external ID, `_fbp`, `_fbc`, client IP, and user agent.
- [ ] Distinguish unavailable-at-trigger from implementation-missing.
- [ ] Validate hashing and normalization rules without storing the raw value.
- [ ] Validate that identifiers Meta expects unhashed are not pre-hashed.
- [ ] Validate event source URL, action source, event time, and event ID.
- [ ] Validate content IDs, contents, content type, item count, value, and uppercase currency where
      declared.
- [ ] Require positive finite value for purchase-like outcomes.
- [ ] Detect browser/server field asymmetry that weakens matching.
- [ ] Detect customer location overwritten by approximate IP geo.
- [ ] Recommend field-by-field fallback: reliable customer value first, provider/IP geo only for
      missing fields.
- [ ] Show field coverage percentages only when denominators and capture windows are complete.
- [ ] Label Meta's proprietary Event Match Quality score as provider evidence and show it only when
      actually available.

Acceptance gate:

- Every recommendation names the event, missing/invalid field, evidence window, affected channel,
  confidence, and safe repair; no recommendation asks for fabricated PII.

### Phase 7 — Shared Typed Actions And Product Surfaces

- [ ] Keep `growth.measurement.audit` as the trust-decision owner.
- [ ] Add typed read actions for connection status, resource inventory, evidence pull, observation
      ingestion status, and exact event drill-down as justified.
- [ ] Give every action a strict schema, maximum effect, bounded output, provenance, freshness, and
      safe failure shape.
- [ ] Keep audit rendering offline; provider refresh is an explicit read-network action.
- [ ] Lower the same results to human CLI, JSON, console, API, MCP, automation, and agent workflows.
- [ ] Do not duplicate provider calls or trust decisions in adapters.
- [ ] Keep MCP read-only by default and bounded to the configured project/environment.
- [ ] Keep connection creation, OAuth consent, and secret transmission outside chat arguments.

Acceptance gate:

- Contract-profile tests prove that every surface reports the same status, evidence, limitation, and
  next safe action for the same revision.

### Phase 8 — Console Experience

- [ ] Present one page-level conclusion: ready, needs attention, or blocked.
- [ ] Show canonical outcomes before provider attribution.
- [ ] Add a per-event matrix for expected, browser, server, valid pair, provider receipt,
      diagnostics, and freshness.
- [ ] Add drill-down for event-ID mismatches, duplicates, missing channels, rejection reasons,
      retries, and dead letters.
- [ ] Add customer-field coverage without rendering raw or hashed customer values.
- [ ] Add value/currency/catalog validation and canonical revenue comparison.
- [ ] Add connection service states for Ads reporting and measurement resources independently.
- [ ] Explain dashboard-only limitations in plain language and allow structured evidence
      attachment/import.
- [ ] Provide one contextual repair action, never an unbounded “fix all”.
- [ ] Preserve keyboard, screen-reader, responsive, zoom, and chart-table alternatives.

Acceptance gate:

- A first-time operator can identify the affected event, channel, evidence, business impact, and
  next safe repair without opening Technical details.

### Phase 9 — Rollout And Operations

- [ ] Start with offline fixtures and observation imports.
- [ ] Run shadow reconciliation against existing version 1 audits.
- [ ] Pilot read-only Meta connection in one non-production project.
- [ ] Pilot one production project with explicit resource selection and no mutations.
- [ ] Compare pre-change and post-change evidence over equal complete windows.
- [ ] Define freshness expectations for observations, canonical outcomes, Ads reports, and provider
      diagnostics independently.
- [ ] Add bounded scheduled reads only after durable lease, retry, and dead-letter proof.
- [ ] Add alerts for missing canonical outcomes, event loss, dedupe regression, malformed
      value/currency, expired access, stale evidence, and rejection spikes.
- [ ] Keep scaling guidance gated until warm-up and complete-window proof passes.
- [ ] Publish no provider mutation or automatic tracking repair as part of this roadmap.

Acceptance gate:

- A controlled production pilot produces current canonical, delivery, provider, and attribution
  evidence with no secret exposure, cross-project access, or measurement mutation.

## Per-Event Audit Checklist

For every adopter-declared event:

- [ ] Business trigger is explicit and observable.
- [ ] Expected delivery channels are explicit.
- [ ] Exactly-once scope and reset boundary are explicit.
- [ ] Event-ID derivation is stable and collision-resistant.
- [ ] Browser/server event IDs match when dual delivery is declared.
- [ ] Canonical correlation is present where applicable.
- [ ] Consent requirement and suppression outcome are recorded.
- [ ] Event source URL and action source are valid where required.
- [ ] Client IP and user agent are present only through approved server handling.
- [ ] `_fbp` and `_fbc` are validated and never invented.
- [ ] Legitimate customer fields are normalized and hashed according to provider rules.
- [ ] Customer-entered location wins field by field; approximate geo fills gaps only.
- [ ] Commerce contents and IDs match the selected catalog identity.
- [ ] Item count equals summed quantities.
- [ ] Value is finite and follows the declared business rule.
- [ ] Currency is valid and uppercase.
- [ ] Provider acceptance, rejection, retry, and unknown states remain distinguishable.
- [ ] Provider attribution is reconciled but not promoted to canonical truth.

## Security And Privacy Checklist

- [ ] No access token, refresh token, app secret, cookie, raw PII, or full provider body appears in
      config, logs, receipts, observations, MCP output, or console state.
- [ ] Secret storage is outside project artifacts; controlled file stores remain test/CI-only and
      explicit.
- [ ] Connection identity, scopes, resource selections, expiration, rotation, and revocation are
      auditable without revealing credentials.
- [ ] Hosted credentials are envelope-encrypted and project/scope bound.
- [ ] Worker identity and database grants are least privilege.
- [ ] Cross-project and cross-environment access fail with the same absence shape.
- [ ] Provider error text is bounded and redacted before persistence.
- [ ] Observation retention is declared by evidence class.
- [ ] Raw PII is processed only inside the adopter/provider boundary with a valid consent and legal
      basis.
- [ ] Disconnect stops future acquisition without rewriting historical evidence.

## Testing And Evidence Checklist

### Unit and schema

- [ ] Event registry and observation version parsing.
- [ ] Every deduplication classification.
- [ ] Field-presence and normalization-state rules.
- [ ] Positive-value, currency, content, source URL, and time validation.
- [ ] Redaction and bounded-output rejection.
- [ ] Freshness and complete-window calculations.

### Contract and integration

- [ ] Provider Meta Graph pagination, partial results, rate limits, expired access, and redacted
      failures with mocked responses.
- [ ] Connection lifecycle with fake secret custody and resource ambiguity.
- [ ] Adopter observation and canonical outcome adapters.
- [ ] Durable ingestion idempotency, leases, retries, and dead letters.
- [ ] One shared typed result across CLI, JSON, console, MCP, and API.
- [ ] Version 1 migration followed by version 1 runtime rejection.

### Consumer and provider characterization

- [ ] Two unrelated synthetic adopter fixtures.
- [ ] Optional redacted ECOM consumer proof without repository dependency.
- [ ] Controlled non-production Meta account/resource proof when explicit authority is available.
- [ ] Meta Test Events evidence for browser/server pairing where the provider supports it.
- [ ] Production pilot evidence only after privacy, credential, and rollback review.

### Quality gates

- [ ] Typecheck, lint, focused tests, package builds, export-map checks, and architecture guards
      pass.
- [ ] No secret-pattern, PII, cross-repository import, or retired-owner residue appears.
- [ ] Documentation capability claims match executable evidence.
- [ ] Skopos Readiness and acceptance Evidence agree before each Task closes.

## Migration And Compatibility

The repository is pre-stable and follows clean-refactor policy.

- [ ] Add an explicit one-shot version 1 to version 2 artifact migration.
- [ ] Preserve historical observation timestamps and provenance.
- [ ] Never reinterpret a version 1 duplicate as a proven provider deduplication result.
- [ ] Reject unmigrated version 1 artifacts after the cutover.
- [ ] Remove old schemas, exports, tests, and documentation in the same slice.
- [ ] Do not add permanent dual-read compatibility paths.
- [ ] Invalidate derived caches and readiness evidence after migration.

## Provider And Dashboard Limitations

Unisane Ops should handle most routine measurement work, but it must not promise API access Meta
does not provide.

- [ ] Maintain a tested capability matrix for each supported Graph API version.
- [ ] Mark proprietary Event Match Quality or UI-only diagnostics unavailable unless a supported
      provider response supplies them.
- [ ] Accept structured, timestamped, source-labelled manual/browser evidence for unavailable
      diagnostics.
- [ ] Never scrape authenticated dashboards as a background product dependency.
- [ ] Never convert screenshots or operator notes into numeric truth without explicit structured
      values and provenance.
- [ ] Keep a direct Events Manager review as a documented escalation for evidence that cannot be
      acquired safely.

## External Adopter Checklist

This is a portable adopter checklist. ECOM may use it, but it is not ECOM-specific Ops behavior.

- [ ] Declare events, channels, IDs, consent, required fields, and canonical outcomes.
- [ ] Install the generic observation adapter at browser, server, and durable outbox boundaries.
- [ ] Export only normalized field states and bounded provider receipts.
- [ ] Connect canonical outcomes through an authenticated adapter.
- [ ] Select exact project, environment, ad account, Pixel, and dataset resources.
- [ ] Capture a pre-change baseline.
- [ ] Run controlled browser/server test events.
- [ ] Capture a post-change complete window.
- [ ] Reconcile provider attribution with canonical outcomes.
- [ ] Review recommendations before code, GTM, provider, or spend changes.

For a commerce adopter, a profile may declare PageView, ViewContent, AddToCart, InitiateCheckout,
AddPaymentInfo, and Purchase. That profile is an adopter choice, not a global allowlist for every
Unisane Ops project.

## Work Package Sequence

Each row becomes an independently owned Skopos Task before implementation.

| Order | Work package                                             | Primary owners                 | Depends on               |
| ----- | -------------------------------------------------------- | ------------------------------ | ------------------------ |
| 1     | Event registry v2 and deduplication correctness          | Growth tracking                | none                     |
| 2     | Observation v2, redaction, migration, and ingestion port | Growth + Ops Engine            | 1                        |
| 3     | Generic adopter observation adapters                     | Web Runtime + Growth contracts | 2                        |
| 4     | Canonical outcome adapter lifecycle                      | Growth + adopter port          | 2                        |
| 5     | Meta connection and resource lifecycle                   | Provider Meta + host custody   | none; integrates after 2 |
| 6     | Meta Ads, Pixel/dataset, and supported diagnostic reads  | Provider Meta                  | 5                        |
| 7     | CAPI receipt and outbox evidence ingestion               | Growth adapters                | 2, 3                     |
| 8     | Match-input and payload diagnostics                      | Growth                         | 1, 2, 7                  |
| 9     | Shared action/MCP/API/CLI lowering                       | Growth actions + adapters      | 4, 6, 8                  |
| 10    | Tracking health console                                  | Growth console + Console app   | 9                        |
| 11    | Scheduling, alerts, and production pilot                 | Hosted runtime + Growth        | 5–10                     |

Parallel work is allowed only when owned paths and contracts do not overlap. Provider transport must
not begin by copying provider-specific schemas into Growth.

## Definition Of Done

The roadmap is complete only when all of the following are proven:

- [ ] Dual-delivery events and retry attempts are classified correctly.
- [ ] Two unrelated adopters integrate without source or schema coupling.
- [ ] Canonical outcomes remain authoritative and separate from Meta attribution.
- [ ] Meta connection, grants, resources, rotation, revocation, and disconnect are canonical and
      secret-safe.
- [ ] Supported provider receipt and diagnostic evidence is acquired and normalized.
- [ ] Unsupported provider evidence is clearly limited rather than invented.
- [ ] Per-event browser/server/deduplication and field-coverage diagnostics are usable.
- [ ] All surfaces consume one typed, revision-bound audit result.
- [ ] The console explains one decision and one safe repair in plain language.
- [ ] Scheduled reads are durable, idempotent, bounded, and least privilege.
- [ ] Migration, retention, privacy, security, accessibility, and rollback evidence passes.
- [ ] A controlled production pilot reconciles complete-window canonical, delivery, provider, and
      attribution evidence.
- [ ] No automatic provider mutation, GTM publication, code repair, or spend change was introduced
      without its own explicit plan, approval, and verification lifecycle.

## First Implementation Milestone

Start with work package 1 only:

- [x] Design event registry version 2.
- [x] Model browser-and-server delivery explicitly.
- [x] Correct duplicate versus valid-pair classification.
- [x] Add exhaustive unit and migration tests.
- [x] Update the tracking audit result without changing provider, console, MCP, or adopter behavior.

This removes a known false-positive foundation before connection work adds more evidence to the
system.

## Second Implementation Milestone

Continue with the privacy-safe portion of work package 2 before any provider or adopter connection:

- [x] Replace unrestricted observation payloads with typed field-state evidence.
- [x] Require SHA-256 digests for logical event, provider event, canonical correlation, and
      transaction identity evidence; retain original identifiers only in the adopter/provider
      boundary that needs them.
- [x] Require occurrence, receive, capture, provenance, consent, and bounded diagnostic evidence.
- [x] Digest legacy event, logical, transaction, and correlation references during one-shot
      migration.
- [x] Reject raw PII, transport values, credentials, provider bodies, and unbounded extensions.
- [x] Delay missing-channel findings until the delivery freshness window closes.
- [x] Separate repeated observations by canonical correlation and bounded occurrence window.
- [x] Expose evidence freshness and source/receive clock skew without provider calls.

This milestone keeps Unisane Ops responsible for redacted measurement evidence while ECOM and other
adopters remain responsible for customer data, checkout behavior, order creation, and transport.
