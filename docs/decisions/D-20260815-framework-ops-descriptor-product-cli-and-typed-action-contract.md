---
id: 'D-4c7f6a319d82'
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
  - './D-20260724-unisane-ops-product-package-and-repository-boundary-contract.md'
  - './D-20260724-unisane-ecosystem-repository-remote-and-visibility-contract.md'
  - '../architecture/13-ai-native-application-and-agent-integration.md'
  - '../standards/09-runtime-compiler-tooling-and-config-boundary-contract.md'
  - '../standards/13-unisane-ops-product-architecture-baseline.md'
  - '../standards/14-agent-tools-mcp-skills-and-evaluation-baseline.md'
  - '../findings/F-20260724-unisane-ops-product-boundary-and-devtools-coupling-gap.md'
---

# D-20260815 Framework-Ops Descriptor, Product CLI, And Typed Action Contract

## Changelog

- `2026-08-15`: Accepted separate Framework and Ops product CLIs, a serialized
  descriptor-only optional Framework integration, one typed Ops action protocol for
  every presentation adapter, and the removal of provider mutations and nested CLI
  execution from Framework Devtools.

## Context

Unisane Framework and Unisane Ops are separate products with different dependency,
release, security, and operational responsibilities. Framework compiles application
structure and hosts application runtime. Ops discovers and changes external operational
state under explicit effect, approval, verification, and receipt controls.

The transitional architecture violates that separation in both directions. The Ops CLI
loads Framework Devtools and exposes Framework command families, while the Framework
integration imports Framework authoring and Devtools surfaces. Some Ops handlers invoke
another Commander CLI with raw arguments and recover results by capturing stdout,
stderr, or `process.exitCode`. Devtools also retains provider and remote-state mutations
that are not compilation or developer-environment behavior.

Those patterns make Ops depend on the Framework implementation and its package closure,
turn presentation text into an integration protocol, duplicate command and action
models, and prevent either product from being installed, tested, released, or secured
independently.

## Decision Drivers

- independent Framework and Ops installation and release
- one typed operational execution path across human and agent interfaces
- deterministic Framework compilation without provider or network mutation
- explicit dependency and trust boundaries for optional integrations and provider packs
- structured results, errors, evidence, and receipts instead of terminal interception
- no compatibility shell for unreleased command or package surfaces
- no product boundary that depends on a sibling checkout or another product's internals

## Considered Options

1. Keep one combined `unisane` launcher and reduce the imported Devtools closure.
2. Preserve separate internal engines but continue delegating between their CLIs.
3. Publish a narrow Framework JavaScript contract package for direct Ops imports.
4. Separate the product CLIs, integrate through a serialized project descriptor, and
   converge every Ops entrypoint on one typed action contract.

## Decision

Selected option: `4`.

### Product CLI ownership

The final executable ownership is:

| Command          | Package and product owner              | Responsibility                                                                                       |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `unisane`        | `@unisane/devtools`, Unisane Framework | Framework adopt support, compile, generate, develop, build, inspect, and local developer diagnostics |
| `unisane-ops`    | the Ops CLI package, Unisane Ops       | Ops adoption, observe, plan, approve, apply, verify, inspect, automate, and receipt workflows        |
| `create-unisane` | the Framework scaffolder               | create a new Framework project                                                                       |

Only `create-unisane` exposes project creation. Devtools may share an internal
scaffolding library, but `unisane` does not expose a second create command.

The products do not reserve or delegate each other's root commands. Ops does not expose
Framework `dev`, `build`, `generate`, compiler, database, or LLM commands. Framework does
not expose Ops provider, Cloud, Growth, approval, or apply commands. There is no combined
launcher, catch-all forwarding route, compatibility alias, or runtime product discovery.

Because these command surfaces have no stable public release, the cutover is direct.
Documentation, packages, tests, and consumers move to the selected names in the same
bounded implementation work; the old parallel paths are deleted.

### Stack-neutral Ops core

Ops core and its generic CLI depend only on Ops-owned contracts and selected Ops packs.
They never import:

- `@unisane/compiler`
- `@unisane/devtools`
- Framework RuntimeHost, Kernel, modules, adapters, Starters, or generated runtime code
- a Framework source tree, workspace alias, cache, or sibling checkout

Ops may operate a Framework project through an optional Ops-owned integration adapter.
The adapter consumes one versioned, schema-validated, serialized project descriptor
emitted by the Framework compiler. That descriptor contains only the static identities
and metadata admitted for operational use. It contains no executable handlers, service
instances, container references, secrets, credentials, provider clients, or source-path
assumptions.

The adapter:

- has zero Framework npm dependencies
- is not installed or activated by the default Ops installation
- validates descriptor schema version, compatibility, digest, project identity, and
  requested capability before creating Ops inputs
- translates descriptor data into Ops-owned contracts without adding a second action,
  authorization, approval, policy, or workflow engine
- fails closed when the descriptor is absent, incompatible, ambiguous, stale for the
  requested operation, or contains an unrecognized capability

The descriptor is an integration boundary, not a remote-control protocol. Ops does not
invoke Framework compilation implicitly. A user or CI lane generates or supplies the
descriptor through the Framework-owned path, and Ops consumes the immutable artifact.

### One typed Ops action protocol

Every operational capability is one `ActionDefinition` with, at minimum:

- a stable action id and schema/contract version
- typed input and normalized output schemas
- declared maximum effect and exact target-identity requirements
- required capabilities, policy, admission, and approval rules
- deterministic plan behavior where mutation or spend impact is possible
- one typed apply handler for admitted effects
- postcondition verification
- structured errors, artifacts, redaction rules, and receipt schema
- idempotency, lock, retry, cancellation, timeout, and recovery semantics where relevant

The existing effect vocabulary remains canonical unless a newer Ops Decision changes
it: `offline`, `read-network`, `write`, and `spend-impact`. Actual effect is recorded in
the result and receipt independently of the declared maximum.

CLI, MCP, API, console UI, scheduler, automation, and agent tools are presentation or
transport adapters over the same action. They parse or validate their boundary input,
call the typed action engine, and render the typed result. They do not implement provider
behavior, mutate policy, create another approval model, or infer success from prose.

Provider and capability packs expose typed leaf actions through validated, versioned
manifests. The generic host validates the complete explicitly selected graph for
identity, compatibility, provenance, trust, schema, capability, effect, and collision
before loading an exact handler export. It neither scans arbitrary packages nor contains
provider-specific switch statements.

### Forbidden invocation and result patterns

Below the user-facing CLI adapter, the following are forbidden:

- passing raw `argv` arrays as the action API
- invoking another Commander or product CLI
- spawning a child CLI to obtain business or provider behavior
- monkeypatching or intercepting stdout/stderr
- temporarily reading or replacing `process.exitCode`
- parsing terminal prose to recover status, identifiers, plans, or receipts
- using thrown CLI exits as the engine error contract
- maintaining parallel command-handler and action-handler implementations

Human-readable terminal output remains a CLI projection. Machine callers receive a
versioned structured result from the action engine.

### Provider and mutation ownership

The Framework compiler is static, deterministic tooling. It performs no provider,
network, database, billing, deployment, account, production-state, or secret mutation.
Framework Devtools may own thin compiler invocation, watch mode, scaffolding, local
developer diagnostics, and strictly local deterministic file generation. It does not
own remote provider lifecycle or operational control-plane behavior.

Provider discovery, remote diff, plan, approval, apply, repair, archive, billing,
account, infrastructure, marketing, and production-state operations belong to typed Ops
actions. Product-specific application administration remains with the product unless it
is explicitly admitted as an Ops action. Moving behavior out of Devtools does not by
itself make it generic Ops behavior; ownership must be resolved deliberately.

## Consequences

### Positive

- Ops installs without the Framework implementation or its transitive package closure.
- Framework compilation remains independent of credentials, provider availability, and
  operational side effects.
- CLI, MCP, API, UI, scheduler, and agent callers share one safety and result contract.
- provider packs are optional, typed, auditable, and independently testable.
- structured results replace process-global interception and terminal parsing.
- each product can secure, evolve, and release its command surface through its own
  separately authorized distribution channel.

### Negative And Tradeoffs

- the Framework must emit and version a portable project descriptor.
- the optional adapter needs compatibility fixtures for every supported descriptor
  version.
- existing combined commands and direct CLI callers must be changed in one clean cut.
- provider capabilities require typed schemas and results rather than quick CLI-only
  handlers.
- users operating both products install and invoke two intentionally distinct CLIs.

## Compatibility And Supersession

This Decision preserves the product suites, provider-family cohesion, static trusted-pack
admission, effect safety, plan/approval/apply/verify/receipt model, config ownership, Web
Runtime independence, and repository direction accepted by
`D-20260724-unisane-ops-product-package-and-repository-boundary-contract`.

It supersedes that Decision's statements that:

- the Ops package owns the `unisane` binary
- one CLI reserves or forwards Framework root commands
- a Framework pack supplies compiler, `dev`, `build`, `generate`, or LLM commands to Ops
- `@unisane/framework-ops` imports public Framework authoring contracts or
  `@unisane/devtools/framework-integration`
- Framework Devtools is the final owner of provider-management or remote operational
  mutations

It also supersedes the Framework-Devtools integration sentence in
`D-20260724-unisane-ecosystem-repository-remote-and-visibility-contract`. Cross-product
integration is descriptor-only; no source or package dependency is permitted.

This Decision does not alter repository visibility, create a remote, authorize package
publication, or move writable source authority. Those remain separately governed, and
the Framework remains under its founder public-availability hold.

## Transition And Enforcement

1. Inventory every combined command, raw-argv handler, nested CLI invocation,
   stdout/stderr capture, `process.exitCode` use, provider mutation, and Framework/Ops
   dependency edge.
2. Freeze the Framework-owned descriptor schema/emitter contract and the Ops-owned
   supported-version validator, mapping, and typed `ActionDefinition` contracts before
   moving implementations; Ops does not create a second descriptor schema.
3. Add the Framework descriptor emitter and isolated fixture without an Ops dependency.
4. Add the Ops descriptor adapter with zero Framework npm dependencies and keep it out
   of the default install profile.
5. Port one representative read action and one approval-gated mutation end to end
   through CLI, MCP or API, plan, apply, verification, and receipt.
6. Port remaining leaf actions and presentation adapters to the same engine.
7. Move or delete remote provider mutations in Devtools after their typed owner passes
   focused parity and safety proof.
8. Rename executable ownership and delete the combined launcher, Framework pack command
   contribution, nested CLIs, output capture, compatibility aliases, and duplicate paths
   in the same admitted cutover.
9. Enforce package and dependency rules in both standalone repositories before their
   authority flips.

## Proof

- a clean standalone Ops install resolves and runs its core health action with no
  Framework, Devtools, compiler, sibling-checkout, or workspace dependency
- the default Ops installation does not contain or activate the Framework adapter
- descriptor fixtures prove accepted, incompatible, tampered, stale, ambiguous, and
  missing-capability behavior without executing Framework code
- one read action and one mutation action produce equivalent structured results through
  CLI and at least one non-CLI adapter
- mutation fixtures prove exact target identity, hash-bound plan, approval, lock,
  verification, redaction, and receipt behavior
- dependency gates reject Framework imports from Ops core and Ops imports from Framework
- source checks reject nested CLI execution, raw-argv engine APIs, stdout/stderr capture,
  and `process.exitCode` interception below CLI presentation
- compiler and Devtools checks prove provider/network/database mutations are absent from
  their final owned surfaces

## Non-Goals

- making Ops a Framework subsystem or making Framework an Ops plugin host
- embedding executable Framework code in the portable descriptor
- adding an RPC bridge between product CLIs
- using the descriptor as a secret, credential, runtime state, or provider inventory
  container
- forcing product-specific administration into generic Ops
- splitting every provider service or action into a package
- creating another workflow, business, policy, authorization, or approval engine
- preserving unreleased combined commands through aliases or compatibility shims
- authorizing repository creation, source visibility, package publication, deployment,
  or authority cutover
