# unisane

`unisane` is the sole public CLI host for Unisane Ops and contributed Framework
developer commands.

## Project Lifecycle

```bash
unisane ops init
unisane add growth
unisane connect google
unisane check
```

`unisane ops init` adopts Ops in the current project. It does not create a Framework
application. Plain projects receive `defineUnisaneProject(...)`; Framework projects
retain their default Framework config and receive one named `ops =
defineUnisaneOps(...)` export.

Bare `unisane init` is invalid. Use `create-unisane` for a new Framework application.

The root config stores non-secret project intent, environments, named connection
references, resource selections, and capability policy. Provider credentials stay
behind provider-owned connection storage. `unisane check` aggregates the shared typed
readiness model and returns the same findings to human, JSON, CI, agent, and console
consumers.

Previous Growth intent is converted only through:

```bash
unisane ops migrate growth-config --input <retired-config-module> --yes
```

Normal loading rejects the retired schema.

## Host Contract

The host loads a fixed first-party pack list from sealed manifests and validates package
identity, installed version, integrity, trust, and namespace collisions before importing
an exact handler. Unknown commands fail closed. There is no package scanning, remote
download, arbitrary import, or catch-all subprocess fallback.

JSON mode emits one structured result with actual effect, write targets, diagnostics,
artifacts, and next actions. Provider and mutation commands retain their explicit
inventory, plan, approval, confirmation, lock, receipt, and drift boundaries.

Framework authoring is contributed by `@unisane/framework-ops`; Growth and provider
execution remain independently selectable packs.

## License

MIT
