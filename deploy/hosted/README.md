# Unisane Ops Hosted Deployment Foundation

Portable deployment assets for the private authenticated hosted read spine. They prove
artifact isolation, explicit migration, secret references, role separation, probes,
resource bounds, rolling replacement, and container-to-container execution. They are a
foundation for a managed environment, not a public hosted release.

## Release artifact contract

Release builds use the checked-in Bake target so the pushed multi-platform OCI index
contains maximum SLSA v1 provenance and an SPDX SBOM:

```sh
RELEASE_IMAGE=<registry>/unisane-ops-hosted-runtime:<release> \
RELEASE_SOURCE=<source-repository-url> \
RELEASE_REVISION=<source-commit> \
RELEASE_VERSION=<release-version> \
docker buildx bake \
  --file unisane-ops/deploy/hosted/release/docker-bake.hcl \
  --push
```

The image runs as the non-root `node` user and contains only `@unisane/ops-engine`,
`@unisane/ops-hosted-postgresql`, `@unisane/ops-hosted-runtime`, and their production
dependencies. The default command starts the gateway. Worker and migration workloads
override it with `dist/bin/worker.js` and `dist/bin/migrate.js`.

Never pass credentials through build arguments: maximum provenance records build
parameters. Registry authentication stays in the release runner. Sign the resulting
index digest through the release runner's short-lived OIDC identity, not a repository
key, then verify the exact digest, signer identity, issuer, provenance, and SBOM:

```sh
cosign sign --yes <registry>/unisane-ops-hosted-runtime@sha256:<digest>

OPS_HOSTED_RELEASE_IMAGE=<registry>/unisane-ops-hosted-runtime@sha256:<digest> \
OPS_HOSTED_SIGNER_IDENTITY=<exact-release-identity> \
OPS_HOSTED_SIGNER_OIDC_ISSUER=<https-oidc-issuer> \
OPS_HOSTED_EXPECTED_SOURCE=<source-repository-url> \
OPS_HOSTED_EXPECTED_REVISION=<source-commit> \
node unisane-ops/deploy/hosted/release/verify-release.mjs
```

The verifier rejects tags and placeholder digests before invoking registry tools. It
uses exact identity and issuer matching, verifies the signature through Cosign, and
requires SLSA v1 provenance for the expected repository and commit plus an SPDX SBOM on
the signed OCI index. Run releases only from a clean checkout so the recorded commit and
the build context are the same source. Cosign is a release-runner dependency; it is not
installed in the application image.

The runtime image is deliberately product-neutral. Before deployment, build a downstream
image that adds one bundled, immutable `createHostedWorkerActions()` module under
`/app/actions`. Pin the final image by digest. Never provide executable action code
through a mutable runtime volume.

Provider credentials use the engine's envelope-cipher port and PostgreSQL encrypted
credential-version store. A real deployment must supply a reviewed KMS adapter in its
downstream immutable composition and authorize it through short-lived workload identity.
Do not add a repository-owned master key, pass KMS credentials in the image or
environment, or let provider action modules query credential tables directly. Prove KMS
key policy, authenticated-context binding, rotation, revocation, availability, and audit
in the selected environment before enabling provider-backed hosted actions.

## Kubernetes rollout

The Kubernetes templates use a ClusterIP-only gateway, independently runnable gateway,
worker, and scheduler Deployments, a migration Job, restricted pod security, non-root and
read-only containers, resource limits, health probes, and a gateway disruption budget.

Before rendering:

1. replace the example OIDC issuer and JWKS URL through an environment overlay;
2. set the same verified downstream image digest in the migration, runtime, and
   rollback-check overlays;
3. provision distinct database owner, gateway, worker, and scheduler login roles;
4. create `unisane-ops-hosted-database-owner`,
   `unisane-ops-hosted-database-gateway`, and
   `unisane-ops-hosted-database-worker`, and `unisane-ops-hosted-database-scheduler` in
   the `unisane-ops` namespace, each with a role-specific `postgres-url` key from an
   approved secret manager;
5. confirm `/app/actions/hosted-actions.js` exists in the selected downstream image.

Render all three overlays and run the digest verifier without
`--allow-placeholder`. It rejects a mutable tag, the checked-in zero placeholder, or
different migration, gateway, worker, and rollback-check digests:

```sh
node unisane-ops/deploy/hosted/release/verify-manifests.mjs \
  <migration-overlay> \
  <runtime-overlay> \
  <rollback-check-overlay>
```

Apply and wait for migration before changing runtime Deployments:

```sh
kubectl delete job unisane-ops-hosted-migrate -n unisane-ops --ignore-not-found
kubectl apply -k unisane-ops/deploy/hosted/kubernetes/migration
kubectl wait -n unisane-ops --for=condition=complete --timeout=5m \
  job/unisane-ops-hosted-migrate
kubectl apply -k unisane-ops/deploy/hosted/kubernetes/runtime
kubectl rollout status -n unisane-ops deployment/unisane-ops-hosted-gateway
kubectl rollout status -n unisane-ops deployment/unisane-ops-hosted-worker
```

If migration fails, do not roll runtime workloads. Inspect the safe migration failure
class and database service health; credentials and connection strings must not be copied
into tickets or logs. Runtime startup remains non-mutating and refuses an incompatible
schema.

The migration job applies grants only to the already provisioned
`unisane_ops_gateway`, `unisane_ops_worker`, and `unisane_ops_scheduler` roles. Change those non-secret role names
through an overlay when needed. It never creates login credentials. Keep the owner URL
out of runtime Deployments; gateway and worker must use their dedicated URLs.

For rollback, first verify the previous digest and signer policy, patch only the
rollback-check overlay to that digest, and run its one-shot schema probe against the
current database. The probe uses the candidate image's own migration contract and must
complete before runtime workloads are patched to the same digest. A schema-changing
release requires a tested forward repair or database restore plan; rolling back
application code alone is not assumed safe.

## Focused release-policy proof

The repository contract checks are intentionally registry-free:

```sh
node --test \
  unisane-ops/deploy/hosted/release/policy.test.mjs \
  unisane-ops/deploy/hosted/release/verify-release.test.mjs
node unisane-ops/deploy/hosted/release/verify-build-contract.mjs
node unisane-ops/deploy/hosted/release/verify-manifests.mjs --allow-placeholder
```

`--allow-placeholder` exists only to validate that the checked-in templates share one
digest field. Never use it in a deployment pipeline; the normal command rejects the
zero placeholder.

## Focused container proof

Run the isolated proof from the repository root:

```sh
node unisane-ops/deploy/hosted/verify-container-deployment.mjs
```

It creates temporary test-only secret files outside the repository, builds both the
production and integration stages, checks the production dependency closure and non-root
user, runs PostgreSQL and an integration-only OIDC issuer, completes the migration gate,
starts separate gateway and worker containers, executes authenticated admission through
durable result retrieval, proves a different project identity receives the same
not-found response as a missing job, performs a custom-format PostgreSQL backup, restores
into a newly created database, compares migrations, jobs, dispatch, audit, results,
read schedules and occurrences, encrypted credential records and versions, and removes
its containers, network, volumes, and temporary secret files.

## Backup and recovery

The separate `postgres-tools` image contains PostgreSQL 16 client tools and the portable
backup, restore, and logical verification scripts. It receives connection URLs only by
mounted secret file, converts them into a mode-0600 temporary libpq service file, never
puts credentials in process arguments or output, and deletes the service file on exit.
The restore script refuses an existing recovery database.

Use the database provider's encrypted, point-in-time recovery as the primary production
mechanism. Also schedule an encrypted custom-format export at a cadence derived from the
accepted recovery-point objective. At least monthly and before a schema-changing release,
restore a recent artifact into an isolated database, run the exact runtime schema probe,
compare durable action/audit state, and record elapsed recovery time against the accepted
recovery-time objective. A backup is not certified until that rehearsal succeeds.

If backup fails, retain the prior verified artifact and alert without replacing it. If
restore or comparison fails, quarantine the recovery database, do not promote it, retain
the source and artifact for incident analysis, and retry only after the failure class is
understood. Never copy connection URLs, dump contents, or temporary state snapshots into
logs or tickets.

## Remaining release gates

This foundation proves application-level project isolation, a provider-neutral encrypted
credential lifecycle, portable logical backup/restore behavior, and a cloud-neutral
signed-release and digest-locked deployment contract. It does not certify a managed KMS
or cloud workload-identity deployment, managed-provider point-in-time recovery or
encrypted artifact custody, a real production registry signer identity, cluster
admission enforcement, managed rollout/rollback, alerting and incident ownership,
remote MCP, schedule management, or mutation. Those require environment-specific
evidence before public or production use.
