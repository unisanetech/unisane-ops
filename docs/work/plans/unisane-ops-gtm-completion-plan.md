---
id: 'DOC-gtm-completion-20260906'
owner: 'unisane-ops'
scope: workspace
role: plan
lifecycle: active
authority: supporting
provenance: accepted
view: current
---

# GTM completion and pre-live verification

This batch extends Growth contracts and services, the Google provider, and existing interfaces.
It does not use a live account or publish a container. The target experience remains inspect →
plan → review → apply → preview → version → publish → verify, with site delivery independently
verified. Existing CLI transport is not yet the complete shared-action architecture described
as an aspiration in the operator guide.

## Findings and implementation order (recorded before code)

1. Make planning reject foreign container/workspace snapshots and ambiguous duplicate resource
   identities. Already-paused removed tags must be no-ops; unmanaged resources stay untouched.
2. Require complete receipt identity and successful compilation. Bind create-version to the
   preview workspace and content revision; compare a fresh compiler preview before versioning.
   Require exact version identity/fingerprint for ordinary publish and carry the reviewed
   fingerprint to Google. Validate provider response identity and read back the live version.
3. Bound and validate provider pagination; return credential-safe transport failures. Avoid
   automatic retries for uncertain writes. Expose uncertainty rather than report false success.
4. Add shared offline workspace diagnosis for duplicate ownership, unknown/missing resources,
   deterministic diffs and explicit verification gaps. Reuse existing validation/policies and
   expose diagnosis through a typed action, CLI, MCP and console without shell execution.
5. Test malformed evidence, drift, target isolation, paused no-ops, readback mismatch and interface
   routing against fixtures. Document remaining features separately from real-account proof.

## Ownership and files

Growth `gtm/` owns receipt validation, content revision, planning and diagnosis; `actions/`
owns reusable action definitions. CLI handles artifact paths and presentation only. Google
`tag-manager/` owns HTTP, resource lowering, preview/version operations and provider readback.
MCP and console render shared diagnostic results. Existing host bindings retain custody.

## Resource scope

| Resource | Existing mutation scope | Remaining scope |
| --- | --- | --- |
| Tags | Create/update/pause; typed templates | Reviewed destructive deletion and broader templates |
| Triggers, variables, folders | Create/update | Dependency-aware deletion/revert |
| Built-in variables | Enable/read | Reviewed disable/revert |
| Workspaces | Resolve/create/sync/preview/version; shared apply and attempt recovery | Merge conflict resolution and reviewed resource administration |
| Versions | Create/publish/known-version rollback; shared approval, interfaces and durable recovery | Live provider acceptance |
| Environments, destinations, permissions | Extended read | Typed reviewed administration |
| Server clients, transformations, zones | Extended read where supported | Server-container planning/mutation and hosting |

Preview compilation does not prove a tag fired, consent was respected, or a destination accepted
an event. Browser journeys and destination evidence remain distinct verification requirements.

API basis: Google's official [quick preview](https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces/quick_preview)
returns a compiled temporary version; [create version](https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces/create_version)
creates a version and removes the source workspace. These are different lifecycle transitions.

## Implemented batch

The planner rejects mismatched containers/workspaces and duplicate resource identities, and
skips a removed tag already paused. Receipt validators moved into reusable Growth evidence
contracts. Preview records a compiled-content digest; create-version selects that workspace,
recompiles, rejects changed content before creation and checks created content afterward.
Version receipts require exact identity and fingerprint. Publish and rollback reject changed
fingerprints and verify the live version identity/content. Transport failures are redacted,
requests time out after 30 seconds and pagination fails on malformed data, repeated tokens,
more than 100 pages or 10,000 resources. No automatic write retry was introduced.

Shared `growth.gtm.diagnose` is offline and transient. CLI loads canonical desired state and
optional local snapshots; MCP and console accept explicit JSON evidence. Project and app IDs
remain distinct. Target checks bind the project/environment; snapshot checks bind account/
container/workspace. Diagnosis returns summaries only; it is not an executable approval plan.
Console location: Analytics → Tracking health → Tag Manager workspace.

Remaining implementation: generated event configuration, complete mutation action/job/approval
migration, conflict resolution and durable partial-write recovery, destructive deletion/revert,
server-container administration, and integration of journey/destination evidence into repair
verification. Live Google acceptance and actual site/consent/event-delivery proof also remain.
This is a completed safety/diagnosis batch, not completion of every GTM roadmap capability.

## Verification

456 tests pass: Growth 310, Google provider 46, MCP 43, console 42, host runtime 11 and
Codex binding integration 4. All five affected packages pass builds, type checks and lint;
`git diff --check` passes. Focused tests cover missing/wrong receipt fields, preview drift,
foreign workspace rejection before writes, version fingerprint drift, live identity/content
mismatch, pagination cycles/malformed data, credential-safe failures, inactive-tag no-ops,
project/app identity separation and HTTP origin/size/target guards. Synthetic console diagnosis
was exercised at 1280×720 and 390×844; mobile document width stayed 390. No Google account was
read or changed. The local fixture proof does not establish production API acceptance.

## Workspace mutation and recovery batch specification (before code)

Add one reusable `growth.gtm.workspace.apply` mutation action. The plan binds the exact
project/environment, Google connection, account/container/workspace, desired manifest,
normalized source inventory and ordered operations. Reuse engine exact-plan approvals,
lock leases, mutation receipts and atomic mutation-run storage; do not add a second approval
model. The action re-reads provider inventory before mutation and refuses drift.

Persist a started attempt with compare-and-set before invoking the provider. A started or
uncertain attempt is never automatically replayed. Recovery reads the selected workspace and
compares desired resources; it records verified, not-matched or unavailable evidence. Partial
changes require a newly reviewed plan for the remaining work. Verification does not claim
publication or browser/destination tracking success. A stored successful receipt still needs
state verification, and recovery does not rewrite a failed/partial receipt into success.

Provider execution must select an existing exact workspace and avoid implicit synchronization
for this action. Check the engine lease before each resource write. Local execution stores may
be used only where the engine permits them; production/automation requires an appropriate
durable host backend. No real account access or mutation is part of this implementation batch.


## Workspace mutation batch delivered

Shared `growth.gtm.workspace.apply` now owns exact review plans, recorded human approvals,
workspace leases, immutable receipts and compare-and-set attempt records. Growth separates
contracts, planning, action execution, provider bridge and workflow orchestration under
`src/gtm/workspace/`. The Google adapter rechecks inventory before writes, avoids implicit
workspace synchronization and checks the lease before each resource mutation. The host owns
connection selection and credentials; interfaces pass identifiers through the shared workflow.

CLI `growth gtm workspace` exposes plan, review, approve, apply and recover. Console exposes
the same lifecycle under Analytics → Tracking health → Tag Manager workspace. MCP exposes
plan, review, apply-approved and recover tools; it cannot grant human approval. The approved
plan binds desired manifest, normalized source inventory, exact target, expiry and operations.
The host checks the current canonical manifest again before invoking provider writes.

Attempt start is persisted before provider writes. A timeout, crash or receipt persistence
failure cannot silently replay that plan. New workspace writes are blocked until the prior
attempt is reconciled. Recovery is read-only at the provider and records verified, not-matched
or unavailable evidence, with an explicit earliest verification time while writes settle.
A partial receipt remains partial even if later evidence matches desired state.

The default host uses local execution storage: non-production human-driven workflows are
supported, while production and automated agent writes remain blocked by engine durability
requirements. A durable host backend is still required for those cases. Existing preview,
version and publish CLI workflows have not yet migrated to this new shared action lifecycle.
Generated event configuration, server-side GTM administration, destructive operations,
conflict resolution and real journey/destination verification remain separate roadmap work.

Offline verification: 462 tests pass across Growth, Google provider, MCP, console and host
runtime. All five affected packages build and pass type checks and lint. Tests exercise exact
approval, stale inventory, replay prevention, interrupted receipt persistence, resumed recovery,
project isolation, production/agent restrictions, provider write hooks and console origin,
payload-size and error-redaction guards. No live Google account acceptance is claimed.

The four Codex binding integration tests also pass (466 tests in total). CLI help exposes all
five workspace commands. Synthetic console verification at 1280×720 completed prepare,
review, human approval, simulated apply and recovery using the real shared workflow with
local fixture stores. Its fixture clock advances only for recovery; no provider API is called.
The displayed result explicitly leaves publication and event delivery unverified.

## Shared release lifecycle specification (before code)

Extend shared Ops workflows with compiler preview, exact create-version plans and exact publish
plans. Preview evidence includes the compiled content revision; version plans disclose source
workspace removal. Publish plans bind target version ID/fingerprint/content and current live
version. Reuse engine approval records, container leases, immutable receipts and atomic runs.
Persist an attempt before either provider write. A lost create-version response is recovered
using a unique reviewed version name and content revision; ambiguous evidence blocks writes.
Publication recovery reads live version identity/content. Neither result proves event delivery.

Provider methods must check leases immediately before writes, refuse live/version drift and
return bounded version evidence for recovery. Local host restrictions remain truthful until a
durable backend with crash, concurrent-worker and custody proof is available. Broader resource
administration, generated tracking recipes and actual destination proof are separate contracts,
not implicit consequences of successful publication. API semantics checked against Google's
create_version and versions.publish references on 2026-09-06.

### Durable host extension specification

Provide a SQLite execution backend implementing the existing artifact, approval, lease and
mutation-run ports. Use transactions, full synchronization, atomic compare-and-set and
monotonic lease fencing; immutable approvals and receipts cannot be overwritten. Keep the
provider/domain packages unaware of SQLite. The host may select this backend explicitly;
legacy local records must not be silently bypassed. Test independent database handles,
lease takeover, stale owner rejection, persisted attempts and reopening after a process exit.
SQLite supports a persistent single-machine host, not shared network-filesystem deployment.

## Shared release and durable execution delivered

The shared `growth.gtm.release` action now supports version and publish plans, exact human
approval, apply and delayed recovery. Compiler preview is separately available. Plans expose
source-workspace removal, target content/fingerprint and current live revision. Provider hooks
check the current lease immediately before version creation or publication. Publish-never
policy is shared with the existing CLI and remains enforced. Container guards now coordinate
workspace edits with release attempts. A unique version name is included in review so a lost
creation response can be reconciled; missing or multiple matching versions remain unavailable.

CLI commands live under `growth gtm release`; console controls are in Tag Manager workspace.
MCP `manage_gtm_release` supports preview, plan-version, plan-publish, review, apply and recover.
It cannot approve. Shared HTTP guards enforce loopback origin, payload bounds and bound targets.
An exact known prior version can be reviewed and published for rollback through this lifecycle.
Superseded direct CLI mutation commands have been removed; shared workspace/release actions own execution.

The engine now supplies `createSqliteOpsExecutionState` through its existing state ports. It
requires file-backed WAL storage and full synchronization. Transactions protect lease fencing,
immutable approval/receipt writes and mutation-run compare-and-set. The host owns database
opening, private paths, lifecycle and backend selection. Enable before the first GTM workflow:
`execution: { gtm: { backend: 'sqlite' } }` in unisane.config, or the same property under `ops`
in a unified project config. Node.js 22.13+ is required for this optional host backend.
SQLite supports durable execution by agents/production on one persistent machine; shared
network filesystems and multi-host deployment are outside this adapter's guarantee.

Backend selection is persisted. Existing local execution records or another selected backend
block switching; records are never deleted or silently ignored. A reviewed legacy migration
utility remains required for projects with local history. Keep their current backend until
that migration is available. New projects can select SQLite immediately.

Still distinct from this delivery: generated tracking recipes; dependency-aware resource
removal/revert; workspace merge-conflict resolution; environment/destination/permission
administration; server-container resource mutation/hosting; journey and destination evidence;
live account acceptance; and legacy-store migration. These are not marked complete by version
or publish success. No real Google account was read or mutated in this batch.

### Release/backend verification

524 focused tests pass across engine, Growth, Google provider, MCP, console and host runtime;
four Codex binding integration tests also pass. All six affected packages build and pass type
checks and lint. CLI help exposes all seven release operations. The synthetic console flow
at 1280×720 completed preview, exact version approval/apply/recovery and a separate publication
approval/apply/recovery against a fake provider and real SQLite execution stores. A fixture
clock advanced the settlement delay. Tests additionally cover killed-process persistence,
independent database handles, stale lease fencing, CAS races, immutable approvals/plans,
production agent execution after human approval, publish-never policy and pre-write lease/live
revision checks. No live account or actual browser-to-provider tracking proof is included.

## Tracking setup generation specification (before code)

Add an offline typed setup compiler using existing Growth GTM recipes. Inputs explicitly bind
project/app/environment/container, provider identifiers, data-layer event names, event-ID and
value/currency/transaction-ID paths, and consent defaults. Produce a separate manifest proposal
with deterministic revision, required adopter data contract and diagnosis; never overwrite the
canonical manifest or apply remotely. Generated configuration remains subject to workspace
review, preview and publication. Do not infer purchases from page views or supply fallback
business values/currencies. Google Ads labels use typed variable references. Meta lowering must
preserve supplied value/currency and initialize a given pixel only once within generated tags.
Consent defaults and CMP updates remain explicit adopter responsibilities. Expose the same
offline compiler through CLI, MCP and console, with no provider credentials required.

### Tracking setup implementation

The offline `growth.gtm.setup.generate` action now reuses existing recipes and diagnosis and
exposes one canonical input schema to CLI, console and MCP. It generates a separate proposal
with required adopter observations, explicit consent defaults, exact destination identifiers
and data-layer mappings. It never invents purchase values or overwrites configuration. Meta
lowering now retains value/currency/event ID and targets the selected pixel. Google Ads labels
use typed constant-variable references and transaction IDs support conversion deduplication.

This completes the bounded setup compiler, not universal installation or every GTM resource
operation. Dependency-aware removal/revert, conflicts, environment/destination/permissions
administration, server-container management, legacy execution-store migration and real-account
acceptance remain open. CMP updates and browser/server delivery remain adopter responsibilities.

## Single GTM execution path cleanup (2026-09-06)

The user authorized removing obsolete paths to avoid hybrid behavior. Remove the superseded
root `gtm plan/apply/preview/create-version/publish/rollback` commands, their file-plan and
CLI-specific approval/receipt orchestration, and unused host provider-command mutation routes.
Keep `workspace` and `release` as the only user-facing GTM execution lifecycles. Keep local
validate/pull/diff/diagnose utilities. No compatibility aliases or silent argument translation.
Rollback uses a separately reviewed release publication targeting an exact prior version.

Retain provider implementation functions used by the shared action adapters. Retain explicit
local/SQLite backend selection and history checks: these protect existing attempts and are
not fallback execution. Audit name/ID inference separately from dead code; existing remote
ownership must not be silently reassigned by a cleanup. Tests must reject removed commands
and preserve shared discovery, approval, drift and recovery coverage. Update current operator
instructions rather than leaving two competing workflows in the guide.

Cleanup findings: the removed root CLI commands had their own plan files and confirmation
rules; their host mutation dispatch cases had no remaining callers. Console command-overlay
suggestions referenced those commands and were removed in favor of shared controls. The
rollback provider alias only republished a version; the shared release lifecycle owns that
operation. Version read methods are now required by the provider port. Mutation responses
without an actual resource ID fail rather than substituting a local slug.

Retained deliberately: explicit local/SQLite stores and refusal to bypass existing history;
normal generated display names when no custom name is specified; support for recognizing
previously managed namespaced remote resources. Removing historical name recognition without
migration could misclassify installed tags as unmanaged. These are not alternate mutation
paths. Raw provider SDK operations remain implementation primitives for the shared adapters.
