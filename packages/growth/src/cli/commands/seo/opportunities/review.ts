import {
  executeGrowthSeoOpportunityResearch,
  formatGrowthSeoOpportunityResearch,
} from '../../../../workflows/seo-opportunity-execution.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../../project-context.js';

export type SeoOpportunityReviewCliOptions = {
  cwd?: string;
  environment?: string;
  market?: string;
  limit?: string;
  maxAgeDays?: string;
  json?: boolean;
};

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`[GROWTH_SEO_OPTION_INVALID] ${name} must be a positive integer.`);
  }
  return parsed;
}

export async function seoOpportunitiesReview(
  options: SeoOpportunityReviewCliOptions,
): Promise<number> {
  try {
    const context = await loadGrowthProjectContext();
    const environmentId = selectGrowthEnvironment(context, options.environment);
    const output = await executeGrowthSeoOpportunityResearch({
      cwd: options.cwd ?? context.projectRoot,
      researchRoot: context.growth.manifests.research,
      projectId: context.projectId,
      environmentId,
      principal: { kind: 'user', id: 'user.local-cli', displayName: 'Local CLI user' },
      ...(options.market ? { market: options.market } : {}),
      opportunityLimit: positiveInteger(options.limit, 10, '--limit'),
      maxAgeDays: positiveInteger(options.maxAgeDays, 30, '--max-age-days'),
    });
    if (options.json) console.log(JSON.stringify(output, null, 2));
    else console.log(formatGrowthSeoOpportunityResearch(output));
    return output.status === 'blocked' ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SEO opportunity review error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
