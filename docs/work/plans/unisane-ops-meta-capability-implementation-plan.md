---
id: 'PLAN-20260906-meta-implementation'
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

# Meta Capability Implementation Plan

## Purpose and authority

Implement the [Meta-first capability checklist](unisane-ops-growth-capability-checklist.md)
through documented, bounded batches. The destination is agent-controlled marketing from
connection through diagnosis, reviewed changes and verified results, including Events Manager
issues. The [architecture baseline](../../standards/13-unisane-ops-product-architecture-baseline.md)
owns package boundaries; the [measurement roadmap](unisane-ops-growth-meta-measurement-roadmap.md)
owns detailed event/outcome contracts. This Plan adds delivery detail, not a second architecture.

Written on 2026-09-06 before the capability-inventory implementation in Task `T-5707aaab`.
The earlier fallback repair in `T-f43d0f35` was implemented before this batch plan existed;
this document does not retroactively claim otherwise. Existing uncommitted work is preserved.

## Batch M0.1 — truthful provider capability inventory

### Problem and usable result

The existing Meta measurement matrix puts implementation, fixture proof, missing host wiring
and live-evidence needs into one `state` field. Its aggregate mutation boolean cannot explain
the different stages of campaign pause, reporting, event diagnostics or catalogs.

Deliver an offline, versioned provider capability inventory through the existing
`meta.connection.capabilities` host operation. A caller can distinguish implemented code,
missing implementation and fixture proof, see the next prerequisite, and identify the relevant
host operation without mistaking this static inventory for account readiness or authorization.
This is the provider-contract slice of M0, not completion of account-aware CLI/console/MCP
discovery or of the complete Meta roadmap.

### Ownership and dependency map

| Owner | Responsibility in this batch |
| --- | --- |
| Provider Meta | Strict inventory schema, capability descriptions, provider implementation and fixture references |
| Ops local host | Existing offline operation returns the inventory; no account or credential lookup |
| Growth | No new domain rules; later consumes normalized provider facts through injected bindings |
| Ops engine | Existing safety/action contracts unchanged; inventory cannot authorize execution |
| CLI/console/MCP | No new independent capability list or readiness logic; projection follows in M0.2 |

Do not add dependencies. Provider metadata must not import host, UI, Framework or adopter code.
Host operation references are descriptive identifiers, not executable handlers or permission grants.

### Planned file structure

```text
packages/provider-meta/src/meta/
  capabilities.ts                 # public facade and inventory assembly
  capabilities/
    schema.ts                     # strict runtime schemas and inferred types
    catalog.ts                    # single provider-owned capability definition list
  capabilities.test.ts             # integrity, contradiction and isolation tests
packages/unisane-ops/src/runtime-adapters/
  growth.ts                       # existing offline dispatch consumes new facade
  growth.test.ts                  # host parity, no credential/network execution
packages/provider-meta/README.md  # contract meaning and limitations
docs/work/plans/
  unisane-ops-growth-capability-checklist.md
  unisane-ops-meta-capability-implementation-plan.md
```

### Contract and invariants

Use schema version 2. Replace the pre-stable measurement-only exports and mixed `state` field;
update all repository callers together. No persisted record migration is needed: the inventory
is generated on demand, not a connection, approval, outcome or receipt record.

Each entry has a stable ID, family, title, read/write effect, implementation status
(`implemented`, `partial`, `not-implemented`), implementation references, verification status
(`fixture-proven`, `not-verified`) and fixture references, host-operation references,
requirements and a plain-language next step. This batch makes no live-verification claim and
does not infer API availability from source code. Unverified provider access remains an
explicit requirement, especially for Events Manager diagnostics and match quality.

The inventory identifies its basis as `source-inventory` and account readiness as `not-evaluated`.
It has no `available` flag or aggregate mutation permission. Host wiring, interface exposure,
provider API access and account readiness must be evaluated by their actual owners in later
work, not copied into provider-owned static truth. Requirements describe what must be supplied;
they are not declarations that a host has supplied it.

Reject duplicate IDs, unknown fields, empty inventories, implementation claims without source
references, fixture claims without test references, and fixture proof for missing code. Return
fresh values per call so a caller cannot mutate the shared catalog for subsequent requests.

Include connection custody/lifecycle/discovery/selection, Ads reporting, exact campaign
pause/verification, partial creation/assets, event observation integration, test events,
match-quality/issues acquisition, account settings, campaign editing, audiences and catalogs.
Label provider gaps as gaps; do not invent working handlers or scores.

### Sequence and validation

1. Record this plan, task scope and acceptance criteria; link from the docs router/checklist.
2. Implement schema and provider catalog, then replace the facade and update the existing host.
3. Add provider schema/integrity tests and host no-network/no-credential parity tests.
4. Run provider typecheck, full provider tests, lint and build; then focused host tests and
   host typecheck. Check formatting, local links and whitespace. Inspect failures before widening.
5. Record exact results and remaining gaps in this Plan and Skopos; close only the bounded task.

### Acceptance checklist

- [x] Plan and owner/file/contract boundaries recorded before code edits.
- [x] Inventory separates implementation from fixture proof and account readiness.
- [x] Every catalog implementation/test reference resolves and IDs are unique.
- [x] Contradictory or unknown-field input is rejected; repeated calls are isolated.
- [x] Existing host returns the same inventory without network, credentials or account configuration.
- [x] Provider checks and focused host validation pass; documentation is updated.

## Following batches — document exact scope before implementation

### M0.2 implementation specification (2026-09-06, before code)

Deliver `growth.capabilities.review`, an offline typed Growth read action, for the currently
bound Meta account. `growth capabilities review`, `review_growth_capabilities` in local MCP,
and the console Connections view consume its strict result. The host supplies normalized
provider facts and actual execution bindings; Growth evaluates canonical connection evidence
using its existing Meta assessment. No provider API request or credential lookup occurs.

The host loads the exact project and environment, validates the selected connection's identity,
projects safe connection metadata and compares configured resource selections against that
metadata. Missing records, expired/revoked grants, ambiguous resources, stale/future verification
times and resource mismatch must not produce an executable status. A healthy stored connection
means prerequisites are satisfied for a bounded read, not that credentials were retrieved or a
live request succeeded. Execution must still revalidate. Writes remain blocked by the host.

Ownership and planned files:

- `packages/growth/src/capabilities/contracts.ts`: normalized host facts and result schemas/types.
- `packages/growth/src/actions/capability-review.ts` and test: sole evaluation and presentation;
  public action/contract exports use existing entrypoints. No provider implementation import.
- `packages/unisane-ops/src/runtime-adapters/meta-capabilities.ts`: provider-to-Growth projection,
  exact connection loading and dispatch support facts, with a narrow integration in `growth.ts`.
  Existing Meta write-blocking declarations are shared with dispatch rather than copied as UI policy.
- `packages/growth/src/cli/commands/capabilities/`: thin registration/formatting over the host action;
  existing runtime binding and sealed pack manifest admit the exact offline command.
- `packages/ops-mcp/src/`: project-bound read tool and optional host callback (hosts lacking the
  callback return explicit unavailability). Local host binds the callback and config tool list.
- `packages/growth/src/console/`: optional host review callback, output validation/target check
  and shared result in console state. Offline fixture callers without a callback do not claim readiness.
- `apps/console/src/`: callback plumbing through initial/temporal state and a small Connections
  capability-list component; it renders shared statuses, reasons and next steps without recomputation.

No new package dependencies or persistent schemas. Provider inventory v2 stays provider-owned;
the smaller Growth projection intentionally excludes source paths and unused internal metadata.
Availability is specific to each operation and presentation surface: discovery-tool availability
does not imply that report collection or campaign execution is available through every interface.
The result preserves implementation, fixture verification, host support, recorded-account status,
execution surfaces and reasons independently. Unmapped capabilities remain unavailable.

Validation: action tests for missing/healthy/stale/expired/ambiguous/mismatched evidence and
host blocks; host tests with no network/credential access; CLI registration/output tests; MCP
bound-target and unknown-host tests; console target/parity and rendered-output tests. Run
affected typechecks, focused lint/tests and ordered package builds; update the exact pack hash
through its canonical hashing contract. Record outcomes before closure. Live-account testing
and new provider writes remain outside M0.2.

| Batch | Deliverable and prerequisite |
| --- | --- |
| M0.2 | Shared typed capability-discovery action combining provider facts, actual host bindings, interface exposure and project/account readiness; CLI/MCP/console project the same result |
| M1 | Guided real-account connection/resource selection and trustworthy report collection; provider access and live evidence recorded separately |
| M2 | Events Manager-style event/issues evidence, adopter ingestion, GTM dependencies, repair proposals and verification under the measurement roadmap |
| M3 | Exact campaign control and supported settings edits with host-contained credentials, canonical approval, durable execution and recovery |
| M4 | Campaign creation/editing, assets, audiences and partial-operation reconciliation |
| M5 | Portable catalog projection, Meta sync/diagnostics and catalog-backed advertising |
| M6 | Scheduled evidence, approved bounded rules, alerts and full agent/console acceptance |

Before each batch, specify exact action/schema ownership, files, prerequisites, migrations,
failure modes and tests. Add a Decision only when changing a durable architecture contract.
Keep real provider mutations under exact reviewed authorization and retain the separate hosted
SaaS gate. Full Meta completion requires real-account evidence; offline fixtures are insufficient.

## Validation record

M0.1 implementation recorded on 2026-09-06 under Task `T-5707aaab`:

- 18 provider capability entries; strict version 2 schema and inferred types, with separate
  source/test references, missing features, requirements and next steps.
- `pnpm --filter @unisane/provider-meta validate`: typecheck and all 80 tests passed,
  including 13 inventory schema/integrity/isolation tests.
- Provider lint and build passed, including declaration emission.
- Focused host integration: all 7 `runtime-adapters/growth.test.ts` tests passed;
  inventory parity is tested with a nonexistent project path and unused network/credential spies.
- Host typecheck and lint of the touched host files passed; code formatting, local Plan links
  and `git diff --check` passed.
- The old measurement matrix exports have no remaining TypeScript source callers.

M0.1 performed no live account operations or complete repository release validation. Account-aware
projection is supplied by the subsequent M0.2 implementation below; the provider inventory alone
never enables execution.

### M0.2 implementation and validation (2026-09-06)

Task `T-57103658` implements the specification above. The shared offline action is exposed as:

- CLI: `unisane-ops growth capabilities review --environment production --json` (substitute the
  configured environment; omit `--json` for the readable summary).
- MCP: `review_growth_capabilities` with exact `projectId` and `environmentId`. Existing Codex
  bindings need regeneration to include the new tool; enabled tool names use the canonical MCP list.
- Console: Connections, including Meta connection detail, receives the same typed result through
  the host callback. Hosts without that callback show explicit unavailability.

Statuses preserve source implementation, fixture verification, host support, account assessment,
execution interfaces, blockers and next steps separately. `ready-to-read` only means fresh recorded
prerequisites for an exposed read path. `liveVerified` is always false for this offline action.
Discovery never resolves a credential or calls Meta; actual execution still validates access.
Campaign mutations retain the existing host blockers. Unmapped capabilities remain unavailable.

Validation completed:

- All 286 Growth tests passed (71 files), including action failure cases, CLI output/target checks
  and console state target/parity checks.
- All 37 MCP tests passed, including missing callback and cross-project rejection.
- All 8 focused host integration tests passed, including unused network/credential spies and
  default host callback composition.
- Growth, MCP and host typechecks/builds passed; console server build and declarations passed.
- Focused source lint and formatting were checked; no live provider operation was performed.

**Earlier blocker (resolved below):** console browser compilation, full console typecheck and the new rendered
component tests cannot complete because the pinned `@unisane/ui` / `@unisane/data-table`
`0.1.2-next.97f61b1d` dependencies are not installed. Offline restoration lacked their tarballs;
`pnpm install --frozen-lockfile` with registry access returned HTTP 404 for the pinned data-table
tarball. Dependency versions were not changed. Restore access to those exact published artifacts
(or separately select and validate an available compatible version), then rerun console typecheck,
tests, browser build and visual verification before marking M0.2 complete. At that point the task remained open pending console verification.

### M0.2 console dependency remediation specification (2026-09-06, before edits)

Registry inspection confirms the pinned `0.1.2-next.97f61b1d` prerelease is not publicly listed.
The published UI and data-table `0.1.1` pair exposes the console's primary component entrypoints,
including canonical layouts, date-range picker and page section; data-table peers on UI `0.1.1`.
Test this exact pair by updating only `apps/console/package.json` and the canonical pnpm lockfile.
Retain the change only if console typecheck, tests and production browser/server builds prove
compatibility. Fix small source compatibility gaps explicitly if needed; do not replace shared
components with local copies. Then visually inspect the Meta capability panel using local fixture
evidence. No real Meta calls or credential access are part of this verification.


### M0.2 completed verification (2026-09-06)

The console now pins the published, matching `@unisane/ui` and `@unisane/data-table` `0.1.1`
pair. Frozen-lockfile offline installation succeeds. No sibling source or local component fork is
required. Browser inspection found the closed supporting pane covering the main view with this
release; the existing closed-pane CSS now removes that hidden pane from layout and interaction.
Existing test fixtures now use event registry v2 and complete canonical-outcome metadata.
Console lint issues were corrected without changing temporal query behavior.

- Console typecheck and zero-warning lint pass.
- All 28 console tests pass, including capability rendering and boot/state integration.
- Both production server/declaration and browser/CSS builds pass.
- Local synthetic Connections fixture inspected at 1280×720 and 390×844: capability names,
  blockers, next steps and offline/live-verification distinction are visible. Narrow document
  width equals viewport width (390px); the closed pane is hidden and no horizontal overflow occurs.
- Earlier Growth (286), MCP (37) and host (8) test results remain the core verification evidence.
  No real account, credential or provider request was used for browser verification.

M0.2 is complete as an offline capability discovery workflow. M1 remains next: guided account
and resource selection followed by trustworthy report collection. Events Manager diagnostics,
account settings mutations and catalog operations remain separate unfinished capabilities.

### M1.1 guided resource selection specification (2026-09-06, before code)

Extend the existing provider-owned `connectMeta` lifecycle rather than introducing a second
connection store or credential path. After bounded discovery, an interactive non-JSON terminal
shows discovered account/event-source names with exact IDs and the project/environment being
configured. Ask for an ad account when Ads Insights is requested and an event source (Pixel or
dataset) when event measurement is requested. Even one candidate requires explicit selection.
Explicit flags and previous selected resources take precedence; refresh never silently switches
an inaccessible old resource. Other optional resource flags retain their current semantics.

File ownership and structure:

- `packages/provider-meta/src/meta/connection-resource-selection.ts`: extract current selection
  projection, reuse Growth resource types, and add an injected typed choice interface and guided
  selection orchestration. Validate chosen type/ID against the offered service candidates.
- `packages/provider-meta/src/meta/terminal-resource-prompt.ts`: terminal-only presentation/input,
  name plus ID labels, cancellation/EOF handling, bounded numeric selection and terminal-control
  character sanitization. No credentials are passed to or returned by this interface.
- `connect.ts`: inject the selector, call it after discovery and before any custody/record write;
  keep the existing provider-to-host result and local configuration update contract.
- Tests for explicit/previous selection precedence, requested services, empty/partial discovery,
  invalid choice, cancellation, non-TTY/JSON behavior and zero persistence on failed selection.
  Document the command and limits in the provider README and checklist.

No live provider writes, permission expansion, OAuth, new persistent schemas, or report collector
are added here. Non-interactive agents continue to receive candidate resources and pass explicit
resource flags. CLI guidance does not imply console/MCP setup controls or tracking verification.
Run provider tests, typecheck, lint/build and host connection regression checks; real-account
acceptance is a separate verification step. Cancellation leaves existing records/credentials intact.

### M1.1 implementation and verification (2026-09-06)

Task `T-4b178937` implements the specification above. The normal interactive command
`unisane-ops connect meta --environment <id> --yes` now prompts for discovered account and
event-source selections before saving credentials or records. The resource prompt receives no
credential material. Explicit flags and previous account/event selections bypass prompting;
JSON and non-TTY execution remain deterministic. Unknown service choices and conflicting old
selections fail closed; partial discovery is disclosed. Enter, Ctrl-C and EOF cancel selection.

The prior projection was extracted from `connect.ts` into `connection-resource-selection.ts`.
Provider capability references and README now identify the new implementation and tests.
Existing record shapes and host configuration projection are unchanged.

Verification:

- Provider typecheck, zero-warning lint and declaration/build emission pass.
- All 103 provider tests pass, including 23 added tests covering selection, terminal behavior and
  persistence cancellation. Cancellation on refresh preserves the old record and credential.
- All 8 host Growth adapter tests pass; host typecheck/build pass.
- All 11 focused onboarding and Codex binding integration tests pass. Regression checking repaired
  one leftover tool-list reference from M0.2 and updated its expected tool list. Onboarding fixtures
  now live inside this repository, explicitly declare ESM, link the local host package under test
  and clean up after themselves instead of relying on checkout-parent dependency resolution.
- A real PTY with two synthetic accounts displayed names/IDs and returned only `act_fixture_2`
  after choosing option 2; no Meta account or credential was used.

This proves local workflow behavior, not live permissions, resource relationships or event delivery.
M1.2 remains next: a shared typed, evidence-preserving report-collection workflow across interfaces,
followed by separately recorded real-account setup and reporting verification. Guided console/MCP
resource selection, OAuth and broader resource/settings operations remain open work.

### M1.2a shared report read specification (2026-09-06, before code)

Deliver `growth.reports.read` as a bounded read-network action, `growth reports read` CLI,
`read_growth_report` MCP tool and a Meta Advertising console report form. Reuse the host-contained
Meta report transport and credential callback; never pass credentials through interfaces or Growth.
The host resolves the exact configured account and checks project/environment/connection identity.
Growth validates a typed provider snapshot and produces one result with evidence and limitations.

Start with account, campaign, ad-set and ad performance reports. Exclude creative/device inventory
and broader breakdowns from this smaller contract. Return delivery metrics (impressions, clicks,
spend/currency) and provider actions keyed by their actual action type. Do not use the legacy
normalizer's sum of overlapping Meta actions as a canonical conversion total. Explicit dates,
bounded page count/page size and returned-row limit are required/defaulted in the shared schema.
Preserve capture time, account ID/name when supplied, requested window, provider page-limit
partiality, returned-row truncation and unavailable/requested timezone and attribution semantics.
No performance, recommendation, or tracking-verification claim follows from a successful read.

Ownership: Growth `reports/contracts.ts` and `actions/report-read.ts`; Provider Meta
`meta/marketing/report-snapshot.ts` translates its existing collector into that contract; host
`runtime-adapters/meta-report-read.ts` composes connection/configuration and callback; CLI
`commands/reports/`; MCP contracts/server and local binding; console loopback HTTP handler and
small Meta report form/result component. Shared schemas/type-derived inputs stay the source of
truth. The console accepts only same-origin bounded JSON requests on loopback, invokes its bound
host callback and checks output target; provider errors become safe messages.

This batch returns a current snapshot and does not write the legacy environment-shared cache.
The result explicitly states that it is not persisted. M1.2b will add environment-isolated durable
report evidence, history/retrieval and console aggregation using existing host/store foundations.
No new live API feature, conversion-total inference, mutation authority or real account call is
introduced during implementation verification. Test malformed/mismatched provider payloads,
partial pages, zero metrics, action-type separation, wrong targets, absent callbacks and interface
parity. Run package tests/types/builds and synthetic browser verification before closure.

### M1.2a implementation record (2026-09-06)

The shared report action now runs through CLI, MCP and the loopback Meta Advertising form.
Provider normalization rejects foreign-account rows, malformed metrics, missing entity IDs and
ambiguous repeated action types. Zero values are retained. Host errors omit credential and raw
provider response details. Reads do not write the legacy report cache or grant mutation authority.

The canonical report input uses the installed Zod 4 entry point with generated JSON Schema for
MCP discovery. Existing Zod 3 engine/host envelopes delegate validation to that same input;
MCP imports generated JSON Schema across its newer Zod boundary and revalidates the domain input.
The Growth dependency minimum now explicitly includes that entry point. No field rules are
maintained independently in the interfaces.

Example: `unisane growth reports read --environment production --start-date 2026-09-01
--end-date 2026-09-05 --report-type campaign --row-limit 25 --json` (one shell line).
MCP takes `{ projectId, environmentId, report: { startDate, endDate, reportType } }`.
The console presents the same current snapshot separately from saved reporting aggregates.

Real-account acceptance remains open. This batch does not establish dashboard parity, Events
Manager diagnostics, actual account timezone/attribution verification, or persisted history.
The next batch is M1.2b: environment-isolated evidence persistence and retrieval, then live
verification with explicitly recorded account, permissions, API version and provider acceptance.

Validation: 294 Growth, 111 Provider Meta, 39 MCP, 37 console, 9 host-adapter and 4 Codex
binding integration tests pass (494 total). All five affected package type checks, lint checks
and builds pass. The emitted CLI exposes the new report command. Synthetic browser testing
submitted the actual loopback form and inspected separate purchase/omni-purchase values,
zero metrics and partial evidence at 1280×720 and 390×844; mobile document width remained 390.
The final saved-history wording was checked in the browser. No real account or credential was used.

## Remaining program — batch execution authorized 2026-09-06

Continue the remaining Meta-first checklist as complete workflows, preserving the broader Google,
GTM and TikTok expansion. Order: M1.2b durable report evidence/history; M2 event and diagnostic
investigation with explicit imports where APIs are unavailable; M3 reviewed mutations and recovery;
M4 creation/assets/audiences; M5 catalogs; M6 scheduling/rules. API-specific additions require
current provider documentation and recorded account verification. Do not mark a batch live-proven
from fixtures, or manufacture a provider capability to complete a checkbox.

### M1.2b contract and implementation specification (before code)

Add explicit `growth.reports.collect` (provider read plus local evidence write) and
`growth.reports.history` (offline retrieval) beside the non-persisting snapshot read. Collection
stores exactly the bounded returned snapshot, including observed/returned-row counts and
partiality; it never claims omitted rows were persisted. A content-derived evidence ID and
revision make identical retries idempotent. Stored records contain schema version, saved time,
original report and provenance; retrieval revalidates schema, checksum and exact binding.

Growth owns record/query/result schemas, collection/history services and safe presentation.
The local host owns filesystem persistence under project/environment/connection/account hashed
namespaces. Publish complete records atomically, ignore unfinished temporary files, enforce byte
and scan limits, and surface corrupt records rather than returning a silently healthy empty list.
No legacy environment-shared cache is imported automatically. No customer fields or credentials
are introduced. Selected-connection history does not imply live connection health.

CLI adds reports collect/history; MCP adds collect_growth_report/read_growth_report_history;
console adds explicit save and history controls. Both interfaces call host operations with shared
schemas. Collection has no provider mutation and needs no campaign approval, but its local write
must be disclosed. History returns bounded summaries and optionally one requested record, with
capture/save times, partiality and truncation. No sums across repeated snapshots or mixed windows.
Verify restarts, repeated writes, wrong environments/accounts, corrupt content, bounded history,
missing callbacks and shared-interface schemas. Expand saved aggregation only after defining
compatible windows, currencies and attribution semantics.

### M1.2b implementation record

Implemented explicit `growth reports collect` and `growth reports history` commands, their
project-bound MCP counterparts (`collect_growth_report`, `read_growth_report_history`), and
Save/Refresh/Open controls in Meta Advertising. The history action is offline; collection reads
Meta and writes only local evidence. Snapshots retain their original non-persisting read result
inside an evidence envelope carrying a content-derived reference and save time. Interfaces
explain the saved envelope without changing the captured provider evidence.

Local storage publishes an immutable complete file using an atomic hard link from a flushed
private temporary file. Identical concurrent writes converge on the existing reference. Hashed
binding namespaces isolate projects, environments, connections and accounts; lookup validates
report checksums, filenames and bindings. Interrupted temporary files are ignored; symlink
storage paths, corrupt evidence and scan/byte-limit failures are explicit. Limits: 4 MiB per
record, 1,000 directory entries, 16 MiB per history scan and 50 returned summaries maximum.
These are protective bounds, not an unbounded historical warehouse or automatic retention policy.

The console keeps saved snapshots separate from existing performance summaries. Aggregation
across compatible windows, currencies and attribution settings remains open, as do all later
Meta batches and real-account proof. No unrelated provider capability is marked complete.

Research for M2: the official Dataset Quality API documentation could not be fetched during
this run. Meta's [Signals Opportunity Dashboard specification](https://github.com/facebookincubator/catalogue-of-api-solutions/blob/main/solutions/signals/signals-opportunity-dashboard.md)
documents Pixel metadata, linked accounts, event-source stats and their limited retention.
This supports a bounded observation workflow; it does not establish full Events Manager issue
or proprietary score availability. Validate actual response contracts and permissions before
adding live diagnostics, and retain labelled imports for unsupported fields.

M1.2b verification: 298 Growth tests, 41 MCP tests, 38 console tests, 13 host/store tests
and 4 Codex binding integration tests pass (394 total). All four affected packages pass type
checks, lint and builds. Emitted CLI help exposes collect/history. Synthetic browser verification
completed Save → Refresh → Open, reloaded the page and reopened the saved reference, and checked
1280×720 and 390×844 layouts (mobile document width 390). Store tests independently verify
persistence across instances, concurrent identical writes, corrupt data and isolation. Browser
fixtures do not prove live Meta acceptance. Full remaining-program completion is not claimed.

### M2.1 offline diagnostic investigation specification (before code)

Complete a labelled evidence-import path for Events Manager information before connecting live
accounts. This is not a simulated Dataset Quality API and does not claim screenshot parity.
Growth owns a strict versioned diagnostic observation: exact project/environment/connection/
dataset, capture/window/source reference, completeness, named events, optional reported totals,
last receipt, channels, optional provider-reported match score, and coded issues with severity and
reported lifecycle. Unknown values stay absent; absent score or count is never zero.

Imported suggestions may identify a repair owner (adopter, GTM, provider or investigation), but
remain unverified suggestions. Review produces an evidence-bound handoff; it never claims a
root cause, executes a change, acknowledges an issue at Meta or marks a repair verified. Freshness
is evaluated against capture time, including future timestamps. Bounded event-name filtering and
result limits support agents investigating Purchase without returning all imported data.

The host validates the selected event source against canonical connection/config resources,
reuses the engine local artifact store for content-derived snapshots and a current-reference
pointer, and never resolves credentials. Import is an explicit local write; review is offline.
CLI `growth diagnostics import/review`, MCP import/review tools and a console JSON import/review
panel share these contracts. JSON input is byte bounded and does not contain raw customer data.
Persistence failures, invalid references, checksum mismatch and foreign targets fail closed.

Test strict schemas, duplicate event/issue identities, missing values versus zero, source-window
and capture validity, stale/future evidence, dataset mismatch, absent history, bounded output,
source-attributed suggestions, loopback security and shared-interface routing. Keep live API
acquisition, adopter/GTM repair execution and real delivery verification explicitly pending.

### M2.1 implementation record

The offline import/review workflow is implemented. Growth owns strict canonical input/output
schemas, validation, evidence hashing and review semantics. The host binds the selected dataset,
uses the existing engine artifact store and dispatches the shared read action. CLI, MCP and
console call this host workflow. Imports are local writes and never change Meta resources.
Snapshots are addressed by observation hash; review follows the last imported pointer (not a
claim that it is the newest capture). Reimporting identical observations refreshes import time.
Historical selection, retention policy and provider acquisition remain separate work.

Limits are 256 KiB per submitted request, 50 events and 20 issues per event. Review defaults to
10 returned events, permits at most 20 and defaults to a 24-hour freshness threshold. Strict
schemas reject extra structured fields, including raw customer-field payloads; free-text source
references and explanations must still be supplied without secrets or customer data.

Developer/agent entry points:

- `growth diagnostics import --file diagnostic.json --environment production --json`
- `growth diagnostics review --event Purchase --environment production --json`
- MCP `import_meta_diagnostics` and `review_meta_diagnostics` expose generated input schemas.
- Console: Advertising → Meta → Overview → Meta event issues. Import the observation, then
  review all imported events or one exact provider event name.

Minimal synthetic observation (replace the four binding fields with the selected target):

```json
{
  "schemaVersion": 1,
  "provider": "meta",
  "projectId": "example",
  "environmentId": "production",
  "connectionId": "meta",
  "datasetId": "123",
  "capturedAt": "2026-09-06T00:00:00Z",
  "window": { "startDate": "2026-09-04", "endDate": "2026-09-05" },
  "source": { "kind": "manual-import", "reference": "Synthetic example", "verifiedLive": false },
  "completeness": "partial",
  "events": [{ "name": "Purchase", "activity": "unknown", "channels": [], "issues": [] }]
}
```

Omitted totals, match quality and last receipt remain unknown. An empty issue list means the
source included no issues, not that tracking is healthy. Only active imported issues produce
handoffs; suggested owners and remedies are unverified source claims. Ops does not treat imported
text as instructions, execute a repair or mark an issue resolved.

Remaining pre-live implementation includes authenticated adopter ingestion/delivery joins,
evidence-supported repair plans, shared controlled mutations and recovery, broader campaign/
audience/catalog workflows, scheduling and connection interface gaps. This batch does not close
M2 as a whole or make live-account testing the only remaining work.

M2.1 verification: 306 Growth tests, 42 MCP tests, 41 console tests, 11 host runtime tests
and 4 Codex binding integration tests pass (404 total). All four affected packages pass
type checks, lint and builds. Added tests cover canonical schema semantics, cross-environment
read rejection before loading, CLI registration, MCP target checks, host persistence without
credentials/network, HTTP origin/size/target guards and escaped rendering. Synthetic browser
verification exercised missing → import → exact Purchase review, including stale/partial source,
zero total, unavailable match quality and investigation handoff. Desktop 1280×720 and mobile
390×844 were inspected; mobile document width stayed 390. No live account was used.
