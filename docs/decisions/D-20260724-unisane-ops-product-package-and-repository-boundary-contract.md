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
relatedDocs:
  - 'https://github.com/Croodo/unisane/blob/5f6e0b3e3dea915b4267a266571c99150834f88b/docs/decisions/D-20260724-unisane-ecosystem-repository-remote-and-visibility-contract.md'
  - './D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract.md'
  - 'https://github.com/unisanetech/unisane/blob/main/docs/decisions/D-20260815-framework-release-units-compatibility-bom-and-registry-proof-contract.md'
  - '../standards/13-unisane-ops-product-architecture-baseline.md'
---

# D-20260724 Unisane Ops Product, Package, And Repository Boundary Contract

## Changelog

- `2026-08-15`: Superseded the combined `unisane` launcher, executable Framework pack,
  Devtools bridge, and direct Framework-package integration. The accepted target now has
  separate Framework `unisane`, Ops `unisane-ops`, and `create-unisane` executables; a
  non-default descriptor-only Ops adapter with zero Framework npm dependencies; one
  typed `ActionDefinition` for every Ops presentation adapter; no nested CLI/output
  capture; and no provider or remote-state mutations in Framework Compiler or Devtools.
  The Framework remains private under its founder hold. Earlier dated implementation
  entries remain chronology only.
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
- preserve one simple product-specific CLI and one config experience without coupling
  the Framework and Ops implementations
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
5. Create one Unisane Ops product monorepo with one Ops CLI, one headless engine, two
   suites, one Web Runtime, provider-family packages, and an optional portable Framework
   descriptor adapter; keep the Framework CLI and scaffolder separately owned.

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

- `unisane`: private Framework monorepo throughout the complete architecture, release,
  and repository-finalization program
- `unisane-pro`: private reusable commercial Framework extensions
- `unisane-ops`: public Ops monorepo containing CLI, engine, suites, Web Runtime,
  provider packages, and Framework integration
- `unisane-ui`: public UI monorepo
- `unisane-platforms`: private product/reference implementations
- `unisane-site`: public brand/marketing/docs gateway, not product SSOT

The Ops packages remain together because they share a versioned extension protocol,
contract tests, security model, and coordinated extraction. A repository split is a later
governance/release decision, not a naming preference.

Completing that program permits only a later founder review. It does not create public
eligibility or an automatic visibility/publication transition. Any future public
Framework state requires direct founder approval and a separate accepted high-impact
Decision.

The exact six-remote visibility, staging, history, docs-authority, and umbrella-retirement
contract is owned by
`D-20260724-unisane-ecosystem-repository-remote-and-visibility-contract`; this decision
does not create a competing Git cutover path.

### Package model

Public user-facing packages:

- the Ops CLI package, which owns the `unisane-ops` executable; its exact registry
  coordinate is owned by the release manifest
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

The target Ops packages have public source in `unisane-ops`, but publication requires
their separately admitted release authority. This Decision does not create a registry,
remote, package version, or publication action. “Technical” identifies audience and
dependency role, not private access.

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

Executable ownership is product-specific:

| Command          | Owner                            | Responsibility                                                                                     |
| ---------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `unisane`        | `@unisane/devtools`, Framework   | Framework adoption, compile, generate, develop, build, inspect, and local developer diagnostics    |
| `unisane-ops`    | the Ops CLI package, Unisane Ops | Ops adoption, observe, connect, plan, approve, apply, verify, inspect, automate, and receipt flows |
| `create-unisane` | the Framework scaffolder         | new Framework project creation only                                                                |

The primary `unisane-ops` command groups are:

- project primitives/dispatchers: `init`, `add`, `remove`, `connect`, `disconnect`,
  `check`, `doctor`, `status`, `info`, `inspect`, and `mcp`
- capability suites: `cloud` and `growth`
- provider expert lane: `provider`

Capability-first commands are the default. Provider commands exist only for concepts
that cannot be normalized honestly or for expert troubleshooting.

The Ops CLI is a presentation shell over the one typed action engine. It has no
Framework implementation or provider SDK dependency. Provider packages are exact, lazy
imports selected through an explicit static `PackManifest`. Framework commands are not
Ops packs, reserved roots, fallbacks, or runtime-discovered contributions. The products
do not invoke, forward to, or capture output from each other's CLI.

`PackManifest` is a schema-versioned JSON resource, not an executable ESM/JavaScript
module. It declares pack/package identity, compatibility, integrity/provenance, typed
leaf action ids, input/result schemas, exact handler exports, `add` item types, config
namespaces, capabilities, maximum effects, risk, and exact write targets. The CLI
validates the complete explicitly selected graph for schema, version, trust, integrity,
capability, effect, target, and collisions before importing only the selected handler.
Duplicate pack ids, command paths/ids, stable action ids, `add` item types, config keys,
or capability bindings fail closed. The CLI must not scan arbitrary `node_modules`,
infer package commands, download packages, or run package scripts. Commander is a
private CLI adapter, not the extension API.

Core owns `unisane-ops init` and root dispatch; packs own their namespaces and
registered item types. `create-unisane` is the only new-Framework-project command.
`unisane` does not expose another create command, and Ops does not expose Framework
`dev`, `build`, `generate`, compiler, database, LLM, or UI commands. There is no
combined launcher, compatibility alias, catch-all forwarding route, or runtime product
discovery.

### Engine and effect contract

One Ops engine owns normalized inventory, deterministic plans, policy, approvals,
verification, receipts, drift, redaction, artifact schemas, and the provider-neutral
`SecretResolver`, `SecretWriter`, `ArtifactStore`, `ApprovalStore`, and `LockStore`
ports. Every operational capability is one versioned typed `ActionDefinition` shared by
CLI, MCP, API, console, jobs, schedulers, automation, agents, and plugins. It owns a
stable action id, typed input and result, maximum effect, exact target identity,
capability/policy/admission/approval requirements, plan, one apply handler,
postcondition verification, structured errors/artifacts/redaction/receipt, and relevant
idempotency, lock, retry, cancellation, timeout, recovery, and reconciliation semantics.

Every action declares one maximum effect:

- `offline`
- `read-network`
- `write`
- `spend-impact`

The manifest declares maximum effect and a set of write targets; results and receipts
record actual effect separately from supporting artifact writes. Remote business-resource mutation
requires a fresh hash-bound plan, exact target identity, policy approval, lock, and
receipt. Publish remains separate from apply. Rollback prepares an inverse plan that only
the normal approved apply stage executes.

Below the CLI presentation boundary, raw `argv` action APIs, nested Commander or product
CLI invocation, child-CLI business execution, stdout/stderr interception,
`process.exitCode` capture or replacement, terminal-prose parsing, thrown CLI exits as
engine errors, and parallel command/action handlers are forbidden. Machine callers
receive structured typed results.

### Config contract

Use one `unisane.config.ts`.

- a standalone Ops project uses the generic default project export
- a Framework project preserves the Framework-owned default export and uses the exact
  named export `ops` for Ops configuration

Generic Ops vocabulary is `project`, `target`, `environment`, `connection`, `provider`,
`connector`, `integration`, `capability`, and `policy`. Framework `scopeId` remains
canonical inside Framework and is mapped only by `@unisane/framework-ops` from a
versioned serialized Framework descriptor. In a Framework project, the Framework-owned
path emits the admitted static config/identity projection; Ops never evaluates the
Framework default export or invokes compilation implicitly.

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

- the Ops CLI depends on Ops engine/action/manifest contracts and explicit packs, never
  provider SDKs or Framework implementation packages
- the engine depends on no CLI framework, provider SDK, Framework RuntimeHost, Kernel,
  modules, adapters, Starters, generated runtime, React, or Next
- Cloud and Growth depend on engine contracts, not concrete provider SDKs, and expose
  schema-only `/contracts` subpaths
- provider packages depend on engine contracts, their own SDKs, and only the exact suite
  `/contracts` subpaths they implement; suites never import providers
- Growth may additionally import only `@unisane/web-runtime/contracts`
- `@unisane/framework-ops` is an Ops-owned, non-default adapter that consumes only a
  versioned, schema-validated, serialized Framework descriptor and has zero Framework
  npm dependencies; it validates schema version, compatibility, digest, project
  identity, freshness, and requested capability before translation and fails closed
- the descriptor contains static admitted identities and metadata only, never executable
  handlers, service instances, containers, secrets, credentials, provider clients, or
  source-path assumptions
- Web Runtime has no CLI, engine, suite, management-provider, or Framework runtime
  dependency
- Framework runtime, Compiler, and Devtools have no Ops dependency
- `@unisane/compiler` owns Framework compilation, lowering, generation, and
  generated-output truth; `@unisane/devtools` owns only the thin Framework CLI, watch,
  scaffold, local-reference, doctor, and diagnostic UX over canonical owners
- Framework Compiler and Devtools perform no provider, network, database, billing,
  deployment, account, marketing, or production-state mutation; those behaviors belong
  to typed Ops actions or another explicitly admitted product owner
- Framework package distribution and visibility remain separately governed and private
  under the founder hold; this Decision creates no cross-product package bridge

### Git and artifact contract

Separately authorized public product repositories may contain reusable code, docs,
schemas, redacted fixtures, examples, and tests. The Framework remains private under its
founder hold, and private Platforms remain private.

Track authored non-secret intent. Ignore credentials, provider inventories, account data,
plans, receipts, locks, caches, OAuth state, and unredacted reports by default. Private
Git is not a secret store. Explicitly exported redacted reports/receipt summaries may be
tracked for review. Durable production receipts belong in an access-controlled immutable
artifact store rather than Git. Each product repository has one authoritative writable
remote; submodules, nested repositories, copied source ownership, and cross-repository
relative imports are forbidden. Private platforms consume published, semver-pinned
packages or explicit prereleases only from separately authorized channels after
extraction. Framework packages remain on a separately authorized private
registry/channel while the founder hold is active. Public extraction requires a secret,
customer-data, provenance, and license audit plus its independent visibility and
publication authority.

### Adoption contract

Every provider/suite supports:

```text
Observe -> Connect -> Adopt -> Manage -> Automate
```

Read-only use must not require Unisane to take ownership of existing resources.

## Consequences

### Positive

- non-Framework developers can adopt valuable Unisane capabilities
- separate product CLIs and one config remain understandable without a combined launcher
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
- the `unisane-ops` CLI needs a static pack protocol and compatibility policy
- moving current capabilities will temporarily require current/target documentation
  distinctions
- consolidating web packages creates a public semver and consumer migration workload
- Provider Meta adds a public provider-family release surface, justified by one shared
  connection and management lifecycle rather than service-level package fragmentation
- capability-first normalization cannot hide every provider-specific concept, so an
  expert provider lane remains necessary

## Compatibility With Existing Decisions

`D-20260815-framework-ops-descriptor-product-cli-and-typed-action-contract` supersedes
this Decision's earlier clauses that assigned the `unisane` binary to Ops, exposed
Framework commands through an executable Ops pack, imported
`@unisane/devtools/framework-integration`, or left provider mutations in Devtools. The
separate product CLI, descriptor-only integration, typed action, and mutation-ownership
rules in the 2026-08-15 Decision are controlling.

This decision does not supersede Framework architecture decisions governing:

- compile-time graph resolution
- RuntimeHost and explicit DI
- module, adapter, and starter boundaries
- generated artifact ownership
- the Framework command spine and build freshness
- greenfield hard cuts in internal Framework runtime flows

Subject to that supersession, it narrows the scope of those decisions:

- `@unisane/compiler` remains the Framework assembly and generated-output owner, while
  `@unisane/devtools` remains only its thin process-facing CLI/tooling consumer
- generic cloud, growth, provider-management, and web-runtime product behavior moves out
  through the staged plan
- separately released Ops CLI and current web-package migrations follow their owning
  semver policy
- internal duplicate owners are deleted in the same bounded extraction workpack after
  parity

Where an older provider or marketing plan places its final product implementation inside
`@unisane/devtools`, this decision supersedes that package-placement statement while
preserving verified capability behavior and provider-safety requirements.

## Enforcement Updates

This decision initially establishes documentation authority only. Implementation
workpacks must add machine enforcement for:

1. exact ownership of Framework `unisane`, Ops `unisane-ops`, and `create-unisane`
2. no Framework or Devtools dependency in Ops core/CLI and no Ops dependency in
   Framework
3. no provider SDK dependencies in the CLI, Ops engine, Cloud, or Growth
4. no generic Ops implementation in Framework Devtools after migration
5. no Ops/CLI dependency from Framework or Web Runtime runtime code
6. valid static pack manifests and supported pack API versions
7. action id, typed input/result, effect, JSON, and CLI exit-code projection contracts
8. config default/named-export rules and schema migrations
9. provider plan/apply/receipt/redaction/security contracts
10. package budget and provider admission evidence
11. clean package contents, authorized-channel provenance, and secret scanning
12. descriptor-only optional Framework integration with zero Framework npm dependencies
13. rejection of raw-argv engine APIs, nested product CLIs, stdout/stderr or
    `process.exitCode` capture, and duplicate command/action handlers
14. absence of provider and remote-state mutations from Framework Compiler and Devtools

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
