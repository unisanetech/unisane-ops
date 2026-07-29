---
id: 'PLAN-15b3fb3efb7d'
owner: 'unisane'
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

- `2026-07-29`: Opened the staged plan for one action contract, local MCP, AI-host
  distribution, managed control plane, remote MCP, team workflows, schedules, billing,
  and enterprise delivery over the existing Ops engine.

## Authority And Current-State Warning

This plan owns future AI-native and hosted delivery. It does not make MCP, AI-host
plugins, remote APIs, managed OAuth, or hosted SaaS current product truth. Current package
READMEs, pack manifests, and implemented CLI behavior remain executable authority.

P120 remains responsible for clean Growth onboarding, provider connections, derived
readiness, instrumentation reconciliation, and the human-first console. P121 must consume
those results and must not redesign or duplicate them.

No P121 execution workpack exists until its bounded implementation begins. The proposed
workpack sequence below is planning authority, not evidence of implementation.

## Product Outcome

Unisane Ops supports six real user contexts through one operational system:

| User context                    | Primary experience                  | Required value                                                                                    |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| local developer                 | package and CLI                     | inspect, configure, audit, plan, apply, and verify in the current project                         |
| marketer or founder             | hosted console                      | understand performance, connections, priorities, and safe next actions without terminal knowledge |
| team or agency                  | hosted workspace                    | share projects, connections, roles, approvals, schedules, and activity safely                     |
| CI or automation                | JSON/action API                     | deterministic non-interactive checks and approved operations                                      |
| AI-agent user                   | MCP plus AI-host plugin/skills      | natural-language analysis and controlled action with explicit context and evidence                |
| enterprise/self-hosted operator | packages plus controlled deployment | data-boundary, identity, audit, and deployment control                                            |

Package-only operation remains valuable and supported. Hosted SaaS is optional. Both use
the same project intent and engine contracts.

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

## Target Architecture

### Layer 1: domain and provider owners

- `@unisane/growth`
- `@unisane/cloud`
- provider packages
- `@unisane/web-runtime`
- optional `@unisane/framework-ops`

These packages continue to own domain intent, provider execution, application runtime,
and Framework adaptation.

### Layer 2: one operational engine

`@unisane/ops-engine` owns:

- action descriptors and execution
- inventory and evidence normalization
- findings, readiness, and next actions
- effect and risk classification
- plan, authorization/approval, apply, rollback-plan, receipt, and drift
- idempotency, locks, artifact/state/secret ports
- asynchronous action/job semantics

### Layer 3: transport-neutral action contract

The initial public contract lives at `@unisane/ops-engine/actions`. It must be usable
without a CLI parser, React, a provider SDK, or a hosted database.

Core structures:

| Contract           | Responsibility                                                                         |
| ------------------ | -------------------------------------------------------------------------------------- |
| action descriptor  | stable id, schemas, owner, effect, requirements, and presentation hints                |
| execution context  | actor, `scopeId` when hosted, project, site, target, environment, and request identity |
| action request     | typed input, idempotency, expected resource/version, and explicit intent               |
| action result      | typed data, human summary, evidence, freshness, findings, and next actions             |
| approval reference | authoritative approval identity, scope, target, effect, expiry, and approver           |
| receipt            | immutable outcome, before/after identity, effect, actor, request, and verification     |
| job reference      | queued/running/terminal state, progress, cancellation, retry, and result               |
| error              | stable code, affected identity, retryability, blocking effect, and recovery action     |

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

Exact deployable/package boundaries are frozen only when workload, security, scaling, and
independent-deployment evidence justify them. Do not create a microservice per list item.

## User Journeys

### Developer and local agent

1. User opens an existing project.
2. User runs `unisane ops init`.
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

Exact public tool ids are frozen in the first MCP workpack after scenario evaluation.
There must not be one generic `run_command` tool and there must not be a tool for every
CLI spelling.

### Local MCP

- runs through STDIO
- binds the explicit current project root
- uses local actor and secret/state adapters
- works offline for offline actions
- does not expose arbitrary shell or filesystem operations
- does not silently enable itself globally

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

## Hosted Platform Capability Sequence

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

## Proposed P121 Implementation Sequence

### P121-W1: action contract and adapter parity

1. inventory current command descriptors, findings, actions, effects, and async behavior
2. freeze `@unisane/ops-engine/actions`
3. make CLI human/JSON and console state lower from it
4. add bounded output, pagination, job, error, approval, receipt, and deep-link contracts
5. prove no adapter-to-adapter execution

Exit: representative Growth and Cloud read/plan/apply flows execute through one action
contract with parity and mutation-safety proof.

### P121-W2: local MCP and agent evaluations

1. create `@unisane/ops-mcp`
2. implement STDIO transport and project-scoped configuration
3. design the minimum goal-oriented tool catalog from real scenarios
4. add structured result-size and pagination behavior
5. test Codex, Claude, Gemini, and one CI agent workflow
6. add prompt-injection, secret, authorization, confused-deputy, and replay tests

Exit: agents complete representative audits and prepare safe plans without parsing CLI
text or receiving raw secrets.

### P121-W3: AI-host plugins and distribution

1. build Codex/ChatGPT AI-host plugin and skills
2. build Claude AI-host plugin and marketplace entry
3. add install/auth/select-project/recovery guidance
4. validate host-specific manifests, permissions, upgrade, and removal
5. add optional small UI only after headless tool success

Exit: a new user can install, authenticate, select the correct project, run an audit, and
understand a safe next action in each supported host.

### P121-W4: managed control-plane foundation and remote MCP

1. freeze hosted identity, `scopeId`, project, connection, action, and job boundaries
2. build managed OAuth/secret custody and hosted action gateway
3. add durable stores and workers
4. expose authenticated remote MCP and HTTP actions
5. prove tenant isolation, revocation, quotas, rate limits, audit, and failure recovery

Exit: a remote agent can perform authorized read/plan operations and only approved
mutations without a developer machine remaining online.

### P121-W5: team console and continuous operations

1. add workspaces, members, roles, invitations, and approval inbox
2. add multi-project/agency navigation
3. add schedules, alerts, job history, and notification preferences
4. connect the same console pages to hosted actions and durable history
5. preserve P120's normal-user-first information hierarchy

Exit: a non-technical team can operate recurring Growth/Cloud workflows safely.

### P121-W6: commercial, marketplace, and enterprise readiness

1. usage metering, plans, entitlements, quotas, and billing
2. public plugin review/publishing and maintained host compatibility
3. retention, export, deletion, audit, SSO/provisioning, and regional controls
4. evaluate controlled self-hosted/private-network demand
5. publish support, incident, deprecation, and compatibility policies

Exit: hosted distribution is supportable as a real product rather than a demo control
plane.

## Dependency And Sequencing Rules

- P120-W1 action/readiness/connection contracts must stabilize before P121-W1 freezes
  external action semantics.
- P120-W3 owns console UX; P121-W5 hosts it and adds team capabilities without creating
  another design system or route hierarchy.
- P120-W4 informs credential/team requirements; P121-W4 owns hosted implementation.
- Local MCP may ship before SaaS.
- Remote MCP requires hosted identity, authorization, secret custody, audit, and rate
  limiting.
- AI-host plugins must not ship mutation tools before the action approval/receipt
  contract is executable.
- Commercial work begins only after local/MCP/hosted workflow value is proven.

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
- zero provider SDK imports in UI/MCP/plugin packages
- zero raw secret/token tool fields
- zero unapproved mutation paths
- zero second config/readiness/receipt owner
- exact local/remote shared-tool parity
- exact actor/`scopeId`/project/environment/resource audit context

### Product gates

- first-time user can discover what Unisane can do without learning command ids
- project/site/environment is visible before analysis or action
- agent output names evidence freshness and uncertainty
- every blocked action gives one understandable recovery step
- dense analysis deep-links to the console instead of flooding the conversation
- installation, authentication, permission, revocation, and removal are understandable
- no AI-host plugin term is confused with a Framework plugin or Ops pack

### Operational gates

- bounded latency and payload budgets per action/tool family
- cancellation and retry behavior for long-running jobs
- provider quota/rate-limit coordination
- audit retention and incident reconstruction
- compatibility matrix tested against supported host versions
- versioned deprecation and migration policy for action/tool contracts

## Success Measures

Track outcomes rather than feature count:

- time from installation/sign-in to first trustworthy finding
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

## Documentation And Lifecycle

When P121 implementation begins:

1. create only the active bounded workpack and convergence contract
2. keep this plan at strategy level
3. update the finding status and target workpack
4. update MCP security and command workflow docs when executable behavior changes
5. update package READMEs and generated references in the same cut
6. archive completed workpacks and remove dead planning duplication
7. never teach target installation or tool ids before implementation proof
