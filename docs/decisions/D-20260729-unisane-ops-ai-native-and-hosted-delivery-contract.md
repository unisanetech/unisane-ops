---
id: 'D-a11c64f03d71'
owner: 'unisane'
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

Remote MCP follows the current MCP authorization standard with HTTPS, protected-resource
metadata, OAuth discovery, short-lived scoped access, and PKCE where applicable.
Non-interactive service access uses an explicitly admitted machine-identity flow and
never impersonates a human approval.

### AI-host plugins and skills

Codex/ChatGPT, Claude, and future host integrations are thin distribution adapters over
the MCP server and shared action semantics.

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

The term `plugin` must always be qualified:

- **Framework plugin**: reusable Unisane Framework composition unit
- **AI-host plugin**: Codex/ChatGPT, Claude, or another AI product distribution unit
- **Ops pack**: an Ops capability/provider contribution through `PackManifest`

### Hosted SaaS contract

The hosted platform is an optional managed host of the same Ops engine, not a replacement
engine and not a requirement for local/self-hosted use.

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

### Product experience

The entry experience depends on the user, while the resulting project and action truth
remains one:

- developer: install/use the CLI, run `unisane ops init`, optionally connect an AI host
- marketer/founder: enter the hosted console, choose a project/site, connect providers,
  and follow guided outcomes
- agent user: install an AI-host plugin or MCP connection, authenticate, select the
  explicit project/environment, and ask in natural language
- CI/service: use stable actions through JSON/API/MCP with machine identity and declared
  permissions

Every AI-assisted answer must make project/site/environment, data freshness, important
evidence, risk, and the next safe action understandable. Dense charts and detailed
configuration deep-link to the console; the AI host does not clone the complete
dashboard.

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

## Consequences

### Positive

- packages remain useful independently and become the shared product kernel
- agents gain discoverable, structured, safer access without shell-output parsing
- the same remote MCP endpoint can serve multiple compatible AI clients
- non-technical users gain managed connections and durable workflows through SaaS
- plugin investment stays thin and replaceable as host products evolve
- local, CI, self-hosted, and hosted users retain one truth and portable project intent
- future surfaces can be added without copying provider or domain behavior

### Negative And Tradeoffs

- the action contract becomes a serious public compatibility boundary
- hosted operation adds identity, tenancy, security, billing, compliance, and support
  obligations
- local and remote transports require a cross-host compatibility/evaluation matrix
- AI-host plugin packaging still needs host-specific release work
- remote provider custody increases security and provider-verification requirements
- asynchronous operations, quotas, and large-result summarization add protocol
  complexity that must be designed before scale

## Enforcement Updates

Future P121 workpacks and convergence contracts must prove:

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

Required validation includes focused engine/action tests, protocol conformance,
cross-host scenario evaluations, auth/permission tests, mutation denial and replay
tests, tenant-isolation proof, rate-limit/failure recovery, package/build checks, and
repository-wide duplicate-owner detection.

## Rollback / Follow-up

- P120 remains the prerequisite onboarding, connection, readiness, instrumentation, and
  console convergence program; this decision does not widen active P120 workpacks.
- The phased implementation is owned by
  `docs/work/plans/unisane-ops-ai-native-and-hosted-platform-plan.md`.
- P121 execution docs are created only when each bounded implementation workpack starts.
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
