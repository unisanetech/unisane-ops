# @unisane/ops-engine

Provider-neutral, headless contracts and safety logic for inventory, plan, approval,
apply-lock, receipt, replay, drift, redaction, and operational state.

The root export contains schemas, policies, lifecycle validation, and state-port
interfaces. Generic mutation identity uses `projectId`; Framework integrations map their
tenant `scopeId` only at their boundary. `@unisane/ops-engine/local` contains explicit
single-host filesystem artifact, approval, receipt, and atomic lease adapters.
Production, automation, and multi-process mutation require separately supplied durable
state. `@unisane/ops-engine/testing` contains deterministic test adapters.
`@unisane/ops-engine/pack` defines static manifests, structured command results, and one
generic host-runtime binding seam; it does not know provider or suite-specific types.

`@unisane/ops-engine/actions` defines transport-neutral read-action schemas and typed
execution context. `@unisane/ops-engine/execution` owns durable admission, leased worker
claims, cancellation, recovery, terminal results, and audit ports. A hosted runtime
rejects local-only job state. Concrete databases, queues, providers, CLI parsing, and UI
remain outside the engine.

`@unisane/ops-engine/workflows` owns strict, bounded workflow-run, context-brief,
evidence-reference, handoff, invalidation, and resume contracts. Context briefs carry
explicit actor, scope, project, and environment identity without raw transcript or
secret fields. Handoffs resume from stable run and evidence revisions and stop when
supporting evidence changes.

The initial read-only execution slice uses an at-least-once worker contract. Stores must
atomically enforce the scoped idempotency identity and claim transitions. Expired claims
are recoverable, action input is normalized before hashing and persistence, and only
explicit safe errors may enter durable job state.

The package does not select providers, resolve Commander commands, import Framework
runtime code, or choose secret/state implementations.
