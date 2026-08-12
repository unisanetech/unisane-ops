---
id: 'D-c88570410c60'
owner: 'unisane'
repository: unisane-ops
scope: workspace
role: decision
lifecycle: durable
authority: canonical
provenance: accepted
view: current
status: accepted
---

# D-20260724 Unisane Ops Product, Package, And Repository Boundary Contract

## Changelog

- `2026-08-02`: Removed the Framework aggregate regeneration root. The Framework pack
  now contributes `dev`, `build`, specialist generate/LLM commands, and the sole
  executable compiler at `app compile --write|--check`.
- `2026-07-29`: Applied the later onboarding decision's command refinement:
  `unisane ops init` is the sole existing-project Ops adoption path, bare
  `unisane init` is prohibited, and `create-unisane` remains the Framework scaffolder.
- `2026-07-25`: Implemented the optional Framework Ops static pack, exact core
  reserved-root contributor bindings, and the narrow Devtools integration bridge. The
  canonical catch-all fallback remains bounded to command families not yet ported.
- `2026-07-25`: Recorded the subsequent bounded admission of
  `@unisane/provider-meta`; Meta CAPI remains a separate Web Runtime integration.
- `2026-07-24`: Selected the Unisane Ops product, package, CLI, extension, provider,
  runtime, config, and repository boundaries and scoped their relationship to existing
  Framework decisions; clarified suite names, non-executable manifests, state ports,
  contract-only dependencies, and the separate ecosystem-remote decision.

## Context

Unisane has built reusable cloud, provider, marketing, SEO, analytics, tracking,
conversion, and operations capabilities while finalizing Framework architecture. Their
current location was useful for rapid development, but it is not the correct long-term
product boundary.

Current evidence includes:

1. `unisane-tools/packages/unisane/package.json` publishes the `unisane` binary but
   directly depends on `@unisane/devtools`.
2. `unisane-tools/packages/unisane/src/cli.ts` locates and starts the Devtools CLI rather
   than owning a lightweight product CLI.
3. `unisane-tools/packages/devtools/package.json` also publishes the `unisane` binary,
   alongside `unisane-devtools`.
4. Devtools directly depends on eight AWS SDK packages while also owning Framework
   compiler, codegen, starter, LLM, governance, database, UI, provider, growth, and release
   commands.
5. generic web behavior is distributed across `@unisane/web-tracking`,
   `@unisane/web-conversions`, `@unisane/web-seo`,
   `@unisane/web-conversions-google-ads`, and
   `@unisane/web-conversions-meta-capi`.

Leaving these responsibilities together makes the CLI heavy, exposes Framework internals
to non-Framework users, couples provider releases to compiler releases, and hides
standalone capabilities that ordinary websites could use.

## Decision Drivers

- keep the Unisane brand coherent
- make cloud, growth, and web capabilities useful outside Unisane Framework
- preserve one simple CLI and config experience
- keep Framework compilation and runtime architecture independent from generic Ops
- isolate provider SDKs, credentials, and release risk
- avoid package-per-service fragmentation
- support safe human, CI, and agent operation
- preserve explicit plan/approval/apply/receipt/drift safety
- make public extraction and Git visibility deliberate
- use one pre-launch clean cutover across internal and distributable surfaces

## Considered Options

1. Keep all capabilities in `@unisane/devtools` and improve command grouping only.
2. Create one independent package and repository per provider service and specialist tool.
3. Create separate Cloud, Growth, provider, Web Runtime, and CLI repositories immediately.
4. Put Ops behavior inside Unisane Framework foundation/runtime packages.
5. Create one Unisane Ops product monorepo with one CLI, one headless engine, two suites,
   one Web Runtime, provider-family packages, and a narrow Framework integration.

## Decision

Selected option: `5`.

### Product model

Unisane remains the brand. Its product families are:

- Unisane Framework
- Unisane Ops
  - Unisane Ops Cloud
  - Unisane Ops Growth
- Unisane Web Runtime
- Unisane UI

Cloud and Growth are capability suites, not provider aliases. Web Runtime is usable
independently and does not require Ops or Framework at application runtime.

### Repository model

Use these long-term repository boundaries:

- `unisane`: public Framework monorepo
- `unisane-pro`: private reusable commercial Framework extensions
- `unisane-ops`: public Ops monorepo containing CLI, engine, suites, Web Runtime,
  provider packages, and Framework integration
- `unisane-ui`: public UI monorepo
- `unisane-platforms`: private product/reference implementations
- `unisane-site`: public brand/marketing/docs gateway, not product SSOT

The Ops packages remain together because they share a versioned extension protocol,
contract tests, security model, and coordinated extraction. A repository split is a later
governance/release decision, not a naming preference.

The exact six-remote visibility, staging, history, docs-authority, and umbrella-retirement
contract is owned by
`D-20260724-unisane-ecosystem-repository-remote-and-visibility-contract`; this decision
does not create a competing Git cutover path.

### Package model

Public user-facing packages:

- `unisane`
- `@unisane/cloud`
- `@unisane/growth`
- `@unisane/web-runtime`

Technical extension/integration packages:

- `@unisane/ops-engine`
- `@unisane/provider-aws`
- `@unisane/provider-cloudflare`
- `@unisane/provider-google`
- `@unisane/provider-meta`
- `@unisane/framework-ops`

All listed packages have public source in `unisane-ops` and publish to the public package
registry. “Technical” identifies audience and dependency role, not private access.

Do not create a package for every capability, command, UI, or provider service. New
packages require an independent consumer/import surface, optional dependency boundary,
extension contract, runtime/release lifecycle, or security/licensing boundary.

### Provider granularity

Providers split by vendor family:

- AWS owns shared connection/account handling plus S3, CloudFront, Route 53, ACM, SES,
  and SNS.
- Cloudflare owns shared connection/account/zone handling plus DNS, Workers, Queues,
  Cron, and delivery.
- Google owns one Google connection plus GTM, GA4, Search Console, and Google Ads.
- Meta owns one saved connection lifecycle plus Graph discovery/inventory, Ads reports,
  assets, and campaign management.

Shared auth, identity, transport, retry, rate limit, redaction, fixtures, and release
ownership make the provider family the correct boundary. Services stay lazy internal
folders/subpaths.

Cloudflare R2, KV, Turnstile, and broader security operations remain deferred candidates
inside `@unisane/provider-cloudflare`; each requires capability/workpack admission and
does not justify another provider package.

The initial decision deferred `@unisane/provider-meta`. The required separate admission
is now recorded in `D-20260725-unisane-meta-provider-admission-contract`. Meta CAPI
remains at `@unisane/web-runtime/conversions/meta` and is not absorbed by the management
provider package.

### Web Runtime

Converge generic web behavior behind:

- `@unisane/web-runtime/tracking`
- `@unisane/web-runtime/tracking/react`
- `@unisane/web-runtime/tracking/next`
- `@unisane/web-runtime/contracts`
- `@unisane/web-runtime/conversions`
- `@unisane/web-runtime/conversions/google-ads`
- `@unisane/web-runtime/conversions/meta`
- `@unisane/web-runtime/seo`
- `@unisane/web-runtime/seo/next`
- `@unisane/web-runtime/testing`

Subpath exports preserve understandable capabilities without creating unnecessary
packages. Growth may consume runtime-neutral event, consent, measurement, and evidence
schemas only through `/contracts`. Persistent slug history, redirects, aliases, canonical
public identity, and dynamic public URL records remain the separate Framework
`@unisane/public-urls` capability.

### CLI and extension contract

The package `unisane` is the only final owner of the `unisane` binary.

The primary command groups are:

- project primitives/dispatchers: `ops init`, `add`, `remove`, `connect`, `check`,
  `doctor`, `status`, `inspect`
- capability suites: `cloud`, `growth`
- provider expert lane: `provider`
- Framework integration: reserved root `dev`, `build`, `generate`, `llm`, plus
  `app`

Capability-first commands are the default. Provider commands exist only for concepts that
cannot be normalized honestly or for expert troubleshooting.

The CLI is a presentation shell over `@unisane/ops-engine`. It has no provider SDK
dependencies. Provider packages are exact, lazy imports selected through an explicit
static `PackManifest`.

`PackManifest` is a schema-versioned JSON resource, not an executable ESM/JavaScript
module. It declares pack/package identity, compatibility, integrity/provenance, commands,
`add` item types, config namespaces, capabilities, effects, schemas, and one exact handler
export. The CLI validates the complete explicitly selected graph for schema, version,
trust, integrity, and collisions before importing only the selected handler. Duplicate
pack ids, command paths/ids, `add` item types, config keys, or capability bindings fail
closed. The CLI must not scan arbitrary `node_modules`, infer package commands, download
packages, or run package scripts. Commander is a private CLI adapter, not the public
extension API.

Core owns `ops init` and root dispatch; packs own their namespaces and registered item
types. `create-unisane` creates a new Framework application, while `unisane ops init`
adopts Ops in an existing project. Bare `unisane init` is not an alias or supported
command. The Framework pack preserves public `unisane dev|build`, workspace profiles,
and the sole executable compiler `unisane app compile --write|--check`; aggregate
doctor remains core-owned. A generic project without that pack reports reserved
Framework commands unavailable. Provider state and local Project Memory use their
explicit specialist commands and are not compiler phases.

### Engine and effect contract

One Ops engine owns typed command execution, normalized inventory, deterministic plans,
policy, approvals, receipts, drift, redaction, artifact schemas, and the provider-neutral
`SecretResolver`, `SecretWriter`, `ArtifactStore`, `ApprovalStore`, and `LockStore` ports.

Every command declares one maximum effect:

- `offline`
- `read-network`
- `write`
- `spend-impact`

The manifest declares maximum effect and a set of write targets; executions record actual
effect separately from supporting artifact writes. Remote business-resource mutation
requires a fresh hash-bound plan, exact target identity, policy approval, lock, and
receipt. Publish remains separate from apply. Rollback prepares an inverse plan that only
the normal approved apply stage executes.

### Config contract

Use one `unisane.config.ts`.

- a standalone Ops project uses the generic default project export
- a Framework project preserves the Framework-owned default export and uses the exact
  named export `ops` for Ops configuration

Generic Ops vocabulary is `project`, `target`, `environment`, `connection`, `provider`,
`connector`, `integration`, `capability`, and `policy`. Framework `scopeId` remains
canonical inside Framework and is mapped only by `@unisane/framework-ops`.

Provider-specific root config files and guessed export-name families are transitional,
not the target architecture.

The config is declarative and data-first for offline loading: no top-level env
validation/throws, secret resolution, auth, network access, provider SDK construction, or
mutation. Because `unisane.config.ts` is trusted executable project code rather than a
sandboxed data format, those rules are an authoring contract, not protection from
malicious code. Privileged CI must not evaluate untrusted pull-request/fork config with
secrets, provider credentials, writable tokens, or unrestricted network authority; use a
credential-free isolated lane or a reviewed/default-branch artifact.

### Dependency contract

- the CLI depends on engine/manifest contracts and explicit packs, never provider SDKs
- the engine depends on no CLI framework, provider SDK, Framework runtime, React, or Next
- Cloud and Growth depend on engine contracts, not concrete provider SDKs, and expose
  schema-only `/contracts` subpaths
- provider packages depend on engine contracts, their own SDKs, and only the exact suite
  `/contracts` subpaths they implement; suites never import providers
- Growth may additionally import only `@unisane/web-runtime/contracts`
- Framework Ops is the only cross-product integration and uses public Framework authoring
  contracts plus the narrow `@unisane/devtools/framework-integration` subpath
- Web Runtime has no CLI, engine, suite, management-provider, or Framework runtime
  dependency
- Framework runtime code has no Ops/CLI dependency
- `@unisane/devtools` continues to own Framework compilation, generation, starters, LLM
  context, architecture gates, and governance
- `@unisane/devtools` remains a publicly distributed technical Framework package so the
  exact semver-governed `@unisane/devtools/framework-integration` subpath resolves from
  `@unisane/framework-ops`; this does not make its root or private compiler modules a
  cross-product API

### Git and artifact contract

Public repositories contain reusable code, docs, schemas, redacted fixtures, examples,
and tests. Private platforms remain private.

Track authored non-secret intent. Ignore credentials, provider inventories, account data,
plans, receipts, locks, caches, OAuth state, and unredacted reports by default. Private
Git is not a secret store. Explicitly exported redacted reports/receipt summaries may be
tracked for review. Durable production receipts belong in an access-controlled immutable
artifact store rather than Git. Each product repository has one authoritative writable
remote; submodules, nested repositories, copied source ownership, and cross-repository
relative imports are forbidden. Private platforms consume published, semver-pinned
packages or explicit prereleases after extraction. Public extraction requires a secret,
customer-data, provenance, and license audit.

### Adoption contract

Every provider/suite supports:

```text
Observe -> Connect -> Adopt -> Manage -> Automate
```

Read-only use must not require Unisane to take ownership of existing resources.

## Consequences

### Positive

- non-Framework developers can adopt valuable Unisane capabilities
- one CLI and one config remain understandable
- provider SDK and credential risk is isolated
- Cloud and Growth can evolve without forcing Framework compiler releases
- Web Runtime can be installed without operations tooling
- shared safety and JSON contracts become enforceable
- provider packages are cohesive without service-level fragmentation
- the private platform repository can validate public packages without becoming the
  distribution surface

### Negative And Tradeoffs

- extraction requires staged characterization and coordinated public migrations
- one Ops monorepo still requires disciplined package import rules
- the `unisane` CLI needs a static pack protocol and compatibility policy
- moving current capabilities will temporarily require current/target documentation
  distinctions
- consolidating web packages creates a public semver and consumer migration workload
- Provider Meta adds a public provider-family release surface, justified by one shared
  connection and management lifecycle rather than service-level package fragmentation
- capability-first normalization cannot hide every provider-specific concept, so an
  expert provider lane remains necessary

## Compatibility With Existing Decisions

This decision does not supersede Framework architecture decisions governing:

- compile-time graph resolution
- RuntimeHost and explicit DI
- module, adapter, and starter boundaries
- generated artifact ownership
- the Framework command spine and build freshness
- greenfield hard cuts in internal Framework runtime flows

It narrows the scope of those decisions:

- `@unisane/devtools` remains the Framework assembly and governance owner
- generic cloud, growth, provider-management, and web-runtime product behavior moves out
  through the staged plan
- public `unisane` and current web-package migrations follow semver policy
- internal duplicate owners are deleted in the same bounded extraction workpack after
  parity

Where an older provider or marketing plan places its final product implementation inside
`@unisane/devtools`, this decision supersedes that package-placement statement while
preserving verified capability behavior and provider-safety requirements.

## Enforcement Updates

This decision initially establishes documentation authority only. Implementation
workpacks must add machine enforcement for:

1. one `unisane` binary owner
2. no direct `unisane` CLI dependency on `@unisane/devtools`
3. no provider SDK dependencies in the CLI, Ops engine, Cloud, or Growth
4. no generic Ops implementation in Framework Devtools after migration
5. no Ops/CLI dependency from Framework or Web Runtime runtime code
6. valid static pack manifests and supported pack API versions
7. command id, effect, JSON, and exit-code contracts
8. config default/named-export rules and schema migrations
9. provider plan/apply/receipt/redaction/security contracts
10. package budget and provider admission evidence
11. clean package contents, public provenance, and secret scanning

The owning workpacks must update the command workflow only when commands become live and
must run the canonical docs, architecture, dependency, type, test, package, and
clean-install checks for their scope.

## Rollback And Follow-Up

Before package publication or downstream adoption, a bounded extraction workpack may be
reverted to its recorded preflight state. After any public release, config migration, or
consumer adoption, preserve one owner and fix forward or publish an explicit rollback
release/migration. Never resurrect the duplicate old implementation, command, config
loader, or writable repository path as a fallback.

Follow-up:

1. complete Phase 0 authority and current-state inventory
2. keep the linked finding `open` until implementation is admitted
3. open one characterized extraction workpack at a time
4. preserve public compatibility only with explicit versions and migration notes
5. follow the Meta admission decision for new Meta management capabilities and create a
   separate decision before splitting any provider service/package/repository
6. archive older plans only after durable behavior is promoted and live command docs
   remain accurate
