---
id: 'PLAN-20260909-console-copy-disclosure'
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

# Console copy and disclosure contract — all 62 screens

Proposed English interface copy, 9 September 2026. This is a planning artifact; it does not claim
that screens, provider features, persistence or live checks have been implemented. It completes the
copy/disclosure pass for the [screen catalog](unisane-ops-console-screen-specification.md) using the
six patterns from [Google product research](unisane-ops-console-google-product-research.md).

## How this specification works

Each S01–S62 entry defines its page pattern, exact title and labels, the initial information order,
action wording, expandable detail labels, and empty/error/restricted/completion copy. Braced tokens
are typed values from the scoped view model, not free-form model inventions. A slash between
alternative titles/buttons means choose the relevant state, not render all alternatives. Arrows
describe navigation or the next step; they are not literal interface text. Sentences following a
label may constrain implementation and are not themselves UI copy.

The defaults are deliberately brief. Do not paste this planning prose into the product. Most screens
have no subtitle. Every default page uses one of Overview, Report, Inspection, Setup/edit,
Review/result or History. Exact provider/account context and material uncertainty remain visible
even when detail is collapsed.

Source order: architecture owns action/data truth; screen specification owns task requirements; this
document owns proposed English presentation strings and disclosure decisions; interaction
specification owns shared behavior. Where older planning descriptions call for an explanatory
paragraph on every page, this document supersedes that presentation rule. Research is provenance,
not another runtime copy owner.

## Shared visible shell

- Main navigation: Overview, Advertising, Measurement, Connections, Changes, Activity.
- Selected/configured Marketing areas: Website analytics, Search visibility, Catalogs, Experiments.
  Keep configured areas visible when broken.
- Measurement subnavigation: Overview, Events, Orders & tracking, Tracking setup, Data history. A
  selected event opens its inspection tabs rather than duplicating the main navigation.
- Activity subnavigation: History, Automations, Alerts. Footer: Settings, Help.
- Context controls: Business, Environment, Account. Use “Live” and “Testing” only as display labels
  for the exact configured environments; show custom names without rewriting identity.
- Reporting controls: Dates; Compare; Filter; Clear filters; Columns; Export. “Compare” is
  unavailable with the visible reason “These periods can’t be compared” when required conditions
  fail.
- No mandatory Welcome paragraph, page-description block, instruction panel or explanatory card on
  populated reports. Task-specific missingness or consequences justify short text.

## Shared states — exact copy inherited by every screen

These states supplement, rather than replace, each screen’s specific messages below.

| State                    | Copy                                      | Action/behavior                                                        |
| ------------------------ | ----------------------------------------- | ---------------------------------------------------------------------- |
| Initial read             | Loading {resourceType}…                   | Stable layout; no zero metrics                                         |
| Same-context refresh     | Updating…                                 | Keep original timestamp on retained results                            |
| Different scope/date     | Loading selected {scopeType}…             | Hide incompatible previous data                                        |
| Uncollected evidence     | Not collected                             | Collect data only if supported                                         |
| Partial evidence         | Some data is missing                      | View data status                                                       |
| Stale evidence           | Last updated {time}                       | Collect data if supported                                              |
| Invalid comparison       | These periods can’t be compared           | View reason                                                            |
| Material duplication     | Purchases may include duplicates          | Review issue; retain beside affected CPA/ROAS                          |
| Imported evidence        | Supplied report · Live status not checked | View source                                                            |
| Rate limit               | {provider} is limiting requests           | Retrying {time} only if actually scheduled; otherwise Try later        |
| Authentication expired   | Your {provider} connection expired        | Reconnect                                                              |
| Missing write capability | {task} isn’t available here               | View requirements; no fake disabled-success flow                       |
| Unsaved form             | You have unsaved changes                  | Keep editing / Discard changes; Save draft only if durable save exists |
| Revision changed         | This proposal has changed                 | Review updated proposal                                                |
| Approval expired         | This approval has expired                 | Review change                                                          |
| Write unknown            | We haven’t confirmed the result           | Check status, never automatic reapply                                  |
| Partial write            | Some changes need attention               | Review results                                                         |
| Applied, not verified    | Change applied · Checking provider state  | View progress                                                          |
| Verified mutation        | Change verified                           | View resource                                                          |
| Safe copy                | Copied                                    | Brief accessible acknowledgement; no tokens/PII copied by default      |
| Export running           | Preparing export…                         | Name exact scope, avoid double submission                              |
| Export ready             | Export ready                              | Download; no claim that export includes uncollected rows               |
| Export failed            | Export couldn’t be created                | Try again for read-only export                                         |

Tokens: `{time}` uses readable scoped timezone and accessible exact timestamp; `{safeReason}` is a
redacted actionable error mapping; `{account}` and other names come only from authorized resources;
`{resourceType}` uses curated singular/plural phrases; `{coverageSummary}` and `{checkSummary}` come
from typed results with explicit unknown states. Use plural-aware message formatting for counts.
Missing tokens must choose an explicit alternate message, never render undefined, a raw enum or a
fabricated name.

## Layout and disclosure contract

**Overview:** title/context → 2–4 task-relevant metrics → a principal summary/chart →
needs-attention rows → detail links. No form stack beneath the summary.

**Report:** title/context → filters → optional selected metrics/chart → table → pagination. Five to
seven initial columns is a working target, not a reason to remove essential source/currency. One row
opens Inspection.

**Inspection:** exact resource → status → primary next step → concise facts → named expandable
sections/tabs. All data that changes an action’s risk stays visible at review.

**Setup/edit:** title → focused field group → inline validation → Continue/Save or prepare action.
Only the current step is expanded; preserve nonsecret choices on Back.

**Review/result:** exact target/context → before/after → material consequences → authorization/apply
→ actual result. A warning or unknown outcome is never hidden under Technical details.

**History:** title → time/filter controls → ordered entries → entry detail. Opening history is not
executing an action and gets no success toast.

Repeated “Learn more” paragraphs are not permitted. Detail controls use descriptive names: About
these numbers, View evidence, Permission details, Version history. Essential errors use inline text,
not hover-only tooltips. Long details open a page/pane, not nested modal stacks.

## Screen index

| Screen      | Pattern       | Default title                                       |
| ----------- | ------------- | --------------------------------------------------- |
| [S01](#s01) | Setup/edit    | Get started                                         |
| [S02](#s02) | Overview      | Overview                                            |
| [S03](#s03) | Inspection    | Search Ops                                          |
| [S04](#s04) | Inspection    | Help                                                |
| [S05](#s05) | Overview      | Connections                                         |
| [S06](#s06) | Setup/edit    | Connect {provider}                                  |
| [S07](#s07) | Inspection    | {provider} connection                               |
| [S08](#s08) | Report        | Access                                              |
| [S09](#s09) | Report        | Resources                                           |
| [S10](#s10) | Report        | Data updates                                        |
| [S11](#s11) | History       | Connection activity                                 |
| [S12](#s12) | Review/result | Disconnect {account}?                               |
| [S13](#s13) | Overview      | Meta ads / Google Ads / All advertising             |
| [S14](#s14) | Report        | Campaigns                                           |
| [S15](#s15) | Inspection    | {campaign}                                          |
| [S16](#s16) | Report        | Ad sets                                             |
| [S17](#s17) | Report        | Ads & creatives                                     |
| [S18](#s18) | Report        | Ad groups / Asset groups / Keywords                 |
| [S19](#s19) | Report        | Attributed conversions                              |
| [S20](#s20) | Report        | Recommendations                                     |
| [S21](#s21) | History       | Change history                                      |
| [S22](#s22) | Setup/edit    | Reports                                             |
| [S23](#s23) | Overview      | Measurement                                         |
| [S24](#s24) | Inspection    | {eventName}                                         |
| [S25](#s25) | Inspection    | {issueTitle}                                        |
| [S26](#s26) | Setup/edit    | Add an issue report                                 |
| [S27](#s27) | Report        | Orders & tracking                                   |
| [S28](#s28) | Setup/edit    | Test tracking                                       |
| [S29](#s29) | Report        | Data history                                        |
| [S30](#s30) | Overview      | Tracking setup                                      |
| [S31](#s31) | Setup/edit    | Set up tracking                                     |
| [S32](#s32) | Inspection    | Check tracking                                      |
| [S33](#s33) | Report        | Draft changes                                       |
| [S34](#s34) | Review/result | Test draft                                          |
| [S35](#s35) | Review/result | Publish tracking                                    |
| [S36](#s36) | Overview      | Catalogs                                            |
| [S37](#s37) | Report        | Products                                            |
| [S38](#s38) | Review/result | Review catalog sync                                 |
| [S39](#s39) | Inspection    | {product} issue / Product set                       |
| [S40](#s40) | Overview      | Website analytics                                   |
| [S41](#s41) | Report        | Traffic                                             |
| [S42](#s42) | Report        | Landing pages                                       |
| [S43](#s43) | Report        | Key events                                          |
| [S44](#s44) | Overview      | Tracking health                                     |
| [S45](#s45) | Overview      | Search visibility                                   |
| [S46](#s46) | Report        | Search opportunities                                |
| [S47](#s47) | Report        | Search pages                                        |
| [S48](#s48) | Report        | Search queries                                      |
| [S49](#s49) | Report        | Site health                                         |
| [S50](#s50) | Setup/edit    | Keyword research                                    |
| [S51](#s51) | Overview      | Experiments                                         |
| [S52](#s52) | Report        | Running experiments                                 |
| [S53](#s53) | Inspection    | Experiment results                                  |
| [S54](#s54) | Report        | Experiment ideas                                    |
| [S55](#s55) | Report        | Changes                                             |
| [S56](#s56) | Review/result | Review {changeType}                                 |
| [S57](#s57) | Review/result | Change status                                       |
| [S58](#s58) | History       | Activity                                            |
| [S59](#s59) | Report        | Automations                                         |
| [S60](#s60) | Report        | Alerts                                              |
| [S61](#s61) | Setup/edit    | Settings                                            |
| [S62](#s62) | Inspection    | Page not found / Access needed / Ops is unavailable |

## Screen copy and states

<a id="s01"></a>

### S01 — Get started

**Pattern:** Setup/edit. **Title:** “Get started”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Business; Environment; What would you like to do? Choices: Manage ads
  / Check tracking / Understand traffic.
- **Actions:** Continue → Connect an account. Back preserves choices.
- **Reveal on demand:** Why connect? → required access and available services. Advanced setup →
  administrator guidance only.
- **Empty:** No business selected. Choose a business to continue. → Choose business
- **Failure:** We couldn’t load your businesses. → Try again
- **Access or capability restriction:** You need access to a business to continue. → View access
  requirements
- **Completion:** Setup saved. → Connect an account. Show only after durable save; otherwise
  continue without a saved claim.

<a id="s02"></a>

### S02 — Overview

**Pattern:** Overview. **Title:** “Overview”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Business/account; reporting dates; Ad spend; Meta-attributed
  purchases or provider-labelled equivalent; Orders delivered when connected; Needs attention;
  Recent changes.
- **Actions:** Review issues when unresolved issues exist; otherwise no forced page-wide button.
  Each summary has View report.
- **Reveal on demand:** About these numbers → source, definition, attribution and completeness. View
  activity → full history.
- **Empty:** No reports yet. Connect an account to see results. → Connect account; if connected use
  Collect data.
- **Failure:** Reports couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to these reports. → View access
  requirements
- **Completion:** Updated {time}. No toast for a successful read. Preserve visible limitations.

<a id="s03"></a>

### S03 — Search Ops

**Pattern:** Inspection. **Title:** “Search Ops”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Search campaigns, events, products or changes; recent destinations;
  grouped results with account names.
- **Actions:** Open selected result. Any change shortcut opens a proposal form, never applies it.
- **Reveal on demand:** Result subtitle shows type and account; View details opens the selected
  resource. No raw command option in normal search.
- **Empty:** No results for “{query}”. Try another name or clear your filters. → Clear filters
- **Failure:** Search is unavailable. → Try again
- **Access or capability restriction:** Some accounts aren’t available to you. → View access
  requirements; never reveal inaccessible resource names.
- **Completion:** Navigate to the selected item. No “Action completed” toast for opening it.

<a id="s04"></a>

### S04 — Help

**Pattern:** Inspection. **Title:** “Help”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Search help; On this page; Common tasks; task links relevant to the
  originating page.
- **Actions:** Open the selected help topic.
- **Reveal on demand:** Technical details → action/schema/version guidance. External guide links say
  Opens another site.
- **Empty:** No help found for “{query}”. Try a shorter search. → Clear search
- **Failure:** Help couldn’t be loaded. → Try again
- **Access or capability restriction:** You can read this guide, but the action needs additional
  access. → View access requirements
- **Completion:** Show the selected guide and Back to {page}. No success toast.

<a id="s05"></a>

### S05 — Connections

**Pattern:** Overview. **Title:** “Connections”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Provider cards: account name; Connected / Access expired / Setup
  incomplete; Updated {time}; selected resource summary.
- **Actions:** Connect account. Existing cards use Manage connection or Reconnect.
- **Reveal on demand:** Connection details → access, resources and update history. IDs stay
  secondary.
- **Empty:** No accounts connected. Connect a service to start. → Connect account
- **Failure:** Connections couldn’t be loaded. → Try again
- **Access or capability restriction:** Only authorized users can connect accounts. → View access
  requirements
- **Completion:** {provider} connected. → Choose resources. Do not say Tracking verified.

<a id="s06"></a>

### S06 — Connect {provider}

**Pattern:** Setup/edit. **Title:** “Connect {provider}”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** Step labels: Sign in; Choose account; Choose resources; Check access.
  Account and resource names; required choices.
- **Actions:** Continue; final action Connect account. Secondary Back / Cancel.
- **Reveal on demand:** Why we need access → feature-to-permission explanation. Advanced connection
  → supported system-user setup.
- **Empty:** No accounts found. This login has no accessible {resourceType}. → Try another account
- **Failure:** We couldn’t finish connecting. Your selection is still here. → Try again; expiry uses
  Reconnect.
- **Access or capability restriction:** Access was not granted for {feature}. → Review access.
  Continue with limited access only when supported.
- **Completion:** {account} connected. → Collect data. Separate note: Tracking has not been checked.

<a id="s07"></a>

### S07 — {provider} connection

**Pattern:** Inspection. **Title:** “{provider} connection”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** {account}; Connection; Tracking check; Selected resources; Last data
  update.
- **Actions:** Resolve the next missing step: Reconnect / Choose resources / Collect data. Healthy
  state has no forced primary action.
- **Reveal on demand:** Connection details → secondary IDs and capability evidence. Tabs Access /
  Resources / Data updates / Activity.
- **Empty:** Setup is incomplete. Choose resources for this account. → Choose resources
- **Failure:** Connection status couldn’t be checked. → Check connection
- **Access or capability restriction:** You can view this connection but can’t change it. → View
  access requirements
- **Completion:** Connection checked {time}. Tracking status remains independently stated.

<a id="s08"></a>

### S08 — Access

**Pattern:** Report. **Title:** “Access”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Feature; Access; Next step. Labels Allowed / Not granted / Not
  checked.
- **Actions:** Reconnect when it can request the needed access.
- **Reveal on demand:** Permission details → actual permission names and provider response. Do not
  display tokens.
- **Empty:** Access hasn’t been checked. → Check access
- **Failure:** We couldn’t check permissions. → Try again
- **Access or capability restriction:** You can’t change this connection’s access. → View access
  requirements
- **Completion:** Access checked {time}. List remaining unavailable features.

<a id="s09"></a>

### S09 — Resources

**Pattern:** Report. **Title:** “Resources”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Tabs by resource kind; Name; Account; Selected; Access. Search
  resources.
- **Actions:** Choose resources → selection form; Review selection if binding changes affect
  workflows.
- **Reveal on demand:** Resource details → IDs, ownership and related resources. Why unavailable →
  precise capability reason.
- **Empty:** No {resourceType} found. Check this account’s access. → Check access
- **Failure:** Resources couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view resources but can’t change the selection. →
  View access requirements
- **Completion:** Resource selection updated. → View connection. Show only after supported host
  action confirms it.

<a id="s10"></a>

### S10 — Data updates

**Pattern:** Report. **Title:** “Data updates”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Report; Covered dates; Last success; Last attempt; Status. Current
  jobs above history.
- **Actions:** Collect data. Optional Collect older data opens a bounded range form.
- **Reveal on demand:** Update details → gaps, limits, provider evidence and attempts.
- **Empty:** No data collected yet. → Collect data
- **Failure:** This update failed. {safeReason}. → View update; show Retry collection only when
  supported.
- **Access or capability restriction:** {report} needs additional access. → Review access
- **Completion:** {report} collected. {coverageSummary}. → View report. Partial coverage uses Some
  data is still missing.

<a id="s11"></a>

### S11 — Connection activity

**Pattern:** History. **Title:** “Connection activity”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Time; What happened; Account; By; Result. Filters Type / Result.
- **Actions:** View entry; no global mutation button.
- **Reveal on demand:** Entry details → exact references and safe receipt.
- **Empty:** No connection activity in these dates. → Change dates
- **Failure:** Activity couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this connection’s activity. → View
  access requirements
- **Completion:** Display returned entries and timestamp; no success toast.

<a id="s12"></a>

### S12 — Disconnect {account}?

**Pattern:** Review/result. **Title:** “Disconnect {account}?”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** {provider}; {business}; {environment}; affected future updates/jobs;
  precise historical-data consequence.
- **Actions:** Disconnect account. Secondary Keep connected.
- **Reveal on demand:** What changes → affected local bindings/jobs. Provider resources unchanged
  only when contract guarantees it.
- **Empty:** This account is already disconnected. → Close
- **Failure:** We couldn’t confirm the disconnection. → Check connection. Never invite blind
  resubmission.
- **Access or capability restriction:** You can’t disconnect this account. → View access
  requirements
- **Completion:** {account} disconnected. → Back to connections. Historical data statement follows
  actual retention behavior.

<a id="s13"></a>

### S13 — Meta ads / Google Ads / All advertising

**Pattern:** Overview. **Title:** “Meta ads / Google Ads / All advertising”. No subtitle unless
specified in the visible content.

- **Visible first, in order:** Account/date; delivery blocker when present; Ad spend;
  {provider}-attributed purchases; Cost per attributed purchase; trend; Campaigns needing attention.
- **Actions:** View campaigns. When blocked, Review issue is prominent instead.
- **Reveal on demand:** About results → attribution and currency. Report details → coverage.
  Provider settings via selected account.
- **Empty:** No advertising data for these dates. → Collect data when absent; valid zero uses No ad
  delivery recorded.
- **Failure:** Advertising reports couldn’t be loaded. → Try again
- **Access or capability restriction:** This account’s reports need additional access. → Review
  access
- **Completion:** Updated {time}. No “Performance improved” merely from refresh.

<a id="s14"></a>

### S14 — Campaigns

**Pattern:** Report. **Title:** “Campaigns”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Search campaigns; Delivery filter; Name; Delivery; Spend; Attributed
  purchases; Cost per purchase; Budget. All view includes provider/account.
- **Actions:** Open campaign. Create campaign appears only when supported and opens setup.
- **Reveal on demand:** Columns → optional metrics. Row menu → supported actions. About purchases →
  source and confidence.
- **Empty:** No campaigns match these filters. → Clear filters; genuinely none uses No campaigns
  found.
- **Failure:** Campaigns couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view campaigns but can’t change them. → View access
  requirements
- **Completion:** Open detail without a toast. Mutation results are handled in Changes.

<a id="s15"></a>

### S15 — {campaign}

**Pattern:** Inspection. **Title:** “{campaign}”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Account; Delivery; Objective; Conversion goal; tabs Summary /
  Performance / Settings / Ads / History.
- **Actions:** Review budget change when selected edit is supported; overflow Pause campaign /
  Resume campaign / other supported tasks.
- **Reveal on demand:** Advanced settings → provider-specific controls. About results → attribution.
  Resource details → IDs.
- **Empty:** This campaign is no longer available. Its recorded history is still available when
  retained. → View history
- **Failure:** Campaign details couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view this campaign but can’t edit it. → View access
  requirements
- **Completion:** Changes open S57. Show Budget updated only after confirmed apply, plus Checking
  provider state until verified.

<a id="s16"></a>

### S16 — Ad sets

**Pattern:** Report. **Title:** “Ad sets”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Campaign/account; Search ad sets; Name; Delivery; Budget; Spend;
  Purchases; Cost per purchase. Campaign-owned budget reads Uses campaign budget.
- **Actions:** Open ad set; supported edit opens Review change.
- **Reveal on demand:** Detail sections Audience / Placements / Schedule / Conversion goal /
  History. IDs and API settings in Advanced.
- **Empty:** No ad sets match these filters. → Clear filters
- **Failure:** Ad sets couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view ad sets but can’t change them. → View access
  requirements
- **Completion:** Show changed state only from shared verified result; otherwise read has no toast.

<a id="s17"></a>

### S17 — Ads & creatives

**Pattern:** Report. **Title:** “Ads & creatives”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Table/grid switch; preview; Ad; Delivery; Spend; Purchases; Issue.
  Detail shows headline, text, destination and placement preview.
- **Actions:** View ad. Replace creative only on supported detail view and opens review.
- **Reveal on demand:** Placement details → limitations. More variations → provider previews.
  Technical details → IDs.
- **Empty:** No ads match these filters. → Clear filters
- **Failure:** Ads couldn’t be loaded. → Try again. A missing thumbnail says Preview unavailable.
- **Access or capability restriction:** You can view ads but can’t edit them. → View access
  requirements
- **Completion:** Creative updated only after apply; show Checking ad status until verified. Never
  claim improved performance.

<a id="s18"></a>

### S18 — Ad groups / Asset groups / Keywords

**Pattern:** Report. **Title:** “Ad groups / Asset groups / Keywords”. No subtitle unless specified
in the visible content.

- **Visible first, in order:** Provider-native resource title; campaign; Search; Name; Status;
  Spend; Conversions. Keywords include Match type.
- **Actions:** Open resource; Add keyword / Review exclusions only on supported matching view.
- **Reveal on demand:** Settings → supported provider fields. Search terms → observations labelled
  separately from Keywords.
- **Empty:** No {resourceType} found for this campaign. → View campaign
- **Failure:** {resourceType} couldn’t be loaded. → Try again
- **Access or capability restriction:** {task} isn’t available for this campaign type. → View
  supported actions
- **Completion:** {resourceType} updated after confirmed action. Verify exact target state in
  Changes.

<a id="s19"></a>

### S19 — Attributed conversions

**Pattern:** Report. **Title:** “Attributed conversions”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** Account/provider/date; Conversion; Count; Value; Attribution;
  Updated. All-provider values stay separate.
- **Actions:** View conversion. Secondary Compare with orders.
- **Reveal on demand:** How counted → definition and attribution. Conversion settings → supported
  goal details.
- **Empty:** No attributed conversions recorded for these dates. If absent evidence: No conversion
  report collected. → Collect data
- **Failure:** Conversion reports couldn’t be loaded. → Try again
- **Access or capability restriction:** Conversion reports need additional access. → Review access
- **Completion:** Updated {time}. No inference that store orders match provider counts.

<a id="s20"></a>

### S20 — Recommendations

**Pattern:** Report. **Title:** “Recommendations”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Sections Needs fixing / Worth testing / Waiting for evidence; issue;
  resource; short reason; next action.
- **Actions:** Review recommendation. Detail uses Prepare change only if a supported effect exists.
- **Reveal on demand:** View evidence → source, period and limitations. Expected effect → hypothesis
  or measured result, explicitly distinguished.
- **Empty:** No recommendations are ready. We’ll need more evidence before suggesting changes. →
  View data status
- **Failure:** Recommendations couldn’t be loaded. → Try again
- **Access or capability restriction:** You can review this suggestion but can’t apply changes. →
  View access requirements
- **Completion:** Proposal prepared. → Review change. Dismissed suggestions say Dismissed, not
  Fixed.

<a id="s21"></a>

### S21 — Change history

**Pattern:** History. **Title:** “Change history”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Date filter; Resource; Change; By; Result; Verification. Source
  distinguishes Ops / Observed in provider.
- **Actions:** View change.
- **Reveal on demand:** Change details → exact before/after, revision, attempts and provenance.
- **Empty:** No changes recorded for these dates. → Change dates
- **Failure:** Change history couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this account’s change history. →
  View access requirements
- **Completion:** Show detail; no success toast for history reads.

<a id="s22"></a>

### S22 — Reports

**Pattern:** Setup/edit. **Title:** “Reports”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Preset picker: Campaign performance / Ad set performance / Ads /
  Conversion delivery; Account; Dates; Group by; report preview; Saved reports/history.
- **Actions:** Create report; explicitly identify whether it reads stored data or collects from
  provider. History action Open report.
- **Reveal on demand:** More options → supported dimensions/columns. Report details → source,
  coverage and query.
- **Empty:** No reports saved yet. Choose a report to begin. → Choose report
- **Failure:** The report couldn’t be created. Your choices are still here. → Try again
- **Access or capability restriction:** This report needs {feature} access. → Review access
- **Completion:** Report ready. → View report. Incomplete result says Report ready · Some data
  missing.

<a id="s23"></a>

### S23 — Measurement

**Pattern:** Overview. **Title:** “Measurement”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Account/dataset; Tracking status; event list: Event / Browser /
  Server / Pairing / Last seen / Issues. Separate Orders and Attributed purchases summaries if
  available.
- **Actions:** Inspect event. First-use state offers Collect data.
- **Reveal on demand:** About tracking → count meanings. Data sources → expected sources and
  coverage.
- **Empty:** No events observed yet. → Check setup. If uncollected: No event data collected. →
  Collect data
- **Failure:** Measurement data couldn’t be loaded. → Try again
- **Access or capability restriction:** Event data needs additional access. → Review access
- **Completion:** Updated {time}. Use individual check statuses; no universal Everything is correct.

<a id="s24"></a>

### S24 — {eventName}

**Pattern:** Inspection. **Title:** “{eventName}”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Dataset/account; status; Browser received / Server accepted / Matched
  pairs; tabs Delivery / Matching information / Duplicate checks / Freshness / Issues / History.
- **Actions:** Check delivery only when performing a fresh supported check; otherwise View delivery.
- **Reveal on demand:** Event details → event IDs and timestamps. Matching details → presence,
  validity and source, not raw PII. About counts → definitions.
- **Empty:** No {eventName} observations in these dates. → Change dates or Collect data according to
  missingness.
- **Failure:** Delivery details couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to these event details. → View access
  requirements
- **Completion:** Delivery checked {time}. State precisely Browser observed / Server accepted / Pair
  verified / Check incomplete.

<a id="s25"></a>

### S25 — {issueTitle}

**Pattern:** Inspection. **Title:** “{issueTitle}”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** {eventName} · {dataset}; severity; provider status; First seen; Last
  checked; affected resources; one-sentence consequence.
- **Actions:** Review repair if supported; otherwise View next steps. Resolved candidates use Check
  again.
- **Reveal on demand:** View evidence → sources, capture date, affected denominator and limitations.
  Technical details → raw safe codes.
- **Empty:** This issue is no longer in the current report. That does not verify a repair. → View
  history
- **Failure:** Issue details couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view this issue but can’t run its check. → View
  access requirements
- **Completion:** Check complete. Issue still detected / No issue detected in this check / Check
  incomplete; verified repaired requires sufficient evidence.

<a id="s26"></a>

### S26 — Add an issue report

**Pattern:** Setup/edit. **Title:** “Add an issue report”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** Dataset; Event; Issue; Status; Observed on; Source; optional affected
  count/total; review preview. Note: This records information you provide.
- **Actions:** Review report → Add report. Secondary Cancel.
- **Reveal on demand:** Advanced import → validated JSON. What to include → concise field guidance
  and privacy note.
- **Empty:** No report added. Choose a file or enter the issue details. → Choose file / Enter
  details
- **Failure:** We couldn’t read this report. {fieldError}. → Review details
- **Access or capability restriction:** You can’t add reports to this dataset. → View access
  requirements
- **Completion:** Report added. → View issue. Supporting label: Supplied report · Live status not
  checked.

<a id="s27"></a>

### S27 — Orders & tracking

**Pattern:** Report. **Title:** “Orders & tracking”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Business/date/source; Orders placed / COD verified / Orders delivered
  / Server accepted / Provider-attributed purchases in distinct groups; discrepancy list.
- **Actions:** Review difference.
- **Reveal on demand:** How compared → cohorts/timezones/currency. Outcome details → privacy-safe
  trace. Costs → only if provided.
- **Empty:** Order data isn’t connected. Connect it to compare sales and tracking. → View connection
  steps
- **Failure:** Order comparison couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to order comparisons. → View access
  requirements
- **Completion:** Comparison ready. State Unexplained differences remain when applicable; no
  invented match percentage.

<a id="s28"></a>

### S28 — Test tracking

**Pattern:** Setup/edit. **Title:** “Test tracking”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Dataset/environment; session status; steps; incoming events; Browser
  / Server / Pairing checks. Real-order warning appears before such a step.
- **Actions:** Start test → View test results → End test. Any real purchase is separately
  authorized.
- **Reveal on demand:** Test details → supported test code/expiry and technical receipts. How to
  test → event-specific instructions.
- **Empty:** No test events received yet. Complete a test step on your site. → View steps
- **Failure:** The test connection was lost. Received results are retained if stored. → Reconnect
  test
- **Access or capability restriction:** You can’t start a test for this dataset. → View access
  requirements
- **Completion:** Test ended. {passedCount} checks passed; {remainingCount} need attention. Counts
  require actual checks; Save result only when persistence supported.

<a id="s29"></a>

### S29 — Data history

**Pattern:** Report. **Title:** “Data history”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Report family; Account; Dates; Coverage; gaps; Captured. Calendar
  optional with table equivalent.
- **Actions:** Collect missing dates when supported.
- **Reveal on demand:** Record details → source, window, revision, completeness and provenance.
  Export details → included scope.
- **Empty:** No data recorded for this period. → Collect data
- **Failure:** Data history couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this report history. → View access
  requirements
- **Completion:** Collection finished. {coverageSummary}. Never imply missing days are filled
  without evidence.

<a id="s30"></a>

### S30 — Tracking setup

**Pattern:** Overview. **Title:** “Tracking setup”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Container/account; Live version; Draft changes; Last tracking check;
  task links Set up tracking / Check a problem / Review changes.
- **Actions:** Review changes when draft exists; otherwise Set up tracking.
- **Reveal on demand:** Container details → IDs. Version history → prior versions. Tracking checks →
  observation evidence.
- **Empty:** No tracking container selected. → Choose container
- **Failure:** Tracking setup couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view setup but can’t change this container. → Review
  access
- **Completion:** Configuration loaded. No toast; live and draft states remain separate.

<a id="s31"></a>

### S31 — Set up tracking

**Pattern:** Setup/edit. **Title:** “Set up tracking”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Steps Site / Destinations / Events / Review; named resource pickers;
  event descriptions; consent choices when relevant.
- **Actions:** Continue → Prepare changes.
- **Reveal on demand:** Event settings → trigger/value/currency/event-ID mapping. Advanced settings
  → supported provider fields.
- **Empty:** No destinations connected. → Connect destination
- **Failure:** We couldn’t prepare these changes. {safeReason}. → Review setup
- **Access or capability restriction:** You can’t prepare changes for this container. → Review
  access
- **Completion:** Draft prepared. → Review changes. Label Not published.

<a id="s32"></a>

### S32 — Check tracking

**Pattern:** Inspection. **Title:** “Check tracking”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Choose event or problem; available observations; results grouped
  Trigger / Event details / Matching / Consent / Duplicates.
- **Actions:** Run checks when supported; otherwise View recorded checks.
- **Reveal on demand:** Check details → exact observations, resources and missing checks. Technical
  details → safe provider response.
- **Empty:** No observations available for this check. → View collection steps
- **Failure:** The check couldn’t finish. → Try again when read-only; retain completed checks.
- **Access or capability restriction:** This check needs additional access. → Review access
- **Completion:** Checks finished. {checkSummary}. Missing evidence stays visible; no unconditional
  Tracking verified.

<a id="s33"></a>

### S33 — Draft changes

**Pattern:** Report. **Title:** “Draft changes”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Container/workspace; Added / Changed / Removed counts; tabs Changes /
  Tags / Triggers / Variables; dependency warnings.
- **Actions:** Review changes. Test draft is secondary where supported.
- **Reveal on demand:** Item details → settings and dependencies. Compare versions → exact provider
  diff.
- **Empty:** No draft changes. → Set up tracking
- **Failure:** Draft changes couldn’t be loaded. → Try again
- **Access or capability restriction:** You can inspect this draft but can’t edit it. → Review
  access
- **Completion:** Draft updated only after confirmed save. Label Not published remains.

<a id="s34"></a>

### S34 — Test draft

**Pattern:** Review/result. **Title:** “Test draft”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Exact workspace/revision; Configuration check; Site test; required
  observations; status.
- **Actions:** Check configuration; then Open preview when supported. Review publication only when
  policy allows.
- **Reveal on demand:** Test details → compiler result and captured events. Preview instructions →
  external tool return point.
- **Empty:** This draft has not been tested. → Check configuration
- **Failure:** The configuration check failed. {safeReason}. → Review errors
- **Access or capability restriction:** You can’t preview this workspace. → Review access
- **Completion:** Configuration passed. Site tracking still needs checking. Later show observed
  check results separately.

<a id="s35"></a>

### S35 — Publish tracking

**Pattern:** Review/result. **Title:** “Publish tracking”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** Container/environment; Current live version; Proposed version;
  changes; unverified checks and consequences. Create-version and restore are separate modes.
- **Actions:** Create version / Publish version / Restore version, only in the corresponding
  approved mode. Secondary Cancel.
- **Reveal on demand:** Version details → exact resources and content. Publication history →
  receipts. Restore impact → limits.
- **Empty:** No version selected. → Choose version
- **Failure:** We couldn’t confirm publication. → Check status
- **Access or capability restriction:** You can review this version but can’t publish it. → Review
  access
- **Completion:** Version {version} published. Checking live state. Then Live version verified;
  tracking checks remain independently stated.

<a id="s36"></a>

### S36 — Catalogs

**Pattern:** Overview. **Title:** “Catalogs”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Provider/catalog; Product source; Eligible / Excluded / Pending /
  Rejected; Last sync.
- **Actions:** Review products; first use Connect catalog.
- **Reveal on demand:** About eligibility → channel meaning and counts. Catalog details → resource
  IDs.
- **Empty:** No catalogs connected. → Connect catalog
- **Failure:** Catalog status couldn’t be loaded. → Try again
- **Access or capability restriction:** This catalog needs additional access. → Review access
- **Completion:** Updated {time}. No cross-channel All products approved summary.

<a id="s37"></a>

### S37 — Products

**Pattern:** Report. **Title:** “Products”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Catalog/channel; Search products; Image; Product; Variant;
  Eligibility; Price; Stock; Last sync; Issue.
- **Actions:** View product.
- **Reveal on demand:** Eligibility details → rule/source. Provider comparison → projected vs
  accepted fields. Product details → stable IDs.
- **Empty:** No products match these filters. → Clear filters; absent source uses Connect product
  source.
- **Failure:** Products couldn’t be loaded. → Try again
- **Access or capability restriction:** You can inspect products but can’t sync this catalog. →
  Review access
- **Completion:** Show current data timestamp; edits return to Changes. No success toast for a read.

<a id="s38"></a>

### S38 — Review catalog sync

**Pattern:** Review/result. **Title:** “Review catalog sync”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** Channel/account; Added / Updated / Removed / Unchanged; exact item
  list; important price/stock/removal effects.
- **Actions:** Approve sync / Apply approved sync according to policy.
- **Reveal on demand:** Product changes → complete field diffs. Sync details → receipt and
  idempotency references.
- **Empty:** No changes to sync. → Back to products
- **Failure:** We couldn’t confirm every update. → Review sync status
- **Access or capability restriction:** You can review this sync but can’t apply it. → Review access
- **Completion:** {doneCount} products updated; {remainingCount} need attention. Complete success
  only when all results are known.

<a id="s39"></a>

### S39 — {product} issue / Product set

**Pattern:** Inspection. **Title:** “{product} issue / Product set”. No subtitle unless specified in
the visible content.

- **Visible first, in order:** For issue: channel/reason/affected fields/current status. For set:
  Name / Matching rules / Products included.
- **Actions:** Review repair for issues; Review product set for supported grouping edit.
- **Reveal on demand:** Provider details → safe reason codes. Source data → adopter-owned values.
  Membership → complete preview.
- **Empty:** No active issues recorded for this product. → View history. Empty set says No products
  match these rules.
- **Failure:** Product details couldn’t be loaded. → Try again
- **Access or capability restriction:** This change must be made in your product source. → View
  repair steps; permission failures use Review access.
- **Completion:** Repair submitted. Awaiting provider review. Accepted only after new provider
  evidence confirms it.

<a id="s40"></a>

### S40 — Website analytics

**Pattern:** Overview. **Title:** “Website analytics”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Property/date; Visitors / Sessions / Key events with definitions;
  trend; traffic sources; data status.
- **Actions:** View traffic.
- **Reveal on demand:** About metrics → GA4 definitions and limitations. Data details →
  property/source.
- **Empty:** No website analytics collected. → Collect data
- **Failure:** Website analytics couldn’t be loaded. → Try again
- **Access or capability restriction:** This property needs additional access. → Review access
- **Completion:** Updated {time}. No inference of financial sales from key events.

<a id="s41"></a>

### S41 — Traffic

**Pattern:** Report. **Title:** “Traffic”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Channel; Sessions; Key events; named rate; filters Source / Medium /
  Campaign; chart when useful.
- **Actions:** View source.
- **Reveal on demand:** About this rate → numerator/denominator. Source details → attribution
  limitations.
- **Empty:** No traffic recorded for these dates. If data missing: No traffic report collected. →
  Collect data
- **Failure:** Traffic couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this property’s traffic. → Review
  access
- **Completion:** Updated {time}. No toast on sorting/filtering.

<a id="s42"></a>

### S42 — Landing pages

**Pattern:** Report. **Title:** “Landing pages”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Property/date; Page; Visits; Engagement; Key events; Issues; Search
  pages.
- **Actions:** View page.
- **Reveal on demand:** Page details → full URL and source definitions. Technical details → record
  identity.
- **Empty:** No landing pages recorded for these dates. → Change dates or Collect data according to
  evidence.
- **Failure:** Landing pages couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this property’s pages. → Review
  access
- **Completion:** Show selected page detail. No claim that visits identify individual customers.

<a id="s43"></a>

### S43 — Key events

**Pattern:** Report. **Title:** “Key events”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Property/date; Event; Count; Definition; Updated; linked outcome when
  known.
- **Actions:** View event. Secondary Compare with orders.
- **Reveal on demand:** How counted → GA4 event meaning. Event settings → supported configuration.
- **Empty:** No key events recorded for these dates. If unconfigured: No key events configured. →
  View setup
- **Failure:** Key events couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view key events but can’t change their settings. →
  Review access
- **Completion:** Updated {time}. Any goal change uses its own verified result.

<a id="s44"></a>

### S44 — Tracking health

**Pattern:** Overview. **Title:** “Tracking health”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Current property/destinations; issues; Last checked; links to event
  details and tracking setup.
- **Actions:** Review issue; healthy state View checks.
- **Reveal on demand:** Check details → individual source evidence. No duplicate issue store.
- **Empty:** No tracking checks recorded. → Check tracking
- **Failure:** Tracking health couldn’t be loaded. → Try again
- **Access or capability restriction:** Tracking checks need additional access. → Review access
- **Completion:** Checks updated {time}. No issues found in available checks, only when supported by
  evidence.

<a id="s45"></a>

### S45 — Search visibility

**Pattern:** Overview. **Title:** “Search visibility”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Property/date; Clicks / Impressions / CTR / Average position; trend;
  Pages needing attention.
- **Actions:** View performance.
- **Reveal on demand:** About search data → definitions, aggregation and freshness. More metrics →
  optional fields.
- **Empty:** No search report collected. → Collect data
- **Failure:** Search reports couldn’t be loaded. → Try again
- **Access or capability restriction:** This property needs Search Console access. → Review access
- **Completion:** Updated {time}. Show preliminary data if present.

<a id="s46"></a>

### S46 — Search opportunities

**Pattern:** Report. **Title:** “Search opportunities”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Page/query; opportunity; short evidence reason; priority; readiness.
- **Actions:** Review opportunity. Detail offers Prepare brief or supported change.
- **Reveal on demand:** Why suggested → business fit and evidence. Limitations → missing data.
- **Empty:** No opportunities ready. Collect search evidence to find useful next steps. → View data
  status
- **Failure:** Opportunities couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view opportunities but can’t create changes. → View
  access requirements
- **Completion:** Brief prepared. → View brief. No promised traffic increase.

<a id="s47"></a>

### S47 — Search pages

**Pattern:** Report. **Title:** “Search pages”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Search pages; Page; Clicks; Impressions; CTR; Average position;
  Issue.
- **Actions:** View page.
- **Reveal on demand:** URL details → full address/canonical evidence. About metrics → definitions.
- **Empty:** No pages match these filters. → Clear filters
- **Failure:** Search pages couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this property’s page report. →
  Review access
- **Completion:** Open the selected page. No success toast for reads.

<a id="s48"></a>

### S48 — Search queries

**Pattern:** Report. **Title:** “Search queries”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Query; Clicks; Impressions; CTR; Average position; linked page;
  filters when supported.
- **Actions:** View query.
- **Reveal on demand:** Query details → grouping/privacy gaps and source. Related pages →
  evidence-backed links.
- **Empty:** No queries match these filters. → Clear filters
- **Failure:** Search queries couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this property’s query report. →
  Review access
- **Completion:** Show query results with source/time; zero clicks stays distinct from no data.

<a id="s49"></a>

### S49 — Site health

**Pattern:** Report. **Title:** “Site health”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Checked {time}; issue groups; Issue; Affected pages; Status; Next
  step.
- **Actions:** Review issue. Check again only when it runs a supported fresh check.
- **Reveal on demand:** Check details → crawl/source timestamp and limitations. Page examples →
  exact URLs.
- **Empty:** No site checks recorded. → Run check when supported; otherwise View collection steps.
- **Failure:** Site health couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view recorded checks but can’t run this check. →
  Review access
- **Completion:** Check finished. {issueSummary}. No issues found is limited to the checks
  performed.

<a id="s50"></a>

### S50 — Keyword research

**Pattern:** Setup/edit. **Title:** “Keyword research”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Topic; Market; Language; business intent; results grouped Keywords /
  Pages / Competitors; estimated demand label.
- **Actions:** Research keywords. Results use Prepare brief.
- **Reveal on demand:** More options → provider fields. Research details → estimates, dates and
  source. Why suggested → evidence.
- **Empty:** No research yet. Enter a topic to begin. → Research keywords
- **Failure:** Research couldn’t finish. Your inputs are still here. → Try again
- **Access or capability restriction:** Keyword research isn’t available for this connection. → View
  requirements
- **Completion:** Research ready. → View results. Missing evidence stays labelled; no fabricated
  demand.

<a id="s51"></a>

### S51 — Experiments

**Pattern:** Overview. **Title:** “Experiments”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Running tests; Recent results; Ideas; measurement readiness.
- **Actions:** Prepare experiment when supported.
- **Reveal on demand:** About experiments → hypotheses and evidence rules. Result details → method.
- **Empty:** No experiments yet. Start with a question you want to test. → View ideas
- **Failure:** Experiments couldn’t be loaded. → Try again
- **Access or capability restriction:** Experiment management isn’t available in this workspace. →
  View requirements
- **Completion:** Draft experiment saved only when stored. No test launched from preparing it.

<a id="s52"></a>

### S52 — Running experiments

**Pattern:** Report. **Title:** “Running experiments”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Question; Variants; Primary outcome; Started; Evidence; Status.
- **Actions:** View experiment. Stop experiment opens effect review.
- **Reveal on demand:** Test details → allocation, planned duration and sample basis. Observations →
  evidence.
- **Empty:** No experiments running. → View ideas
- **Failure:** Running experiments couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view this experiment but can’t change it. → View
  access requirements
- **Completion:** Read shows current status. Stop success requires confirmed action and states which
  collection stopped.

<a id="s53"></a>

### S53 — Experiment results

**Pattern:** Inspection. **Title:** “Experiment results”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** Question; Tested change; Outcome; period; sample; effect/uncertainty
  when supported; decision.
- **Actions:** Review result; supported rollout offers Prepare rollout.
- **Reveal on demand:** Analysis details → method and limits. Variant details → exact comparison.
- **Empty:** No completed results yet. → View running experiments
- **Failure:** Results couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to these experiment results. → View
  access requirements
- **Completion:** Result available / Inconclusive. Never declare a winner without supported
  analysis.

<a id="s54"></a>

### S54 — Experiment ideas

**Pattern:** Report. **Title:** “Experiment ideas”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Question; Supporting evidence; Outcome to measure; Readiness; Effort.
- **Actions:** Add idea → Save idea. Selected idea uses Prepare experiment.
- **Reveal on demand:** Idea details → hypothesis and assumptions. Evidence → sources.
- **Empty:** No ideas saved. Add a question you want to test. → Add idea
- **Failure:** Ideas couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view ideas but can’t save one. → View access
  requirements
- **Completion:** Idea saved. → View idea. Speculation remains labelled Idea.

<a id="s55"></a>

### S55 — Changes

**Pattern:** Report. **Title:** “Changes”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Tabs Needs review / Approved / Running / Completed; Change; Resource;
  By; Status; Updated.
- **Actions:** Review change. No global Apply all.
- **Reveal on demand:** Proposal details → evidence, revision and authorization. Filters →
  provider/account/actor.
- **Empty:** No changes need review. Other tabs show their own empty state. → View activity
- **Failure:** Changes couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view this proposal but can’t approve it. → View
  access requirements
- **Completion:** Proposal status updates from shared record. Approval never implies applied.

<a id="s56"></a>

### S56 — Review {changeType}

**Pattern:** Review/result. **Title:** “Review {changeType}”. No subtitle unless specified in the
visible content.

- **Visible first, in order:** Account/environment; exact targets; Current → Proposed with units;
  dependent effects; required checks.
- **Actions:** Approve change then Apply approved change if policy separates them. Secondary Back to
  edit / Cancel.
- **Reveal on demand:** Why this change → evidence. All targets → exact bulk scope. Technical
  details → revision and receipt.
- **Empty:** No changes proposed. → Back to edit
- **Failure:** The proposal couldn’t be prepared. {safeReason}. → Back to edit; changed provider
  state uses Review updated proposal.
- **Access or capability restriction:** You can review this change but can’t approve it. → View
  access requirements
- **Completion:** Change approved. → Apply approved change. Do not say complete before execution.

<a id="s57"></a>

### S57 — Change status

**Pattern:** Review/result. **Title:** “Change status”. No subtitle unless specified in the visible
content.

- **Visible first, in order:** Exact effect/resource; Queued / Applying / Checking provider state /
  Verified / Needs attention; per-target progress.
- **Actions:** View resource when verified; Check status when uncertain; Review recovery when
  partial.
- **Reveal on demand:** Execution details → attempts, receipts and safe IDs. Verification details →
  actual read-back.
- **Empty:** No execution started. → Back to change
- **Failure:** We haven’t confirmed the result. → Check status. Never use Try again as a blind
  write.
- **Access or capability restriction:** You can view progress but can’t apply recovery changes. →
  View access requirements
- **Completion:** Change verified. {resultSummary}. Performance impact has not been measured unless
  separate evidence exists.

<a id="s58"></a>

### S58 — Activity

**Pattern:** History. **Title:** “Activity”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Time; What happened; Resource; By; Result; filters Type / Provider /
  Result.
- **Actions:** View activity entry.
- **Reveal on demand:** Activity details → exact effects, sources and receipts. Technical details →
  safe IDs.
- **Empty:** No activity in these dates. → Change dates
- **Failure:** Activity couldn’t be loaded. → Try again
- **Access or capability restriction:** You don’t have access to this activity. → View access
  requirements
- **Completion:** Show returned entries. No transient success toast.

<a id="s59"></a>

### S59 — Automations

**Pattern:** Report. **Title:** “Automations”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Name; Task; Account; Schedule/timezone; Next run; Last success;
  Status. Local host requirement visible.
- **Actions:** Create automation → Review automation or Save schedule according to effect/policy.
- **Reveal on demand:** Schedule details → next runs and limits. Run history → attempts. Advanced →
  supported rule settings.
- **Empty:** No automations configured. → Create automation
- **Failure:** Automations couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view automations but can’t change them. → View
  access requirements
- **Completion:** Schedule saved. Next run: {time}. If host unavailable: Host must be running; do
  not promise execution.

<a id="s60"></a>

### S60 — Alerts

**Pattern:** Report. **Title:** “Alerts”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Issue; Resource; First seen; Last seen; Occurrences; Status. Filters
  Active / Acknowledged / Snoozed / Resolved.
- **Actions:** Review alert. Detail actions Acknowledge / Snooze / Check again as supported.
- **Reveal on demand:** Alert details → evidence, grouping and notification history. Snooze → end
  time and scope.
- **Empty:** No active alerts. This does not mean all checks passed. → View checks
- **Failure:** Alerts couldn’t be loaded. → Try again
- **Access or capability restriction:** You can view alerts but can’t change their status. → View
  access requirements
- **Completion:** Alert acknowledged / Snoozed until {time}. Resolved requires evidence; never
  substitute acknowledgement.

<a id="s61"></a>

### S61 — Settings

**Pattern:** Setup/edit. **Title:** “Settings”. No subtitle unless specified in the visible content.

- **Visible first, in order:** Sections Display / Business / Notifications / Data / Administration
  as supported; readable current values; saved state.
- **Actions:** Save changes on editable section; Reset display preferences in that section only.
- **Reveal on demand:** Advanced settings → administrator controls. Data retention → exact host
  policy. No raw config by default.
- **Empty:** These settings aren’t available on this host. → View host requirements
- **Failure:** Settings couldn’t be saved. Your edits are still here. → Try again
- **Access or capability restriction:** You can view these settings but can’t change them. → View
  access requirements
- **Completion:** Settings saved. State exact section; don’t imply unrelated preferences or provider
  settings changed.

<a id="s62"></a>

### S62 — Page not found / Access needed / Ops is unavailable

**Pattern:** Inspection. **Title:** “Page not found / Access needed / Ops is unavailable”. No
subtitle unless specified in the visible content.

- **Visible first, in order:** One exact title; one reason; safe destination context; no stale
  other-account data.
- **Actions:** Go to overview / View access requirements / Try reconnecting, matching the actual
  state.
- **Reveal on demand:** Technical details → safe request/reference and troubleshooting, not stack
  traces by default.
- **Empty:** This page is no longer available. → Go to overview
- **Failure:** Ops couldn’t reconnect. Check that your host is running. → Try reconnecting
- **Access or capability restriction:** You don’t have access to {account}. → View access
  requirements; do not disclose restricted account names.
- **Completion:** Connection restored. Resume a safe read of the intended page; never replay a write
  automatically.

## Field-level copy and validation

These forms use the same resource pickers, units and approval contracts described in the screen
catalog. Each row gives proposed visible labels, optional help and exact invalid-state copy.
Required/optional status must come from the supported schema; no optional field becomes required
merely to improve matching quality.

| Screens / form       | Visible labels and choices                                                                                                       | Help only when relevant                                                      | Validation copy                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| S01 context          | Business; Environment; What would you like to do?                                                                                | Choose the business you want to manage.                                      | Choose a business. / Choose an environment.                                                                                                         |
| S06 provider         | Account; Page; Instagram account; Dataset; Catalog, only relevant resource kinds                                                 | Choose the account used for this business.                                   | Choose an account. / This resource belongs to another account.                                                                                      |
| S06 limited access   | Continue with limited access                                                                                                     | {feature} will remain unavailable.                                           | This connection needs {permissionLabel} to continue.                                                                                                |
| S09 resource binding | Selected resources                                                                                                               | Future updates will use this selection.                                      | Choose at least one {resourceType}. / This resource is no longer available.                                                                         |
| S10/S29 collection   | Report; Start date; End date                                                                                                     | Dates use {timezone}.                                                        | Choose a report. / End date must be on or after start date. / This period exceeds the available collection limit.                                   |
| S15/S56 budget       | Budget type: Daily / Lifetime; Amount; currency code visible                                                                     | This budget is shared by {scopeName}, when true.                             | Enter an amount. / Enter a valid amount. / Minimum: {minimum} {currency}. / Maximum: {maximum} {currency}. Bounds only from actual policy/provider. |
| S15/S56 schedule     | Starts; Ends (optional); Timezone                                                                                                | The campaign will use {timezone}.                                            | End time must be after start time. / Choose a valid start time.                                                                                     |
| S17 creative         | Ad name; Image or video; Headline; Ad text; Destination URL; Call to action                                                      | Required formats appear before selection.                                    | Add a supported file. / File is larger than {limit}. / Enter a valid destination URL. / {field} exceeds {limit} characters.                         |
| S18 keywords         | Keyword; Match type: Broad / Phrase / Exact; Ad group                                                                            | Exclusions apply to {scopeName}.                                             | Enter a keyword. / Choose a match type. / Choose an ad group.                                                                                       |
| S22 reports          | Report type; Account; Dates; Group by; Columns                                                                                   | Only supported combinations are offered.                                     | These report options can’t be used together. / Choose an account.                                                                                   |
| S26 report import    | Dataset; Event; Issue title; Provider status; Observed on; Source reference; Affected events (optional); Total events (optional) | Don’t include customer details or credentials.                               | Enter an issue title. / Enter a valid date. / Affected events can’t exceed total events. / This report belongs to another dataset.                  |
| S28 test             | Dataset; Environment; Test name (optional)                                                                                       | This test observes events; it does not create an order.                      | Choose a dataset. / This dataset doesn’t support this test.                                                                                         |
| S31 tracking setup   | Site; Destination; Business event; When it happens; Value source; Currency source                                                | Browser and server versions must use the same event identity when paired.    | Choose an event source. / This setup may duplicate existing tracking. Review the existing tag.                                                      |
| S33 tag draft        | Name; Destination; Trigger; Enabled                                                                                              | Changing this item affects {dependencyCount} related items, only when known. | Enter a name. / Choose a trigger. / This draft has changed. Reload it before saving.                                                                |
| S35 version          | Workspace; Version name; Notes (optional)                                                                                        | Creating this version changes the workspace as described in the review.      | Choose a workspace. / Enter a version name. / This workspace has unresolved conflicts.                                                              |
| S35 publication      | Version; Environment                                                                                                             | This changes the live container, only for live publication.                  | Choose a version. / This version no longer matches the approved proposal.                                                                           |
| S37 source mapping   | Product ID; Variant ID; Price; Currency; Availability; Image; Product URL                                                        | Map fields from your product source.                                         | A stable product ID is required. / Choose a currency field. / This mapping is incomplete.                                                           |
| S39 product set      | Name; Rules; Matching products                                                                                                   | Review the complete product list before applying.                            | Enter a name. / Complete this rule. / These rules match no products. Last message is a warning unless forbidden by contract.                        |
| S50 research         | Topic; Market; Language; What do you sell? (optional)                                                                            | Estimates depend on the selected market.                                     | Enter a topic. / Choose a market. / Choose a language.                                                                                              |
| S54 experiment idea  | Question; Proposed change; Outcome to measure; Evidence (optional)                                                               | Describe what you want to learn.                                             | Enter a question. / Describe the change. / Choose an outcome.                                                                                       |
| S52 experiment edit  | Name; Variants; Primary outcome; Planned duration; Allocation, when supported                                                    | Changing a running test may affect its result.                               | Complete each variant. / Choose a measurable outcome. / Allocation must total 100%, only for percentage allocation.                                 |
| S59 schedule         | Name; Task; Account; Frequency; Time; Timezone                                                                                   | Your Ops host must be running, for local hosts.                              | Enter a name. / Choose a task. / Choose a timezone. / This schedule is not supported by this host.                                                  |
| S59 mutation rule    | Targets; Condition; Maximum change; Allowed frequency; Approval scope                                                            | The rule can only make the changes shown in this review.                     | Choose exact targets. / Enter a permitted limit. / This rule requires review before activation.                                                     |
| S60 snooze           | Snooze until; Timezone                                                                                                           | Alerts resume after this time.                                               | Choose a future time.                                                                                                                               |
| S61 display          | Density: Comfortable / Compact; Language; Time display                                                                           | Display choices don’t change provider reporting periods.                     | This preference couldn’t be saved.                                                                                                                  |

No generated ID fields, raw manifests, approval/run references or credential environment-variable
names appear in normal forms. Additional provider fields must receive a label, default/absence rule,
validation message and disclosure placement before their first interface exposure; do not render
unknown schema keys through a generic form and call the copy pass complete.

## Metric and status disclosure dictionary

Visible qualifiers are part of the label or adjacent status, never optional tooltip content when
they affect trust.

| Visible label                 | Info text / expanded definition                                                                                                    | Additional visible state                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Ad spend                      | Amount reported as spent by {provider} for these dates.                                                                            | Currency and missing/partial report state                         |
| Meta-attributed purchases     | Purchases Meta credits to ads under the reported attribution settings.                                                             | Purchases may include duplicates, when applicable                 |
| Google-attributed conversions | Conversions Google Ads credits under the reported conversion settings.                                                             | Conversion action and incomplete evidence state                   |
| Cost per attributed purchase  | Ad spend divided by purchases attributed by this provider.                                                                         | Provider/currency; unreliable denominator warning                 |
| Orders delivered              | Orders recorded as delivered in the connected order source for the stated cohort.                                                  | Cohort and missing order-data status                              |
| Ad spend per delivered order  | Spend divided by delivered orders in the selected, explicitly defined comparison. This is not automatically causal ad attribution. | Attribution/cohort limitation; no number without valid comparison |
| Browser received              | Browser event deliveries observed by the named source.                                                                             | Observation source and period                                     |
| Server accepted               | Server events acknowledged by the provider in the available delivery records.                                                      | Partial records or pending attempts                               |
| Matched pairs                 | Browser and server observations matched by supported event identity rules.                                                         | Pairing does not itself prove provider deduplication              |
| Purchase ROAS                 | Attributed purchase value divided by spend; this does not include all business costs.                                              | Provider, currency, value basis and uncertainty                   |
| Match information             | Whether supported matching fields are available and valid. This is not a prediction of ad performance.                             | Missing / Invalid / Not expected / Available                      |
| Live version                  | Version currently confirmed as published by the provider.                                                                          | Last checked {time}                                               |
| Draft changes                 | Proposed changes that have not been published.                                                                                     | Not published                                                     |

Connection status words: Connected, Setup incomplete, Access expired, Access needed, Not checked.
Evidence words: Current, Some data missing, Last updated {time}, Not collected. Check words: Passed,
Failed, Not checked, Incomplete, with the individual check named. Change words: Draft, Needs review,
Approved, Applying, Checking status, Verified, Needs attention. Do not reuse a green Connected badge
as a passing measurement check.

## Specific result and recovery copy

- Budget: “Budget updated to {amount} {currency} per day.” Only after confirmed apply; next visible
  state “Checking provider state” until read-back verifies it. Lifetime budgets use “Lifetime budget
  updated to {amount} {currency}.”
- Pause: “{campaign} is paused.” Only after provider verification. Pending verification: “Pause
  request sent. Checking campaign status.”
- Approval: “Change approved.” Never “Change complete”. If automatic apply is actually part of the
  reviewed engine policy, label the pre-action accordingly and show execution progress rather than
  implying a separate click is always needed.
- Duplicate retry: “This change is already running.” → View progress. Do not prepare another
  identical mutation.
- Recovery: “{completedCount} changes confirmed. {unknownCount} still need checking.” Count only
  known states. → Check status.
- Provider conflict: “The provider settings changed after this proposal was prepared.” → Review
  updated proposal. Do not hide the new diff.
- Reconnect after write timeout: “Connection restored. Checking the previous attempt.” Read/recover
  only; restored authentication is not authorization to reapply.
- No rollback: “This change can’t be undone automatically.” Explain supported compensating action
  only when one exists. Never offer a decorative Undo button.
- Real test-order boundary: “The next step places a real order.” Display exact item, total,
  recipient/delivery context and fulfilment consequences before the separately authorized action. Do
  not bury this in Test details.

## Six representative default compositions

These are content-order specifications, not visual mockups or current screenshots.

1. **Overview / S02:** Overview → business/account/date → short data-quality warning only if needed
   → relevant metrics → priority issues → View report links → Recent changes. Expanded: metric
   definitions and full source records. Remove generic welcome copy and repetitive instructions.
2. **Report / S14:** Campaigns → account/date → Search campaigns + Delivery filter → campaign table
   → pagination. Optional chart/metrics only when they add a useful overview. Expanded: column
   choices, row actions, attribution details. Do not attach all editing forms below the table.
3. **Inspection / S24:** Purchase → dataset/account → Server delivery delayed, when true → Check
   delivery or View delivery according to action availability → three delivery counts → tabs.
   Expanded: event IDs/timestamps, matching-source details and technical payload shape. A warning
   explaining unmatched counts stays visible.
4. **Setup/edit / S06:** Connect Meta → step label → named account/resource choices → Continue +
   Back. Expanded: permissions explanation and specialist setup. Do not show every wizard step’s
   form at once.
5. **Review/result / S56–S57:** Review budget → campaign/account/environment → exact current and
   proposed daily budget → material effect → required authorization action. After apply, replace
   form with actual execution status and result. Expanded: receipts and revision. Do not hide
   financial effect in a tooltip.
6. **History / S58:** Activity → dates/type/provider filters → chronological entries → entry detail.
   Expanded: attempts and safe technical references. No success toast on reading history.

## Review checklist and planning completion

- [x] S01–S62 mapped to one of six page patterns.
- [x] Each screen has proposed populated labels, actions and disclosure placement.
- [x] Each screen has empty, failure, restricted and completion wording; shared
      loading/offline/partial states are inherited explicitly.
- [x] Guided forms include field labels, context help and validation strings.
- [x] Metric labels distinguish outcomes, deliveries and provider attribution.
- [x] Read, collect, check, approve, apply and verify wording is separated.
- [ ] Validate strings against actual typed capabilities/results during each implementation batch;
      no unsupported fallback actions.
- [ ] Review representative rendered layouts and adjust density, truncation and translation
      behavior.
- [ ] Run novice task and accessibility checks; text coverage is not proof of usability.

The copy/disclosure planning pass is complete for the scoped screen catalog. Visual layout
validation and user testing remain. There is no claim that all provider features exist or that this
document is the final translation catalog; during implementation, move approved strings into the
existing centralized presentation owner rather than maintaining a second independent runtime copy
source.
