---
id: 'PLAN-15b3fb3efb7d'
owner: 'unisane'
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
  - 'native'
  - 'hosted'
  - 'platform'
  - 'plan'
---

# Unisane Ops AI-Native And Hosted Platform Plan

Build Unisane Ops as a local-first package product that is also natural to use from AI
agents and available as an optional managed platform, without creating a second engine,
configuration model, or safety lifecycle.

## Changelog

- `2026-08-15`: Converged current delivery on Ops `unisane-ops`, one typed
  `ActionDefinition`, and the optional non-default serialized Framework descriptor
  adapter with zero Framework npm dependencies. Framework `unisane` and
  `create-unisane` remain separate; nested CLIs/output capture are forbidden; provider
  mutations remain in Ops. Earlier dated `unisane ...` evidence is chronology only.
- `2026-08-04`: Finalized the SEO-first product delivery sequence. The immediate
  objective is a complete real-site local loop from evidence preparation and
  conversational research through an implementation packet and measured result.
  Existing hosted feasibility work is frozen; further SaaS product implementation
  starts only after local closure and the exact user reply
  `START UNISANE OPS HOSTED SAAS`.
- `2026-08-04`: Added the provider-neutral credential-custody proof. The engine now owns
  strict public credential metadata, an injected envelope-cipher port, identity-bound
  authenticated encryption, atomic rotation/revocation, and a short-lived worker
  resolver; PostgreSQL stores encrypted versions and separates gateway lifecycle,
  worker resolution, and scheduler timing grants. Managed KMS/workload identity, OAuth
  callback/session handling, and cloud recovery evidence remain environment gates.
- `2026-08-04`: Added the portable hosted read scheduler role. Versioned schedules bind
  exact read action and evidence context without credentials; PostgreSQL due claiming,
  fencing, occurrence creation, canonical job/dispatch/audit materialization, and cadence
  advancement are transactional; and an independent least-privilege scheduler process
  and Kubernetes Deployment own timing without executing actions or exposing a Service.
  Schedule management UX/API, scheduled mutation, managed secrets, and public hosted
  delivery remain later gates.

- `2026-08-04`: Added the cloud-neutral hosted release trust contract. The production
  Bake target now attaches maximum SLSA v1 provenance and an SPDX SBOM, the release
  verifier requires one digest plus an exact Cosign signer identity and OIDC issuer,
  every migration/gateway/worker/rollback-check workload is digest-only, and a candidate
  rollback digest must pass its own schema probe before rollout. Real managed registry
  signing, cluster admission enforcement, and rollout evidence remain environment gates.
- `2026-08-04`: Proved the portable data-safety layer for the hosted read spine. OIDC
  identities now bind both scope and project access, PostgreSQL retrieval applies the
  full identity predicate without disclosing cross-project existence, runtime database
  roles receive separate least-privilege grants, and a separate maintenance image proves
  secret-file custom-format backup plus exact fresh-database restore comparison. Managed
  provider PITR, encrypted artifact custody, workload identity, signing/provenance,
  managed rollout and incident ownership remain environment-specific gates.
- `2026-08-04`: Added the portable OCI and Kubernetes deployment foundation for the
  authenticated hosted read spine. A non-root, production-closure image now exposes
  exact gateway, worker, migration, and probe commands; mounted secret-file resolution,
  migration-gated rollout templates, probes, resource bounds, independent scaling, and
  an isolated authenticated cross-container proof are current. Product action modules
  remain downstream immutable-image composition. Managed secrets and workload identity,
  backup/restore, tenant isolation, artifact signing, managed rollout and incidents,
  remote MCP, scheduler, and mutation remain open production gates.
- `2026-08-04`: Proved independently runnable private gateway and worker artifacts for
  the hosted read spine. Exact-issuer/audience OIDC admission, bounded internal HTTP,
  explicit worker action loading, schema-revision startup checks, payload-free lifecycle
  telemetry, and bounded signal shutdown now run across separate operating-system
  processes against PostgreSQL. Managed identity provisioning and secret custody,
  backup/restore exercises, managed rollout/rollback, scheduler deployment, remote MCP,
  tenant-isolation certification, and mutation remain open production gates.
- `2026-08-03`: Added the standalone PostgreSQL hosted-read adapter and private
  gateway/worker process lifecycles. Real PostgreSQL integration proof now covers
  explicit repeatable migration, atomic admission, conflicting idempotency rejection,
  competing dispatch claims, durable execution, lease recovery, and stale-worker
  fencing. Process composition adds startup probes, readiness, structured observation,
  bounded polling, retry/dead-letter classification, and graceful shutdown. Actual
  deployment, managed workload identity and secrets, backup/restore operations,
  scheduler, remote transport, and mutation remain open production gates.
- `2026-08-03`: Proved the internal hosted read spine through SQLite WAL transactions
  and separately composable gateway and worker roles. Independent connections preserve
  atomic admission, exact duplicate reuse, fenced execution, bounded durable results,
  restart recovery, and stale-worker denial. SQLite is only the reproducible feasibility
  adapter; public transport, managed identity/secrets, scheduling, mutation, production
  database selection, and deployment remain later gates.
- `2026-08-03`: Completed the internal first durable hosted read-action spine in Ops
  engine. Exact audience/principal/scope/action/evidence/idempotency admission is
  atomically recorded with a queued job, dispatch intent, and audit fact; fenced workers
  persist bounded result references or safe failures and recover only expired leases.
  The slice deliberately exposes no public route or SDK contract and does not claim
  managed secrets, remote MCP, scheduling, mutation, or production deployment.
- `2026-08-03`: Added exact-plan human approval to the local non-production Growth
  console. Approval crosses one same-origin host boundary into the canonical Growth
  workflow with server-owned operator identity and exact plan hash; the browser gains no
  apply, verify, provider, store, or policy authority. Production and disabled-policy
  consoles remain read-only.
- `2026-08-03`: Completed the bounded private Codex host exercise for the campaign-pause
  skill on CLI `0.146.0-alpha.9.2`. A fresh task created one exact non-production plan
  and explained the human approval leaf; a resumed task rejected chat-only approval
  after canonical review and did not call apply. Approved provider apply, verification,
  desktop lifecycle, public distribution, remote MCP, and hosted execution remain later
  gates.
- `2026-08-03`: Added the private campaign-pause skill to the repository-local Codex
  plugin. It uses the four admitted lifecycle tools, routes exact approval to a human,
  re-reads canonical state before apply, and treats verification as a separate stage.
  Plugin drift tests freeze four skills against the seven-tool MCP catalog. This does
  not advance console approval, public distribution, durable execution, remote MCP, or
  hosted mutation.
- `2026-08-03`: Completed the first controlled local MCP action slice. The catalog now
  adds separate campaign-pause plan, review, apply-approved, and verify tools over the
  canonical Growth workflow. MCP cannot approve; exact human approval remains external,
  receipts preserve the bound agent executor, replay does not repeat the provider write,
  and contract profiles exercise the full denial and verification boundary. Durable
  multi-process, remote, and hosted mutation remain later gates.
- `2026-08-03`: Completed the bounded private Codex host exercise on CLI
  `0.146.0-alpha.9.2`. Fresh tasks selected all three exact Growth tools, handled
  ambiguous and missing binding context, preserved blocked/no-evidence guidance, and
  resumed the same health workflow with unchanged evidence. Broader released-host/model,
  desktop, public marketplace, remote MCP, and hosted certification remain later gates.
- `2026-08-03`: Completed the first private Codex skill-binding increment. One
  repository-local marketplace now installs one `unisane-ops` plugin containing three
  goal-specific skills over the already bound read-only tools. Official validators,
  structural drift tests, and reversible Codex CLI install/discovery/removal pass. Its
  fresh-task representative workflow evaluation is now complete for the named
  private Codex CLI exercise; broader released-host certification remains separate.
- `2026-08-03`: Completed the safe project-local Codex configuration increment. The
  canonical CLI now previews, installs, updates, and removes one bounded managed MCP
  block; focused preservation/idempotency tests and installed Codex CLI discovery are
  current evidence. Private Codex workflow skills and broader released-host evaluation
  remain the next local-binding increment.
- `2026-08-03`: Completed the deterministic local MCP contract-profile evaluation
  foundation. The official MCP client now exercises the three frozen Growth workflows
  across explicit Codex, Claude, Gemini CLI, and CI capability profiles, including
  bounded guidance, resume, changed evidence, wrong target, actor/workflow replay,
  injection, secret-result, and oversized-result cases. These are offline contract
  evaluations, not proprietary host/version certification; thin real-host bindings and
  certification remain next.
- `2026-08-03`: Completed stateless actor-scoped resume across the three frozen local
  MCP tools. A prior structured handoff now re-enters the same tool and run identity,
  fails closed on target, actor, or workflow mismatch, and reports current, changed-run,
  or changed-evidence state without transcript memory or another persistence authority.
  Cross-host usability evaluation and host-specific bindings remain next.
- `2026-08-03`: Added the canonical one-install local MCP launch path as
  `unisane mcp serve --project <absolute-path> --environment <id> --actor <id>`.
  Spawned-process proof now covers protocol discovery, real Growth execution, bound
  target rejection, clean shutdown, and protocol-safe output. Cross-host usability
  evaluation and host-specific bindings remain next.
- `2026-08-03`: Implemented the first local MCP package boundary and froze its minimum
  catalog as `review_growth_health`, `research_seo_opportunities`, and
  `audit_growth_measurement`. The server is local STDIO only, explicitly project and
  environment bound, read-only, direct-to-executor, strict and bounded; host-specific
  installation, cross-host agent evaluation, remote transport, and mutation remain
  later work.
- `2026-08-03`: Replaced legacy program/workstream codes with descriptive roadmap
  phases. This plan expresses durable strategy and dependency order only; Skopos is the
  sole authority for executable Tasks, sequencing, Evidence, Readiness, and closure.
- `2026-08-03`: Completed guided-workflow cross-surface parity with Growth health review. The
  executor reads canonical intent plus capability-relevant provider artifacts, and its
  exact action-owned diagnosis, readiness, primary finding, recovery step, bounds, and
  freshness lower through CLI JSON/human and console Overview. The three read-only
  pilots are now ready to serve as the minimum local MCP/evaluation catalog.
- `2026-08-03`: Proved SEO opportunity cross-surface parity. Recorded opportunity,
  keyword-cluster, and competitor artifacts feed one bounded executor; CLI and console
  project the same action-owned ranking, confidence, limitations, provenance, and safe
  next step. Health-review parity remains before MCP work.
- `2026-08-03`: Proved the first cross-surface adapter with measurement audit. Existing
  artifact owners feed one action executor, CLI JSON preserves the complete result, and
  CLI human plus console tracking-health presentation lower from the same workflow
  projection. Health and SEO parity remain before MCP work.
- `2026-08-03`: Completed the measurement trust-gating pilot by composing canonical
  tracking-audit results with canonical outcomes and separately labelled provider
  attribution. The three read-only reasoning shapes are now executable; cross-surface
  lowering and evaluation remain next.
- `2026-08-03`: Proved the SEO opportunity-synthesis pilot over recorded keyword,
  market, competitor, SERP, and page evidence. Documented why the three pilots exercise
  diagnosis, opportunity synthesis, and trust gating rather than mirroring console page
  names; controlled mutation remains a later distinct proof.
- `2026-08-02`: Clarified the delivery experience around one local CLI install, no
  package install for hosted users, one thin plugin/MCP connection for agent users, and
  optional direct technical packages for SDK integrators without collapsing internal
  package ownership.
- `2026-08-02`: Added a hosted-runtime feasibility spine, split local/private AI-host
  bindings from public hosted distribution, and added transactional execution,
  reconciliation, identity, recovery, and production-readiness gates.
- `2026-08-02`: Added the pre-implementation Growth guidance foundation: versioned
  goals/playbooks, evidence-bound context, resumable runs and handoffs, thin skill
  bindings, plain-language presentation rules, and three real-world pilot workflows
  before MCP or hosted expansion.
- `2026-07-29`: Opened the staged plan for one action contract, local MCP, AI-host
  distribution, managed control plane, remote MCP, team workflows, schedules, billing,
  and enterprise delivery over the existing Ops engine.

## Authority And Current-State Warning

This plan owns future AI-native and hosted delivery. The project-bound local STDIO MCP
package, its three read workflows, four controlled campaign-pause lifecycle tools, and
the canonical `unisane-ops mcp serve` composition are current MCP truth. Public AI-host
plugins, remote MCP/APIs, managed OAuth, and hosted SaaS remain target state. Current
package READMEs, pack manifests, and implemented CLI behavior remain executable
authority.

The current delivery lane is the complete local SEO system defined below. Existing
hosted feasibility source is frozen except for required correctness or security
maintenance. No managed-platform, remote-MCP, SaaS identity, billing, hosted UI, or
deployment expansion is admitted before local end-to-end closure and the exact user
confirmation required by the accepted decision.

The current Growth product architecture remains responsible for clean onboarding,
provider connections, derived readiness, instrumentation reconciliation, and the
human-first console. AI-native and hosted delivery must consume those results and must
not redesign or duplicate them.

The durable read-only execution spine and the Growth health-review, SEO
opportunity-synthesis, and measurement trust-gating pilots are executable current state.
Health review, measurement audit, and SEO opportunity research now share headless, CLI,
console, and local MCP lowering. Deterministic contract-profile evaluation is also
current. The first Codex project-local configuration binding is also current, including
installed-CLI discovery of the generated server. Its private three-skill plugin and
repository-local marketplace are also current, including installed-CLI plugin discovery.
The exact campaign-pause plan, review, apply-approved, and verify lifecycle is current
for local MCP contract profiles; it does not add an approval tool or a production-host
claim. The local non-production console may record human approval for one exact current
plan but cannot apply or verify it; production and disabled-policy consoles remain
read-only. Fresh and resumed campaign-pause host evidence is current for exact planning
and chat-approval rejection on Codex CLI `0.146.0-alpha.9.2`. The hosted read-action
technical contract, SQLite feasibility adapter, and private gateway/worker composition
are also current, without a public product transport, managed identity, or deployment
surface. Approved provider apply and verification are not yet real-host certified. Full
released-host/model and desktop certification, other AI-host bindings, public
distribution, remote MCP, managed secrets, scheduling, and hosted deployment remain
planning direction until their bounded Skopos Tasks close with direct Evidence.

Current 2026-08-15 authority supersedes every combined-launcher, executable Framework
pack, Devtools bridge, or direct Framework-import clause elsewhere in this plan. Ops
core/default install has zero Framework implementation dependencies; its optional
adapter consumes only validated serialized descriptor data and never invokes
compilation. CLI/MCP/API/UI/scheduler/automation/agent/plugin surfaces call the same
typed action and never invoke another adapter, accept raw argv as the engine API,
capture stdout/stderr or `process.exitCode`, or parse terminal prose. Provider and
remote-state mutations belong to Ops actions or another admitted product owner, never
Framework Compiler/Devtools.

The Framework stays private through the complete architecture, release, and
repository-finalization program. Completion only permits later founder review; a public
state requires direct founder approval and a separate accepted high-impact Decision.
This plan grants no Framework remote, registry, publication, or visibility authority.

## Product Outcome

Unisane Ops supports six real user contexts through one operational system:

| User context                    | Primary experience                                              | Required value                                                                                    |
| ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| local developer                 | package and CLI                                                 | inspect, configure, audit, plan, apply, and verify in the current project                         |
| marketer or founder             | local console now; hosted console after the SaaS gate           | understand performance, connections, priorities, and safe next actions without terminal knowledge |
| team or agency                  | local project handoff now; hosted workspace after the SaaS gate | share projects, connections, roles, approvals, schedules, and activity safely                     |
| CI or automation                | JSON/action API                                                 | deterministic non-interactive checks and approved operations                                      |
| AI-agent user                   | MCP plus AI-host plugin/skills                                  | natural-language analysis and controlled action with explicit context and evidence                |
| enterprise/self-hosted operator | packages plus controlled deployment                             | data-boundary, identity, audit, and deployment control                                            |

Package-only operation remains valuable and supported. Hosted SaaS is optional, later,
and explicitly gated. Both use the same project intent and engine contracts.

Ordinary users do not assemble the internal package graph. Local developers install one
CLI product entrypoint; hosted-console users install nothing; agent users install or
connect one admitted host integration; and only SDK integrators select technical
packages or subpaths directly. This one-entry experience is a distribution composition
rule, not permission to merge engine, Growth, provider, console, MCP, or hosted ownership
into one source package.

## Product Principles

1. One engine owns truth; surfaces own interaction.
2. The model interprets user intent but never invents evidence or authority.
3. Read is easy; mutation is deliberate, staged, and receipted.
4. Project, site, environment, connection, and resource identity are always explicit.
5. Every result explains freshness, uncertainty, impact, and a safe next action.
6. Local workflows do not require SaaS; team and remote workflows do not require a
   developer's laptop to stay online.
7. Source-controlled project intent remains portable.
8. Secrets remain behind provider/host secret ports and never enter prompts.
9. Host integrations are thin, replaceable adapters.
10. Future capability is admitted through versioned contracts, not speculative
    abstractions or empty packages.
11. Complete local SEO value precedes hosted product implementation; only the exact
    confirmation phrase defined by the canonical decision can admit the SaaS phase.

## Target Architecture

### Layer 1: domain and provider owners

- `@unisane/growth`
- `@unisane/cloud`
- provider packages
- `@unisane/web-runtime`
- optional non-default `@unisane/framework-ops` serialized-descriptor adapter

These packages continue to own domain intent, provider execution, application runtime,
and descriptor translation. The adapter has zero Framework npm dependencies and never
contains or executes Framework handlers, services, containers, secrets, provider
clients, source paths, Compiler, Devtools, or runtime code.

### Layer 2: one operational engine

`@unisane/ops-engine` owns one typed `ActionDefinition` protocol and:

- action descriptors and execution
- inventory and evidence normalization
- findings, readiness, and next actions
- effect and risk classification
- plan, authorization/approval, apply, rollback-plan, receipt, and drift
- idempotency, locks, artifact/state/secret ports
- asynchronous action/job semantics

Growth contributes versioned goal and playbook descriptors to this engine boundary.
The engine owns the corresponding evidence-bound context brief, resumable workflow run,
decision, handoff, receipt, and verification state. Playbooks compose registered actions
and readiness; they do not introduce a second executor or policy system.

The same registry feeds console guidance, Help, CLI discovery, MCP tools, agent skill
bindings, and automation. Static surface-specific checklists and prompts are migration
inputs, not target owners.

### Layer 3: transport-neutral action contract

The initial public contract lives at `@unisane/ops-engine/actions`. It must be usable
without a CLI parser, React, a provider SDK, or a hosted database.

Core structures:

| Contract           | Responsibility                                                                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| action definition  | stable id/version, typed input/result, owner, maximum effect, exact target, policy/admission/approval, plan/apply/verify, errors/artifacts/redaction/receipt, and recovery semantics |
| execution context  | actor, `scopeId` when hosted, project, site, target, environment, and request identity                                                                                               |
| action request     | typed input, idempotency, expected resource/version, and explicit intent                                                                                                             |
| action result      | typed data, human summary, evidence, freshness, findings, and next actions                                                                                                           |
| approval reference | authoritative approval identity, scope, target, effect, expiry, and approver                                                                                                         |
| receipt            | immutable outcome, before/after identity, effect, actor, request, and verification                                                                                                   |
| job reference      | queued/running/terminal state, progress, cancellation, retry, and result                                                                                                             |
| error              | stable code, affected identity, retryability, blocking effect, and recovery action                                                                                                   |

The contract must support bounded summaries, pagination/cursors, artifact references, and
deep links so AI context windows are not filled with raw provider payloads.

### Layer 4: delivery adapters

| Adapter                | Ownership                                             |
| ---------------------- | ----------------------------------------------------- |
| human CLI              | command parsing and terminal presentation             |
| JSON CLI               | deterministic scripting presentation                  |
| console                | human visual presentation and interaction             |
| local MCP              | STDIO transport and local project/actor binding       |
| remote MCP             | Streamable HTTP transport and hosted identity binding |
| hosted HTTP API        | external/service integration transport                |
| schedulers/workers     | durable action triggering and progress handling       |
| AI-host plugins/skills | installation, workflow guidance, and optional host UI |

No adapter calls another adapter for business behavior.
Below CLI presentation, raw argv, nested Commander/product CLIs, child-CLI execution,
stdout/stderr interception, process-exit capture, terminal parsing, and parallel
command/action handlers are forbidden.

### Layer 5: optional managed platform

Logical hosted components:

- identity/authorization and workspace service
- project/site/environment registry
- connection and secret-custody service
- action/API gateway
- durable worker and scheduler
- artifact/activity/approval/receipt stores
- notification service
- metering, entitlement, billing, and support surfaces
- hosted console
- remote MCP endpoint

The initial production shape is one modular control plane deployed as an HTTP/MCP
gateway, worker role, and scheduler role. It uses a transactional durable system of
record, bounded object/artifact storage, durable dispatch, and managed secret/KMS
custody. These are logical deployment roles, not a requirement to create independent
services for identity, actions, providers, billing, or every list item.

The durable action path must support atomic admission and outbox dispatch, immutable
action/plan schema snapshots, compare-and-set state transitions, operation-level
receipts, provider identifiers, cancellation, retry classification, ambiguous-outcome
reconciliation, and dead-letter recovery. Provider execution is at-least-once; the
platform must not claim exactly-once behavior across an external API boundary.

Exact deployable/package boundaries are frozen only when workload, security, scaling, and
independent-deployment evidence justify them. Do not create a microservice per list item.

## User Journeys

### Developer and local agent

1. User opens an existing project.
2. User runs `unisane-ops init`.
3. User selects Growth/Cloud capabilities and local or managed connection mode.
4. CLI emits agent integration options without modifying unrelated AI-host settings.
5. User installs the chosen AI-host plugin or project-scoped MCP configuration.
6. Agent calls project-context/readiness tools and returns evidence-backed priorities.
7. Any protected change moves through plan, approval, apply, receipt, and verification.

### Marketer or founder

1. User signs into the hosted console.
2. User creates or joins a workspace and adds a project/site.
3. Guided onboarding connects Google/Meta and selects resources.
4. Overview explains data readiness and the most important priority.
5. User can ask the embedded/connected AI experience a plain-language question.
6. The answer links to the exact console analysis or approval page.

### Agency or multi-project team

1. User selects an explicit workspace, client project, site, and environment.
2. Connection identity and accessible resources remain visible.
3. Roles control read, plan, approve, apply, spend, and administration.
4. Scheduled checks create findings and notifications without automatic unsafe mutation.
5. Activity records human, agent, and service actions consistently.

### AI analysis example

User:

```text
Why did organic signups fall this week, and what should we fix first?
```

Expected tool flow:

1. resolve explicit project/site/environment and date context
2. check Google connection, resource selection, and freshness
3. retrieve bounded Search Console, analytics, conversion, and tracking evidence
4. distinguish data/access/instrumentation problems from real performance change
5. return no more than the most useful prioritized actions with impact and confidence
6. deep-link to the relevant SEO/Analytics page

### AI mutation example

User:

```text
Fix the broken production purchase conversion.
```

Expected tool flow:

1. inspect manifest, runtime, GTM/provider state, consent, duplicates, and freshness
2. produce a plan with exact project, environment, resource, and expected impact
3. require the correct human authorization/approval
4. apply idempotently under lock
5. emit and verify a receipt
6. report warming/no-signal state honestly rather than claiming immediate conversion data

The plugin or model may not skip a step or substitute conversational confirmation for an
engine-valid approval reference.

## MCP Product Contract

### Tool families

The initial tool inventory is designed by user goal:

| Family             | Example goal                                                                    |
| ------------------ | ------------------------------------------------------------------------------- |
| context            | identify current project, site, environment, capabilities, and connection state |
| readiness          | explain what is usable, blocked, warming, stale, or unsafe                      |
| priorities         | list evidence-backed work ordered by impact, confidence, and effort             |
| SEO                | audit visibility, queries, pages, technical health, and opportunities           |
| analytics/tracking | diagnose acquisition, events, conversions, consent, and duplicates              |
| advertising        | analyze campaigns/conversions and prepare guarded recommendations               |
| connections        | inspect grants/resources and start explicit connection recovery                 |
| change safety      | plan, inspect approval requirements, apply an approved plan, prepare rollback   |
| activity/jobs      | inspect progress, changes, receipts, schedules, and failures                    |

The first public tool ids are `review_growth_health`,
`research_seo_opportunities`, and `audit_growth_measurement`. New tools require a
separate scenario-backed Task and must preserve goal-oriented naming.
There must not be one generic `run_command` tool and there must not be a tool for every
CLI spelling.

### Local MCP

- runs through STDIO
- binds the explicit current project root
- receives one explicit project, environment, agent principal, and validated execution
  context from the embedding host
- works offline for offline actions
- does not expose arbitrary shell or filesystem operations
- does not silently enable itself globally
- rejects target mismatch, unknown instruction/config/credential fields, oversized
  results, and recognized secret material before returning data
- invokes public Growth workflow executors directly and never parses CLI output

### Remote MCP

- runs through Streamable HTTP over HTTPS
- binds authenticated actor, hosted `scopeId`, project, and environment
- uses OAuth discovery/scoped access for human clients
- supports explicitly admitted machine identity for CI/service use
- applies tenant isolation, quotas, rate limits, audit, and revocation
- returns durable job references for long operations

### Cross-host compatibility

Maintain a tested capability matrix for Codex/ChatGPT, Claude, Gemini, GitHub Copilot,
and later admitted clients:

- transports
- OAuth behavior
- tool schemas and structured output
- server instructions
- resources/prompts where relevant
- optional UI
- elicitation/approval UX
- asynchronous and long-running behavior
- tool-result size limits
- enterprise/admin controls

The shared tool contract targets the intersection needed for reliable operation.
Host-enhanced behavior is optional presentation, never required correctness.

The capability matrix has two proof levels. Contract profiles run deterministically
through the official MCP client without a model, provider, network, or proprietary host.
They prevent silent capability assumptions and remain reusable in CI. Real-host
certification is separately versioned evidence from an actual released host and binding,
covering installation, discovery, permissions, context limits, recovery, upgrade,
removal, and representative end-to-end workflows. Only the second level supports a host
compatibility claim.

## AI-Host Distribution

### Codex and ChatGPT

Ship an AI-host plugin that contains:

- Unisane Ops skills
- local or registered remote MCP wiring as supported
- clear installation/authentication metadata
- optional small UI only for selection, connection, review, or approval

Do not assume the plugin is available on every Codex/ChatGPT surface. Direct MCP remains
the neutral integration where supported.

### Claude

Ship a Claude AI-host plugin/marketplace entry with:

- equivalent safe workflow skills
- MCP wiring
- optional agents/hooks only for host-level workflow assistance

Claude-specific agents or hooks must not own Ops decisions or bypass permissions.

### Other hosts

Admit a new wrapper only when:

- the host reaches a real user segment
- MCP alone does not provide acceptable installation/discovery
- the host has a stable distribution/review path
- compatibility and security can be tested continuously

Do not create empty parity packages for every AI brand.

## Current Delivery Priority: Complete Local SEO Loop

The immediate product objective is not another hosted-runtime slice. It is one complete,
repeatable local SEO workflow over a real site and non-seeded evidence. Existing hosted
feasibility contracts remain available to prevent later architectural rework, but their
presence does not change current delivery priority.

The local sequence is:

1. **Project and site intake**: one install initializes an explicit project, site,
   environment, market, language, business outcome, and canonical measurement target.
2. **Evidence acquisition**: production-quality local adapters incrementally crawl and
   render the site, ingest authorized first-party search and analytics evidence, and
   acquire bounded keyword, SERP, and public competitor evidence through compliant
   sources.
3. **Evidence memory**: page, query, cluster, market, SERP, competitor, finding,
   opportunity, decision, publication, and verification records preserve provenance,
   freshness, confidence, limitations, and sample-data state without using chat as
   storage.
4. **Automatic preparation**: cheap deterministic synchronization, change detection,
   invalidation, and scheduled verification keep evidence ready. Broad research and AI
   synthesis remain user-requested or explicitly automated and budgeted.
5. **Conversational research**: local MCP and private skills let a user ask health,
   measurement, opportunity, competitor, page, and gap questions. The agent requests
   only the missing bounded actions and returns the shared structured result.
6. **Decision and preparation**: supported opportunities are ranked; the selected one
   produces a content brief or coding-agent implementation packet with target, evidence,
   constraints, acceptance criteria, safe next step, and measurement plan.
7. **Implementation handoff**: a coding agent or admitted local connector prepares the
   repository/CMS change without making Growth a second code or publication engine.
   Human review remains authoritative.
8. **Verification**: publication or an explicit external handoff is recorded, the
   declared measurement window is scheduled, and the workflow closes with a measured
   result, an honest no-change outcome, or a source-bound limitation.
9. **Economics and quality**: caching, incremental cursors, evidence TTLs, bounded job
   scope, retries, cancellation, usage accounting, hard ceilings, security, usability,
   and cross-surface parity are directly proven.

Local completion requires all nine steps to work together, not isolated demonstrations.
At least one real non-sample site must complete the loop from initialization to measured
verification through the canonical headless, CLI, console, local MCP, and private-skill
contracts. Skopos Tasks own the bounded implementation and closure evidence.

## Hosted Platform Capability Sequence

This sequence remains the accepted later architecture, not current implementation
authority. No item below may begin as product implementation until the local completion
gate closes and the exact SaaS confirmation is received.

### Managed foundation

- account/workspace onboarding
- project/site/environment registry
- managed provider OAuth and resource selection
- encrypted secret custody and rotation
- hosted action API and durable activity/receipt stores
- background job execution
- remote MCP

### Team operations

- invitations, membership, roles, and least-privilege grants
- read/plan/approve/apply/spend/admin separation
- multi-project and agency-safe switching
- approval inbox and change history
- environment promotion and production protections

### Continuous operations

- scheduled audits, sync, freshness, and drift checks
- alert routing and digest preferences
- retry/backoff/rate-limit coordination
- maintenance windows and change freezes
- job history, cancellation, replay-safe retry, and incident evidence

### Commercial and enterprise

- usage metering and transparent quotas
- plans, entitlements, billing, and spend controls
- data retention/deletion/export
- regional storage/processing policy
- SSO/provisioning and audit exports when admitted
- later controlled self-hosted/private-network deployment

Commercial features may gate hosted convenience and scale. They must not change the
meaning of portable project intent or silently weaken local package capability.

## Data And Identity Boundaries

| Data                                  | Canonical owner                                                  |
| ------------------------------------- | ---------------------------------------------------------------- |
| desired project intent                | source-controlled `unisane.config.ts`                            |
| local ignored observations/artifacts  | local artifact/state adapter                                     |
| provider credentials                  | provider-owned secret references and selected secret store       |
| hosted membership/authorization       | hosted identity/authorization service using `scopeId` internally |
| hosted projects/connections/resources | hosted control plane                                             |
| findings/readiness/next actions       | Ops engine projections                                           |
| approvals/receipts/activity           | engine contracts with selected durable stores                    |
| raw provider payloads                 | bounded provider/artifact storage under retention policy         |
| AI conversation text                  | AI host under disclosed policy; never secret storage             |

User-facing hosted language may say `Workspace`; internal tenant authorization remains
the canonical `scopeId`. Generic Ops project config does not inherit Framework tenancy.

## Roadmap Phases

These phases describe strategic dependency order only. They are not executable work
items, task identifiers, or a parallel readiness system. Each implementation increment
must be admitted, evidenced, and closed through a bounded Skopos Task.

### Local SEO end-to-end completion

1. close real-site intake, crawl/render, first-party provider ingestion, keyword/SERP
   acquisition, and public competitor evidence with explicit source limitations
2. close canonical evidence memory, freshness, invalidation, sample-data separation,
   bounded artifacts, and incremental reuse
3. extend the existing three pilots through page audit, content/page-gap analysis,
   competitor comparison, content brief, and implementation-packet outcomes without
   creating parallel workflow owners
4. prove agent-initiated targeted research, honest blocked/no-evidence results, async
   progress and cancellation, and one useful ranked decision
5. prove local implementation handoff, publication recording, verification scheduling,
   and measured or honest no-change closure
6. prove cost controls, usage accounting, security, usability, and headless/CLI/console/
   MCP/private-skill parity over one real non-sample site

Exit: the canonical local completion requirements in the Ops product architecture
baseline are closed with direct source-bound evidence.

Only at this exit may an agent show the exact confirmation prompt. Hosted implementation
remains blocked unless the user's complete trimmed reply is exactly:

```text
START UNISANE OPS HOSTED SAAS
```

Any other response is treated as no authorization. The agent continues local work or
stops; it does not infer SaaS permission from plan approval, `yes`, `continue`,
`proceed`, `next`, silence, or a paraphrase.

### Hosted-runtime feasibility spine

This phase records already completed feasibility proof and the accepted future hosted
shape. It is frozen while local SEO completion is active. Correctness and security
maintenance are allowed; new hosted product capability is not.

1. freeze the hosted principal, `scopeId`, project, connection, action request, immutable
   plan revision, approval, job, operation receipt, audit event, and retention boundaries
2. define the durable action state machine, atomic admission transaction, outbox/dispatch
   handoff, idempotency uniqueness, fencing/revision checks, and reconciliation behavior
3. define MCP resource authorization separately from provider OAuth grants and prohibit
   inbound-token passthrough to downstream providers
4. define hosted callback/session binding, envelope-encrypted provider token custody,
   rotation, revocation, and worker credential resolution
5. define the gateway/worker/scheduler topology, transactional store, artifact store,
   dispatch, observability, backup/restore, and incident ownership without selecting a
   microservice per capability
6. retain the completed SQLite transactional feasibility proof and private gateway and
   worker role composition: exact audience/principal/scope/action/evidence/idempotency
   binding, atomic queued job plus dispatch and audit, fenced execution, bounded result
   references, and expired-lease recovery across independent connections and restart
7. retain the completed standalone PostgreSQL and process-lifecycle proof: explicit
   migrations, transactional admission, competing `SKIP LOCKED` dispatch claims,
   retry/dead-letter classification, role readiness and structured observation,
   bounded polling, and graceful shutdown without a Framework dependency
8. retain the completed independent-artifact proof: separate gateway and worker Node.js
   executables, exact-issuer/audience OIDC workload identity, bounded private read HTTP,
   explicit action-module loading, schema-revision startup checks, payload-free telemetry,
   and real cross-process PostgreSQL admission-to-result execution with signal shutdown
9. retain the completed portable deployment foundation: one non-root production-closure
   OCI image with exact gateway, worker, migration, and probe commands; deployment
   secret-file resolution; migration-gated Kubernetes role templates; independent
   scaling, probes, resource and disruption bounds; and an isolated authenticated
   cross-container proof. Product action modules remain downstream immutable composition
10. retain the completed portable data-safety proof: OIDC principal, scope, and project
    claims constrain admission and PostgreSQL retrieval; distinct externally provisioned
    gateway and worker roles receive least-privilege grants; and a separate maintenance
    image performs credential-safe custom-format backup, fresh-database restore, and
    logical state comparison without expanding the application runtime image
11. retain the completed portable release-trust contract: one multi-platform BuildKit
    target attaches maximum SLSA v1 provenance and an SPDX SBOM; exact Cosign identity
    and issuer verification accepts only an image digest; migration, gateway, worker,
    and rollback-check workloads share that digest; and a candidate rollback image must
    pass its own schema-revision probe before runtime replacement
12. retain the portable read-scheduler contract: exact versioned read schedules,
    credential-free snapshots, fenced due claiming, atomic canonical job materialization,
    interruption recovery, and an independently deployable least-privilege timing role
13. retain the provider-neutral credential-custody contract: strict non-secret records,
    identity-bound encrypted envelopes, atomic rotation and revocation, exact active
    version resolution, short-lived worker use, and separate gateway/worker/scheduler
    database authority without a repository-owned development key store

Exit: the internal read-only contracts, transactional adapter, separate role composition,
production-database adapter, independent artifacts, OIDC authorization, project-isolated
retrieval, least-privilege runtime database roles, internal transport, portable
OCI/Kubernetes deployment foundation, logical backup/restore, release attestations,
signature policy, digest locking, schema-aware rollback preflight, process lifecycles,
and interruption/retry proof are current. This phase remains open until a managed
deployment proves identity provisioning and secret custody, provider PITR and encrypted
backup custody, real registry signing identity and admission enforcement, safe
rollout/rollback, infrastructure-level tenant isolation, and incident ownership.

### Guided workflow, action contract, and adapter parity

1. inventory current Help guidance, conversation starters, command descriptors,
   findings, actions, effects, evidence, and async behavior
2. freeze the internal Growth goal/playbook descriptor and engine-owned workflow-run,
   context-brief, decision, handoff, and verification contracts
3. freeze `@unisane/ops-engine/actions` and require playbooks to reference registered
   actions rather than invoke adapters or provider SDKs
4. make CLI human/JSON and console state lower from the same action/playbook truth
5. add bounded output, provenance, evidence invalidation, pagination, job, error,
   approval, receipt, verification-window, and deep-link contracts
6. prove no adapter-to-adapter execution and no prompt/help/checklist workflow owner

Exit: the Growth health review, SEO opportunity research, and measurement-audit pilots
produce equivalent goal-to-verification state across headless, CLI/JSON, and console
projections, with action parity, evidence invalidation, resumable handoff, plain-language
presentation, and mutation-safety proof. Cloud remains action-contract compatible
without being forced into Growth-specific playbooks.

The pilots are selected by reasoning shape, not by feature-page vocabulary: health
review proves diagnosis and recovery, SEO research proves multi-source opportunity
synthesis without invented demand, and measurement audit proves trust gating before
optimization or spend advice. The first controlled mutation is the headless
`growth.ads.campaign.pause` pilot because pausing one explicit campaign is reversible,
prevents further spend, and exercises the complete protected lifecycle without implying
permission to launch, increase budget, or mutate arbitrary provider resources. Its first
proof adds exact-plan approval, an immutable receipt, ambiguous-outcome reconciliation,
and delayed verification without weakening the read-only contracts. Local CLI and MCP
exposure are now proven. The local non-production console can record exact-plan human
approval only; it still cannot apply or verify. Production, remote, and hosted mutation
exposure remain subsequent work.

### Local MCP and agent evaluations

1. maintain `@unisane/ops-mcp` as the protocol adapter without absorbing host or provider
   composition
2. retain STDIO transport and explicit project-scoped configuration as the only current
   transport
3. retain the three goal-oriented read tools and the four separately annotated
   campaign-pause lifecycle tools; never add an agent approval tool or generic provider
   command
4. retain actor-scoped context briefs and stateless resumable handoffs without raw
   transcript, secret, unrelated-account leakage, or a second persistence authority
5. retain deterministic Codex, Claude, Gemini CLI, and CI contract profiles over the
   official MCP client; never label profile success as host certification
6. retain prompt-injection, secret, wrong-target, actor/workflow replay, stale-evidence,
   oversized-result, missing-approval, approver/executor separation, duplicate-apply,
   and verification tests
7. add structured pagination before a workflow result can exceed the current bounded
   catalog
8. certify each real host and binding separately against named released versions,
   installation/removal, permissions, context limits, and representative workflows

Exit: the shared contract is continuously proven offline and every claimed supported
host has separate end-to-end evidence that agents complete representative audits and
prepare safe plans without parsing CLI text or receiving raw secrets.

### Local/private AI-host bindings

1. retain the completed thin skill bindings for the three read workflows and one
   controlled campaign pause, including exact context, effect ceilings, approval
   separation, verification timing, and console or CLI review links
2. retain the completed repository-local Codex configuration binding, private plugin,
   and marketplace over project-scoped STDIO MCP without adding another runtime owner
3. build an equivalent private Claude binding only where the host supports the evaluated
   local workflow
4. add install/select-project/recovery/resume guidance and state clearly that hosted,
   team, and public-directory availability is not yet provided
5. validate host-specific manifests, permissions, upgrade, removal, and context budgets
6. add optional small UI only after headless tool success

Exit: a developer can install a private/local binding, select the correct project, run
an audit, and understand a safe next action in each supported host without a remote
service or public marketplace claim.

### Managed control-plane foundation and remote MCP

1. implement the hosted-feasibility identity, `scopeId`, project, connection, action,
   job, audit, and retention boundaries without changing the frozen guided-workflow
   action meaning
2. build managed OAuth/secret custody and an authenticated hosted action gateway
3. add transactional durable stores, artifact storage, outbox dispatch, workers, and a
   scheduler with versioned job/action snapshots
4. expose authenticated remote MCP and HTTP actions with audience validation and no
   provider-token passthrough
5. prove at-least-once execution, idempotency, partial/unknown-outcome reconciliation,
   cancellation, dead-letter recovery, revocation, quotas, and provider rate limits
6. prove tenant isolation, audit reconstruction, backup/restore, retention/deletion,
   observability, process interruption recovery, and safe deployment rollback

Exit: a remote agent can perform authorized read/plan operations and only approved
mutations without a developer machine remaining online.

### Team console and continuous operations

1. add workspaces, members, roles, invitations, and approval inbox
2. add multi-project/agency navigation
3. add schedules, alerts, job history, and notification preferences
4. connect the same console pages to hosted actions and durable history
5. preserve the normal-user-first console information hierarchy

Exit: a non-technical team can operate recurring Growth/Cloud workflows safely.

### Commercial, marketplace, and enterprise readiness

1. usage metering, plans, entitlements, quotas, and billing
2. build and submit public hosted AI-host plugins only against the production remote MCP
   endpoint, with maintained host compatibility, accurate tool/effect annotations, and
   installation/authentication/removal support
3. retention, export, deletion, audit, SSO/provisioning, and regional controls
4. evaluate controlled self-hosted/private-network demand
5. publish support, incident, deprecation, and compatibility policies

Exit: hosted distribution is supportable as a real product rather than a demo control
plane.

## Dependency And Sequencing Rules

- Action, readiness, and connection contracts must stabilize before guided workflows
  freeze external action semantics.
- The existing console architecture owns UX; the team-console phase hosts it and adds
  team capabilities without creating another design system or route hierarchy.
- The team/CI credential lifecycle informs managed control-plane requirements; its
  implementation remains owned by bounded Skopos Tasks.
- Hosted feasibility constrains hosted execution before guided workflows freeze public
  action semantics; it does not make hosted behavior current product truth or authorize
  broad infrastructure work.
- Further hosted product work requires both closed local SEO end-to-end evidence and the
  exact user confirmation `START UNISANE OPS HOSTED SAAS`; either condition missing is a
  hard stop.
- Local MCP may ship before SaaS.
- Local/private AI-host bindings may ship over evaluated STDIO MCP before SaaS. Public
  hosted plugin listing waits for managed-control-plane production gates and commercial
  release readiness.
- Remote MCP requires hosted identity, authorization, secret custody, audit, and rate
  limiting.
- AI-host plugins must not ship mutation tools before the action approval/receipt
  contract is executable.
- Commercial work begins only after local/MCP/hosted workflow value is proven.
- The three Growth pilots must prove the playbook and context model before a broad
  playbook catalog, autonomous recommendations, or surface-specific skills are added.
- The console may render canonical playbook guidance in Help and feature pages after the
  guided-workflow model is frozen; it must not preserve hardcoded guidance as a second
  owner.

## Security And Abuse Model

Required threat coverage:

- prompt injection attempting to change project, environment, or resource
- model confusion between similarly named client accounts
- credential exfiltration through arguments, results, errors, logs, or receipts
- cross-`scopeId` reads or writes
- replayed approval or apply requests
- stale plan, changed resource, revoked access, and expired approval
- advertising overspend or unintended production publication
- malicious MCP server/client metadata
- oversized/provider-controlled output used to overwhelm context
- compromised AI-host plugin, hook, or marketplace update
- job duplication, partial provider outcome, and retry ambiguity

All protections are executable engine/host rules. Skill text and model instructions are
defense-in-depth, not the authorization boundary.

## Evaluation And Release Gates

### Scenario evaluations

- founder asks why purchases declined when store orders and ad-platform conversions
  disagree
- SEO specialist asks where to focus next and receives recorded research rather than
  unsupported brand assumptions
- marketer asks whether campaign spend can be increased and is first routed through a
  measurement audit when canonical outcomes are missing
- new local developer project
- existing production SaaS with duplicate tracking
- SEO-only audit with no provider mutation
- marketer using only hosted console
- Codex and Claude analysis from the same project evidence
- agency switching between similar client accounts
- partial Google grants and multiple resources
- revoked user connection and service credential rotation
- scheduled stale-data alert
- approved Ads/tracking change with receipt and verification
- denied mutation due to missing permission, approval, freshness, or changed target

### Structural gates

- one action owner and one schema version registry
- zero adapter-to-adapter business execution
- zero raw-argv action APIs, nested product CLIs, output/process interception, or
  terminal parsing below presentation
- zero provider SDK imports in UI/MCP/plugin packages
- zero raw secret/token tool fields
- zero unapproved mutation paths
- zero second config/readiness/receipt owner
- exact local/remote shared-tool parity
- exact actor/`scopeId`/project/environment/resource audit context
- zero Framework implementation dependencies in Ops core/default install and
  descriptor-only optional integration
- zero provider or remote-state mutations in Framework Compiler/Devtools

### Product gates

- first-time user can discover what Unisane can do without learning command ids
- a user can begin with a natural business question without manually creating workflow
  records or learning engine vocabulary
- ordinary UI consistently answers what happened, why it matters, what to do next, and
  whether the result has been verified
- Help, feature guidance, conversation starters, and agent skills resolve from the same
  versioned playbook truth
- summary and recommendation copy remains concise; provenance and methodology use
  progressive disclosure without hiding required warnings or recovery
- project/site/environment is visible before analysis or action
- agent output names evidence freshness and uncertainty
- every blocked action gives one understandable recovery step
- dense analysis deep-links to the console instead of flooding the conversation
- installation, authentication, permission, revocation, and removal are understandable
- no AI-host plugin term is confused with a Framework plugin or Ops pack

### Operational gates

- bounded latency and payload budgets per action/tool family
- cancellation and retry behavior for long-running jobs
- atomic action admission and source-bound durable dispatch
- process-interruption, duplicate-delivery, partial-outcome, and ambiguous-outcome
  reconciliation proof
- provider quota/rate-limit coordination
- audit retention and incident reconstruction
- tenant-isolation and cross-project denial proof
- encrypted provider-token rotation and revocation proof
- backup/restore, disaster-recovery, retention, deletion, and dead-letter recovery proof
- gateway/worker/scheduler health, tracing, metrics, alerts, and operator runbooks
- compatibility matrix tested against supported host versions
- versioned deprecation and migration policy for action/tool contracts

## Success Measures

Track outcomes rather than feature count:

- time from installation/sign-in to first trustworthy finding
- time from a plain-language business question to one understandable next step
- percentage of started pilot workflows that reach a recorded decision or honest
  no-change outcome
- percentage of applied changes revisited at the declared verification window
- rate of repeated research or context reconstruction after a valid handoff
- percentage of onboarding completed without manual provider identifiers
- rate of incorrect project/resource selection
- percentage of agent answers containing usable freshness/evidence context
- plan-to-approval and approval-to-verified-result completion
- mutation denial correctness and duplicate-apply prevention
- support burden for connection, permission, and tool-discovery failures
- scheduled workflow reliability and alert usefulness
- cross-surface parity failures
- retained local-only, agent, and hosted active usage

Targets are established from baseline usability and production evidence; do not invent
arbitrary success thresholds in planning.

## Non-Goals

- no general-purpose autonomous marketing agent
- no LLM training/fine-tuning program as a prerequisite
- no AI-generated provider truth or readiness
- no full console duplicated inside every chat product
- no provider-specific MCP server per Google service
- no generic remote shell/command MCP tool
- no mandatory SaaS account for local audits
- no immediate microservice split
- no empty plugin packages for unsupported AI hosts
- no compatibility aliases or runtime dual implementations
- no visible project-management vocabulary or mandatory workflow setup for read-only
  exploration
- no raw conversation transcript as durable Growth truth
- no large speculative catalog of playbooks before the three pilots are evaluated

## Documentation And Lifecycle

When implementing any roadmap phase:

1. start one bounded Skopos Task with explicit acceptance, ownership, risk, and Guards
2. keep this plan at strategy level
3. update the Finding and link the owning Task
4. update MCP security and command workflow docs when executable behavior changes
5. update package READMEs and generated references in the same cut
6. let Skopos archive completed Task records and remove dead planning duplication
7. never teach target installation or tool ids before implementation proof
