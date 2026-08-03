import {
  executeGrowthHealthReview,
  formatGrowthHealthReview,
} from '../../../workflows/health-review-execution.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../project-context.js';

export type HealthReviewCliOptions = {
  cwd?: string;
  environment?: string;
  maxAgeDays?: string;
  findingLimit?: string;
  json?: boolean;
};

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`[GROWTH_HEALTH_OPTION_INVALID] ${name} must be a positive integer.`);
  }
  return parsed;
}

export async function healthReview(options: HealthReviewCliOptions): Promise<number> {
  try {
    const context = await loadGrowthProjectContext();
    const environmentId = selectGrowthEnvironment(context, options.environment);
    const output = await executeGrowthHealthReview({
      cwd: options.cwd ?? context.projectRoot,
      config: context.growth,
      projectId: context.projectId,
      environmentId,
      principal: { kind: 'user', id: 'user.local-cli', displayName: 'Local CLI user' },
      maxAgeDays: positiveInteger(options.maxAgeDays, 3, '--max-age-days'),
      findingLimit: positiveInteger(options.findingLimit, 50, '--finding-limit'),
    });
    if (options.json) console.log(JSON.stringify(output, null, 2));
    else console.log(formatGrowthHealthReview(output));
    return output.status === 'blocked' ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Growth health review error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
