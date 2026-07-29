---
id: 'DOC-69904c963efd'
owner: 'unisane'
scope: workspace
role: guide
lifecycle: durable
authority: supporting
provenance: accepted
view: current
---

# Manage Marketing Devtool With LLM

Use this guide when an LLM-driven workflow connects, audits, reports, or operates
marketing providers through the canonical `unisane growth ...` command pack.

## Changelog

- `2026-07-25`: Routed Google provider inventory guidance through the canonical sealed
  `unisane provider google ...` pack.
- `2026-07-27`: Removed the unreleased root aliases and Devtools facades. Marketing,
  SEO, ads, analytics, and GTM operations now have only the canonical
  `unisane growth ...` routes.
- `2026-07-25`: Recorded implemented Meta provider ownership: saved auth,
  discovery/inventory, Ads reporting, asset upload, and remote campaign execution now
  come from `@unisane/provider-meta`; Growth retains strategy and operational safety.
- `2026-07-25`: Recorded implemented Google Ads live campaign ownership: Growth retains
  plan, approval, lock, blocker, and receipt safety, while
  `@unisane/provider-google/marketing` performs injected remote campaign mutation.
- `2026-07-25`: Recorded implemented Google marketing-report ownership: Google Ads, GA4,
  and Search Console API transports now come from
  `@unisane/provider-google/marketing` through an injected Growth driver contract.
- `2026-07-25`: Recorded implemented marketing ownership: the complete headless control
  plane now lives at `@unisane/growth/marketing`; Devtools retains transitional command
  and console composition while provider API transports await provider-driver
  distribution.
- `2026-07-25`: Recorded implemented SEO ownership: provider-neutral research workflows
  live at `@unisane/growth/seo`, while GA4, Search Console, and Google Ads Keyword Planner
  execution lives at `@unisane/provider-google/seo`; current Devtools commands are
  composition only.
- `2026-07-25`: Recorded `@unisane/provider-google` as the shared Google OAuth,
  project/API, setup, and product-discovery owner consumed by transitional marketing and
  SEO workflows.
- `2026-07-24`: Added extraction authority: documented current Devtools commands as implemented operations while target marketing ownership moves to Unisane Ops Growth.
- `2026-06-01`: Added the structured marketing research memory workflow and `marketing research status` dashboard sync step so external research context is curated into durable records instead of raw transcripts.
- `2026-05-27`: Added GTM read-only discovery to the shared marketing Google auth profile and documented Google product inventory as the resource-discovery lane.
- `2026-05-27`: Clarified that repo-relative `--cwd` app paths are valid from normal `pnpm --filter @unisane/devtools exec` commands.
- `2026-05-27`: Added `marketing setup prelive` as the first local readiness command before real-account provider work.
- `2026-05-27`: Linked the provider control-plane baseline so marketing LLM workflows defer provider command grammar, auth, env, artifact, and mutation-risk rules to the shared SSOT.
- `2026-05-27`: Added the human/LLM operating contract for marketing auth, local env placement, provider pulls, dashboard artifact sync, and command ownership. Marketing, GTM, and SEO command lanes now default saved auth profiles from the app/platform id when local config is present.

## Command Authority

The sole command surface is `unisane growth marketing|seo|ads|analytics ...`.

The suite owner is Unisane Ops Growth. Marketing configuration, normalized reporting,
research, recommendations, experiments, audits, proof state, and ads workflows come from
`@unisane/growth/marketing`. SEO research behavior comes from `@unisane/growth/seo`;
GA4, Search Console, and Google Ads Keyword Planner execution comes from
`@unisane/provider-google/seo`, while Google Ads, GA4, and Search Console marketing
report transports, Google account discovery, and Google Ads live campaign mutation come
from `@unisane/provider-google/marketing` through injected Growth contracts. Growth owns
marketing, ads, analytics, SEO, and console registration and presentation. Saved Meta auth, Graph
discovery/inventory, Ads reporting, asset upload, and remote campaign execution come
from `@unisane/provider-meta`; Growth retains normalized contracts, strategy, plans,
confirmations, approvals, locks, blockers, and receipts. Lifecycle safety comes from the
shared Ops engine. `@unisane/devtools` does not register or re-export Growth commands;
follow the Ops baseline and canonical pack host.

## Goal

Make the marketing devtool usable with minimal developer hand-holding. LLM agents should run safe local commands directly, explain only the provider-dashboard steps humans must perform, and keep local dashboard state synchronized from artifacts.

The default stance is:

1. read platform marketing config first
2. use app/platform-scoped saved auth profiles instead of raw access-token env vars
3. run read-only status, doctor, proof, and pull commands directly
4. keep provider data in local normalized artifacts
5. ask the human only for provider-console actions, approvals, or missing account permissions

## Open First

1. App-local `<deployable>/config/marketing.ts`
2. App-local `<deployable>/docs/marketing/README.md`
3. `docs/guides/manage-google-tag-manager-with-llm.md` when GTM state is involved
4. `docs/standards/12-provider-control-plane-baseline.md` when provider setup, env simplification, auth, inventory, plan/apply, or mutation safety is involved
5. `docs/guides/command-workflow-contract.md`
6. App-local `.unisane/START_HERE.md` when present

## Research Memory

Marketing research memory is for durable planning context from competitor reviews, keyword
research, landing-page planning, provider observations, and external discussion sessions.

Use this rule:

1. Keep raw chats/transcripts outside the dashboard input path.
2. Curate the useful context into app-local `docs/marketing/research/**/*.json` records.
3. Store findings, decisions, opportunities, rejected ideas, next actions, related routes,
   keywords, competitors, and evidence notes.
4. Run:

```bash
pnpm --filter unisane exec unisane growth marketing research status --cwd <app-cwd>
pnpm --filter unisane exec unisane growth marketing console build --cwd <app-cwd>
```

Research memory does not replace Search Console, GA4, Google Ads, or keyword-metric proof. Treat it
as planning context that can promote accepted ideas into SEO opportunities, content briefs, ads
plans, or landing-page work after evidence gates are refreshed.

## Human Versus LLM Ownership

LLM agents should do these without asking when the user wants setup, verification, or sync:

1. inspect `config/marketing.ts`, `config/google-tag-manager.ts`, and relevant env metadata
2. run `marketing setup prelive` first, then drill into `marketing auth status`, `marketing doctor`, `marketing proof status`, `marketing status`, and `analytics status` only when the pre-live report points there
3. run read-only provider pulls once account ids and profiles exist
4. rebuild or refresh local dashboard artifacts when the command exists
5. explain missing provider evidence as setup/data readiness, not as app failure
6. keep secrets out of chat and docs

Humans must do these provider-dashboard actions:

1. create or approve OAuth clients when no reusable client exists
2. grant the Google/Meta user account the required provider permissions
3. verify Search Console domains
4. link Search Console to GA4
5. enable provider APIs, accept provider terms, configure billing, or resolve policy holds
6. explicitly approve live provider mutations, spend increases, GTM publish, or rollback

## Env And Secret Rules

Keep env small and scoped.

Deployment env is only for runtime app behavior, for example public base URL, public GTM container id, and app runtime provider settings. Local marketing devtool env belongs in the app-local `.env.local` or shell session used by the operator. Do not add local report-only env refs to production deployment env unless the deployed app runtime actually reads them.

Use this precedence:

1. app/platform-scoped saved auth profile in Keychain for normal local use
2. provider account id env refs in local `.env.local`
3. raw access-token env vars only as fallback/debug lanes

When a marketing config or SEO platform id is available, commands default the saved profile name to
the app/platform id. For True Resume this means `true-resume`. Pass `--auth-profile` or
`--meta-auth-profile` only to override that default.

Google marketing auth:

```bash
pnpm --filter unisane exec unisane growth marketing auth login \
  --cwd <app-cwd> \
  --profile <profile> \
  --client-id "$GOOGLE_OAUTH_CLIENT_ID"
```

The marketing auth profile stores refresh-token credentials outside the repo. It can mint scoped access tokens for Google Ads, GA4, and Search Console pulls. Do not ask the user to manually create `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN`, `GA4_ACCESS_TOKEN`, or `GOOGLE_ADS_ACCESS_TOKEN` unless auth-profile use is blocked.
It also includes GTM read-only scope for Google product inventory and tag/container discovery.

Google OAuth client-secret env:

- `GOOGLE_OAUTH_CLIENT_SECRET` is the shared default for GTM and Marketing Google auth.
- `GOOGLE_OAUTH_CLIENT_SECRET` is the sole Google control-plane OAuth client-secret env.
- Client id and client secret are different values; never treat a client id as a secret.

Meta auth:

```bash
pnpm --filter unisane exec unisane growth marketing auth meta save \
  --cwd <app-cwd> \
  --profile <profile>
```

Use a saved Meta auth profile for local pulls. Raw `META_ADS_ACCESS_TOKEN` remains a fallback/debug lane.

SEO provider fetches are part of the same suite. They should reuse the marketing Google profile
first, then fall back to the older generic Google auth profile or raw access-token env only when the
marketing profile is not available.

Provider account env refs are not OAuth tokens:

| Provider       | Account Env                                                                                     | Token Handling                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Google Ads     | `GOOGLE_ADS_CUSTOMER_ID`, optional `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN` | Prefer `marketing auth --profile`; raw `GOOGLE_ADS_ACCESS_TOKEN` fallback only            |
| GA4            | `GA4_PROPERTY_ID` numeric property id                                                           | Prefer `marketing auth --profile`; raw `GA4_ACCESS_TOKEN` fallback only                   |
| Search Console | `GOOGLE_SEARCH_CONSOLE_SITE_URL`, for example `sc-domain:example.com`                           | Prefer `marketing auth --profile`; raw `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` fallback only |
| Meta Ads       | `META_AD_ACCOUNT_ID`, optional pixel/dataset/page/Instagram refs                                | Prefer `marketing auth meta --profile`; raw `META_ADS_ACCESS_TOKEN` fallback only         |

## Status And Sync Workflow

Run these from workspace root with explicit app cwd:

```bash
pnpm --filter unisane exec unisane growth marketing setup prelive --cwd <app-cwd>
pnpm --filter unisane exec unisane provider google products inventory --cwd <app-cwd> --auth-namespace marketing
pnpm --filter unisane exec unisane growth marketing auth status --cwd <app-cwd>
pnpm --filter unisane exec unisane growth marketing doctor --cwd <app-cwd>
pnpm --filter unisane exec unisane growth marketing proof status --cwd <app-cwd>
pnpm --filter unisane exec unisane growth marketing status --cwd <app-cwd>
pnpm --filter unisane exec unisane growth analytics status --cwd <app-cwd>
```

`<app-cwd>` may be repo-relative, for example `unisane-platforms/apps/true-resume`. The devtool must normalize that path even though `pnpm --filter ... exec` launches the command from the devtools package directory.

Interpretation rules:

1. `marketing setup prelive` is the first local gate before live account use; a non-zero result means setup is not complete yet and the report owns the next action.
2. `google products inventory --auth-namespace marketing` is read-only resource discovery for GTM accounts/containers, GA4 properties, Search Console sites, and Google Ads customers.
3. `configured` means local config/env/auth is present.
4. `missing provider pull artifact` means the dashboard has no normalized report data yet.
5. `stale` means a previous artifact exists but should be refreshed before decisions.
6. New Search Console or GA4 properties can be correctly configured while still having no report data.
7. Local dashboard pages consume artifacts; they do not prove that provider consoles have fresh data unless a recent pull artifact exists.

## Provider Pull Workflow

Run narrow read-only pulls before recommendations or optimization:

```bash
pnpm --filter unisane exec unisane growth marketing pull-api \
  --cwd <app-cwd> \
  --provider searchConsole \
  --report queryPage \
  --start-date <YYYY-MM-DD> \
  --end-date <YYYY-MM-DD> \
  --auth-profile <profile>

pnpm --filter unisane exec unisane growth marketing pull-api \
  --cwd <app-cwd> \
  --provider ga4 \
  --report landingPage \
  --start-date <YYYY-MM-DD> \
  --end-date <YYYY-MM-DD> \
  --auth-profile <profile>
```

Use the smallest report family that answers the question. Do not run broad provider pulls repeatedly when status says the provider has no data because a property was just created.

## Mutation Rules

Read-only commands are safe to run directly. Live mutation commands need explicit user approval and command-level receipts.

Safe by default:

1. auth status
2. doctor/status/proof
3. validate/audit
4. read-only pull and report commands
5. dry-run plans and diffs

Require explicit approval:

1. GTM apply, preview, version, publish, or rollback
2. ads apply, asset upload, campaign enable, budget increase, or spend-changing mutation
3. destructive deletes or provider account setting changes

Never convert a missing env or missing artifact into a live mutation. First produce status, explain the blocker, then run the narrowest safe setup command.

## Completion Checklist

1. App marketing config and docs were read before commands.
2. `marketing setup prelive` was run, or the reason it could not run is recorded.
3. Auth profile status is known.
4. Provider account ids are configured locally when required.
5. Read-only status/proof output has been checked.
6. Fresh provider pulls exist before recommendations.
7. Dashboard interpretation separates config readiness from data freshness.
8. Only human-owned dashboard actions are handed back to the user.
9. No secret values were printed or committed.
