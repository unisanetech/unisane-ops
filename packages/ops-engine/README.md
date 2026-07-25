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

The package does not select providers, resolve Commander commands, import Framework
runtime code, or choose secret/state implementations.
