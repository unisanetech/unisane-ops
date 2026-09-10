---
id: 'PLAN-20260909-console-google-research'
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

# Google product experience research — implications for Ops

Research date: 9 September 2026. Audience: owners and marketers using the Ops console without API or
terminal expertise. Scope: current public Google documentation for Search Console, Analytics, Google
Ads, Tag Manager and Google UX writing guidance. This is desk research, not a signed-in visual
audit, usability study or proof of Google's conversion performance. Documentation can differ from
account-specific UI rollouts.

This research refines the [experience plan](unisane-ops-console-experience-plan.md),
[screen catalog](unisane-ops-console-screen-specification.md) and
[interaction specification](unisane-ops-console-interaction-specification.md). No interface
implementation is included.

## Main finding

Search Console is the strongest reference for the everyday Ops reporting experience. Its documented
workflows move from a summary to a report, then an individual item and its diagnosis. GA4
contributes overview-to-detail reporting, Google Ads contributes context-specific summaries, and GTM
contributes a clear distinction between unfinished work and publication. Google’s writing guidance
favors short, accurate, direct language while allowing more explanation when consequences matter.
These are useful patterns, not evidence that every Google product is easy to use. Ops should apply
them to a smaller, consistent task model rather than reproduce every product’s navigation and
terminology.

## Evidence and design interpretation

### R01 — Overview is a useful summary, not the whole application

Evidence: Search Console Overview summarizes important performance and health information, with
additional information relevant to the property. The report directory describes Insights as an entry
point before more granular performance investigation.
[Overview](https://support.google.com/webmasters/answer/7451491?hl=en),
[Reports at a glance](https://support.google.com/webmasters/answer/9133276?hl=en).

Ops interpretation: show a small set of meaningful results and urgent issues. Each summary opens its
detailed task. Do not put connection administration, JSON import, historical reports and publishing
controls below a long Overview page. Hidden depth is still accessible through clear links.

### R02 — Reuse one report structure

Evidence: the Search performance report uses selected metrics above a chart, dimension tabs above a
table and filters for dates/search type. The documentation also describes preliminary chart data and
aggregation differences between chart and table.
[Performance report](https://support.google.com/webmasters/answer/7576553?hl=en).

Ops interpretation: a familiar report template is preferable to many custom dashboard compositions.
Start with the useful metrics, a genuine trend and a readable table. Users select a row or dimension
to narrow their question. Keep metric identity and warning visible when toggling a series. Do not
infer frontend aggregation rules from this visual pattern.

Caution: the same Google document says some unavailable export values become zero. Ops must retain
missingness in export; copying this behavior would contradict our trustworthy-evidence requirements.

### R03 — Inspect one object and give a verdict first

Evidence: URL Inspection accepts a page within the selected property, shows an overall result and
exposes deeper indexing details. Indexed results and live tests answer different questions; a
successful live test does not guarantee search appearance.
[URL Inspection](https://support.google.com/webmasters/answer/9012289?hl=en).

Ops interpretation: Purchase, campaign, catalog item and GTM draft inspections should start with an
understandable status, the exact resource and a relevant action. Expand attempts, identifiers and
raw provider details later. Clearly distinguish recorded status, a fresh check and a verified
resulting state. “No issue observed” must include the scope of checks rather than imply every
possible check passed.

### R04 — Group issues and make checking a fix a distinct step

Evidence: the Page indexing report groups reasons affecting URLs; users inspect an issue and its
examples and can request validation after fixing it.
[Page indexing report](https://support.google.com/webmasters/answer/7440203?hl=en).

Ops interpretation: use issue → affected resources → evidence → repair → check again. Clicking Check
again must not itself mark an issue repaired. Imported warnings retain their imported status;
validation is a separate observation. Avoid separate issue stores for Overview, Measurement and
Advertising.

### R05 — GA4 separates overview and detailed reporting

Evidence: Reports snapshot offers purpose-specific templates; overview customization assembles cards
derived from detail reports and requires an Editor role.
[Reports snapshot](https://support.google.com/analytics/answer/10668965?hl=en),
[Customize overview reports](https://support.google.com/analytics/answer/10659091?hl=en).

Ops interpretation: provide useful defaults for the selected task without requiring users to build
their own dashboard. Let specialists change optional columns later. Avoid making a report
library/editor another prerequisite to understand sales or tracking. Keep the same metric contract
in summary and detail.

Friction risk, not a measured prevalence claim: role-dependent customization can make an expected
control unavailable. Ops should explain a missing capability where the user needs it instead of
making them search for a hidden menu.

### R06 — Data quality belongs close to the report

Evidence: Analytics documents diagnostic indicators that reveal the detected issue, its cause and
resolution guidance.
[Analytics data quality](https://support.google.com/analytics/answer/16182084?hl=en).

Ops interpretation: routine freshness can use a compact status with expandable detail. A material
warning such as duplicate purchases must also use visible text beside the affected result; an
icon-only affordance is insufficient for our decision risk. Repeated technical disclaimers
throughout the page are unnecessary.

### R07 — Adapt the summary to its scope

Evidence: Google Ads Overview has summary and insight cards; summaries differ between account,
campaign and ad-group scope.
[Google Ads Overview](https://support.google.com/google-ads/answer/7321090?hl=en).

Ops interpretation: a campaign screen shows its delivery, results and settings; an account screen
shows account-wide blockers and comparisons. Do not repeat an identical wall of cards at every
level. Insights need evidence and a clear next step, not an unexplained score or implied guaranteed
savings.

### R08 — Draft, test and live are separate concepts

Evidence: GTM workspaces organize changes, handle conflicts and capture version names/notes. Preview
launches Tag Assistant; publishing is a separate workflow.
[Workspaces](https://support.google.com/tagmanager/answer/7059647?hl=en),
[Verify and publish](https://support.google.com/tagmanager/answer/14842769?hl=en-gb).

Ops interpretation: expose “Draft changes”, “Test tracking” and “Review publication” as readable
tasks. Carry resource and plan identifiers automatically. Distinguish compile validation from actual
delivery testing. Keep version history available without asking ordinary users to manage its
internal mechanics.

Friction risk: multiple workspaces, conflicts and a separate preview tool increase the number of
concepts. Ops should explain the current stage and preserve a return point, while retaining the
required provider behavior and approvals.

### R09 — Short does not mean unexplained

Evidence: Google's Material communication guidance emphasizes concise, scannable and direct writing;
it also describes adapting tone and detail for errors and consequential contexts. This is Google
writing guidance, not proof that every current Google UI follows it.
[Material communication principles](https://codelabs.developers.google.com/codelabs/material-communication-guidance).

Ops interpretation: remove introductory paragraphs that simply repeat the page title. Show detail
when it explains a choice, missing data or a consequence. Budget changes and publication need exact
effects even if that takes more space. Do not shorten “Purchases attributed by Meta” to “Sales” if
it changes the meaning.

## Ranked simplification risks in our current plan

These are design-review findings from our specification, not observed user-test results. Frequency
has not been measured.

| Priority | Risk                                           | Confidence and reason                                        | Plan change                                                       |
| -------- | ---------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------- |
| High     | Too many prominent destinations                | High: previous plan lists many peer destinations             | Smaller default navigation; nest specialist tasks                 |
| High     | Explanatory paragraphs on every page           | High: shared header rule called for a sentence everywhere    | Make descriptions conditional; remove repeated teaching text      |
| High     | Treating 62 workflows as 62 different layouts  | High: implementation risk from catalog breadth               | Six reusable page patterns, not 62 independent designs            |
| High     | Hiding material uncertainty to look clean      | High: duplicates/attribution are known product concerns      | One concise visible warning on affected metrics; expandable proof |
| Medium   | Asking users to customize before getting value | Medium: risk inferred from GA4 customization workflow        | Strong default columns/cards, optional customization later        |
| Medium   | Unclear action wording                         | High: “refresh”, “check”, “apply” can mean different effects | Explicit copy contract per action/result                          |

## Changes to the design specification

### A. Six page patterns

1. **Overview:** a few metrics, one principal chart or task summary, priority issues and clear
   detail links.
2. **Report:** context/filter bar, selected metrics, chart when useful, table and row inspection.
3. **Inspection:** resource identity, status, primary action, compact facts and expandable sections.
4. **Setup/edit:** focused fields, meaningful defaults, inline help and a clear next step.
5. **Review/result:** exact before/after, consequences, authorization, durable progress and
   verification.
6. **History:** filters, chronological rows and expandable details.

S01–S62 are coverage requirements within these patterns, not 62 top-level destinations or bespoke
page designs. Existing Unisane UI components/tokens remain the implementation foundation; this
research does not prescribe Google branding or a new UI library.

### B. A smaller default navigation

Proposed initial destinations: Overview, Advertising, Measurement, Connections, Changes and
Activity. Put Tracking setup under Measurement; expose it directly from tracking issues. Add Website
analytics, Search visibility, Catalogs and Experiments when selected/configured, grouped in a
secondary Marketing section rather than exposing every subsection by default. Automations stays
under Activity; Settings and Help remain in the footer.

Preserve discoverability: connection/setup discovery shows the available areas; a configured area
with an error stays visible. Do not hide critical errors inside an overflow menu. Final grouping
requires a novice navigation test; these are Ops design decisions, not a claim about Google's
sidebar.

### C. Visible text budget — design targets, not arbitrary restrictions

- Page title: normally 1–4 words. Description omitted unless it adds necessary context; then one
  short sentence.
- Primary button: normally 2–4 words naming the action. Prefer one prominent action per task region.
- Status: short phrase, not an internal enum. One explanatory sentence only when needed.
- Summary card: label, value and essential qualification. No body paragraph teaching the metric by
  default.
- Issue row: problem, affected count/resource, state and action. Explanation opens in detail.
- Form help: at the field needing it. Avoid repeating permission/environment instructions at every
  input.
- Empty state: title, one reason or next-step sentence, one action. Do not put an installation guide
  inside every empty table.
- Safety and uncertainty take precedence over word targets. Text must still work for translation and
  assistive technology.

### D. Example interface copy and disclosure

These are proposed Ops examples, not Google quotations or live findings.

| Screen              | Initially visible                                                                                        | After opening details                                                      |
| ------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Meta report         | “Meta ads”; account/date; “Purchases may include duplicates”; “Review issue”                             | Evidence window, affected senders, counts and limitations                  |
| Purchase inspection | “Purchase”; “Server delivery delayed”; “Check delivery”; Browser / Server / Matched pairs                | Event IDs, occurrence/enqueue/accept times, retries and source definitions |
| Connection          | “Meta”; account name; “Connected · Tracking not checked”; “Check tracking”                               | Permission names, resource IDs and verification history                    |
| GTM draft           | “Tracking setup”; “3 draft changes”; “Test tracking”; “Review changes”                                   | Tags, triggers, variables, version details and provider effects            |
| Budget review       | “Review budget”; campaign/account; exact daily amount before → after; policy-appropriate approval action | Dependencies, revision and authorization details                           |
| Catalog issue       | “Products need attention”; rejection count; “Review products”                                            | Channel rules, provider errors, source/provider field comparison           |
| Empty report        | “No report collected”; “Collect data for this account to see results”; “Collect data”                    | Data families, required permissions and collection method                  |
| Uncertain write     | “Checking change status”; “We have not confirmed the result yet”; “Check status”                         | Attempt record, provider read-back and recovery steps                      |

Keep source and account visible where names are ambiguous. “Check delivery” must invoke a supported
collection/verification action; if it only opens recorded data, call it “View delivery”. Labels must
describe actual behavior.

## Research limits and next gates

- Official documentation establishes workflows, not measured ease of use, exact pixel geometry or
  account-specific current UI.
- Search included public discussion results about GA4 customization and GTM preview/permissions.
  These anecdotes were not used to estimate frequency or make population-level claims.
- No private account changes, authenticated comparative audit, screenshots, prototypes or usability
  sessions were performed for this research.
- Copy planning follow-through: the
  [copy and disclosure contract](unisane-ops-console-copy-disclosure-specification.md) now assigns
  S01–S62 to page patterns and defines populated, empty, error, permission and completion copy. The
  examples above remain research illustrations, not the copy owner.
- Next visual gate: inspect current Google examples and rendered Ops at the same viewport, then
  review a small representative set: report, Purchase inspection, connection, GTM draft, change
  review and error state. Preserve task semantics rather than copying visual decoration.
- Before implementation: review the specified navigation/copy against representative rendered
  first-batch layouts and actual capabilities. Before release: run the novice tasks and
  accessibility checks already defined in the interaction specification.

## Opportunity timing

**Now, planning:** reduce default navigation, remove mandatory descriptions, adopt six patterns,
define visible versus expandable content and exact action wording.

**During each implementation batch:** apply common report/inspection/review structures, short state
messages, context-preserving drill-down and truthful data-quality presentation.

**Needs direct research:** whether novices find Tracking setup under Measurement; whether
account/environment context is clear enough; which four metrics help each business; whether
comparison/attribution explanations are understood. Test with users rather than asserting that a
Google-inspired layout guarantees simplicity.
