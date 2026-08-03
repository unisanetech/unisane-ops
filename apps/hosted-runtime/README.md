# Unisane Ops Hosted Runtime

Internal modular-monolith composition for separately runnable hosted gateway and worker
roles. It keeps admission authority out of workers and action execution out of the
gateway. Process lifecycles add startup probes, readiness, structured payload-free
events, bounded polling, retry/dead-letter classification, lease recovery, and graceful
`AbortSignal` shutdown.

The process entrypoints receive transport, authorization, action registry, persistence,
and observation dependencies from their deployment host. This package exposes no
public HTTP or MCP transport, authentication protocol, managed secret custody,
scheduler, provider mutation, or production deployment contract.
