---
id: 'F-f96742911871'
owner: 'unisane'
scope: workspace
role: finding
lifecycle: active
authority: supporting
provenance: accepted
view: current
status: open
severity: MUST
---

# F-20260729 Unisane Ops AI And Hosted Delivery Gap

## Changelog

- `2026-08-02`: Added the missing production execution kernel and clarified that
  local/private AI-host bindings may precede SaaS while public hosted plugins depend on
  durable identity, execution, recovery, privacy, support, and compatibility gates.
- `2026-08-02`: Expanded the open gap to include the missing shared Growth playbook,
  evidence-bound context, resumable handoff, skill-binding, and plain-language guidance
  contracts required before agent or hosted delivery is trustworthy.
- `2026-07-29`: Replaced the absent program-index command with Skopos-selected Project
  Memory validation.
- `2026-07-29`: Opened the MUST gap for the missing transport-neutral action contract,
  MCP server, AI-host distribution, and managed hosted-platform boundary over the
  otherwise correct Ops package/engine foundation.

## Summary

- Severity: `MUST`
- Status: `open`
- Owner: `architecture-program`
- Target Pack: `P121-W1 (unopened)`

## Symptom

Unisane Ops has the correct package direction and plans one CLI, one headless engine,
provider packs, agent-safe JSON, and a human-first console. It does not yet define or
implement:

- one public transport-neutral action contract
- local or remote MCP transport
- goal-oriented AI tool schemas
- versioned Growth goals/playbooks shared by Help, console, CLI, MCP, and skills
- evidence-bound, actor-scoped context briefs and resumable handoffs
- a durable distinction between accepted business context, transient run state, model
  output, and raw conversation text
- thin skill bindings that reference actions/playbooks without owning workflow or safety
- Codex/ChatGPT or Claude AI-host distribution
- hosted identity, project, connection, action, job, and tenant boundaries
- separate audience-bound MCP identity and downstream provider OAuth identity
- managed OAuth/secret custody
- transactional action admission and durable dispatch
- durable remote jobs, schedules, alerts, and shared activity
- at-least-once provider execution, operation receipts, and ambiguous-outcome
  reconciliation
- backup/restore, dead-letter recovery, observability, incident ownership, retention,
  deletion, and tenant-isolation proof
- remote agent authorization, service identity, quotas, and audit
- hosted usage, entitlement, billing, retention, or enterprise boundaries

Agents can eventually invoke CLI JSON, but shell access alone does not provide adequate
tool discovery, remote authentication, cross-host distribution, bounded context
responses, or a normal installation experience. A local-only console also does not meet
the needs of non-technical, team, agency, scheduled, or remote-agent users.

## Impact

Without an explicit boundary, future work could:

- turn CLI text into an accidental API
- create separate MCP tools and SaaS handlers with duplicated business logic
- let AI-host plugins become policy or workflow truth
- introduce raw credential/token arguments
- permit conversational confirmation to substitute for authorization
- fork project config, readiness, approval, receipts, or provider behavior in SaaS
- overload the word `plugin` across Framework and AI-host products
- build a costly hosted platform before proving local and agent user value
- publish a remote plugin before the hosted authorization and operational boundary is
  supportable
- claim exactly-once mutation where an external provider may accept a request before a
  timeout or worker failure
- pass an MCP access token through to a provider and create a confused-deputy boundary
- leave Help, feature guidance, conversation starters, and host skills as drifting prose
- make users learn internal readiness, evidence, action, or receipt terminology
- repeat research and project explanation because agent sessions cannot resume through
  authoritative references

## Fix Plan

1. Complete P120 prerequisites for onboarding, connection, readiness, and console truth.
2. Freeze Growth goal/playbook descriptors and engine-owned workflow run, context brief,
   decision, handoff, verification, and evidence-invalidation semantics.
3. Freeze `@unisane/ops-engine/actions` as the one action contract.
4. Prove Growth health, SEO research, and measurement-audit pilots across headless,
   CLI/JSON, console, and plain-language guidance projections.
5. Add `@unisane/ops-mcp` with one local/remote tool registry.
6. Validate goal-oriented tools and resumable context with Codex, Claude, Gemini, and CI
   scenarios.
7. Freeze the hosted execution spine: principal and tenant boundary, transactional
   admission, outbox dispatch, versioned jobs, secret custody, reconciliation, audit,
   retention, backup/restore, and incident ownership.
8. Ship thin local/private Codex/ChatGPT and admitted Claude bindings over evaluated
   local MCP without a public hosted claim.
9. Add hosted identity, `scopeId`, connections, durable stores/jobs, workers, and remote
   MCP; prove one read-only action before one approved mutation.
10. Publish public hosted plugins only after production remote-MCP and operational gates
    pass.
11. Add team, schedule, alert, commercial, retention, and enterprise capability only in
    later bounded workpacks.
12. Enforce zero duplicate engine/config/readiness/approval/receipt/provider/workflow
    owner.

## Verification

- action contract and adapter-parity tests
- playbook/action reference integrity and cross-surface guidance-parity tests
- context minimization, evidence invalidation, handoff/resume, and raw-transcript denial
  tests
- plain-language usability evaluation for the three pilot workflows
- MCP protocol, auth, bounded-output, and cross-host compatibility proof
- prompt-injection, credential-exfiltration, confused-deputy, replay, and tenant tests
- read/plan/approve/apply/receipt/drift scenario proof
- exact human/agent/service actor audit evidence
- hosted job retry/cancellation/rate-limit proof
- atomic admission/outbox and process-interruption recovery proof
- duplicate-delivery, partial-result, unknown-outcome, and provider reconciliation proof
- MCP audience validation and provider-token non-passthrough proof
- encrypted token rotation/revocation and tenant-isolation proof
- backup/restore, dead-letter, retention/deletion, observability, and incident-runbook
  proof before public hosted distribution
- repository-wide owner/import/secret-schema detectors
- `pnpm docs:core:check`
- Project Memory validation selected by the owning Skopos Task

## Linked Docs

- `docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md`
- `docs/work/plans/unisane-ops-ai-native-and-hosted-platform-plan.md`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
