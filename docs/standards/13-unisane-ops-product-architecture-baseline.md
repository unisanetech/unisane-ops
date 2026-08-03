---
id: 'DOC-2653e0fd8941'
owner: 'unisane'
scope: workspace
role: standard
lifecycle: durable
authority: canonical
provenance: accepted
view: current
---

# Unisane Ops Product Architecture Baseline

Canonical product, package, repository, command, and extension boundaries for Unisane Ops.

## Changelog

- `2026-08-04`: Added independently runnable authenticated gateway and worker artifacts
  for the private hosted read spine. The gateway exposes a bounded internal HTTP
  transport, verifies OIDC bearer identity against one exact issuer and audience, and
  retains admission-only authority; the worker loads an explicit action module and
  retains execution-only authority. Both fail closed on schema drift, emit payload-free
  lifecycle telemetry, and honor bounded signal shutdown. A real PostgreSQL integration
  proof starts the roles as separate operating-system processes and exercises admission,
  dispatch, execution, retrieval, and shutdown. This is not remote MCP, managed OAuth or
  secret custody, backup/restore certification, scheduler deployment, or hosted mutation.
- `2026-08-03`: Added standalone PostgreSQL persistence and role-process lifecycle
  contracts for the hosted read spine. Explicit migrations, database transactions,
  `SKIP LOCKED` dispatch claims, fenced job leases, retry/dead-letter classification,
  readiness, structured observation, bounded polling, and graceful shutdown preserve
  the same engine semantics without depending on the Unisane Framework. This proves
  the production-database and process-composition boundaries, not managed identity,
  remote transport, backup/restore operations, or public hosted readiness.
- `2026-08-03`: Proved the first hosted read spine through real SQLite transactions and
  separate gateway and worker roles. The private hosted-runtime composition authorizes
  and admits without inline execution; independently connected workers claim through
  revision and fencing, persist bounded result references, and recover expired leases
  after restart. SQLite remains a reproducible feasibility adapter, not the selected
  production database or a hosted transport/deployment claim.
- `2026-08-03`: Added the internal durable hosted read-action spine. A strict admission
  contract binds the Unisane audience, authenticated principal, `scopeId`, project,
  environment, action/schema version, evidence revision, and idempotency identity;
  one atomic durable port records the queued job, dispatch intent, and audit fact.
  Workers claim with revision and fencing, store only bounded result references or
  safe structured failures, and may requeue only expired leases. This is an internal
  engine proof, not a remote route, SDK surface, secret-custody system, or deployment.
- `2026-08-03`: Added the first human-facing local console approval surface for the
  exact campaign-pause plan. One same-origin, POST-only host action records approval
  through the canonical Growth workflow and returns the shared review projection. The
  browser receives no store, policy, provider, apply, or verify capability; malformed,
  cross-origin, stale, conflicting, and changed-plan requests fail closed, and approval
  explicitly produces no provider effect.
- `2026-08-03`: Certified the private campaign-pause skill's planning and approval
  boundary in a fresh and resumed Codex CLI `0.146.0-alpha.9.2` task. The host loaded
  the cache-busted fourth skill, planned one exact non-production campaign, preserved
  no-effect guidance, and rejected chat-only approval after canonical review without
  calling apply. Approved apply, provider verification, desktop lifecycle, remote MCP,
  and public distribution remain separate gates.
- `2026-08-03`: Added the fourth private Codex workflow skill for one exact campaign
  pause. The skill sequences plan, human approval guidance, canonical review,
  apply-approved, and verify over the existing project binding. It cannot approve,
  accept secrets, infer identifiers, retry an ambiguous provider write, or claim hosted
  durability. The plugin validator now freezes all four skills and the seven-tool MCP
  ceiling together.
- `2026-08-03`: Added the first controlled local MCP action surface for the exact
  campaign-pause lifecycle. Four tools separate plan, review, apply-approved, and
  verify; MCP exposes no approval authority. The canonical host composes the same
  Growth workflow, policy, stores, connection resolution, and provider operations used
  by CLI. Contract profiles prove exact target binding, external human approval,
  agent-attributed receipts, idempotent replay, and verification. Local development
  state is not a production durability claim.
- `2026-08-03`: Completed the first local controlled Growth mutation workflow. One
  headless service and five separate CLI leaves now plan, show, approve, apply, and
  verify a campaign pause against one canonical run record; exact plan and target
  confirmations, provider-specific operations, immutable receipts, verification
  windows, and local-only admission remain shared across human, JSON, and read-only
  console presentation. Meta execution remains fail-closed until its canonical
  connection lifecycle exists.
- `2026-08-03`: Added the canonical local lifecycle run record for the controlled
  campaign-pause action. Ops engine owns a versioned optimistic-concurrency store port
  with bounded contextual reads and explicit local-versus-durable admission; Growth
  owns the strict action-state payload and transition coordinator; the console loads the
  shared derived review from that record instead of scanning approval or receipt files.
- `2026-08-03`: Added the first read-only console presentation for the controlled
  campaign-pause lifecycle. Growth validates and injects its shared derived review
  projection into console state; the Advertising campaigns view presents exact target,
  effect, evidence, approval, receipt, verification, and one safe next step without
  reading safety stores, reconstructing policy, or exposing mutation controls.
- `2026-08-03`: Certified the three private Growth skills end to end in fresh and
  resumed tasks on Codex CLI `0.146.0-alpha.9.2` using a trusted local Git repository,
  the project-owned STDIO binding, and the repository-local plugin. The named host
  selected each exact tool, requested ambiguous target context, preserved bounded and
  blocked/no-evidence outcomes, recovered from a missing binding, and resumed the same
  health workflow without timestamp-only invalidation. This is private local
  development evidence only; desktop lifecycle, public distribution, remote MCP,
  hosted identity, other versions/models, and SaaS support remain separate gates.
- `2026-08-03`: Added the first private Codex skill distribution. The repository-local
  `unisane-local` marketplace exposes one `unisane-ops` plugin with exactly three
  goal-specific skills over the frozen read-only MCP tools. It contains no MCP server,
  app, hook, provider behavior, target, credential, mutation, or workflow owner. Official
  plugin/skill validation, a project-owned drift gate, and reversible installed-CLI
  install/discovery/removal are current evidence; new-thread/model workflow certification
  remains separate.
- `2026-08-03`: Added the safe Codex project binding. The canonical CLI previews by
  default and writes or removes only one marked `mcp_servers.unisane_ops` block with an
  explicit `--write`; unrelated `.codex/config.toml` content is preserved, the project,
  environment, actor, and three-tool ceiling are exact, and the installed Codex CLI has
  accepted and discovered the generated local server. This is local binding evidence,
  not universal host or model certification.
- `2026-08-03`: Added deterministic local MCP agent contract evaluations for the three
  frozen Growth workflows. Codex, Claude, Gemini CLI, and CI are represented as explicit
  capability profiles over the official MCP client; this proves the shared contract,
  bounded context, guidance, resume, and hostile-input boundaries without claiming
  proprietary host/version certification.
- `2026-08-03`: Made local MCP handoffs executable without adding a fourth tool or a
  second state owner. Each frozen Growth tool accepts its own prior structured handoff,
  re-runs current evidence under the same bound project, environment, workflow, and
  actor, then returns `resumable`, `run-changed`, or `evidence-changed`. Handoffs retain
  strict bounded references only; actor/target/workflow replay and transcript or secret
  fields fail before Growth execution.
- `2026-08-03`: Added the first project-scoped local MCP surface. `@unisane/ops-mcp`
  exposes exactly the three proven Growth workflows through verb-first read-only tools,
  official STDIO transport, explicit project/environment/agent binding, direct public
  executor calls, strict bounded schemas and results, and fail-closed target and
  sensitive-output checks. It owns no config loading, provider access, shell/filesystem
  capability, mutation, remote transport, or hosted identity.
- `2026-08-03`: Removed legacy program/workstream identifiers from current Ops
  architecture language. Descriptive roadmap phases communicate dependency direction;
  Skopos remains the sole authority for executable Tasks, sequencing, Evidence,
  Readiness, and closure.
- `2026-08-03`: Completed Growth health-review cross-surface lowering. One
  capability-aware artifact executor now feeds the existing action; CLI JSON, CLI human
  output, console Overview diagnosis, readiness label, primary finding, recovery step,
  bounded findings, and freshness all use the same action-owned result. This completes
  headless/CLI/console parity for the three guided read-only pilots.
- `2026-08-03`: Lowered SEO opportunity research across headless execution, CLI JSON,
  CLI human output, and the console Opportunities route. One artifact-backed executor
  feeds the existing action-owned ranking and preserves confidence, limitations,
  provenance, bounded results, freshness, and blocked states on every surface.
- `2026-08-03`: Landed the first guided-workflow cross-surface slice. The measurement
  audit now maps existing tracking, confirmed-conversion, and provider artifacts through
  one action executor; CLI JSON, CLI human output, and console tracking health consume
  the same workflow result and presentation without duplicating trust decisions.
- `2026-08-03`: Completed the three-workflow read-only foundation. Measurement audit now
  reuses the canonical tracking audit, keeps canonical outcomes separate from
  provider-attributed conversions, exposes freshness and limitations, bounds comparison
  output, and blocks scaling guidance when measurement trust is not ready.
- `2026-08-03`: Landed the second guided-workflow pilot. SEO opportunity research now
  ranks only recorded keyword, market, competitor, SERP, and page signals; preserves
  absent demand, confidence, limitations, provenance, bounded results, and resumable
  deep-linked review; and reuses the shared Ops workflow contract.
- `2026-08-02`: Removed the Framework root regeneration alias from the one-CLI
  contract. `unisane app compile --write|--check` is the sole executable app compiler;
  `dev` and `build` orchestrate it, while provider state, local Project Memory, and
  diagnostics remain explicit specialist commands.
- `2026-08-02`: Landed the first guided-workflow pilot: Growth owns the versioned
  health-review goal/playbook and shared plain-language projection, while Ops engine
  owns bounded actor-scoped run, context-brief, evidence-invalidation, handoff, and
  resume contracts over the existing `growth.health.review` action.
- `2026-08-02`: Defined the install and distribution boundary: no package installation
  for hosted users, one thin integration for agent users, one CLI entrypoint for local
  developers, and direct technical-package installation only for SDK integrators.
  Internal modularity and repository extraction must not leak into ordinary setup.
- `2026-08-02`: Added the hosted runtime baseline: modular gateway/worker/scheduler
  deployment, transactional action admission, durable dispatch, at-least-once provider
  execution and reconciliation, separate MCP/provider identities, managed secret
  custody, and distinct local/private versus public hosted plugin releases.
- `2026-08-02`: Added the human-first Growth guidance and agent-workflow contract:
  real-world goals and playbooks lower to the existing action/evidence/readiness engine,
  all surfaces share one evidence-bound context brief, and ordinary UI uses concise
  outcome/reason/next-step language instead of exposing workflow internals.
- `2026-07-30`: Defined the console presentation implementation boundary: a minimal
  server-rendered boot document, external browser assets, route-owned React screens,
  and first-party flat `@unisane/ui/*` components and defaults. Inline application
  runtimes, embedded style systems, monolithic renderers, and duplicate local component
  foundations are prohibited.
- `2026-07-30`: Clarified the SEO decision hierarchy: Research opens on ranked focus
  areas while retaining the complete keyword matrix as a progressive explorer, and
  Site health accepts only explicit technical discoverability failures rather than
  content-strategy or research-alignment notes.
- `2026-07-30`: Landed the Ops adoption foundation: one lifecycle, canonical
  Growth intent, shared readiness/action contracts, one Provider Google connection
  lifecycle, one-shot migration with retired-schema runtime rejection, and no replaced
  setup/auth/config/token/readiness owner.
- `2026-07-29`: Made the clean cut delete-first and slice-local: each replacement slice
  removes its retired owner and all residue before the next begins; the final release
  stage aggregates proof and never serves as a legacy-cleanup phase.
- `2026-07-29`: Finalized the SEO six-tab ownership and detailed Connections behavior:
  one provider card, independently truthful Google services, full connection detail,
  incremental grants, explicit disconnect consequences, and no unavailable-provider
  presentation.
- `2026-07-29`: Selected one transport-neutral Ops action contract behind package,
  CLI, console, local/remote MCP, thin AI-host plugins, automation, and an optional
  managed SaaS host. Routed staged implementation through the AI-native and hosted plan
  without claiming unimplemented tools, plugins, or hosted behavior.
- `2026-07-29`: Namespaced existing-project Ops adoption as `unisane ops init` and
  prohibited a bare `unisane init` alias. This keeps Ops adoption visibly separate from
  Framework application creation through `create-unisane` without changing the
  capability-first Growth, Cloud, provider, or aggregate diagnostic commands.
- `2026-07-29`: Finalized the normal-user-first Growth console contract with the grouped
  sidebar, exact retired-route disposition, strict primary/secondary/diagnostic/delete
  content classification, accessible simple-English contextual help, and prohibition on
  a parallel expert dashboard or presentation fallback.
- `2026-07-29`: Added the human-first Growth console baseline: capability-oriented
  navigation, one Connections hierarchy, consistent page anatomy, plain-language states,
  progressive technical disclosure, non-duplicative contextual detail, and direct
  accessibility proof.
- `2026-07-29`: Added the target Growth onboarding/readiness contract and routed its
  implementation as a coordinated major-release clean cut with no command,
  config, auth, token-env, readiness, or console fallback.
- `2026-07-25`: Completed the public command-host cut: AWS, Google, and Meta own sealed
  provider packs; Growth owns GTM presentation; Framework Ops owns UI routing; the
  canonical host fails closed without a Devtools fallback or dependency; and Devtools
  publishes only the internal `unisane-devtools` executable.
- `2026-07-25`: Established `@unisane/growth` as the complete Growth command-pack owner:
  canonical `unisane growth ...` routing, explicit legacy-root aliases, embedded-safe
  execution, host-injected Google/Meta bindings, and Growth-owned marketing-console
  presentation. Google account-discovery transport now lives in Provider Google.
- `2026-07-25`: Established `@unisane/framework-ops` as the optional static Framework
  command pack, exposed the narrow `@unisane/devtools/framework-integration` bridge, and
  added exact core reserved-root contributor bindings. Growth/provider/UI fallback and
  duplicate-binary retirement remain later terminal work.
- `2026-07-25`: Admitted `@unisane/provider-meta` as one provider family for saved
  connection profiles, Graph discovery/inventory, Ads reporting, asset upload, and
  guarded campaign management. Growth retains strategy and safety; Meta CAPI remains in
  Web Runtime.
- `2026-07-25`: Moved Google Ads live campaign mutation to
  `@unisane/provider-google/marketing` behind a Growth-owned injected executor contract.
  Growth retains plan validation, confirmations, approvals, locking, blocking, and
  receipts; Meta live execution remains admission-gated and transitional.
- `2026-07-25`: Moved Google Ads, GA4, and Search Console report transports to
  `@unisane/provider-google/marketing` behind a Growth-owned injected driver contract.
  Growth retains normalization, caching, reporting, and policy; Meta remains governed by
  its separate provider-admission requirement.
- `2026-07-25`: Moved the complete headless marketing control plane to
  `@unisane/growth/marketing`: configuration, schemas, registries, normalized reporting,
  research, recommendations, experiments, audits, discovery/proof state, and ads
  planning/policy/apply. Devtools retains command and console composition; provider API
  transport distribution remains the next explicit extraction boundary.
- `2026-07-25`: Moved the complete provider-neutral SEO research domain to
  `@unisane/growth/seo` and Google OAuth/GA4/Search Console/Keyword Planner execution to
  `@unisane/provider-google/seo`. Devtools now retains SEO command composition only.
- `2026-07-25`: Established `@unisane/growth` with provider-neutral GTM contracts,
  manifest authoring, recipes, validation, policy, normalized desired state, and
  deterministic planning. Google transport and remote lifecycle execution now live at
  `@unisane/provider-google/gtm`; the former combined adapter is compatibility-only and
  first-party manifests use Growth.
- `2026-07-25`: Established public `@unisane/web-runtime` with explicit tracking,
  React/Next, conversions, Google Ads, Meta, SEO/Next, contracts, and testing subpaths.
  Five former Framework package coordinates now contain compatibility exports only,
  first-party consumers use the canonical package, and permanent checks protect the
  implementation, optional-peer, pure-SEO, consumer, and generated-owner boundaries.
- `2026-07-25`: Established `@unisane/provider-google` as the shared Google OAuth,
  project/API lifecycle, readiness, and GTM/GA4/Search Console/Ads discovery owner.
  Devtools retains Google command registration only; GTM publishing and Growth workflows
  remain later extraction slices.
- `2026-07-25`: Recorded the first AWS provider-family extraction: all proven AWS
  config, credential, SDK, inventory, planning, apply, audit, IAM, receipt, and report
  behavior now lives in `@unisane/provider-aws`; shared contracts live at
  `@unisane/cloud/aws-contracts`; Devtools retains compatibility registration only.
- `2026-07-25`: Completed the represented Cloudflare capability family through guarded
  Queue/Worker/Cron apply. Cloud owns the safety-bound workflow and receipts,
  Cloudflare owns transport, the canonical host owns local composition, and Devtools
  retains only public compatibility consumers. Durable production/automation state is
  still a separate engine-host capability.
- `2026-07-25`: Extended the canonical Cloud surface with account/zone/Queue/Worker/Cron
  inventory, offline Queue/Worker/Cron planning, redacted environment output, readiness,
  canonical desired state, and exact expert aliases. Devtools now consumes these owners;
  remote non-DNS mutation remains blocked on engine-grade durable safety.
- `2026-07-25`: Extended the first Cloud vertical with offline selected-inventory import,
  exact expert Cloudflare DNS aliases, and provider-owned read-only connection
  verification/account-zone discovery. The commands work from plain projects, keep
  credentials in environment references, and do not rewrite configuration during import.
- `2026-07-24`: Recorded the first live capability-first commands:
  `unisane cloud dns inventory|plan|apply`. Cloud owns provider-neutral workflow and
  handlers, Cloudflare owns transport, the canonical host owns exact root-config/runtime
  composition, plan is offline from explicit inventory, and Devtools is compatibility
  only for the migrated DNS slice.
- `2026-07-24`: Established one Unisane product taxonomy, CLI, Ops engine, suite, provider-family, Web Runtime, config, extension, dependency, six-repository target, and time-bounded extraction-exception contract before implementation begins; clarified suite naming, manifest trust/collision handling, executable-config trust, contract-only provider dependencies, staging, and post-cutover repository authority.

## Status And Authority

This document defines the target architecture. The canonical CLI, engine, Cloud package,
Cloudflare, AWS, and Google provider packages, Growth and Web Runtime packages, the GTM
domain/provider implementation split, direct Cloud DNS commands, Cloudflare resource
inventory/readiness/environment commands, Queue/Worker/Cron plan/apply, expert aliases,
offline DNS import, and read-only connection checking now exist under `unisane-ops/**`.
The admitted resource apply host is local, non-production, and single-developer only.
The headless marketing control plane, SEO research, GTM presentation, and console state
are Growth-owned. Google
measurement, keyword, marketing-report transport, and live campaign mutation execution
are Provider-Google-owned. Provider Meta currently exposes transport implementation
only; it has no advertised provider CLI or canonical connection adapter, so Meta-backed
Growth operations fail closed before credentials are needed. Growth selects no provider
implementation; the command host injects exact provider contracts.
Devtools retains only thin compatibility registrars for migrated provider and Growth
roots; it does not own their implementations or canonical runtime composition.
Remaining cloud commands inside `@unisane/devtools` remain transitional implementation
state, not target-package proof.
The canonical `unisane` host loads exact sealed packs for Cloud, Growth, AWS, Cloudflare,
Google, and optional Framework commands. It has no Devtools dependency or catch-all
subprocess fallback. Devtools publishes only `unisane-devtools`.

The Ops adoption, Growth config, Google connection, and aggregate readiness lifecycle is
current executable state. Instrumentation reconciliation, console separation, and the
team/CI credential lifecycle remain admitted target state and must not be taught as
implemented before their owning Skopos Tasks close with direct acceptance Evidence.

The three guided-workflow pilots are executable through
`@unisane/growth/playbooks` and `@unisane/ops-engine/workflows`. It covers the Growth
health-review, SEO opportunity-research, and measurement-audit goals, exact
action-reference integrity, bounded plain-language projections, actor-scoped context,
evidence-revision handoff, invalidation, and resume. Health review, measurement audit,
and SEO opportunity research now prove headless, CLI JSON/human, and console
presentation lowering from the same action-owned results. The first local
`@unisane/ops-mcp` adapter now exposes these three results over project-scoped STDIO;
AI-host bindings, cross-host evaluations, remote MCP, and production workflow
persistence remain target state.

Local resume is stateless and evidence checked. A client passes the structured handoff
returned by the same tool; the adapter validates its goal, playbook, project,
environment, target, and principal before execution, preserves the run identity, and
compares refreshed evidence revisions through the engine-owned resume contract. It does
not accept conversation history, transfer authority to another actor, or claim durable
cross-device workflow storage. Authorized actor transfer and durable team history
remain hosted workflow concerns.

This document owns:

- product and suite names
- package and target-repository boundaries
- public CLI namespaces
- extension and pack taxonomy
- config export shape
- package dependency direction

The provider control-plane safety lifecycle is owned by `12-provider-control-plane-baseline.md`.

## Product Map

`Unisane` is the brand. It is not a synonym for the Framework.

| Product             | Responsibility                                                                |
| ------------------- | ----------------------------------------------------------------------------- |
| Unisane Framework   | Platform-grade framework for composing vertical applications and platforms    |
| Unisane Ops         | Stack-neutral engineering operations product                                  |
| Unisane Ops Cloud   | Cloud infrastructure, delivery, environment, and provider operations suite    |
| Unisane Ops Growth  | Analytics, acquisition, SEO, tagging, conversion, and growth operations suite |
| Unisane Web Runtime | Application-runtime tracking, conversion, SEO, and testing primitives         |
| Unisane UI          | UI system, tokens, components, and related developer surfaces                 |

The Framework's initial enterprise B2B SaaS/platform focus is its go-to-market wedge. It does not limit the Unisane brand, Unisane Ops, Web Runtime, or UI to Framework projects.

The formal suite names are **Unisane Ops Cloud** and **Unisane Ops Growth**. `Cloud` and `Growth` are acceptable shorthand after the Unisane Ops context is established; `Unisane Cloud` and `Unisane Growth` are not separate products.

## Adoption Contract

Unisane Ops must be useful to an existing website or service that does not use Unisane Framework.

Adoption progresses without forced migration:

1. `Observe`: inspect and report without changing the project or provider.
2. `Connect`: establish explicit provider connections and discover resources.
3. `Adopt`: add desired state for selected capabilities.
4. `Manage`: plan, apply, receipt, and detect drift.
5. `Automate`: run approved policy-driven workflows in CI or scheduled environments.

Framework integration is optional. Unisane Framework must not depend on Unisane Ops. `@unisane/framework-ops` is the adapter between the two products.

## Growth Onboarding And Readiness Contract

> Target steady state: Skopos Tasks own implementation and closure. The current Growth
> how-to and live pack manifests remain command truth until the clean cutover closes.

Ordinary Growth adoption uses one project lifecycle:

```text
unisane ops init
unisane add growth
unisane connect google
unisane check
unisane growth <domain operation>
unisane growth console
```

Interactive `unisane ops init` may select Growth directly; explicit
`unisane add growth` writes the same intent for an existing initialized project.
Supported adoption modes are `new`, `adopt-existing`, `audit-only`, and versioned
`migrate`. Detection may recommend a mode or resource but must not silently claim a live
provider resource.

Core owns project detection, capability selection, connection dispatch, and aggregate
readiness. Growth owns domain intent, audits, reports, recommendations, experiments,
mutation safety, and headless console state. Provider packages own authentication,
incremental grants, discovery, resource selection, token lifecycle, and transport. Web
Runtime owns application instrumentation. Framework Ops only adapts Framework context.
The optional console application owns presentation over the same headless state/actions.

Google is one user-visible connection whose provider-owned record may hold distinct
Search Console, GA4, GTM, Ads, and project/API grants. Capability adoption requests the
minimum next grant and expands it deliberately. Multiple resources, partial permission,
revocation, expiry, and unavailable APIs are explicit states; no path silently selects
the first resource or another credential.

Readiness is derived independently across project intent, connection, resource,
instrumentation, data, business truth, decision confidence, and mutation safety. Each
finding carries a stable code, evidence, freshness, affected identity, blocking effect,
and one next action. A configured file alone never proves usable instrumentation, fresh
data, or mutation authority.

The clean cutover is a coordinated public major release. A one-shot migrator may read
the retired schema and write the new schema, but normal runtime loading rejects retired
schemas. Replaced commands, aliases, config loaders, auth stores, raw access-token
fallbacks, manual readiness state, tests, docs, and embedded console presentation are
deleted in the same convergence workstream. No wrapper, deprecated alias, dual loader,
shadow state, or hidden fallback survives the release.

Clean replacement is enforced inside every bounded slice, not deferred until release.
The retired owner/export/route is deleted first so type and behavior failures expose all
consumers; the canonical replacement, consumer migration, related test/doc/config/asset
deletion, and zero-residue proof complete before the next slice begins. A development
branch may be temporarily broken but may never make old and replacement systems
runnable together. The final release stage only aggregates already-passing proof,
validates the standalone one-shot migrator and retired-schema rejection, regenerates
owned artifacts, and prepares the coordinated major release.

The Growth console is a normal-user-first product for marketers, founders, SEO
specialists, advertising operators, and business owners. Its sidebar contains the
project/site selector, `Overview`; a `Channels` group with `SEO`, `Advertising`,
`Analytics`, and optional `Experiments`; a `Manage` group with `Connections` and
`Activity`; and bottom-anchored Help, `Settings`, and user context. Setup moves to guided
onboarding and Connections; proof moves to affected status and Technical details;
performance moves to Overview/capabilities; research moves to `SEO > Research`; GTM
moves to `Analytics > Tracking health` and the Google connection; recommendations
become contextual priorities; receipts become Activity; Schedule becomes
`Settings > Automations`. The old routes are deleted in the console cut.

The console application is a real browser component application, not an HTML string
application. Its server-side document owner emits only safe serialized boot data,
external browser asset references, and a loading fallback. Route-owned React screens,
shell, routing, shared interaction primitives, and feature tables remain separate
source owners. Presentation uses flat public `@unisane/ui/*` imports and component
defaults; app-local classes may compose layout but must not recreate or broadly
override typography, controls, dialogs, navigation, cards, tokens, or interaction
states. Inline runtime JavaScript, embedded application CSS, giant template renderers,
and a second app-local design system are forbidden.

SEO uses exactly `Overview`, `Opportunities`, `Pages`, `Queries`, `Site health`, and
`Research`. Overview owns search-performance summary and trend; Opportunities owns
ranked actionable work; Pages and Queries own their respective analysis; Site health
owns technical discoverability/indexing correction; Research owns explicitly estimated
demand and content exploration. Research opens on ranked focus areas while the complete
keyword matrix remains available as its detailed explorer. No content-strategy finding
is promoted into Site health, and no duplicate `Search performance` or top-level
`Keywords` tab survives.

Connections uses one card per provider. Google contains independently truthful Search
Console, Analytics, Tag Manager, and Ads service rows under one account lifecycle.
`Manage connection` opens a full provider detail page; drawers explain only one selected
issue. Partial failure does not erase working service state, incremental capability
adoption requests only the next required grant, and disconnect confirmation explains
the exact consequences. Only implemented and selectable providers appear as available;
future providers never appear as connectable or warning cards.

Every page presents purpose, relevant context, one dominant status/action, three or four
decision-useful metrics, one primary analysis/workflow, up to three priorities, and
collapsed technical details. The contextual inspector is closed by default and never
duplicates the main page. Missing/stale data uses an honest explanatory empty state
rather than misleading KPIs, readiness scores, or empty charts.

Primary UI uses human states and sentences. Provider ids, scopes, artifact paths, report
families, file counts, machine codes, mutation mechanics, and receipts remain available
through `Technical details` or Activity. The console must meet WCAG 2.2 AA with direct
keyboard, focus, screen-reader, contrast, table/chart alternative, zoom, responsive
reflow, hidden-content, reduced-motion, and async-announcement proof.

Every ordinary visible element must explain what happened, why it matters, what the user
can do, or what result an action produced. Decision-critical information is primary;
useful secondary context uses a focused drawer, popover, or Technical details; history
uses Activity; deep diagnostics use Technical details or structured CLI/API output;
duplicate, irrelevant, misleading, or unactionable presentation is deleted. The console
must not preserve an expert-mode dashboard, old shell, or presentation fallback.

Tooltips explain only unfamiliar terms, calculations, icons, or freshness labels in one
or two simple-English sentences. Information popovers may add why a concept matters, one
example, and a relevant help link. Required guidance, errors, access problems, and next
actions remain inline. Both interactions must work with pointer, keyboard, touch, and
screen readers.

## Growth Guidance And Agent Workflow Contract

Growth guidance models the work that founders, marketers, agencies, analysts, and
developers otherwise coordinate across provider dashboards, spreadsheets, documents,
chat, tickets, and repeated agent prompts. It must reduce that coordination burden; it
must not introduce a visible project-management system or require users to learn Ops
architecture.

An ordinary workflow begins with a plain-language request or a selected business goal
and follows one understandable loop:

```text
understand the goal -> inspect trustworthy evidence -> explain what matters
-> recommend one next step -> review impact when needed -> act
-> verify the result -> preserve the useful decision
```

The product may infer a matching workflow from requests such as `Why are purchases
down?`, `Find SEO opportunities`, or `Check whether tracking is reliable`. It asks only
for missing information that changes target identity, interpretation, risk, or public
behavior. Read-only exploration stays lightweight and does not require a tracked run
until the user saves, delegates, schedules, approves, or applies work.

The internal workflow model has explicit owners:

| Record          | Responsibility                                                                                                         | Owner                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Growth goal     | business outcome, subject, timeframe, constraints, and success signal                                                  | Growth domain                                       |
| Growth playbook | versioned goal-oriented stages, required evidence, applicable actions, and user guidance                               | Growth domain                                       |
| action          | typed inspect, research, plan, apply, or verify capability                                                             | Ops engine with domain/provider contributors        |
| evidence        | observed, estimated, provider-attributed, sample, stale, conflicting, or missing support with provenance and freshness | Ops engine projection over domain/provider evidence |
| readiness       | whether investigation, planning, application, or verification is currently trustworthy                                 | Ops engine                                          |
| workflow run    | resumable stage, selected identities, blockers, approvals, and verification timing                                     | Ops engine                                          |
| decision        | accepted, rejected, or deferred recommendation with actor and rationale                                                | Ops engine durable store                            |
| receipt         | immutable applied outcome and verification reference                                                                   | Ops engine                                          |
| context brief   | bounded, redacted, evidence-linked orientation for a human or agent                                                    | Ops engine projection                               |
| handoff         | resumable references and next step without copying a raw conversation into product truth                               | Ops engine projection/store                         |

Goals and playbooks organize domain intent; they never become a second action,
readiness, approval, policy, or receipt authority. Playbooks reference stable action and
evidence contracts. Skills, prompts, Help content, CLI guidance, console workflows, MCP
tools, and hosted experiences render or invoke the same playbook and action truth rather
than maintaining parallel instructions.

Durable Growth memory contains explicit project intent, canonical business outcomes,
audience/market context, accepted research, constraints, decisions, and verified
results. Temporary provider payloads, speculative model output, transient run progress,
and raw conversation transcripts are not durable business truth. Every promoted
observation retains source, identity, timeframe, freshness, confidence, and evidence
kind; invalidated or superseded evidence cannot silently support a current
recommendation.

The context brief is generated for the current actor and task. It includes only the
explicit project/site/environment, goal, relevant accepted context, bounded evidence,
freshness, current readiness, previous decisions that materially apply, and safe next
actions. It excludes secrets, unrelated customer data, unbounded provider payloads, and
the complete conversation history. A handoff carries stable references to that state so
another session can resume without treating prose as authority.

Primary UI and conversational guidance use this order:

1. what happened or what the user is trying to achieve
2. why it matters
3. the most useful next step
4. the concise supporting reason
5. the action, approval, or verification state

Internal nouns such as `guard`, `readiness failure`, `evidence threshold`, `mutation`,
`receipt`, and `context brief` stay out of ordinary UI. The product says, for example,
`This data is 12 days old`, `Connect Analytics before continuing`, `Meta reports more
purchases than your store recorded`, `Review the change`, and `Check results again after
7 days`. Technical details retain exact codes, sources, identities, schemas, and audit
records.

Cards, alerts, recommendations, empty states, expanded detail, Help, and agent starters
must each have one primary communication job. Summary cards use a short label, value,
optional change/status, one concise explanation, and compact provenance. Recommendations
use an action-oriented title, expected outcome, short evidence-backed reason, relevant
effort/risk, and one primary action. Required explanations remain inline; supporting
methodology and full evidence use progressive disclosure.

Initial workflow evaluation covers three representative real-world playbooks before the
registry expands:

1. Growth health review: establish connection, freshness, measurement, and priority
   truth before recommending work.
2. SEO opportunity research: connect a goal or page to recorded query, market,
   competitor, intent, and existing-content evidence.
3. Measurement audit: establish canonical outcomes, distinguish them from
   provider-attributed conversions, and block scaling guidance when measurement is not
   trustworthy.

The set is architectural rather than page-driven: health review proves diagnosis and
recovery, SEO research proves multi-source opportunity synthesis under uncertainty, and
measurement audit proves trust gating before downstream advice. Read-only pilots must
prove a useful no-change outcome, missing/conflicting evidence, bounded assistance, and
resumable handoff. The first controlled-action pilot is the exact
`growth.ads.campaign.pause` action. It proves human approval, an immutable operation
receipt, ambiguous-outcome handling, and delayed read verification without exposing a
generic mutation action. New playbooks are
admitted only after a real user scenario cannot be expressed clearly through the
existing model.

Local MCP agent evaluation has two evidence levels. A **contract profile** is a
deterministic, offline capability declaration exercised through the official MCP client;
it proves the shared schema, structured result, bounded evidence, plain-language
projection, deep link, stateless resume, freshness invalidation, and fail-closed input
and output boundaries. A **real-host certification** runs a named released host and
binding end to end and additionally proves installation, discovery, context limits,
permissions, lifecycle, recovery, upgrade, and removal. Contract-profile success must
never be presented as Codex, Claude, Gemini, or another proprietary host certification.
Host-specific wrappers remain thin adapters and may not change workflow truth or safety.

The current private-development host evidence names Codex CLI `0.146.0-alpha.9.2` and
trusted local Git repositories. It covers fresh-task discovery and exact invocation of
all three read-only Growth tools, ambiguous-target clarification, missing-binding
recovery guidance, blocked and absent-evidence outcomes, one-call result handling, and
unchanged same-workflow resume. It also covers one exact non-production campaign-pause
plan and a resumed canonical review that rejects chat-only approval without applying.
Because the named CLI is an alpha build and the binding is local/private, this evidence
is not a released-host support promise and does not cover approved provider apply,
provider verification, desktop lifecycle, public plugin installation, remote transport,
hosted authorization, or later CLI/model behavior.

## AI-Native And Hosted Delivery Contract

> Target steady state: bounded Skopos Tasks own implementation and closure. MCP servers,
> AI-host plugins, hosted APIs, managed OAuth, and SaaS behavior are not current product
> truth until their Tasks close with direct acceptance Evidence.

Packages are the reusable product foundation, not the only delivery experience. Unisane
Ops uses one headless engine and one versioned, transport-neutral action contract across
all supported surfaces:

| Surface                 | Primary user need                                                     |
| ----------------------- | --------------------------------------------------------------------- |
| package and CLI         | local, deterministic developer and CI workflows                       |
| console                 | understandable visual workflows for technical and non-technical users |
| local MCP               | structured project-aware tools for local AI agents                    |
| remote MCP              | authenticated team and hosted-agent workflows                         |
| AI-host plugin or skill | easy discovery, installation, and safe workflow guidance              |
| optional hosted SaaS    | managed connections, teams, durable jobs, schedules, and history      |

The initial action-contract owner is `@unisane/ops-engine/actions`. The local MCP
adapter is `@unisane/ops-mcp`. Its read catalog is `review_growth_health`,
`research_seo_opportunities`, and `audit_growth_measurement`. Its first controlled-action
catalog is `plan_campaign_pause`, `review_campaign_pause`,
`apply_approved_campaign_pause`, and `verify_campaign_pause`. Every tool is project and
environment bound and lowers directly from a public Growth workflow executor. The
campaign tools preserve plan/review/apply/verify separation and expose no approval tool.
A later hosted Task may reuse this goal-oriented registry for remote Streamable HTTP
only after remote identity and authorization exist. CLI, console, MCP, hosted API, jobs, and
host plugins must call actions directly; no adapter may parse CLI output or call another
adapter for business behavior.

The action contract owns stable ids and schemas, explicit project/site/environment and
actor context, evidence and freshness, readiness and safe next actions, effect/risk
classification, approval references, idempotency, immutable receipts, bounded results,
jobs, structured errors, and optional console deep links. Growth, Cloud, provider, Web
Runtime, and Framework Ops owners remain unchanged.

AI-host plugins are thin distribution adapters. They may package MCP wiring, workflow
skills, installation metadata, and small host-supported review UI; they do not own
provider behavior, readiness, policy, approvals, or mutation. Product language must
distinguish a Framework plugin, an AI-host plugin, and an Ops pack.

A local/private AI-host binding may use project-scoped STDIO MCP before hosted delivery
exists. A public AI-host plugin that depends on remote MCP may ship only after the hosted
runtime, authorization, revocation, privacy, support, and compatibility gates pass. A
local binding must not be presented as a hosted or universally available integration.

The current Codex binding is owned by `unisane mcp configure codex`. Preview is the
default; mutation requires explicit `--write`. It may create, replace, or remove only the
marked `mcp_servers.unisane_ops` block in the selected project's `.codex/config.toml`.
It must preserve unrelated host settings byte-for-byte, use an absolute project root,
bind a validated Growth environment and agent principal, and enable only the admitted
MCP catalog. A private plugin or skill may later improve discovery and guided
use, but it must consume this binding rather than introduce another server or workflow
owner.

The current private Codex distribution source is
`unisane-ops/plugins/unisane-ops`, published locally through the repository marketplace
`unisane-ops/.agents/plugins/marketplace.json` as `unisane-ops@unisane-local`. It contains
three read skills—Growth health review, SEO opportunity research, and Growth measurement
audit—and one controlled campaign-pause skill. Read skills invoke one exact MCP tool and
reuse only an unchanged same-workflow handoff. The campaign skill invokes only plan,
review, apply-approved, and verify, and routes approval to the existing human CLI leaf.
Skills confirm explicit target identity and present outcome, evidence limits, freshness,
and one safe next step in ordinary language. They never become an evidence,
recommendation, policy, approval, verification, or completion authority.

The hosted platform is optional. It may host workspace membership, project and
connection registries, managed OAuth and secret custody, durable jobs, approvals,
receipts, schedules, alerts, metering, billing, and remote transports. It must use the
same engine and portable source-controlled `unisane.config.ts`; it must not introduce a
second project config, readiness projection, provider implementation, or safety
lifecycle. Hosted tenancy uses canonical `scopeId` internally while the product may say
`Workspace`.

The initial hosted topology is a modular monolith with separately runnable gateway,
worker, and scheduler roles. It uses one transactional durable system of record for
project and connection metadata, versioned plans, approvals, jobs, receipts, and audit;
bounded object/artifact storage for large evidence; durable dispatch with an outbox or
equivalent source-bound handoff; and envelope-encrypted secret custody. Cache, rate-limit,
or lease stores may assist execution but are not durable business truth. Do not split a
service per provider or logical capability without independent-deployment evidence.

The first implemented hosted slice is deliberately read-only. Ops engine exposes the
technical `./hosted` contract and `./hosted/sqlite` feasibility adapter: a strict
admission request, durable queued-job record, atomic admission bundle, dispatch intent,
append-only audit fact, fenced worker claim, bounded artifact result reference,
structured safe failure, and expired-lease recovery contract. Admission never executes
inline and rejects wrong audience, principal, scope, credential-shaped input, and
conflicting idempotency reuse. The worker invokes an existing registered read action by
exact id and schema version.

`@unisane/ops-hosted-runtime` is the private modular-monolith composition boundary. Its
gateway role owns authorization and admission but receives no action executor; its
worker role receives registered read actions and durable persistence but no admission
authority. SQLite WAL and transactions prove multi-connection admission, worker
execution, restart recovery, stale-worker fencing, one terminal audit fact, and durable
result lookup. SQLite is not the production database selection.

The same package builds independently runnable Node.js gateway and worker executables.
The gateway owns one bounded private HTTP read-action transport, validates OIDC bearer
tokens through issuer- and audience-bound JWKS verification, maps workload claims to an
engine authorization, and re-authorizes result reads against principal and `scopeId`.
The worker loads registered read actions only through one explicit deployment module;
it has no route or admission authority. Both binaries assert the exact PostgreSQL schema
revision before readiness, emit payload-free JSON-line lifecycle observations, and use
bounded `SIGINT`/`SIGTERM` shutdown. The gateway exposes only liveness, readiness,
read-action admission, and same-principal job retrieval. It is an internal deployment
boundary, not a public hosted API or remote MCP contract.

`@unisane/ops-hosted-postgresql` is the standalone production-database adapter. It
depends only on `@unisane/ops-engine` and `pg`, owns explicit repeatable migrations, and
never migrates implicitly during runtime composition. PostgreSQL transactions preserve
atomic job, dispatch, and audit admission; `FOR UPDATE SKIP LOCKED` gives competing
workers one dispatch lease; compare-and-set job revisions and fencing tokens reject
stale completion; terminal results remain idempotent and content-bound. The private
hosted runtime adds separately invokable gateway and worker process lifecycles with
startup probes, role readiness, structured payload-free events, bounded polling,
expired-lease recovery, retry scheduling, terminal poison-dispatch recording, and
`AbortSignal` shutdown. Transport and deployment hosts remain injected: these
contracts do not expose a public HTTP or remote MCP service and do not establish
managed service-identity provisioning, secret custody, backup/restore certification,
scheduler deployment, or mutation.

### Hosted read-spine deployment runbook

Schema migration is a distinct release operation. Gateway and worker startup only
assert compatibility and must fail before readiness when migration history differs from
the exact adapter revision. Deployments route traffic only after the gateway readiness
probe succeeds, remove traffic before termination, and allow the configured shutdown
window for in-flight role cleanup. Worker replicas use distinct stable worker ids and
may scale independently because dispatch claiming, job revision, and fencing remain in
PostgreSQL.

Gateway identity configuration names one HTTPS issuer, one audience, and one JWKS URL.
Bearer credentials are accepted only in the authorization header, never in action input,
stored job state, logs, probes, or error bodies. Deployments inject the PostgreSQL URL and
OIDC settings through their secret/configuration system; the runtime does not own secret
distribution. Worker action selection is explicit through a deployment-owned module
exporting `createHostedWorkerActions()`; it is not inferred from the workspace.

Operators monitor structured lifecycle events, `/live`, `/ready`, PostgreSQL availability,
queued-job age, retry/dead-letter outcomes, and shutdown completion. The current proof
does not certify backup/restore, safe rollout/rollback in a managed environment, tenant
isolation under adversarial load, incident ownership, or remote/public exposure; those
remain release gates.

Hosted action admission atomically binds authenticated principal, `scopeId`, project,
environment, target/resource, action schema version, immutable plan revision, approval,
policy, freshness, and idempotency identity before dispatch. MCP authorization is
audience-bound to Unisane and is never passed through to a provider. Provider OAuth is a
separate connection grant resolved only after Unisane authorization succeeds.

External provider mutation is at-least-once and reconciliation-based, not advertised as
exactly-once. Workers persist operation attempts and terminal or ambiguous outcomes,
retain safe provider request/resource references, and use idempotency, fencing/revision
checks, retry classification, and compensating plans where supported. A timeout after a
provider request is an unknown outcome until reconciled, not an automatic retry or
failure receipt.

The canonical hosted run advances through versioned durable state rather than an
in-memory request:

```text
requested -> admitted -> planned -> awaiting approval -> approved -> queued
          -> running -> succeeded | partial | failed | outcome unknown
          -> verifying -> verified | needs attention
```

Terminal facts and audit events are append-only. Cancellation prevents future work when
possible but does not claim that an already accepted provider operation was undone.
Recovery, backup/restore, retention/deletion, quota/rate-limit enforcement, tenant
isolation, and observability are release requirements for public hosted delivery.

Provider secrets never enter prompts, ordinary tool arguments, project config, logs, or
receipts. Natural-language intent is not mutation authority. Protected changes always
follow:

```text
inspect -> plan -> explain impact -> authorize/approve -> apply -> receipt -> verify
```

The engine and host enforce target identity, freshness, policy, approval, locking,
idempotency, and drift. Skills and model instructions are usability and defense-in-depth
layers, never authorization boundaries.

The initial Growth mutation proof is deliberately narrow and reversible. Its canonical
plan hash binds the action id and schema version, project, environment, provider account,
campaign resource, evidence revision, expiry, and verification timing. Apply rejects a
missing, expired, mismatched, stale, changed-target, or replayed authority before calling
the injected provider adapter. A provider timeout or uncertain acknowledgement still
creates an immutable `outcome-unknown` receipt projection; a separate read step verifies
the campaign within an explicit window and resolves to `verified`, `needs-attention`, or
`outcome-unknown`. The retired generic Growth Ads apply path may not execute campaign
pauses.

Campaign-pause review is one versioned derived projection over that same plan, approval,
receipt, and verification truth. It identifies the exact provider account and campaign,
explains the effect and reversibility in product language, exposes evidence and approval
freshness, and selects one safe next step. It owns no state and grants no authority;
console and agent surfaces consume the same projection rather than reconstructing
mutation status or approval policy. Cross-plan receipts and cross-target verification
results fail closed. The local CLI consumes this contract through separate plan, show,
approve, apply, and verify commands. Local MCP consumes it through separate plan,
review, apply-approved, and verify tools after contract-profile evaluation. MCP
deliberately has no approve tool: an authoritative human or separately authorized
product surface records approval, while the bound agent principal is recorded as the
executor. The local console is the first separately authorized product surface: it may
record approval for the exact current plan through one host-owned action, but it exposes
no apply or verify action and performs no provider request.

The local console approval boundary is deliberately narrow. Its browser sends only the
bounded run id and exact plan hash to its own origin with an action-specific header. The
server binds the local operator identity and project/environment context, re-runs the
canonical Growth approval checks, and returns the same workflow review used by CLI and
MCP. The browser cannot choose an approver, read or write lifecycle stores, reconstruct
policy, or turn approval into provider execution. Identical retries by the same bound
operator are idempotent; another operator, an expired plan, stale evidence, an already
executed run, or a compare-and-set conflict requires reload or a new plan. This remains
single-developer, non-production local admission—not hosted identity or authorization.

Each local campaign-pause plan has one versioned mutation-run record. Ops engine owns
the generic compare-and-set store contract, revision rules, bounded action/project/
environment queries, and local-store admission boundary. Growth owns the strict safe
payload and may advance it only through plan, exact approval, apply receipt, and
verification transitions; it does not replace approval, receipt, provider, or mutation
authority. Local development persists these records beneath the project and environment
state directory. Production, automation, and multi-process hosts must inject an atomic
durable implementation of the same port. Console reads the bounded Growth projection
through this contract and never infers lifecycle state by scanning approval, receipt, or
provider artifact directories.

The local CLI is one adapter over this lifecycle, not another workflow owner. Plan and
approval write only project-local canonical state. Apply additionally performs one exact
provider write and requires both the exact plan hash approval and an explicit
`provider:account:campaign` confirmation. Verify performs a separate provider read and
records its bounded result. Human text and JSON serialize the same versioned review.
Local production, automation, multi-process execution, stale evidence, expired plans or
approvals, receipt replay, target mismatch, and unknown provider outcome all fail closed
or require explicit reconciliation; none silently re-plans or retries a remote write.

The local MCP composition reuses these exact stores and provider adapters. Planning and
review are closed-world local operations. Apply is externally effectful and requires the
stored plan, current policy, exact target, and authoritative approval; a stored apply
result makes repeated calls idempotent without another provider dispatch. Verify is a
separate externally effectful read. Local project persistence is admitted only for
single-process development. Production, automation, multi-process, remote, or hosted
execution requires an injected atomic durable mutation-run store and the corresponding
identity, authorization, secret-custody, job, audit, and reconciliation controls.

Google Ads and Meta Ads lower this action through provider-owned campaign-control
adapters. Each adapter captures credentials and transport configuration at composition,
accepts only the provider account and campaign identity at execution, sends one exact
pause request, and exposes a separate campaign-status read. Provider response bodies and
credentials do not enter action results, receipts, or safe errors. A provider rejection
is a definite failed attempt; a transport interruption after dispatch is
`outcome-unknown` until the status read reconciles it. Growth owns provider selection and
the action lifecycle, provider packages own HTTP shapes and status normalization, and the
composition root supplies credentials without creating another mutation authority.
The local host currently resolves the Google Ads connection through its canonical
provider connection contract. The Meta campaign operations are bound as exact provider
operations, but the host rejects them before transport until the ordinary Meta
connection lifecycle can supply credentials; raw token flags and retired token profiles
are not accepted as substitutes.

## Package Contract

### Public user-facing packages

| Package                | Ownership                                               |
| ---------------------- | ------------------------------------------------------- |
| `unisane`              | The current one-install local CLI and pack host         |
| `@unisane/cloud`       | Cloud suite commands, schemas, policies, and workflows  |
| `@unisane/growth`      | Growth suite commands, schemas, policies, and workflows |
| `@unisane/web-runtime` | Stack-neutral application-runtime capabilities          |

### Technical packages

| Package                        | Ownership                                                      |
| ------------------------------ | -------------------------------------------------------------- |
| `@unisane/ops-engine`          | Headless plan/apply/receipt/drift engine and pack contracts    |
| `@unisane/provider-aws`        | AWS connection and capability implementations                  |
| `@unisane/provider-cloudflare` | Cloudflare connection and capability implementations           |
| `@unisane/provider-google`     | Google connection and capability implementations               |
| `@unisane/provider-meta`       | Meta connection and management capability implementations      |
| `@unisane/framework-ops`       | Optional Framework discovery, config, and workflow integration |

Package boundaries require a real distribution, dependency, lifecycle, or ownership seam. Internal features remain folders or subpath exports; they do not become packages merely to make the tree look symmetrical.

All packages in this table have public source in `unisane-ops` and publish publicly to the package registry. “Technical” describes the audience and dependency role, not private access. Workspace-only helpers remain private folders and must not be referenced across repositories.

### Installation And Distribution Rule

Internal package boundaries are not an installation checklist. The supported entry
experience is audience-specific:

| Audience            | Entry experience                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| hosted console user | no npm installation; authenticate and select an explicit project/environment                                  |
| AI-agent user       | one admitted plugin or MCP connection; install the local CLI only for an intentionally local-project workflow |
| local developer     | one CLI product entrypoint that composes its required engine, suite, and provider dependencies                |
| SDK integrator      | direct installation of the smallest applicable public technical package or subpath                            |
| contributor         | the complete workspace package graph through repository tooling                                               |

The current local entrypoint is the `unisane` package and `unisane` binary. Installing it
does not install or embed a Framework application runtime; it installs the local product
host. Do not add a second umbrella package merely to mirror the phrase `Unisane Ops`.
Admit a renamed or separate distribution entrypoint only through an explicit release
Decision backed by registry, audience, compatibility, and migration evidence.

Hosted delivery, remote MCP, and AI-host plugins compose the same action and workflow
contracts without requiring the local CLI on the user's machine. Repository extraction
does not change this model and must not force ordinary users to assemble
`@unisane/ops-engine`, suite, provider, or adapter packages manually.

## Provider Packaging Rule

Provider packages split by provider family, not by individual service.

- `@unisane/provider-aws` may contain S3, CloudFront, Route 53, ACM, SES, and SNS capabilities.
- `@unisane/provider-cloudflare` may contain DNS, Workers, Queues, Cron, and delivery capabilities.
- `@unisane/provider-google` may contain GTM, GA4, Search Console, and Google Ads capabilities and should reuse one Google connection when granted scopes allow it.
- `@unisane/provider-meta` contains one saved connection lifecycle plus Graph discovery,
  inventory, Ads reporting, asset upload, and campaign-management capabilities.

A provider earns a package when it has provider-level connection/authentication, discovery, inventory, mutation, or lifecycle behavior shared by multiple capabilities. A single outbound runtime integration does not.

Meta Conversions API support remains at `@unisane/web-runtime/conversions/meta`; runtime
event delivery does not depend on the admitted management provider package.

## Web Runtime Contract

`@unisane/web-runtime` is one package with focused, tree-shakeable subpaths:

```text
@unisane/web-runtime/tracking
@unisane/web-runtime/tracking/react
@unisane/web-runtime/tracking/next
@unisane/web-runtime/contracts
@unisane/web-runtime/conversions
@unisane/web-runtime/conversions/google-ads
@unisane/web-runtime/conversions/meta
@unisane/web-runtime/seo
@unisane/web-runtime/seo/next
@unisane/web-runtime/testing
```

Rules:

1. Runtime code must not depend on the CLI, `@unisane/ops-engine`, or provider administration SDKs.
2. Framework adapters may integrate these subpaths, but the base subpaths remain usable in non-Framework projects.
3. Framework-specific behavior belongs in `@unisane/framework-ops` or an explicit Framework adapter, not in stack-neutral runtime roots.
4. Framework-only deployment, compiler, and DI assumptions must not leak into Web Runtime APIs.
5. Persistent slug history, redirect ownership, aliases, canonical public identity, publication state, and dynamic URL records remain the separate Framework `@unisane/public-urls` capability; Web Runtime SEO owns pure metadata, robots, sitemap, canonical rendering, and JSON-LD helpers only.
6. `@unisane/web-runtime/contracts` contains runtime-neutral event, measurement, consent, and evidence schemas. Growth may depend on that subpath; it must not import browser/server adapters or conversion implementations.
7. The package root exports only environment-neutral contracts/helpers, or intentionally no runtime barrel. It must not combine browser, server, React, Next, or provider conversion implementations; subpaths are the runtime and bundling boundaries.

## One CLI Contract

The public executable is `unisane`, owned by the `unisane` package.

Target namespaces:

```text
unisane ops init
unisane add|remove|connect|check|doctor|status|inspect
unisane cloud ...
unisane growth ...
unisane provider ...
unisane dev|build ...            # when the Framework integration pack is selected
unisane generate|llm|app ...     # when the Framework integration pack is selected
```

Rules:

1. `cloud` and `growth` are the primary capability-oriented user experience.
2. `provider` is an expert lane for provider-specific behavior that cannot be normalized honestly.
3. Provider names must not become the default navigation model for ordinary cross-provider tasks.
4. Framework-specific commands are contributed through `@unisane/framework-ops`; they do not make Framework Devtools the owner of the public CLI.
5. `@unisane/devtools` retains the internal `unisane-devtools` executable for Framework compiler, assembly, codegen, reference generation, and governance workflows.
6. Exactly one package publishes `unisane`: the canonical `unisane` host. Devtools
   publishes only `unisane-devtools`.
7. Existing `unisane-devtools` provider and Growth compatibility facades describe
   transitional current state only. The coordinated clean cut deletes the
   obsolete command paths and documentation; no public alias or wrapper is part of the
   target contract.
8. `create-unisane` creates a new Unisane Framework application; `unisane ops init` adopts/configures Unisane Ops in an existing project and must not become a second Framework scaffolder. Bare `unisane init` is not an alias or supported command.
9. Core owns `ops init` and root primitive dispatch. Packs may contribute namespaced commands and registered `add` item types; duplicate command paths, stable command ids, root names, `add` item types, config namespaces, or capability bindings fail closed.
10. The Framework pack owns the `app` namespace and preserves `unisane app compile --write|--check`. It may contribute Framework-specific `add` item types without taking ownership of root `add`.
11. Core reserves the root `dev`, `build`, `generate`, and `llm` names for the Framework
    integration pack, preserves `remove` as the peer dispatcher to `add`, and owns
    aggregate `doctor`/`inspect` dispatch. The Framework pack exposes one executable
    compiler at `unisane app compile --write|--check`; it does not contribute a root
    regeneration alias. Local Project Memory generation, provider-state synchronization,
    and doctor remain separate commands with separate ownership.
12. A generic Ops project without the Framework pack does not synthesize Framework handlers for those reserved names. Help and errors state that the Framework integration is unavailable rather than accepting another pack's conflicting root command.
13. CLI core has a built-in non-executable JSON manifest for its executable root handlers. Delegated commands merge the core and selected contribution descriptors, use the stricter maximum effect, union their write targets, and cannot weaken JSON, exit, trust, or collision rules.
14. Stable pack, command, capability, provider, item-type, alias, and config-namespace ids follow the exact lowercase ASCII grammar in `docs/architecture/07-naming-and-pattern-conventions.md`; hosts reject noncanonical values rather than silently normalizing them.
15. A core reserved root may name an exact first-party contributor pack. The binding is
    part of the sealed manifest graph; an undeclared pack cannot claim that root.
16. A typed pack result may carry human `stdout`/`stderr` presentation only after handler
    identity, effect, write-target, risk, trust, and integrity checks pass. JSON mode
    remains one structured host result.

Canonical operation terms:

| Term        | Meaning                                                    |
| ----------- | ---------------------------------------------------------- |
| `inventory` | Read normalized live resources and relationships           |
| `import`    | Convert selected live state into reviewable desired state  |
| `audit`     | Compare evidence against policy without mutation           |
| `plan`      | Produce a deterministic proposed change set                |
| `apply`     | Execute one approved, still-valid plan                     |
| `report`    | Render factual evidence and outcomes                       |
| `recommend` | Produce non-binding prioritized advice                     |
| `publish`   | Promote an approved version to a live provider surface     |
| `rollback`  | Prepare an explicit prior-state or inverse plan            |
| `receipt`   | Inspect or verify immutable evidence for an earlier action |

Suites may add domain verbs only when the generic operation terms would hide a materially different lifecycle.

Mutation commands emit receipts automatically as lifecycle output; the `receipt` command is read-only and never repeats the mutation. `rollback` only creates the inverse plan; the normal approved `apply` stage executes it.

## Engine And Extension Contract

There is one headless operational engine for desired state, inventory, policy, plan, approval, apply, receipts, and drift. Cloud, Growth, providers, Framework integration, the CLI, and later automation surfaces consume the same engine contracts. The engine also owns provider-neutral `SecretResolver`, `SecretWriter`, `ArtifactStore`, `ApprovalStore`, and `LockStore` ports; hosts and packs provide explicit implementations under the safety rules in SSOT 12.

Extensions register through a versioned, static `PackManifest`. A pack declares:

- stable pack id and version
- compatible pack API version
- command namespaces
- capabilities and provider bindings
- config-schema contribution
- effect classification
- required connections and permissions

Rules:

1. Commander or another CLI parser is an implementation detail, not the extension API.
2. A manifest is a schema-validated JSON resource exposed at an exact package export; reading it must not import or execute the pack's JavaScript/ESM entrypoint.
3. Packs must not scan arbitrary `node_modules`, execute code merely because it was discovered, or download code implicitly.
4. Pack loading is explicit from a built-in allowlist, project config, or a deliberate install/add operation and verifies package name, installed version, compatible pack API version, integrity/provenance, and configured trust policy before handler import.
5. Duplicate pack ids, command paths, stable command ids, config namespaces/schema keys, `add` item types, or capability/provider bindings fail closed before any handler loads.
6. Only the selected command's exact handler export loads after the complete manifest graph passes schema, trust, compatibility, and collision validation.
7. Manifest validation, integrity, and provenance make discovery deterministic; they do not sandbox a loaded handler. A handler has the Node host's process, filesystem, environment, and network authority.
8. Initial handler execution is limited to first-party or explicitly approved trusted packs. Untrusted third-party packs are deferred until a separate threat model and process/capability-isolation contract is approved.
9. Provider SDKs load from their provider packages only when a selected capability needs them; the lightweight CLI package must not bundle every provider SDK.
10. All mutation surfaces must use the shared safety lifecycle from `12-provider-control-plane-baseline.md`.

## Dependency Direction

```text
unisane CLI -> ops-engine contracts
unisane CLI -> explicitly selected suite/integration manifests + handlers
suite packs -> ops-engine contracts; expose schema-only domain contract subpaths
growth -> web-runtime/contracts only for application measurement schemas/evidence
provider packs -> ops-engine contracts + exact suite /contracts subpaths + own SDKs
framework-ops -> Ops contracts + Framework authoring contracts + @unisane/devtools/framework-integration
web-runtime -> ecosystem-neutral runtime libraries + declared optional peers only
Unisane Framework -X-> Unisane Ops
runtime code -X-> CLI / ops-engine / provider administration SDKs
```

Suites do not import provider packages. Provider packages may import only the schema-only suite contract subpaths they implement, never suite roots or orchestration. Framework integration may lazy-load only the narrow headless `@unisane/devtools/framework-integration` subpath selected for a command; it must not import the Devtools root, CLI parser state, private compiler modules, or Framework runtime internals. Dependency inversions are architecture violations even when workspace aliases make them compile.

## Configuration Contract

There is one project entry file: `unisane.config.ts`.

The export shape is exact:

- In a generic project, the default export is `defineUnisaneProject(...)`.
- In a Unisane Framework project, the default export remains the Framework configuration and the named export `ops` is the Ops definition.

Do not introduce a parallel `cloud-ops.ts`, `marketing.ts`, or second root config as
canonical truth. The public builders are `defineUnisaneProject(...)` for a standalone
default export and `defineUnisaneOps(...)` for the exact Framework named `ops` export.
Both use schema version `1`.

Growth contributes selected capabilities, adoption mode, environment/target mappings,
named connection and resource references, domain-manifest locations, runtime integration
selection, and policy to this one schema. It must not load app-local
`config/marketing.*`, `config/google-tag-manager.*`, or provider-specific root config.
Versioned event, conversion, experiment, research, and policy manifests remain domain
artifacts at configured locations; they do not become another config owner.

Config is declarative and data-first for offline validation.
`unisane.config.ts` and its builders must not perform top-level environment
validation/throws, credential resolution, authentication, network access, provider SDK
construction, or mutation. It stores named secret and connection references, never
resolved values.

Raw provider access-token environment variables are not an authentication fallback or
debug bypass. Local, CI, and durable hosts bind explicit provider-owned connections
through the engine secret ports. OAuth client bootstrap may reference a secret; access
and refresh tokens are never project config.

`unisane.config.ts` is nevertheless trusted executable project code, not a sandboxed
data format. The side-effect contract prevents accidental behavior; it does not make an
untrusted checkout safe. Privileged CI must not evaluate config from an untrusted pull
request or fork while secrets, provider credentials, writable tokens, or unrestricted
network authority are present. Untrusted validation runs credential-free in isolation or
uses only a reviewed/default-branch artifact.

Ops configuration uses stack-neutral terms:

- `project`
- `target`
- `environment`
- `connection`
- `provider`
- `connector`
- `integration`
- `capability`
- `policy`

Framework keeps `scopeId` as its canonical tenant identifier. `@unisane/framework-ops` maps Framework identity into generic Ops project/target context at the integration boundary; Ops must not redefine `scopeId` or export `tenantId`.

## Versioning Contract

Three version axes are explicit:

1. package semver governs distributed JavaScript package compatibility
2. pack API version governs manifest and engine-extension compatibility
3. config/artifact schema versions govern durable desired-state and evidence migrations

These versions may advance independently. Readers must reject unsupported major versions rather than silently reinterpret state.

## Target Repository Model

Target ownership is:

```text
unisane/             # public Unisane Framework monorepo
unisane-pro/         # private reusable commercial Framework extensions
unisane-ops/         # public CLI, Ops engine, Cloud, Growth, Web Runtime, providers
unisane-ui/          # public UI system
unisane-platforms/   # private product implementations and validation
unisane-site/        # public brand/marketing/docs gateway; no product SSOT
```

`unisane-ops/` is one monorepo. Do not create one repository per package or provider. A future repository split requires independent ownership, security, release cadence, or distribution evidence and a new decision.

Before remote cutover, all new Ops package destinations stage under the top-level `unisane-ops/**` subtree of the current single Git repository. That subtree is not a nested repository and must not contain its own `.git`. The current `unisane-tools/` tree is migration source, not the target home for stack-neutral Ops capabilities. Extraction must preserve Framework Devtools responsibilities while moving generic operational behavior behind the target package contracts.

The current `unisane-examples/` family is retired by moving each maintained example into
the owning Framework, Pro, Ops, UI, or Site repository. The current
`unisane-landing/` deployable migrates to public `unisane-site/`; it may aggregate
versioned product docs but must not become their writable authority.

Repository rules:

1. each target repository has one authoritative writable remote
2. do not reconnect repositories with Git submodules, nested Git roots, copied package sources, or cross-repository relative imports
3. private Pro and Platforms consume published public semver versions or explicit
   prereleases after cutover; Platforms consume Pro only from its access-controlled
   registry
4. preserve relevant history and record source/destination commits and provenance during extraction
5. the ecosystem Git plan owns the complete root-by-root split and cutover sequence
6. after cutover, Ops product, provider-safety, CLI/config/pack, and execution docs have one writable authority in `unisane-ops`; Framework retains only its ecosystem/integration rules and noncanonical pointers, never editable copies of Ops SSOT
7. private Pro source, registry, license, and contributor boundaries follow
   `D-20260724-unisane-pro-source-registry-and-license-boundary-contract`

## Exception Policy

- Owner: `architecture-program`
- Reason: Current provider, marketing, GTM, SEO, web-package, config-loader, and duplicate-binary behavior remains under Framework/Devtools paths until characterized replacement slices preserve behavior and public compatibility.
- Expiry: `2027-01-31`
- Removal Condition: Phase 7 of the active extraction plan has removed duplicate command/config/package owners and all zero-residue, compatibility, and integration gates pass; otherwise the owner must renew this exception with updated evidence and scope.
- Canonical Owner Doc: `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- Tracking Artifact: `docs/findings/F-20260724-unisane-ops-product-boundary-and-devtools-coupling-gap.md`

## Enforcement And Transition

Implementation follows `unisane-ops-product-architecture-and-extraction-plan.md`.

Until migration closes:

1. current commands must be documented as current/transitional, never as target package proof
2. new generic Ops behavior must not deepen coupling to Framework internals
3. characterization tests precede movement of live provider behavior
4. each replacement slice must delete or demote the superseded path after parity proof
5. generated references and architecture checks must be updated from their owning sources
6. public breaking changes require coordinated semver and migration notes
