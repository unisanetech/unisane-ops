# `@unisane/ops-hosted-postgresql`

Standalone PostgreSQL job, schedule, and encrypted credential persistence for the
Unisane Ops hosted read runtime. The package
implements the transport-neutral contracts from `@unisane/ops-engine/hosted`; it does
not depend on the Unisane Framework, a console, an HTTP server, or an MCP transport.

Schema changes are explicit. A deployment runs `migratePostgresHostedReadPersistence`
before starting gateway or worker roles. Runtime composition never performs migrations
implicitly.

The schema stores the admitted principal, scope, and project alongside each job. Hosted
reads use `PostgresHostedReadJobStore.getAuthorized` so PostgreSQL applies the exact
principal, allowed-scope, and allowed-project boundary instead of loading a job before
checking access in application memory.

Deployments provision four distinct database identities:

- a migration owner that applies schema revisions and grants;
- a gateway role limited to admission, authorized reads, and encrypted credential
  lifecycle writes;
- a worker role limited to dispatch, execution state, results, audit writes, and exact
  active encrypted credential-version reads;
- a scheduler role limited to schedule claiming and canonical read-job materialization,
  with no credential-table access.

`configurePostgresHostedReadRuntimeRoles` verifies that all runtime roles already exist,
rejects shared or unsafe role names, removes public table access, and applies the
least-privilege grants. The hosted migration process calls it after every migration when
the runtime role names are configured, so new schema revisions do not silently bypass
the role boundary.

Credential records store only non-secret identity and lifecycle metadata. Version rows
store an authenticated encrypted envelope: algorithm, KMS key identity, wrapped data
key, nonce, and ciphertext. Creation, rotation, and revocation are transactional. Worker
lookup requires the exact active version plus `scopeId` and project; stale, revoked, or
cross-project versions return no credential. The package contains no KMS implementation
or development master key.

Portable backup, empty-database restore, and recovery verification executables live in
`unisane-ops/deploy/hosted/postgres-tools`. Managed KMS/workload identity, encrypted
backup storage and retention, point-in-time recovery, remote transport, and mutations
remain separate release gates.
