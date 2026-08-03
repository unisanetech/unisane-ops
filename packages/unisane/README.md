# unisane

`unisane` is the sole public CLI host for Unisane Ops and contributed Framework
developer commands.

## Project Lifecycle

```bash
unisane ops init
unisane add growth
unisane connect google
unisane check
unisane disconnect google --yes
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

`unisane disconnect google` removes the selected local connection, its provider-owned
local secret material, and project resource references only after confirmation.
Historical reporting data remains available, and Google-side tags, properties,
containers, accounts, and campaigns are not changed.

Previous Growth intent is converted only through:

```bash
unisane ops migrate growth-config --input <retired-config-module> --yes
```

Normal loading rejects the retired schema.

## Local agent access

The same `unisane` installation can serve the three proven, read-only Growth workflows
to a local MCP-capable agent. For Codex, preview the project-local configuration first:

```bash
unisane mcp configure codex \
  --project /absolute/path/to/project \
  --environment production \
  --actor codex.local
```

The preview shows the complete managed block without changing the project. Apply it only
after review:

```bash
unisane mcp configure codex \
  --project /absolute/path/to/project \
  --environment production \
  --actor codex.local \
  --write
```

This command owns one marked `mcp_servers.unisane_ops` block in
`.codex/config.toml`. It preserves unrelated Codex settings, updates its own block
idempotently, enables only the three proven read-only tools, and binds the exact project,
environment, and actor. Codex loads project-local configuration only for a trusted
repository, so trust the repository before restarting Codex. Then inspect `unisane_ops`
with `/mcp` or `codex mcp list`.

Remove only the managed block with:

```bash
unisane mcp configure codex \
  --project /absolute/path/to/project \
  --remove \
  --write
```

Other MCP-capable hosts can launch the underlying STDIO server directly:

```bash
unisane mcp serve \
  --project /absolute/path/to/project \
  --environment production \
  --actor codex.local \
  --actor-name "Codex"
```

Configure such a host to launch that exact command over STDIO. `--project`,
`--environment`, and `--actor` are required so a host cannot silently select a different
project or identity from ambient state. The project directory must directly own
`unisane.config.ts`, and Growth must declare the selected environment.

STDOUT is reserved for MCP protocol messages; diagnostics use STDERR. This local entry
point does not start a Framework application runtime, accept provider secrets in tool
arguments, expose a shell, grant approval, or claim hosted/remote availability. Its only
write workflow is the separately admitted, human-approved exact campaign pause.

The Codex configuration and three read skills have been exercised end to end with Codex
CLI `0.146.0-alpha.9.2` in trusted local Git repositories. The campaign skill has also
been exercised through exact non-production planning and canonical rejection of
chat-only approval; real approved provider apply and verification remain separate
gates. This is bounded private-development evidence, not certification of every Codex
release, the desktop app lifecycle, public marketplace distribution, remote MCP, hosted
identity, or a supported SaaS integration.

### Private Codex workflow skills

After configuring the project MCP binding, register the repository-local marketplace and
install the private workflow plugin:

```bash
codex plugin marketplace add /absolute/path/to/checkout/unisane-ops
codex plugin add unisane-ops@unisane-local
```

Start a new Codex task so it loads the four skills: Growth health review, SEO opportunity
research, Growth measurement audit, and controlled campaign pause. The skills add
plain-language workflow guidance only. They use the existing `unisane_ops` server and
cannot widen its target, tool list, permissions, or effect ceiling. The campaign skill
can plan, review, apply an already human-approved plan, and verify; it cannot approve.

Remove the private installation with:

```bash
codex plugin remove unisane-ops@unisane-local
codex plugin marketplace remove unisane-local
```

This repository marketplace is a local development distribution path, not a public
marketplace listing or hosted integration.

## Host Contract

The host loads a fixed first-party pack list from sealed manifests and validates package
identity, installed version, integrity, trust, and namespace collisions before importing
an exact handler. Unknown commands fail closed. There is no package scanning, remote
download, arbitrary import, or catch-all subprocess fallback.

JSON mode emits one structured result with actual effect, write targets, diagnostics,
artifacts, and next actions. Provider and mutation commands retain their explicit
inventory, plan, approval, confirmation, lock, receipt, and drift boundaries.

Framework authoring is contributed by `@unisane/framework-ops`; Growth, MCP, and provider
execution retain their independently owned technical packages behind this one product
entrypoint.

## License

MIT
