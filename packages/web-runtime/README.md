# @unisane/web-runtime

Portable runtime capabilities for websites built with Unisane or any compatible TypeScript
application.

The package owns browser-neutral tracking, consent and attribution, explicit React and Next
adapters, server-side conversion contracts and delivery adapters, pure SEO helpers, Next metadata
adapters, and deterministic test utilities. React and Next are optional peers; applications install
them only when they use the matching adapter entrypoints.

## Entrypoints

- `@unisane/web-runtime/tracking`
- `@unisane/web-runtime/tracking/react`
- `@unisane/web-runtime/tracking/next`
- `@unisane/web-runtime/conversions`
- `@unisane/web-runtime/conversions/google-ads`
- `@unisane/web-runtime/conversions/meta`
- `@unisane/web-runtime/seo`
- `@unisane/web-runtime/seo/next`
- `@unisane/web-runtime/contracts`
- `@unisane/web-runtime/observations`
- `@unisane/web-runtime/testing`

The observation adapters emit only bounded, redacted field-state evidence. They hash identity inputs
before recording and are portable across commerce, lead, and other web products. They do not perform
provider calls, manage GTM, or decide whether evidence is good enough for optimization.

Growth may consume the runtime-neutral schemas from `@unisane/web-runtime/contracts`. GTM management
workflows, Growth reconciliation and reporting, campaign decisions, and persistent public URL state
are deliberately outside Web Runtime.

## Reliable conversions

Browser tracking and confirmed business outcomes are different signals. Products own what
constitutes a conversion. A successful subscription payment, accepted lead, completed import or
other outcome can produce a server event even when the customer browser is gone. Do not invent
browser counterparts to improve a coverage percentage.

### Contracts and ownership

Normalized envelopes now contain `schema_version: 2` and `occurred_at`. Set `eventId` and
`occurredAt` from the business occurrence. Browser and server copies must receive the same ID. When
a transaction ID is supplied without an event ID, normalization derives an identity from
application, scope, event name and transaction ID. Use a payment/invoice occurrence ID for each
renewal, not the subscription ID shared by all renewals. Random IDs remain available for one-off
best-effort normalization; reliable publication rejects missing stable identity.

`createReliableConversionPublisher` publishes `marketing.conversion.requested.v1` through an
injected `publishReliable` method, directly compatible with Core EventRuntime. It does not own a
second queue, database, worker or scheduler. The host owns the transaction, durable outbox, worker
lifetime, wakeup after commit and configured retry limits. A host outside Unisane can supply an
equivalent transactional publisher. Do not substitute an in-memory fire-and-forget function and call
that durable delivery.

The delivery binding includes project, environment, application, tenant/scope, provider and
destination. Credentials are resolved by the transport on each attempt and never serialized in the
outbox. The subscriber checks both the job binding and the transport's destination.

### Compose with Core events

Use approved immutable package versions. The following composition uses the host's existing
`EventRuntime`, schema registry and outbox; it does not import Core repository source:

```ts
import {
  WEB_CONVERSION_DELIVERY_EVENT,
  webConversionDeliverySchema,
  createReliableConversionPublisher,
  createConversionDeliverySubscriber,
  resolveConversionRetryDelayMs,
} from '@unisane/web-runtime/conversions';
import { createMetaCapiWebConversionTransport } from '@unisane/web-runtime/conversions/meta';
import { processOutboxBatch } from '@unisane/events';

schemas.register({
  type: WEB_CONVERSION_DELIVERY_EVENT,
  schema: webConversionDeliverySchema,
  module: 'marketing',
  reliable: true,
});

const binding = {
  projectId,
  environment,
  appId,
  scopeId,
  provider: 'meta',
  destinationId: datasetId,
};
const publisher = createReliableConversionPublisher({
  config: { appId },
  binding,
  publishReliable: runtime.publishReliable.bind(runtime),
});
const deliver = createConversionDeliverySubscriber({
  binding,
  transport: createMetaCapiWebConversionTransport({
    pixelId: datasetId,
    accessTokenProvider: () => credentials.readMetaToken(),
    eventNames: { payment_completed: 'Purchase' },
    timeoutMs: 10_000,
  }),
  isDeliveryAllowed: (delivery) => permissions.allowAdvertising(delivery),
  recordReceipt: (receipt) => evidenceStore.record(receipt),
  maxEventAgeMs: destinationPolicy.maxEventAgeMs,
});

// In a single-binding runtime. A shared host must route by the complete binding
// before invoking its selected subscriber; do not broadcast to all destinations.
runtime.on(
  WEB_CONVERSION_DELIVERY_EVENT,
  (event, context) => {
    if (!context) throw new Error('Conversion delivery requires a durable worker context.');
    return deliver(event.payload, context);
  },
  { subscriberId: 'marketing-conversion-delivery-v1' },
);

// From the host's existing worker invocation, after commit:
await processOutboxBatch({
  outbox,
  workerId,
  limit: 25,
  resolveRetryDelayMs: resolveConversionRetryDelayMs,
  deliver: (claim, context) => runtime.deliverOutbox(outbox, claim, context),
});

// In the same transaction that records the successful business outcome:
await publisher.publish(
  {
    name: 'payment_completed',
    scopeId,
    eventId: confirmedPayment.eventId,
    transactionId: confirmedPayment.id,
    occurredAt: confirmedPayment.confirmedAt,
    consent: confirmedPayment.advertisingConsent,
    customer: confirmedPayment.matchingContext,
    value: confirmedPayment.amount,
    currency: confirmedPayment.currency,
    items: confirmedPayment.items,
  },
  { transaction },
);
```

Register the schema before the registry freezes. Configure the Core runtime's request scope
consistently with the binding. Use the existing Core outbox worker to call `runtime.deliverOutbox`;
subscriber checkpoints, claiming, lease renewal, retry and restart recovery remain Core-owned. A
rollback must roll back both the business outcome and publication. Provider I/O starts only in the
worker after commit. The host should wake that worker promptly; periodic recovery is the fallback.
Core forwards the claimed attempt number and cancellation signal to subscribers. The transport also
enforces its own bounded deadline.

The provider failure must not undo an already committed product action. An unavailable outbox at
transaction time is a host reliability decision: never silently drop the intent. Use the existing
durable domain outcome and its recovery process if the product must proceed independently.

### Receipts and recovery

- Provider adapters return `accepted` or `skipped`; HTTP success alone is insufficient.
- Meta acceptance requires the expected `events_received` count. Google acceptance requires nonempty
  per-conversion results and no partial failure. Validation-only requests are not sales.
- Timeouts, unconfirmed responses and transport failures are uncertain. Retry the same persisted
  envelope and ID. Rate limits and server errors are retryable; provider payload rejections are
  terminal for that immutable attempt.
- `createConversionDeliverySubscriber` persists a receipt before acknowledging delivery. A failed
  evidence write is retried with the same provider event ID.
- Terminal rejection, expired delivery windows and consent suppression produce a terminal receipt
  and consume the outbox job. A delivered outbox row means the handler finished, not that the
  advertising provider accepted a conversion. Inspect the receipt outcome.
- Correct invalid jobs through a reviewed repair policy. A retry must not silently replace the
  occurrence time or reuse the identity for a different business outcome.
- Empty responses, raw exception strings and void third-party transport results never become
  accepted receipts. Custom durable transports must declare their provider/destination and return
  the receipt contract. Low-level upload functions remain available to explicit provider callers.

`createConversionReceiptObservationRecorder` connects receipts to the existing outbox observation
adapter and Growth ingestion contract. It hashes identity references and records accepted,
suppressed, rejected or unknown evidence without raw customer values. The host must persist the sink
or ingest its artifacts into Ops; the in-memory sink is only a simulator/test utility. Receipts
include the worker attempt, start/completion time, elapsed duration and redacted evidence from the
mapped provider request. Field presence describes the attempted payload, not proof of matching or
attribution. Observation capture time preserves the receipt time even during later import; compare
it with occurrence time for delivery freshness. Abandoned claims may leave gaps in attempt numbers
because no provider call occurred on that claim.

Both HTTP transports parse Retry-After seconds/dates. The retry resolver unwraps Core aggregate
errors, keeps exponential backoff and applies provider delays up to Core's 24-hour retry bound. It
schedules a later outbox attempt rather than sleeping in a worker. Known Google invalid-input
failures are terminal; too-recent event/action errors defer six hours. Unknown codes and mixed batch
responses remain uncertain. See
[Google's conversion error definitions](https://github.com/googleapis/googleapis/blob/master/google/ads/googleads/v21/errors/conversion_upload_error.proto).

A captured consent grant is not permanent permission. Every durable send requires the host's
`isDeliveryAllowed` check so revocations can suppress an already queued event. Missing or unknown
advertising consent also suppresses provider conversion mapping.

### Matching context

`customer` has typed pre-hashed email, phone, first/last name, city, region, postcode, country and
external ID fields, plus unhashed IP, user agent, source URL, `fbp` and `fbc`. Meta validates hashes
and transport identifiers. Its helpers normalize/hash email, international phone digits, name,
location and ISO country code. Do not pass hashes to raw-value hashing helpers. Do not infer a
country or city in the framework, use staff request data as customer data, or synthesize browser
identifiers. Adopters own the source and permitted use of these values. Store sensitive context with
host access controls and retention policy; only redacted evidence belongs in Ops diagnostics.

Google reads `customer.hashedEmail` and `customer.hashedPhone`; it no longer reads customer hashes
from untyped `properties`. Use its `hashGoogleAdsEmail` and `hashGoogleAdsPhoneNumber` helpers when
building a Google-bound envelope. Google normalizes Gmail dots and hashes an explicit E.164 phone
including `+`; Meta hashes international digits without `+`. These destination-specific hashes are
not interchangeable. The framework never guesses a calling country. See
[Google's identifier contract](https://developers.google.com/google-ads/api/reference/rpc/v22/UserIdentifier).

Canonical item fields normalize to snake_case. Meta maps `item_id` to `contents[].id`, sends the
exact per-event item list, and computes `num_items` from quantities. It never forwards a generic
commerce object as a provider-specific item.

### Browser guarantees and limits

Disabled tracking has no attribution-store or transport side effects. Advertising storage consent
controls cookie capture/write, and advertising-data consent controls automatic attribution in
emitted payloads. Withdrawal clears the owned cookie names at the configured path/domain. Malformed
cookies are ignored, valid click IDs retain case and contents, and the same click retains its
original timestamp. Semantic dedupe keys override freshly generated IDs; TTL expiry is per key. GTM
transport clears commerce and matching fields before each event to prevent dataLayer merging from
carrying old items/identifiers into the next event.

The adopter supplies a consent UI and restores the actual choice before tracking initialization.
Google consent commands do not automatically enforce consent on arbitrary third-party GTM tags:
configure each tag's consent requirements. Application-supplied parameters must contain permitted
values; the framework cannot infer the sensitivity of arbitrary custom fields. See Google's
[consent integration guidance](https://developers.google.com/tag-platform/security/guides/consent).
Browser emission is only evidence of enqueueing to dataLayer. It does not prove provider receipt,
and delivery cannot be guaranteed after page closure or when tags are blocked.

### Upgrade and migration

This is a coordinated contract upgrade. Custom attribution stores must implement `clear()`; provider
transports now return receipts and require explicit advertising permission. Existing adopters must
supply consent and stable occurrence time before enabling the new conversion path. Do not
hot-upgrade a production sender without updating its composition.

Apply the Core PostgreSQL migration `events__003_outbox_deduplication` before upgrading keyed
publication. New keyed rows enforce uniqueness and reject changed payloads under the same key.
Replaying an accepted intent returns its existing row without requeueing it. The migration leaves
historical rows unkeyed; it does not guess or backfill identities. Drain/reconcile the old backlog
and retain the same provider ID/time when crossing the upgrade. Keep conversion intent immutable.

The coordinated Core release must provide handler `EventDeliveryContext` and worker
`resolveRetryDelayMs`. Older Core versions do not satisfy this integration. Other hosts must supply
the actual durable attempt number; the subscriber rejects missing context rather than recording an
invented first attempt. The changeset records the package contract changes for release.

`migrateWebConversionEnvelope` upgrades a historical envelope using an explicit historical
occurrence time and consent evidence. It preserves event identity; records without identity require
manual reconciliation. The reliable delivery schema rejects incompatible records instead of silently
reinterpreting them. Run migration in the host's durable store, drain old workers and switch one
sender per event. Do not replay already accepted events during deployment. Provider API versions
remain explicit configuration. Shared Meta pins are exported from `@unisane/web-runtime/contracts`
and reused by the provider package; the existing Graph and campaign-control versions are unchanged.

Package checks cover consent, identity, mapping, deadlines, classified retries and receipt evidence.
The packed-package integration fixture uses the real Core EventRuntime, worker and PostgreSQL
adapter against PostgreSQL 17. It verifies atomic rollback, duplicate intent/collision handling,
provider-directed next-run time, durable receipts, host restart and abandoned-claim recovery. It
imports installed archives, never sibling source. Run it against a disposable localhost database
named `conversion_test`:

```sh
CONVERSION_TEST_DATABASE_URL=postgresql://.../conversion_test \
  pnpm --filter @unisane/web-runtime test:core-integration /path/to/packed-artifacts
```

The directory must contain current packed Web Runtime, Core events, outbox-postgresql, kernel,
config and primitives packages. The runner creates an isolated consumer and schema. Provider HTTP is
simulated: this proves package/database integration, not live account acceptance or attribution.
Adopter worker deployment, consent/tag configuration and live verification belong to adopter
rollout.
