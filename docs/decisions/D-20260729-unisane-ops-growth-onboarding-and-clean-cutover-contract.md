---
id: 'D-d104bbc751f9'
owner: 'unisane'
scope: workspace
role: decision
lifecycle: durable
authority: canonical
provenance: accepted
view: current
status: accepted
---

# D-20260729 Unisane Ops Growth Onboarding And Clean Cutover Contract

## Changelog

- `2026-07-30`: Corrected the W3 Research contract. Human-first presentation now means
  progressive disclosure of the complete decision model, not replacement by capped
  summary cards. Research owns the keyword matrix, clusters, markets, question plan,
  competitor gaps, and SERP/experiment evidence; Search Console remains actual-
  visibility feedback.
- `2026-07-30`: Implemented the W3 SEO decision slice. One UI-neutral Growth
  projection now supplies the six distinct SEO page models, deterministic
  opportunities, honest comparison limits, focused page/query details, grouped
  site-health issues, and evidence-qualified research while the console app owns all
  presentation and interaction.
- `2026-07-30`: Implemented the W3 Overview decision slice. One UI-neutral Growth
  projection now supplies the executive condition, contextual priorities,
  source-separated metrics, evidence-backed funnel, readable outcomes, and capability
  summaries while the console app remains the sole presentation owner.
- `2026-07-30`: Implemented the W3 Connections decision slice. One provider-neutral
  headless projection now drives the Google-only connection index and detail tabs,
  preserves independent service truth, and uses a confirmed canonical disconnect that
  removes local connection state while retaining history and leaving Google resources
  unchanged.
- `2026-07-30`: Admitted W3 implementation with an exact owner and deletion map. The
  optional console app contributes `growth.console` and owns presentation; Growth
  exposes only `@unisane/growth/console` headless state/actions, while the embedded app,
  nested build/serve command, and old route catalog are retired without a fallback.
- `2026-07-30`: Implemented the W1 decision slice: one executable Ops adoption
  lifecycle, canonical Growth config, Provider Google connection/grant/resource
  lifecycle, shared readiness/action contracts, one-shot migration boundary, first-party
  adoption, and deletion of replaced setup/auth/config/token/readiness owners.
- `2026-07-29`: Made clean replacement slice-local rather than an end-stage cleanup.
  Every slice deletes its retired owner/export/route first, repairs consumers against
  the one replacement, removes all related residue, and passes a zero-residue gate
  before the next slice; final release work only aggregates proof.
- `2026-07-29`: Finalized the SEO product taxonomy as `Overview`, `Opportunities`,
  `Pages`, `Queries`, `Site health`, and `Research`; made search performance the
  Overview analysis and replaced ambiguous `Keywords` with `Queries`. Fixed
  Connections as one provider-card index plus full provider detail, incremental grants,
  partial-service health, supported-provider-only availability, and explicit disconnect
  consequences.
- `2026-07-29`: Made `unisane ops init` the only existing-project Ops adoption command
  and prohibited a bare `unisane init` alias. Framework application creation remains
  exclusively `create-unisane`; Growth remains a selectable capability rather than the
  owner of initialization.
- `2026-07-29`: Finalized the console product experience after reviewing every current
  route: normal operators are the primary audience; the reduced grouped sidebar, exact
  page destinations, strict content-admission/deletion rule, simple-English vocabulary,
  contextual-help behavior, honest data states, and page/component budgets are now
  decision requirements rather than draft direction.
- `2026-07-29`: Added the screenshot-grounded human-first console contract: simplified
  capability navigation, a dedicated Connections hub, consistent page hierarchy,
  plain-language status/copy, progressive technical disclosure, and accessibility
  requirements replace the current control-plane-heavy dashboard presentation.
- `2026-07-29`: Selected one stack-neutral project onboarding, connection, readiness,
  and console model for Ops Growth, with a coordinated major-release cutover and no
  command alias, config loader, auth-profile, token-env, console, or readiness fallback.

## Context

The Ops extraction established the correct product and package owners, but it preserved
an expert-first Growth setup experience assembled from several historical workflows. A
developer currently has to understand separate marketing, GTM, SEO, ads, analytics, and
provider command families; app-local marketing configuration; multiple auth profiles and
raw access-token environment fallbacks; manually entered provider resource ids; several
overlapping setup/status/doctor/proof commands; and an embedded static marketing console.

This is capable but unnecessarily difficult to adopt in a real project. It also permits
different surfaces to disagree about whether a project is configured, authenticated,
instrumented, receiving data, or safe to mutate.

The package boundaries selected by
`D-20260724-unisane-ops-product-package-and-repository-boundary-contract` remain correct.
This decision changes the public onboarding and developer experience within those
boundaries. It does not move Growth back into Framework or create a second Ops product.

## Decision Drivers

- one understandable path for a new project and an existing production application
- equal support for Framework and non-Framework projects
- provider discovery instead of manual identifier transcription
- one visible connection lifecycle per provider with incremental grants
- readiness derived from evidence rather than manually asserted setup labels
- safe audit-only adoption before instrumentation or provider mutation
- deterministic JSON and non-interactive operation for CI and agents
- no hidden token, command, config, or implementation fallback
- one source of command/help truth and actionable recovery guidance
- public release safety without retaining obsolete runtime code
- a normal-user-first console that is understandable without package, provider, proof,
  artifact, or mutation knowledge
- strict removal of duplicate, irrelevant, stale, misleading, and machine-oriented
  presentation rather than relocating all available system state into more UI
- contextual help that explains unfamiliar industry concepts in simple English without
  hiding required actions or errors

## Considered Options

1. Keep the current expert command tree and improve documentation.
2. Add simplified wrapper commands and aliases over the existing setup, auth, config,
   and console implementations.
3. Replace the current onboarding surfaces with one core lifecycle, one provider
   connection model, derived readiness, and a separate console application while
   retaining current package ownership.

## Decision

Selected option: `3`.

### One project lifecycle

The canonical ordinary-user journey is:

```text
unisane ops init
  -> unisane add growth
  -> unisane connect google
  -> unisane check
  -> unisane growth <domain operation>
  -> unisane growth console
```

`unisane ops init` may offer Growth during interactive initialization, so a new user
does not need to run `add` separately. `unisane add growth` is the explicit, repeatable
adoption operation for an already initialized project. Both routes materialize the same
project intent and never create separate setup state.

The command's first-line help is:

```text
Set up Unisane Ops in the current project. Does not create a Framework application.
```

It inspects the current project, detects supported runtime and Framework context, selects
an adoption mode and Ops capabilities, and writes only canonical non-secret project
intent. It does not create a new directory, scaffold an application, convert a project
to Framework, authenticate a provider, install production instrumentation, or mutate a
remote account without the later explicit action and required authority.

If a user enters bare `unisane init`, the host fails with simple guidance:

```text
`unisane init` is not a command.
Set up Ops in this project: unisane ops init
Create a Framework application: npx create-unisane <project-name>
```

Core owns `ops init`, root `add` and `connect` dispatch, and aggregate `check`. Bare
`unisane init` is not an alias or supported command. Growth contributes typed capability
intent, checks, next actions, and domain operations through its pack. Provider Google
owns OAuth, grant expansion, discovery, resource selection, token refresh, revocation
detection, and transport. Web Runtime owns application instrumentation.
`@unisane/framework-ops` supplies Framework project context only. The optional
`unisane-ops/apps/console` owns visual presentation; Growth owns its headless view model
and actions.

`unisane provider google ...` remains a narrow expert lane for provider-specific project,
API, grant, and transport diagnostics that cannot be normalized. It is not a second
onboarding path.

### Adoption modes

Initialization must classify, or accept explicitly in non-interactive mode, one of these
project situations:

- `new`: no existing Growth instrumentation or provider resources are claimed
- `adopt-existing`: detect and reconcile existing tags, analytics, search, and ads
  resources before writing desired state
- `audit-only`: produce findings and recommendations without installing runtime code or
  enabling remote mutation
- `migrate`: import a prior Unisane Growth schema through the versioned migration
  command; this is data migration, not a legacy runtime loader

Auto-detection may propose a mode but must not silently claim ownership of live provider
resources.

### One Google connection

The user sees one named Google connection. Internally it may carry separate grants for
Search Console, GA4, GTM, Google Ads, and project/API administration, but those grants
share one provider-owned lifecycle and status model.

`unisane connect google`:

1. reads selected Growth capabilities and the current environment
2. requests only the grants needed for the next usable capability
3. discovers accessible accounts, properties, containers, sites, and Ads customers
4. asks the user to resolve only genuine ambiguity
5. records non-secret resource selections and grant metadata
6. verifies the connection and emits the next action

Later capabilities expand the connection incrementally. A manager account, multiple
properties, partial permissions, revoked token, or unavailable API must become an
explicit state with a recovery action; none may silently select the first resource or
fall back to another credential.

### Readiness is multidimensional

The system must not collapse readiness to one `configured` boolean. `unisane check`
aggregates independently derived dimensions:

| Dimension       | Question answered                                                                            |
| --------------- | -------------------------------------------------------------------------------------------- |
| project         | Is Growth selected and is canonical project intent valid?                                    |
| connection      | Is the provider identity usable with the required current grants?                            |
| resource        | Is each required account/property/container/site/customer selected and accessible?           |
| instrumentation | Is expected runtime/tagging present once, consent-aware, and free of conflicting duplicates? |
| data            | Is evidence absent, warming, fresh, stale, delayed, or permission-blocked?                   |
| business truth  | Are events, conversions, attribution rules, and goals internally consistent?                 |
| decision        | Is a recommendation supported by sufficient evidence and freshness?                          |
| mutation        | Is the operation disabled, plan-ready, approval-required, applied, or drifted?               |

Every failed or incomplete dimension returns: stable code, severity, affected
environment/resource, evidence, one recommended next action, and the exact safe command
or file to use. `doctor` remains installation/runtime diagnostics; it must not become a
second Growth readiness model. Deep domain audits and proof commands may remain, but
their findings feed the aggregate model rather than inventing parallel lifecycle state.

### Configuration, state, and secrets

`unisane.config.ts` is the only project configuration entrypoint. It stores Growth
capability intent, environment mappings, non-secret connection/resource references,
manifest locations, and policy. App-local `config/marketing.*`,
`config/google-tag-manager.*`, and provider-specific root configuration are retired.

Versioned event, conversion, experiment, research, and policy manifests remain valid
domain artifacts. Their configured locations may be project-specific; they do not
become another root configuration owner.

Secrets and refresh/access tokens live only behind the engine `SecretResolver` and
provider-owned connection store. OAuth client bootstrap may use an explicit secret
reference. Raw provider access-token environment variables are not a normal path,
fallback, or debug bypass. CI uses an explicit non-interactive connection/secret-store
adapter with declared grants.

### Console and command truth

`unisane growth console` is the one visual entrypoint. The console reads the same
headless state and invokes the same typed actions as CLI and automation. The embedded
Growth static presentation is deleted when the app console lands; it is not retained as
a fallback server.

The console is a user product, not a rendered control-plane report. Its default
experience answers three questions in order:

1. What is happening?
2. What needs my attention?
3. What is the safest useful action now?

Its primary audience is a marketer, founder, SEO specialist, advertising operator, or
business owner. Developer and support diagnostics remain available, but they never
determine the default navigation, page hierarchy, vocabulary, or information density.
The console must not preserve a parallel expert dashboard or a switch that restores the
retired control-plane presentation.

Internal implementation vocabulary is not primary navigation or headline copy. Terms
such as `proof`, `report family`, `provider pull`, `auth profile`, `identifier`,
`mutation guard`, `receipt`, and stable machine codes remain available under
`Technical details` or Activity when they help an expert diagnose a problem.

The sidebar is grouped and ordered as follows:

- `Overview`
- `Channels`
  - `SEO`
  - `Advertising`
  - `Analytics`
  - `Experiments` only when selected
- `Manage`
  - `Connections`
  - `Activity`
- `Help`, `Settings`, and user context anchored at the bottom

The top of the sidebar contains the Unisane Ops identity and one project/site selector
that shows the current human-readable product/site identity. The full row for each link
is interactive; icons never replace visible labels in the expanded state. Only one
active item is emphasized. Badges are reserved for actionable counts, such as one
connection requiring attention; navigation never displays readiness fractions or a
status badge beside every link.

The existing routes converge as follows:

| Current route   | Target location                                                        |
| --------------- | ---------------------------------------------------------------------- |
| Setup           | guided onboarding plus `Connections`                                   |
| Proof           | affected status/action plus expandable `Technical details`             |
| Performance     | `Overview` and the relevant capability page                            |
| Research        | `SEO > Research`                                                       |
| GTM             | `Analytics > Tracking health` and `Connections > Google > Tag Manager` |
| Recommendations | prioritized actions on `Overview` and each capability page             |
| Receipts        | `Activity > Changes`                                                   |
| Schedule        | `Settings > Automations`                                               |

Capability pages are visible only when selected or useful. Provider-specific navigation
lives under `Connections`; capability pages remain organized around user goals.

Final capability tabs are:

- SEO: `Overview`, `Opportunities`, `Pages`, `Queries`, `Site health`, `Research`
- Advertising: `Overview`, `Campaigns`, `Conversions`, `Recommendations`,
  `Change history`
- Analytics: `Overview`, `Traffic`, `Visitors`, `Conversions`, `Tracking health`
- Experiments when selected: `Overview`, `Running`, `Results`, `Ideas`

SEO `Overview` owns search-performance summary, metrics, trend, top priorities,
gaining/losing-page preview, and freshness. `Opportunities` owns deterministic ranked
work with impact, confidence, effort, evidence, and one action. `Pages` and `Queries`
own their respective sortable/filterable analysis and focused row drill-down. `Site
health` owns grouped indexing, crawling/access, sitemap/canonical, structured-data, and
link/redirect problems. `Research` is the research-led planning workspace and owns the
complete country/language-bound keyword matrix, intent clusters, market comparison,
question/FAQ plan, competitor gaps, and SERP/metadata/page-audit research. Search
Console owns actual clicks, search views, positions, and visibility and may validate a
research opportunity without becoming Research's primary data model. The UI uses
filtering, pagination, summaries, and progressive views to make the complete model
understandable; it must not hide valid research behind a capped sample. It never
presents demand estimates as exact traffic or a suggestion as a ranking promise.

`Connections` presents Google, Meta, Web Runtime, and later admitted
providers/integrations as human-readable provider cards with connection identity,
enabled capabilities, selected resources, independent capability state, last successful
sync, current issue, and one primary action. Google remains one provider connection with
nested Search Console, Analytics, Tag Manager, and Ads services; failure or missing
access for one service must not mark working services disconnected.

Only implemented, selectable providers appear in `Available connections`; roadmap
providers do not appear as disabled, warning, `Coming soon`, or connectable cards.
`Manage connection` opens a full detail page using `Overview`, `Access`, `Resources`,
`Data sync`, and `Activity`. A drawer may explain one issue but cannot own the complete
connection workflow. Incremental capability adoption requests only the next required
access and confirms ambiguous resource selection. Disconnect confirmation explains
which data, reports, automations, and managed changes stop without implying that
provider-side resources are deleted. The current project, environment, and connected
identity remain visible so users cannot accidentally act on the wrong account.

`Activity` presents readable changes, syncs, errors, and approvals; raw operation ids,
receipt ids, payloads, timestamps, and paths are details only. `Settings > Automations`
presents purpose, frequency, timezone, enable/pause, last and next run, `Run now`, and
edit controls rather than job/readiness counts.

Every major page follows one hierarchy and content budget:

1. title plus a one-sentence purpose
2. relevant project/environment/date context
3. one dominant status or next-action callout
4. at most three or four decision-useful metrics, including comparison and freshness
5. one main chart, table, workflow, or connection list
6. at most three prioritized actions
7. secondary evidence and technical details collapsed by default

The right-side inspector is closed by default and opens only after the user selects a
row, card, finding, or help action. It must not duplicate the main page's status and next
actions. Missing or stale data replaces misleading KPI/decision cards with a clear empty
state explaining why the data is unavailable, what remains safe to do, and the one next
step.

User-facing state language is sentence case and limited to understandable states such as
`Connected`, `Needs attention`, `Not connected`, `Syncing`, `Up to date`, `Delayed`,
`No data yet`, and `Action required`. Copy says what happened, why it matters, and what
the user can do. Acronyms are expanded on first use; technical ids, file counts, artifact
counts, and implementation mechanics are not headline content.

Every proposed visible element must answer at least one of these user questions:

1. What happened?
2. Why does it matter?
3. What can I do now?
4. What result did my action produce?

Information does not qualify for primary UI merely because the engine can expose it.
Content is classified and handled once:

- decision-critical information is shown in the primary page
- useful secondary context is available through a focused drawer, popover, or
  `Technical details`
- audit history belongs in `Activity`
- developer diagnostics belong in `Technical details` or structured CLI/API output
- duplicate, irrelevant, misleading, unavailable, or unactionable presentation is
  deleted rather than moved

Primary pages must not display proof/evidence counts, report-family counts, provider-pull
terminology, artifact readiness, raw ids, file paths, receipt/event keys, internal
mutation mechanics, planned providers as warnings, empty charts, unavailable metrics as
zero, repeated warning cards, or every available data row. These values may appear only
where the classification above gives them a real user or diagnostic purpose.

Contextual help has three explicit forms:

- a tooltip gives a short one- or two-sentence explanation for an unfamiliar term,
  calculation, icon, or freshness label
- an information popover may add why the concept matters, one example, and an optional
  relevant `Learn more` link
- required instructions, errors, access problems, and next actions remain inline and
  are never hidden in a tooltip

All help uses simple English, expands an acronym on first use, works with pointer,
keyboard, touch, and screen readers, closes predictably, and never becomes a second
documentation layer inside the page.

Color never carries status alone. Navigation, tabs, drawers, tables, charts, connection
switching, empty/error states, keyboard focus, screen-reader names, 200% zoom, and
responsive reflow require direct accessibility proof. Hidden inspector content must also
leave the accessibility tree and focus order.

Pack manifests and typed command descriptors are the only command catalog. Help,
documentation tables, shell completion, and dispatch derive from that catalog. A stale
built binary, hand-maintained help branch, or hidden source-only command is a release
failure.

### Clean public cutover

This is a coordinated public breaking release:

- ship one major version with migration notes and an explicit config/artifact migrator
- for each bounded slice, delete its replaced command, registrar, auth implementation,
  config loader, token fallback, readiness writer, route, presentation owner, test, or
  document before implementing and repairing consumers against the canonical
  replacement
- require each slice to migrate its first-party projects, examples, tests, docs,
  automation, and generated artifacts and prove zero retired residue before the next
  slice begins
- do not publish deprecated aliases, wrapper commands, dual loaders, shadow state,
  hidden fallbacks, or environment-variable escape paths

The migration tool may read an old schema as input and write the new schema. Normal
runtime loading must reject the retired schema after the cutover. This satisfies public
semver coordination without keeping legacy product code alive.

Deletion is not deferred to final cleanup. A development branch may be temporarily
broken after deleting an owner so compiler/test failures expose every consumer, but it
must never restore a compatibility owner or make the old and new systems runnable
together. Every reviewable checkpoint and merged commit contains only one reachable
owner for replaced behavior. Git history is rollback; the explicit one-shot migrator is
the only old-input reader and is not a normal-runtime loader.

The final release stage aggregates already-passing slice proof, validates the one-shot
migration and retired-schema rejection, regenerates owned references, and prepares the
major release. It does not perform planned legacy deletion.

## Consequences

### Positive

- ordinary onboarding becomes a short lifecycle instead of a command archaeology task
- Framework and plain web projects use the same Growth engine and provider contracts
- users can distinguish missing access, ambiguous resources, broken instrumentation,
  warming data, and unsafe mutation
- provider credentials and scopes become easier to rotate, revoke, and audit
- CLI, console, CI, and agents share one state and action model
- removal proof prevents a permanent hybrid architecture

### Negative And Tradeoffs

- this requires a coordinated major release and first-party migration
- the cutover crosses CLI core, Growth, provider packages, Web Runtime, Framework
  integration, console, docs, and platform examples
- provider consent, account access, domain verification, Ads billing/terms, and mutation
  approval remain unavoidable human/provider steps
- incremental provider grants make the internal connection model richer even though the
  user-facing flow is simpler
- audit-only and adopt-existing modes require strong duplicate-instrumentation evidence
  before automated changes are safe

## Enforcement Updates

P120 workpacks and their convergence contracts must enforce:

1. one project lifecycle for initialization, selection, connection, and aggregate readiness
2. one canonical Growth config contribution in `unisane.config.ts`
3. one provider-owned connection lifecycle per provider
4. no raw access-token fallback/debug path
5. no app-local marketing/GTM root config loader
6. no transitional setup wizard/status/discovery command family
7. no Growth- or GTM-owned Google auth profile implementation
8. no embedded console presentation after the standalone app console is present
9. derived readiness and action-oriented error contracts
10. current command docs updated only when the new commands are executable
11. one built/source manifest and help consistency gate
12. migration fixtures proving old input converts once and is rejected by normal loading
13. plain-project, Framework-project, CI, partial-permission, revoked-token,
    multi-resource, duplicate-tracking, warming-data, and guarded-mutation scenarios
14. repository-wide retired-pattern inventory at zero with no allowlist
15. the simplified navigation and current-route disposition above
16. one Connections hub and one consistent connection-detail hierarchy
17. shared page anatomy, plain-language states, and progressive technical disclosure
18. no default-open or accessibility-visible hidden inspector
19. screenshot-based desktop and responsive flow audits plus keyboard, focus,
    screen-reader, contrast, table, chart, zoom, and reflow verification
20. the grouped sidebar, content budget, and exact current-route disposition above
21. the four-question content-admission test with deletion of duplicate and unactionable
    presentation rather than wholesale relocation into drawers
22. accessible tooltip, popover, inline-guidance, table, chart, and state contracts in
    simple English
23. no parallel expert dashboard, old route shell, or presentation-mode fallback
24. exact SEO tab ownership with no duplicate Search performance/Keywords route
25. one provider-card connection index, full detail page, isolated partial-service
    state, incremental grants, supported-provider-only availability, and explicit
    disconnect-consequence proof
26. delete-first slice ordering with zero retired residue before the next slice begins
27. no reviewable or merged state with both old and replacement behavior reachable
28. aggregate release closure contains validation and packaging only, not deferred
    legacy deletion

## Rollback And Follow-Up

Before publication, rollback means reverting the complete release candidate. After
publication, use a new fixed version or an explicit package rollback with matching
migration guidance. Never restore the old commands, loaders, token fallbacks, or console
as an in-process compatibility path.

The linked plan owns implementation sequencing. The current marketing how-to remains
command truth until the clean cutover is executable and verified; target commands in this
decision must not be presented as currently available before then.
