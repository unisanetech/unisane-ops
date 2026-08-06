# Unisane Ops Hosted Runtime

Internal modular-monolith composition for separately runnable hosted gateway, worker,
and scheduler roles. It keeps admission authority out of workers and action execution
out of the gateway and scheduler. Process lifecycles add startup probes, readiness, structured payload-free
events, bounded polling, retry/dead-letter classification, lease recovery, and graceful
`AbortSignal` shutdown.

The package builds five independent Node.js executables:

- `unisane-ops-hosted-gateway` exposes the private read-action HTTP boundary, validates
  OIDC bearer tokens against one exact issuer and audience, authorizes principal,
  `scopeId`, and project-bound admission and reads, and never loads an action executor.
- `unisane-ops-hosted-worker` loads one explicit action module, claims durable work from
  PostgreSQL, persists bounded results or safe failures, and has no admission authority.
- `unisane-ops-hosted-scheduler` claims due read schedules, atomically materializes the
  existing job/dispatch/audit bundle, and never loads or executes actions.
- `unisane-ops-hosted-migrate` applies the explicit PostgreSQL migration inventory as a
  one-shot release step and confirms the resulting exact revision.
- `unisane-ops-hosted-probe` confirms PostgreSQL connectivity and exact schema revision
  for worker startup and readiness checks without mutating state.

Runtime roles fail startup when the explicit PostgreSQL migration revision is incompatible,
write payload-free JSON-line lifecycle events, and stop on `SIGINT` or `SIGTERM` within a
configured shutdown window. The gateway exposes `GET /live`, `GET /ready`,
`POST /internal/v1/read-actions`, and `GET /internal/v1/read-actions/:jobId`. The HTTP
surface is private/internal and read-only; it is not the public API or remote MCP
contract.

## Deployment contract

Run migrations as a distinct release step before starting either role. The runtime
checks the exact migration inventory but never changes schema implicitly.

The PostgreSQL connection may be supplied directly through
`OPS_HOSTED_POSTGRES_URL` for controlled local execution or through
`OPS_HOSTED_POSTGRES_URL_FILE` for deployment secret mounts. Configure exactly one.
The file is read only during process startup and its value is never included in
structured observations or safe error responses.

OIDC identity must carry both non-empty `scope_ids` and `project_ids` claims. Gateway
admission rejects a request outside either claim set. PostgreSQL-backed retrieval applies
principal, scope, and project predicates in the query and returns the same not-found
shape for missing and unauthorized jobs.

For production-shaped grants, provision distinct login roles before migration and set
`OPS_HOSTED_GATEWAY_DB_ROLE`, `OPS_HOSTED_WORKER_DB_ROLE`, and
`OPS_HOSTED_SCHEDULER_DB_ROLE` on the migration job. The
migration owner keeps schema authority; the gateway role receives only admission and
authorized-read capabilities plus encrypted credential lifecycle writes. The worker
receives only dispatch, execution, result, and audit capabilities plus exact active
encrypted credential-version reads. The scheduler receives only schedule/occurrence and
admission-bundle persistence grants and no credential-table access. Runtime workloads use
separate mounted database connection secrets.

Gateway configuration:

- `OPS_HOSTED_ROLE=gateway`
- one PostgreSQL connection source
- `OPS_HOSTED_OIDC_ISSUER`
- `OPS_HOSTED_OIDC_JWKS_URL`
- optional `OPS_HOSTED_HTTP_HOST`, `OPS_HOSTED_HTTP_PORT`,
  `OPS_HOSTED_HTTP_BODY_BYTES`, and `OPS_HOSTED_SHUTDOWN_MS`

Worker configuration:

- `OPS_HOSTED_ROLE=worker`
- one PostgreSQL connection source
- `OPS_HOSTED_WORKER_ID`
- `OPS_HOSTED_ACTION_MODULE`, whose module exports `createHostedWorkerActions()`
- optional polling, lease, retry, recovery, result-size, and shutdown limits

Scheduler configuration:

- `OPS_HOSTED_ROLE=scheduler`
- one PostgreSQL connection source
- `OPS_HOSTED_SCHEDULER_ID`
- optional polling, lease, recovery, and shutdown limits

OIDC tokens must use the canonical `unisane.ops` audience. Readiness means the role is
serving and its schema probe passed. Route traffic only
after `/ready` returns success; remove traffic before sending the termination signal.
Lifecycle output contains role, event kind, and safe metadata only. Do not put access
tokens, provider credentials, raw action inputs, or result payloads in environment
labels, logs, or probes.

The engine and PostgreSQL adapter provide a provider-neutral envelope-cipher and
credential-lifecycle contract, but this generic runtime image does not contain a KMS
adapter or development master key. A downstream managed deployment must bind the cipher
to its KMS through workload identity and inject the resulting worker credential resolver
into reviewed provider action composition. Decrypted bytes remain callback-scoped and
credential-containing callback results are rejected; bytes must never enter action
inputs, outputs, jobs, schedules, logs, or telemetry.

This proof does not provide schedule-management APIs, scheduled mutation, OAuth callback
or consent UX, managed KMS/workload-identity provisioning, remote MCP,
managed-provider backup custody, or a public production service contract.

## OCI image

The package Dockerfile builds a non-root production image with only the runtime,
PostgreSQL adapter, engine, and production third-party dependencies. Its default command
starts the gateway; deployments select the gateway, worker, scheduler, migration, or probe binary
explicitly. The `integration` build target adds test-only action and OIDC fixtures and
must never be promoted.

The production runtime image intentionally does not own a product action registry. A
downstream deployment image must add one bundled, reviewed action module and set
`OPS_HOSTED_ACTION_MODULE` to that image-owned file. Do not mount executable action code
from a mutable ConfigMap or infer it from a workspace.

Portable deployment manifests and the container verification workflow live under
`unisane-ops/deploy/hosted`.
