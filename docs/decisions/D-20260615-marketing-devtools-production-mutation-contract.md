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

## Context

The marketing devtools ads lane can build reviewed Google Ads plans, generate dry-run receipts, and execute receipt-backed live operations. The original Google Ads live campaign creation executor allowed API test accounts only. That protected production spend, but blocked legitimate launch workflows where the operator has already completed reviewed-plan, dry-run, production confirmation, account confirmation, exact operation confirmation, and approval-reference steps.

True Resume needs to launch controlled paid-search campaigns from the same governed devtools workflow used for planning and receipts. Production mutation therefore needs an explicit product decision rather than an implicit test-account-only limitation.

## Decision Drivers

- Paid acquisition launches must be reproducible from reviewed plan artifacts and receipts.
- Production spend changes must remain opt-in, auditable, and harder to trigger than dry-run planning.
- The workflow must keep campaign enablement and budget/spend expansion as separate approval surfaces.
- Operators need one governed lane instead of switching to manual UI setup after devtools planning.

## Considered Options

1. Keep Google Ads live creation restricted to API test accounts only.
2. Allow production Google Ads creation through devtools with existing receipt and confirmation gates only.
3. Allow production Google Ads creation through devtools with existing gates plus a dedicated production-customer mutation env flag.

## Decision

Select option 3.

Marketing devtools may create Google Ads campaigns in production customer accounts when all of these are true:

- the ads plan is reviewed
- the dry-run apply receipt hash matches the plan
- account confirmation and production confirmation are provided
- an approval reference is provided
- exact live operation confirmation is provided
- live executor mode is `api`
- `UNISANE_MARKETING_ADS_LIVE_MUTATION=enabled`
- for non-test Google Ads customers, `UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION=enabled`

The initial production Google Ads creation executor must create campaigns, ad groups, ads, and campaign assets in paused state. Enabling campaigns, raising budgets, or broadening targeting remain separate approval events.

## Consequences

- Positive: Production launch setup can be performed through the same auditable devtools lane used for planning and dry-run validation.
- Positive: Accidental production mutation still requires multiple independent confirmations and a production-specific env gate.
- Positive: Test-account API proof remains available without the production-customer env flag.
- Negative / tradeoffs: The devtools lane now has authority to touch real ad accounts when explicitly enabled, so CI/local environments must not set the production-customer env flag by default.

## Enforcement Updates

- Gates/scripts/docs updated to enforce decision:
  - Google Ads live campaign creation now blocks non-test customers unless `UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION=enabled`.
  - Existing reviewed-plan, receipt, confirmation, approval reference, operation confirmation, and `UNISANE_MARKETING_ADS_LIVE_MUTATION=enabled` gates remain in force.
- Validation commands:
  - `pnpm --filter @unisane/devtools check-types`
  - `pnpm --filter @unisane/devtools exec vitest run src/commands/ads/__tests__/ads.test.ts`
  - `pnpm program:index:check`

## Rollback / Follow-up

- Rollback: remove production-customer env support and restore the test-account-only guard.
- Follow-up: add a production launch runbook for marketing operators once the first receipt-backed production campaign creation is complete.

## Changelog

- 2026-06-15: Initial decision entry created to allow guarded production Google Ads mutation through marketing devtools.
