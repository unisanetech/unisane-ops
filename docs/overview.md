---
id: 'DOC-5ec590061b3d'
owner: 'unisane-ops'
scope: unisane-ops
role: overview
lifecycle: durable
authority: canonical
provenance: accepted
view: transition
---

# Unisane Ops Overview

Unisane Ops is the stack-neutral operations product in the wider Unisane ecosystem. It
serves existing websites and services as well as Framework projects.

This is the compact owner-local overview for the temporary umbrella child Scope
`unisane-ops`. At cutover, each central predecessor must receive an exact `move`,
`rewrite`, or `delete` disposition. After the authority flip, no second canonical,
writable copy of this product boundary may remain in the umbrella repository.

## Product Boundary

The accepted standalone repository owns:

- the `unisane-ops` package, its one `unisane-ops` executable, and
  `unisane-ops/config`
- the headless Ops engine and static pack/action contracts
- Unisane Ops Cloud and Unisane Ops Growth
- Unisane Web Runtime
- AWS, Cloudflare, Google, and Meta provider families
- the optional descriptor-only Framework Ops adapter
- admitted console, MCP, AI-host, hosted-runtime, deployment, documentation, test, and
  release surfaces that use the same engine and safety contracts

It does not own:

- Framework compiler, code generation, runtime, modules, starters, or general Devtools
- UI source or UI adopter tooling
- private platform applications
- company desired state, account topology, credentials, provider state, or secrets
- repository-system materialization or organization control
- an independent approval, authorization, workflow, or business-action engine

## Repository Relationship

The optional `@unisane/framework-ops` adapter may consume only the serialized Framework
project descriptor. It has no Framework, Compiler, or Devtools package dependency and
does not compile projects, discover Framework commands, execute another CLI, or parse
terminal output. Framework runtime must not depend on Ops. Private platforms consume
released or explicitly admitted prerelease packages, never sibling source. UI packages
and the UI CLI remain UI-owned.

The current top-level `unisane-ops/**` directory is staging inside the umbrella Git
repository. It is not a nested repository, local shadow, configured remote, or writable
authority.

## Delivery Surfaces

The reusable package foundation may support CLI, console, local MCP, AI-host skills, and
an optional hosted product. Every surface lowers to the same versioned action and engine
contracts. Thin adapters do not acquire provider, policy, approval, or workflow
ownership.

Hosted runtime and deployment source does not establish production readiness. Production
requires separately approved identity, authorization, secret custody, state, migration,
rollback, observability, recovery, privacy, and accountable deployment ownership.

## Current Readiness

The Ops Phase 1 source now owns the final `unisane-ops` package, executable, and config
coordinate without the prior combined-host wrapper or Framework command bridge.
`@unisane/framework-ops` is a public, descriptor-only adapter for
`@unisane/compiler/project-descriptor-contract/v1`; it validates the exact contract and
schema assets, canonical descriptor bytes and digest, admitted Compiler version,
identity, capabilities, and compatibility before mapping static facts. It has zero
Framework, Compiler, or Devtools package dependencies and no executable behavior. The
private Framework registry still lacks an admitted external resolution receipt for the
contract asset, and the umbrella integration lock and Platform consumer projection also
remain outside this lane. Redacted scan findings plus
scanner, security, privacy, legal, contributor, asset, license, signing, and
remote-governance decisions remain unresolved. It is not certified for standalone CI,
public history, remote authority, public package release, or production deployment.
Detailed extraction and scanner receipts remain Infrastructure-owned private audit
Evidence outside this future public product boundary; target Memory retains only safe
receipt IDs, hashes, counts, and summaries.
The canonical gate status is in
[Standalone Repository Transition Readiness](standards/01-standalone-repository-transition-readiness.md).
