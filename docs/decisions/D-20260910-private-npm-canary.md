---
id: D-20260910-private-npm-canary
owner: unisane-ops
repository: unisane-ops
scope: workspace
role: decision
lifecycle: durable
authority: canonical
provenance: accepted
view: current
status: accepted
---

# Private npm canary distribution

The owner approved private npm publication on September 10, 2026. This supersedes the public
registry classification for this release. No source repository visibility change is authorized or
required.

The CLI package is `@unisane/ops`; its executable remains `unisane-ops`. Configuration imports use
`@unisane/ops/config`. The unscoped package is not published and there is no compatibility alias.
npm requires scoped names for private packages.

The package admission policy owns the 11 restricted package names, including the CLI's required MCP
adapter. Hosted applications and the hosted PostgreSQL adapter remain outside this release. Source
package versions and pack manifest versions must match; changed pack manifests are sealed with the
Ops engine's `sealPackManifest` API.

`scripts/private-release.mjs prepare` packs the built packages and verifies private access,
dependency closure, export targets and archive contents. `consumer` installs those exact archives in
a temporary independent project, loads the public entrypoints, and runs CLI info. The manually
dispatched workflow publishes only those checked archives and compares registry SHA-512 integrity.
It retains the exact source commit and receipt. Private package publication does not claim public
npm provenance.

Publishing credentials are temporary and confined to the publication step. Consumer credentials must
be read-only. A successful publication does not certify a Platforms application: its clean install
and build remain separate checks.

The console consumes public UI canary `0.1.2-next.97f61b1d`, verified by UI workflow
34490477119. Its boundary policy records the actual registry integrities and current import
inventory. The isolated consumer resolves a lock and fetches its packages before testing a
frozen offline install, so a fresh CI runner does not require a pre-populated local store.
Release versions come from that reviewed evidence rather than a second constant in the checker.

Publication builds and validates archives in a separate preparation job. The publication job downloads those exact archives; retrying a failed publication job does not rebuild them. After npm accepts an upload, verification retries only a temporary missing-version response for at most five minutes (301 seconds including initial backoff). Authentication errors, other registry failures, and integrity mismatches stop the release.

The complete consumer release is `0.1.0-next.20260910.2`. The first partial attempt published only Cloud and Framework Ops under `.1`; rebuilt declaration ordering changed Cloud archive bytes, so the immutable `.1` version cannot be reused. No consumer baseline selects that partial family. A version is built once and publication retries reuse its prepared workflow artifact.

Publication completed in [GitHub run 34519518709](https://github.com/unisanetech/unisane-ops/actions/runs/34519518709). The [durable release receipt](../reference/releases/ops-private-canary-0.1.0-next.20260910.2.json) records source commit, all 11 exact archive integrities, clean consumer proof and verified private registry access. The temporary GitHub publishing secret was removed after verification.
