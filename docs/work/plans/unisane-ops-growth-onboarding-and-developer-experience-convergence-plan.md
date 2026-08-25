---
id: 'PLAN-b53347807bb0'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: plan
lifecycle: durable
authority: supporting
provenance: accepted
view: current
status: active
appliesTo:
  - 'ops'
  - 'growth'
  - 'onboarding'
  - 'developer'
  - 'experience'
---

# Unisane Ops Growth Onboarding And Developer Experience Convergence Plan

Replace the expert-first Growth setup experience with one evidence-driven, stack-neutral
onboarding lifecycle while preserving the established Ops package boundaries.

## Changelog

- `2026-08-15`: Superseded combined-launcher guidance with the separate `unisane-ops`
  CLI, one typed `ActionDefinition` across surfaces, and descriptor-only optional
  Framework context with zero Framework npm dependencies. The cutover is unreleased and
  direct; nested CLI/output capture is forbidden; provider mutations belong to Ops.
  Earlier dated command/release entries remain chronology only.
- `2026-07-31`: Completed the first bounded P120-W2 audit-only slice. The exact offline
  `growth marketing audit` command now emits one normalized source/manifest/observation
  result for CLI JSON, agents, and `Analytics > Tracking health`; it detects Web
  Runtime, GTM, direct gtag, Meta Pixel, server transports, and conflicting browser
  emitters, and reconciles expected events/conversions with optional versioned browser
  and server observations for duplicate ids, consent suppression, payload/parameter
  failures, missing evidence, and environment drift. The slice cannot install scripts,
  publish GTM, or mutate providers. W2 remains active for later installation adapters.
- `2026-07-30`: Corrected the W3 UI implementation direction. The console now converges
  on a modular React browser app with route-owned screens, a minimal external-asset boot
  shell, and direct public `@unisane/ui/*` component usage. Inline application
  JavaScript/CSS and page-spanning monolithic renderers are retired patterns, not
  acceptable shortcuts.
- `2026-07-30`: Made Research decision-first without reducing its evidence model.
  `Focus areas` is now the default ranked cluster view; `Keywords` remains the complete
  filterable, sortable, paginated country/language matrix one click away. Site health
  now admits only explicit technical discoverability failures, while content strategy
  and research-alignment findings remain in Research and Opportunities.
- `2026-07-30`: Corrected the Research product contract after the summary-only slice
  erased the workflow's research-led positioning. `SEO > Research` now preserves the
  complete keyword matrix, intent clusters, market comparisons, FAQ/question plan,
  competitor gaps, and SERP/experiment evidence through progressive views. Search
  Console is a validation signal for actual visibility, not the owner of research.
- `2026-07-30`: Completed P120-W3 slice 5. SEO now has six distinct, URL-addressable
  experiences backed by one headless projection: performance Overview, deterministic
  Opportunities, page and query analysis, user-impact Site health, and qualified
  Research. Missing comparison, audit, and research evidence produces explicit limits
  or empty states rather than invented trends, health, demand, or rankings.
- `2026-07-30`: Completed P120-W3 slice 4. The executive Overview now derives a
  plain-language condition, up to three contextual priorities, source-separated usable
  business metrics, a real funnel only when evidence exists, readable recent outcomes,
  and capability summaries from the headless Growth projection without exposing
  readiness, receipts, report families, or planned providers.
- `2026-07-30`: Completed P120-W3 slice 3. The console now consumes one UI-neutral
  connection projection, presents only implemented providers, keeps Google service
  access/resource/data state independent, provides the full connection-detail
  hierarchy, and routes explicit disconnect through the canonical confirmed CLI and
  Provider Google lifecycle.
- `2026-07-30`: Completed P120-W3 slice 1. `unisane-ops/apps/console` now owns the
  optional console pack and all presentation/build/serve mechanics,
  `@unisane/growth/console` owns the headless state boundary, CLI core lazily loads the
  installed exact `growth.console` contribution, and the retired Growth console owners
  and nested build/serve commands are absent.
- `2026-07-30`: Admitted P120-W3 under Skopos Task `T-eede3498`; its historical
  execution record is `docs/work/archive/tasks/P120-W3.md`. The frozen
  cut makes the optional console app the command and presentation owner, moves only
  headless state/actions to `@unisane/growth/console`, and deletes the old command,
  embedded app, and route catalog slice by slice.
- `2026-07-30`: Closed P120-W1. The single Ops adoption lifecycle, canonical Growth
  intent, Provider Google connection/grant/resource lifecycle, derived readiness, clean
  migration boundary, first-party adoption, and retired-owner deletion are executable.
  W2-W4 remain active, and W3 still blocks the coordinated public cutover.
- `2026-07-29`: Replaced end-loaded cleanup wording with a slice-local hard-replacement
  protocol. Every P120 slice now deletes its retired owner/route/export first, repairs
  consumers against the one canonical replacement, removes tests/docs/config/artifacts,
  and proves zero residue before the next slice; final release work is aggregate proof,
  not legacy cleanup.
- `2026-07-29`: Finalized the SEO and Connections page contracts after product review.
  SEO now uses `Overview`, `Opportunities`, `Pages`, `Queries`, `Site health`, and
  `Research`, with exact purpose, metric, analysis, drill-down, state, and copy rules.
  Connections now has one provider card hierarchy, one full detail page, incremental
  permission/resource selection, partial-service health, and explicit disconnect
  behavior; unavailable providers cannot appear connectable.
- `2026-07-29`: Clarified the product boundary at the first command: existing projects
  adopt Ops only through `unisane ops init`, while new Framework applications use
  `create-unisane`. Bare `unisane init` is prohibited rather than retained as an alias.
- `2026-07-29`: Finalized the approved console UX after auditing Overview, Setup, Proof,
  Performance, Advertising, SEO, Research, Analytics, GTM, Recommendations, Receipts,
  Schedule, and the hidden-inspector state. Added the grouped sidebar, final page/tab
  contracts, content admission and deletion rules, contextual-help system, global
  reporting controls, component behavior, simple-English copy requirements, and
  normal-user comprehension acceptance criteria.
- `2026-07-29`: Audited the current Overview, Setup, Performance, SEO, Ads, and
  inspector-hidden states and added the human-first console information architecture,
  connection navigation, page hierarchy, content design, progressive disclosure, empty
  states, and accessibility proof required for P120-W3.
- `2026-07-29`: Opened the P120 clean-cutover program for one project lifecycle, one
  provider connection model, canonical Growth config, derived readiness, instrumentation
  proof, console separation, first-party migration, and zero retired residue.

## Authority And Current-State Warning

This plan owns the target onboarding and developer-experience convergence for Ops
Growth. It does not replace the package/repository architecture plan or provider
control-plane safety.

The W1 lifecycle and configuration described here are executable current state and are
taught by the current guides and pack manifests. W2-W4 instrumentation, console, hosted,
team, and automation behavior remains target state until its owning Skopos Task closes
with direct acceptance Evidence.

Current 2026-08-15 authority supersedes every `unisane ops`, `unisane growth`,
`unisane provider`, executable Framework-pack, or Devtools-bridge target elsewhere in
this plan. Current Ops commands use `unisane-ops`; Framework `unisane` and
`create-unisane` remain separate. Every CLI/console/MCP/API/automation/agent surface
invokes one typed action and never uses raw argv, a nested product CLI, stdout/stderr or
process-exit capture, terminal parsing, or duplicate handlers. Framework context is an
optional non-default serialized descriptor input with zero Framework npm dependencies.
Provider/remote mutations never live in Framework Compiler or Devtools.

The Framework remains private through the complete architecture, release, and
repository-finalization program. Completion only permits later founder review; public
state requires direct founder approval and a separate accepted high-impact Decision.
This plan grants no Framework publication or visibility authority.

## Current Console Audit

A combined UX/accessibility audit on `2026-07-29` captured the current Overview, Setup,
Proof, Performance, Advertising, SEO, Research, Analytics, GTM, Recommendations,
Receipts, Schedule, and inspector-hidden states at desktop viewport.

Confirmed strengths:

- consistent visual system, spacing, card treatment, icons, and status colors
- clear capability ownership for Ads, SEO, Analytics, and GTM
- strong safety intent around stale evidence and live mutations
- meaningful headings and semantic tables in the inspected routes
- the inspector can be hidden, materially improving working space

Structural findings:

1. Twelve flat navigation destinations mix user goals, implementation tools, setup,
   evidence, audit history, and automation.
2. Setup exposes internal concepts such as local pack, provider proof, discovery,
   identifiers, report families, and mutation policy instead of one Connections journey.
3. Main content and the always-open inspector repeat the same readiness, warning, and
   next-action information.
4. Overview, Performance, SEO, and Ads reuse many status/KPI cards even when the
   underlying data is missing or stale, creating a heavy machine-dashboard feeling.
5. `warn`, `missing`, `ready`, `blocked`, fractional readiness, audit scores, and
   freshness counts compete without one clear page-level conclusion.
6. Technical actions such as pulling provider evidence dominate user-facing copy instead
   of explaining the business impact and offering one understandable action.
7. Some states appear contradictory: for example, decision/optimization cards can say
   ready while the same page says no report family is fresh enough for decisions.
8. Connections are implied across Setup, GTM, Analytics, SEO, and Ads rather than
   available through one navigable connection model.
9. Hiding the inspector removes visible clutter, but its content remained observable in
   the captured semantic tree; implementation must verify true accessibility hiding and
   focus removal.
10. Research exposes nine peer views, wraps one navigation item onto a second line, and
    combines memory counts, decisions, opportunities, keyword tables, actions, and raw
    evidence in one dense default page.
11. Analytics primarily explains GA4/Search Console evidence health instead of visitor,
    traffic, acquisition, and conversion outcomes.
12. GTM exposes container ids, manifests, drift, proof, version, publish, and rollback
    mechanics that belong in Tracking health, Connections, Activity, or Technical
    details rather than primary navigation.
13. Recommendations lack expected impact, effort, confidence, a direct action, and
    dismiss/save behavior; raw receipt identifiers appear beside the user task.
14. Receipts exposes machine event keys, timestamps, filenames, and absolute paths as
    ordinary content instead of a human-readable Activity history.
15. Schedule presents job/readiness counts but not the frequency, timezone, last run,
    next run, enable/pause, run-now, or edit controls expected from an Automations
    experience.

Screenshot evidence alone cannot prove keyboard behavior, focus order, contrast ratios,
screen-reader output, chart alternatives, responsive reflow, or zoom resilience. P120-W3
must test those directly.

## Outcome

A developer can adopt Growth in a new or existing Framework/non-Framework project
without first learning the internal package topology:

1. initialize or detect the project
2. select Growth and an adoption mode
3. connect one provider identity and choose discovered resources
4. install or reconcile instrumentation
5. see factual readiness and the next safe action
6. run SEO, analytics, GTM, ads, experiment, and recommendation workflows
7. move to approved mutation only when evidence and policy allow it

The finished system has no supported old command tree, parallel config loader, separate
Growth/GTM Google auth store, raw access-token fallback, manual readiness flag, or
embedded console presentation.

## Real-World Scenarios

The design and proof set must cover more than a clean demo project.

| Scenario                         | Required behavior                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| new product launch               | select capabilities, connect only needed grants, install manifests, and explain that data is warming                   |
| existing SaaS adoption           | detect analytics/tags/conversions, identify duplicates or mismatches, and require review before taking ownership       |
| SEO-only audit                   | run without runtime installation, Ads access, or remote mutation                                                       |
| paid acquisition                 | distinguish Ads manager and customer accounts, conversion evidence, billing/access blockers, and spend-impact approval |
| multi-environment app            | keep development, staging, and production resource selections and policies distinct                                    |
| agency or multi-product operator | make project/connection/resource identity explicit and prevent accidental cross-account action                         |
| partial provider permissions     | preserve usable capabilities while naming the exact blocked grant/resource                                             |
| revoked or former-employee token | fail closed, preserve evidence, and guide connection rotation without token leakage                                    |
| duplicate instrumentation        | identify competing tags/runtime emitters before adding another source                                                  |
| no or delayed data               | report `warming`, `no-signal`, or `stale`; never call setup successful from config alone                               |
| production mutation              | require plan, exact target identity, approval, lock, receipt, and drift checks                                         |
| CI or agent operation            | use non-interactive inputs, stable JSON, explicit secret-store binding, and no browser-only assumption                 |

## Target User Contract

### Primary audience and comprehension target

The default console serves a marketer, founder, SEO specialist, advertising operator, or
business owner. A first-time user must understand the following within the initial
viewport without opening help or Technical details:

1. which project/site and environment are active
2. what the page is for
3. whether the displayed data is usable and when it was updated
4. the most important result or problem
5. the next useful action

Developer and support diagnostics remain available without defining the normal
information architecture. There is no expert-mode dashboard, old-console switch, or
parallel technical presentation. CLI/API structured output remains the deep diagnostic
surface.

### Initial flow

```text
unisane-ops init
unisane-ops add growth
unisane-ops connect google
unisane-ops check
```

Interactive `unisane-ops init` may select Growth directly. Non-interactive operation
must expose equivalent typed inputs and stable JSON; it must not depend on parsing
prompts. Ops never intercepts or aliases the Framework `unisane` product. Guidance uses
`unisane-ops init` for an existing project and `create-unisane` for a new Framework
application.

After readiness, capability-oriented operations remain under `unisane-ops growth ...`.
Provider-specific diagnostics remain under `unisane-ops provider ...`. The visual
entrypoint is `unisane-ops growth console`.

### What automation may do

- detect project/runtime/framework shape
- inspect existing tracking, tags, manifests, and config
- discover accessible provider resources
- propose a unique match with evidence
- write non-secret canonical config after explicit confirmation or non-interactive intent
- install framework/runtime adapters through the owning pack
- validate events and conversions locally
- aggregate readiness and safe next actions

### What still requires a person or explicit authority

- provider OAuth consent and organization/account permission
- Search Console ownership verification when not already established
- selection when several provider resources are plausible
- Ads developer access, terms, billing, and account-level enablement
- consent/privacy policy decisions
- production mutation or spend-impact approval

The product must expose these as provider or policy requirements, not disguise them as
tooling failures.

## Console Product Experience Contract

### Navigation and orientation

Keep the expanded desktop sidebar capability-oriented, grouped, and short:

```text
Unisane Ops
[ Project/site selector ]

Overview

CHANNELS
SEO
Advertising
Analytics
Experiments          # only when selected

MANAGE
Connections
Activity

Help
Settings
[ User context ]      # bottom anchored
```

Do not retain separate primary routes for Setup, Proof, Performance, Research, GTM,
Recommendations, Receipts, or Schedule. Move their useful content into the decision-owned
target locations and delete the old routes during the console cutover.

Sidebar behavior:

- use familiar icons plus visible plain-English labels
- make each complete row interactive with a minimum 44 CSS-pixel target where practical
- emphasize exactly one active link with more than color alone
- use a badge only for an actionable count, never for readiness fractions or decorative
  status
- show no chevron unless the row really expands
- preserve URL-addressable page tabs instead of expanding deep capability trees in the
  global sidebar
- allow a user-controlled collapsed desktop state with labels available through
  accessible tooltips; use a focus-managed overlay drawer on narrow screens
- remember the desktop collapse preference without making icons the only navigation
  language in the normal state

The persistent shell shows:

- one project/site selector with human-readable name and domain
- environment inside that context selector with unmistakable production treatment
- interactive date range and comparison only where time analysis is meaningful
- global sync/freshness summary that links to the affected connection
- user/team context

Do not repeat project name, environment, date, generation time, and warning status in
several competing header areas.

Final route disposition:

| Current route   | Final destination                                                      |
| --------------- | ---------------------------------------------------------------------- |
| Setup           | first-run onboarding and `Connections`                                 |
| Proof           | affected connection/status plus `Technical details`                    |
| Performance     | `Overview` and relevant capability pages                               |
| Research        | `SEO > Research`                                                       |
| GTM             | `Analytics > Tracking health` and `Connections > Google > Tag Manager` |
| Recommendations | contextual priorities in Overview/capability pages                     |
| Receipts        | `Activity > Changes`                                                   |
| Schedule        | `Settings > Automations`                                               |

### Initial onboarding

Replace the Setup dashboard with a short guided flow:

1. ask which outcomes the user wants: search visibility, visitor understanding,
   conversion measurement, or advertising performance
2. offer one `Continue with Google` connection action and explain in plain language
   which Google services may be requested
3. show discovered websites, properties, containers, and Ads accounts by recognizable
   name; require a choice only for genuine ambiguity
4. verify tracking and access without exposing proof/report-family mechanics
5. finish with `Your workspace is ready`, what is connected, what still needs attention,
   and when the first data is expected

After completion, all connection changes, access repair, resource selection, and sync
health live under Connections; Setup does not survive as a recurring primary page.

### Overview

The default page is an executive growth home, not a system inventory:

1. one plain-language summary such as `Your search traffic is stable, but advertising
data needs an update`
2. up to three priorities with direct actions
3. three or four business metrics with comparison to the previous period and a visible
   freshness/source label
4. one meaningful trend or funnel
5. recent changes and outcomes
6. capability summaries that link to SEO, Advertising, or Analytics

Do not render meaningless zeros, dashes, blocked donuts, or trend chart frames when data
is unavailable. Use one explanatory empty state instead.

The default metric set is organic clicks, advertising spend, conversions, and revenue
or return on ad spend when those sources are usable. Paid and organic clicks are not
combined into an unexplained total. Every metric exposes its definition through
contextual help when the industry term or calculation may be unfamiliar.

### Capability pages

SEO, Advertising, Analytics, and Experiments share a predictable layout:

1. outcome-oriented summary
2. relevant filters and comparison
3. useful metrics and trend
4. main analysis table/workflow
5. prioritized opportunities or issues
6. source/freshness
7. optional technical details

Examples:

- SEO uses `Overview`, `Opportunities`, `Pages`, `Queries`, `Site health`, and
  `Research`.
- Advertising uses `Overview`, `Campaigns`, `Conversions`, `Recommendations`, and
  `Change history`.
- Analytics uses `Overview`, `Traffic`, `Visitors`, `Conversions`, and
  `Tracking health`.
- Experiments, when selected, uses `Overview`, `Running`, `Results`, and `Ideas`.

Tables support useful sorting/filtering and row drill-down. They do not dump every
available provider row into the first view.

Time-based capability pages expose a date range, previous-period comparison, source,
last update, refresh action, and only filters relevant to the current analysis. Tables
provide search, sorting, filters, pagination, sticky headers where useful, clear empty
states, row drill-down, and export when the data is genuinely reusable. Long URLs and
identifiers use a readable label in the table and expose the full value on demand.

Charts provide axis/date labels, legend, comparison series where useful, pointer and
keyboard data tooltips, a plain-language summary, and an accessible table alternative.
An unavailable series produces an explanatory empty state rather than a zero line or
empty chart frame.

### SEO page contracts

The SEO section answers six distinct user questions without duplicating the same data
under different labels:

| Tab             | User question                                                                        | Default primary content                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Overview`      | How is search performing, what changed, and what should I do next?                   | one health/outcome summary, organic clicks, search views, average position, one trend, up to three opportunities, gaining/losing pages, and source freshness        |
| `Opportunities` | What improvements are most worthwhile?                                               | ranked opportunities with expected outcome, affected pages/queries, impact, confidence, effort, freshness, evidence, and one action                                 |
| `Pages`         | Which pages are growing, declining, or blocked?                                      | searchable/filterable page table with clicks, change, search views, average position, human status, indexing warning, and row drill-down                            |
| `Queries`       | What do people search for, and where are we gaining or losing?                       | searchable/filterable query table with clicks, change, search views, average position, best page, and query drill-down                                              |
| `Site health`   | Can search engines discover, understand, and index important content?                | user-impact summary plus prioritized indexing, crawl/access, sitemap, canonical, structured-data, and broken-link groups                                            |
| `Research`      | Which keywords, markets, questions, and content opportunities should we target next? | complete keyword matrix, intent clusters, market comparison, question/FAQ plan, competitor gaps, and SERP/experiment evidence with estimated demand and competition |

`Search performance` is the primary analysis on `SEO > Overview`; it is not a second
tab. `Queries` is the user-facing name for provider keyword/search-query reporting.
`Site health` remains separate because indexing and discoverability problems require a
focused corrective workflow rather than being mixed into content opportunities.

#### SEO Overview

- The dominant callout says either what is healthy or the single most important issue.
- The default metrics are `Organic clicks`, `Search views`, and `Average position`.
  A fourth metric appears only when it changes a decision.
- `Search views` may explain in a tooltip that Google calls this `impressions`.
- The trend compares the selected range with the previous period and marks known
  tracking, access, or freshness incidents when they affect interpretation.
- `Best opportunities` shows at most three items.
- `Pages gaining or losing visibility` is a short preview that links to `Pages`.
- The data-source footer names the connection and latest usable provider date.

Do not show an unexplained composite SEO score. If the source is stale or partially
unavailable, replace affected metrics and charts with one honest callout that states
what is missing, whether older data remains usable, and the corrective connection
action.

#### SEO Opportunities

The default view may summarize `High impact`, `Quick wins`, and `Problems`, followed by
one ranked list. Each list item must include:

- a human outcome, not an engine finding title
- why it matters now
- affected page/query count
- expected impact, confidence, effort, and evidence freshness
- one focused review or fix action
- `Save for later` or `Not relevant` only when the item is optional

Opportunity ranking is deterministic engine output, never an unexplained model opinion.
Selecting an item opens a focused drawer with affected pages/queries, evidence,
recommended changes, and `Create improvement plan`. It does not duplicate the complete
Overview status.

#### SEO Pages

The default summaries are `Growing`, `Losing traffic`, and `Need attention` when each
has meaningful data. The table contract is:

| Column           | Presentation                                                 |
| ---------------- | ------------------------------------------------------------ |
| page             | readable title plus shortened URL                            |
| clicks           | value for selected period                                    |
| change           | previous-period comparison with direction and value          |
| search views     | value for selected period                                    |
| average position | value and meaningful change                                  |
| status           | `Growing`, `Stable`, `Review`, `Declining`, or `Not indexed` |

Search, status filter, date comparison, sorting, pagination, and an accessible mobile
card alternative are required. Selecting a row opens a page-specific drawer containing
the outcome summary, trend, what changed, top queries, indexing state, recommended next
steps, and links to open the page or create a plan. Raw URLs, canonical/debug payloads,
and crawl evidence remain under `Technical details`.

#### SEO Queries

The default summaries are `Searches found`, `New searches`, and `Losing traffic` when
supported by complete comparison data. The table contract is:

| Column           | Presentation                |
| ---------------- | --------------------------- |
| search           | the query text              |
| clicks           | value for selected period   |
| change           | previous-period comparison  |
| search views     | value for selected period   |
| average position | value and meaningful change |
| best page        | readable linked page        |

Filters include search text, change state, country, device, and date only when the
provider supports them. A query drawer explains whether the change is more consistent
with demand, ranking, click-through, access, or freshness; it names uncertainty rather
than claiming causation. It shows the best page, related searches, evidence, and one
appropriate next action.

#### SEO Site health

Site health is organized by user impact, not crawler subsystem. It begins with one
sentence such as `Three important pages may not appear in Google Search`. The default
groups are:

- `Indexing and visibility`
- `Crawling and access`
- `Sitemaps and canonical pages`
- `Structured data`
- `Links and redirects`

Each issue states affected important pages, user/search impact, confidence, first seen,
last checked, and one action. Do not show raw crawler logs, response dumps, rule ids,
schema payloads, or hundreds of equivalent URLs in the default view. Group equivalent
issues, paginate affected examples, and keep diagnostics in `Technical details`.

#### SEO Research

Research is the primary planning workspace for discovering and prioritizing what the
project should target next. It is not a small Search Console companion and must remain
useful before the site has meaningful organic visibility.

The default `Focus areas` view ranks intent clusters so an ordinary user can decide
where to investigate first. It shows keyword count, provider-estimated demand, best
market, advertiser competition, leading keywords, and recommended use. The progressive
`Keywords` view preserves the complete researched keyword matrix rather than a capped
card sample. It provides search, market and cluster filters, deterministic sorting,
pagination, total provider-estimated demand, best market, market coverage, advertiser
competition, and per-market demand/competition columns. Additional progressive views
own:

- `Markets`: region/language comparison and each market's leading keywords
- `Questions`: the full FAQ/question plan with target page, priority, demand, markets,
  proof status, and answer intent
- `Competitors & gaps`: recorded domains and pages, positioning patterns, strengths,
  gaps, and supported opportunities
- `SERP & experiments`: search-result snapshots, people-also-ask evidence, metadata
  hypotheses, and research-alignment page audits

Search Console owns actual clicks, search views, positions, and current visibility on
`Overview`, `Pages`, and `Queries`. Research may use those values as feedback, but
independent keyword, market, competitor, FAQ, and SERP evidence remains its primary
input. Missing Search Console data must not collapse or hide valid research.

Estimated demand is never presented as exact traffic. The contextual explanation is:
`An estimate of how often people search for this topic each month. Use it to compare
opportunities, not as an exact traffic forecast.`

Research suggestions lead to `Review opportunity`, `Save for later`, or a scoped
improvement/content plan. They do not automatically publish content or promise a
ranking result.

#### SEO language and states

Preferred visible sentences include:

- `Organic visits increased during the last 30 days.`
- `Fourteen pages have realistic opportunities for further growth.`
- `Search data may be incomplete.`
- `Google Search Console has not provided new data since July 24.`
- `More people are making this search, but your page is appearing lower.`
- `This is likely a ranking problem rather than reduced demand.`

Avoid `SERP delta`, `keyword universe`, `crawl proof`, `provider pull`, `SEO readiness
72%`, unexplained `impressions`, and unqualified causal claims.

### Connections

The Connections index is the one place to understand integrations:

| Card content       | User-facing answer                                         |
| ------------------ | ---------------------------------------------------------- |
| connected identity | Which account am I using?                                  |
| capabilities       | What can this connection currently do?                     |
| selected resources | Which site, property, container, or Ads account is active? |
| access state       | Is permission sufficient for the selected capabilities?    |
| last sync          | Is the data current?                                       |
| issue and action   | What needs attention, and what should I do?                |

The index contains, in order:

1. page title, purpose, current project/environment, and `Add connection`
2. at most one dominant connection issue with its user impact and corrective action
3. `Your connections`
4. `Available connections`, containing only providers/capabilities that are currently
   implemented and selectable
5. a short connection-activity preview

Do not show roadmap providers as disabled cards, `Coming soon` tiles, warnings, or
connectable options. A provider enters `Available connections` only when its complete
connection flow and minimum useful capability pass release proof.

Google is one provider card, not separate Search Console, Analytics, Tag Manager, and
Ads cards. Its card shows:

- connected human account identity
- overall state and last check
- nested enabled service rows for Search Console, Google Analytics, Tag Manager, and
  Google Ads when selected
- recognizable selected resource for each service
- independent service state and latest usable data/sync context
- the one highest-priority corrective action
- `Manage Google connection`

A permission or resource problem in one Google service must not label every working
service as disconnected. The card may say `Needs attention` while individual rows still
say `Working`. Meta and later admitted providers follow the same provider-card pattern
with their own capabilities.

`Manage connection` opens a full page, not a drawer. Connection detail uses `Overview`,
`Access`, `Resources`, `Data sync`, and `Activity`, preserving the visible
project/environment and connected identity. A drawer is limited to explaining or
inspecting one issue from the index; it cannot contain the complete account, grant,
resource, sync, and destructive-action workflow.

The connection flow is:

1. choose the outcomes/capabilities to enable
2. authenticate the recognizable provider account and request only the minimum required
   access
3. select discovered resources by human-readable name when selection is genuinely
   ambiguous
4. confirm what will be connected
5. verify each selected service independently and explain when data should become
   available

Adding a capability later requests only its additional access. Changing account or
resource shows the affected capabilities before confirmation. Revoked, expired,
partial-permission, no-resource, multiple-resource, syncing, delayed-data, and provider
failure states each retain the working portions of the connection and give one recovery
action.

`Disconnect` is visually separated from routine actions and requires confirmation. The
confirmation names which reports, automations, and managed changes will stop; whether
existing historical data remains; and whether provider-side tags or campaigns are left
unchanged. It never exposes access/refresh tokens, secret environment variables, raw
scopes, or provider identifiers in ordinary UI.

Capability pages show a compact source/freshness link back to the relevant connection
instead of duplicating connection management.

### Activity and automations

Activity is a human-readable history, not a receipt/file browser. Each entry states:

- what changed or failed
- affected provider/account/resource
- previous and new value when relevant
- actor and approval
- readable local time
- outcome
- `View details`

Filters cover changes, syncs, errors, approvals, and capability/provider. Raw operation
ids, receipt ids, payloads, timestamps, and file paths appear only inside Technical
details.

`Settings > Automations` replaces Schedule. Every automation shows name, purpose,
frequency, timezone, enabled/paused state, last successful run, next run, `Run now`, and
`Edit`. A blocked automation explains the actual access/data dependency and links
directly to the corrective action. Providers not selected by the user do not appear as
warnings.

### Actions, evidence, and advanced detail

Recommendations become contextual `Priorities` or `Opportunities`, limited to the three
most useful actions by default. Each action includes:

- expected outcome
- reason and supporting evidence
- confidence/freshness
- effort and priority
- risk or required approval
- primary action
- save for later or dismiss when the recommendation is optional

Technical evidence, stable codes, provider ids, scopes, artifact paths, report-family
counts, file-scan counts, plans, and receipts remain available under
`Technical details`, `Activity`, or an explicitly opened contextual drawer.

The contextual drawer is closed by default. It opens for a selected object or help
request, has a descriptive heading, traps/restores focus correctly, closes with Escape,
and is removed from the accessibility tree when hidden.

### Content admission and deletion

The console is not an inventory renderer. Every visible element must answer at least one
of these questions for the current task:

1. What happened?
2. Why does it matter?
3. What can I do now?
4. What result did my action produce?

Classify content once:

| Classification                                     | Treatment                                        |
| -------------------------------------------------- | ------------------------------------------------ |
| decision-critical                                  | show in the primary page hierarchy               |
| useful secondary context                           | focused drawer, popover, or `Technical details`  |
| user-visible history                               | `Activity`                                       |
| deep developer diagnostic                          | `Technical details` or structured CLI/API output |
| duplicate, irrelevant, misleading, or unactionable | delete                                           |

Do not merely move all current cards into drawers. Primary pages exclude proof/evidence
counts, report-family counts, provider-pull terminology, artifact readiness, raw ids,
file paths, receipt/event keys, internal mutation mechanics, planned providers as
warnings, empty charts, unavailable metrics rendered as zero, repeated warning cards,
and unfiltered dumps of every available row. No parallel expert dashboard preserves
these retired defaults.

### Content design

Use sentence case and direct human language:

| Avoid                                 | Prefer                                       |
| ------------------------------------- | -------------------------------------------- |
| `Setup warn`                          | `Google Ads data needs an update`            |
| `Provider proof pending`              | `No recent campaign data`                    |
| `0/8 report families ready`           | `Campaign data was last updated 44 days ago` |
| `Run narrow read-only provider pulls` | `Update campaign data`                       |
| `Provider identifiers are configured` | `Google Ads account selected`                |
| `Mutation guard blocked`              | `Live changes require approval`              |
| `Auth profile`                        | `Connected Google account`                   |
| `Receipt`                             | `Change record` in ordinary UI               |
| `Schedule blocked`                    | `Automations are paused`                     |
| `GTM drift needs apply`               | `Tracking changes are waiting for review`    |
| `-`                                   | `Not available`, with the reason available   |

Every empty/error state says:

1. what is unavailable
2. why it matters
3. whether existing data can still be used safely
4. the one recommended action
5. optional technical details

Industry-standard terms such as clicks, impressions, visitors, sessions, conversions,
conversion rate, advertising spend, cost per conversion, average search position, and
return on ad spend are allowed. Expand an acronym on first use, for example
`Return on ad spend (ROAS)`. Do not replace a familiar business term with an internal
engine term.

### Contextual help

Use contextual help only where it reduces uncertainty:

- a tooltip explains an unfamiliar term, calculation, icon, freshness label, or
  abbreviated value in one or two short sentences
- an information popover may add why it matters, one example, and a relevant
  `Learn more` link
- inline guidance owns required instructions, access problems, errors, and next actions

Do not hide essential information or interactive controls inside a tooltip. Tooltips and
popovers work with pointer, keyboard, touch, and screen readers; use labelled information
buttons, predictable dismissal including Escape, readable timing, focus preservation,
and positioning that does not cover the value being explained. If most users need the
explanation, place it inline instead of adding an information icon.

### Visual hierarchy and density

- one primary call to action per page/section
- three or four decision-useful metrics by default
- one primary chart, table, or workflow per page section
- no more than three priorities in the default viewport
- no more than three simultaneous status colors in the main viewport
- no status pill when plain text already communicates the state
- no duplicate card in main content and drawer
- no decorative card for a value that can be expressed as a line of text
- no card-inside-card hierarchy
- secondary cards collapse behind `View details`
- chart/table density follows the user's task, not the number of available fields
- whitespace separates decisions, not every low-level check
- advanced operator controls never visually compete with everyday analysis

Standard user-facing states are `Connected`, `Needs attention`, `Not connected`,
`Syncing`, `Up to date`, `Delayed`, `No data yet`, and `Action required`. Green confirms
a completed/healthy state, amber indicates recoverable attention, blue indicates active
progress or neutral information, red is reserved for a genuinely blocking or failed
condition, and neutral styling covers optional/not-connected state. Text and iconography
carry the meaning in addition to color.

### Accessibility

Target WCAG 2.2 AA. Prove:

- semantic landmarks and heading order
- keyboard access, visible focus, skip navigation, and focus restoration
- descriptive accessible names for icons, tabs, status, filters, and connection switcher
- status and chart meaning beyond color
- table headers, sorting state, row actions, and screen-reader summaries
- text/background and non-text contrast
- 44-by-44 CSS-pixel primary touch targets where practical
- 200% zoom and 320 CSS-pixel reflow without clipped navigation or horizontal page scroll
- drawer/modal hidden state removed from focus and accessibility trees
- reduced-motion support and announced async/sync state changes

## Ownership Map

| Owner                           | Responsibility                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Ops CLI package / `unisane-ops` | project detection, `init`, `add`, `connect`, aggregate `check`, command/help generation                                   |
| `@unisane/ops-engine`           | normalized findings, readiness dimensions, next actions, state/artifact/secret ports, effect policy                       |
| `@unisane/growth`               | Growth intent schema, domain manifests, audits, reports, recommendations, experiments, ads safety, headless console state |
| provider packages               | OAuth/credentials, grants, discovery, resource access, transport, refresh/revocation                                      |
| `@unisane/web-runtime`          | runtime tracking, consent, conversion delivery, SEO helpers, local instrumentation proof                                  |
| `@unisane/framework-ops`        | optional descriptor-only adapter; consumes validated serialized Framework data with zero Framework dependencies           |
| `unisane-ops/apps/console`      | visual shell over the same headless state/actions                                                                         |

No owner may reimplement another row to make onboarding convenient.

## Target Data Model

### Canonical project intent

Extend the versioned Ops schema contribution in `unisane.config.ts` to represent:

- selected Growth capabilities
- adoption mode
- environments and targets
- named connection references
- provider resource selections
- event, conversion, experiment, research, and policy manifest locations
- runtime integration selection
- mutation and spend policy

Keep it declarative and offline-loadable. Do not put tokens, client secrets, live
inventory snapshots, proof results, or mutable readiness labels in it.

The Growth pack exposes the exact typed contribution as
`growthConfigContribution`; root schema composition consumes that symbol directly
instead of guessing exports or duplicating its schema.

### Connection record

One provider-owned connection record contains:

- stable connection id and provider identity
- grant/capability set and expiration metadata
- secret references, never secret values
- discovered and selected resource references
- last verification evidence and revocation/permission state
- environment or target bindings

Resource selections are non-secret project state. Discovery snapshots and provider
account data are ignored local/durable artifacts according to the selected artifact
store, not source-controlled config by default.

Provider Google owns the concrete `GoogleConnectionRecord`,
`GoogleConnectionGrant`, and `GoogleResourceSelection` contracts in
`src/google/connection.ts`. Growth and CLI core consume provider-neutral projections
rather than importing token/profile implementation details.

### Initial environment policy

- offline initialization and audit-only project checks require no provider secrets
- local interactive connection needs only the provider-owned OAuth bootstrap selected by
  the connection adapter; a self-hosted OAuth client uses explicit client-id and
  client-secret references
- CI and durable automation select an explicit secret-store/connection binding
- account ids, properties, containers, sites, Ads customers, event ids, conversion ids,
  and readiness labels are not environment variables
- access and refresh tokens are never copied into project env files

Exact bootstrap variable names remain Provider-Google implementation contract until W1
freezes them. P120 must publish one generated environment report from selected
capabilities and connection adapters; it must not maintain separate marketing, GTM, SEO,
or Ads env checklists.

### Readiness finding

Every readiness check emits a shared structure with:

- stable finding code and dimension
- state and severity
- project/environment/connection/resource identity
- evidence and observation time
- freshness or uncertainty
- blocking effect
- one recommended next action
- exact action/command descriptor

The console, human CLI, JSON CLI, CI, and agent tools render the same record.

`@unisane/ops-engine` owns this contract in `src/readiness.ts` through the exact
`OpsReadinessDimension`, `OpsReadinessFinding`, and `OpsNextAction` exports. CLI core
implements the four lifecycle handlers at `src/handlers/init.ts`,
`src/handlers/add.ts`, `src/handlers/connect.ts`, and `src/handlers/check.ts`.

## Workstreams

### P120-W1: atomic onboarding and command convergence

Status: completed on `2026-07-30`.

Deliver the unreleased replacement as one coordinated direct cut:

1. add the shared lifecycle, finding, next-action, and readiness contracts
2. extend the root config schema and pack contribution model for Growth
3. implement core `unisane-ops init`, `add growth`, `connect google`, and aggregate
   `check` typed actions and CLI projections
4. move Google grants/discovery/resource selection behind one provider connection
5. migrate first-party project intent and auth/resource state
6. delete transitional setup/auth/config/token/readiness command implementations
7. regenerate command/help/completion artifacts from manifests
8. write the versioned migration guide and reject retired schemas in normal loading;
   publication remains separately authorized
9. prove all scenario fixtures and repository-wide zero residue

The replacement and deletion happen in the same bounded Task. A partially migrated command
tree is not a shippable checkpoint.

### P120-W2: instrumentation reconciliation and event debugger

Status: audit-only reconciliation slice completed on `2026-07-31`; framework- and
stack-neutral installation adapters remain pending.

After W1 establishes one lifecycle:

1. detect Web Runtime, GTM, direct gtag, and competing emitters
2. compare expected event/conversion manifests with observed local/browser/server events
3. surface duplicates, consent suppression, payload/schema errors, and environment drift
4. support audit-only proof without installing runtime code
5. add framework and stack-neutral installation adapters without creating another setup
   owner

This workstream may extend checks but must use the W1 readiness and action contracts.

### P120-W3: console separation

1. inventory every retired route, export, presentation owner, state helper, test, asset,
   build/serve entry, document, and consumer; freeze the exact replacement/deletion map
2. create `unisane-ops/apps/console` as the sole app owner and delete the
   `@unisane/growth` embedded static-app bootstrap, build, and serve owners before
   repairing their consumers
3. delete the old shell/sidebar/route registry, then implement the grouped sidebar,
   project/site context, responsive navigation, and final route catalog
4. delete Setup and connection/proof presentation, then implement guided onboarding,
   the provider-card Connections index, full detail pages, partial-service states,
   incremental grants/resources, and disconnect confirmation
5. delete duplicated Overview, Performance, and global Recommendation presentation, then
   implement the executive Overview and contextual priorities
6. delete the old SEO, Search performance, Keywords, and standalone Research
   presentation, then implement the exact six-tab SEO contract
7. delete the old Advertising, Analytics, and GTM presentation, then implement
   Advertising, Analytics, optional Experiments, and `Analytics > Tracking health`
8. delete Receipts and Schedule presentation, then implement human-readable Activity
   and `Settings > Automations`
9. delete duplicated inspector/card/state/helper families, then implement the one shared
   page anatomy, content budget, human copy/state vocabulary, contextual drawer,
   tooltip/popover/inline guidance, and content-admission rule
10. implement accessible chart/table primitives with comparison, filtering, drill-down,
    empty state, export where useful, and non-visual alternatives
11. add deep links/actions through the same command/action descriptors and keep Growth
    headless state/action builders UI-neutral
12. implement loading, no-data, not-connected, syncing, current, delayed,
    partial-permission, expired-access, failed, success, and filtered-empty behavior
13. after each numbered replacement slice, fix every type/test/build break, delete its
    retired tests/docs/config/assets/generated residue, and pass the slice-owned
    zero-residue inventory before beginning the next slice
14. run aggregate comprehension, screenshot, responsive, keyboard, focus, screen-reader,
    contrast, table/chart, zoom, and reflow proof only after every slice is individually
    clean
15. keep `unisane-ops growth console` as the only visual entrypoint

No second API, cache, readiness computation, or action implementation is admitted for
the console. W3 required one bounded Task with explicit replacement, deletion,
acceptance, and Guard evidence; P120-W1 did not retain or delete presentation on W3's
behalf.

### P120-W4: team, CI, and credential lifecycle

1. explicit local, CI, and durable secret-store adapters
2. connection ownership, least-privilege grants, rotation, revocation, and audit evidence
3. non-interactive connection binding without raw token-env fallback
4. environment promotion and resource-identity review
5. team/RBAC enforcement for plan, approval, apply, and spend-impact actions
6. scheduled freshness/drift checks over the same engine contracts

This does not broaden mutation safety beyond SSOT 12.

## Clean-Cut Rules

1. No wrapper command calls a retired command implementation.
2. No deprecated alias or hidden CLI root survives the unreleased cut.
3. No loader searches `config/marketing.*` or `config/google-tag-manager.*`.
4. No Growth or GTM code owns a Google OAuth/token profile.
5. No operation reads a raw provider access token as fallback or debug behavior.
6. No manually authored `planned`, `configured`, or equivalent flag is accepted as
   readiness proof.
7. No new console recomputes headless state or calls provider SDKs directly.
8. No Framework-only assumption enters the core, Growth, provider, or Web Runtime path.
9. No old tests/docs/examples remain as an allowlist; migrate or delete them.
10. Pre-release migration is an explicit one-shot persisted-state migrator, not runtime
    duality; stable compatibility begins only after a separately admitted real release.
11. No raw-argv action API, nested product CLI, stdout/stderr or `process.exitCode`
    interception, terminal parsing, or duplicate command/action handler survives.
12. The optional Framework adapter consumes only a validated serialized descriptor,
    has zero Framework npm dependencies, and is absent from the default install.

### Slice-local hard replacement protocol

Every bounded P120 implementation slice uses this order:

```text
inventory exact slice
-> delete retired owner/export/route first
-> let typecheck/tests identify every consumer
-> implement the one canonical replacement
-> repair all consumers
-> delete retired tests/docs/config/assets/generated residue
-> prove zero residue
-> begin the next slice
```

Deletion is not a final workstream, cleanup phase, or release task. A development branch
may be temporarily broken while the deleted owner exposes consumers; it must not restore
the old implementation, add a wrapper, or make old and new systems runnable together.
Every reviewable checkpoint and every merged commit must contain only one reachable
owner for the replaced behavior.

Moving retired code into `legacy`, `compat`, a feature flag, an unused export, a hidden
route, a fallback loader, or an alternate app does not satisfy deletion. Git history is
the development rollback mechanism. The only old-input reader admitted is the explicit
one-shot migrator, which is not imported or invoked by normal runtime.

Each slice-owned convergence check covers, where relevant:

- public and internal exports/imports
- route and command registries
- state/action owners and loaders
- components, styles, assets, build/serve entries, and package dependencies
- tests, fixtures, docs, examples, and generated artifacts
- exact retired-pattern inventory with no allowlist

The final release stage aggregates already-passing slice proof, regenerates owned
references, verifies migration/rejection behavior, and prepares release notes. It must
not contain planned legacy deletion.

## Migration Strategy

1. inventory every current command id/path, config loader, auth store, env token,
   artifact path, test, document, and first-party consumer
2. freeze the new manifest/schema versions, exact replacement/deletion map, retired
   patterns, and migration fixtures
3. execute each bounded slice through the hard-replacement protocol above; delete the
   retired owner first, implement the canonical replacement, migrate its first-party
   consumers, and prove zero residue before the next slice
4. implement the standalone one-shot migrator without importing an old-schema parser
   into normal runtime
5. run that migrator against representative prior schemas and prove normal loading
   rejects them with stable code `GROWTH_CONFIG_SCHEMA_RETIRED`
6. regenerate help/reference/index artifacts from their owners after every affected
   slice and once at aggregate closure
7. aggregate the already-clean slice receipts for any separately authorized release;
   do not infer a public major version or publication authority

If a consumer cannot migrate in the release window, delay the cutover. Do not retain a
fallback to accommodate it.

## Verification Matrix

### Behavior

- new, adopt-existing, audit-only, and migrate modes
- plain Node/web and Framework projects
- interactive and non-interactive JSON flows
- zero, one, and many discoverable provider resources
- partial scope, missing organization access, revoked token, and expired grant
- duplicate, partial, consent-blocked, verified, warming, stale, and no-signal
  instrumentation/data
- plan/approval/apply/receipt/drift and spend-impact denial
- CI secret-store binding and team credential rotation

### Structural

- only root core owns lifecycle primitives
- only providers own connection/auth/discovery transport
- only root config owns project intent
- only Growth owns domain logic/headless state
- only Web Runtime owns runtime instrumentation
- only console app owns presentation
- manifest/source/build/help command sets agree
- retired-pattern inventory is zero with no allowlist
- every presentation adapter invokes one typed action and returns the same structured
  result, with no nested CLI or output/process interception
- Ops core/default install has zero Framework implementation dependencies and the
  optional adapter is descriptor-only
- Framework Compiler/Devtools contain no provider or remote-state mutation

### Documentation

- current how-to is not changed to target commands until executable proof exists
- cutover updates the command workflow, Growth/provider/Web Runtime READMEs, examples,
  migration guide, and generated references together
- all obsolete setup/auth/env/config/console instructions are removed, not marked legacy

### Product experience

- first-time user can identify project/environment, current condition, top priority, and
  next action on Overview without opening technical details
- user can move from a capability issue to its connection and back without losing
  project/environment/date context
- Google/Meta connection identity, access, resources, sync, issue, and action are
  understandable without provider-internal vocabulary
- one unavailable Google service does not hide or mislabel working services, and roadmap
  providers never appear as connectable
- each major page follows the same title/context/status/metrics/analysis/actions/details
  hierarchy
- missing/stale data produces one honest empty state instead of misleading KPI,
  readiness, or chart cards
- no primary navigation item represents Proof, GTM, Receipts, raw Research, or Schedule
- main content and contextual drawer contain no duplicate finding/action cards
- sentence-case content review removes unexplained acronyms and machine-first wording
- every default-visible element passes the what-happened/why/next-action/result admission
  test or is removed
- proof counts, report-family counts, provider pulls, raw ids/paths/event keys, mutation
  mechanics, and planned-provider warnings do not appear in ordinary page hierarchy
- no unavailable metric is rendered as zero, no ambiguous dash is left unexplained, and
  no empty chart frame implies usable data
- SEO, Advertising, and Analytics tab sets match the decision-owned page contracts and
  remain URL-addressable without sidebar expansion
- SEO Overview, Opportunities, Pages, Queries, Site health, and Research each answer
  their owned user question without a duplicate Search performance/Keywords route
- Activity renders human change history while retaining exact diagnostic detail on
  demand; Automations exposes cadence, timezone, run state, last/next run, run-now, and
  edit controls
- tooltips/popovers are limited to secondary explanation, use simple English, and pass
  pointer, keyboard, touch, focus, dismissal, and screen-reader checks
- first-time scenario testing proves the user can identify context, data usability,
  result/problem, and next action without documentation or Technical details
- screenshot audits cover Overview, capability, Connections index/detail, Activity,
  Automations/settings, tooltip/popover, empty, error, and approval states at desktop
  and responsive widths
- direct accessibility tests cover keyboard/focus, screen reader, contrast, chart/table
  alternatives, 200% zoom, 320 CSS-pixel reflow, reduced motion, and announced async
  changes

## Completion Criteria

This plan is complete only when:

1. P120 implementation Tasks are closed and their generated records archived
2. the target lifecycle works in plain and Framework fixture projects
3. current command docs teach only the replacement
4. old schemas migrate through the one-shot migrator but are rejected by runtime loading
5. source, tests, docs, examples, templates, generated references, and built package
   contents contain zero unallowed retired patterns
6. no compatibility alias, loader, state bridge, token fallback, or embedded console
   remains
7. package versions, migration notes, and separately authorized release coordination
   are recorded when applicable
8. the linked finding is closed and removed from the active registry
9. P120-W3's closed Task Evidence proves the final navigation, connection model, page
   hierarchy, copy vocabulary, progressive disclosure, accessibility, and deletion of
   all old routes/embedded presentation
10. the normal console contains no parallel expert mode and no ordinary page exposes
    duplicate, irrelevant, misleading, unactionable, or machine-oriented control-plane
    presentation
11. all current commands use `unisane-ops`; Framework `unisane` and `create-unisane`
    remain separate and no product CLI delegates to another
12. every surface uses one typed `ActionDefinition`, Ops has zero Framework
    implementation dependency, and provider mutations are absent from Compiler/Devtools
