import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import pg from 'pg';
import { createEventSchemaRegistry, createEventRuntime, processOutboxBatch } from '@unisane/events';
import { createPostgresOutboxAdapter } from '@unisane/outbox-postgresql';
import migration1 from '@unisane/events/migrations/postgres/events__001_outbox_lease_contract';
import migration2 from '@unisane/events/migrations/postgres/events__002_optional_metadata_contract';
import migration3 from '@unisane/events/migrations/postgres/events__003_outbox_deduplication';
import {
  createReliableConversionPublisher,
  createConversionDeliverySubscriber,
  resolveConversionRetryDelayMs,
  WEB_CONVERSION_DELIVERY_EVENT,
  webConversionDeliverySchema,
} from '@unisane/web-runtime/conversions';
import { createMetaCapiWebConversionTransport } from '@unisane/web-runtime/conversions/meta';

// This fixture runs only in a disposable database created by the caller.
const url = new URL(process.env.CONVERSION_TEST_DATABASE_URL);
assert(['127.0.0.1', 'localhost'].includes(url.hostname));
assert.equal(url.pathname, '/conversion_test');
const schema = `conversion_${randomUUID().replaceAll('-', '')}`;
const config = { connectionString: url.toString(), options: `-c search_path=${schema}` };
let pool = new pg.Pool(config);
await pool.query(`CREATE SCHEMA ${schema}`);
const migrationContext = { dryRun: false, log: { info() {} } };
for (const create of [migration1, migration2, migration3]) {
  await create({ kind: 'postgres', pool }).up(migrationContext);
}
await pool.query('CREATE TABLE business_outcomes (id TEXT PRIMARY KEY)');
await pool.query('CREATE TABLE conversion_receipts (body JSONB NOT NULL)');
const binding = {
  projectId: 'proof',
  environment: 'test',
  appId: 'app',
  scopeId: 'tenant',
  provider: 'meta',
  destinationId: '123',
};
const input = {
  name: 'lead',
  scopeId: 'tenant',
  eventId: 'lead-1',
  occurredAt: new Date().toISOString(),
  consent: { advertising: 'granted', capturedAt: new Date().toISOString() },
  customer: { hashedEmail: 'a'.repeat(64), sourceUrl: 'https://example.com/lead' },
};
const requests = [];
let failNext = true;
const transport = createMetaCapiWebConversionTransport({
  pixelId: '123',
  eventNames: { lead: 'Lead' },
  accessTokenProvider: () => 'fixture-token',
  httpClient: async (_url, init) => {
    requests.push(JSON.parse(init.body));
    if (failNext) {
      failNext = false;
      return {
        ok: false,
        status: 429,
        headers: { get: () => '120' },
        json: async () => ({ error: {} }),
      };
    }
    return { ok: true, status: 200, json: async () => ({ events_received: 1 }) };
  },
});
function host() {
  const outbox = createPostgresOutboxAdapter({ pool: () => pool });
  const schemas = createEventSchemaRegistry();
  schemas.register({
    type: WEB_CONVERSION_DELIVERY_EVENT,
    schema: webConversionDeliverySchema,
    reliable: true,
  });
  const runtime = createEventRuntime({
    schemas,
    resolveOutbox: () => outbox,
    readContext: () => ({ scope: { type: 'tenant', id: binding.scopeId } }),
  });
  const subscriber = createConversionDeliverySubscriber({
    binding,
    transport,
    isDeliveryAllowed: () => true,
    recordReceipt: async (receipt) => {
      await pool.query('INSERT INTO conversion_receipts VALUES ($1)', [receipt]);
    },
  });
  runtime.on(
    WEB_CONVERSION_DELIVERY_EVENT,
    (event, context) => subscriber(event.payload, context),
    { subscriberId: 'conversion-dispatch' },
  );
  const publisher = createReliableConversionPublisher({
    config: { appId: 'app' },
    binding,
    publishReliable: runtime.publishReliable.bind(runtime),
  });
  return { outbox, runtime, publisher };
}
async function transaction(run) {
  const client = await pool.connect();
  await client.query('BEGIN');
  const callbacks = [];
  const events = [];
  const unit = {
    isActive: true,
    session: { native: { native: { client } } },
    withTransaction: async (handler) => handler(unit.session),
    afterCommit: (callback) => callbacks.push(callback),
    collectEvents: (batch) => events.push(...batch),
    getCollectedEvents: () => events,
  };
  try {
    await run(unit, client);
    await client.query('COMMIT');
    unit.isActive = false;
    for (const callback of callbacks) await callback();
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    unit.isActive = false;
    client.release();
  }
}
const count = async (table) =>
  Number((await pool.query(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n);
let current = host();
try {
  await assert.rejects(
    transaction(async (unit, client) => {
      await client.query("INSERT INTO business_outcomes VALUES ('rolled-back')");
      await current.publisher.publish(input, { transaction: unit });
      assert.equal(
        await count('outbox'),
        0,
        'uncommitted intent must be invisible to a worker connection',
      );
      throw new Error('rollback-test');
    }),
    /rollback-test/,
  );
  assert.equal(await count('business_outcomes'), 0);
  assert.equal(await count('outbox'), 0);
  assert.equal(requests.length, 0);

  await transaction(async (unit, client) => {
    await client.query("INSERT INTO business_outcomes VALUES ('lead-1')");
    await current.publisher.publish(input, { transaction: unit });
    await current.publisher.publish(input, { transaction: unit });
  });
  assert.equal(await count('outbox'), 1, 'same logical intent must create one row');
  await assert.rejects(
    transaction((unit) =>
      current.publisher.publish({ ...input, value: 999, currency: 'USD' }, { transaction: unit }),
    ),
    /OUTBOX_DEDUPE_COLLISION/,
  );
  const process = () =>
    processOutboxBatch({
      outbox: current.outbox,
      workerId: 'proof-worker',
      limit: 1,
      resolveRetryDelayMs: resolveConversionRetryDelayMs,
      deliver: (claim, context) => current.runtime.deliverOutbox(current.outbox, claim, context),
    });
  assert.equal((await process()).failed, 1);
  const failed = (await pool.query('SELECT * FROM outbox')).rows[0];
  assert(failed.next_attempt_at.getTime() - failed.updated_at.getTime() >= 119000);
  assert.equal((await process()).claimed, 0, 'provider-directed retry must not run early');

  // Recreate the host with new DB connections: recovery must use persisted state.
  await current.runtime.dispose();
  await pool.end();
  pool = new pg.Pool(config);
  current = host();
  await pool.query("UPDATE outbox SET next_attempt_at = NOW() - INTERVAL '1 second'");
  const abandoned = await current.outbox.claimBatch({
    limit: 1,
    claimedBy: 'crashed-worker',
    leaseDurationMs: 5000,
  });
  assert.equal(abandoned.length, 1);
  await pool.query("UPDATE outbox SET lease_expires_at = NOW() - INTERVAL '1 second'");
  const recovered = await process();
  assert.equal(recovered.reclaimed, 1);
  assert.equal(recovered.delivered, 1);
  assert.deepEqual(requests[0], requests[1], 'retry must preserve ID, time and payload');
  const receipts = (
    await pool.query("SELECT body FROM conversion_receipts ORDER BY body->>'recordedAt'")
  ).rows.map((row) => row.body);
  assert.deepEqual(
    receipts.map((receipt) => receipt.attempt),
    [1, 3],
  );
  assert.deepEqual(
    receipts.map((receipt) => receipt.outcome),
    ['unknown', 'accepted'],
  );
  await transaction((unit) => current.publisher.publish(input, { transaction: unit }));
  assert.equal((await process()).claimed, 0, 'accepted intent replay must not be requeued');
  assert.equal(await count('outbox'), 1);
  console.log(
    'PASS: packed Core + Web Runtime / PostgreSQL: atomic rollback, publication dedupe, collision rejection, provider retry delay, persisted receipts, worker restart and abandoned-claim recovery.',
  );
} finally {
  await current.runtime.dispose();
  await pool.query(`DROP SCHEMA ${schema} CASCADE`);
  await pool.end();
}
