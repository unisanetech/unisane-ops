import path from 'node:path';
import { readJson, writeJson } from '../../utils/fs.js';
import { adsPlanStatusFilterSchema, type AdsPlanStatusFilter } from '../schema/ads.js';
import { pageOpportunityFileSchema } from '../schema/opportunity.js';
import { planAdsFromOpportunities } from './plan-ads.js';

export type PlanAdsFileOptions = {
  cwd?: string;
  opportunities: string;
  output: string;
  status?: AdsPlanStatusFilter;
  maxKeywordsPerAdGroup?: number;
  dryRun?: boolean;
};

export type PlanAdsFileResult = {
  opportunities: string;
  output: string;
  platformId: string;
  statusFilter: AdsPlanStatusFilter;
  adGroupCount: number;
  keywordCount: number;
  sharedNegativeKeywordCount: number;
  dryRun: boolean;
};

export async function planAdsFile(options: PlanAdsFileOptions): Promise<PlanAdsFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const opportunityPath = resolvePath(cwd, options.opportunities);
  const outputPath = resolvePath(cwd, options.output);
  const opportunityFile = pageOpportunityFileSchema.parse(await readJson(opportunityPath));
  const statusFilter = adsPlanStatusFilterSchema.parse(options.status ?? 'approved-or-built');
  const adsPlan = planAdsFromOpportunities({
    opportunityFile,
    statusFilter,
    maxKeywordsPerAdGroup: options.maxKeywordsPerAdGroup,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, adsPlan);
  }

  return {
    opportunities: path.relative(cwd, opportunityPath),
    output: path.relative(cwd, outputPath),
    platformId: adsPlan.platformId,
    statusFilter,
    adGroupCount: adsPlan.adGroups.length,
    keywordCount: adsPlan.adGroups.reduce((total, adGroup) => total + adGroup.keywords.length, 0),
    sharedNegativeKeywordCount: adsPlan.sharedNegativeKeywords.length,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
