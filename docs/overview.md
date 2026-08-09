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

- the `unisane` CLI and one `unisane` executable
- the headless Ops engine and static pack/action contracts
- Unisane Ops Cloud and Unisane Ops Growth
- Unisane Web Runtime
- AWS, Cloudflare, Google, and Meta provider families
- the optional Framework Ops integration
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

`unisane-ops` may depend on released public Framework contracts only where the accepted
integration boundary requires them. Framework runtime must not depend on Ops. Private
platforms consume released or explicitly admitted prerelease packages, never sibling
source. UI packages and the UI CLI remain UI-owned.

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

The candidate is documentation-ready for bounded source convergence planning only. It
is not ready for a filtered shadow, remote authority, public package release, or
production deployment. The canonical gate status and exact blockers are in
[Standalone Repository Transition Readiness](standards/01-standalone-repository-transition-readiness.md).
