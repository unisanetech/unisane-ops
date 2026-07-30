import { z } from 'zod';

export const opsLifecycleContributionResultSchema = z
  .object({
    schemaVersion: z.literal(1),
    status: z.enum(['ok', 'failed', 'invalid', 'attention', 'blocked', 'approval-required']),
    actualEffect: z.enum(['offline', 'read-network', 'write', 'spend-impact']),
    writeTargets: z.array(z.enum(['project', 'secret-store', 'remote'])),
    result: z.unknown(),
    diagnostics: z.array(z.string()),
    artifacts: z.array(z.string()),
    nextActions: z.array(z.string()),
  })
  .strict();
export type OpsLifecycleContributionResult = z.infer<typeof opsLifecycleContributionResultSchema>;

export interface OpsLifecycleContributionContext {
  cwd: string;
  argv: readonly string[];
  json: boolean;
}

export function defineOpsLifecycleContributionResult(
  input: OpsLifecycleContributionResult,
): OpsLifecycleContributionResult {
  return opsLifecycleContributionResultSchema.parse(input);
}
