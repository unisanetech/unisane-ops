import { z } from 'zod';
import type { OpsStoreDurability } from './ports.js';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const opsMutationRunSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('ops.mutation-run'),
    runId: stableIdSchema,
    revision: z.number().int().positive(),
    actionId: stableIdSchema,
    actionSchemaVersion: z.number().int().positive(),
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    targetId: stableIdSchema,
    phase: z.enum(['planned', 'approved', 'applied', 'verifying', 'verified', 'attention']),
    actionState: z.unknown(),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .strict();

type ParsedOpsMutationRun = z.infer<typeof opsMutationRunSchema>;
export type OpsMutationRun<TActionState = unknown> = Omit<ParsedOpsMutationRun, 'actionState'> & {
  actionState: TActionState;
};

export const opsMutationRunQuerySchema = z
  .object({
    actionId: stableIdSchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    limit: z.number().int().min(1).max(100).default(50),
  })
  .strict();
export type OpsMutationRunQuery = z.input<typeof opsMutationRunQuerySchema>;

export interface OpsMutationRunStore {
  readonly durability: OpsStoreDurability;
  readonly atomic: boolean;
  get<TActionState = unknown>(runId: string): Promise<OpsMutationRun<TActionState> | null>;
  list<TActionState = unknown>(
    query: OpsMutationRunQuery,
  ): Promise<Array<OpsMutationRun<TActionState>>>;
  compareAndSet<TActionState>(
    run: OpsMutationRun<TActionState>,
    expectedRevision: number | null,
  ): Promise<'stored' | 'conflict'>;
}

export function parseOpsMutationRun<TActionState>(input: unknown): OpsMutationRun<TActionState> {
  return opsMutationRunSchema.parse(input) as OpsMutationRun<TActionState>;
}

export function assertOpsMutationRunStore(input: {
  store: OpsMutationRunStore;
  actor: 'developer' | 'automation';
  production: boolean;
  multiProcess: boolean;
}): void {
  if (input.actor === 'developer' && !input.production && !input.multiProcess) return;
  if (input.store.durability !== 'durable' || !input.store.atomic) {
    throw new Error(
      '[OPS_RUN_STORE_DURABILITY_REQUIRED] Automation, production, and multi-process mutation runs require an atomic durable run store.',
    );
  }
}
