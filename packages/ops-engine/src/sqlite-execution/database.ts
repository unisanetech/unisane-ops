export interface SqliteExecutionDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...parameters: unknown[]): { changes: number | bigint };
    get(...parameters: unknown[]): unknown;
  };
}
export function transaction<T>(db: SqliteExecutionDatabase, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
export function rowJson(row: unknown): unknown | null {
  if (row === undefined || row === null) return null;
  if (typeof row !== 'object' || !('payload' in row) || typeof row.payload !== 'string')
    throw new Error('[OPS_SQLITE_STATE_INVALID] Invalid stored record.');
  return JSON.parse(row.payload);
}
export function encode(value: unknown) {
  const json = JSON.stringify(value);
  if (!json || Buffer.byteLength(json) > 10 * 1024 * 1024)
    throw new Error('[OPS_STATE_TOO_LARGE] State record exceeds its size limit.');
  return json;
}
export function initialize(db: SqliteExecutionDatabase) {
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
  const main = db.prepare('PRAGMA database_list').get() as { file?: string };
  const journal = db.prepare('PRAGMA journal_mode').get() as { journal_mode?: string };
  const sync = db.prepare('PRAGMA synchronous').get() as { synchronous?: number };
  if (!main?.file || journal?.journal_mode !== 'wal' || sync?.synchronous !== 2)
    throw new Error(
      '[OPS_SQLITE_DURABILITY_REQUIRED] A file-backed database with WAL and full synchronization is required.',
    );
  db.exec(`CREATE TABLE IF NOT EXISTS ops_execution_meta (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
 INSERT OR IGNORE INTO ops_execution_meta VALUES ('schema',1);
 CREATE TABLE IF NOT EXISTS ops_artifacts (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ops_approvals (id TEXT PRIMARY KEY, payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ops_receipts (plan_hash TEXT PRIMARY KEY, payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS ops_leases (id TEXT PRIMARY KEY, fence INTEGER NOT NULL, payload TEXT);
 CREATE TABLE IF NOT EXISTS ops_mutation_runs (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, action_id TEXT NOT NULL, project_id TEXT NOT NULL, environment_id TEXT NOT NULL, payload TEXT NOT NULL);`);
  const schema = db.prepare("SELECT value FROM ops_execution_meta WHERE key = 'schema'").get() as {
    value?: number;
  };
  if (schema?.value !== 1)
    throw new Error('[OPS_STATE_SCHEMA_UNSUPPORTED] Execution database schema is not supported.');
}
