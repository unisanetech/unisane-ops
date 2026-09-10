---
id: 'PLAN-20260909-console-experience'
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

# Console experience plan — understandable marketing operations

Date: 9 September 2026. This is a proposed product and interaction specification, not an
implementation or live-verification claim.

## Read this plan

1. This document defines the product model, navigation, presentation rules, ownership and delivery
   sequence.
2. [Every-screen specification](unisane-ops-console-screen-specification.md) defines the content
   order, controls, drill-downs and completion requirements for existing routes and proposed
   additions.
3. [Interaction and acceptance specification](unisane-ops-console-interaction-specification.md)
   defines minor interaction details, reusable states, copy, accessibility, responsive behavior and
   validation scenarios. Its requirements apply to every screen, even when not repeated in the
   screen catalog.

These three documents form one plan. Existing architecture remains authoritative:
[Ops architecture baseline](../../standards/13-unisane-ops-product-architecture-baseline.md),
[Growth capability checklist](unisane-ops-growth-capability-checklist.md),
[measurement roadmap](unisane-ops-growth-meta-measurement-roadmap.md), and
[GTM completion plan](unisane-ops-gtm-completion-plan.md). This plan does not authorize release,
deployment, provider changes or a repository authority cutover.

The [copy and disclosure contract](unisane-ops-console-copy-disclosure-specification.md) is the
proposed English copy owner for all 62 screens and their shared states.

## Research refinement — 9 September 2026

[Google product research](unisane-ops-console-google-product-research.md) refines the presentation
direction below. Use six repeated page patterns, a smaller initial navigation and conditional
descriptions rather than explaining every page with a paragraph. Its navigation and text-budget
recommendations supersede the earlier default presentation proposals where they differ. All screen
coverage, metric semantics, safety and accessibility requirements remain. The
[copy and disclosure contract](unisane-ops-console-copy-disclosure-specification.md) now defines
proposed strings, six-pattern assignments, fields and states for S01–S62. Rendered design and
novice-user validation remain required; copy coverage does not claim usability proof.

## 1. Product promise and people

A person should be able to connect an account, understand what is happening, inspect the evidence,
review a specific change, apply it and check its result from Ops.

The primary user is a business owner or marketer who knows their products and customers but should
not need JSON, terminal commands, provider IDs, API vocabulary or knowledge of our package
structure. A specialist can expand details. An AI agent uses the same typed actions and receives the
same evidence and restrictions. A human sees meaningful names and consequences rather than the
machine representation.

The first screen should answer within a short scan: which business/account am I viewing; how current
and reliable are these numbers; what needs attention; what can I do next? Simplicity means
presenting the necessary information in the right order, not hiding uncertainty or deleting provider
distinctions.

Scope includes all current console routes, embedded panels, dialogs and proposed screens required
for complete Growth workflows. Meta ships first. Google, GTM, analytics, SEO and experiments remain
part of the design coverage. Customer storefront UI and checkout are outside this redesign.

## 2. Grounding and limits

Source reviewed: `apps/console/src/routes.ts`, `browser/app.tsx`, existing screen families, shared
controls, Meta diagnostic import, GTM setup/workspace/release controls, connection overlays and
architecture temporal-query rules.

Concrete source observations:

- Existing routes cover Overview, SEO, all/Google/Meta Advertising, Analytics, Experiments,
  Connections, Activity, Settings, Automations and Help. Provider connection details contain five
  tabs.
- GTM is embedded in Analytics rather than having a task-oriented destination. Its forms expose
  connection/workspace IDs and technical plan/version steps.
- Meta diagnostic import currently requests observation JSON and reports evidence identifiers.
  Normal users need a guided evidence entry/import experience.
- A connection-disconnect overlay currently offers “Confirm and copy command.” A copied command does
  not complete an in-console workflow.
- Existing architecture already distinguishes current state, performance ranges, snapshots and
  evidence context; the redesign must preserve those semantics.
- Existing detail panes, narrative tables, formatters, temporal controls and Unisane UI components
  provide a foundation to refine, not replace wholesale.

The last attempt to open `127.0.0.1:4174` returned connection refused. No current screenshot audit
was completed. Layout dimensions below are proposed targets; implementation must validate them
against rendered screens and actual data. The checkout and ad-account incidents discussed in this
conversation motivate scenarios, but no private customer payloads or historical account numbers are
fixtures in this plan.

## 3. Navigation and orientation

Use one persistent left navigation with plain labels, a clear selected item, keyboard focus and a
collapsible sidebar. Group destinations instead of making a long unbroken list.

| Placement                           | Destination                                                 | Purpose                                                                     |
| ----------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| Main                                | Overview                                                    | Understand results and priorities                                           |
| Main                                | Advertising                                                 | Manage campaigns, ads and performance                                       |
| Main                                | Measurement                                                 | Understand events, delivery and outcomes                                    |
| Main                                | Connections                                                 | Connect accounts and resolve access                                         |
| Main                                | Changes                                                     | Review proposals and follow execution                                       |
| Main                                | Activity                                                    | Find history, alerts and scheduled work                                     |
| Marketing, when selected/configured | Website analytics; Search visibility; Catalogs; Experiments | Open the additional areas relevant to this business                         |
| Inside Measurement                  | Tracking setup; Data history; Orders & tracking             | Configure/test tracking and inspect evidence without another top-level menu |
| Inside Activity                     | Automations; Alerts                                         | Manage recurring work and notifications                                     |
| Footer                              | Settings; Help                                              | Preferences and assistance                                                  |

Not every destination appears as an enabled workflow before it exists. A configured area with
missing access remains visible with an explanation. Unsupported providers appear in connection
discovery or scoped information states; avoid a sidebar full of dead “Coming soon” pages.
Experiments remains capability-gated. New destinations above are proposed additions, not claims of
existing implementation.

Within Advertising use a named provider/account selector, then consistent tabs. Keep actual terms:
Meta “Ad sets”; Google “Ad groups” and “Asset groups” when supported. All advertising is a
comparison view, not a generic provider editor. Do not silently map an unsupported tab to unrelated
content when switching providers; explain the change and take the user to that provider’s overview.

Keep SEO and Analytics existing routes while improving their navigation labels. Do not invent a
second set of action routes. When screens move, change all internal links in the same batch and
handle old browser links deliberately under the repository’s release/migration rules. Unknown paths
should explain “This page is unavailable” and offer a relevant destination, rather than silently
showing Overview.

## 4. Shared page structure

From top to bottom:

1. Business/project name and environment; production is explicitly labelled. Account scope shows a
   recognizable name; IDs are secondary and copyable in details.
2. Breadcrumb for drill-down pages, then a single H1 and the primary task action when needed. Omit a
   description unless it adds necessary context; use one short sentence when it does.
3. Scope and time controls only where meaningful. Include timezone next to date selection. “Current
   settings” is not a historical date range.
4. Compact data-status strip: last successful update, coverage and one most important limitation.
   Expand for sources and timestamps.
5. Answer or summary: up to four meaningful metrics or a short status sentence. Do not fill empty
   cards with zeros.
6. Main task area: readable table, event inspection, form or result. Put the most useful fields
   first.
7. Supporting explanations and history. Raw evidence and technical details are collapsed and
   separately labelled.

Suggested desktop starting geometry: 224–248 px navigation, 24 px content gutters, 24–32 px section
separation, reading width around 760 px, full available width for tables. Use existing design tokens
rather than scattering numeric styles. Verify density at 1440, 1280, 1024, 768 and 390 px widths. A
right detail pane may be approximately 440–560 px where space permits; otherwise use a full-page
detail view. Never compress the main table into unreadable fragments.

Typography: clear heading levels, readable 14–16 px body/table text, tabular numerals for metrics,
normal sentence case and restrained emphasis. IDs and machine values can use monospace inside
details. Use icons with visible labels for consequential actions. Color supports status but never
carries it alone.

## 5. Explain the numbers before suggesting actions

Each metric has a domain definition, source, unit/currency, account, period, completeness,
attribution context and capture time. Display the meaningful subset close to the value; make the
full definition available through a labelled info control.

- “Orders placed”, “COD orders verified”, “Orders delivered”, “Events received” and “Purchases
  attributed by Meta” are different metrics. Never call them all Sales.
- Browser events and server events are delivery counts. Their sum is not unique purchases. Show
  matched pairs and unresolved IDs separately; do not infer deduplication solely from similar
  counts.
- A cost label names its denominator: “Cost per Meta-attributed purchase” or “Ad spend per delivered
  order.” Only the latter uses a justified order cohort/source attribution; all-store orders are not
  automatically paid-ad orders.
- ROAS is not profit. Explain revenue basis, taxes/shipping/refunds and conversion window. Do not
  combine BDT, USD or other currencies without an explicit sourced conversion policy and conversion
  date.
- Use zero only for a valid complete observation of none. Otherwise show “Not collected”, “Still
  processing”, “Access needed”, “Incomplete period” or “Unavailable”.
- Delayed/duplicate evidence keeps a visible warning beside affected CPA/ROAS values, chart legends,
  recommendations and exports. An ignored provider warning is not resolved.
- Metric change arrows require comparable complete periods. If a baseline is zero, show the absolute
  difference, not an infinite percentage. Never use a green arrow for every increase; direction
  depends on metric meaning.
- Date controls query recorded evidence. “Collect latest data” is a separate explicit action with
  its own progress; changing the date does not silently call provider APIs.

A recommendation must show problem, affected resources, evidence, proposed next step, known
limitations, estimated effort and risk. Expected improvement is a hypothesis unless a valid
experiment supports it. Provider benchmark claims are labelled as other-advertiser comparisons,
never promised account savings. No generic opportunity score substitutes for explanation.

## 6. From question to verified change

A guided flow is: choose exact resource → enter understandable changes → prepare proposal → review
before/after → authorize as required → apply → verify provider state → measure later outcomes.

A person should not paste a plan ID or run ID to continue. Persist links to the exact plan revision
and execution automatically. Approval is bound to actor, targets, revision, effects and expiry. A
changed plan needs new approval; progress polling or retries that retain the authorized effect do
not ask repeatedly. Engine policy owns this decision, not the browser.

“Applied” means provider mutation completed; “Verified” means the intended state was read back;
“Improved results” requires later measurement. An uncertain result becomes “Checking whether the
change went through”, with recovery before another mutation. A partial result names each
completed/remaining resource. Do not show “Try again” when it could create duplicates.

The Changes screen is the shared inbox across Meta, Google, GTM, catalogs and agent proposals.
Activity is execution/history; Changes is decision and execution follow-through. Advertising change
history is a filtered view of shared records, not a competing history store.

## 7. Ownership, structure and SSOT

Keep `interface → typed action → Growth service → provider/evidence ports`. The engine owns policy,
approval, jobs, recovery and receipts. Growth owns metric meaning, reconciliation and findings.
Providers own API translation, capabilities and resource normalization. Host owns
credentials/storage/scheduling. Adopters provide versioned outcomes and catalog projections.

Use the existing `apps/console/src/browser` structure:

- `routing/`: route and context transitions; route definitions remain in the existing route owner.
- `shared/`: genuinely reused presentation primitives and interaction states, with accessible
  Unisane UI components.
- `screens/<family>/`: page composition, task-specific forms, presenters and detail panes. Split by
  independently meaningful responsibility, not arbitrary line counts.
- Existing Growth console projection/contracts: typed, validated view data and action availability.
  Extend existing schemas instead of inventing parallel raw-response models.
- Existing action clients/host handlers: carry structured actions and results. Remove replaced
  copied-command paths after supported-action parity is proven.

Shared UI concepts to converge: AccountScope, MetricSummary, EvidenceStatus, IssueSummary,
ResourcePicker, ReviewDiff, ExecutionProgress and EvidenceDetails. These are proposed component
responsibilities, not mandatory new files if an existing component serves them. Review existing
`content`, table, temporal and detail-pane primitives before creating another abstraction.

No browser provider calls, shell execution, secret custody, inferred approval flags or
business-metric recomputation. Frontend formatting must not change metric semantics. Machine IDs
remain stable while labels improve. Localization copy is centralized; provider extensions preserve
provider terminology. Do not force Meta ad sets, Google asset groups and GTM versions into one
editable schema.

## 8. Delivery sequence and concrete deliverables

| Batch | Deliverable                                                                                                                                   | Required proof                                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | Freeze screen inventory, render current console with safe representative fixtures, capture current states, agree common shell/copy/data rules | Every route/panel mapped; current screenshots clearly separated from proposed layouts                                                        |
| B     | Shell, orientation, formatting, loading/error/empty states, Connections and Overview                                                          | A new user connects a fixture account, selects the right resources and identifies incomplete data without JSON/terminal work                 |
| C     | Meta Measurement, event inspection, diagnostics/import and reconciliation                                                                     | User explains browser/server vs unique outcomes; imported and live evidence remain distinct; uncertain numbers cannot masquerade as verified |
| D     | Changes lifecycle plus Meta Advertising browse/details and supported edits                                                                    | Human and agent proposals show identical effects; review, apply, partial recovery and verification work end to end                           |
| E     | Tracking setup/GTM guided setup, diagnosis, workspace changes, preview and release                                                            | A novice can tell draft from live, preview from observed delivery, and restore an exact version through shared actions                       |
| F     | Catalogs and Google screens, using existing provider capability boundaries                                                                    | Channel exclusions, missing access and unsupported operations are explicit; no fabricated availability                                       |
| G     | Analytics, SEO, Experiments, automation, alerts and settings                                                                                  | All existing routes meet the same detail specification; incomplete experiments do not declare winners                                        |
| H     | Cross-screen usability, accessibility, responsive and live acceptance                                                                         | Novice task tests pass; real provider receipts recorded separately from fixture/test results                                                 |

Do not call any batch complete on visual polish alone. Each batch includes frontend, domain
projection gaps, supported action path, states, documentation and focused tests. Keep builds small
enough to review even when work is scheduled in batches. Runtime implementation follows the active
repository ownership rules; this document does not move source authority.

## 9. Definition of ready and done

Before implementation, each screen has a named owner, route/panel mapping, sample data,
empty/error/permission states, primary action, provider capability source and acceptance scenarios.
All unchecked backend gaps become work items rather than simulated successful buttons.

Before completion:

- [ ] Every existing route and embedded workflow has an implementation disposition in the screen
      catalog.
- [ ] Every visible action completes its advertised task or explains the exact limitation.
- [ ] No normal workflow requires JSON, connection IDs or copied commands.
- [ ] Every affected metric preserves source, period, uncertainty and units.
- [ ] Keyboard, zoom, small-screen, screen-reader and long-content scenarios are checked.
- [ ] Shared action and approval behavior remains consistent across console, CLI and MCP.
- [ ] Users can distinguish connected, configured, observed, provider-accepted and verified.
- [ ] A novice completes connect → inspect issue → review change → verify result without coaching;
      record misinterpretations, completion time and task outcome.
- [ ] Screenshot QA covers every important state, not just a populated Overview.
- [ ] Provider live verification is explicitly recorded; mocks are not labelled live proof.

Design acceptance is not a claim that ad costs improve. Measurement validity and later experiments
determine business outcomes.
