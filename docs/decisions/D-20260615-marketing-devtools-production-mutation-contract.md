---
id: 'D-e72ef0e604d0'
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

# D-20260615 Marketing Devtools Production Mutation Contract

## Current Supersession

The production-mutation safety posture in this Decision remains accepted, but its
product and execution owner changed on `2026-08-15`. Remote advertising inventory,
pull, plan, apply, repair, verification, approval, and receipt behavior belongs to one
typed Unisane Ops `ActionDefinition` reached through `unisane-ops`. Growth owns
provider-neutral campaign intent and safety policy; the selected Ops provider package
owns remote transport.

Framework Compiler and Devtools perform no provider or network mutation and own no Ads
approval or receipt workflow. Any physical marketing command or live executor still
present in Devtools is observed implementation residue pending a clean source cut. It is
not a supported command, compatibility wrapper, forwarding alias, or second action
path. This Decision update changes authority only; it does not claim that source has
already moved.

## Context

The observed marketing Devtools ads lane can build reviewed Google Ads plans, generate dry-run receipts, and execute receipt-backed live operations. The original Google Ads live campaign creation executor allowed API test accounts only. That protected production spend, but blocked legitimate launch workflows where the operator has already completed reviewed-plan, dry-run, production confirmation, account confirmation, exact operation confirmation, and approval-reference steps.

True Resume needs to launch controlled paid-search campaigns through the same governed
Ops action lifecycle used for planning and receipts. Production mutation therefore needs
an explicit product decision rather than an implicit test-account-only limitation.

## Decision Drivers

- Paid acquisition launches must be reproducible from reviewed plan artifacts and receipts.
- Production spend changes must remain opt-in, auditable, and harder to trigger than dry-run planning.
- The workflow must keep campaign enablement and budget/spend expansion as separate approval surfaces.
- Operators need one governed lane instead of switching to manual UI setup after Ops
  planning.

## Considered Options

1. Keep Google Ads live creation restricted to API test accounts only.
2. Allow production Google Ads creation through devtools with existing receipt and confirmation gates only.
3. Allow production Google Ads creation through the governed provider action with
   existing gates plus a dedicated production-customer mutation env flag.

## Decision

Select option 3 with the current Ops ownership above.

One typed Ops advertising action may create Google Ads campaigns in production customer
accounts when all of these are true:

- the ads plan is reviewed
- the dry-run apply receipt hash matches the plan
- account confirmation and production confirmation are provided
- an approval reference is provided
- exact live operation confirmation is provided
- live executor mode is `api`
- `UNISANE_MARKETING_ADS_LIVE_MUTATION=enabled`
- for non-test Google Ads customers, `UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION=enabled`

The production Google Ads provider executor must create campaigns, ad groups, ads, and
campaign assets in paused state. Enabling campaigns, raising budgets, or broadening
targeting remain separate typed actions and approval events.

## Consequences

- Positive: Production launch setup can be performed through the same typed Ops action
  protocol used for planning, dry-run validation, approval, verification, and receipts.
- Positive: Accidental production mutation still requires multiple independent confirmations and a production-specific env gate.
- Positive: Test-account API proof remains available without the production-customer env flag.
- Negative / tradeoffs: The Ops provider action has authority to touch real ad accounts
  when explicitly enabled, so CI/local environments must not set the production-customer
  env flag by default.

## Enforcement Updates

- Target gates/scripts/docs must enforce:
  - Google Ads live campaign creation now blocks non-test customers unless `UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION=enabled`.
  - Existing reviewed-plan, receipt, confirmation, approval reference, operation confirmation, and `UNISANE_MARKETING_ADS_LIVE_MUTATION=enabled` gates remain in force.
- Every CLI, MCP, API, console, automation, or agent adapter invokes the same typed
  `ActionDefinition` and renders its structured result. No adapter invokes another CLI,
  captures terminal/process output, or reconstructs approval or receipt behavior.
- The following commands characterize the observed Devtools residue only; they are not
  target release proof and must disappear with that owner:
  - `pnpm --filter @unisane/devtools check-types`
  - `pnpm --filter @unisane/devtools exec vitest run src/commands/ads/__tests__/ads.test.ts`
  - `pnpm program:index:check`

## Rollback / Follow-up

- Rollback: remove production-customer env support and restore the test-account-only guard.
- Follow-up: complete the clean source cut into the Ops action/provider owners, delete
  the Devtools command/executor residue, and add a production launch runbook once the
  first receipt-backed production campaign creation is complete.

## Changelog

- `2026-08-15`: Preserved the production Ads safety gates while assigning every remote
  operation, approval, verification, and receipt to one typed Unisane Ops action through
  `unisane-ops`. Devtools is observed residue only; no source move is claimed.
- 2026-06-15: Initial decision entry created to allow guarded production Google Ads mutation through marketing devtools.
