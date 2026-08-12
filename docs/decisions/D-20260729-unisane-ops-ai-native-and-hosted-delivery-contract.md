---
id: 'D-a11c64f03d71'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: decision
lifecycle: durable
authority: canonical
provenance: accepted
view: current
status: accepted
---

# D-20260729 Unisane Ops AI-Native And Hosted Delivery Contract

## Changelog

- `2026-08-04`: Accepted SEO-first, local-completion-first sequencing. Existing hosted
  read-spine feasibility proof remains frozen, while further SaaS product implementation
  is inadmissible until the complete local SEO loop closes and the user replies with the
  exact phrase `START UNISANE OPS HOSTED SAAS`. General approval, `continue`, `next`, or
  other conversational wording does not cross this gate.
- `2026-08-03`: Accepted bounded real-host evidence for the private campaign-pause
  skill on Codex CLI `0.146.0-alpha.9.2`. A fresh task loaded the cache-busted plugin,
  created one exact non-production plan, explained that no provider effect occurred,
  and routed approval to the human CLI leaf. A resumed turn treated chat approval as
  insufficient, re-read the canonical run, and stopped without apply. Approved apply,
  provider verification, remote delivery, and public support remain unproven gates.
- `2026-08-03`: Accepted one private controlled-action skill over the campaign-pause MCP
  lifecycle. It confirms the exact target and evidence, plans once, explains that no
  effect occurred, routes a human to the existing CLI approval leaf, re-reads canonical
  approval state, applies only the unchanged approved run, and verifies separately. The
  skill cannot approve, accept secrets, retry an uncertain write, or widen the local
  development boundary.
- `2026-08-03`: Accepted the first local MCP controlled-action boundary for
  `growth.ads.campaign.pause`. Four goal-specific tools separate plan, review,
  apply-approved, and verify; MCP cannot approve. The canonical local host supplies the
  same campaign workflow, project stores, connection resolution, mutation policy, and
  exact provider operations used by the CLI. Contract profiles prove approval
  separation, agent-attributed receipts, exact-target binding, replay safety, and
  verification without creating a generic mutation surface or hosted durability claim.
- `2026-08-03`: Accepted bounded private-development certification on Codex CLI
  `0.146.0-alpha.9.2`. Fresh tasks discovered the repository-local plugin and trusted
  project binding, invoked each exact Growth tool, clarified an ambiguous target,
  preserved blocked/no-evidence guidance, recovered from a missing binding, and resumed
  one health review with unchanged evidence. This does not admit public distribution,
  remote MCP, hosted identity, desktop lifecycle, universal model behavior, or a
  released-host support claim.
- `2026-08-03`: Accepted the repository-local `unisane-ops` Codex plugin as the first
  private skill binding. Its three concise skills map one-to-one to the frozen read-only
  Growth tools and reuse the project MCP configuration; the plugin declares no second
  server or operational authority. Local marketplace install/discovery/removal is proven,
  while new-thread/model behavior and public distribution remain separate release gates.
- `2026-08-03`: Accepted the Codex project-local binding as the first real host adapter.
  `unisane mcp configure codex` previews by default and, only with explicit `--write`,
  manages one marked `mcp_servers.unisane_ops` block while preserving unrelated host
  settings. Installed-CLI discovery proves this local binding shape; private skills and
  full released-host/model certification remain separate follow-up work.
- `2026-08-03`: Accepted deterministic contract-profile evaluation as the first local
  MCP interoperability gate. Codex, Claude, Gemini CLI, and CI capability profiles run
  the same official-client scenarios without models, providers, or network access;
  support claims still require separate real-host/version certification evidence.
- `2026-08-03`: Accepted stateless actor-scoped resume for the three local MCP tools.
  The prior structured handoff is an optional input to the same workflow tool; the
  adapter validates target, actor, goal, and playbook before re-execution and the Ops
  engine compares current run and evidence revisions. This adds no transcript memory,
  new tool, persistence store, actor transfer, or hosted durability claim.
- `2026-08-03`: Activated the accepted one-install local composition through
  `unisane mcp serve`. The canonical CLI now binds one absolute project root, Growth
  environment, and agent principal before starting `@unisane/ops-mcp` over STDIO. The
  MCP adapter remains transport-owned and provider-neutral; no Framework application
  runtime, ambient project selection, shell access, or hosted claim was introduced.
- `2026-08-03`: Froze the first local MCP catalog as
  `review_growth_health`, `research_seo_opportunities`, and
  `audit_growth_measurement`. Accepted a local STDIO-only, explicitly bound,
  read-only adapter that calls public Growth executors directly, requires exact project
  and environment confirmation per call, bounds results, and rejects arbitrary prompts,
  paths, commands, secrets, provider access, and mutation requests.
- `2026-08-02`: Clarified the distribution contract: hosted users install nothing,
  AI-agent users install or connect one thin host integration, local developers use one
  CLI product entrypoint, and only SDK integrators select technical packages directly.
  Repository extraction and internal package boundaries do not create a multi-package
  setup burden for ordinary users.
- `2026-08-02`: Separated local/private AI-host distribution from public hosted
  distribution and accepted the minimum hosted execution kernel: distinct MCP and
  provider identities, transactional action admission, durable jobs, at-least-once
  provider execution, reconciliation, secret custody, and operational recovery gates.
- `2026-08-02`: Extended the accepted delivery contract with one Growth-owned
  goal/playbook model, engine-owned resumable workflow state, evidence-bound context and
  handoff, thin skill bindings, and a plain-language product surface derived from the
  same headless truth.
- `2026-07-29`: Selected one engine and one transport-neutral action contract behind
  package, CLI, console, MCP, AI-host plugin, automation, and optional hosted SaaS
  surfaces. Defined local/remote MCP, thin host adapters, hosted ownership, mutation
  safety, naming, identity, and staged-delivery constraints.

## Context

Unisane Ops is being extracted as a stack-neutral package family with a public CLI,
headless engine, provider packs, Web Runtime, and a user-facing console. That is the
correct reusable foundation, but package installation alone does not meet every
real-world user need:

- developers and CI need local, deterministic, scriptable operation
- marketers and founders need a product UI without terminal knowledge
- teams and agencies need shared connections, projects, roles, schedules, and history
- coding agents need discoverable typed tools rather than shell-command archaeology
- hosted agents need remotely reachable authenticated actions
- enterprises may need controlled self-hosting, audit, and data-boundary choices

Current AI hosts increasingly support Model Context Protocol (MCP), reusable skills, and
installable plugins, but their plugin manifests, supported features, authorization
behavior, and UI capabilities differ. A vendor-specific implementation in the engine
would create drift. A separate SaaS implementation would duplicate business truth and
safety behavior.

## Decision Drivers

- one source of operational truth across human and AI surfaces
- local-first developer value without mandatory SaaS adoption
- normal-user access without requiring package or terminal knowledge
- cross-host AI interoperability through a standard tool protocol
- explicit identity, least privilege, approvals, idempotency, receipts, and audit
- durable jobs and shared provider connections for team workflows
- no provider secrets in prompts, project config, or MCP tool arguments
- no LLM-owned readiness, policy, evidence, or mutation truth
- no duplicated Growth, Cloud, provider, or console computation
- no ambiguity between Framework plugins, Ops packs, and AI-host plugins
- staged investment that proves user workflows before building a large hosted platform

## Considered Options

1. Publish packages and CLI only; let agents invoke shell commands.
2. Build a hosted SaaS application as the new source of truth and treat packages as a
   local compatibility layer.
3. Build separate native implementations for Codex, Claude, and later AI hosts.
4. Keep one headless engine and transport-neutral action contract, then add package,
   CLI, console, MCP, AI-host plugin, automation, and hosted adapters in deliberate
   stages.

## Decision

Selected option: `4`.

### One engine, multiple first-class surfaces

`@unisane/ops-engine` remains the sole owner of normalized operational execution,
including desired state, findings, readiness, policy, plans, approvals, apply, receipts,
drift, idempotency, and effect classification.

Every delivery surface is an adapter over the same typed actions:

```text
local package / CLI
console
local MCP
remote MCP
AI-host plugins and skills
CI and scheduled automation
hosted API and SaaS console
        |
transport-neutral Ops actions
        |
@unisane/ops-engine
        |
Cloud / Growth / providers / Web Runtime / Framework Ops
```

Multiple surfaces are not compatibility fallbacks. They serve distinct user contexts
over one canonical implementation. A surface may change presentation, progressive
disclosure, or interaction style; it must not change facts, authorization, safety,
readiness, or action semantics.

### Transport-neutral action contract

Before MCP or hosted API implementation, the program must freeze one versioned action
contract. The initial owner is the exact public subpath
`@unisane/ops-engine/actions`; a separate client-contract package is admitted only when
independent distribution or runtime constraints prove a real boundary.

Every action descriptor and result must support, where applicable:

- stable action id and schema version
- project, site, target, and environment identity
- authenticated actor and hosted `scopeId` context
- required capability, connection, resource, and permission
- maximum effect and mutation/spend classification
- explicit input and structured output schemas
- evidence, observation time, freshness, and uncertainty
- readiness findings and one or more safe next actions
- approval requirements and non-forgeable approval reference
- idempotency key and immutable receipt reference
- pagination or bounded summaries for large datasets
- asynchronous job reference, progress, cancellation, and terminal result
- stable typed errors with human recovery guidance
- console deep link when a visual workflow materially helps

CLI JSON, console state/actions, MCP tools, hosted API responses, CI, and agents lower
from this contract. No adapter parses human CLI output or shells through another public
surface to obtain behavior.

### MCP contract

The target technical package is `@unisane/ops-mcp`. It owns MCP protocol and transport
adaptation only. It does not own Growth, Cloud, provider, auth-policy, readiness, or
mutation logic.

One tool registry supports:

- local STDIO for project-aware developer workflows
- remote Streamable HTTP for hosted/team/agent workflows

Tool definitions are designed from recognizable user goals, not generated one-for-one
from every CLI command. The first catalog stays intentionally focused around project
context, readiness, priorities, domain analysis, connections, safe change planning,
approved application, activity, jobs, and receipt verification.

MCP tools must:

- return bounded structured results suitable for model context windows
- expose accurate read/write and risk annotations
- keep read, plan, approve, apply, and rollback stages distinct
- require authoritative approval for protected or spend-impact mutation
- never accept raw provider access/refresh tokens or secrets as ordinary arguments
- record host, tool, actor, scope, project, effect, request, and receipt audit context
- fail closed when host capabilities, authentication, grants, or resource identity are
  insufficient

The executable local catalog contains the read workflows `review_growth_health`,
`research_seo_opportunities`, and `audit_growth_measurement`, plus the controlled-action
tools `plan_campaign_pause`, `review_campaign_pause`,
`apply_approved_campaign_pause`, and `verify_campaign_pause`. Its embedding host binds
one absolute project root, project id, environment id, agent principal, validated Growth
execution context, lifecycle stores, and exact provider operations. Every call repeats
the project and environment and fails closed on mismatch. Arguments do not accept
configuration, credentials, free-form instructions, arbitrary paths, shell commands,
approval claims, or generic provider operations. The adapter returns action-owned
structured results with bounded plain-language projections and never parses CLI output.

There is intentionally no MCP approval tool. Planning may create only the immutable,
evidence-bound proposal; apply requires an authoritative approval already recorded by a
separate human or authorized product surface. The caller's bound agent principal is
recorded as executor on the immutable receipt and cannot impersonate the approver.
Repeated apply after a stored receipt returns current lifecycle state without dispatching
another provider write. Verification remains a separate provider read.

Remote MCP follows the current MCP authorization standard with HTTPS, protected-resource
metadata, OAuth discovery, short-lived scoped access, and PKCE where applicable.
Non-interactive service access uses an explicitly admitted machine-identity flow and
never impersonates a human approval.

MCP client identity and provider identity are separate security relationships. An MCP
access token is audience-bound to the Unisane remote MCP resource and is never forwarded
to Google, Meta, Cloudflare, or another provider. The hosted control plane resolves a
separately authorized provider connection after it has authenticated the actor, enforced
`scopeId` and project access, and recorded the requesting host/client. Provider grants
do not imply Unisane project permission, and Unisane project permission does not imply a
provider grant.

### AI-host plugins and skills

Codex/ChatGPT, Claude, and future host integrations are thin distribution adapters over
the MCP server and shared action semantics.

AI-host delivery has two distinct release classes:

- **local/private binding**: project or repository installation over local STDIO MCP,
  suitable for evaluated developer workflows before a hosted service exists
- **public hosted plugin**: directory or marketplace distribution over a production
  remote MCP endpoint, admitted only after hosted identity, tenant isolation, durable
  execution, revocation, audit, support, privacy, and compatibility gates pass

A local/private binding may precede hosted SaaS. It must not claim remote availability,
team state, managed credentials, or public support. Public listing metadata, review, and
host compatibility are release work, not substitutes for the hosted runtime.

The first Codex adapter is a project-local configuration binding generated by the
canonical `unisane` CLI. It composes the existing STDIO server with one absolute project,
Growth environment, actor, and frozen tool allowlist. It does not install a second
runtime owner, modify global Codex configuration, infer ambient targets, or package
workflow truth. Host skills remain a later thin layer over this same binding.

The first host skill layer is the private `unisane-ops` Codex plugin. It packages four
goal-specific skills and plain-language starters, not MCP configuration. The three read
skills each reference one read workflow and its handoff contract. The controlled
campaign-pause skill sequences only the admitted plan, review, apply-approved, and verify
tools; it cannot approve and never treats conversation as authorization. Every skill
confirms target identity and lowers returned results without adding evidence or
recommendations. Repository marketplace packaging is a local development channel only;
it does not establish public listing, remote availability, authentication, support, or
universal host compatibility.

The first real-host exercise is deliberately scoped to local private development on
Codex CLI `0.146.0-alpha.9.2` in trusted Git repositories. It proves the three read
skills can discover and call their exact project-bound tools, ask for missing target
identity, preserve safe blocked outcomes, explain missing binding recovery, and reuse an
unchanged same-workflow handoff. It also proves the controlled campaign-pause skill can
create one exact non-production plan, explain that no provider effect occurred, route
approval to the human CLI leaf, re-read the same run, and reject conversational approval
without calling apply. It does not yet prove approved provider apply or verification and
does not convert an alpha CLI run into a public compatibility or support promise;
released versions, models, desktop lifecycle, marketplace delivery, remote transport,
hosted identity, and SaaS operations require their own evidence.

An AI-host plugin may contain:

- MCP connection or bundled local MCP configuration
- host-specific manifest and installation metadata
- skills that teach recognizable workflows and safe tool sequencing
- optional small UI for connection, selection, review, or approval
- host-supported hooks or agents only when they do not become business-logic owners

Host plugin formats are validated independently. No universal manifest is invented, and
no host-specific manifest enters the engine. Common workflow source may generate or
inform host skills only when equivalence is proved; unsupported host features are
omitted rather than emulated through hidden behavior.

Compatibility evidence is graduated. Deterministic contract profiles declare and test
the required client capabilities through the official MCP client without executing
proprietary hosts. Real-host certification is separately versioned and must exercise the
released host, its binding, installation and removal, discovery, permissions, context
budget, and representative end-to-end workflow. Profile success is contract evidence
only and cannot support a marketplace, universal-availability, or host-certification
claim.

The term `plugin` must always be qualified:

- **Framework plugin**: reusable Unisane Framework composition unit
- **AI-host plugin**: Codex/ChatGPT, Claude, or another AI product distribution unit
- **Ops pack**: an Ops capability/provider contribution through `PackManifest`

### Hosted SaaS contract

The hosted platform is an optional managed host of the same Ops engine, not a replacement
engine and not a requirement for local/self-hosted use.

Hosted delivery is a deferred product phase. The completed private read-spine,
PostgreSQL, process, scheduler, deployment, release-trust, and credential-custody slices
remain architectural feasibility evidence and may receive correctness or security fixes,
but they do not authorize further hosted product expansion. Local end-to-end SEO value
must be proven first through real evidence collection, research, recommendation,
implementation handoff, and post-publication measurement across the admitted local
surfaces.

After the local completion requirements in the canonical Ops product architecture
baseline are closed, an agent must show the prescribed readiness statement and request
the exact reply `START UNISANE OPS HOSTED SAAS`. Only a reply whose complete trimmed
content equals that phrase authorizes implementation of hosted identity, managed
connections, remote MCP, hosted jobs, billing, SaaS UI, deployment, or related product
infrastructure. Plan approval, discussion, silence, `yes`, `continue`, `proceed`, `next`,
or a paraphrase is not authorization. Without the exact reply, hosted implementation is
ignored and work remains within the local product boundary.

It may own:

- user and team onboarding
- hosted `scopeId`, membership, roles, and entitlements
- project/site/environment registry and repository linkage
- managed OAuth entrypoints and provider connection custody
- encrypted secret-store and key lifecycle
- durable artifact, approval, receipt, and activity stores
- scheduled jobs, alerts, notifications, retries, and rate-limit coordination
- remote action API and remote MCP transport
- usage metering, quotas, plans, billing, and support operations
- hosted console delivery and deep links
- regional/data-retention policy and later enterprise/self-hosted deployment profiles

It must not own a second Growth/Cloud implementation, recompute readiness in the web
frontend, call provider SDKs from the browser, or permit the model to manufacture
identity, evidence, approval, or mutation authority.

Project intent remains portable and source-controlled in `unisane.config.ts`. Hosted
state contains shared operational records and secret references, not an incompatible
second project configuration.

### Hosted execution kernel

The first hosted deployment is a modular control plane, not a microservice program. Its
minimum deployable roles are an authenticated HTTP/MCP gateway, one or more durable
workers, and a scheduler, backed by a transactional system of record, bounded artifact
storage, a durable dispatch mechanism, and envelope-encrypted secret custody. Logical
services may remain modules inside those roles until independent scaling, security, or
deployment evidence justifies a split.

The transactional system of record owns project and connection metadata, action
requests, immutable plan revisions, approvals, jobs, operation receipts, and audit
events. Large provider evidence belongs in bounded artifact storage under retention
policy. Cache or lease infrastructure may improve coordination but never becomes the
durable owner of approvals, receipts, jobs, or audit truth.

Action admission atomically validates actor authorization, target and plan revision,
approval, policy, freshness, and an unused idempotency key before creating dispatchable
work. Dispatch uses an outbox or an equivalent source-bound mechanism so a committed job
cannot be silently lost between the database and worker queue.

Provider execution is at-least-once. External APIs cannot be assumed to participate in
an exactly-once transaction, so every mutating operation requires a stable idempotency
identity where the provider permits it, fencing or revision checks, operation-level
receipts, provider request/resource references, ambiguous-outcome reconciliation, and a
safe compensating plan where reversal is possible. Retry never means blindly repeating
an unclassified provider call.

Managed OAuth uses hosted callbacks, state/session binding, encrypted refresh-token
custody, rotation, revocation, and refresh coordination. Local loopback OAuth remains a
local adapter and is not reused as the hosted flow. Secrets never enter job payloads,
tool results, logs, prompts, or ordinary database fields; workers receive only scoped
references and the minimum resolved credential lifetime needed for execution.

Public hosted delivery requires tenant-isolation proof, backup and restore proof,
reconciliation and dead-letter recovery, rate-limit and quota enforcement, structured
audit and observability, incident ownership, retention/deletion behavior, and a tested
action/tool compatibility policy. Billing and metering observe admitted action and job
outcomes; they do not become workflow or authorization truth.

### Product experience

The entry experience depends on the user, while the resulting project and action truth
remains one:

- local developer: install one CLI product entrypoint, run `unisane ops init`, and let
  that host compose the required engine, Growth, and provider packages
- marketer/founder: enter the hosted console, choose a project/site, connect providers,
  and follow guided outcomes without installing an npm package
- agent user: install or connect one AI-host plugin or MCP integration, authenticate,
  select the explicit project/environment, and ask in natural language; a local CLI is
  required only when the chosen integration deliberately runs against a local project
- CI/service: use stable actions through JSON/API/MCP with machine identity and declared
  permissions
- SDK integrator: install only the public technical package or subpath required by the
  integration rather than depending on the complete CLI host

The one-install product experience does not collapse the implementation into one large
package. `@unisane/ops-engine`, Growth, providers, console, MCP, and hosted adapters keep
their ownership boundaries, while the product entrypoint composes them for ordinary
local use. Hosted and agent delivery compose the same contracts without requiring that
entrypoint on the user's machine. A future repository extraction changes release
ownership, not these user-facing installation modes.

Every AI-assisted answer must make project/site/environment, data freshness, important
evidence, risk, and the next safe action understandable. Dense charts and detailed
configuration deep-link to the console; the AI host does not clone the complete
dashboard.

### Guided workflows and agent context

Growth defines versioned goal and playbook descriptors for real user scenarios. A
playbook declares its intended outcome, applicable identities, required evidence,
stages, referenced action ids, decision points, approval expectations, verification
timing, and human guidance. It does not execute provider behavior or recompute engine
readiness.

The Ops engine remains the sole workflow authority. It owns resumable run state,
evidence and freshness projections, readiness, action execution, decisions, approvals,
receipts, verification, and handoff references. This model is shared by Help, console,
CLI, MCP, automation, and hosted surfaces; no surface keeps an independent checklist or
prompt-only workflow.

The engine generates a bounded, redacted context brief for each actor and request. The
brief carries explicit project/site/environment and goal identity, relevant durable
business context, source-bound evidence, freshness, current blockers, applicable prior
decisions, and safe next actions. It never contains secrets, unrelated account data,
unbounded provider payloads, or raw conversation history. A handoff resumes through
stable record and evidence references rather than treating a prose transcript as
authority.

AI-host skills and other workflow bindings reference stable playbook, action, context,
and deep-link contracts. They may teach a host how to start, inspect, explain, plan,
resume, or verify work, but they may not own business facts, provider instructions,
policy, approval, or completion semantics. Replacing an AI host changes only the thin
binding and presentation layer.

Ordinary product language presents `goal`, `what we know`, `what needs attention`,
`next step`, `review`, `result`, and `check again`. Engine terms remain available in
technical details and structured responses. Conversation starters are generated from
the current playbook and context brief; static prompt prose is never canonical guidance.

### Mutation authority

Natural-language intent is never sufficient mutation authority.

Protected operations follow:

```text
inspect -> plan -> explain impact -> authorize/approve -> apply -> receipt -> verify
```

The engine, not the model or host plugin, validates the current target, evidence,
freshness, policy, approval, lock, idempotency, and drift. Advertising spend, production
tracking, provider publication, permission changes, billing, and destructive operations
remain explicit high-risk categories.

The first accepted controlled-action proof is the exact
`growth.ads.campaign.pause` action. It is headless first and binds one provider account,
one campaign, one evidence revision, one action schema, one project/environment, and one
expiry through the immutable plan and approval. Apply always records a canonical receipt,
including an ambiguous provider outcome, and verification is a separate delayed read.
This choice does not authorize a generic provider-mutation tool. Local CLI and MCP may
expose only the separately evaluated exact campaign-pause lifecycle; the console remains
read-only. Production, automation, multi-process, remote MCP, and hosted execution remain
blocked until an atomic durable host, hosted identity, authorization, and reconciliation
boundary exists.

## Consequences

### Positive

- packages remain useful independently and become the shared product kernel
- agents gain discoverable, structured, safer access without shell-output parsing
- the same remote MCP endpoint can serve multiple compatible AI clients
- non-technical users gain managed connections and durable workflows through SaaS
- plugin investment stays thin and replaceable as host products evolve
- local, CI, self-hosted, and hosted users retain one truth and portable project intent
- future surfaces can be added without copying provider or domain behavior
- users and agents can resume real workflows without reconstructing context from chat,
  documents, or provider dashboards
- Help, console guidance, agent starters, and automation remain aligned to executable
  playbooks instead of drifting as separately authored prose

### Negative And Tradeoffs

- the action contract becomes a serious public compatibility boundary
- hosted operation adds identity, tenancy, security, billing, compliance, and support
  obligations
- local and remote transports require a cross-host compatibility/evaluation matrix
- AI-host plugin packaging still needs host-specific release work
- remote provider custody increases security and provider-verification requirements
- asynchronous operations, quotas, and large-result summarization add protocol
  complexity that must be designed before scale
- versioned playbooks, evidence invalidation, context minimization, and resumable runs
  add internal rigor that must remain hidden behind a simple user experience

## Enforcement Updates

Future bounded Skopos Tasks must prove:

1. no CLI parser or human-output dependency inside console, MCP, hosted API, or jobs
2. one action id/schema/effect/result family across all surfaces
3. no provider SDK import in UI, AI-host plugin, or MCP presentation code
4. no raw secret/token field in tool schemas, logs, receipts, prompts, or project config
5. no mutation tool that bypasses plan, policy, approval, idempotency, or receipt
6. local and remote MCP parity for shared tools
7. host-specific capability differences are explicit and tested
8. bounded output, pagination, job, error, and deep-link behavior
9. hosted `scopeId`, actor, project, environment, and resource authorization
10. exact audit evidence for human, agent, and service actors
11. AI-host plugin terminology and manifests remain outside Framework plugin ownership
12. no SaaS-only fork of project config, readiness, domain logic, or provider behavior
13. no hosted SaaS product change before local end-to-end closure and exact user
    confirmation through `START UNISANE OPS HOSTED SAAS`

Required validation includes focused engine/action tests, protocol conformance,
cross-host scenario evaluations, auth/permission tests, mutation denial and replay
tests, tenant-isolation proof, rate-limit/failure recovery, package/build checks, and
repository-wide duplicate-owner detection.

## Rollback / Follow-up

- Growth onboarding, connection, readiness, instrumentation, and console convergence
  remain prerequisites; this decision does not widen those implementation Tasks.
- The phased implementation is owned by
  `docs/work/plans/unisane-ops-ai-native-and-hosted-platform-plan.md`.
- Skopos creates executable Tasks only when each bounded implementation increment starts.
- If hosted demand is not proved, local package, CLI, console, and MCP remain complete
  first-class products; hosted code is not required to preserve their behavior.
- If a host changes or removes a plugin format, replace only that host adapter. Do not
  alter the engine or keep obsolete host compatibility code.

## External Standards And Current Product Evidence

- MCP authorization:
  `https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization`
- OpenAI plugin architecture and packaging:
  `https://developers.openai.com/plugins`
- Codex MCP:
  `https://learn.chatgpt.com/docs/extend/mcp?surface=cli`
- Claude plugins and MCP:
  `https://code.claude.com/docs/en/plugins`
- Gemini CLI MCP:
  `https://geminicli.com/docs/tools/mcp-server/`
