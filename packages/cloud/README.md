# @unisane/cloud

Provider-neutral cloud operations contracts and workflows. The admitted Cloudflare
surface includes DNS inventory/import/plan/apply plus account, zone, Queue, Worker,
route, queue-binding, variable, secret declaration, and Cron inventory/plan/apply.

Provider packages implement only exact schema-first coordinates such as
`@unisane/cloud/contracts`; they never import this package root or its orchestration.
Applications may use these contracts outside Unisane Framework.

`@unisane/cloud/aws-contracts` publishes the shared AWS config, inventory, plan, report,
reader, and executor types consumed by `@unisane/provider-aws`. It is a contract
coordinate, not a second AWS workflow owner: AWS credential access, SDK transport, and
the currently proven AWS-specific expert workflows remain in the provider-family
package.

The package owns the exact `cloud dns inventory|import|plan|apply` handlers plus the
expert `provider cloudflare dns inventory|plan|apply` aliases over the same workflows.
It also owns `cloud inventory|check|env`, capability-first
`cloud queues|workers|cron inventory|plan|apply`, and exact expert Cloudflare aliases.
Inventory is provider-bound, import creates an offline reviewable desired-state proposal
for explicitly selected zones, planning is deterministic and offline from an explicit
inventory artifact, and apply retains approval, lease, replay, receipt, and drift
enforcement. Import never rewrites project configuration.
The CLI host supplies config, artifacts, state, and providers through the narrow pack
runtime binding; Cloud never imports a provider implementation.

The current `0.1` artifact schema is pre-stable. Plans created before the versioned
engine safety envelope was introduced must be regenerated and cannot be applied.
Queue, Worker, and Cron apply is available for local non-production single-developer
execution. Production, automation, and multi-process mutation requires a host-supplied
durable approval/artifact store plus an atomic durable lock and therefore fails closed
in the canonical local host.
