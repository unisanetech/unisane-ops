import type { OpsExecutionState } from '../ports.js';
import type { OpsMutationRunStore } from '../runs.js';
import { initialize, type SqliteExecutionDatabase } from './database.js';
import { createSqliteRecordStores } from './records.js';
import { createSqliteLockStore } from './leases.js';
import { createSqliteRunStore } from './runs.js';
export type { SqliteExecutionDatabase } from './database.js';
/** Persistent single-host SQLite; the host owns opening, securing, backing up and closing the database. */
export function createSqliteOpsExecutionState(database: SqliteExecutionDatabase): {
  state: OpsExecutionState;
  runStore: OpsMutationRunStore;
} {
  initialize(database);
  return {
    state: { ...createSqliteRecordStores(database), locks: createSqliteLockStore(database) },
    runStore: createSqliteRunStore(database),
  };
}
