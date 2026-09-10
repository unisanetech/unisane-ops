import { randomUUID } from 'node:crypto';
import type { LockStore } from '../ports.js';
import { opsLockLeaseSchema, type OpsLockLease } from '../safety.js';
import { encode, transaction, type SqliteExecutionDatabase } from './database.js';
export function createSqliteLockStore(db: SqliteExecutionDatabase): LockStore {
  function get(id: string) {
    return db.prepare('SELECT fence,payload FROM ops_leases WHERE id = ?').get(id) as
      | { fence: number; payload: string | null }
      | undefined;
  }
  function matches(input: OpsLockLease, now?: string) {
    const lease = opsLockLeaseSchema.parse(input);
    const row = get(lease.lockId);
    const current = row?.payload ? opsLockLeaseSchema.parse(JSON.parse(row.payload)) : null;
    if (
      !current ||
      current.leaseToken !== lease.leaseToken ||
      current.owner !== lease.owner ||
      current.fencingValue !== lease.fencingValue
    )
      throw new Error('[OPS_LOCK_OWNER_MISMATCH] Lock ownership changed.');
    if (
      now &&
      (!Number.isFinite(Date.parse(now)) ||
        Date.parse(current.expiresAt) <= Date.parse(now) ||
        Date.parse(lease.expiresAt) <= Date.parse(now))
    )
      throw new Error('[OPS_LOCK_EXPIRED] Lock lease expired.');
    return current;
  }
  function expires(now: string, ttlMs: number) {
    if (
      !Number.isFinite(Date.parse(now)) ||
      !Number.isSafeInteger(ttlMs) ||
      ttlMs <= 0 ||
      ttlMs > 3600000
    )
      throw new Error('[OPS_LOCK_REQUEST_INVALID] Invalid lease duration.');
    return new Date(Date.parse(now) + ttlMs).toISOString();
  }
  return {
    durability: 'durable',
    atomic: true,
    async acquire(request) {
      return transaction(db, () => {
        const expiresAt = expires(request.now, request.ttlMs);
        const row = get(request.lockId);
        if (
          row?.payload &&
          Date.parse(opsLockLeaseSchema.parse(JSON.parse(row.payload)).expiresAt) >
            Date.parse(request.now)
        )
          return null;
        const lease = opsLockLeaseSchema.parse({
          schemaVersion: 1,
          kind: 'ops.lock-lease',
          lockId: request.lockId,
          owner: request.owner,
          leaseToken: randomUUID(),
          fencingValue: (row?.fence ?? 0) + 1,
          acquiredAt: request.now,
          expiresAt,
        });
        db.prepare(
          'INSERT INTO ops_leases VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET fence=excluded.fence,payload=excluded.payload',
        ).run(lease.lockId, lease.fencingValue, encode(lease));
        return lease;
      });
    },
    async renew(lease, ttlMs, now) {
      return transaction(db, () => {
        const current = matches(lease, now);
        const renewed = { ...current, expiresAt: expires(now, ttlMs) };
        db.prepare('UPDATE ops_leases SET payload=? WHERE id=?').run(encode(renewed), lease.lockId);
        return renewed;
      });
    },
    async release(lease) {
      transaction(db, () => {
        matches(lease);
        db.prepare('UPDATE ops_leases SET payload=NULL WHERE id=?').run(lease.lockId);
      });
    },
    async assertCurrent(lease, now) {
      matches(lease, now);
    },
  };
}
