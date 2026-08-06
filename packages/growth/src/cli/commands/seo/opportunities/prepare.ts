import { executeGrowthSeoOpportunityResearch } from '../../../../workflows/seo-opportunity-execution.js';
import { prepareSeoOpportunityArtifacts } from '../../../../workflows/seo-opportunity-preparation.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../../project-context.js';
import { printPrepareSeoOpportunityArtifactsResult } from '../format-output.js';
import type { SeoOpportunityPrepareCliOptions } from '../options.js';

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`[GROWTH_SEO_OPTION_REQUIRED] ${name} is required.`);
  return value;
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`[GROWTH_SEO_OPTION_INVALID] ${name} must be a positive integer.`);
  }
  return parsed;
}

export async function seoOpportunitiesPrepare(
  options: SeoOpportunityPrepareCliOptions,
): Promise<number> {
  try {
    const context = await loadGrowthProjectContext();
    const cwd = options.cwd ?? context.projectRoot;
    const environmentId = selectGrowthEnvironment(context, options.environment);
    const review = await executeGrowthSeoOpportunityResearch({
      cwd,
      researchRoot: context.growth.manifests.research,
      projectId: context.projectId,
      environmentId,
      principal: { kind: 'user', id: 'user.local-cli', displayName: 'Local CLI user' },
      ...(options.market ? { market: options.market } : {}),
      opportunityId: required(options.id, '--id'),
      opportunityLimit: 10,
      maxAgeDays: positiveInteger(options.maxAgeDays, 30, '--max-age-days'),
    });
    const result = await prepareSeoOpportunityArtifacts({
      cwd,
      opportunitySource: required(options.opportunities, '--opportunities'),
      outputDir: required(options.outDir, '--out-dir'),
      opportunityId: required(options.id, '--id'),
      review,
      audience: options.audience ?? 'coding-agent',
      notBeforeDaysAfterPublication: positiveInteger(
        options.notBeforeDays,
        14,
        '--not-before-days',
      ),
      expiresDaysAfterPublication: positiveInteger(options.expiresDays, 28, '--expires-days'),
      dryRun: options.dryRun,
    });
    printPrepareSeoOpportunityArtifactsResult(result, options);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown preparation error';
    if (options.json)
      process.stdout.write(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
    else console.error(message);
    return 1;
  }
}
