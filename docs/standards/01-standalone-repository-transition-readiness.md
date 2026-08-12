---
id: 'DOC-c63e12f679d9'
owner: 'unisane-ops'
scope: unisane-ops
role: standard
lifecycle: durable
authority: canonical
provenance: accepted
view: transition
status: accepted
lastUpdated: '2026-08-11'
---

# Standalone Unisane Ops Repository Transition Readiness

## Changelog

- `2026-08-11`: Added the permanent fail-closed Ops console UI consumer release-boundary verifier,
  exact authored/emitted inventory, and seven unresolved conversion preconditions without changing
  package coordinates or authority.
- `2026-08-09`: Executed the approved history filter in a disposable candidate, certified exact
  current-tree parity and Git cleanup, completed deterministic full-history technical scanning,
  staged proof-only standalone CI corrections, and retained public promotion as fail-closed on
  redacted findings and owner decisions.
- `2026-08-09`: Froze the no-shadow source-convergence checkpoint, removed private CLI-core and
  Framework source/config edges, staged inert target-local repository declarations, and defined
  exact generated boundary, history, and safety specifications.
- `2026-08-09`: Corrected pre-cutover lockfile and Skopos sequencing, registered the temporary
  umbrella child Memory Scope, and bound its docs to canonical validation.
- `2026-08-09`: Established the source-bound candidate inventory, target repository shape, blocker
  ledger, zero-residue dispositions, and one-authority gates before any extraction or filtered
  shadow.

## Purpose And Authority

This Standard defines when the staged `unisane-ops/**` product boundary is eligible for standalone
source convergence, local history-shadow proof, remote authority, package release, and production
deployment. It is the target-local transition owner; it does not redefine product behavior,
provider-operation safety, or Framework architecture.

Until authority flips, the umbrella repository remains the sole writable source and Skopos execution
authority. The temporary umbrella child Scope `unisane-ops` makes `unisane-ops/docs` current
owner-local Project Memory for transition work; it is not an independent target Skopos authority.
The following umbrella documents are controlling inputs:

- `docs/standards/13-unisane-ops-product-architecture-baseline.md`
- `docs/standards/12-provider-control-plane-baseline.md`
- `docs/decisions/D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md`
- `docs/work/plans/unisane-ops-product-architecture-and-extraction-plan.md`
- `docs/work/plans/unisane-ecosystem-repository-separation-and-git-governance-plan.md`
- `unisane-infrastructure/repository-system/manifests/unisane-ops.json`

Those path strings are source coordinates, not permission to retain cross-repository relative links
after cutover. Owner-local truth moves or is rewritten once, and the old full copy stops being
writable.

## Truth Labels

This document uses exact labels:

- **Fact**: observed at the recorded source commit by a reproducible read-only command.
- **Accepted contract**: already selected by a canonical Standard, Decision, Plan, or
  repository-system manifest.
- **Recommendation**: the safest proposed implementation; it is not approval.
- **Owner decision**: an accountable human or canonical owner must resolve it.
- **Blocker**: the affected gate fails closed until source-bound Evidence proves closure.

A recommendation never satisfies an owner decision. A current file, test, package field, or
deployment manifest never promotes itself into public or production approval.

## Evidence Freeze

The inventory was read from umbrella `dev` commit `bac6eee22e4288ce6b1c743a34eab7fb06cbac78` before
these three target-local documents were added. It contains 921 tracked paths under `unisane-ops/**`;
the sorted `git ls-files -s unisane-ops` digest is
`62d35b6a7b493be90eef255f2d1f7dce035d7c70b855d00f910032b92e458b3e`. The Task adds only this router,
overview, and Standard to that candidate boundary.

Evidence commands are read-only and source-bound. These observations remain the audit baseline; the
later source-convergence checkpoint is recorded separately below.

| Evidence                        | Command or source                                                         | Observed result                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1 source                       | `git rev-parse HEAD`; ancestor check against `bac6eee22`                  | exact required base `bac6eee22`; clean detached base before the audit branch                                                                                                     |
| E2 tracked boundary             | sorted `git ls-files -s unisane-ops`                                      | 921 paths; digest above; no submodule or symbolic-link entries                                                                                                                   |
| E3 owners                       | tracked-path grouping by the first three path segments                    | 748 package, 133 app, 30 deploy, 9 plugin, and 1 local marketplace path                                                                                                          |
| E4 manifests                    | all tracked `unisane-ops/**/package.json` files                           | 14 package/app manifests: 13 non-private and one private hosted runtime                                                                                                          |
| E5 dependency graph             | package manifest dependency sections across the workspace                 | four cross-repository coordinate families enter Ops; fifteen external manifest edges consume Ops packages                                                                        |
| E6 working-tree content         | ignored/untracked status, extension inventory, `file(1)`, and Git modes   | no ignored/untracked candidate files, binary files, nested Git roots, submodules, or symlinks observed                                                                           |
| E7 size                         | `git ls-tree -r -l HEAD unisane-ops`                                      | one file above 100 KiB: `packages/growth/src/console/build-state.ts` at 115,760 bytes; no binary object observed                                                                 |
| E8 direct history               | `git log --all -- unisane-ops`                                            | 16 commits from `4c9eab6e` through `4c4e15c7`; ordered commit digest `810fa5926553e277341e489f36d3bd45308e1eb545706e6e982d77c572f148b5`; no repository tags exist                |
| E9 ancestry clues               | rename/copy detection at the staging introduction                         | 507 detected moves/copies from earlier Tooling/Web roots and 91 added paths; detection is evidence, not the final filter specification                                           |
| E10 current secret heuristic    | high-confidence token/private-key patterns over tracked candidate content | zero matches for the bounded rules used                                                                                                                                          |
| E11 direct-path patch heuristic | the same high-confidence patterns over `git log -p --all -- unisane-ops`  | zero matches; this is not a complete imported-history, entropy, privacy, or license scan                                                                                         |
| E12 public/legal state          | repository-system manifest plus package metadata                          | public distribution, license, NOTICE, contributor terms, asset rights, registry, CODEOWNERS, security, signing, deployment, and target authority remain unapproved or unresolved |

## Exact Current Candidate Boundary

### Tracked owners

At E1, the exact tracked staging boundary is:

| Current owner                     | Paths | Disposition                                                                                                                       |
| --------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/plugins/**`              |     1 | keep only as an admitted target-local marketplace source; never as host or workflow authority                                     |
| `apps/console/**`                 |   103 | keep as an Ops presentation app; public package and deployment status remain blocked                                              |
| `apps/hosted-runtime/**`          |    30 | keep as the private modular-monolith composition boundary; never publish as a public package without a new admission              |
| `deploy/hosted/**`                |    30 | keep only if an accountable deployment owner accepts the environment-neutral manifests and production gates                       |
| `packages/cloud/**`               |    19 | keep as accepted public package `@unisane/cloud`                                                                                  |
| `packages/framework-ops/**`       |     9 | keep as accepted public package `@unisane/framework-ops`, dependent only on released Framework integration contracts              |
| `packages/growth/**`              |   426 | keep as accepted public package `@unisane/growth`                                                                                 |
| `packages/hosted-postgresql/**`   |     8 | keep implementation source; decide internal versus public package before release                                                  |
| `packages/ops-engine/**`          |    31 | keep as accepted public package `@unisane/ops-engine`                                                                             |
| `packages/ops-mcp/**`             |    18 | keep the admitted local MCP adapter; decide public package admission before release                                               |
| `packages/provider-aws/**`        |    35 | keep as accepted public package `@unisane/provider-aws` after removing the foreign CLI-core edge                                  |
| `packages/provider-cloudflare/**` |    10 | keep as accepted public package `@unisane/provider-cloudflare`                                                                    |
| `packages/provider-google/**`     |    66 | keep as accepted public package `@unisane/provider-google` after removing the foreign CLI-core edge                               |
| `packages/provider-meta/**`       |    13 | keep as accepted public package `@unisane/provider-meta`; unimplemented connection/CLI claims remain fail-closed product behavior |
| `packages/unisane/**`             |    36 | keep as accepted public `unisane` package and sole `unisane` binary owner                                                         |
| `packages/web-runtime/**`         |    77 | keep as accepted public package `@unisane/web-runtime`                                                                            |
| `plugins/unisane-ops/**`          |     9 | keep as the thin current private Codex distribution source; public plugin admission remains separate                              |

The readiness audit added `docs/00-start-here.md`, `docs/overview.md`, and this Standard. The later
no-shadow convergence checkpoint and its exact additional paths are owned by the generated
disposition ledger rather than this historical table.

### Canonical public package set

The accepted public package contract contains exactly:

| Audience    | Packages                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| user-facing | `unisane`, `@unisane/cloud`, `@unisane/growth`, `@unisane/web-runtime`                                                                                         |
| technical   | `@unisane/ops-engine`, `@unisane/provider-aws`, `@unisane/provider-cloudflare`, `@unisane/provider-google`, `@unisane/provider-meta`, `@unisane/framework-ops` |

The accepted extraction Plan classifies `@unisane/ops-console` as a public-source deployable app,
not a registry package. Its staging manifest is therefore private. `@unisane/ops-hosted-runtime`
remains explicitly private.

**Owner decisions:** Neither existing authority nor current package metadata admits
`@unisane/ops-mcp` or `@unisane/ops-hosted-postgresql` to the public registry package set. Their
current non-private manifests are preserved as factual staging state, not an admission. Product and
release owners must select public package, private workspace package, app-internal source, or
deletion after consumer migration before release.

### Apps, deploy, plugins, and tools

- The console is Ops-owned presentation over Growth/engine state. It does not own readiness,
  actions, approvals, or provider behavior.
- The hosted runtime is a private composition boundary. Gateway, worker, scheduler, migration, and
  probe commands share one OCI artifact contract, but checked-in source does not certify a
  production environment.
- `deploy/hosted/**` contains environment-neutral Compose/Kubernetes/PostgreSQL/release proof
  inputs. Environment desired state, live identities, secret values, registry credentials, KMS
  policy, DNS, and company topology remain Infrastructure or owning- product state and must not
  enter the public repository.
- The local Codex marketplace and plugin contain thin distribution metadata and Skills. They remain
  adapters over the one MCP/action owner and cannot become authorization, Evidence, approval, or
  workflow authorities.
- The current Ops-specific root gates are
  `scripts/commands/architecture/ops-package-boundary-check.mjs`,
  `scripts/commands/architecture/ops-ai-host-plugin-check.mjs`, and their tests. Their corresponding
  Skopos Actions/Guards are under `tools/skopos/**`. Convergence moves or rewrites only these
  target-owned responsibilities into repo-local `scripts/**`, `tests/**`, and `tools/skopos/**`.
- Umbrella reference generators, lint/build configuration, package metadata registries, workspace
  configuration, and lockfile are mixed owners. Split the Ops behavior or regenerate owner-local
  equivalents; never copy the umbrella versions wholesale.

## Dependency And Consumer Inventory

### Internal and cross-repository first-party edges

All accepted internal `workspace:*` edges may remain only inside the final Ops workspace. The
following current edges cross the intended repository boundary:

| Consumer                   | Current dependency                              | Final rule                                                                        | Gate                                                                                                                                                        |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@unisane/ops-console`     | `@unisane/ui`, `@unisane/data-table`            | consume released or immutable admitted UI candidates; no sibling source           | UI package visibility/release is unresolved; block shadow certification                                                                                     |
| `@unisane/framework-ops`   | `@unisane/devtools@0.1.0`                       | consume the exact admitted semver-governed `./framework-integration` subpath only | converged; package-owned source, packed runtime/declaration, and root architecture proof reject workspace/file/link fallbacks and private Devtools surfaces |
| `@unisane/provider-aws`    | provider-local dependency-free output adapter   | retain provider-owned presentation with no private Tooling dependency             | converged; focused package proof required                                                                                                                   |
| `@unisane/provider-google` | provider-local dependency-free output adapter   | retain provider-owned presentation with no private Tooling dependency             | converged; focused package proof required                                                                                                                   |
| `unisane` host             | dynamically resolves UI-owned `@unisane/ui-cli` | keep discovery-only structural pack contract; never depend on UI source           | require a released/admitted UI CLI candidate and trust/compatibility proof                                                                                  |

The accepted Framework bridge is the only Framework integration. Do not pull Framework compiler
modules, UI source, root Devtools, `create-unisane`, or unrelated Framework product tooling into Ops
to make a standalone build pass.

### Current manifest consumers outside Ops

At E1, the exact external package-manifest consumers are:

| Consumer owner                                      | Ops dependencies                                     |             Current edges |
| --------------------------------------------------- | ---------------------------------------------------- | ------------------------: |
| `unisane-platforms/apps/data-entry-lm`              | `@unisane/growth`, `@unisane/web-runtime`, `unisane` |     3 `workspace:*` edges |
| `unisane-platforms/apps/invoice-platform`           | `@unisane/web-runtime`                               |      1 `workspace:*` edge |
| `unisane-platforms/apps/true-resume`                | `@unisane/growth`, `@unisane/web-runtime`, `unisane` |     3 `workspace:*` edges |
| Framework starter sources `api-only` and `saaskit`  | `@unisane/framework-ops`, `unisane`                  |     4 `workspace:*` edges |
| `create-unisane` templates `api-only` and `saaskit` | `@unisane/framework-ops`, `unisane`                  | 4 declared `^0.1.0` edges |

That is fifteen manifest edges. Platforms also contain direct source imports of Growth, Web Runtime,
and `unisane/config`; these are consumers, not migration source. The Framework starter/template
release graph must prove that Ops can consume released Devtools while Framework consumers consume
released Ops packages without a sibling workspace or circular unpublished release.

Consumer migration happens in each owning repository after immutable Ops candidates exist. This
audit does not rewrite consumers.

## Generated, Cache, Secret-Like, Fixture, And Binary Observations

### Tracked and generated content

- No `dist`, `coverage`, `node_modules`, `.turbo`, `.skopos`, `.unisane`, ignored, or untracked
  content was observed under the candidate at E1.
- `pack.manifest.json`, `core.manifest.json`, `unisane.meta.json`, plugin metadata, Skills,
  deployment YAML/HCL, tests, and fixtures are tracked source inputs. Generated downstream
  references must be regenerated by target-local owners; they are not copied from umbrella caches.
- Runtime inventories, plans, receipts, locks, reports, OAuth state, provider account data, and
  local history catalogs remain ignored/private by default. Only explicitly reviewed redacted
  fixtures or summaries may be tracked.
- `.skopos/**` is always regenerated machine-local state. It is not imported history or a second
  Task authority.

### Security and data observations

- The bounded high-confidence current-tree and direct-path patch scans found no private key, AWS
  access-key, GitHub token, Google API-key, Stripe live-key, or Slack-token signature. This is
  preliminary negative Evidence, not a public-history clearance.
- Four Meta Ads JSON fixtures contain provider-shaped `accountId` and response data; one fixture
  also contains URL-shaped values. No email-shaped values were detected by the bounded fixture
  observation. Provenance, de-identification, provider-term, and redistribution review is still
  required.
- Source files that implement credentials, OAuth, tokens, plans, receipts, locks, inventories, and
  reports are legitimate product contracts or tests. Their names do not prove that values are safe;
  the exact import set and every fixture must be scanned.
- No binary file was observed. The 115,760-byte Growth console source file is the only object above
  100 KiB and is a maintainability observation, not a binary/history blocker by itself.

### Required full-history safety proof

Before a public shadow or public-history push, run approved scanners over every blob in the final
imported commit set for secrets, entropy, customer/provider data, personal data, binaries/large
objects, generated output, dependency and source licenses, asset rights, emails, and unsafe paths.
Report only redacted rule/path/receipt summaries. Rotate any exposed credential before rewriting or
publishing history. A scrub or omitted history segment requires an accountable decision and
provenance receipt; silence is not proof.

## History And Provenance Contract

The direct `unisane-ops/**` path has 16 observed commits, no tags, and begins at the staging
introduction `4c9eab6e`. Rename/copy detection at that introduction associates current source with
these earlier roots:

| Historical source family                                  | Detected moves/copies into staging |
| --------------------------------------------------------- | ---------------------------------: |
| `unisane-tools/packages/devtools/**`                      |                                396 |
| `unisane/packages/foundation/web-*`                       |                                 60 |
| `unisane/packages/adapters/web-conversions-google-ads/**` |                                 16 |
| `unisane/packages/adapters/tag-manager-google/**`         |                                 15 |
| `unisane-tools/packages/unisane/**`                       |                                 12 |
| `unisane/packages/adapters/web-conversions-meta-capi/**`  |                                  8 |

The detection threshold and Git rename limit make those counts ancestry clues, not an approved
filter. Some current files were newly authored in staging and others may have origins not detected
by similarity. Therefore the repository-system manifest's current single history source
`unisane-ops` is insufficient as a complete provenance specification.

The convergence Task must create a versioned exact include/rename/exclude specification,
representative `--follow` proofs, old-to-new commit map, author/date/merge preservation checks, tag
decision, omitted-history ledger, public-history scan receipt, and content comparison. History
filtering runs only in a disposable clone after source freeze. It never runs in the active worktree
or sole clone, and this Standard does not authorize it.

The verified shadow later owns `docs/repository-provenance.json` with source and target commits,
filter/tool versions and digests, mappings, tag policy, redacted audit receipt ids, and verification
commands. Do not create that file before real filter Evidence exists.

## Standalone Repository Shape

The recommended final extracted root is:

```text
unisane-ops/
├── packages/                 # admitted public and private workspace packages
├── apps/                     # console and private hosted composition
├── deploy/                   # admitted environment-neutral deployment contracts
├── plugins/                  # thin admitted AI-host distributions
├── examples/                 # passing owner-local adopter examples only
├── docs/                     # owner-local Project Memory and provenance
├── scripts/                  # Ops-owned conventional checks/build/release helpers
├── tests/                    # repository-level package/adopter/deployment proof
├── tools/skopos/             # reviewed local Actions/Guards only
├── .agents/                  # admitted local marketplace metadata if retained
├── .github/                  # local CI, CODEOWNERS, security and release workflows
├── AGENTS.md
├── skopos.config.yaml
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── minimal TypeScript, lint, format, test, build, release, ignore, and editor config
```

Omit empty roots. `deploy/**` and AI-host/plugin roots remain only after their accountable owners
and public/private classifications are resolved. There is no nested Git root, submodule,
sibling-source link, shared checkout authority, or copied company-control configuration. This is the
post-extraction target shape, not permission to create a target `pnpm-lock.yaml` or activate
target-local Skopos inside umbrella staging.

## Minimal Tooling, Lockfile, And CI

### Accepted foundation input

The repository-system manifest selects Node `24.13.0`, `pnpm@10.26.0`, Corepack, workspaces,
TypeScript, ESLint, Prettier, Vitest, Turbo, and Changesets. The console now hard-cuts to Node
`>=24.13.0`, matching the staged root engine and `.node-version` with no compatibility floor. Other
current package engines still span Node `>=18.17.0`, `>=20.0.0`, and `>=22.13.0`.

**Owner decision:** Confirm the supported Node/runtime matrix for the remaining packages and whether
their engines match the repository toolchain floor or a deliberately broader tested consumer floor.
The console decision does not admit a broader matrix. Record later decisions in root policy, package
metadata, CI matrix, images, and clean-install proof.

### Conventional repository contract

The target must provide ordinary contributor commands independent of Skopos:

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm package:check
```

The exact script names may follow the accepted manifest, but each command must be a real repo-local
capability. The lockfile is generated from only the target workspace and released external packages;
it contains no sibling `workspace:*`, `file:`, `link:`, or absolute locator. Shared umbrella config
is reduced to the settings actually required by Ops packages, apps, plugins, and deploy proof.

During pre-cutover umbrella staging, the umbrella root lockfile remains the sole install authority
and umbrella Skopos remains the sole migration and execution authority. A source-convergence Task
may stage target-owned package/workspace/config/CI declarations and reviewed Action/Guard source
declarations under `unisane-ops/**`, but it must not create `unisane-ops/pnpm-lock.yaml`, initialize
or activate an independent target Skopos authority, or claim standalone install proof. Generate and
verify the target lockfile, and initialize and test target-local Skopos, only in a disposable
extracted proof checkout or filtered shadow. Because the proposed next convergence Task creates no
shadow, those proof steps belong to the later shadow Task.

CI uses immutable/frozen install and least privilege. Pull-request lanes are credential- free and
cover lint, typecheck, unit/contract tests, build, package contents, generated drift,
secret/security checks, and license policy. Provider, container, release, and deployment integration
lanes are explicit, isolated, and never run with writable credentials on untrusted code. Release
workflows use approved trusted publishing/OIDC, provenance, SBOM, immutable artifacts, and protected
environments; no long-lived token is copied from the umbrella.

Skopos selects and records these commands for maintainers and agents. It does not hide or replace
them.

## Package, Release, And Deployment Boundaries

### Package release

Before any package release:

1. resolve the exact public/private/internal disposition of all 14 current manifests
2. align package `repository`, `homepage`, `bugs`, `license`, `publishConfig`, files, exports, Node
   policy, and access with the final repository and approved legal state
3. prove public exports, types, pack/action/config schema versions, package contents, packed clean
   installs, CLI installation, Framework bridge use, Web Runtime Node/Next use, and applicable
   upgrade/migration journeys outside the umbrella
4. remove every cross-repository workspace/source link and prove released or immutable candidate
   dependencies
5. select semver/release grouping, changelog, deprecation, compatibility, support, and
   trusted-publisher owners

The current `unisane` manifest points at the Framework repository, while the remaining publishable
manifests omit final repository/support metadata. Their `MIT` strings do not override the unapproved
legal manifest. Publication stays blocked.

### Deployment

Package release and deployment are separate gates. The private hosted runtime, console, PostgreSQL
adapter, OCI build inputs, and Kubernetes/Compose source do not identify the real registry,
environment, account, identity, state, KMS, DNS, observability, recovery, privacy, incident, SLO, or
cost owner.

**Owner decisions:** Determine whether Ops owns a hosted production service now, which repository
owns each deployable and environment declaration, whether the console is local-only or hosted, and
whether `@unisane/ops-hosted-postgresql` is public technical distribution or private composition.
Until those decisions and production Evidence exist, production deployment is blocked and deploy
source remains non-authoritative.

## Public Legal, Security, And Contributor Prerequisites

Public visibility is not a license grant. The repository-system manifest marks license, NOTICE,
contributor terms, asset rights, and public distribution unapproved. Therefore:

- do not invent or materialize a `LICENSE`
- do not rely on current package `MIT` fields as approval
- obtain accountable selection of repository and package licensing and exact approved text
- add approved `NOTICE`, third-party attribution/dependency-license reports, and asset/
  fixture/provider-term provenance
- select contributor terms such as DCO or CLA, contribution policy, code of conduct, authorship
  treatment, and support/security contacts
- prove public-history rights for every imported source family and contributor
- add a security policy, private vulnerability channel, ownership/recovery, CODEOWNERS,
  dependency/security scanning, release signing, provenance, and SBOM policy

Any unresolved legal entity, source or asset right, contributor right, provider term, secret/data
finding, security owner, or recovery owner blocks public history and release.

## Docs And Skopos Migration

Ops ultimately owns the provider-safety and Ops-product Standards, accepted Ops Decisions, active
Ops Findings and Plans, provider/pack/API/config/command/security guides, applicable generated
references, and this target-local router. Convergence must give every active or durable umbrella
document one exact `move`, `rewrite`, `split`, `archive`, `delete`, or `block` disposition. Do not
bulk-copy unrelated Task archives.

Rebuild a concise target-local `AGENTS.md`, tracked `skopos.config.yaml`, local Scopes, applicable
policy/Skill bindings, and reviewed Actions/Guards backed by actual repo-local commands. Begin as an
existing-project Skopos adoption: dry-run and assess before any reviewed
propose/approve/verify/activate restructuring. Strict metadata, links, retrieval, session context,
Task reconstruction, Actions, and Guards must resolve only target-owned paths.

Before extraction, `unisane-ops` is a temporary child of the umbrella `workspace` Scope with path
`unisane-ops` and Memory root `unisane-ops/docs`. In the disposable extracted proof checkout,
existing-project adoption rewrites that registration to the standalone repository root and proves
retrieval there. At cutover, retire the umbrella child Scope with the old writable product tree;
never retain both Scope registrations as current authority.

The umbrella Skopos Task remains the migration authority through shadow preparation. Target-local
Skopos may be initialized and tested only in the disposable extracted proof checkout or shadow, and
admits no ordinary feature work until the authority flip. `.skopos/**`, sessions, databases,
indexes, locks, caches, Action runs, and conversation capsules are regenerated locally and never
copied as authority.

## One-Writable-Authority Cutover

The persisted progression is:

```text
umbrella-authoritative
  -> target-shadow-verified
  -> target-authoritative
  -> umbrella-copy-archived
```

1. Freeze the converged umbrella source and exact candidate inventory.
2. Create a disposable filtered shadow and prove history, standalone tooling, packages, docs,
   Skopos, security, and public-history safety without external mutation.
3. Resolve owner, recovery, visibility, branch/ruleset, CODEOWNERS, CI, registry, license, security,
   package, and deployment decisions in separately authorized work.
4. Record a tracked cutover receipt with source/filter/provenance digests, target commit,
   verification, active-work dispositions, and rollback.
5. Freeze umbrella writes for Ops, activate target-local Skopos and the target remote as the sole
   writable authority, then update consumers through released candidates.
6. Archive the umbrella copy and migration authority. Never keep both product trees writable or use
   the old path as a fallback.

Remote creation, push, visibility change, publication, deployment, DNS/provider mutation,
credentials, and source deletion each require their own admitted approval. This Standard grants none
of them.

## Zero-Residue Dispositions

Source convergence is complete only when every row reaches its final state:

| Current surface                                                                           | Required final disposition                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unisane-ops/**` staging source                                                           | filter and rename to target root after convergence; preserve admitted history                                                                                                   |
| `unisane-tools/packages/cli-core/**`                                                      | absorb only required Ops presentation contracts under the CLI owner, remove provider logging coupling, migrate remaining consumers, then delete the package                     |
| `unisane-tools/packages/devtools/src/framework-integration.ts`                            | remain Framework-owned public subpath consumed by released `@unisane/framework-ops`                                                                                             |
| remaining Devtools provider/growth compatibility source                                   | retire after exact consumer/parity proof; do not import generic Devtools into Ops                                                                                               |
| UI packages and `@unisane/ui-cli`                                                         | remain UI-owned and consumed only as released/admitted external contracts                                                                                                       |
| Framework starters/templates                                                              | remain Framework-owned consumers; migrate from workspace edges to released/admitted Ops candidates                                                                              |
| Platforms apps/config                                                                     | remain private consumers; migrate from workspace edges after public candidate proof                                                                                             |
| root `config/aws.ops.ts`                                                                  | split only reusable redacted schemas/examples into Ops; keep account topology, desired state, policy bindings, and all values private with Infrastructure or the owning product |
| root Ops gates/tests/Skopos declarations                                                  | move or rewrite the exact Ops-owned capability into target-local scripts/tests/Actions/Guards                                                                                   |
| root docs and generated references                                                        | move/rewrite/split by canonical owner; regenerate target references; leave no full dual-writable SSOT                                                                           |
| root workspace, lockfile, build/lint/test/release config                                  | rebuild minimal target-local owners; do not copy umbrella package graph or credentials                                                                                          |
| `.skopos`, `.unisane`, caches, artifacts, provider state, plans, receipts, reports, locks | ignore/regenerate or store in approved private systems; never import into public history                                                                                        |
| Infrastructure repository-system and company control plane                                | remain private Infrastructure-owned inputs; product repo imports neither implementation nor company desired state                                                               |

Zero residue means no duplicate binary, command, config loader, provider implementation, artifact
writer, full canonical doc, source import, package workspace edge, writable Task, or release/deploy
authority survives in both repositories. Historical recovery in the archived umbrella Git is
allowed; a filtered current fallback is not.

## No-Shadow Source-Convergence Checkpoint

Task `T-287702f0` converges source from certified umbrella `dev` commit
`50f13fcc35e95aad3b8ad3c5dc7b271810946a34`. Its generated source disposition ledger covers every
concrete target file except Skopos-managed Task artifact patterns and records every matching
canonical umbrella docs surface and declared root/tool/config disposition. The detailed ledger,
exact history specification, and safety specification are controlled Infrastructure audit Evidence,
not target repository outputs. Their frozen digests remain source-bound under receipt ID
`OPS-EXTRACTION-T-b222cdbf`; they must not enter a future public current-path filter.

The checkpoint establishes these facts:

- the 14 app/package manifests contain ten accepted public packages, two accepted private apps, and
  two unresolved registry-admission owner decisions;
- AWS and Google no longer import or depend on private `@unisane/cli-core`; each owns a
  dependency-free provider presentation adapter, with no compatibility export, alias, shim, or
  fallback;
- all package/app TypeScript configurations extend the staged target-local base rather than
  Framework source, and no foreign relative source/config path remains;
- the exact smallest foreign workspace blocker set is three edges: the console's edges to private
  `@unisane/ui` and `@unisane/data-table`, plus the Framework bridge edge to `@unisane/devtools`
  that the root-owned umbrella architecture gate still requires; the dynamic UI CLI discovery
  contract also awaits an immutable UI-owned candidate;
- the target-local package/workspace/TypeScript/lint/format/test/build/release/CI and reviewed
  Skopos Action/Guard source declarations are staged under `unisane-ops/**`; they neither add a
  target lockfile nor activate target Skopos in the umbrella;
- the sole umbrella `pnpm-lock.yaml` removes only the two retired CLI-core importer edges and
  remains the pre-cutover install authority; target lockfile generation is still deferred to
  disposable extracted proof;
- the controlled history filter specification freezes 507 source-to-target lineage mappings and 91
  direct additions, with explicit include/rename/exclude, tag, tool, and provenance receipt
  requirements; it was not executed;
- the controlled public-safety scan specification defines the complete commit/blob/ref input,
  required detector categories, fail-closed rules, and redacted receipt; it was not executed and
  grants no public-history approval.

No shadow, filtered history, target lockfile, target Skopos state, remote, release, consumer
cutover, or external mutation is part of this checkpoint.

## Disposable Extraction Technical Proof

Task `T-b222cdbf` used exact integrated umbrella `dev` commit
`616344017db70385d966d3b4a0197614b5b1bca3` as its immutable filter input. The approved freeze
checkpoint remained `50f13fcc35e95aad3b8ad3c5dc7b271810946a34`; the integrated filter and safety
specification digests are recorded under controlled receipt ID `OPS-EXTRACTION-T-b222cdbf`. The
proof exists only at `/tmp/unisane-ops-extraction-T-b222cdbf/repository`. It is disposable Evidence,
not a final repository, remote, or writable authority.

The technical extraction established these facts:

- `git-filter-repo` executable version `a40bce548d2c`, executable digest, callback digest, 507
  source-to-target mappings, 481 unique historical origins, 91 direct additions, and the complete
  503-entry source-to-filtered commit map are frozen in the controlled audit bundle;
- filtered base `a9d3ce795a3cd7ba4fd3a91711f2be2c9436bef6` has exact content and mode parity across
  951 current paths with source commit `616344017`; 1,036 filtered historical paths contain zero
  excluded paths;
- the corrected staged CI uses `pnpm/action-setup` before `actions/setup-node` requests pnpm
  caching, keeps frozen install after both setup steps, and aligns the repository-system manifest
  and root typecheck implementation on `turbo run check-types`;
- the target-local generated check owns an exact one-file generated-output allowlist and rejects
  every additional `docs/reference/generated/**` path; detailed transition and audit receipts are
  not target generated outputs;
- overlay tip `f6de44d92b95413bafb52607a7a70cf2ac512791` and tree
  `2f413b92e7e5c0dda857dcfa428b859fda60c248` contain 84 commits, 2,182 reachable blobs, 1,487 trees,
  one local branch, and no admitted tags;
- post-filter cleanup removed filter metadata, remotes, reflogs, alternates, original refs, and
  unreachable objects; strict Git integrity and the clean working tree pass;
- the deterministic technical scan covered every reachable commit, blob, ref, historical path,
  commit message, contributor identity, and the final working tree. Its controlled receipt contains
  1,027 opaque finding identifiers: 1 secret-rule, 958 privacy-rule, 20 binary/size, 43
  generated/cache/provider-state-path, and 5 license/provenance findings. Committed correction
  metadata adds per-category, per-rule, and subject-type counts and digests. A deterministic
  task-local mode-`0600` bundle maps every finding ID to its rule, subject type, blob OID, and
  private historical path/commit locators; no matched value or suspected secret content is written.

Technical scanning is complete; public-history certification is not. Scanner choices, versions,
thresholds, entropy policy, allowlists, every redacted finding, contributor publication, source-copy
provenance, license, NOTICE, assets, fixtures, provider terms, trademarks, signing, remote
governance, and remediation policy require accountable owner approval. The controlled owner-decision
ledger keeps those decisions and the three exact dependency blockers fail-closed.

Detailed receipts, the full commit map, scanner output, private locators, and task-specific
executor/policy sources remain outside `unisane-ops/**` under Infrastructure-owned private audit
control. Only safe receipt IDs, hashes, counts, and summaries belong in target Memory. Durable
receipt validation checks tracked schemas, digests, and fail-closed state without `/tmp`; the
separate task-local live verifier recomputes HEAD/tree, exact refs and reachable object inventory,
strict no-reflog unreachable-object hygiene, cleanup residue, scan aggregates, and the private
bundle.

The staged repository-integrity check is a real deterministic target-local gate. It is not a
substitute for the public-package-product profile's still-missing approved security and license
checks. No target lockfile, clean install, hosted CI run, target-local Skopos activation, public
release, or authority promotion was performed or certified.

## Ops Console UI Consumer Release Boundary

**Fact:** `pnpm check:console-release-boundary` is the permanent target-owned authored consumer
inventory. At Task `T-5bdf44c9` it records 153 UI/DataTable import declarations across 53 console
files: 142 `@unisane/ui` declarations across 50 files and 11 `@unisane/data-table` declarations
across ten files. The inventory contains zero computed loaders and rejects nonliteral `import()`,
`require()`, and `require.resolve()`, private UI producer paths, undeclared package imports, and
unreviewed specifier drift.

**Fact:** after the focused console build, `pnpm check:console-release-boundary:emitted` inspects
runtime JavaScript, declarations, CSS, and assets. The current output contains no bare UI/DataTable
import, one bundled stylesheet, one Material Symbols `@font-face`, and one resolving font asset. The
browser composition root imports Material Symbols, UI, then `@unisane/data-table/styles.css` in that
exact order. The emitted proof binds three DataTable-only selector markers, resolves every local CSS
asset, and rejects retained `@import` rules or private/sibling source escapes.

**Accepted contract:** UI Task `T-b0cfbc09` and snapshot `S-94578b4f2066` are an integrated
technical producer certificate reference only. A fresh producer artifact is required at conversion
time. Ops does not copy its manifest, archive counts, version, license, registry, or publication
truth into this policy.

The source-bound policy keeps five exact preconditions open. The console, staged root manifest, and
`.node-version` now share the exact Node `24.13.0` runtime contract, closing only RB04:

1. replace `@unisane/ui` only with an owner-approved immutable registry coordinate
2. replace `@unisane/data-table` only with an owner-approved immutable registry coordinate
3. approve registry versions, visibility, and access
4. prove an isolated consumer lock, TypeScript/browser build, runtime, CSS/assets, and one
   React/ReactDOM singleton from immutable artifacts
5. obtain explicit legal, security, publication, and consumer-conversion authority

The verifier passes only when that exact blocked state is reproduced; its separate conversion-ready
mode fails while any blocker remains. Green source or emitted proof therefore cannot be mistaken for
permission to change coordinates, publish, or cut over.

## Gate And Blocker Ledger

| ID      | Status                                         | Gate                        | Blocker or closure                                                                                                                                                                                                                                                                  | Required owner/proof                                                                                                               |
| ------- | ---------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| OPS-R01 | closed at checkpoint                           | source convergence          | exact file/docs/tool/root-config disposition is generated from reviewed source policy                                                                                                                                                                                               | Ops maintainers; current ledger check and immutable checkpoint commit                                                              |
| OPS-R02 | closed at checkpoint                           | source convergence          | private CLI-core dependencies and imports are absent from AWS and Google                                                                                                                                                                                                            | Ops maintainers; focused provider and boundary proof                                                                               |
| OPS-R03 | open                                           | local shadow                | console retains exactly two private UI workspace edges; the producer is technically certified, DataTable CSS is composed and bundled, and the Node floor is aligned, but registry/version access, isolated consumer, and legal/release authority preconditions remain open          | UI and Ops release owners; exact five-blocker consumer verifier, approved immutable coordinates, and clean external consumer proof |
| OPS-R04 | closed at integration                          | local shadow                | Framework bridge consumes exact admitted `@unisane/devtools@0.1.0` through `./framework-integration`, with no workspace/file/link fallback or private surface                                                                                                                       | Framework and Ops release owners; package-owned and serial integration proof                                                       |
| OPS-R05 | open                                           | local shadow                | Platforms retain seven `workspace:*` Ops edges                                                                                                                                                                                                                                      | Platforms owner; later consumer Tasks against immutable candidates                                                                 |
| OPS-R06 | open                                           | package release             | console is private; registry disposition of Ops MCP and hosted PostgreSQL remains unresolved                                                                                                                                                                                        | product and release owners; explicit package admission or privatization                                                            |
| OPS-R07 | open                                           | local shadow                | pnpm setup ordering, exact generated-output ownership, standalone integrity, and typecheck declarations are corrected, but target lockfile generation, clean install, Node matrix, hosted CI, security/license gates, and target-local Skopos adoption remain deliberately deferred | Ops tooling owner; approved later materialization proof only                                                                       |
| OPS-R08 | technical execution complete; approval open    | local shadow/public history | exact filter, commit map, parity, excluded-path, ref/tag/signature, integrity, and cleanup receipts pass in the disposable candidate; tool approval and final materialization remain absent                                                                                         | migration owner and reviewer; approve receipts and a new immutable source before materialization                                   |
| OPS-R09 | technical scan complete; certification blocked | public history              | deterministic full-history scan produced 1,027 redacted findings, but scanner policy, findings, allowlists, remediation, security, privacy, and legal approvals are absent                                                                                                          | security/legal/privacy/provider-data owners; resolve redacted ledger and rerun approved scanners                                   |
| OPS-R10 | open                                           | public release              | license, NOTICE, contributor terms, asset/fixture/provider rights, public distribution, package metadata, npm access, and trusted publishing are unapproved                                                                                                                         | legal and release owners; approved text, policy, registry, package and provenance proof                                            |
| OPS-R11 | open                                           | remote authority            | founder/recovery owner, Git identities, target remote, visibility, rulesets, CODEOWNERS, security settings, signed tags, and cutover receipt are unresolved                                                                                                                         | founder/security/migration owners; authenticated reviewed plan/apply Evidence                                                      |
| OPS-R12 | open                                           | production deployment       | console/hosted deployment ownership, registry, identities, KMS, state, migrations, rollback, observability, recovery, privacy, incident/SLO and cost policy are unresolved                                                                                                          | Ops operators and Infrastructure; environment-specific production certification                                                    |
| OPS-R13 | open                                           | authority cutover           | target-local docs/Skopos adoption and every active Task/Memory disposition are not complete                                                                                                                                                                                         | migration and docs owners; strict target-local verification and one-writable-authority receipt                                     |

Every open gate fails closed. No blocker is waived by a recommendation, current green tests, staged
source, or a future remote name.

## Safest Next Bounded Task After Proof Review

No final materialization Task may start until a reviewer accepts the technical receipts and one of
these conditions holds: the two remaining UI dependency blockers are resolved, or an accountable
owner explicitly approves a fail-closed materialization contract that keeps them unresolved without
fallbacks. Security and legal owners must also disposition the redacted scan ledger or explicitly
bound a later non-public local-only proof.

The next authorized route is:

1. review the filter, commit map, parity, cleanup, scan, and owner-decision receipts
2. integrate the proof-overlay CI/integrity/typecheck corrections into umbrella `dev`
3. resolve or preserve `@unisane/ui` and `@unisane/data-table` only through their accountable owners
   and the exact console consumer release-boundary verifier; never invent versions or copy sibling
   source
4. approve scanner, license, NOTICE, contributor, asset, fixture, provider-term, signing, and
   remediation policy, then rerun the complete scan from a newly approved immutable `dev` commit
5. only under a separate approved Task, materialize the final local repository, generate its
   lockfile, adopt target-local Skopos, and prove clean install/CI while preserving one writable
   authority

This section defines sequencing only. It does not authorize final repository creation, lockfile
generation, Skopos activation, remote creation, publication, deployment, or cutover.
