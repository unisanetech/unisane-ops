---
id: 'F-e7d9ebe93b6f'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: finding
lifecycle: active
authority: supporting
provenance: accepted
view: current
severity: MUST
status: in-progress
---

# F-20260724 Unisane Ops Product Boundary And Devtools Coupling Gap

## Changelog

- `2026-08-15`: Corrected the apparent closure after standalone Ops resolution exposed
  the direct `@unisane/devtools` integration dependency and its unavailable 32-package
  Framework runtime closure. Added the live dual command/action model, nested provider
  CLIs, process-global output capture, hardcoded host graph, parallel AWS config, and
  remaining Devtools remote-operation residue. The accepted target is separate product
  CLIs, one typed Ops action model, and an optional serialized-descriptor adapter with
  zero Framework package dependencies.
- `2026-08-09`: Removed the remaining direct Framework Devtools dependency/import leak
  into Ops-owned `@unisane/cli-core` and `@unisane/ops-engine`. Devtools now uses a
  package-private terminal helper, preserves the 76-command disposition, and is covered
  by a permanent package/source boundary guard. The finding remains open for durable
  automation and repository/release readiness.
- `2026-07-26`: Closed and archived P116-W22 after explicit standalone package
  compatibility, registry-ready template materialization, statistical fleet retirement,
  and complete focused/workspace proof passed. The remaining umbrella scope returns to
  durable automation composition and repository/release readiness.
- `2026-07-26`: Opened P116-W22 after post-extraction scaffold proof exposed that the
  canonical unscoped `unisane` dependency remained on `workspace:*` and that CLI-version
  inference would couple independently released products. The bounded correction adds
  one explicit package compatibility manifest, one shared fail-closed transformer,
  registry-ready template export, and complete standalone dependency-protocol proof.
- `2026-07-25`: Closed and archived P116-W21 after provider/GTM/UI ownership,
  fail-closed canonical routing, binary retirement, compatibility facades, generated
  discovery, integration behavior, and complete convergence/T2 proof passed. The
  remaining umbrella scope is durable automation and repository/release readiness.
- `2026-07-25`: Completed P116-W21 implementation: exact provider/GTM/UI packs replaced
  the catch-all fallback, canonical `unisane` dropped its Devtools dependency, and
  Devtools retired the duplicate binary. The broader finding now routes only to durable
  automation and repository/release-readiness evidence.
- `2026-07-25`: Opened P116-W21 as the terminal provider, GTM, UI, fallback, and
  duplicate-binary retirement cut.
- `2026-07-25`: Closed and archived P116-W20 after Growth assumed command and console
  ownership, canonical `unisane growth ...` plus explicit legacy roots selected its
  sealed pack before fallback, provider execution became host-injected, Google discovery
  transport moved to Provider Google, cyclic test manifest edges were removed, and all
  focused/permanent/generated/workspace T2 proof passed. The finding now routes to the
  terminal provider/UI/fallback/binary cut.
- `2026-07-25`: Opened P116-W20 to move Growth command and marketing-console
  presentation out of Framework Devtools, establish canonical `unisane growth ...`
  routing, and replace suite-to-provider imports with host-injected execution.
- `2026-07-25`: Closed and archived P116-W19 after the optional Framework pack, exact
  reserved-root bindings, narrow Devtools bridge, canonical selection, behavior,
  boundary, generated, workspace type, runtime, dependency, dead-code, lint, and 23/23
  LLM proof passed. The finding now routes to the Growth command pack and canonical
  routing boundary.
- `2026-07-25`: P116-W19 implementation and focused proof are green. The optional
  Framework pack now routes 24 lifecycle/authoring roots before fallback through the
  narrow Devtools bridge; terminal Growth/provider/UI routing and binary retirement
  remain after final closure.
- `2026-07-25`: Opened P116-W19 for the optional Framework Ops pack, narrow Devtools
  integration bridge, reserved-root delegation, and canonical host routing. Growth,
  provider, UI, fallback, and duplicate-binary retirement remain later terminal work.
- `2026-07-25`: Closed and archived P116-W18 after the admitted Provider Meta family
  assumed saved auth, discovery/inventory, reporting, asset, and guarded campaign
  transport ownership behind Growth contracts and passed behavior, boundary, generated,
  workspace type, runtime, dependency, dead-code, lint, and 23/23 LLM proof. The finding
  now routes to canonical CLI-host migration and duplicate-binary retirement.
- `2026-07-25`: Opened P116-W18 after the Meta provider and package-budget admission
  passed. The batch creates one Provider Meta family and moves auth, discovery,
  inventory, reporting, asset, and live campaign transport while retaining Growth safety
  and Web Runtime CAPI.
- `2026-07-25`: Closed and archived P116-W17 after Google Ads live campaign execution
  moved to Provider Google behind the Growth safety lifecycle and passed behavior,
  boundary, generated-reference, workspace type, runtime, dependency, dead-code, and
  23/23 LLM proof. The finding now routes to the separately gated Meta provider-admission
  or retirement decision.
- `2026-07-25`: Opened P116-W17 to move complete Google Ads live campaign mutation
  execution to Provider Google behind a Growth-owned executor contract while retaining
  one plan/approval/lock/receipt lifecycle.
- `2026-07-25`: Closed and archived P116-W16 after injected provider-report composition,
  complete Google Ads/GA4/Search Console transport ownership, characterization,
  zero-residue enforcement, generated discovery, workspace type, dependency, dead-code,
  and 23/23 LLM proof passed. The finding now routes to Google Ads live executor
  distribution; Meta remains admission-gated.
- `2026-07-25`: Opened P116-W16 to introduce the Growth-owned provider-report driver
  contract, move Google Ads/GA4/Search Console report transports to Provider Google, and
  inject them at Devtools composition. Meta remains behind its mandatory separate
  provider-admission decision.
- `2026-07-25`: Closed and archived P116-W15 after complete marketing-control-plane
  ownership, consumer migration, public packaging, zero-residue enforcement, generated
  discovery, workspace type, dependency, dead-code, and 23/23 LLM proof passed. The
  finding now routes to provider transport distribution through an injected driver
  contract.
- `2026-07-25`: Opened P116-W15 to move the complete headless marketing control plane
  from Framework Devtools to `@unisane/growth/marketing`, migrate all live consumers,
  and enforce zero private-owner residue.
- `2026-07-25`: Closed and archived P116-W14 after the complete SEO research and Google
  measurement ownership split passed migrated behavior, command, zero-residue,
  generated-reference, workspace type, dependency, dead-code, and 23/23 LLM proof. The
  finding now routes to the remaining marketing control-plane extraction.
- `2026-07-25`: Opened P116-W14 to move the complete SEO research domain to
  `@unisane/growth/seo`, move GA4/Search Console/Google Ads Keyword Planner execution to
  `@unisane/provider-google/seo`, migrate Devtools composition, and delete the former
  private implementation tree.
- `2026-07-25`: Closed and archived P116-W13 after the Growth foundation, complete GTM
  domain/provider ownership split, compatibility facade, consumer migration, generated
  discovery, permanent enforcement, workspace type, dependency, dead-code, and 23/23 LLM
  proof passed. The finding remains in progress and routes to wider Growth measurement
  and SEO extraction.
- `2026-07-25`: Opened P116-W13 to establish `@unisane/growth`, split the complete GTM
  implementation between Growth-owned domain contracts/workflows and Google-owned remote
  execution, migrate live consumers, and reduce `@unisane/tag-manager-google` to a
  compatibility facade.
- `2026-07-25`: Closed and archived P116-W12 after Web Runtime ownership,
  compatibility, consumer migration, generated discovery, permanent boundary,
  architecture, workspace type, dependency, dead-code, and 23/23 LLM evaluation proof
  passed. The finding remains in progress and now routes to an unopened Growth/GTM
  extraction batch.
- `2026-07-25`: Implemented the P116-W12 Web Runtime source boundary. One public
  `@unisane/web-runtime` package now owns tracking, consent, attribution, conversions,
  Google Ads and Meta delivery, pure SEO, Next adapters, and testing. Five legacy
  packages are compatibility-only, all first-party consumers use canonical subpaths,
  and permanent ownership/generated-discovery checks pass. Final T2 closure remains.
- `2026-07-25`: Opened active P116-W12 to consolidate tracking, consent, attribution,
  conversions, provider delivery, SEO, React/Next adapters, and testing into one
  `@unisane/web-runtime` package with explicit subpaths, migrated first-party consumers,
  time-boxed compatibility coordinates, and permanent ownership proof.
- `2026-07-25`: Closed and archived P116-W11 after Google provider ownership,
  compatibility, boundary, generated-reference, admission, architecture, workspace type,
  dependency, dead-code, and LLM evaluation proof passed. The next unopened Ops batch is
  the Web Runtime foundation required before Growth/GTM workflow extraction.
- `2026-07-25`: Implemented P116-W11 source ownership:
  `@unisane/provider-google` owns shared OAuth and Google project/API/product-control
  behavior, Devtools Google is compatibility-only, and GTM/marketing/SEO consumers use
  the provider coordinate. Generated discovery and final closure remain.
- `2026-07-25`: Opened active P116-W11 for the shared Google connection and
  provider-control extraction: OAuth profiles, project/API lifecycle, product discovery,
  provider clients, Devtools compatibility, consumer migration, and permanent ownership
  proof. GTM publishing and Growth workflows remain separate bounded slices.
- `2026-07-25`: Closed and archived P116-W10 after AWS package ownership, compatibility,
  boundary, full workspace, dependency, dead-code, and LLM evaluation proof passed. The
  next unopened implementation batch is the Google provider-family extraction.
- `2026-07-25`: Implemented P116-W10 source ownership: shared AWS contracts now live in
  Cloud, the complete proven AWS implementation and SDK dependency set live in
  `@unisane/provider-aws`, and Devtools retains compatibility registration only.
  Generated owner discovery resolves; final closure remains.
- `2026-07-25`: Opened active P116-W10 to move the complete proven AWS control-plane
  implementation and all AWS SDK dependencies into one `@unisane/provider-aws` family,
  publish shared Cloud AWS contracts, and retain Devtools only as a compatibility router.
- `2026-07-25`: Closed and archived P116-W9 after all represented Cloudflare resource
  mutation, ownership, compatibility, architecture, workspace type, reference,
  dependency, dead-code, and LLM evaluation proof passed. The next unopened
  implementation batch is AWS provider-family extraction.
- `2026-07-25`: Implemented P116-W9: Cloud owns all represented
  Queue/Worker/Cron mutation with operation-bound safety, confirmation, approval,
  fencing locks, replay protection, redacted receipts, source revalidation, secret
  resolution, and drift; canonical and expert routes are direct; the two remaining
  Devtools apply owners are deleted and replaced by one compatibility consumer.
- `2026-07-25`: Opened active P116-W9 to finish the represented Cloudflare capability
  family in one mutation batch: Queue, Worker, route, binding, variable, secret, script,
  and Cron apply move behind engine safety and the final Devtools apply owners retire.
- `2026-07-25`: Closed and archived P116-W8 after 59 focused package/CLI tests,
  permanent boundary proof, documentation/reference checks, full workspace typecheck,
  and architecture/admission synchronization passed. The finding remains in progress and
  routes to an unopened bounded Ops extraction slice for remote mutation safety, wider
  providers, Growth/Web Runtime, compatibility-binary retirement, or repository handoff.
- `2026-07-25`: Implemented the P116-W8 source boundary. Cloud now owns strict
  Cloudflare resource inventory, readiness/environment reports, and offline
  Queue/Worker/Cron planning; the provider owns transport; canonical config/runtime and
  aliases are live; and the five duplicate Devtools read/plan owners are deleted.
- `2026-07-25`: Opened P116-W8 as the maximum coherent remaining Cloudflare
  non-mutating extraction: readiness, environment output, account/zone/queue/worker/cron
  inventory, offline planning, canonical config, expert aliases, and Devtools
  compatibility consumption. Remote mutation is held for engine-grade state/safety.
- `2026-07-25`: Closed and archived P116-W7 after blocking convergence, 26 focused
  tests, full architecture/typecheck, dependency, dead-code, runtime, reference,
  admission, and 23/23 LLM evaluation proof passed. The finding remains in progress and
  now routes to a future bounded Ops extraction slice; durable state, wider providers,
  Web Runtime/Growth, duplicate-binary retirement, and Git authority remain.
- `2026-07-25`: Implemented the P116-W7 bounded surface. The Cloud pack now exposes
  offline selected-zone import and exact capability/expert DNS routes over one workflow;
  the Cloudflare pack owns read-only connection verification and discovery; the canonical
  host owns lazy bindings; and focused package, CLI, plain-project, redaction, manifest,
  and boundary proof passes. Full reference refresh and closure remain.
- `2026-07-25`: Opened active P116-W7 as one batched Phase 4 slice for Cloudflare DNS
  expert aliases, read-only connection verification/discovery, offline selected-inventory
  import, and plain non-Framework project proof. Secret writing, durable automation,
  wider providers, Git, and repository authority remain deferred.
- `2026-07-24`: Archived P116-W6 after direct canonical Cloud DNS ownership, offline
  planning, guarded apply, provider isolation, Devtools compatibility consumption,
  zero-residue enforcement, 60 focused tests, 221 workspace tasks, and all 24 LLM
  evaluation scenarios passed. Routed queued, unopened `P116-W7` to Cloud DNS
  expert-provider and adoption workflow parity; Git remains outside the refactor.
- `2026-07-24`: P116-W6 implementation landed: the Cloud manifest owns direct DNS
  inventory/plan/apply handlers, canonical config/runtime composition is live, provider
  account/zone/DNS transport is isolated, Devtools duplicate plan/apply files are
  deleted, shared DNS inventory delegates to Cloud, and permanent boundary enforcement
  passes. Generated-reference and full T2 closure remain before archival.
- `2026-07-24`: Opened active `P116-W6` for direct
  `unisane cloud dns inventory|plan|apply` ownership: Cloud workflows and handlers,
  canonical config/runtime composition, Cloudflare account/zone transport, offline
  planning, safe apply, and a bounded Devtools compatibility adapter. Git, repository
  authority, wider Cloud/Growth/Web Runtime, and duplicate-binary retirement remain
  outside this workpack.
- `2026-07-24`: Archived `P116-W5` after relocating the canonical CLI to Ops,
  establishing validated static pack discovery and exact lazy handlers, preserving a
  named compatibility fallback, and passing blocking closure. Routed unopened
  `P116-W6` to move the proven Cloud DNS command handlers directly onto the canonical
  host without a Devtools bridge.
- `2026-07-24`: Opened `P116-W5` for the clean Phase 3 prerequisite: engine-owned static
  pack contracts, canonical CLI relocation, first-party trust/integrity/collision proof,
  exact handler loading, offline core commands, and explicit compatibility fallback.
  Live Cloud DNS command routing is deferred until its remaining config/presentation
  owner can move without a hidden Devtools bridge.
- `2026-07-24`: Archived `P116-W4` after the first Cloudflare DNS provider vertical,
  strict engine-backed plan/apply, local single-host execution state, post-apply drift,
  package/reference enforcement, and T2 closure passed; routed unopened `P116-W5` to the
  static pack-manifest and canonical CLI-dispatch core.
- `2026-07-24`: Opened `P116-W4` for the first complete provider-family vertical:
  provider-neutral Cloud DNS contracts, Cloudflare DNS transport ownership, corrected
  generic Ops project identity, local single-host state, engine-backed mutation safety,
  receipts, and post-apply drift. Target CLI/pack manifests, distributed durable state,
  wider provider extraction, repository separation, and Git remain deferred.
- `2026-07-24`: Archived `P116-W3` after `@unisane/ops-engine` became the sole generic
  control-plane owner, the retired Devtools tree reached zero residue, package/reference
  gates and T2 postflight passed, and all reference deployables were synchronized;
  routed unopened `P116-W4` to the first provider-family extraction and live
  engine-backed mutation slice.
- `2026-07-24`: Opened `P116-W3` with a blocking zero-residue convergence contract;
  froze the first real owner move to the provider-neutral engine, explicit safety/state
  contracts, Devtools consumption, and permanent package-boundary enforcement.
- `2026-07-24`: Archived `P116-W2` after its typed 17-record characterization matrix,
  eight protected tests, and T2 admission passed; routed the unopened `P116-W3` to the
  first bounded headless-engine owner move and missing-safety implementation.
- `2026-07-24`: Archived the passed `P116-W1` command-disposition gate and opened
  `P116-W2` to characterize shared control-plane behavior plus one representative
  Cloudflare DNS read/write slice before engine extraction.
- `2026-07-24`: Opened `P116-W1` as the bounded Phase 0 command-disposition and
  extraction-admission workpack; implementation owner moves remain blocked until its
  complete command/binary inventory gate passes.
- `2026-07-24`: Opened the multi-pack finding for duplicate CLI ownership, direct
  Devtools coupling, provider SDK leakage, mixed Framework/Ops responsibilities, and
  scattered reusable web packages; aligned closure with state ports, manifest trust,
  contract-only dependencies, terminal Meta disposition, and repository-readiness handoff.

## Summary

- Severity: `MUST`
- Status: `in-progress`
- Owner: `architecture-program`
- Target Pack: `queued-durable-automation-and-repository-readiness`

## Symptom

Reusable provider, cloud, growth, and web packages exist, but the executable boundary
is not yet the final independent Ops product:

1. The Ops package and Framework Devtools still present competing product CLI identities.
2. The optional `@unisane/framework-ops` package imports and executes
   `@unisane/devtools/framework-integration`. A standalone Ops install therefore reaches
   into Framework tooling rather than consuming a passive protocol.
3. The real registry contains no `@unisane/devtools@0.1.0` artifact and none of its
   complete 32-package first-party runtime closure; 31 closure members are private. The
   earlier packed and loopback-registry proof did not establish durable availability.
4. Typed Ops actions and raw-argv pack handlers coexist with different effect
   vocabularies, parsing, result, and receipt contracts.
5. AWS and Google packs expose opaque root commands, instantiate nested Commander CLIs,
   and hide typed leaf inputs/effects from the host manifest.
6. The pack bridge captures global `process.stdout.write`, `process.stderr.write`, and
   `process.exitCode`, then parses CLI output. That is unsafe for concurrent, embedded,
   MCP, API, console, and test execution.
7. The Ops host hardcodes the trusted package graph, exact handler switches, and
   provider/product binding cases, so a new admitted pack still requires host edits.
8. AWS retains a parallel `config/aws.ops.*` loader despite the accepted single-config
   contract.
9. Devtools still contains live billing/provider remote pull, plan, repair, apply, and
   archive behavior plus remote environment placeholders and dead UI-generation residue.

The completed extraction slices remain useful source-placement proof. They do not close
the action, CLI, integration-protocol, registry, or standalone-product boundary.

## Evidence

| Evidence                                      | Repository location                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| current Ops binary declaration                | `unisane-ops/packages/unisane/package.json`                                                                             |
| competing current binary declarations         | `unisane-ops/packages/unisane/package.json`, `unisane-tools/packages/devtools/package.json`                             |
| fail-closed canonical host                    | `unisane-ops/packages/unisane/src/host.ts`                                                                              |
| duplicate action/effect authorities           | `unisane-ops/packages/ops-engine/src/actions.ts`, `unisane-ops/packages/ops-engine/src/pack.ts`                         |
| nested provider CLI handlers                  | `unisane-ops/packages/provider-aws/src/cli/handler.ts`, `unisane-ops/packages/provider-google/src/cli/handler.ts`       |
| process-global CLI capture bridge             | `unisane-ops/packages/ops-engine/src/pack.ts`                                                                           |
| executable Framework integration              | `unisane-ops/packages/framework-ops`, `unisane-tools/packages/devtools/src/framework-integration.ts`                    |
| parallel AWS config                           | `unisane-ops/packages/provider-aws/src/config-loader.ts`, `unisane-ops/config/aws.ops.ts`                               |
| provider-family isolation                     | `unisane-ops/packages/provider-aws`, `provider-cloudflare`, `provider-google`, `provider-meta`                          |
| mixed top-level command registration          | `unisane-tools/packages/devtools/src/cli.ts`, `unisane-tools/packages/devtools/src/commands/**`                         |
| provider-neutral control-plane owner          | `unisane-ops/packages/ops-engine/**`                                                                                    |
| provider-neutral Cloud workflow owner         | `unisane-ops/packages/cloud/**`                                                                                         |
| Cloudflare transport owner                    | `unisane-ops/packages/provider-cloudflare/**`                                                                           |
| Google and Meta management owners             | `unisane-ops/packages/provider-google/**`, `unisane-ops/packages/provider-meta/**`                                      |
| retired Devtools owner zero-residue gate      | `scripts/commands/architecture/ops-package-boundary-check.mjs`                                                          |
| Devtools-to-Ops dependency/import gate        | `scripts/commands/architecture/ops-package-boundary-check.mjs`, `scripts/__tests__/ops-package-boundary.test.mjs`       |
| Growth-owned GTM and marketing presentation   | `unisane-ops/packages/growth/src/cli/**`                                                                                |
| canonical Web Runtime owner                   | `unisane-ops/packages/web-runtime/**`                                                                                   |
| compatibility-only former package coordinates | `unisane/packages/foundation/web-tracking`, `web-conversions`, `web-seo`; `unisane/packages/adapters/web-conversions-*` |

This evidence distinguishes completed source placement from the still-open executable
contract. Provider/Growth/Web Runtime ownership can be preserved while the host, action,
CLI, and Framework-integration mechanisms are replaced cleanly.

## Impact

- production/CI mutation still lacks the required durable artifact, approval, and
  distributed lock composition
- the current optional Framework-enabled Ops profile is not stack-neutral because its
  adapter executes Devtools
- global output/process interception prevents safe concurrent and embedded consumers
- two input/effect/result systems can disagree across CLI, MCP, API, console, and
  automation
- repository and registry cutover are not yet proven independently
- separate config/artifact patterns can drift in terminology, safety, and Git policy
- web consumers must understand several packages that represent one runtime capability
  family
- extracting directly without characterization could regress mutation safety, command
  behavior, or public APIs

## Root Cause

The capabilities were developed while the framework and product direction were still
being proven. Co-location optimized iteration, but temporary ownership was allowed to
become the apparent final package shape. Product identity, provider granularity, config,
CLI extension, artifact, and public/private repository decisions were not previously
frozen as one cross-cutting contract.

## Fix Plan

1. **Authority and inventory**
   - land SSOT 13, the product/repository decision, and the extraction plan
   - align ecosystem, provider-safety, command, ownership, and naming docs
   - inventory command ids, effects, configs, artifacts, dependencies, consumers, and
     public compatibility
2. **Characterization**
   - protect existing read and write behavior with redacted fixtures and parity tests
   - classify network, write, publish, rollback, and spend effects
   - find import-time effects, secret leakage, and non-deterministic discovery
3. **One typed action engine**
   - make one `ActionDefinition` own input schema, exact target, effect/risk,
     plan/approval/apply/verify behavior, typed result, artifacts, and receipts
   - make CLI, MCP, API, console, scheduler, and agents thin adapters over that owner
   - delete raw argv handlers, duplicate effect vocabularies, nested Commander parsing,
     output interception, process-exit capture, and CLI-output parsing
   - expose every provider capability as a manifest-declared typed leaf action
   - extract typed inventory, plan, policy, approval, receipt, drift, redaction, artifact,
     and command-result contracts without Commander or provider SDKs
   - define and prove explicit secret, artifact, approval, and lock ports plus durable
     automation composition
4. **Independent product CLIs and generic pack protocol**
   - give Framework and Ops separate binaries; the accepted target is Framework
     `unisane`, Ops `unisane-ops`, and Framework scaffolder `create-unisane`
   - introduce non-executable JSON manifests, trust/integrity/collision validation, and
     exact lazy handler loading
   - make the host load accepted exact handlers generically after explicit trust
     admission instead of switching on package, provider, or product identity
5. **Cloud proof**
   - establish Cloud, AWS, and Cloudflare boundaries
   - migrate one coherent capability fully and delete its old implementation
6. **Web Runtime**
   - consolidate tracking, conversions, SEO, adapters, framework peers, and testing behind
     one subpath-exported package with public migration notes
   - keep persistent public URL/slug/redirect identity in Framework
7. **Growth proof**
   - establish Growth and Google boundaries against the completed Web Runtime contracts
   - migrate GTM, analytics, SEO, ads, reports, recommendations, and headless console state
     in bounded slices
   - retire Meta management, migrate it under an admitted contract, or separately approve
     `@unisane/provider-meta` before cleanup closes
8. **Framework integration and cleanup**
   - make the optional Ops-owned adapter consume a schema-versioned serialized project
     descriptor, remain outside the default Ops install, and declare zero Framework npm
     dependencies
   - do not re-expose Framework developer commands through Ops
   - move compilation to `@unisane/compiler`; retain CLI/watch/scaffold/doctor behavior
     in Devtools
   - move remote billing/provider behavior to typed Ops actions, delete dead UI stubs,
     and delete remote env placeholders until a provider owner is admitted
   - delete generic Ops code, parallel config loaders, duplicate command owners, and
     dependency leakage from Framework surfaces
9. **Repository-readiness handoff**
   - produce the verified Ops source/API/package/audit readiness receipt
   - let the ecosystem repository-separation plan exclusively own history, remotes,
     visibility, authority flip, and public release cutover

## Verification

The finding remains open until all of these are true:

- Framework and Ops expose separate product binaries with no CLI-to-CLI delegation
- the default Ops dependency graph and optional Framework adapter declare no Framework
  package dependency
- `unisane`, Ops engine, Cloud, and Growth declare no provider SDK dependencies
- provider SDKs exist only in the selected provider-family packages
- the Ops engine can typecheck and test without Commander, Framework, or provider SDKs
- every pack manifest names typed leaf actions and the host contains no provider/product
  handler switch
- raw argv, nested Commander, stdout/stderr interception, process-exit capture, and
  parsed CLI-output APIs have zero production residue beneath the CLI adapter
- JSON manifests reject unsupported/untrusted/integrity-mismatched versions, reject
  namespace/id/config/capability collisions, and cannot scan/download/auto-execute code
- secret, artifact, approval, and lock ports have contract tests; CI/multi-process
  automation proves one durable composition with no local/in-memory fallback
- every migrated command passes effect, human/JSON output, exit, redaction, and parity
  tests
- remote mutation passes plan freshness, identity, approval, lock, receipt, replay, and
  drift tests
- plain Node/Next fixtures use Cloud, Growth, and Web Runtime without Framework
- Growth uses only `@unisane/web-runtime/contracts`, provider packages use only exact suite
  `/contracts` subpaths, and suites do not import provider packages
- optional Framework context works from a versioned serialized descriptor; Ops core,
  Framework runtime, Compiler, and Devtools do not import the opposite product
- old command registrars, config loaders, artifact writers, dependencies, exports, and
  docs are removed for migrated slices
- no generic Meta management/reporting path remains as terminal legacy in Devtools
- Web Runtime subpaths pass browser/server, optional peer, package-content, and
  clean-install tests
- standalone extraction passes secret, customer-data, provenance, license, package, and
  registry install audits; public release remains separately gated
- canonical docs/index/reference checks and workspace architecture/type checks pass
- the implementation workpacks are archived and older plans are archived or narrowed
  after their durable content is promoted

Archived P116 workpacks record the exact implementation checks, replacement proof, and
permanent ownership gates for completed slices. Every later bounded workpack must extend
that executable proof for its own source and compatibility boundary rather than relying
on this finding alone.

## Closure Evidence Required

Before setting this finding to `done`, record:

- the final package and repository tree
- exact private or public package versions where separately authorized and migration
  guides for real stable releases only
- separate product-binary proof
- dependency and clean-install reports
- command/manifest/config/artifact compatibility test results
- provider mutation-security test results
- non-Framework and Framework fixture results
- zero-residue inventories for old Devtools, config, web-package, and command paths
- links to archived execution workpacks and convergence receipts

## Linked Docs

- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/standards/12-provider-control-plane-baseline.md`
- `docs/work/plans/unisane-ops-product-architecture-and-extraction-plan.md`
- `docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md`
- `docs/decisions/D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md`
- `docs/decisions/D-20260815-framework-release-units-compatibility-bom-and-registry-proof-contract.md`
