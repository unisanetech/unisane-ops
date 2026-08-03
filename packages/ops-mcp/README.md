# @unisane/ops-mcp

Project-scoped local MCP access to proven Growth analysis and controlled-action
workflows.

## Boundary

The package exposes these bounded, goal-oriented tools:

- `review_growth_health`
- `research_seo_opportunities`
- `audit_growth_measurement`
- `plan_campaign_pause`
- `review_campaign_pause`
- `apply_approved_campaign_pause`
- `verify_campaign_pause`

The embedding host supplies one absolute project root, one project and environment,
one agent principal, and already validated Growth and marketing configuration. Tool
calls must repeat the same project and environment. The server rejects mismatches and
does not accept arbitrary paths, prompts, commands, secrets, provider credentials, or
generic provider operations.

The campaign-pause tools expose four deliberately separate stages. Planning creates a
stored, evidence-bound proposal; review reads that exact lifecycle; apply accepts only
an already approved plan; verification performs the later status read. MCP has no tool
that grants approval. A human or separately authorized product surface must create the
authoritative approval, and the immutable receipt records the agent principal that
executed it. Repeating a successful apply returns the stored lifecycle instead of
calling the provider again.

Every successful workflow returns a bounded actor-scoped context brief and structured
handoff. A later session using the same configured actor can pass that handoff back as
`resumeFrom` to the same tool. The adapter re-runs current evidence under the original
run identity and returns whether the handoff is still current, the workflow changed, or
supporting evidence changed. A different project, environment, actor, goal, or playbook
is rejected before Growth execution. Raw conversation history and secret or provider
payload fields are not part of the handoff schema.

`createLocalOpsMcpServer(...)` builds the transport-neutral server.
`serveLocalOpsMcpStdio(...)` serves the same factory over local STDIO. STDOUT remains
reserved for MCP protocol messages; hosts must send diagnostics to STDERR. The optional
STDIO options argument lets the embedding host report transport errors out of band and
own shutdown behavior without changing tool semantics.

This package does not load project configuration, provider credentials, or a user
identity. The canonical `unisane mcp serve` command, a private host integration, or a
future hosted adapter owns that composition and passes a fully bound context into this
package. Read-workflow resume is stateless. The canonical local host persists
campaign-pause lifecycle state in the selected project for development use. Production,
automation, multi-process execution, durable team history, authorized actor transfer,
remote transport, and hosted workflow storage require an atomic durable host and are
not provided by this package.

## Agent contract evaluations

Run the offline evaluation suite with:

```sh
pnpm --filter @unisane/ops-mcp eval:agents
```

The suite connects through the official in-memory MCP client and exercises the catalog
as Codex, Claude, Gemini CLI, and CI **contract profiles**. It checks tool
discovery, structured workflow results, bounded evidence, plain-language guidance,
console deep links, actor-scoped resume, changed evidence, wrong-project denial,
actor/workflow replay, unknown prompt and secret fields, sensitive results, and
oversized results. The campaign profile additionally proves separated planning,
unapproved-apply denial, externally authorized approval, agent-attributed execution,
idempotent replay, target binding, and verification.

These profiles describe the MCP capabilities Unisane requires from each host family;
they do not run proprietary host software and are not host/version certification.
Real-host support requires a separately versioned binding plus installation, discovery,
context-budget, permission, upgrade, removal, and end-to-end workflow evidence for the
specific released host version. The contract suite is deterministic, model-free,
provider-free, network-free, and suitable for CI.
