# `@unisane/ops-hosted-postgresql`

Standalone PostgreSQL persistence for the Unisane Ops hosted read runtime. The package
implements the transport-neutral contracts from `@unisane/ops-engine/hosted`; it does
not depend on the Unisane Framework, a console, an HTTP server, or an MCP transport.

Schema changes are explicit. A deployment runs `migratePostgresHostedReadPersistence`
before starting gateway or worker roles. Runtime composition never performs migrations
implicitly.

This package proves a production-database boundary. Managed identity, provider secret
custody, remote transport, backup/restore operations, scheduling, and mutations remain
separate release gates.
