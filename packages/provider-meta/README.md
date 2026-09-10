# @unisane/provider-meta

Meta Graph transport and provider-specific resource normalization for Unisane Ops.

Growth retains provider-neutral configuration, reporting, planning, mutation safety, and receipts.
This package owns Meta Graph discovery, reporting, asset upload, and guarded remote execution behind
host bindings.

The package now owns a strict canonical Meta connection record and token-free lifecycle transitions.
Records bind scope, project, environment, connection, identity, an opaque host secret reference,
credential version/state, exact grants, and selected resources. Refresh, rotation, revocation, and
disconnect reject context or version conflicts. The record store is project-bounded and atomic and
never accepts credential material.

Provider Meta also owns bounded, read-only connection discovery for the verified identity, exact
permissions, businesses, ad accounts, Pixels, datasets, Pages, and Instagram accounts. Discovery
accepts credential bytes only through a host-supplied callback, pins pagination to the selected
Graph origin and API version, strips credential query parameters, bounds pages and businesses, and
returns only strict token-free inventory and safe failure metadata. Candidate resources are never
selected automatically.

The ordinary local Ops lifecycle now supports approved Meta system-user credentials through a hidden
one-time terminal prompt and context-bound macOS Keychain custody. A process-scoped
environment-variable ingress remains available for CI and other non-interactive execution. The
access token is never accepted as a CLI/MCP argument, written to project configuration, included in
a result, or passed to the Keychain process as an argument. Prompt and Keychain writes use bounded
non-echoed input, clear their buffers, and expose credential bytes only inside the provider
callback.

The connection flow is intentionally staged:

1. Run `unisane-ops connect meta --environment <id> --yes` in an interactive terminal. Paste the
   token into the hidden prompt. After discovery, choose the intended ad account and Pixel/dataset
   from names and exact IDs, with the project/environment displayed. Even a single candidate
   requires a choice. Credentials and the connection record are saved only after selection succeeds.
   Enter, Ctrl-C or EOF at a resource prompt cancels without saving; partial discovery is identified.
2. For CI or another non-interactive host, inject `META_GRAPH_ACCESS_TOKEN` through that host's
   secret manager for only the connection process. JSON and non-interactive execution fail closed
   when the approved environment ingress is absent.
3. JSON and non-TTY runs never display resource prompts. They return unresolved candidates unless
   exact flags were supplied. Re-run `unisane-ops connect meta --environment <id> --yes --refresh`
   interactively to choose resources, or supply `--ad-account <id>` and one or both of `--pixel <id>`
   or `--dataset <id>` for deterministic agent/CI use. Optional `--business`, `--page`, and
   `--instagram-account` flags are also validated against discovery. Candidates are never auto-selected.
   Refresh retains previously selected account/event resources, including inaccessible ones, instead
   of silently replacing them; use an explicit flag to intentionally change a selection.
4. Use `--refresh` for same-version grant/resource verification, `--rotate` to receive another
   hidden prompt for an exact one-version rotation, and `unisane-ops disconnect meta` to remove
   local custody and project connection intent without changing provider resources or historical
   evidence.

`MetaResourcePrompt` is an injectable presentation boundary: it receives only the target and
safe discovered candidates and returns a resource type/ID or cancellation. The provider validates
that choice against the requested service before using the existing record/configuration flow.
This is a local terminal setup workflow; console/MCP guided setup and live tracking verification
remain separate work.

Identity, permission, and resource discovery plus Ads reads share bounded pagination, timeouts,
retry counts, capped `Retry-After`, revocation classification, pinned Graph origin/version, and
redacted errors.

## Capability inventory

`metaCapabilityInventory()` returns the version 2 provider-owned source inventory through the
existing offline host operation `meta.connection.capabilities`. Implementation status, source
references, fixture proof, test references, host-operation references, prerequisites and next
steps are separate facts. The inventory covers connections, advertising, event diagnostics and
catalog gaps. It does not access credentials or provider accounts.

The inventory explicitly returns `accountReadiness: 'not-evaluated'`. An implemented or
fixture-proven capability is not necessarily usable by the current host or account. Operation
references do not authorize execution. Host wiring, selected resources, permissions, interface
exposure and live evidence must be evaluated separately; Meta writes remain blocked by the host.
No Meta proprietary match-quality score or provider API availability is inferred from source.

This pre-stable contract replaces the measurement-only version 1 matrix, its mixed `state`
field and aggregate mutation flag. Use `metaCapabilityInventorySchema` and inferred types from
the package root. The inventory is generated on demand; persisted connection, outcome and
approval records are unchanged.

Browser OAuth, hosted KMS composition, and controlled non-production/live verification remain
separate deployment work. Provider mutation remains blocked.

Meta CAPI remains an application-runtime connector under `@unisane/web-runtime`; it is not a
management credential bypass.
