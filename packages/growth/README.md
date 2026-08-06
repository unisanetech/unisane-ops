# @unisane/growth

Provider-neutral Growth contracts, readiness, desired state, analysis, planning, and
mutation policy for Unisane Ops.

## Ownership

- `@unisane/growth/contracts` owns the versioned `growthConfigContribution` and
  provider-neutral contracts.
- `@unisane/growth/actions` owns Growth action adapters over domain logic. The
  `createGrowthHealthReviewAction(...)` and
  `createGrowthSeoOpportunityResearchAction(...)` and
  `createGrowthMeasurementAuditAction(...)` factories bind authoritative Growth
  evidence to registered read actions. They return bounded evidence plus the shared
  workflow projection through the Ops execution contract without accepting config as
  tool input or importing a CLI or UI adapter.
- `@unisane/growth/playbooks` owns versioned Growth goals, playbook stages, action
  references, and plain-language presentation. Health review proves diagnosis; SEO
  opportunity research proves evidence-backed opportunity synthesis; measurement audit
  proves trust gating while keeping canonical outcomes distinct from provider-attributed
  conversions. None executes providers or duplicates tracking, Ops readiness, workflow,
  evidence, or resume state.
- `@unisane/growth/gtm` owns Tag Manager manifests, validation, deterministic planning,
  policy, and receipts.
- `@unisane/growth/seo` owns research, opportunities, briefs, performance feedback, and
  health evaluation.
- `@unisane/growth/marketing` owns event/conversion truth, normalized reporting,
  recommendations, experiments, tracking audits, and ads plans.

Growth does not own OAuth, token storage, provider resource discovery, or provider
transport. Those are host-injected from provider packages through canonical connection
bindings.

## Lifecycle

Growth is selected through the root lifecycle:

```bash
unisane ops init --growth --yes
unisane add growth --capability seo --capability analytics --yes
unisane connect google
unisane check
```

Project intent lives only in `unisane.config.ts`. Readiness is derived from shared
project, connection, resource, instrumentation, data, business-truth, decision, and
mutation findings.

After readiness permits the operation:

```bash
unisane growth seo ...
unisane growth marketing ...
unisane growth ads ...
unisane growth gtm ...
unisane growth console
```

Growth health review is the canonical readiness diagnosis for headless callers, the
CLI, and the console Overview:

```bash
unisane growth health review
unisane growth health review --environment production --finding-limit 20 --json
```

The review reads canonical Growth intent and only the provider report families required
by the selected capabilities. Human output and the Overview summary lower from the same
action-owned status, primary finding, recovery step, bounded findings, and freshness
evidence. Disabled mutation is treated as a valid safe policy, not as missing setup.

The guided measurement audit is available through the same structured workflow result:

```bash
unisane growth measurement audit
unisane growth measurement audit --json
```

Human CLI output and `Analytics > Tracking health` lower from the action-owned workflow
presentation. JSON returns the complete action result unchanged. Canonical
server-confirmed outcomes and provider-attributed conversions remain separate on every
surface.

SEO opportunity review follows the same contract:

```bash
unisane growth seo opportunities review
unisane growth seo opportunities review --market "US / en" --limit 5 --json
```

The CLI and `SEO > Opportunities` consume the action-owned ranking, confidence,
limitations, provenance, truncation, and next-step presentation. Missing or stale
research remains visible instead of becoming an unsupported recommendation. When the
canonical page inventory exists, the ranking also carries recorded Search Console
position, clicks, impressions, and click-through rate for the matched current page.
Sample, stale, conflicting, failed-crawl, and no-current-page evidence lowers trust and
remains explicit; it never becomes a zero metric or a confident live recommendation.

The same structured result includes a bounded research plan when evidence is incomplete
or unreliable. Each request names the affected opportunity, evidence source,
`collect`/`refresh`/`resolve-conflict` mode, required or recommended priority, cost
class, exact route/keyword/market target, reason, and a plain-language conversation
starter. Requests are deduplicated and truncated explicitly. They never execute merely
because they were suggested: every request records
`explicit-user-or-automation-authority-required`, and human CLI output repeats that
boundary.

After a person explicitly marks one recorded page opportunity as `approved`, prepare a
bounded implementation handoff without granting change authority:

```bash
unisane growth seo opportunities prepare \
  --opportunities docs/domains/seo/keyword-research/opportunities/pages.json \
  --id resume-templates \
  --out-dir docs/domains/seo/keyword-research/prepared \
  --dry-run
```

Preparation reruns the canonical opportunity review, selects the exact approved id,
and fails closed for low-confidence, sample, stale, conflicting, mismatched, missing, or
required-research evidence. A successful run writes equivalent versioned JSON and
human-readable Markdown packets containing the approved route and page specification,
selected evidence and provenance, recommended research, constraints, acceptance
criteria, and an honest relative post-publication measurement window. When no current
page metrics exist, the first observed post-publication result becomes the baseline;
the command does not manufacture a zero or predicted outcome.

The packet is suitable for a content-team or coding-agent conversation, but its
implementation approval is always `not-granted`. It is an offline artifact only and
does not authorize repository edits, CMS publication, provider mutation, or production
deployment. Those remain separate explicit workflows with their own review and proof.

After the externally reviewed page is live, record that fact without asking Growth to
publish it:

```bash
unisane growth seo opportunities record-publication \
  --packet docs/domains/seo/keyword-research/prepared/templates.implementation.json \
  --published-url https://example.com/templates \
  --published-at 2026-08-04T00:00:00Z \
  --recorded-by operator@example.com \
  --confirm-reviewed \
  --out docs/domains/seo/keyword-research/publications/templates.json
```

The immutable record binds the exact packet digest, project, environment, opportunity,
route, URL, reviewer, publication time, baseline, and derived verification dates. The
URL must match the approved route. `--confirm-reviewed` records human confirmation; it
does not provide repository, CMS, deployment, or provider authority.

On or after the declared verification date, refresh and compare the exact opportunity:

```bash
unisane growth seo opportunities verify-publication \
  --publication docs/domains/seo/keyword-research/publications/templates.json \
  --out docs/domains/seo/keyword-research/verifications/templates.json
```

Before the window, the result remains `waiting`. During or after the window, fresh
non-sample evidence may produce `improved`, `declined`, `mixed`, or `no-change`; when no
pre-publication metrics existed, the first reliable result is recorded as a baseline.
Missing or unreliable evidence produces `not-measurable`. Every result keeps causation
as `not-established`, preserves limitations, and compares only metrics present in both
windows. Both commands support `--dry-run` and `--json`.

## Local first-party site crawl evidence

Configure the first-party site, target markets, and conservative crawl defaults once:

```bash
unisane growth seo site configure \
  --site https://example.com \
  --market US/en \
  --market GB/en \
  --search-console-property sc-domain:example.com \
  --ga4-property 123456789 \
  --confirm-ownership
```

Setup requires an explicit local ownership or authorization confirmation, normalizes
the site to one origin, and preserves unrelated workspace settings when crawl defaults
are updated. It stores no credential or hosted identity.

Then capture a bounded, provider-neutral snapshot inside the existing SEO research
workspace:

```bash
unisane growth seo site crawl
unisane growth seo site crawl \
  --site https://example.com \
  --max-pages 100 \
  --max-depth 2 \
  --json
```

`--site` and individual limit flags remain available as one-run overrides. The default artifact is
`docs/domains/seo/keyword-research/site-crawls/latest.json`. A later run uses that file
as its previous snapshot and sends recorded `ETag` and `Last-Modified` validators. Use
`--previous <path>` to select another snapshot or `--no-incremental` for a clean crawl.

The crawler always remains same-origin, reads `robots.txt` conservatively, bounds
sitemaps, retained URLs, page requests, depth, redirects, response size, and request
time, and records partial failures instead of hiding them. Its evidence is explicitly
non-sample and static-HTML-only; it does not claim browser rendering, search-result
research, scheduling, or hosted persistence.

### Targeted browser-render evidence

Static HTML remains the discovery authority. When a recorded page has no title or H1,
or contains too little static text for a reliable content decision, capture a small
browser-rendered supplement:

```bash
unisane growth seo site render
unisane growth seo site render \
  --url https://example.com/app \
  --url https://example.com/pricing \
  --max-pages 2 \
  --json
```

Automatic selection considers only pages already present in the latest crawl. Explicit
`--url` values must also be recorded in that crawl. The command never discovers new
pages, sends credentials, or follows arbitrary off-site navigation. It blocks
cross-origin document navigation while allowing ordinary page assets, enforces page and navigation limits, records partial
failures, and writes separate non-sample evidence to
`site-renders/latest.json`. Cancellation closes the local browser and does not write a
partial artifact.

The default adapter uses an installed Google Chrome through Playwright Core. Use
`--browser-channel msedge` for installed Edge or
`--browser-executable /absolute/path/to/chromium` for another local Chromium-family
binary. If no supported browser is installed, the command fails with a clear local
prerequisite error; the static crawl remains valid and page inventory continues with an
explicit browser-rendering limitation. Browser rendering is intentionally targeted,
not a second crawler or a scheduled background loop.

## First-party search and analytics evidence

The site setup may bind the exact Search Console and GA4 resources expected for this
project. Provider fetches compare the host-selected resource with those bindings before
making a request or writing evidence, and Search Console URL-prefix and domain
properties must cover the configured site.

```bash
unisane growth seo performance fetch-search-console \
  --platform example \
  --start-date 2026-07-01 \
  --end-date 2026-07-31

unisane growth seo performance fetch-ga4 \
  --platform example \
  --start-date 2026-07-01 \
  --end-date 2026-07-31
```

Without `--out`, evidence is written under the configured SEO workspace as
`normalized/search-console-performance.latest.json` or
`normalized/ga4-performance.latest.json`. Version 2 performance artifacts record the
configured site, target-market context, exact provider resource, structured date range,
API or CSV provenance, explicit sample status, freshness, and known limitations.

CSV imports require `--property`, `--start-date`, `--end-date`, and an explicit
`--data-kind live|sample`; ambiguous imports fail closed. GA4 conversions and revenue
are named and explained as Analytics-measured evidence. They are never promoted to
canonical business outcomes, which require separate authoritative server or commerce
evidence.

## Local historical evidence

Growth keeps every timestamped provider pull as immutable local provenance and writes
`latest.json` only as a convenience pointer. A derived catalog at
`.unisane/marketing/history/catalog.json` indexes the exact period, provider resource,
metric totals, currency, partial state, sample status, and artifact digest. Existing
timestamped pulls are indexed automatically the first time history is read; repeated
pulls are idempotent, and a corrected pull for the same period supersedes the earlier
observation without deleting it.

```ts
import {
  compareLatestMarketingHistoryPeriods,
  queryMarketingHistory,
} from '@unisane/growth/marketing';

const history = queryMarketingHistory({
  cwd: process.cwd(),
  query: {
    provider: 'googleAds',
    reportType: 'campaign',
    metric: 'cost',
    startDate: '2026-06-01',
    endDate: '2026-07-31',
  },
});

const comparison = compareLatestMarketingHistoryPeriods(history);
```

Queries are bounded and report coverage, gaps, overlapping windows, partial periods,
and truncation. A previous-period comparison is available only when both recorded
windows have equal duration, do not overlap, are complete, and use one compatible
currency. Missing or unsafe comparisons remain explicitly unavailable.

Daily history is collected by running the existing provider report for exact one-day
windows. The provider-neutral planner bounds one batch to 90 days by default and 366
days at most, returns a continuation cursor, and stops at the first provider failure so
the operator can resume without repeating completed days. This avoids treating a
multi-day total as if the provider had supplied daily facts.

```bash
unisane growth marketing history backfill \
  --provider googleAds \
  --report campaign \
  --start-date 2026-06-01 \
  --end-date 2026-07-31 \
  --dry-run
```

Remove `--dry-run` after reviewing the bounded windows. If a provider call fails, resume
with the reported `--after-date`; successfully recorded days remain idempotent.

```ts
import {
  executeMarketingHistoryBackfill,
  planMarketingHistoryBackfill,
} from '@unisane/growth/marketing';

const plan = planMarketingHistoryBackfill({
  target: { provider: 'googleAds', reportType: 'campaign', accountId: '1234567890' },
  startDate: '2026-06-01',
  endDate: '2026-07-31',
});

const result = await executeMarketingHistoryBackfill({
  plan,
  pullDay: async (target, window) => providerHost.pullReport({ ...target, ...window }),
});
```

The callback is composed by the local provider host and returns the history observation
written by the ordinary report-ingestion path. Backfill does not own credentials,
provider selection, scheduling, retries, or a second storage mechanism.

The local retention contract reserves 90 days for raw provider pulls, 24 months for
normalized daily facts, 60 months for monthly rollups, 13 months for research snapshots,
and project lifetime for milestones and action receipts. This release records the policy
but does not silently delete local evidence; pruning requires a later explicit local
maintenance command with preview and receipt. Hosted storage, managed scheduling,
identity, billing, and remote retention remain outside this local foundation.

## Unified page evidence

Reconcile the latest crawl with any available Search Console and GA4 artifacts before
asking the opportunity workflow to reason about existing pages:

```bash
unisane growth seo pages inventory
unisane growth seo pages inventory --dry-run --json
```

The command uses conservative workspace defaults and writes
`page-audits/page-evidence.latest.json`. When `site-renders/latest.json` exists and is
bound to the same crawl snapshot, the inventory uses its page content as the
decision-facing view while preserving both the static crawl and rendered provenance.
Explicit `--crawl`, `--render`, `--search-console`, `--ga4`, and `--out` paths remain
available for controlled runs.

The inventory contains the union of crawled pages, page crawl failures, and pages found
only in provider reports. Missing provider rows are represented as
`not-present-in-source`, never converted to zero clicks, sessions, or outcomes. Each page
preserves crawl/indexability/canonical facts, selected browser evidence, Search Console
aggregation, Analytics evidence, sample status, freshness, and limitations. Generation fails when site,
platform, market, date window, or configured provider-resource identity does not match.
The opportunity workflow reads only this canonical latest page artifact and rejects
configured platform, project, site, or target-market mismatches. The inventory itself
does not recommend, approve, or publish content.

## Controlled campaign pause

Local development exposes one deliberately narrow provider mutation through separate
commands. Planning is non-provider work; approval binds one exact plan hash; apply
requires the exact `provider:account:campaign` target; verification is a separate
provider read:

```bash
unisane growth campaign pause plan \
  --provider googleAds \
  --account-id 1234567890 \
  --campaign-id 42 \
  --evidence-revision evidence-3 \
  --json

unisane growth campaign pause show --run-id <run-id>
unisane growth campaign pause approve \
  --run-id <run-id> \
  --plan-hash <exact-plan-hash> \
  --approved-by <operator>
unisane growth campaign pause apply \
  --run-id <run-id> \
  --evidence-revision evidence-3 \
  --confirm-target googleAds:1234567890:42
unisane growth campaign pause verify --run-id <run-id>
```

Every command reads or advances the same canonical local mutation-run record. Human and
JSON output lower from the same Growth review projection used by the console. The local
console may record the exact approval through its host-owned same-origin action, but it
cannot apply or verify a provider change.
Local state is admitted only for a single developer process in a non-production
environment. Production, automation, and multi-process execution fail closed until an
atomic durable run, approval, receipt, and lock implementation is injected.

Apply never delegates to the broad Ads live executor. Google Ads and Meta Ads have
separate exact pause and status-read operations. Google resolves its canonical
connection at the host. Meta remains unavailable in the local host until its ordinary
canonical connection lifecycle exists; it does not accept a token option or environment
fallback.

Offline imports and planning do not load provider SDKs. Provider-backed commands resolve
the selected connection and selected resource through the canonical host.

## Audit-only tracking reconciliation

Use the read-only tracking audit to reconcile project source, the event and conversion
manifests, Tag Manager intent, and captured browser/server evidence:

```bash
unisane growth marketing audit --cwd . --json
unisane growth marketing audit --cwd . --observations ops/growth/tracking-observations.json --json
```

The JSON result is the canonical headless contract for agents, CI, and the console's
`Analytics > Tracking health` view. The command is declared `offline`, has no write
targets, and never installs scripts, publishes Tag Manager changes, or mutates provider
accounts.

An optional observation artifact uses this versioned shape:

```json
{
  "kind": "unisane.growth.tracking-observations",
  "version": 1,
  "environment": "production",
  "capturedAt": "2026-07-31T00:00:00.000Z",
  "observations": [
    {
      "eventName": "purchase_confirmed",
      "eventId": "evt-example",
      "conversionId": "purchase",
      "channel": "server",
      "emitter": "meta-capi",
      "outcome": "emitted",
      "payload": {
        "transactionId": "order-example",
        "value": 25,
        "currency": "USD"
      }
    }
  ]
}
```

Observation artifacts are evidence, not configuration. Keep them free of secrets and
raw personal data; use stable redacted identifiers when payload proof is required.
