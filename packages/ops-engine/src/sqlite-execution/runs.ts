import { hashOpsValue } from '../safety.js';
import {
  parseOpsMutationRun,
  opsMutationRunQuerySchema,
  type OpsMutationRunStore,
  type OpsMutationRun,
} from '../runs.js';
import { encode, rowJson, transaction, type SqliteExecutionDatabase } from './database.js';
function identity(run: OpsMutationRun) {
  return {
    runId: run.runId,
    actionId: run.actionId,
    actionSchemaVersion: run.actionSchemaVersion,
    projectId: run.projectId,
    environmentId: run.environmentId,
    targetId: run.targetId,
    createdAt: run.createdAt,
  };
}
export function createSqliteRunStore(db: SqliteExecutionDatabase): OpsMutationRunStore {
  return {
    durability: 'durable',
    atomic: true,
    async get<T>(id: string) {
      const value = rowJson(db.prepare('SELECT payload FROM ops_mutation_runs WHERE id=?').get(id));
      return value === null ? null : parseOpsMutationRun<T>(value);
    },
    async list<T>(raw: import('../runs.js').OpsMutationRunQuery) {
      const q = opsMutationRunQuerySchema.parse(raw);
      const row = db
        .prepare(
          'SELECT json_group_array(json(payload)) AS payload FROM (SELECT payload FROM ops_mutation_runs WHERE action_id=? AND project_id=? AND environment_id=? ORDER BY id LIMIT ?)',
        )
        .get(q.actionId, q.projectId, q.environmentId, q.limit);
      const values = rowJson(row);
      if (!Array.isArray(values)) throw new Error('[OPS_STATE_INVALID] Invalid run query result.');
      return values.map((value) => parseOpsMutationRun<T>(value));
    },
    async compareAndSet<T>(input: OpsMutationRun<T>, expectedRevision: number | null) {
      const run = parseOpsMutationRun<T>(input);
      return transaction(db, () => {
        const value = rowJson(
          db.prepare('SELECT payload FROM ops_mutation_runs WHERE id=?').get(run.runId),
        );
        const previous = value === null ? null : parseOpsMutationRun(value);
        if (
          run.revision !== (expectedRevision ?? 0) + 1 ||
          (previous?.revision ?? null) !== expectedRevision
        )
          return 'conflict';
        if (previous && hashOpsValue(identity(previous)) !== hashOpsValue(identity(run)))
          throw new Error('[OPS_RUN_IDENTITY_CHANGED] Run identity is immutable.');
        db.prepare(
          'INSERT INTO ops_mutation_runs VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload',
        ).run(run.runId, run.revision, run.actionId, run.projectId, run.environmentId, encode(run));
        return 'stored';
      });
    },
  };
}
