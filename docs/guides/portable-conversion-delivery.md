---
id: DOC-20260911-portable-conversion-delivery
owner: unisane-ops
repository: unisane-ops
scope: workspace
role: guide
lifecycle: durable
authority: canonical
provenance: accepted
view: current
---

# Portable event and conversion delivery

The [Web Runtime package guide](../../packages/web-runtime/README.md#reliable-conversions) owns the
public API, composition example, migration and host responsibilities. This system is shared across
Unisane adopters; it contains no product-specific purchase definition, OTP requirement or country
rule.

Core continues to own transactional events, outbox adapters, worker claiming and recovery. Web
Runtime owns portable tracking/conversions and provider mapping. Growth consumes the existing
observation contract. Hosts supply persistence, credentials, execution and current consent checks.
Products define business success and provide permitted customer context.

Implementation status on 2026-09-11: package checks and a passing installed-archive integration with
the real Core runtime, worker and PostgreSQL adapter are implemented. The integration covers
transaction rollback, idempotent insertion, changed-payload rejection, retry delay, receipts and
worker recovery. The PostgreSQL deduplication migration and new Core delivery context are
coordinated release prerequisites. Provider HTTP is simulated; this does not certify a live
advertising account. Publishing, adopter wiring, production worker execution, GTM tag configuration
and live provider acceptance are separate release/integration work. TrueResume has not been changed
or certified in this batch.
