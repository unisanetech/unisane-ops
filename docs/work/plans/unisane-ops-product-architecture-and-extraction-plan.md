---
id: 'PLAN-77d6e2c49487'
owner: 'unisane'
scope: workspace
role: plan
lifecycle: durable
authority: supporting
provenance: accepted
view: current
status: active
appliesTo:
  - 'ops'
  - 'product'
  - 'architecture'
  - 'extraction'
  - 'plan'
---

# Unisane Ops Product Architecture And Extraction Plan

Turn the reusable cloud, growth, provider, and web capabilities already developed under
Unisane into a coherent product that works both with Unisane Framework and with ordinary
web projects.

## Changelog

- `2026-07-29`: Clarified that P120's coordinated major cut is executed through
  delete-first slice-local replacement, not build-then-clean staging. Each slice reaches
  zero retired residue before the next; aggregate release closure contains proof and
  packaging only.
- `2026-07-29`: Routed future AI-native and hosted delivery to the dedicated P121
  strategy, decision, and MUST finding. The package/engine remains the product kernel;
  action, MCP, AI-host, and managed-host work must layer over it without a second
  engine, config, readiness, provider, approval, or receipt implementation.
- `2026-07-29`: Refined the target CLI grammar so existing-project adoption begins at
  `unisane ops init`, never bare `unisane init`; `create-unisane` remains the only
  Framework application scaffolder.
- `2026-07-29`: Routed Growth onboarding and developer-experience convergence to the
  dedicated P120 plan, decision, MUST finding, and active replacement workpack. P120
  preserves the established package boundaries and requires a major-release clean cut
  with no command/config/auth/token/readiness/console fallback.
- `2026-07-25`: Closed and archived P116-W21 with the Devtools-to-Ops
  source/package/command boundary fully converged and proven. Subsequent work is limited
  to the separately planned durable automation and repository/release cutovers.
- `2026-07-25`: Completed P116-W21 source convergence: provider expert packs now own
  AWS, Google, and Meta presentation; Growth owns GTM; Framework Ops routes UI; the
  canonical host has no Devtools fallback or dependency; and Devtools no longer
  publishes `unisane`. Durable automation and repository/release cutover remain separate.
- `2026-07-25`: Opened P116-W21 for terminal provider/GTM/UI routing and canonical
  fallback/direct-dependency/duplicate-binary retirement.
- `2026-07-25`: Closed and archived P116-W20 after complete Growth command/console
  ownership, canonical pack routing, explicit compatibility aliases, lazy host provider
  bindings, Google discovery transport extraction, acyclic package graph, permanent
  enforcement, generated discovery, and full T2 proof passed. The remaining terminal
  cut is provider expert/UI routing, fallback deletion, and duplicate-binary retirement.
- `2026-07-25`: Opened P116-W20 for terminal Growth command ownership, canonical
  `growth` routing, provider injection, explicit compatibility aliases, and removal of
  generic Growth presentation from Framework Devtools.
- `2026-07-25`: Closed and archived P116-W19 after the optional Framework pack and exact
  canonical routing passed all T2 proof. The next recommended boundary is the Growth
  command pack and canonical capability-first routing; provider/UI terminal routing and
  duplicate-binary retirement remain later cuts.
- `2026-07-25`: Opened P116-W19 to establish the optional `@unisane/framework-ops`
  command pack and route Framework roots through the canonical host. The catch-all
  compatibility fallback and duplicate Devtools binary remain until Growth/provider/UI
  command disposition reaches terminal routes.
- `2026-07-25`: Closed and archived P116-W18 after Provider Meta assumed the admitted
  auth, discovery/inventory, report, asset, and guarded campaign transport lifecycle
  behind Growth-owned contracts and passed all T2 proof. The next recommended boundary
  is canonical CLI-host migration and duplicate Devtools `unisane` binary retirement.
- `2026-07-25`: Opened P116-W18 after Meta passed the required provider and
  package-budget admission on the strength of its implemented auth, discovery,
  inventory, reporting, asset, and guarded campaign-management lifecycle. One Provider
  Meta family now replaces the transitional transport owners; CAPI remains in Web
  Runtime.
- `2026-07-25`: Closed and archived P116-W17 after the injected Provider Google live
  executor, retained Growth safety lifecycle, migrated behavior, permanent boundary,
  generated discovery, workspace type, runtime, dependency, dead-code, and 23/23 LLM
  proof passed. The next boundary is the required Meta provider-admission or retirement
  decision.
- `2026-07-25`: Opened P116-W17 to move the complete Google Ads live mutation executor
  to Provider Google behind the existing Growth safety lifecycle.
- `2026-07-25`: Closed and archived P116-W16 after the injected Growth provider-report
  driver, all Google marketing report transports, migrated composition, generated
  discovery, workspace type, dependency, dead-code, and 23/23 LLM proof passed. Google
  Ads live executor distribution is the next implementation boundary; Meta remains
  separately admission-gated.
- `2026-07-25`: Opened P116-W16 to move Google Ads, GA4, and Search Console report
  transports to `@unisane/provider-google/marketing` behind a Growth-owned injected
  driver contract. Meta remains governed by the separate provider-admission requirement.
- `2026-07-25`: Closed and archived P116-W15 after complete marketing-control-plane
  Growth ownership, consumer migration, public packaging, zero-residue enforcement,
  generated discovery, workspace type, dependency, dead-code, and 23/23 LLM proof
  passed. Provider transport distribution through an injected driver contract is the
  next bounded batch.
- `2026-07-25`: Opened P116-W15 for complete headless marketing-control-plane ownership
  in `@unisane/growth/marketing`; provider transport distribution follows against an
  explicit injected pull contract.
- `2026-07-25`: Closed and archived P116-W14 after the complete SEO research and Google
  measurement ownership split passed migrated behavior, command, zero-residue,
  generated-reference, workspace type, dependency, dead-code, and 23/23 LLM proof. The
  next unopened batch is the remaining marketing control-plane extraction.
- `2026-07-25`: Opened P116-W14 for the complete SEO research and Google measurement
  ownership split, migrating domain behavior to Growth, provider execution to Provider
  Google, and Devtools to command composition.
- `2026-07-25`: Closed and archived P116-W13 after `@unisane/growth`, the complete GTM
  domain/provider ownership split, consumer migration, compatibility boundary, generated
  discovery, permanent enforcement, workspace type, dependency, dead-code, and 23/23 LLM
  proof passed. The next unopened implementation batch is wider Growth measurement and
  SEO extraction; canonical CLI-host migration remains separately bounded.
- `2026-07-25`: Opened P116-W13 for the Growth foundation and complete GTM ownership
  split: provider-neutral domain behavior moves to `@unisane/growth`, Google remote
  execution moves to `@unisane/provider-google`, and the old adapter coordinate becomes
  compatibility-only.
- `2026-07-25`: Closed and archived P116-W12 after the Web Runtime package, consumer
  migration, compatibility coordinates, generated discovery, permanent boundaries,
  focused behavior, architecture, workspace type, dependency, dead-code, and 23/23 LLM
  proof passed. The next unopened implementation batch is Growth/GTM extraction.
- `2026-07-25`: Implemented the P116-W12 Web Runtime ownership boundary:
  `@unisane/web-runtime` now owns all five prior implementation families behind explicit
  environment subpaths, React/Next are optional peers, pure SEO is independent of Next,
  live consumers use the canonical coordinates, legacy packages are compatibility-only,
  and permanent boundary/generated-discovery proof is live. Final T2 closure remains.
- `2026-07-25`: Opened P116-W12 as the complete Web Runtime foundation batch: one
  package owns tracking, conversions, SEO, provider delivery, adapters, and testing;
  first-party consumers move to explicit subpaths while legacy coordinates become
  time-boxed compatibility re-exports.
- `2026-07-25`: Closed and archived P116-W11 after the shared Google connection and
  provider-control foundation passed focused and full T2 proof. The next unopened
  implementation batch is the Web Runtime foundation; Growth/GTM extraction follows
  against its contracts, while Git/repository organization remains outside this
  refactor.
- `2026-07-25`: Implemented P116-W11 source ownership: one Google provider package now
  owns shared OAuth, project/API lifecycle, readiness, and GTM/GA4/Search Console/Ads
  discovery clients; Devtools registration and downstream consumers are compatibility
  only. Growth workflow extraction remains separate.
- `2026-07-25`: Opened P116-W11 as the first Google family batch: establish one shared
  connection/profile and move Google project/API lifecycle plus GTM/GA4/Search
  Console/Ads discovery clients before the separate Growth workflow extraction.
- `2026-07-25`: Closed and archived P116-W10 after the complete AWS provider-family
  extraction passed focused and full T2 proof. The next unopened implementation batch
  is the Google provider family; Git/repository organization remains outside this
  refactor.
- `2026-07-25`: Implemented P116-W10 source ownership: the complete proven AWS
  capability family and SDK dependencies moved to `@unisane/provider-aws`, Cloud
  publishes the shared AWS contract coordinate, and Devtools retains compatibility
  registration only. Generated discovery resolves; final closure remains.
- `2026-07-25`: Opened P116-W10 as one complete AWS provider-family extraction batch:
  move all proven AWS workflows and SDK ownership, publish Cloud AWS contracts, keep
  Devtools compatibility, and add permanent boundary/reference proof.
- `2026-07-25`: Closed and archived P116-W9 after complete Cloudflare resource
  mutation ownership and T2 proof passed. The next unopened implementation batch is the
  AWS provider family; Git/repository organization remains outside this refactor.
- `2026-07-25`: Implemented P116-W9 across immutable Queue/Worker/Cron safety plans,
  guarded apply, script and secret boundaries, approval/lock/replay/receipt/drift,
  canonical capability and expert routes, Devtools compatibility consumers, and
  permanent ownership enforcement. Durable automation remains separate from the local
  developer host.
- `2026-07-25`: Opened P116-W9 to complete the represented Cloudflare capability family
  rather than stopping at read/plan: all Queue/Worker/Cron remote apply, engine safety,
  canonical/expert routing, compatibility consumption, and duplicate apply-owner removal
  move together.
- `2026-07-25`: Closed and archived P116-W8 after the full Cloudflare non-mutating
  resource surface passed focused, boundary, documentation, generated-reference,
  architecture/admission, and full workspace type proof. The next Ops implementation
  slice remains deliberately unopened.
- `2026-07-25`: Implemented active P116-W8 across Cloudflare account/zone/Queue/Worker/
  Cron inventory, offline Queue/Worker/Cron planning, readiness/environment reporting,
  canonical config/runtime/aliases, provider transport, and Devtools compatibility.
  Remote non-DNS mutation remains deferred to the durable engine-safety lane.
- `2026-07-25`: Closed and archived P116-W7 after blocking proof passed for exact
  Cloudflare expert aliases, read-only connection discovery, offline selected-zone
  import, and plain-project adoption. The next Ops implementation slice remains unopened.
- `2026-07-25`: Implemented the P116-W7 Cloudflare adoption slice: the canonical static
  graph now exposes read-only connection checking, offline selected-zone DNS import, and
  capability/expert DNS routes over one workflow, with plain non-Framework proof and no
  secret or config persistence.
- `2026-07-25`: Opened P116-W7 as one batched Cloudflare DNS adoption slice:
  expert-provider aliases over the same workflow, credential readiness and resource
  discovery without secret persistence, offline selected-inventory import, and a plain
  project fixture.
- `2026-07-24`: Archived P116-W6 after the direct Cloud DNS vertical passed blocking
  closure. Routed queued, unopened P116-W7 to capability/expert-provider parity plus
  connect/adopt workflows for the same Cloudflare DNS slice before AWS or durable
  automation expansion.
- `2026-07-24`: P116-W6 implemented the first direct Cloud vertical slice:
  capability-first DNS inventory/offline-plan/guarded-apply, canonical root config and
  runtime composition, lazy Cloudflare binding, and Devtools compatibility consumption.
  Durable automation, expert aliases, wider providers, and repository cutover remain.
- `2026-07-24`: Opened P116-W1 and added the exact package-budget and provider-admission
  record templates required to keep later extraction slices from creating packages or
  provider families by intuition.
- `2026-07-24`: Deferred single-Git staging, history filtering, remote authority, branch governance, and umbrella retirement to the ecosystem repository-separation plan; this plan retains Ops package extraction, behavior parity, and release-readiness ownership.
- `2026-07-24`: Added the canonical productization and extraction strategy for Unisane Ops,
  including product boundaries, repository and package topology, command and extension
  contracts, config and artifact policy, public/private remote operation, migration
  phases, estimates, state-port ownership, trust/collision rules, and closure gates.

## Authority And Current-State Warning

This plan is the execution authority for turning the existing provider, marketing, SEO,
tracking, conversion, and cloud tooling into Unisane Ops.

The authority order is:

1. `docs/standards/13-unisane-ops-product-architecture-baseline.md` owns durable Unisane Ops
   product, package, dependency, config, CLI, and extension rules.
2. `docs/standards/12-provider-control-plane-baseline.md` owns provider-operation safety:
   inventory, plan, approval, apply, receipt, drift, auth, redaction, and risk.
3. `docs/standards/04-ecosystem-architecture.md` owns ecosystem and repository-family
   boundaries.
4. The linked decision freezes the selected product/package/repository model.
5. This plan owns Ops package/capability sequencing, behavior migration, parity, and
   release readiness.
6. `unisane-ecosystem-repository-separation-and-git-governance-plan.md` owns single-Git
   staging, history/provenance, remote authority, visibility, Git governance, and umbrella
   retirement.
7. `docs/guides/command-workflow-contract.md` remains the authority for commands
   that are actually available in the current repository.

Everything under **Target** remains future-state unless the current checkpoint or an
archived workpack proves it. The canonical CLI, pack protocol, root config, Cloud DNS,
Cloudflare connection/inventory/readiness/environment, and Queue/Worker/Cron plan/apply
are available. Resource apply is limited to local, non-production, single-developer
execution until a durable host state adapter lands. Growth, wider providers, durable
automation, and remaining target packages are not proved. Documentation must never
instruct a user to run an unproved command.

P120 owns the target Growth onboarding and developer-experience refactor. Its
`ops init` plus root `add`/`connect`/`check` lifecycle, canonical Growth config
contribution, unified provider connection, derived readiness, and console separation
are not current command truth until the linked workpacks close. P120 must replace and
delete the old public surfaces in one coordinated major-release workstream; this
umbrella plan does not admit wrappers, aliases, dual loaders, or cleanup-later staging.
Inside that workstream, every bounded slice deletes its retired owner/export/route
first, implements and migrates the canonical replacement, deletes related residue, and
passes its zero-residue gate before the next slice. The final release stage aggregates
proof; it does not own deferred legacy deletion.

The dedicated P121 strategy owns future transport-neutral actions, local/remote MCP,
AI-host distribution, managed hosting, team operations, and commercial/enterprise
delivery. P121 consumes the P120 onboarding, connection, readiness, and console results;
it does not widen P120 or make proposed action ids, packages, tools, plugins, APIs, or
hosted behavior current truth. Its workpacks are opened only when bounded implementation
begins.

This plan supersedes older plans only for:

- the Unisane Ops product identity
- package and repository placement
- the canonical CLI and command-group model
- provider-package granularity
- the shared config, extension, artifact, and security contracts
- migration order

Older provider, marketing, GTM, SEO, tracking, conversion, and dashboard plans may still
serve as capability inventories and behavior backlogs until their content is migrated.
They do not override this plan or SSOT 13 on product architecture.

## Vision

Unisane remains the brand. The ecosystem presents four understandable products:

1. **Unisane Framework** builds vertical platforms.
2. **Unisane Ops** observes, connects, plans, and safely manages cloud and growth
   capabilities.
3. **Unisane Web Runtime** supplies reusable tracking, conversion, SEO, and testing
   runtime primitives to any web project.
4. **Unisane UI** supplies the reusable design system.

Unisane Ops contains two user-facing suites:

- **Unisane Ops Cloud** for infrastructure and delivery operations
- **Unisane Ops Growth** for acquisition, measurement, SEO, experimentation, and marketing
  operations

After this formal introduction, this plan uses `Cloud` and `Growth` as shorthand. They are
not separate top-level products.

The result should feel like one product, not a collection of provider scripts. A developer
starts with the capability they need, uses one CLI and one config, and reaches a provider
specific lane only when the provider genuinely exposes a non-portable lifecycle.

## Success Criteria

The program is complete when:

1. one published `unisane` package owns the `unisane` binary
2. the CLI starts without loading Framework compiler code or any provider SDK
3. Cloud and Growth commands use one headless plan/apply/receipt/drift engine
4. provider SDKs live only in provider-family packages and load only when selected
5. Cloud, Growth, and Web Runtime work in a non-Unisane website repository
6. Unisane Framework integrates through `@unisane/framework-ops`, without making
   Framework runtime code depend on the CLI or Ops engine
7. `unisane.config.ts` is the only project-level Unisane config authority
8. the static, versioned pack contract is independent of Commander
9. web tracking, conversions, and SEO converge behind one `@unisane/web-runtime`
   package with deliberate subpath exports
10. existing supported behavior has characterization and parity proof before old paths
    are deleted
11. public migrations follow semver and ship with migration notes
12. no internal compatibility path or duplicate command owner remains after its
    replacement workpack closes

## Non-Goals

This program does not:

- turn every source folder into a package
- create one repository or package per provider service
- replace provider consoles where billing, terms, app review, consent, or policy appeals
  are human-only
- make provider-specific concepts falsely portable
- move Framework compilation, code generation, module wiring, or architecture governance
  into the Ops engine
- make application runtime code depend on a CLI, Commander, or provider-management SDK
- make the local filesystem or `.unisane/**` a second remote-state authority
- publish a full Meta management provider before it passes the provider admission test
- preserve old internal paths indefinitely for compatibility
- combine Unisane Framework, Unisane Ops, Unisane Web Runtime, and Unisane UI into one
  package or one release lifecycle

## Developer Jobs And Real Use Cases

The package model exists to support these jobs:

| Job                           | Example                                                                                                           | Primary owner             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Understand a project          | identify configured capabilities, connections, readiness, and drift                                               | `unisane` + Ops engine    |
| Adopt existing infrastructure | inventory an existing domain/CDN/bucket, import intent, then manage it                                            | Cloud + provider package  |
| Safely create infrastructure  | plan DNS, delivery, storage, certificate, queue, or schedule changes                                              | Cloud + provider package  |
| Establish measurement         | configure consent-aware tracking and validate event coverage                                                      | Growth + Web Runtime      |
| Send server conversions       | deliver deduplicated Google Ads or Meta CAPI events                                                               | Web Runtime               |
| Operate GTM and analytics     | inspect, plan, publish, report, and roll back through one Google connection                                       | Growth + Google provider  |
| Improve discoverability       | audit technical SEO, research opportunities, generate briefs, and measure outcomes                                | Growth + Web Runtime      |
| Operate paid acquisition      | inspect accounts, draft changes, assess spend impact, apply with approval, and report                             | Growth + provider package |
| Add Framework context         | derive project targets and environments from Framework config without coupling generic Ops to Framework internals | Framework Ops integration |
| Automate in CI or an agent    | consume stable JSON, exit codes, artifacts, and explicit effect classifications                                   | CLI + Ops engine          |

The common workflow is:

```text
project intent
  -> connection
  -> normalized inventory
  -> audit or plan
  -> policy and approval
  -> apply or publish
  -> receipt
  -> drift and outcome report
```

## Canonical Terminology

Generic Ops code uses these terms:

| Term          | Meaning                                                               |
| ------------- | --------------------------------------------------------------------- |
| `project`     | the local software project being operated                             |
| `target`      | one managed remote or deployment unit                                 |
| `environment` | a named operating context such as development, staging, or production |
| `connection`  | credentials and identity metadata used to access a provider           |
| `provider`    | a remote vendor family such as AWS, Cloudflare, or Google             |
| `connector`   | a bounded protocol or API binding within a provider or integration    |
| `integration` | a product-level relationship with another system                      |
| `capability`  | the developer outcome being requested                                 |
| `policy`      | rules that constrain observation, mutation, approval, risk, and spend |

Generic Ops code must not assume Framework concepts such as modules, starters, containers,
or platform scopes. Unisane Framework keeps `scopeId` as its canonical tenant identifier.
`@unisane/framework-ops` maps Framework project and `scopeId` context into generic Ops
`project`, `target`, and `environment` inputs at the integration boundary.

Use **provider** for the vendor family and **connection** for credentials. Do not use
provider names as capability names when a capability-first term is accurate.

## Target Ecosystem And Repository Boundaries

The target ecosystem repository model is:

```text
Unisane Git organization/
├── unisane/                         # Unisane Framework; public
│   ├── packages/
│   │   ├── foundation/
│   │   ├── modules/
│   │   └── adapters/
│   ├── starters/
│   └── tooling/
│       ├── devtools/                # Framework compiler/codegen/governance only
│       └── create-unisane/
├── unisane-pro/                     # reusable commercial Framework extensions; private
│   ├── packages/
│   ├── examples/
│   └── docs/
├── unisane-ops/                     # Unisane Ops + Web Runtime; public monorepo
│   ├── packages/
│   │   ├── unisane/                 # canonical CLI and binary
│   │   ├── ops-engine/              # headless orchestration and policy engine
│   │   ├── cloud/                   # Cloud capability suite
│   │   ├── growth/                  # Growth capability suite
│   │   ├── web-runtime/             # application runtime subpaths
│   │   ├── provider-aws/            # AWS family
│   │   ├── provider-cloudflare/     # Cloudflare family
│   │   ├── provider-google/         # Google family
│   │   └── framework-ops/           # Framework integration pack
│   ├── apps/
│   │   └── console/                 # optional thin Ops/Growth presentation app
│   ├── tests/
│   │   ├── contracts/               # engine, manifest, JSON, effect contracts
│   │   ├── fixtures/                # redacted provider fixtures
│   │   └── integration/             # provider and cross-package proof
│   ├── examples/
│   │   ├── plain-next/
│   │   ├── plain-node/
│   │   └── unisane-framework/
│   └── docs/
├── unisane-ui/                      # Unisane UI; public
├── unisane-platforms/               # product implementations; private
└── unisane-site/                    # brand/marketing/docs gateway; public, noncanonical
```

This is a repository destination, not authorization for an immediate filesystem move.
Before remote cutover, destination packages are created only under the top-level
`unisane-ops/**` subtree inside the current single Git repository. It is an ordinary
workspace subtree, never a nested Git repository. Git history preservation, repository
creation, remote visibility, CI, provenance, and publishing happen only in their admitted
phases.

Maintained examples move beside their owning Framework, Pro, Ops, UI, or Site owner; the
standalone `unisane-examples/` family is retired. The current `unisane-landing/`
deployable becomes `unisane-site/` and must not own product architecture or package
documentation.

One monorepo owns Ops because its CLI, engine, suites, provider protocol, and contract
tests change together. Packages still publish independently. A provider, suite, or runtime
earns a separate repository only after it has genuinely independent governance, security,
release cadence, or contributors that the monorepo cannot serve.

## Target Package Tree And Roles

```text
unisane-ops/packages/
├── unisane/
│   ├── bin/
│   ├── core.manifest.json
│   └── src/
│       ├── cli/
│       ├── output/
│       ├── config/
│       ├── runtime-adapters/
│       └── packs/
├── ops-engine/
│   └── src/
│       ├── command/
│       ├── effects/
│       ├── inventory/
│       ├── planning/
│       ├── policy/
│       ├── receipts/
│       ├── drift/
│       ├── artifacts/
│       ├── manifests/
│       ├── ports/
│       │   ├── secrets/
│       │   ├── artifacts/
│       │   ├── approvals/
│       │   └── locks/
│       └── testing/
├── cloud/
│   ├── pack.manifest.json
│   └── src/
│       ├── contracts/
│       ├── capabilities/
│       ├── policies/
│       ├── reports/
│       └── handlers/
├── growth/
│   ├── pack.manifest.json
│   └── src/
│       ├── contracts/
│       ├── seo/
│       ├── analytics/
│       ├── ads/
│       ├── tag-management/
│       ├── experiments/
│       ├── recommendations/
│       ├── reports/
│       └── handlers/
├── web-runtime/
│   └── src/
│       ├── contracts/
│       ├── tracking/
│       ├── conversions/
│       ├── seo/
│       └── testing/
├── provider-aws/
│   ├── pack.manifest.json
│   └── src/
│       ├── connection/
│       ├── s3/
│       ├── cloudfront/
│       ├── route53/
│       ├── acm/
│       ├── ses/
│       ├── sns/
│       └── handlers/
├── provider-cloudflare/
│   ├── pack.manifest.json
│   └── src/
│       ├── connection/
│       ├── dns/
│       ├── workers/
│       ├── queues/
│       ├── cron/
│       ├── delivery/
│       └── handlers/
├── provider-google/
│   ├── pack.manifest.json
│   └── src/
│       ├── connection/
│       ├── gtm/
│       ├── ga4/
│       ├── search-console/
│       ├── ads/
│       └── handlers/
└── framework-ops/
    ├── pack.manifest.json
    └── src/
        ├── config/
        ├── project-context/
        ├── target-resolution/
        ├── handlers/
        └── testing/
```

### Public user-facing packages

| Package                | Promise                                                                           |
| ---------------------- | --------------------------------------------------------------------------------- |
| `unisane`              | one installable CLI, config loader, output contract, and explicit pack loader     |
| `@unisane/cloud`       | capability-first cloud operations and policy                                      |
| `@unisane/growth`      | capability-first growth operations, analysis, and reporting                       |
| `@unisane/web-runtime` | framework-neutral application runtime for tracking, conversions, SEO, and testing |

### Technical packages

| Package                        | Promise                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `@unisane/ops-engine`          | headless command, effect, planning, policy, artifact, receipt, and drift contracts                |
| `@unisane/provider-aws`        | AWS connection and AWS service implementations                                                    |
| `@unisane/provider-cloudflare` | Cloudflare connection and Cloudflare service implementations                                      |
| `@unisane/provider-google`     | one Google connection and Google product implementations                                          |
| `@unisane/provider-meta`       | one Meta connection and Meta management implementations                                           |
| `@unisane/framework-ops`       | the only integration layer allowed to translate Framework project context into generic Ops inputs |

### Source visibility and registry publication

| Surface                                                                                                                              | Source visibility         | Registry/deployment                                | Primary audience                       |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | -------------------------------------------------- | -------------------------------------- |
| `unisane`, `@unisane/cloud`, `@unisane/growth`, `@unisane/web-runtime`                                                               | public                    | public package registry                            | application and operations developers  |
| `@unisane/ops-engine`, `@unisane/provider-aws`, `@unisane/provider-cloudflare`, `@unisane/provider-google`, `@unisane/provider-meta` | public                    | public package registry                            | pack/provider authors and advanced use |
| `@unisane/framework-ops`                                                                                                             | public                    | public package registry                            | Unisane Framework projects             |
| `unisane-ops/apps/console`                                                                                                           | public                    | deployable app; not an implicit runtime dependency | operators choosing the visual surface  |
| tracked internal helpers and redacted fixtures                                                                                       | public repo source        | not separately registry-published                  | maintainers and package tests          |
| restricted fixtures, release credentials, customer/provider evidence, and production state                                           | excluded/ignored/external | never published in public Git or packages          | access-controlled maintainers/CI only  |

Technical does not mean private. It describes audience and dependency role. Every
cross-repository package edge resolves through a published semver or explicit prerelease;
workspace-only helper packages cannot become hidden cross-repository dependencies.
The external Framework prerequisite `@unisane/devtools` is likewise a public technical
registry package; only its supported `@unisane/devtools/framework-integration` subpath is
the cross-product contract used by `@unisane/framework-ops`.

## Package Budget And Split Tests

A folder becomes a package only when it passes at least one strong test and does not fail
the coupling test.

Strong tests:

1. it has an independently useful public import or install surface
2. it isolates heavy or sensitive optional dependencies
3. it implements a versioned extension boundary
4. it has a genuinely independent runtime or release lifecycle
5. it provides a security, licensing, or deployment boundary

Coupling test:

- if two proposed packages must release together for ordinary changes, share one
  connection lifecycle, or expose mostly internal cross-imports, keep them together

Before adding another package, record:

- owner
- consumer
- public surface
- dependency benefit
- release benefit
- security benefit
- why a folder or subpath export is insufficient

Default choices:

- a capability family is a folder inside Cloud or Growth
- a runtime specialization is a Web Runtime subpath
- a service is a folder inside its provider-family package
- a new provider is one package only after provider admission
- examples, schemas, fixtures, and internal utilities do not become packages

### Package-budget admission record

Every proposed package not already approved in the target package table must add this
record to its admitting decision or workpack before source is created:

| Field                        | Required evidence                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| proposed package and owner   | exact registry name, source owner, and long-term maintainer                          |
| consumers                    | at least one named consumer and why an internal folder/subpath is insufficient       |
| public surface               | intended exports, runtime environment, peers, and excluded internals                 |
| dependency isolation         | heavy/sensitive dependencies removed from which consumers                            |
| release independence         | changes that can ship independently; ordinary lockstep release fails admission       |
| security/licensing boundary  | concrete boundary gained, or `none`                                                  |
| package-content proof        | files/export map/types/side-effect policy and clean-install test                     |
| rejected simpler alternative | why a folder, subpath, existing suite/provider package, or internal helper is weaker |
| removal/merge condition      | evidence that would later merge or retire the package                                |

Admission fails when the proposal cites only file count, conceptual symmetry, future
possibility, or naming preference.

### Provider admission record

Every provider family not already approved in the target provider table must add this
record to a decision before a provider package or public provider command is created:

| Field                          | Required evidence                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| provider family and connection | one connection/auth lifecycle, identity model, permissions, and secret-store behavior |
| admitted capabilities          | exact inventory/plan/apply/publish/report capabilities and their suite contracts      |
| operational lifecycle          | Observe/Connect/Adopt/Manage coverage and explicit console-only gaps                  |
| effect and risk model          | maximum effects, write targets, spend/production/security/destructive guards          |
| state and concurrency          | artifact, approval, lock, freshness, receipt, replay, and drift behavior              |
| SDK/dependency isolation       | exact optional SDKs and proof they load only for selected handlers                    |
| fixtures and provider access   | redacted fixtures, test account/evidence owner, rate-limit and retry proof            |
| independent consumers          | named consumers beyond one private implementation                                     |
| package-budget result          | completed package-budget admission record                                             |
| terminal legacy disposition    | old command/config/artifact owners to migrate or retire                               |

Provider admission fails when the implementation is only a runtime delivery connector,
has no provider-management lifecycle, or cannot be tested without production customer
data. Meta CAPI remains a Web Runtime connector; the separately admitted
`@unisane/provider-meta` package is justified by the management lifecycle recorded in
`D-20260725-unisane-meta-provider-admission-contract`.

## Dependency Rules

The target import direction is:

```text
unisane CLI
  -> Ops engine contracts
  -> explicitly configured suite and integration pack manifests

Cloud / Growth
  -> Ops engine contracts
  -> expose schema-only domain contract subpaths

Growth
  -> @unisane/web-runtime/contracts only

provider-aws / provider-cloudflare / provider-google
  -> Ops engine contracts
  -> exact Cloud/Growth /contracts subpaths implemented by that provider
  -> their own provider SDKs

framework-ops
  -> Ops engine contracts
  -> exact public Unisane Framework authoring contracts
  -> @unisane/devtools/framework-integration

web-runtime
  -> no CLI, Ops engine, suite, provider-management, or Framework runtime dependency
```

Hard rules:

1. `unisane` has no provider SDK dependency.
2. `@unisane/ops-engine` has no Commander, provider SDK, Framework runtime, React, or Next
   dependency.
3. Cloud and Growth depend on provider-neutral engine contracts, not provider SDKs, and
   own normalized domain types, schemas, tokens, and adapter interfaces under
   `@unisane/cloud/contracts` and `@unisane/growth/contracts`.
4. Provider packages may import only the exact suite `/contracts` subpaths they implement.
   They do not import suite roots, orchestration, policy, reports, UI, one another, or
   Framework packages. Suites never import provider packages; pack composition supplies
   the binding.
5. Provider packages load only after explicit pack/provider selection.
6. `@unisane/framework-ops` may use only exact public Framework authoring contracts and the
   narrow headless `@unisane/devtools/framework-integration` subpath. It must not import
   the Devtools root, CLI parser state, private compiler modules, or runtime internals.
7. `@unisane/devtools` remains the Framework compiler, codegen, starter, LLM, and
   governance owner; generic Ops behavior must leave it.
8. Framework runtime packages, modules, adapters, starters, and deployables do not import
   `unisane`, `@unisane/ops-engine`, Cloud, or Growth at runtime.
9. Web Runtime can expose optional React and Next peer integration subpaths without
   making those frameworks required for core consumers.
10. Growth may import only `@unisane/web-runtime/contracts` for runtime-neutral event,
    consent, measurement, and evidence schemas; it must not import runtime adapters or
    conversion implementations.
11. Cross-package types that form the generic pack protocol live in Ops engine; domain
    capability types live in the owning suite contract subpath. Commander objects never
    cross a package boundary.

## Build, Bundle, And Publish Contract

1. Every public package has an explicit export map, generated type declarations, and a
   package-content allowlist. Consumers do not deep-import `src/**` or private `dist/**`
   paths.
2. The CLI bundles only its presentation/runtime bootstrap. Suite packs, integrations,
   and providers remain exact lazy package imports.
3. Provider SDKs are declared only by their provider-family owner and must not be copied
   into CLI, engine, Cloud, or Growth bundles.
4. Cloud and Growth expose small static manifest entrypoints so listing help/status does
   not load their full implementation graph.
5. Web Runtime keeps browser, server, React, and Next entrypoints separate. A browser
   export must not pull Node-only code, secrets, or provider-management SDKs.
6. The Web Runtime package root exports only environment-neutral contracts/helpers, or
   intentionally no runtime barrel. It never re-exports browser, server, React, Next, and
   provider conversion implementations together.
7. `sideEffects: false` or equivalent tree-shaking claims are allowed only after
   side-effect tests prove the relevant entrypoints. Import-time auth, env validation,
   network access, provider selection, and registration remain forbidden.
8. Package semver, pack API version, and config/artifact schema versions are released and
   tested independently.
9. Every release passes packed-tarball inspection and clean-install tests from outside
   the monorepo; workspace resolution is not publication proof.
10. Source maps, notices/licenses, README, and migration notes ship where required, while
    fixtures, credentials, caches, local artifacts, and internal program docs do not enter
    package tarballs.

## Capability Ownership

### Unisane Ops Cloud

Cloud owns provider-neutral infrastructure outcomes:

- connection and readiness summaries
- domain, DNS, certificate, and delivery posture
- object storage and CDN posture
- transactional email and notification infrastructure posture
- queue, scheduler, worker, and edge deployment posture
- normalized inventory, audit, plan, drift, cost/risk context, and operations reports

Cloud does not own provider authentication implementations, provider SDK calls, generic
engine policy, application runtime libraries, or Framework compilation.

### Unisane Ops Growth

Growth owns operating workflows:

- SEO research, technical audit, opportunity planning, briefs, and performance feedback
- analytics and conversion measurement readiness
- GTM workspace lifecycle
- ads research, planning, audit, optimization, and guarded account operations
- experiment decisions and outcome analysis
- cross-channel reports, evidence-backed recommendations, and next actions
- headless query/view state consumed by an optional presentation surface

Growth does not own browser/server tracking primitives or provider SDK plumbing. It
consumes only `@unisane/web-runtime/contracts` for runtime-neutral application
instrumentation schemas and owns the normalized Growth `/contracts` surface. Remote
operations are supplied by provider implementations of those Growth-owned contracts
through explicit pack composition; Growth never imports provider contracts or packages.

The optional visual surface is `unisane-ops/apps/console`, a deployable app that consumes
public headless Growth/Ops contracts and `@unisane/ui`. It is not exported from
`@unisane/growth`, and the CLI, engine, Growth package root, and provider packages must not
depend on its UI graph. Current `marketing-console/**` code is split accordingly: reusable
headless state moves to Growth; presentation moves to the console app or is retired.

### Unisane Web Runtime

Web Runtime owns code that executes in or beside an application:

```text
@unisane/web-runtime
@unisane/web-runtime/tracking
@unisane/web-runtime/tracking/react
@unisane/web-runtime/tracking/next
@unisane/web-runtime/contracts
@unisane/web-runtime/conversions
@unisane/web-runtime/conversions/google-ads
@unisane/web-runtime/conversions/meta
@unisane/web-runtime/seo
@unisane/web-runtime/seo/next
@unisane/web-runtime/testing
```

It owns:

- consent-aware event capture
- attribution, event identity, normalization, and deduplication
- React and Next adapters
- server conversion envelopes and delivery clients
- Google Ads conversion delivery
- Meta Conversions API delivery
- canonical URL, metadata, robots, sitemap, and structured-data helpers
- deterministic test clients and recorders

It must work without the CLI, Ops engine, Cloud, Growth, or Unisane Framework.

Web Runtime SEO is a pure runtime/rendering surface. Persistent slug history, redirect and
alias ownership, canonical public identity, publication state, dynamic URL records, and
the future `@unisane/public-urls` capability remain Framework-owned and must not move into
`@unisane/web-runtime/seo`.

### Framework runtime and business packages that do not move

Shared vendor words do not imply shared ownership. Framework runtime/business packages
such as `@unisane/storage`, `@unisane/storage-s3`, `@unisane/email-ses`,
`@unisane/queue-cloudflare`, `@unisane/scheduler-cloudflare`, and Framework
`@unisane/analytics` remain in Unisane Framework. They implement application/runtime
ports or business capabilities. Ops provider packages administer remote resources and
accounts; they do not absorb Framework modules or runtime adapters.

An extraction workpack must classify each same-vendor surface as runtime consumption,
remote administration, or a deliberately shared provider-neutral contract before moving
it. Moving an Ops command must not move the Framework package it happens to operate.

## Provider-Family Ownership

Provider packages split by provider family, not by service.

### `@unisane/provider-aws`

Initial family contents:

- shared credentials/profile resolution and account identity
- S3
- CloudFront
- Route 53
- ACM
- SES
- SNS

### `@unisane/provider-cloudflare`

Initial family contents:

- shared token/profile and account/zone resolution
- DNS
- Workers
- Queues
- Cron
- delivery and routing

Deferred candidate lanes remain inside the same provider-family boundary: R2, KV,
Turnstile, and broader Cloudflare security posture. They are not promised initial
capabilities and enter a workpack only after capability admission, contract ownership,
provider-access, and safety evidence. They do not justify separate packages.

### `@unisane/provider-google`

Initial family contents:

- one Google auth connection/profile
- GTM
- GA4
- Search Console
- Google Ads

One family package is correct because services share credentials, account discovery,
transport, retry, rate-limit handling, redaction, test fixtures, and release ownership.
Splitting every service would make users coordinate packages without isolating a real
lifecycle. Service implementations remain lazy subpaths/folders so unused SDKs and code
are not loaded.

A service may split later only when it has independent consumers and release/security
needs, its shared connection contract is stable, and measurements show the family package
is an operational problem. File count alone is not a split reason.

### `@unisane/provider-meta`

The initial topology deferred Provider Meta until a complete management lifecycle was
proven. The separate admission decision now establishes one provider family containing:

- saved access-token profiles, secret-store behavior, scopes, and expiry
- ad-account, pixel, business, Page, and Instagram discovery/inventory
- Ads report and creative inventory transport
- image/video asset upload
- guarded campaign pause and paused campaign/ad-set/creative/ad creation

Growth retains provider-neutral strategy, normalized state, plans, confirmations,
approvals, locks, blockers, and receipts. Meta CAPI remains the distinct application
runtime connector at `@unisane/web-runtime/conversions/meta` and does not depend on
Provider Meta.

## One Config Contract

The only project-level Unisane config filename is:

```text
unisane.config.ts
```

Target standalone Ops projects use the generic default export:

```ts
export default defineUnisaneProject({
  project: { id: 'example-site' },
  environments: {},
  ops: {},
});
```

Target Unisane Framework projects preserve the Framework-owned default export and expose
Ops through the exact named export `ops`:

```ts
export const ops = defineUnisaneOps({
  project: { id: 'example-platform' },
  environments: {},
});

export default defineConfig({
  // Existing Framework root config.
});
```

The function names above describe the target authoring contract and are not current API
claims. The owning implementation workpack must settle their exact import coordinates,
schemas, and package exports before documenting them as runnable.

Rules:

1. the loader accepts the default generic project export, or the exact named `ops` export
   when the default belongs to Framework
2. it does not guess among `awsOpsConfig`, `cloudflareOpsConfig`, marketing config, or
   other provider-specific root exports
3. provider connections, targets, environments, capabilities, and policy are declared
   once
4. secret values are references to environment/secret-store keys, never inline values
5. Framework `scopeId` is translated only by Framework Ops; it is not added to generic
   config vocabulary
6. config and builders are declarative and data-first: loading `unisane.config.ts` for
   `check` performs no top-level environment validation/throw, credential resolution,
   authentication, network access, provider SDK construction, or mutation
7. temporary provider-specific config files remain supported only through a documented,
   versioned public migration window and are removed from internal execution paths at
   cutover
8. `unisane.config.ts` is trusted executable project code, not a sandboxed data format;
   the side-effect rules prevent accidental behavior but are not a malicious-code
   security boundary
9. privileged CI must not evaluate config from an untrusted pull request/fork while
   secrets, provider credentials, writable tokens, or unrestricted network authority are
   available; run untrusted validation in a credential-free isolated job or validate a
   reviewed/default-branch artifact

## One CLI And Target Command Grammar

The package `unisane` is the sole owner of the `unisane` binary.

Top-level target grammar:

```text
unisane ops init
unisane add <item-type> <id-or-package>
unisane remove <item-type> <id-or-package>
unisane connect <provider-or-integration>
unisane check
unisane doctor
unisane status
unisane inspect <subject>

unisane cloud <capability> <verb>
unisane growth <capability> <verb>
unisane provider <provider> <capability> <verb>
unisane sync|dev|build                         # Framework pack selected
unisane generate|llm|app <framework-command>  # Framework pack selected
```

Namespace and dispatcher ownership is deterministic:

| Owner                    | Command contribution                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| CLI core                 | `ops init`; root `add`, `remove`, `connect`, `check`, `doctor`, `status`, and `inspect` dispatch; reserved root-name registry     |
| Cloud pack               | `cloud` namespace plus its capability/verb paths                                                                                  |
| Growth pack              | `growth` namespace plus its capability/verb paths                                                                                 |
| selected provider pack   | its exact `provider <provider>` expert namespace                                                                                  |
| `@unisane/framework-ops` | reserved root `sync`, `dev`, `build`, `generate`, and `llm`; `app` namespace; Framework `add`/`remove` item types and diagnostics |

CLI core is itself described by built-in `core.manifest.json` under the same manifest
schema. Its root handlers declare command ids, `maximumEffect`, `writeTargets`, artifact
classes, JSON/exit behavior, and exact handler exports. A delegated command such as
`connect` merges the core dispatcher descriptor with the selected provider/integration
descriptor: the effective maximum effect is the stricter value and write targets are the
union. Delegation cannot reduce either declaration.

Core `add` is a dispatcher, not a claim over every item. Built-in Ops item types include
`pack` and `capability`; the Framework pack may register `module`, `feature`, `adapter`,
`plugin`, and other Framework item types owned by Framework docs. Duplicate root names,
command paths, stable command ids, `add` item types, config namespaces, or capability
bindings fail before help or execution is assembled.

Core reserves the Framework root names so another pack cannot claim them. A generic Ops
project without `@unisane/framework-ops` reports those commands as unavailable rather than
inventing a handler. With the Framework pack selected, `unisane sync|dev|build|doctor`
remains the public Framework lifecycle spine; Framework/app workspace profiles and
profile-scoped `generate`, `inspect`, `add/remove`, and `llm` behavior remain governed by
their active Framework decisions. `doctor` and `inspect` aggregate core plus selected pack
contributions instead of letting one pack replace the root.

`create-unisane` scaffolds a new Unisane Framework application. `unisane ops init`
adopts or configures Unisane Ops in an existing project and must not duplicate Framework
creation. Bare `unisane init` is rejected rather than retained as an alias. When the
Framework pack is selected, `unisane app compile --write|--check` remains the canonical
compiler lifecycle command.

The primary UX is capability-first:

```text
unisane cloud domains audit
unisane cloud delivery plan
unisane growth seo report
unisane growth tag-management publish
```

The provider lane is an expert escape hatch for provider-only concepts:

```text
unisane provider aws cloudfront inventory
unisane provider cloudflare workers plan
unisane provider google gtm rollback
```

Do not duplicate the same normalized capability under both lanes without one shared
command implementation and a documented reason for both routes.

### Exact verb meanings

| Verb        | Contract                                                                                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `init`      | adopt/configure Ops in the current existing project by creating local config and selected pack scaffolding; no remote mutation                                                |
| `add`       | add a declared pack/capability and its local config/dependencies; no implicit provider connection or remote mutation                                                          |
| `remove`    | remove a declared item through its owning dispatcher with dependency/impact preview; no implicit remote resource deletion                                                     |
| `connect`   | establish or select a credential/profile connection; remote OAuth consent and secret-store persistence are explicit security-sensitive writes, not business-resource creation |
| `check`     | deterministic offline validation suitable for CI                                                                                                                              |
| `doctor`    | diagnose local and, when explicitly connected, authorized remote readiness; never mutates remote resources                                                                    |
| `status`    | summarize configured capabilities, connection readiness, artifact freshness, blockers, and drift                                                                              |
| `inventory` | read remote state and write a normalized observation artifact; never changes desired or remote state                                                                          |
| `import`    | turn selected observed remote state into a reviewable local desired-state proposal; never mutates the provider                                                                |
| `audit`     | compare evidence, desired state, and policy and report findings; never mutates the provider                                                                                   |
| `plan`      | produce a deterministic, hash-addressed proposed change set from desired and observed state; never mutates the provider                                                       |
| `apply`     | execute an approved plan after freshness, identity, risk, and confirmation checks and write a receipt                                                                         |
| `report`    | aggregate evidence and outcomes into a read-only explanation; it is not a plan or mutation                                                                                    |
| `recommend` | rank evidence-backed next actions with assumptions and expected outcomes; it never performs the action                                                                        |
| `publish`   | promote already prepared provider state to a live audience; it is separate from apply and requires publish-specific policy and receipt                                        |
| `rollback`  | prepare an explicit inverse plan from a known receipt/version; execution occurs only through normal approved `apply` and never erases history                                 |
| `receipt`   | inspect or verify immutable evidence for a prior action; it never repeats that action                                                                                         |

Aliases must not weaken these meanings.

### Effect classes

Every command declares exactly one `maximumEffect` in its manifest, and every execution
records an `actualEffect` that cannot exceed it:

| Effect         | Meaning                                                                                  | Default policy                                                      |
| -------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `offline`      | uses no remote API and mutates no authoritative project, secret-store, or provider state | may emit declared non-authoritative deterministic artifacts         |
| `read-network` | reads remote provider state without mutation                                             | requires an explicit connection; may persist observation proof      |
| `write`        | changes authoritative project, secret-store, or remote provider state                    | requires authorization appropriate to every declared target         |
| `spend-impact` | may create, raise, accelerate, or materially alter billable spend                        | requires a plan, amount/budget context, and exact explicit approval |

Manifests also declare `writeTargets` as a set drawn from `project`, `secret-store`, and
`remote`, plus every supporting artifact class they may emit. Writing inventory, logs,
caches, plans, reports, or receipts does not raise the primary effect because those are
non-authoritative lifecycle artifacts. Policy evaluates `maximumEffect` before execution;
the receipt records `actualEffect`, which may be lower but never higher.

Project writes require a preview/diff and explicit invocation or bounded policy.
Secret-store writes require a selected writable adapter and explicit consent. Remote
business-resource writes require a fresh plan, approval, lock, and receipt. `connect`
declares `remote` and `secret-store` when it creates an OAuth grant and persists it; that
security-sensitive flow uses exact identity/scope preview, provider consent, and a
connection receipt rather than a business-resource plan.

### JSON and exit contract

Every command supports human output and, when applicable, `--json`. JSON mode:

- emits one JSON document to stdout
- sends diagnostics/logging to stderr
- never prompts; missing approval returns an explicit status
- redacts secrets and token-adjacent values
- includes `schemaVersion`, `command`, `pack`, `maximumEffect`, `actualEffect`,
  effective `writeTargets`, applied risk guards, `status`, `result`, `diagnostics`,
  `artifacts`, and `nextActions`

`actualEffect` records the highest effect actually reached, even when the final status is
`blocked`, `invalid`, `approval-required`, or a dry run. For example, a command blocked
before remote access is `offline`, while a plan that read inventory but did not mutate is
`read-network`; it is never inferred from the requested verb or final status.

Stable target exit codes:

| Code | Status              | Meaning                                                                                     |
| ---- | ------------------- | ------------------------------------------------------------------------------------------- |
| `0`  | `ok`                | command completed and its requested policy/check condition passed                           |
| `1`  | `failed`            | provider, transport, execution, or unexpected internal failure                              |
| `2`  | `invalid`           | invalid invocation, config, schema, manifest, or unsupported combination                    |
| `3`  | `attention`         | read/check completed but found drift or action-required findings                            |
| `4`  | `blocked`           | authentication, consent, provider UI, permission, or prerequisite blocks progress           |
| `5`  | `approval-required` | a mutation was intentionally not executed because required approval/confirmation was absent |

An implementation slice may not publish target automation commands until contract tests
prove the envelope and exit status in human and JSON modes.

## Static Pack Manifest Contract

The CLI uses one versioned `PackManifest` protocol owned by `@unisane/ops-engine`.
The manifest is a schema-validated JSON resource exposed at an exact package export.
Reading it must not import or execute the package's JavaScript/ESM handler. It declares:

- `id`
- package name and package version
- manifest schema version
- integrity/provenance identity required by the configured trust policy
- supported `packApiVersion`
- config and artifact schema versions
- command groups, exact paths, stable command ids, and contributed `add` item types
- config namespaces and schema keys
- capabilities and provider requirements
- maximum effect class per command
- the exact package export used to load the typed handler

Rules:

1. packs are selected explicitly in config or by an explicit built-in allowlist; a
   deliberate `add` operation may update that selection
2. before handler import, the host verifies the declared package name against the resolved
   installed package, exact installed version, lockfile/package integrity or approved
   provenance, trust policy, manifest schema, and pack API compatibility
3. the CLI does not scan arbitrary `node_modules`, glob for command files, infer commands
   from package names, download packages, or execute package scripts
4. installing a package never runs a pack command
5. loading all selected JSON manifests performs no package-code execution, auth, env
   validation, network request, provider selection, or mutation
6. duplicate pack ids, command paths, stable command ids, root namespaces, `add` item
   types, config namespaces/schema keys, or capability/provider bindings fail closed
   before help or execution is assembled
7. only the selected command's exact handler export loads after the complete manifest
   graph passes schema, compatibility, trust, integrity, and collision validation
8. handler modules remain import-time side-effect free; loading one performs no auth,
   environment validation/throw, network request, provider selection, or mutation
9. schema, trust, integrity, and provenance checks make discovery deterministic but do not
   sandbox a handler; after import it has the Node host's process, filesystem, environment,
   and network authority
10. initial execution is limited to first-party or explicitly approved trusted packs;
    untrusted third-party packs are deferred until a separate threat model and
    process/capability-isolation contract is approved
11. Commander remains a private presentation adapter; packs expose typed command
    descriptors and headless handlers, not Commander instances or callbacks
12. incompatible or untrusted packs fail before command execution with exit code `2`

Three versions remain distinct:

1. package semver for published code compatibility
2. pack API version for CLI/extension compatibility
3. config and artifact schema versions for persisted data compatibility

Changing one does not silently change the others.

## Execution State And Security Ports

`@unisane/ops-engine` owns interfaces and versioned record schemas, never ambient stores or
implementation selection:

| Port             | Engine contract                                                              | Initial host/provider implementations                                                                |
| ---------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `SecretResolver` | resolve a named secret reference without exposing the value                  | environment/profile/keychain/external-command resolver selected by the host                          |
| `SecretWriter`   | persist connection material only through an explicitly writable secure store | keychain or explicit external secret-store writer; no plaintext fallback                             |
| `ArtifactStore`  | persist/version inventory, plans, reports, receipts, and retention metadata  | ignored local filesystem for development; durable access-controlled implementation for CI/production |
| `ApprovalStore`  | record/verify actor-, scope-, environment-, and plan-hash-bound approvals    | local signed record for single-user development; trusted durable implementation for automation       |
| `LockStore`      | acquire owner-bound expiring locks and recover them safely                   | owner-checked file lock for one host; atomic distributed lock for CI/multi-process mutation          |

The CLI or another explicit composition root binds these ports. Provider/integration packs
may supply durable implementations, but the engine retains lifecycle and schema authority.
There is no process-global store or environment-heuristic adapter selection.

Local adapters are allowed only for bounded single-host development. CI, production, or
multi-process remote mutation fails closed unless a durable `ArtifactStore` and
`ApprovalStore` plus an atomic distributed `LockStore` are configured. `connect` fails
with `blocked` when only a read-only secret resolver exists. Secret values never enter any
artifact, approval, lock, plan, receipt, log, or JSON record.

A distributed `LockStore` returns a renewable owner/lease token and a monotonically safe
fencing value where its backing store supports fencing. Only the current owner may renew
or release it. The engine revalidates ownership immediately before each remote effect and
fails closed after lease loss; contract tests cover expiry, renewal, stale-owner release,
reacquisition, and rejection of an earlier fencing token.

## Artifact, State, And Git Policy

### Artifact classes

| Class                  | Examples                                                                      | Authority                         | Default Git policy                                                            |
| ---------------------- | ----------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| authored intent        | `unisane.config.ts`, redacted policy/manifests, approved reusable definitions | project source authority          | tracked                                                                       |
| normalized observation | provider inventory and API snapshots                                          | time-bound evidence only          | ignored/private                                                               |
| derived analysis       | audits, reports, recommendations, drift summaries                             | reproducible evidence             | ignored by default; export an explicitly redacted report when review needs it |
| mutation plan          | exact operations, target identities, risk, plan hash                          | proposed action, not remote truth | ignored/private by default                                                    |
| mutation receipt       | actor, target, plan hash, operations, outcomes, timestamps                    | immutable action evidence         | ignored/private by default; export a redacted audit summary deliberately      |
| local runtime state    | locks, cursors, caches, OAuth callback state, freshness metadata              | process/tool state                | ignored                                                                       |
| secret material        | access/refresh tokens, API keys, private keys, client secrets                 | external secret store only        | never written to tracked files or ordinary artifacts                          |

Generated local state remains under `.unisane/**` during migration. SSOT 12 owns the
canonical artifact paths and any later path consolidation. A path move must be
schema-versioned and migration-tested; this plan does not authorize hand-moving current
artifacts.

### Public, private, and ignored repositories

- Public repositories may contain source, schemas, redacted fixtures, docs, examples,
  config templates, and provider-neutral tests.
- Private project repositories may additionally track non-secret desired resource names,
  policy, campaign definitions, and environment topology when the organization accepts
  that disclosure. Private Git is not a secret store.
- Ignored local/CI state includes credentials, provider account/resource dumps, audience
  data, budgets not intended for source control, inventories, plans, receipts, locks,
  caches, generated dashboards, and unredacted reports.
- `unisane-platforms` remains private; reusable product code extracted from it or the
  current workspace must pass a provenance, secret, customer-data, and license audit
  before entering a public repository.
- `.env*` policy must keep actual values ignored while permitting reviewed templates such
  as `.env.example` with placeholders.
- Production receipts that require retention belong in an access-controlled, immutable
  CI/audit artifact store. Git may track a redacted evidence reference or summary, never
  the secret-bearing or account-rich receipt.

No artifact may contain raw secrets. If a secret is exposed, treat it as compromised,
rotate it, and remove it from repository and workflow surfaces.

### Repository operating model

Repository-shaped staging, history filtering, commit/provenance maps, remote visibility,
authority cutover, branch protection, CODEOWNERS, cross-repository dependency policy, and
umbrella retirement are owned by
`unisane-ecosystem-repository-separation-and-git-governance-plan.md`. This plan owns the
Ops package contents and proof that must be ready before the repository cutover workpack
can be admitted.

## Security And Mutation Policy

1. Official provider APIs are the default; browser automation is a documented fallback,
   never hidden behavior.
2. Connections resolve from approved environment/secret-store references and use least
   privilege.
3. Inventory and doctor commands are read-only.
4. Remote writes require a fresh plan, exact target identity, risk classification,
   approval, apply lock, and receipt.
5. Production writes require explicit production confirmation.
6. Spend-impact actions additionally require amount/budget context and approval that
   names the spend-bearing target.
7. Publish is separate from apply.
8. Rollback creates a new recorded action; it does not rewrite prior receipts.
9. Plans and receipts are hash-bound to config, inventory, connection identity, target,
   environment, command version, and schema versions.
10. Stale, mismatched, partially applied, or already consumed plans fail closed.
11. Logs, errors, JSON, fixtures, reports, and receipts pass shared redaction.
12. Human-only blockers are surfaced plainly; the tool does not bypass consent, review,
    billing, terms, or provider policy gates.

## Adoption Ladder

Every suite/provider should support progressive adoption:

1. **Observe** — run offline checks and read-only inventory without taking ownership.
2. **Connect** — establish explicit provider connections and verify identity/permissions.
3. **Adopt** — import selected existing resources into reviewable desired state.
4. **Manage** — use plan/apply/publish/rollback with policy and receipts.
5. **Automate** — run stable JSON workflows in CI/agents after deterministic contracts and
   non-interactive approvals are established.

A developer must not be forced to let Unisane manage resources merely to use audit,
reporting, SEO, tracking, or Web Runtime capabilities.

## Current-To-Target Ownership Map

This is a migration map, not a claim that target packages exist.

| Current source/package                                                                                                                                                                                     | Current responsibility                                                       | Target                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unisane-tools/packages/unisane`                                                                                                                                                                           | `unisane` wrapper binary                                                     | become the canonical lightweight `unisane` CLI                                                                                                                         |
| `unisane-tools/packages/devtools` binary map                                                                                                                                                               | publishes both `unisane` and `unisane-devtools`                              | retain only the Framework-owned internal/devtools entry after canonical CLI cutover                                                                                    |
| `unisane-tools/packages/unisane` dependency on `@unisane/devtools`                                                                                                                                         | launches the full Devtools CLI                                               | replace with Ops engine and explicit pack dependencies/loaders                                                                                                         |
| `devtools/src/control-plane/**`                                                                                                                                                                            | artifact, plan, receipt, drift, policy primitives                            | `@unisane/ops-engine` after characterization                                                                                                                           |
| `devtools/src/commands/aws/**`                                                                                                                                                                             | AWS auth/inventory/plan/apply                                                | `@unisane/provider-aws` plus Cloud capability orchestration                                                                                                            |
| `devtools/src/commands/cloudflare/**`                                                                                                                                                                      | Cloudflare auth/inventory/plan/apply                                         | `@unisane/provider-cloudflare` plus Cloud capability orchestration                                                                                                     |
| `devtools/src/commands/google/**`, `commands/gtm/**`, and Google provider clients under marketing/SEO                                                                                                      | Google auth, GTM, GA4, Search Console, Ads                                   | `@unisane/provider-google` plus Growth workflows                                                                                                                       |
| `devtools/src/marketing-control-plane/**`, `seo-research/**`, `commands/marketing/**`, `commands/seo/**`, `commands/ads/**`, `commands/analytics/**`                                                       | marketing, SEO, ads, analytics, reports                                      | `@unisane/growth` headless workflows and state                                                                                                                         |
| `devtools/src/marketing-console/**`                                                                                                                                                                        | marketing presentation and mixed console state                               | headless state to `@unisane/growth`; optional UI to `unisane-ops/apps/console`, otherwise retire                                                                       |
| Framework `create`, `configure`, composition, `add`, `app`, feature-spec, `generate`, routes, SDK, database, migrations, `dev`, `inspect`, LLM, workpack, ownership, verify, upgrade, and release commands | Framework assembly and maintenance                                           | remain Framework-owned in `@unisane/devtools`/`create-unisane`; Phase 0 classifies each as Framework root/`app` contribution or maintainer-only Devtools               |
| current `commands/ui/**` and UI-related generators                                                                                                                                                         | mixed Framework starter UI composition and reusable UI registry/docs tooling | Framework app composition stays in Devtools/Framework pack; genuinely reusable UI registry/docs tooling moves to `unisane-ui` only after owner and compatibility proof |
| current `commands/brand/**`                                                                                                                                                                                | mixed brand/project operations                                               | site content/publishing/deployment moves to `unisane-site`; Framework starter/app brand config remains Framework; Growth analytics belongs to Growth                   |
| current `commands/env/**`                                                                                                                                                                                  | Framework and provider environment guidance                                  | Framework compiled/runtime env projection remains Framework; generic Ops connection/secret-reference guidance moves only with an admitted Ops capability               |
| current `commands/billing/**` and billing provider sync/runtime state                                                                                                                                      | Framework business/runtime billing operations                                | remain Framework-owned unless a separately admitted Ops contract proves a provider-account operation; shared vendor naming alone does not move it                      |
| `@unisane/web-tracking`                                                                                                                                                                                    | browser tracking, consent, attribution, React/Next adapters                  | `@unisane/web-runtime/tracking` subpaths                                                                                                                               |
| `@unisane/web-conversions`                                                                                                                                                                                 | provider-neutral server conversion runtime                                   | `@unisane/web-runtime/conversions`                                                                                                                                     |
| `@unisane/web-conversions-google-ads`                                                                                                                                                                      | Google Ads conversion delivery                                               | `@unisane/web-runtime/conversions/google-ads`                                                                                                                          |
| `@unisane/web-conversions-meta-capi`                                                                                                                                                                       | Meta CAPI delivery                                                           | `@unisane/web-runtime/conversions/meta`                                                                                                                                |
| `@unisane/web-seo`                                                                                                                                                                                         | metadata, canonical URL, robots, sitemap, JSON-LD                            | `@unisane/web-runtime/seo` and `/seo/next`                                                                                                                             |
| future `@unisane/public-urls` / persistent public URL lane                                                                                                                                                 | slug history, redirects, aliases, canonical identity                         | remain a Framework capability; never migrate into Web Runtime SEO                                                                                                      |
| `@unisane/tag-manager-google`                                                                                                                                                                              | Google tag-manager integration                                               | split by behavior: management in Google provider; application runtime helpers in Web Runtime tracking                                                                  |
| Framework runtime/business provider packages (`storage*`, `email-ses`, `queue-cloudflare`, `scheduler-cloudflare`, Framework `analytics`)                                                                  | application runtime ports/adapters or business capabilities                  | remain Framework-owned; Ops provider packages administer remote state and do not absorb them                                                                           |
| current Meta control-plane/reporting code                                                                                                                                                                  | Meta management and evidence                                                 | migrate transport/auth ownership to admitted `@unisane/provider-meta`; retain Devtools command composition only until CLI-host migration                               |
| `config/aws.ops.ts`, Cloudflare ops config, marketing config                                                                                                                                               | parallel config authorities                                                  | migrate into `unisane.config.ts` Ops export under a public schema migration                                                                                            |

Before moving any row, inventory its exports, tests, commands, artifacts, consumers,
secrets, side effects, and public compatibility obligations.

## Phased Delivery

### Phase 0: Authority, Terminology, And Package Budget

Deliverables:

- land SSOT 13, the linked decision, this plan, and the finding
- align ecosystem, ownership, naming, command-workflow, and provider-safety docs
- classify older plans as child capability backlogs, live-command references, or archive
- inventory current binaries, packages, imports, artifacts, config files, and command ids
- produce a reviewed command-disposition manifest for every current Devtools and wrapper
  command, including create/composition, `sync`, `dev`, `build`, `app`, codegen,
  routes/SDK, database/migrations, billing, brand, environment, UI, provider, growth,
  LLM/workpack/governance, verification, and release commands
- for each command record its current path/profile/effect/public compatibility, canonical
  stable id, and exactly one target: CLI core, an Ops suite/provider pack, Framework
  integration/root/`app`, maintainer-only Devtools, UI, Site, or explicit semver
  retirement
- freeze the Ops protocol identifier grammar from the naming SSOT and reject
  noncanonical/colliding pack, command, capability, provider, item-type, alias, and config
  namespace ids
- record package budget and provider-admission templates

Exit:

- one authority chain exists
- target and current commands are clearly separated
- every current command has one reviewed disposition; unclassified commands block binary
  or registrar removal
- no implementation workpack has silently started

### Phase 1: Characterization And Effect Classification

Deliverables:

- capture current CLI command tree, help, JSON where present, exits, config inputs, and
  artifacts
- characterize every row in the Phase 0 command-disposition manifest, including
  profile/alias behavior and commands that remain Framework-maintainer-only
- characterize AWS, Cloudflare, Google, GTM, marketing, SEO, ads, analytics, tracking,
  conversions, and SEO runtime behavior
- assign every current command a command id and maximum effect
- audit import-time effects, secret handling, provider SDK ownership, and network calls
- create redacted fixtures and protected parity tests

Exit:

- each extraction candidate has behavior and safety proof
- unknown or unsafe mutations block extraction instead of being copied

### Phase 2: Headless Ops Engine

Deliverables:

- extract typed command context/result/error contracts
- extract inventory, plan, receipt, drift, artifact, redaction, freshness, lock, and policy
  primitives
- define and contract-test `SecretResolver`, `SecretWriter`, `ArtifactStore`,
  `ApprovalStore`, and `LockStore`
- provide bounded local host adapters and fail-closed production/CI adapter requirements
- remove Commander and provider SDK dependencies from the engine boundary
- establish config/artifact schema versioning and contract tests
- migrate one read-only and one guarded write flow without changing their live command
  interface

Exit:

- engine tests run without CLI, Framework, or provider SDK initialization
- migrated flows have parity, effect, redaction, idempotency, and stale-plan proof

### Phase 3: Lightweight CLI And Pack Protocol

Current checkpoint: complete. `unisane` is the sole public binary and a real static-pack
host. Core, Cloud, Cloudflare, Growth, AWS, Google, Meta, and optional Framework
manifests pass exact trust/integrity/collision validation. Framework roots route through
the narrow Devtools bridge; UI routes through Framework Ops; GTM routes through Growth;
provider expert roots route through their provider owners. Unknown commands fail closed,
the canonical host has no Devtools dependency, and Devtools publishes only
`unisane-devtools`.

Deliverables:

- make `unisane` the real CLI rather than a Devtools launcher
- implement and validate static `PackManifest`
- implement explicit pack selection and exact lazy imports
- implement stable human/JSON output and exit codes
- establish core `ops init`; root `add`, `remove`, `connect`, `check`, `doctor`,
  `status`, and `inspect` dispatch; and reserved Framework root names
- establish the minimal `@unisane/framework-ops` package shell and exact Framework
  integration bridge required to preserve `unisane app compile --write|--check`
- expose the headless bridge at `@unisane/devtools/framework-integration`
- route current Framework commands through that bounded Framework pack without importing
  the Devtools root or private compiler internals
- preserve the public Framework `sync`, `dev`, `build`, `doctor`, workspace-profile, and
  low-level `app compile` contracts through characterization and semver migration proof
- remove the duplicate `unisane` binary from Devtools when parity and public migration
  requirements are satisfied and every command-disposition row is routed, migrated, or
  retired

Exit:

- CLI installation has no provider SDKs
- no arbitrary scanning, downloading, or import-time execution exists
- one package owns the binary

### Phase 4: Cloud Vertical Proof

Current checkpoint: the Cloud and Cloudflare packages expose direct capability-first DNS
inventory/import/plan/apply; account/zone/Queue/Worker/Cron inventory; offline
Queue/Worker/Cron plans; guarded local Queue/Worker/Cron apply; readiness/environment
reports; and exact expert Cloudflare aliases. Plain non-Framework fixtures prove direct
canonical use, and historical Devtools resource commands consume the same workflows.
AWS provider ownership and expert routing are complete. Writable connection/secret
management and durable automation composition remain.

Deliverables:

- establish `@unisane/cloud`
- establish AWS and Cloudflare provider-family packages
- migrate one coherent capability end to end through both capability-first and expert
  provider lanes
- prove Observe, Connect, Adopt, Manage, and non-interactive JSON automation
- select, implement, and record the exact owner of one durable automation composition:
  access-controlled `ArtifactStore` and `ApprovalStore` plus atomic distributed
  `LockStore`; a new adapter package is allowed only if it passes the package-budget test
- verify fresh-plan/apply/receipt/drift and production/spend policy

Exit:

- a plain non-Framework fixture uses Cloud successfully
- provider SDKs remain lazy and isolated
- CI/multi-process automation passes against the durable store/lock composition without
  local or in-memory fallback
- old implementations for the migrated slice are deleted

### Phase 5: Web Runtime Foundation And Consolidation

Deliverables:

- establish `@unisane/web-runtime` and the defined subpaths before Growth depends on them
- migrate tracking, consent, attribution, conversions, SEO, React, Next, and testing
  surfaces
- preserve browser/server boundaries and optional peer dependencies
- keep persistent slug/redirect/public-URL identity in Framework `@unisane/public-urls`
- publish migration maps from current packages
- prove plain Node, plain Next, and Framework consumers

Exit:

- Web Runtime imports no CLI, Ops engine, suites, provider-management SDKs, or Framework
  runtime
- current packages are retired through semver-coordinated releases after consumer
  migration

### Phase 6: Growth Extraction

Current checkpoint: complete for source/package/command ownership. Growth owns GTM, SEO,
marketing, ads, analytics, reports, recommendations, and headless console behavior;
Google and Meta provider execution is host-injected; canonical and compatibility routes
are explicit sealed-pack entries. Durable production automation remains a separate
engine-host concern.

Deliverables:

- establish `@unisane/growth` against the already established Web Runtime contracts
- consume the established Google provider package and its shared connection contract
- migrate GTM, GA4, Search Console, Google Ads, SEO research, analytics, reports,
  recommendations, and ads workflows in bounded slices
- split current marketing-console code: headless query/view state moves to Growth;
  optional presentation moves to `unisane-ops/apps/console` or is retired
- implement the separately admitted `@unisane/provider-meta` family and inject its
  auth, discovery/inventory, reporting, asset, and live-execution capabilities through
  Growth-owned contracts

Exit:

- a non-Framework website fixture can run a representative SEO/measurement workflow
- publish/inverse-plan/apply and spend-impact policies pass contract tests
- migrated legacy command owners are removed
- no terminal “retained legacy” Meta management/reporting owner remains in Devtools

### Phase 7: Framework Integration And Residue Deletion

Current checkpoint: complete for the Devtools refactor boundary. Framework Ops owns the
optional pack and UI route, Devtools retains Framework compiler/codegen/governance plus
thin compatibility facades, generic Ops implementations are removed, and permanent
gates reject fallback, duplicate-binary, and provider/GTM ownership regression.

Deliverables:

- complete and harden the Phase 3 `@unisane/framework-ops` shell
- implement exact named `ops` config export support
- map Framework project/target/environment context at the integration boundary
- keep compiler/codegen/governance in `@unisane/devtools`
- delete generic cloud/growth/provider/runtime ownership from Devtools and Framework
- delete parallel config loaders, command registrars, binary aliases, and artifact writers
- remove every remaining generic Meta management/reporting implementation from Devtools;
  command compatibility may remain only until canonical CLI-host migration

Exit:

- Framework projects use the canonical CLI plus Framework pack
- Framework runtime has no Ops/CLI dependency
- zero-residue import, command, config, binary, and artifact-owner gates pass

### Phase 8: Repository-Cutover And Release-Readiness Handoff

Deliverables:

- freeze the complete Ops package, app, docs, scripts, tests, examples, and config
  inventory
- complete package API, semver, migration-note, compatibility, and clean-install proof
- complete the Ops-specific secret/customer-data/license readiness audit
- publish extension, provider, security, config, and automation documentation
- hand the source-path, dependency, package, release, and audit evidence to the repository
  separation plan
- do not create, push, publish from, or declare a target remote authoritative through this
  phase alone

Exit:

- Ops is eligible for a bounded repository-cutover workpack under the repository
  separation plan
- declared exports, types, pack/API/config versions, and package contents pass
- no private platform code, secret, account data, local artifact, or generated cache is
  present in the proposed public source set

## Planning Estimate

These are capacity ranges, not delivery commitments. Assumptions: two senior
TypeScript/platform engineers, part-time security/release review, timely access to provider
test accounts, and no large product-feature expansion during extraction.

| Phase | Estimated effort    | Dependency and parallelization note                                                 |
| ----- | ------------------- | ----------------------------------------------------------------------------------- |
| 0     | 1–2 engineer-weeks  | authority work is partly complete; inventory/package-budget evidence remains        |
| 1     | 4–6 engineer-weeks  | provider characterization can split by family after shared fixture/redaction rules  |
| 2     | 5–8 engineer-weeks  | critical path for all mutation migrations                                           |
| 3     | 4–6 engineer-weeks  | overlaps late engine contract tests, not unresolved lifecycle semantics             |
| 4     | 6–10 engineer-weeks | AWS and Cloudflare adapters can parallelize after Cloud contracts freeze            |
| 5     | 4–7 engineer-weeks  | browser/server and React/Next lanes can parallelize behind one export contract      |
| 6     | 8–13 engineer-weeks | Google/GTM, SEO/analytics, ads, console, and Meta disposition are bounded sub-lanes |
| 7     | 4–7 engineer-weeks  | starts only after migrated owners and public compatibility windows are known        |
| 8     | 2–4 engineer-weeks  | produces readiness evidence; the ecosystem Git plan owns actual remote cutover      |

Total expected effort is roughly **38–63 engineer-weeks**. With the assumed team and
review capacity, a realistic planning window is approximately **22–34 calendar weeks
(about 5–8 months)**. One engineer should plan closer to **10–16 months** because the
engine, provider safety, compatibility, and deletion gates do not parallelize cleanly.

The estimate expands when provider access/app review is delayed, current behavior lacks
fixtures, public semver windows require dual releases, security/provenance audits find
unknown data, or Meta management is admitted instead of retired. It contracts when
characterization proves capabilities can be retired. Each admitted workpack must replace
its phase range with evidence-based scope and update this table when the total forecast
changes materially. Repository separation outside the Ops readiness handoff is estimated
and governed independently by the ecosystem Git plan.

## Workpack Admission And Retirement

This strategy does not itself open an execution workpack.

Before the first implementation slice:

1. update the finding target from `queued-unisane-ops-extraction` to the admitted `P*-W*`
2. define one bounded owner move, protected behaviors, affected packages, and explicit
   old paths to delete
3. capture baseline command/API/artifact/security evidence
4. classify blockers before editing
5. create a convergence contract when the slice replaces an existing path
6. name the required docs, generators, compatibility notes, and closure checks

During implementation:

- keep one bounded migration owner per workpack
- do not create destination skeletons without moving real behavior
- do not copy a capability and leave two active owners
- keep public compatibility only at published boundaries with version, owner, removal
  release, and migration note
- update the finding and plan when scope changes

Retirement requires:

- destination parity and contract proof
- all consumers migrated
- old export, registrar, config loader, artifact writer, dependency, tests, and docs
  deleted or intentionally archived
- generated references refreshed by their owner
- owning Skopos Task closed after verification and Readiness

## Legacy Plan Disposition

The following plan families must be reviewed in Phase 0:

- `framework-provider-control-plane-devtools-plan.md`
- `framework-aws-control-plane-devtools-plan.md`
- `framework-cloudflare-control-plane-devtools-plan.md`
- `framework-marketing-control-plane-devtools-plan.md`
- `framework-google-tag-manager-control-plane-plan.md`
- `framework-keyword-research-and-ads-planning-devtools-plan.md`
- `framework-marketing-console-dashboard-devtools-plan.md`
- `framework-web-tracking-and-conversions-plan.md`
- `framework-web-seo-and-public-url-management-plan.md`

Disposition rules:

1. promote durable capability behavior into SSOT 12, SSOT 13, or package documentation
2. keep an older plan active only when it owns a still-relevant capability backlog and
   explicitly defers product/package/CLI/config decisions to this plan
3. move historical implementation sequencing to archive
4. delete dead duplication
5. do not rewrite examples to target commands until the owning implementation is live

## Verification And Closure

Every docs-only authority change runs the canonical docs, program-index, architecture
index, and LLM-reference checks required by the command workflow.

Every implementation phase additionally proves, proportionate to scope:

- package typecheck, tests, lint, and pack dry-run
- workspace architecture and dependency checks
- public export and clean-install proof
- command help/JSON/exit contract snapshots
- effect and mutation-policy contract tests
- provider redaction, auth identity, stale plan, apply lock, idempotency, receipt, and
  drift tests
- non-Framework plain Node/Next fixture proof
- Framework integration fixture proof when applicable
- grep-zero or structural gates for duplicate binaries, old loaders, old imports, old
  command owners, and provider SDK leakage
- secret, license, package-content, and provenance audit before public release

Program closure requires all Success Criteria to pass, the linked finding to be marked
`done` with proof, temporary workpacks to be archived, superseded plans to be archived or
compacted, durable rules to remain in SSOT, and target commands to be promoted into the
live command workflow only after delivery.
