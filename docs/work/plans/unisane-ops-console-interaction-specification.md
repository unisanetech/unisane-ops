---
id: 'PLAN-20260909-console-interactions'
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

# Interaction details and acceptance specification

Part of the [console experience plan](unisane-ops-console-experience-plan.md), applied to all
[62 screen specifications](unisane-ops-console-screen-specification.md). Status: proposed. No
completed usability or live-provider validation is implied.

The [copy and disclosure contract](unisane-ops-console-copy-disclosure-specification.md) owns
proposed English titles, field labels, actions and state messages for every S01–S62 entry; consult
it alongside these requirements.

## 1. Navigation and context details

- Logo opens Overview for the current project, not a different default project. Navigation labels
  remain stable while selection is clear through text/shape and color.
- Project/environment switches show the destination explicitly, reset incompatible account filters
  and cancel stale reads. Never display previous-project results while the new project loads.
- Named account picker includes provider and secondary ID; search matches names/IDs. “All accounts”
  is available only when the view can explain aggregation and has access to each account.
- Breadcrumbs describe resource hierarchy. Browser Back restores filters, sort, page, scroll and
  selected record where possible. Deep links include safe resource/context references, not tokens or
  personal data.
- Page title and breadcrumb change together. Unsupported paths explain why; do not silently route to
  an unrelated screen.
- Clicking a row and opening a row menu are separate targets. Copying an ID must not open a row or
  select it.
- One main scroll region per simple page; detail panes have explicit scroll ownership and retain
  heading/actions. No nested scrolling trap on mobile.
- Persistent navigation can collapse without losing names for screen readers. Tooltips explain icons
  in collapsed mode and open on keyboard focus.

## 2. Content, labels and tiny copy

Use sentence case, verbs and concrete outcomes. Avoid “Execute”, “Hydrate”, “Artifact”,
“Disposition”, “Observation JSON” and “Recover after settlement” in ordinary flows. Keep exact
technical names in an expandable section when they help support work.

| Technical/source concept | Default user copy                                      | Detail retained                             |
| ------------------------ | ------------------------------------------------------ | ------------------------------------------- |
| missing evidence         | We have not collected this data yet                    | Required source and period                  |
| stale observation        | Last updated 2 days ago                                | Exact capture time and freshness rule       |
| permission denied        | This account does not allow budget changes             | Missing provider permission                 |
| apply uncertain          | We are checking whether the change went through        | Attempt/reference and recovery result       |
| partial creation         | 2 of 3 resources were created; 1 needs attention       | Per-resource receipt                        |
| compile succeeded        | The tracking configuration passed validation           | Compiler details; live testing still needed |
| no canonical outcomes    | Connect order data to compare actual sales             | Required adopter contract                   |
| diagnostics imported     | Added the report you supplied                          | Source/capture time; not fetched live       |
| paused scheduler         | This schedule is paused                                | Who paused it and when                      |
| unsupported operation    | Budget editing is not available for this campaign type | Capability reason and supported alternative |

Button labels name the object when context could be ambiguous: “Review budget change”, “Collect Meta
reports”, “Check delivery”, “Reconnect Google”. No “Fix all” unless the complete exact effect is
reviewable. A tooltip supplements visible explanation, never holds the only essential warning.

Abbreviations receive a short definition on first meaningful use. CPM/CPA/ROAS may remain familiar
short column labels with expanded accessible names and clearly named denominators. Do not rename
actual Meta/Google entities into misleading generic objects.

## 3. Dates, units and numeric formatting

- Use readable dates such as “8 Aug–6 Sep 2026”; show timezone near reporting controls and exact ISO
  timestamp in technical details. Relative time has an accessible exact equivalent.
- Presets identify whether today is included. Today is visibly partial until the provider/source
  says otherwise. Apply and Cancel controls prevent accidental half-selected date requests.
- Preserve inclusive day semantics and URL `from`/`to` for supported range modes.
  Current/snapshot/recommendation pages show their own time context instead of an irrelevant global
  range.
- Only propagate dates between compatible temporal modes. Never crop or sum overlapping aggregate
  records in the browser.
- Currency uses unambiguous codes where accounts differ: “USD 330.28”, “BDT 1,200”. Editing uses
  major units and explains daily versus lifetime budget; internal minor units never leak into form
  values.
- Thousands separators, meaningful decimal precision and consistent percentages. Small nonzero
  values do not round to misleading zero. Exact values available in details/export.
- Missing is labelled; zero is a measured zero; not applicable is explained; invalid numbers are not
  rendered as NaN or Infinity.
- Comparisons name the baseline. Zero baseline yields an absolute difference. Suppress percent
  change for incomplete/incompatible periods with a reason.
- No formula duplicates in UI: Growth defines numerator, denominator, attribution and currency
  semantics; UI formats the supplied typed value.

## 4. Metric cards and charts

- A card shows label, value/unit, period or scope if needed, confidence/freshness note and optional
  valid comparison. Explain its click destination through accessible name.
- Do not make every card a button. Use direct detail links where interaction exists.
- Real time-series charts have actual dated observations, timezone and units. Gaps remain gaps; no
  interpolation that implies observed results. Provider categories use comparison bars, not trend
  lines.
- Chart title states the question; legend identifies series/source. Tooltips show date, precise
  value, unit and partial state. Keyboard-accessible table alternative is available.
- Dual axes require clear independent units; prefer separate aligned charts when two scales could
  mislead. Do not use truncated bar axes to exaggerate differences.
- Legends/markers use color plus labels/patterns. Dense charts degrade to simpler tables on small
  screens; no hover-only evidence.
- Untrusted purchases retain warnings in charts and exports, not only the page banner.

## 5. Tables and resource lists

- Each screen catalog supplies initial columns. Keep the main identifier and status visible; numeric
  values align consistently. Long names wrap or truncate with a full-name disclosure.
- Default sorting is stated and stable. Missing values sort predictably. Search scope says whether
  it searches all loaded/server records or the visible page; never imply completeness after
  truncation.
- Filters appear as removable chips; Clear filters is separate from Reset columns. Filter changes
  reset pagination. Preserve results while a same-scope refresh runs, labelled “Updating”; new-scope
  results must not reuse old data.
- Show “1–25 of 120” only when count is known. For unknown totals say “25 shown; load more”. Never
  infer an account-wide total from a bounded result.
- Selection counts distinguish visible-page selection from all filtered results. Cross-page bulk
  selection requires explicit scope and exact target confirmation from the engine.
- Export includes chosen scope, time, currency, attribution and data limitations; it does not export
  hidden PII/credentials. Label whether export contains visible rows or all matched rows. Neutralize
  spreadsheet-formula injection in text cells.
- Optional column/density choices are scoped sensibly to table family; resetting preferences never
  resets campaign settings.
- Sorting and filtering are read-only. Resource status switches lead to review, not immediate
  provider mutations.

## 6. Forms, pickers and validation

- Every input has a persistent label; placeholder is an example, not the label. Required fields are
  identified consistently; optional fields say optional where ambiguity matters.
- Prefill only known context. No arbitrary first-account, implicit budget, fabricated city or
  guessed conversion event. When exactly one valid resource exists, show the selected resource
  explicitly.
- Use search-select for resources, date/time pickers with timezone, currency inputs with units,
  radio buttons for few exclusive choices and checkboxes for independent choices.
- Group fields by the user’s decision, with advanced provider fields collapsed. Show dependencies
  when a selection changes; explain when a dependent value is cleared.
- Validate on blur and submit without punishing partially typed values. Inline error says what is
  wrong and how to correct it. Submission focuses the first invalid field and provides a summary for
  long forms.
- Distinguish client validation, permission failure, provider rejection, network failure and
  uncertain write outcome. Do not collapse every failure into “Check your JSON”.
- Preserve nonsecret input after failure. Inputs may remain editable while a read occurs; prevent
  conflicting changes while submitting a reviewed mutation.
- Drafts have saved/unsaved status. Leaving unsaved work offers Continue editing, Discard draft, or
  Save draft only if supported. Do not claim server persistence from component state.
- Keyboard Enter submits only the intended form; multiline input retains newlines. Escape closes a
  noncritical dialog but cannot secretly cancel a running provider action.
- File imports show accepted types/size before selection, filename, parse progress, row errors and
  preview. No success until validated and stored. Safe downloadable error report when useful.

## 7. Dialogs, detail panes and review

- Use dialogs for bounded decisions, detail panes for inspection and full pages for long multi-step
  work. Do not stack nested approval dialogs.
- Dialog title names the effect; description names account/environment and consequences. Cancel is
  visible; destructive action uses a specific label.
- Focus moves into the dialog, remains contained and returns to the origin on close. Background is
  inert to screen readers/keyboard while modal.
- Sticky action bars do not cover content or mobile keyboard. Long reviews scroll while resource
  scope and final effect remain understandable.
- Review presents old/new values including units, resources and dependent effects. A downloadable
  exact-target list supports bulk changes but never substitutes for a readable summary.
- Approval expiry, actor permission and revision conflicts have dedicated states. If provider state
  changed since planning, refresh/replan and show the new diff; do not reuse approval blindly.
- Read-only users can inspect a proposal and see why they cannot approve. Approval is not offered
  when the host lacks that action.

## 8. Loading, progress and complete state matrix

| State                         | What remains visible                                     | Message and next action                         |
| ----------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Initial load                  | Page title, scope and stable skeleton                    | Loading reports; no fake zero metrics           |
| Same-context refresh          | Prior data with its original timestamp                   | Updating; failure retains clearly dated results |
| New account/date loading      | New requested context; no old-context metrics beneath it | Loading selected account/period                 |
| First use                     | Explanation and realistic setup steps                    | Connect account / collect data                  |
| Complete zero results         | Valid period/source plus zero count                      | No purchases recorded for these dates           |
| Filtered empty                | Active filters and result area                           | No matches; clear filters                       |
| Missing permission            | Resource context and unaffected permitted data           | Reconnect / request access                      |
| Missing integration           | Required source and expected result                      | Connect order data / configure adapter          |
| Unsupported capability        | Named task and provider limitation                       | Supported alternative or manual handoff         |
| Partial evidence              | Available data with coverage and unknown parts           | Collect missing dates when supported            |
| Stale evidence                | Original capture time, no “current” claim                | Collect latest data                             |
| Rate limited                  | Existing data with freshness; job status                 | Scheduled retry time if known                   |
| Offline host                  | Intended context, cached data labelled if safe           | Reconnect host; local schedules cannot run      |
| Write queued/running          | Exact authorized effect and durable link                 | View progress; safe to leave                    |
| Write outcome unknown         | Attempt state, target and last observation               | Check status; no blind apply retry              |
| Partial write                 | Per-target success/failure/unknown                       | Review recovery for remaining resources         |
| Version conflict              | Proposed vs changed provider state                       | Prepare updated proposal                        |
| Applied, verification pending | Receipt plus unfinished check                            | Check provider state                            |
| Verified                      | Read-back timestamp and resulting state                  | View resource / schedule outcome review         |
| Verification failed           | Actual observed mismatch                                 | Inspect difference; reviewed repair             |
| Manual step required          | Exact external task and return point                     | Open provider; return and verify                |

Progress uses real steps and counts. Only show a percentage when the total is known. Announce
meaningful transitions accessibly without announcing every polling tick. Toasts are supplementary;
permanent result/error state remains on the page and in Activity.

## 9. Accessibility and responsive acceptance targets

Use WCAG 2.2 AA as the implementation acceptance target, not a current compliance claim. Verify with
actual rendered UI, keyboard and assistive technology; screenshots alone are insufficient.

- Semantic landmarks, one H1, ordered headings, named inputs, table headers and status
  announcements.
- Keyboard-accessible menus, filters, date pickers, charts, row actions and dialogs; visible focus
  is never obscured.
- Contrast targets: 4.5:1 ordinary text, 3:1 large text and essential UI boundaries/states. Test
  actual token combinations including disabled/error states.
- Design touch targets around 44 px where practical; meet at least the applicable 24 px
  minimum/spacing rules. No icon-only critical actions without accessible and discoverable names.
- At 200% zoom and narrow widths, reading order and primary actions remain usable. Reflow
  surrounding content; data tables can have explicitly labelled horizontal scroll with key columns
  retained.
- On mobile, sidebar becomes a drawer; filters become a labelled sheet; detail panes become
  full-screen views; summary cards stack. Review target/account stays visible before confirmation.
- Loading skeletons do not trap focus. Reduced-motion preferences respected. No essential content
  exists only on hover, color or animation.
- Bangla/English names, long account names, right-to-left-ready text handling and non-Latin
  characters survive display, search, export and copy. Do not translate provider resource IDs.
- Screen-reader output identifies metric source and warning, not just a number. Live-region errors
  are concise and do not expose secrets.

## 10. Privacy, safety and human/agent consistency

- Show presence/validity/source of matching fields instead of raw names, phone, address, IP and
  browser IDs. Any justified sensitive-detail access is permissioned, explicit and audit-friendly.
- Support exports redact tokens, headers and unnecessary personal data. External links avoid
  credentials in URLs and indicate leaving Ops.
- Agent suggestions show author, evidence, exact effects and limits. Human-readable wording is
  generated from typed results, not an independent approval mechanism.
- Report access and mutation access are separate. Do not hide a readable result merely because edits
  are prohibited; do not show enabled edits based only on connection status.
- Scope isolation applies to caches, drafts, query strings, downloads, background jobs and browser
  Back, not just the visible picker.
- A canceled dialog does not cancel an in-flight provider operation. If cancellation is supported,
  explain whether it cancels only waiting work or can interrupt active work.
- Authentication expiry preserves safe draft context; reauthentication must not automatically
  reapply a mutation.

## 11. Fully specified example journeys

### A. Owner connects Meta

1. Connections shows no Meta account; Connect Meta explains read access and optional change
   capabilities.
2. Sign-in returns three accounts; user selects by name and confirms secondary ID.
3. Dataset/Page selection shows names and incomplete permissions.
4. Initial collection produces partial results; Overview says which reports loaded.
5. “Connected” appears; “Tracking verified” does not appear until actual observations exist.

Acceptance: no JSON, secret variable names or manual IDs; dismissing setup preserves a truthful
incomplete state.

### B. User investigates Purchase duplication

1. Overview warns purchase counts may be unreliable; CPA retains the warning.
2. Measurement → Purchase shows canonical outcomes, browser/server deliveries and attribution
   separately.
3. Duplicate checks identifies matched pairs, retries and conflicting event IDs with provenance.
4. User opens a specific issue, sees which component owns the repair and prepares a supported change
   or handoff.
5. After apply, new observations verify behavior; old reporting remains labelled historically
   affected.

Acceptance: no divide-by-two correction, false “all fixed”, or automatic re-sending of purchases.

### C. User changes budget

1. Campaign selection resolves exact account/environment/resource.
2. Form shows current daily budget and currency; proposed amount validates bounds.
3. Review shows exact before/after and any campaign-shared budget effect.
4. Required approval binds the revision; apply creates durable progress.
5. Timeout shows Checking status; provider read-back resolves it before retry.
6. Verified budget is shown; no claim that CPA improved merely from this write.

Acceptance: double-click, restart and stale plan cannot create an unauthorized or duplicated effect.

### D. User fixes GTM

1. Tracking setup separates live container version and draft workspace.
2. Diagnosis identifies a specific trigger or parameter with supporting observations.
3. Review draft shows affected tags/dependencies; compilation validation is a distinct milestone.
4. Browser/server test evidence is collected when supported; missing checks stay visible.
5. Version creation and publication retain their exact effects and required policy reviews.
6. Post-publication verification reports what was actually observed; restore is a reviewed
   exact-version publication.

Acceptance: no pasted manifest/run ID, no hidden alternate shell path, no compile-only tracking
success.

### E. User handles catalog rejection

1. Catalog shows provider-specific rejected count and source freshness.
2. Product detail compares source price/stock/identifier to provider state.
3. Proposed fix names whether adopter data or provider synchronization must change.
4. Sync preview identifies exact items and effects; partial outcomes recover safely.
5. Revalidation confirms acceptance or retains the rejection with new evidence.

Acceptance: one channel’s eligibility never overwrites all channels’ business rules.

## 12. Design and implementation verification checklist

For every S01–S62 screen, record owner, implemented route/panel, capability source, screenshots,
fixture scenarios, focused tests and live proof status. Use Not applicable with a reason when a
screen cannot mutate or does not show metrics; do not silently omit checks.

- [ ] Populated, first-use, legitimate zero, filtered empty, long-content and loading states.
- [ ] Access denied, unsupported feature, expired session, offline, stale, partial and rate-limit
      states where relevant.
- [ ] Currency, timezone, incomplete day, zero baseline and mismatched comparison cases.
- [ ] Duplicate names across accounts; context switch during an outstanding read; Back/deep link
      after resource deletion.
- [ ] Review changed/expired; role changed; double-click; network timeout; partial execution;
      restart; verification mismatch.
- [ ] Mobile, desktop, zoom, keyboard, screen-reader, reduced-motion and long translated labels.
- [ ] Safe data exports and copy actions; raw errors/credentials/PII cannot leak.
- [ ] Empty buttons, dead links, fake successes and unsupported action claims removed.
- [ ] Same typed action/result across human and agent interfaces; shared record identifiers
      retained.
- [ ] Source-grounded design screenshot review complete; no screenshot of a loading page accepted as
      finished UI.

Novice usability sessions should ask users to perform the five example journeys without explaining
internal terms. Record whether they choose the correct account, describe number meanings, identify
incomplete evidence, predict a change’s effect and recognize verification status. Any wrong-account
mutation, misunderstood duplicate count, false-success interpretation or inability to complete a
supported normal task is a release-blocking usability issue for that workflow.

Tests should cover behavior and risk, not mirror component implementation. Use existing fixtures and
shared controls, with targeted integration tests for these failures. Separately record real provider
acceptance; passing simulated tests is not live verification.
