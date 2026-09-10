---
id: 'PLAN-20260909-console-screens'
owner: 'unisane-ops'
repository: unisane-ops
scope: workspace
role: plan
lifecycle: durable
authority: supporting
provenance: proposed
view: current
status: proposed
---

# Every-screen specification

Part of the [console experience plan](unisane-ops-console-experience-plan.md). All screens inherit
the [interaction specification](unisane-ops-console-interaction-specification.md). These are
proposed designs grounded in current source, not screenshots or claims of completed capabilities.

The [copy and disclosure contract](unisane-ops-console-copy-disclosure-specification.md) owns
proposed English titles, field labels, actions and state messages for every S01–S62 entry; consult
it alongside these requirements.

## How to read each screen

Each entry specifies the user question; top-to-bottom content; fields/table defaults; primary
interaction and its outcome; exceptional states; and a testable completion check. “Add” means a
proposed new screen or panel. Existing paths identify current source routes, not a mandate to retain
a confusing navigation label. All supported provider mutations use Changes. No screen fabricates
functionality absent from the capability/action contracts.

## 1. Entry, Overview and assistance

### S01 — Start / first connection (add)

- Question: How do I start for my business?
- Order: business/environment → purpose (“Manage ads”, “Check tracking”, “Understand traffic”) →
  relevant provider choices → short explanation of required access → Connect.
- Business picker uses known project names; create/select only through supported host actions. Do
  not ask nontechnical users for config paths. Environment explains “Live business accounts” versus
  “Testing”. Never default a destructive task to production.
- After connection, show account/resource selection, then first collection progress and a useful
  landing screen. If a step is incomplete, save progress and name the next missing item.
- Empty host/config state offers supported setup or a clearly labelled administrator handoff. Do not
  make a shell command look like a completed setup.
- Pass: a user reaches an account-bound Overview and can identify what is connected and what is
  still unverified.

### S02 — Business overview (`/overview`)

- Question: How is the business doing, and what needs my attention?
- Order: scope/time/freshness → one plain-language status sentence → up to four metrics → priority
  issues → performance chart → pending changes/recent activity.
- Default metrics: ad spend, provider-attributed purchases, delivered orders when available, and
  revenue with its basis. Omit an unsupported metric with a useful explanation; do not substitute a
  different metric under the same title.
- Issues show affected account, consequence and one action. Rank delivery/access blockers and
  untrustworthy measurement before speculative optimization.
- Main action follows the state: Connect account, Collect latest data, or Review issues. Card clicks
  preserve account and reporting context.
- Pass: duplicated events produce a visible warning on purchase/CPA summaries rather than a
  success-colored performance claim.

### S03 — Global search / quick actions (existing command concept, redesign)

- Search resources by name or exact ID across permitted accounts; group results into campaigns,
  events, products, changes and help. Each result names provider/account.
- Empty query shows recent destinations and available tasks. No-results explains scope and offers
  Clear filters. Search is not a shell input.
- “Pause campaign” opens exact resource selection and a proposal; it never applies a mutation from a
  search result. Keyboard arrows, Enter, Escape and focus return work.
- Pass: similarly named campaigns from two accounts cannot be confused.

### S04 — Page help (`/help`)

- Explain this page’s goal first; then three common tasks, metric definitions, troubleshooting and
  advanced integration details. Preserve originating screen/context.
- Search supports user terms such as “double purchases” and “not getting events”. External
  documentation is labelled before opening.
- Show installed capability/version context only in details. Missing live support must not be
  represented as chat with a human.
- Pass: a user can learn why received events are not identical to sales without reading an API
  document.

## 2. Connections — existing resource-detail routes and added guided steps

### S05 — Connections list (`/connections`)

- Order: connected services → services relevant to selected tasks → optional other providers.
- Card fields: provider, account name, selected resources, access status, last successful update,
  next step. Distinguish “Connected; tracking not checked” from “Events verified”.
- Connect opens a guided flow. Reconnect restores the exact binding; it does not silently choose the
  first account. Show revoked/expired access, account ambiguity and unavailable provider support
  separately.
- Pass: account names appear before IDs, and a valid login with no accessible ad account does not
  appear ready.

### S06 — Connect / reconnect wizard (add)

- Steps: choose provider → explain requested access → provider sign-in or supported system-user
  setup → select account → choose resources → verify access → collect initial evidence.
- Resource selectors include search, names, secondary IDs and reason for unavailable choices. Meta
  includes Page, Instagram, dataset/Pixel and catalog as relevant; Google separates Ads, GA4, GTM
  and Merchant Center resources.
- Back preserves nonsecret choices. Cancel does not claim a connection succeeded. Denied permission
  offers Retry sign-in or Continue with limited features when supported. Secrets remain in host
  custody.
- Pass: user sees exactly which features missing permissions prevent, without environment-variable
  editing.

### S07 — Connection overview (`/connections/:provider/overview`, and shorthand `/connections/:provider`)

- Show current account, selected resources, access summary, last data update and feature readiness.
  Primary action is the next required step; secondary actions are Reconnect and Manage resources.
- Connected/configured/tested/live-verified are separate statements. No generic green “Ready” based
  only on token existence.
- Pass: stale reporting and valid authentication can coexist visibly.

### S08 — Access (`/connections/:provider/access`)

- Table: feature, access needed, current permission, explanation, resolve action. Lead with plain
  tasks (“Read campaigns”), expandable provider permission name.
- Do not offer granting unsupported permissions or expose tokens. Rotation/reconnect follows
  supported host workflow and shows whether existing jobs are affected.
- Pass: a reader understands why reporting works while budget changes are unavailable.

### S09 — Resources (`/connections/:provider/resources`)

- Group by resource kind and relationship. Columns: name, type, account, selected state,
  access/health. Show old and new binding in a review when changing selections affects workflows.
- Missing/deleted resources remain identifiable in historical records. Never relabel old evidence as
  belonging to a newly selected dataset.
- Pass: switching dataset cannot merge historical evidence or cross-account actions.

### S10 — Data updates (`/connections/:provider/data-sync`)

- Show each report/evidence family, covered dates, last attempt, last success and failure reason.
  Primary action Collect latest data; optional bounded backfill with selected dates and expected
  volume.
- Progress identifies queued/running/complete/partial and persists through navigation. Date
  selection alone never collects data. Access errors route to Access.
- Pass: one failed report does not label all connection data as current.

### S11 — Connection activity (`/connections/:provider/activity`)

- Filtered shared timeline: connections, selected-resource changes, collections, reconnects and
  failures; show actor/time/outcome and expandable safe receipt.
- Include human vs agent actions. Do not expose credential values or pretend reconnect changed
  provider ad settings.
- Pass: user can find the last successful collection and why the next failed.

### S12 — Disconnect confirmation (existing overlay, redesign)

- Name business, environment, account and affected future jobs. Explain that local evidence and
  provider resources follow their actual retention behavior. List any local data deletion
  separately.
- Buttons: Keep connected; Disconnect account. Supported shared action completes in console. If
  action is unavailable, explain and offer administrator instructions separately, never “Confirm and
  copy command” as task completion.
- Pass: success is shown only after the host confirms disconnection; history remains correctly
  scoped.

## 3. Advertising — all existing provider routes

### S13 — Advertising overview (`/advertising/{all,google,meta}/overview`)

- Order: delivery blocker → scope/time/trust → spend/results/CPA/revenue basis → genuine time series
  → campaigns needing attention → pending changes.
- All view shows provider/account rows; do not total incompatible currencies or attribution
  definitions. Provider views offer resource drill-downs.
- No-data states distinguish no spend, missing collection and access failure. Payment restriction
  links to account access/billing explanation; do not imply Ops can pay it.
- Pass: exact account and meaning of “purchase” are visible before an optimization recommendation.

### S14 — Campaign list (`/advertising/{all,google,meta}/campaigns`)

- Defaults: campaign name, provider/account in All view, delivery, spend, attributed purchases,
  named CPA, budget. ROAS optional when usable. Sort initially by spend for the loaded period; show
  active filters and count.
- Search name/ID; filters delivery/account/objective; clear filters; hide unnecessary columns
  without hiding uncertainty. Toggle-looking controls must not mutate immediately: open Review
  pause/resume.
- Row opens S15; bulk selection shows exact selected count, permission eligibility and per-resource
  effects. Start with supported operations only.
- Pass: user selects the right campaign, sees budget currency and understands the effect before
  approving.

### S15 — Campaign detail (existing pane, extend)

- Header name/provider/account/current status; tabs Summary, Performance, Settings, Related ads,
  History. Summary shows objective and conversion target in plain terms.
- Settings groups budget/schedule, optimization, audience/resource dependencies and provider-only
  features. Read-only unsupported fields explain why. Historical performance and current settings
  have separate timestamps.
- Primary supported edit opens a labelled form, then shared diff. Duplicate/create shows proposed
  names and all intended child resources; partial creation routes to recovery.
- Pass: “Applied budget” is not shown as “Improved CPA”; verification evidence is visible.

### S16 — Meta ad sets (`/advertising/meta/ad-sets`)

- Columns: name, campaign, delivery/learning state when supplied, budget owner, spend, purchases,
  CPA. Do not repeat campaign budget as if each ad set owns it.
- Detail groups audience, placements, schedule, optimization event and attribution. Explain
  automatic placements and audience expansion in everyday terms without changing their provider
  meaning.
- Pass: a user can tell whether an edit affects one ad set or its campaign budget.

### S17 — Meta ads and creatives (`/advertising/meta/ads-creatives`)

- List/grid switch: preview thumbnail with alt text, ad name, campaign/ad set, delivery, spend,
  results and warnings. Default compact table with optional visual preview.
- Detail: full creative, headline/body/CTA/destination, placement variants, review status,
  performance and edit history. Explicitly label preview approximations and unavailable provider
  previews.
- Replacement flow shows before/after creative and URL, validates supported formats and
  destinations, then prepares a change. Comments/reply management appears only if supported;
  imported findings are not editable live comments.
- Pass: invalid placement media has a specific reason; “two unsupported placements” does not imply
  mandatory activation.

### S18 — Google ad groups, keywords and assets (add when supported)

- Keep separate resource types: Search ad groups/keywords/search terms, and Performance Max asset
  groups. Show parent campaign and conversion goal.
- Keywords table includes match type, status, spend/results and exact negative-keyword scope.
  Distinguish a search term observation from a keyword setting.
- Asset detail shows type, approval and missing requirements. Search-term recommendations require
  evidence and an exact reviewable exclusion.
- Pass: adding a negative keyword cannot silently exclude terms across a different campaign/account.

### S19 — Attributed conversions (`/advertising/{all,google,meta}/conversions`)

- Title/subtitle explicitly state provider attribution. Columns: conversion/event name,
  provider/account, attributed count, value/currency, attribution setting, freshness.
- Row detail explains counted action and source. Link to Measurement for canonical outcomes and
  delivery; do not blend those counts into the table.
- Meta conversion pane includes diagnostics, collection status and data-source limitations. Google
  conversion actions distinguish primary/secondary and campaign-goal use where provided.
- Pass: 100 events and 70 ad-attributed purchases are not presented as an unexplained 30-sale loss.

### S20 — Recommendations (`/advertising/{all,google,meta}/recommendations`)

- Group Needs fixing, Worth testing and Waiting for evidence. Each card: specific issue, affected
  resource, evidence period, proposed next step, limitations and effort/risk.
- Buttons View evidence and Prepare change (when supported). Dismiss requires optional reason and
  keeps history; provider ignored state remains separate from local dismissal.
- No guaranteed savings or automated budget shifts from unreliable counts. Unsupported repair offers
  a precise manual handoff.
- Pass: duplicate tracking prevents an unqualified “increase spend” recommendation.

### S21 — Advertising change history (`/advertising/{all,google,meta}/change-history`)

- Shared records filtered by provider/account: time, resource, readable change, actor, execution and
  verification status. Filter by event occurrence dates.
- Detail shows exact before/after, approval revision, attempts and verification. Provider-observed
  changes and Ops-executed changes retain distinct provenance.
- Pass: an unknown external change is not attributed to Ops or an agent.

### S22 — Advanced report builder and report history (existing Meta panels, redesign)

- Default simple report presets: campaign performance, ad-set performance, ads, conversion delivery.
  Show date/account, supported breakdown choices, columns and preview of report meaning.
- Label incompatible combinations before submission; retain input after failure. Offer Advanced
  fields without raw JSON as the ordinary path.
- History shows report name, account, period, captured time and coverage; compare only compatible
  results. Downloads include limitations and units.
- Pass: changing dimensions does not accidentally compare different populations as a performance
  trend.

## 4. Measurement — explicit destination proposed

### S23 — Measurement overview (add; reorganize existing tracking/conversion content)

- Question: Can I trust these numbers? Order: overall explanation → outcomes/delivery/attribution
  shown separately → priority issues → event list → latest verification.
- Event table: human name with provider name secondary, expected sources, browser received, server
  accepted, pair status, last seen, issues. “Expected” requires an adopter contract, not guessing
  from a standard event list.
- Main action Inspect event; Collect latest data is separate. No universal “tracking score” hides
  missing evidence.
- Pass: user can identify a missing server source without adding browser and server counts together.

### S24 — Event detail / Purchase inspection (add/expand existing pane)

- Tabs Summary, Delivery, Matching information, Duplicate checks, Freshness, Issues, History. Keep
  dataset/account and time context visible.
- Summary shows canonical outcome count (if connected), received browser/server counts,
  accepted/rejected attempts and Meta attribution separately with definitions.
- Delivery table: event ID abbreviated/copyable, occurrence time, browser observation, server
  enqueue/accept time, attempt count, matched state, failure. Expose exact timestamps in details, no
  raw PII by default.
- Matching information uses Available/Missing/Invalid/Not expected for phone, email, name, IP,
  browser IDs and location; show source and eligibility/consent context. Do not equate field
  presence with match quality or invent personal data.
- Duplicate checks distinguish valid paired delivery, same-source retries, repeated business
  outcomes and conflicting IDs. Freshness separates occurrence-to-enqueue from enqueue-to-accept
  latency and historical recoveries.
- Pass: a historical recovery lacking old IP cannot be mistaken for a newly captured checkout
  failure; country-only customer data explains the source selection without calling it complete geo.

### S25 — Issue detail and diagnostic evidence (existing Meta diagnostics, redesign)

- Title is the issue in plain language; then severity, affected event/resource, source/capture date,
  provider status, explanation, evidence and action.
- Imported dashboard issues are visibly imported, with their observation window if known. “Ignored”,
  “Previously detected”, “No longer detected” and “Verified repaired” are distinct.
- A repair proposal identifies what Ops can change versus what belongs to the adopter. Show
  verification criteria before apply.
- Pass: user can explain what supports the finding and why it is or is not considered resolved.

### S26 — Guided diagnostic import (existing JSON form, redesign)

- Choose connected dataset/event → issue kind/title → provider status/severity → observed/captured
  dates → affected counts/denominator when supplied → source reference → preview → Import.
- Provide supported file import with schema validation; screenshot/manual entry is labelled as
  human-entered evidence. No promised OCR unless implemented. Unknown provider fields remain
  unknown.
- Advanced JSON remains optional for developers and uses the same schema. Mask personal data in
  preview and reject credentials; distinguish imported evidence from fetched live data.
- Pass: normal users can record an Events Manager warning without knowing project/environment IDs.

### S27 — Outcomes and reconciliation (add/extend existing measurement comparison)

- Start with metric definitions and aligned account/time/currency; then side-by-side orders placed,
  verified, delivered, events accepted and provider-attributed purchases.
- Discrepancy groups: pending outcome, no observed delivery, retry, possible duplicate, attribution
  difference, unavailable evidence. A difference alone is not an error.
- Detail traces an authorized outcome through delivery attempts using privacy-safe references.
  Explain returns, cancellations and cohort timing. No report of “profit” without costs.
- Pass: a user cannot interpret all-store delivered orders as ad-attributed sales without a valid
  attribution basis.

### S28 — Live test session (add/complete existing evidence workflow)

- Choose dataset/environment → explain test scope → start session → ordered test steps → incoming
  observations → paired event results → close/save result.
- Show test code only when supported and safe; time-limit it. Browser observation, server API
  acceptance and provider Test Events visibility are separate milestones.
- Do not create real orders automatically. Explicitly indicate when an action reaches a real
  checkout and requires separate authorization. No replay of historical Purchase to make a green
  check.
- Pass: browser-only receipt is labelled “Server not observed”, not “Test passed”.

### S29 — Evidence history / data coverage (add)

- Calendar or table of covered days by report family; list gaps, partial windows and last capture.
  Main action request supported backfill.
- Detail gives source, window, capture time, completeness, revision and provenance; safe export
  includes these fields. Snapshot evidence is never presented as a continuous trend.
- Pass: unavailable historical dates cannot silently use the latest snapshot.

## 5. Tracking setup / GTM — reorganize embedded controls

### S30 — Tracking setup overview (existing `tag-manager-workspace`, new destination)

- Account/container/workspace by name; live version and current draft clearly separated. Show
  configured destinations and latest observation status.
- Three tasks: Set up tracking, Check a problem, Review draft changes. Avoid showing all technical
  forms at once.
- Pass: a novice identifies which changes are live and which are drafts.

### S31 — Guided setup (existing `gtm-setup-controls`, redesign)

- Select site/environment → tracking destinations/resources → business events from supported adopter
  definitions → consent expectations → review proposed tags/triggers/variables → prepare draft
  change.
- Explain each event trigger in business terms, value/currency origin, event-ID source and
  browser/server roles. Use discovered names instead of connection IDs or pasted manifests.
- Existing tags are inspected before proposing additions; show conflicts rather than silently
  duplicating tracking. Unsupported setup names the missing adapter/permission.
- Pass: proposing Purchase tracking does not install a second independent Purchase sender without an
  explicit reviewed design.

### S32 — Diagnose tracking (existing `gtm-diagnosis`, redesign)

- Pick symptom/event → list available observations → run supported checks → findings grouped by
  trigger, parameters, identity, consent and duplicate behavior.
- Missing browser or server evidence prompts collection guidance, not a fabricated diagnosis.
  Findings link to exact tags/resources and actionable next steps.
- Pass: “configuration looks valid” remains distinct from “event was observed”.

### S33 — Workspace inventory / draft changes (existing `gtm-workspace-controls`)

- Tabs Tags, Triggers, Variables; readable name, purpose, destination, enabled state and
  dependencies. Detail exposes provider settings progressively.
- Draft diff groups Added/Changed/Removed with before/after; conflicts block apply until reconciled.
  Previewing is separate from changing workspace content.
- Pass: a trigger removal clearly lists the dependent tags affected.

### S34 — Test draft / preview (existing release preview, expand)

- Explain compiler validation and real site observation as two separate steps. Show exact
  workspace/revision and preview launch instructions/link when available.
- Result: compile result, observations collected, missing checks and next action. External GTM
  preview returns to the same review state.
- Pass: successful compilation alone cannot unlock a misleading “tracking verified” label.

### S35 — Create version / publish / restore (existing `gtm-release-controls`)

- Create version: select workspace by name, version name, summary of contents and provider
  consequences (including source-workspace lifecycle when applicable).
- Publish: exact version, current live version, affected container/site, before/after and
  verification checklist. Restore: choose an exact prior version and review the new publication; do
  not promise an undo of every downstream effect.
- Preserve separate required approvals for distinct effects. Automatically carry plan/run
  references. Timeout triggers recovery. Show version creation, publication and observed tracking as
  different outcomes.
- Pass: user never has to paste a run ID, and cannot publish a different revision under an earlier
  approval.

## 6. Catalogs — proposed screens, provider coverage required

### S36 — Catalog overview

- Provider/channel cards: selected catalog, source, total projected items,
  eligible/excluded/pending/rejected counts and last sync. Counts have definitions and denominators.
- Primary action Connect source or Review issues. Unsupported TikTok/Google/Meta capabilities
  explain status rather than showing successful sync.
- Pass: one channel’s approval is not shown as universal product eligibility.

### S37 — Products and eligibility

- Columns: image/name, stable product/variant ID, channel, eligibility, price/currency, stock, last
  sync, issue. Search/filter by rejection, stock, channel and product.
- Detail compares adopter projection with provider item and explains exclusions/overrides. Read-only
  business rules link to their owner; Ops does not silently edit adopter classifications.
- Pass: excluded and rejected are visibly different, and zero stock is not “missing data”.

### S38 — Sync preview and execution

- Preview counts Added/Updated/Removed/Unchanged and sample diffs, then complete searchable target
  list. Show price/stock changes and removal effects explicitly.
- Apply through Changes; progress and receipts per item; partial failures retry only known-safe
  remaining effects. Expected volume is not a fabricated percentage progress bar.
- Pass: a failed request cannot cause duplicate product creation on blind retry.

### S39 — Rejections, product sets and repair

- Rejection detail: provider reason, affected fields/items, source evidence, repair ownership and
  revalidation state. Product-set editor previews exact membership/rules before proposal.
- If fixing the source requires an adopter change, generate a precise handoff and retain the issue
  until new evidence verifies it.
- Pass: accepting a suggested repair does not mark provider disapproval cleared before revalidation.

## 7. Website analytics — every existing route

### S40 — Analytics overview (`/analytics/overview`)

- Show measured visitors/sessions, key events and traffic trend with GA4/property identity and data
  limits. Business outcomes link to Measurement rather than replacing analytics counts.
- Main action Inspect traffic or Resolve missing data. Chart explains source and known incomplete
  days.
- Pass: GA4 estimates/processing differences are not called missing orders without reconciliation.

### S41 — Traffic (`/analytics/traffic`)

- Default table: channel/source, sessions, key events, named conversion rate when valid, and period
  change if comparable. Drill down to source/medium/campaign.
- Separate direct/unassigned and unknown; do not attribute unattributed traffic to paid ads. Filters
  visible in export.
- Pass: rate numerator and denominator can be understood from its info control.

### S42 — Visitors / landing pages (`/analytics/visitors`)

- Current source describes landing pages, so label the task “Landing pages” unless genuine visitor
  attributes are available. Show page/path, visits, engagement/outcomes and data quality.
- Avoid implying individual-person tracking from aggregate analytics. Detail compares the same page
  and period; long URLs remain accessible.
- Pass: page metrics are not mislabelled unique customer profiles.

### S43 — Analytics conversions (`/analytics/conversions`)

- List key events, counts, definition/source, linked outcome when known and freshness. Show
  differences between GA4 key events and ad conversion goals.
- Primary action Inspect measurement opens S24/S27 with context; configuration changes use shared
  actions if supported.
- Pass: linking an event is not presented as proof of financial revenue.

### S44 — Tracking health (`/analytics/tracking-health`)

- Current health view with concise destination/resource status and issue summaries. Move deep event
  inspection to Measurement and GTM configuration to Tracking setup through clear links.
- Keep a single owner of issue state; this is a relevant filtered entry, not another diagnostics
  implementation.
- Pass: the same issue has the same status across Analytics, Measurement and Changes.

## 8. Search visibility — every existing SEO route

### S45 — Search overview (`/seo/overview`)

- Search Console property/period → clicks, impressions, CTR, average position with definitions →
  genuine trend → pages/queries needing attention.
- Explain averaged position and missing data. No provider-estimated demand presented as observed
  clicks.
- Pass: each opportunity links to evidence rather than generic SEO advice.

### S46 — Opportunities (`/seo/opportunities`)

- Cards show affected page/query, evidence, business relevance, confidence/limitations and specific
  next step. Detail explains why priority differs.
- Prepare brief or reviewed supported change; dismiss with retained history. Missing demand/site
  evidence means “Research needed”.
- Pass: no invented traffic-uplift forecast appears as verified benefit.

### S47 — Pages (`/seo/pages`)

- Columns: page title/path, clicks, impressions, CTR, average position, issue/change. Row opens
  performance, indexing evidence and suggested action.
- Canonical/redirect relationships appear only if observed. Sorting and pagination preserve filters.
- Pass: two URLs are not merged merely because titles match.

### S48 — Queries (`/seo/queries`)

- Query, clicks, impressions, CTR, position, associated page and country/device context when
  supported. Explain hidden/unavailable query data.
- Query detail shows relevant landing pages and evidence for an opportunity; no automatic keyword
  insertion into content.
- Pass: a query with zero clicks and known impressions differs from no collected data.

### S49 — Site health (`/seo/site-health`)

- Snapshot capture/date first, then issue categories, affected important pages and exact evidence.
  Table: issue, severity, affected URLs, status, next step.
- Current provider status and older crawl observations remain distinct. Pass: an old crawl is
  visibly stale rather than presented as today’s health.

### S50 — Research (`/seo/research` and detail/review panes)

- Guided input topic/product, market/language and business intent; advanced provider settings
  collapsed. Results: keyword groups, estimated demand, intent, observed competitors/pages,
  source/date and limitations.
- Detail panes keep selected market/provider/period and explain estimated vs observed data. Prepare
  brief records evidence and assumptions; never posts content.
- Pass: incomplete research cannot produce a confident ranked recommendation without disclosing
  missing evidence.

## 9. Experiments — every existing route

### S51 — Experiments overview (`/experiments/overview`)

- Active tests, recent results and questions worth testing. Show hypothesis, primary outcome,
  collection health and next decision.
- Primary action Prepare experiment when supported. Tracking problems appear before suggested
  winners.
- Pass: no running experiment is called successful just because one variant currently leads.

### S52 — Running (`/experiments/running`)

- Table: question, variants, primary metric, start time, planned duration/sample basis, evidence
  health and state. Detail explains allocation and restrictions.
- Stopping/altering a live experiment is a reviewed change; read-only monitoring never asks
  approval.
- Pass: user sees whether enough valid evidence exists and what stopping would mean.

### S53 — Results (`/experiments/results`)

- Hypothesis, exact variants, period, sample, absolute/relative effect with uncertainty when
  statistically supported, limitations and decision.
- Inconclusive is a valid outcome. Do not generate confidence intervals absent a supported analysis
  method. Rollout proposal uses Changes.
- Pass: results distinguish business improvement from better event capture.

### S54 — Ideas (`/experiments/ideas`)

- Question, supporting evidence, proposed change, outcome to measure, effort and readiness. Guided
  editor requires a falsifiable comparison and measurement readiness.
- Prepare test rather than “Launch winner”; unsupported execution becomes a documented plan.
- Pass: a speculative idea is labelled as such rather than a proven recommendation.

## 10. Changes, Activity, Automation and Settings

### S55 — Changes inbox (add)

- Tabs Needs review, Approved, Running, Completed; filters resource/provider/actor. Rows show
  readable effect, targets, author, age and blocking reason.
- Agent proposals identify agent and supporting evidence. Opening a row loads exact revision.
  Expired approvals cannot appear ready to apply.
- Pass: the same proposal from CLI/MCP/console is one record.

### S56 — Proposal form and review (existing pause and other review panes, converge)

- Form uses named resource pickers, typed units and clear bounds. Review order: account/environment
  → exact targets → before/after → effects/dependencies → evidence/limitations → authorization.
- Example: “Daily budget: BDT 1,000 → BDT 1,200”; do not hardcode BDT into the product. Bulk changes
  show every target with searchable full scope and ineligible rows.
- Buttons distinguish Save draft, Prepare change, Approve change and Apply approved change according
  to actual policy. Do not collapse approvals required for distinct effects.
- Pass: changing amount, target or revision invalidates approval through the engine.

### S57 — Execution, recovery and result (shared detail, add/expand)

- Timeline: queued → applying → checking provider state → verified or actionable exception. Show
  which resources changed and what remains; navigate away safely.
- “Outcome unknown” offers Check status; partial creation offers specific recovery. No generic retry
  until idempotency/recovery permits it.
- Result separates state verification from future performance measurement, and offers View resource,
  View history or a reviewed compensating change when supported.
- Pass: restart, timeout and double-click cannot silently duplicate provider effects.

### S58 — Activity (`/activity`)

- Chronological list with actor, meaningful verb, resource, timestamp, outcome and expandable
  detail. Filters jobs/changes/connections/alerts/provider/status; event-range dates.
- Persistent failure details do not disappear with a toast. Internal IDs live in advanced details;
  copy safe diagnostic reference.
- Pass: user can find what happened yesterday and whether it actually finished.

### S59 — Automations (`/settings/automations`, linked from Activity)

- List name/purpose, account/targets, schedule/timezone, next run, last success, failure and
  running-host requirement.
- Create/edit: task, scope, frequency, timezone, evidence thresholds and permitted limits. Preview
  next runs. Distinguish scheduled collection from approved mutation rules.
- Paused, disabled, blocked and host-offline differ. Editing a rule’s effect follows policy review;
  collection schedule settings do not masquerade as spend approval.
- Pass: next run is honest about local host availability; missed jobs and backfills are visible.

### S60 — Alerts and alert detail (add within Activity)

- Issue, severity, resource, first/last seen, occurrences, evidence and next action. Group repeated
  same-issue alerts without losing counts/history.
- Acknowledge, snooze with end time, resolve only with evidence. Quiet periods and thresholds have
  readable scope. Notification channels appear only when configured.
- Pass: acknowledged does not mean fixed; reoccurrence follows explicit policy.

### S61 — Settings (`/settings`)

- Separate display preferences, project/environment identity, notification preferences, data
  retention/export and administration according to supported host capabilities.
- Defaults are explicit. Timezone display settings cannot silently redefine provider reporting day
  boundaries. Permission/custody changes use proper host workflows.
- Show saved/unsaved state; Reset preferences explains exact scope. No tokens or raw config editor
  on the default screen.
- Pass: changing table density never alters account scope or reporting definitions.

### S62 — Missing page, access denied and host unavailable (shared routes/states)

- Distinct titles: “Page not found”, “You need access to this account”, “Ops host is unavailable”.
  Give one useful recovery action and retain the intended destination.
- Missing data is not missing permission. Do not render another project’s cached data after
  switching context. Reconnect cannot replay a write automatically.
- Pass: browser Back and recovery return to the intended page with safe context.

## Route coverage and proposed additions

Existing route coverage: Overview S02; six SEO routes S45–S50; all and Google five advertising
sections S13/S14/S19/S20/S21; Meta seven sections including S16/S17; five Analytics routes S40–S44;
four Experiments routes S51–S54; Connections S05 and all five dynamic tabs S07–S11; Activity S58;
Settings S61; Automations S59; Help S04. This accounts for 38 concrete entries generated by the
current route definitions plus five dynamic provider-tab patterns and the provider shorthand.

Embedded workflows are explicitly covered: global command S03; disconnect S12;
campaign/entity/conversion detail S15–S19/S24; Meta report read/results/history S22; diagnostic
import/review S25–S26; GTM setup/diagnose/workspace/release S30–S35; campaign pause approval/review
S56–S57; SEO research/opportunity panes S46/S50; schedule details S59.

Proposed screen capabilities needing implementation inventory: first-run wizard, explicit
Measurement/Tracking setup/Changes/Catalogs destinations, Google ad-group/asset-group browsing where
not exposed, complete test-session workflow, reconciliation/coverage detail, guided imports, alerts
and richer rule management. Their presence in this document does not imply provider APIs expose
every desired feature.
