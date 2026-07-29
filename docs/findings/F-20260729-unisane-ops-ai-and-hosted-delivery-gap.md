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
- Codex/ChatGPT or Claude AI-host distribution
- hosted identity, project, connection, action, job, and tenant boundaries
- managed OAuth/secret custody
- durable remote jobs, schedules, alerts, and shared activity
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

## Fix Plan

1. Complete P120 prerequisites for onboarding, connection, readiness, and console truth.
2. Freeze `@unisane/ops-engine/actions` as the one action contract.
3. Prove CLI/JSON/console lowering and mutation safety over representative flows.
4. Add `@unisane/ops-mcp` with one local/remote tool registry.
5. Validate goal-oriented tools with Codex, Claude, Gemini, and CI scenarios.
6. Ship thin Codex/ChatGPT and Claude AI-host distribution artifacts.
7. Add hosted identity, `scopeId`, connections, durable stores/jobs, and remote MCP.
8. Add team, schedule, alert, commercial, retention, and enterprise capability only in
   later bounded workpacks.
9. Enforce zero duplicate engine/config/readiness/approval/receipt/provider owner.

## Verification

- action contract and adapter-parity tests
- MCP protocol, auth, bounded-output, and cross-host compatibility proof
- prompt-injection, credential-exfiltration, confused-deputy, replay, and tenant tests
- read/plan/approve/apply/receipt/drift scenario proof
- exact human/agent/service actor audit evidence
- hosted job retry/cancellation/rate-limit proof
- repository-wide owner/import/secret-schema detectors
- `pnpm docs:core:check`
- Project Memory validation selected by the owning Skopos Task

## Linked Docs

- `docs/decisions/D-20260729-unisane-ops-ai-native-and-hosted-delivery-contract.md`
- `docs/work/plans/unisane-ops-ai-native-and-hosted-platform-plan.md`
- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
