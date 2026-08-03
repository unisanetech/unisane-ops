import { z } from 'zod';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1);
const isoTimestampSchema = z.string().datetime({ offset: true });

export const opsPrincipalSchema = z
  .object({
    kind: z.enum(['user', 'service', 'agent']),
    id: stableIdSchema,
    displayName: nonEmptySchema.optional(),
  })
  .strict();
export type OpsPrincipal = z.infer<typeof opsPrincipalSchema>;

export const opsActionContextSchema = z
  .object({
    requestId: stableIdSchema,
    scopeId: stableIdSchema,
    projectId: stableIdSchema,
    environmentId: stableIdSchema,
    targetId: stableIdSchema.optional(),
    principal: opsPrincipalSchema,
    requestedAt: isoTimestampSchema,
  })
  .strict();
export type OpsActionContext = z.infer<typeof opsActionContextSchema>;

export const opsReadActionRequestSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: stableIdSchema,
    actionSchemaVersion: z.number().int().positive(),
    idempotencyKey: stableIdSchema,
    context: opsActionContextSchema,
    input: z.unknown(),
  })
  .strict();
export type OpsReadActionRequest = z.infer<typeof opsReadActionRequestSchema>;

export const opsReadActionResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    actionId: stableIdSchema,
    actionSchemaVersion: z.number().int().positive(),
    completedAt: isoTimestampSchema,
    output: z.unknown(),
  })
  .strict();
export type OpsReadActionResult = z.infer<typeof opsReadActionResultSchema>;

export class OpsActionExecutionError extends Error {
  constructor(
    readonly code: string,
    readonly safeMessage: string,
    readonly retryable = false,
  ) {
    stableIdSchema.parse(code);
    nonEmptySchema.parse(safeMessage);
    super(safeMessage);
    this.name = 'OpsActionExecutionError';
  }
}

export interface OpsReadActionDefinition<
  TInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  readonly id: string;
  readonly schemaVersion: number;
  readonly maximumEffect: 'offline' | 'read-network';
  readonly inputSchema: TInputSchema;
  readonly outputSchema: TOutputSchema;
  execute(
    input: z.output<TInputSchema>,
    context: OpsActionContext,
  ): Promise<z.input<TOutputSchema>>;
}

export interface OpsMutationActionDefinition<
  TPlanInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TPlanOutputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TApplyInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TApplyOutputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TVerifyInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TVerifyOutputSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  readonly id: string;
  readonly schemaVersion: number;
  readonly maximumEffect: 'write-network';
  readonly approvalMode: 'exact-plan';
  readonly receiptMode: 'immutable';
  readonly verificationMode: 'delayed-read';
  readonly planInputSchema: TPlanInputSchema;
  readonly planOutputSchema: TPlanOutputSchema;
  readonly applyInputSchema: TApplyInputSchema;
  readonly applyOutputSchema: TApplyOutputSchema;
  readonly verifyInputSchema: TVerifyInputSchema;
  readonly verifyOutputSchema: TVerifyOutputSchema;
  plan(
    input: z.output<TPlanInputSchema>,
    context: OpsActionContext,
  ): Promise<z.input<TPlanOutputSchema>> | z.input<TPlanOutputSchema>;
  apply(
    input: z.output<TApplyInputSchema>,
    context: OpsActionContext,
  ): Promise<z.input<TApplyOutputSchema>>;
  verify(
    input: z.output<TVerifyInputSchema>,
    context: OpsActionContext,
  ): Promise<z.input<TVerifyOutputSchema>>;
}

export function defineOpsReadAction<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
>(
  definition: OpsReadActionDefinition<TInputSchema, TOutputSchema>,
): OpsReadActionDefinition<TInputSchema, TOutputSchema> {
  stableIdSchema.parse(definition.id);
  z.number().int().positive().parse(definition.schemaVersion);
  return Object.freeze(definition);
}

export function defineOpsMutationAction<
  TPlanInputSchema extends z.ZodTypeAny,
  TPlanOutputSchema extends z.ZodTypeAny,
  TApplyInputSchema extends z.ZodTypeAny,
  TApplyOutputSchema extends z.ZodTypeAny,
  TVerifyInputSchema extends z.ZodTypeAny,
  TVerifyOutputSchema extends z.ZodTypeAny,
>(
  definition: OpsMutationActionDefinition<
    TPlanInputSchema,
    TPlanOutputSchema,
    TApplyInputSchema,
    TApplyOutputSchema,
    TVerifyInputSchema,
    TVerifyOutputSchema
  >,
): OpsMutationActionDefinition<
  TPlanInputSchema,
  TPlanOutputSchema,
  TApplyInputSchema,
  TApplyOutputSchema,
  TVerifyInputSchema,
  TVerifyOutputSchema
> {
  stableIdSchema.parse(definition.id);
  z.number().int().positive().parse(definition.schemaVersion);
  return Object.freeze(definition);
}

export function createOpsReadActionRequest(input: OpsReadActionRequest): OpsReadActionRequest {
  return opsReadActionRequestSchema.parse(input);
}
