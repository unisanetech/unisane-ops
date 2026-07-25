# @unisane/framework-ops

Optional cross-product integration between the canonical `unisane` CLI and Unisane
Framework developer workflows.

The package contributes Framework lifecycle and authoring roots through one static,
integrity-checked first-party pack. It imports only the Ops pack contract and the narrow
`@unisane/devtools/framework-integration` public bridge. Framework compiler, codegen,
database, project authoring, UI composition, LLM, and governance implementation remains
in Devtools. The pack owns the canonical `ui` route as well as the Framework lifecycle
and authoring roots.

Generic websites and other non-Framework Ops consumers do not need this package. The
canonical host resolves it only by its exact package and manifest export; it does not scan
installed packages.
