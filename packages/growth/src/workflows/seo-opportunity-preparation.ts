import path from 'node:path';
import { readJson, writeJson, writeText } from '../utils/fs.js';
import {
  growthSeoOpportunityResearchOutputSchema,
  type GrowthSeoOpportunityResearchOutput,
} from '../actions/seo-opportunity-research.js';
import {
  prepareSeoImplementationPacket,
  renderSeoImplementationPacket,
  type SeoImplementationPacket,
} from '../playbooks/seo-opportunity-preparation.js';
import { pageOpportunityFileSchema, type PageOpportunityFile } from '../seo/schema/opportunity.js';
import { seoOpportunityIdsMatch } from '../seo/identifiers.js';

export type PrepareSeoOpportunityArtifactsOptions = {
  cwd: string;
  opportunitySource: string;
  outputDir: string;
  opportunityId: string;
  review: GrowthSeoOpportunityResearchOutput;
  opportunityFile?: PageOpportunityFile;
  audience?: 'content-team' | 'coding-agent';
  notBeforeDaysAfterPublication?: number;
  expiresDaysAfterPublication?: number;
  preparedAt?: Date;
  dryRun?: boolean;
};

export type PrepareSeoOpportunityArtifactsResult = {
  packet: SeoImplementationPacket;
  jsonPath: string;
  markdownPath: string;
  dryRun: boolean;
};

function resolvePath(cwd: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(cwd, value);
}

function positiveWindow(start: number, end: number) {
  if (!Number.isInteger(start) || start < 1 || !Number.isInteger(end) || end <= start) {
    throw new Error('The verification window must use positive days and end after it begins.');
  }
}

export async function prepareSeoOpportunityArtifacts(
  options: PrepareSeoOpportunityArtifactsOptions,
): Promise<PrepareSeoOpportunityArtifactsResult> {
  const cwd = path.resolve(options.cwd);
  const review = growthSeoOpportunityResearchOutputSchema.parse(options.review);
  const opportunityPath = resolvePath(cwd, options.opportunitySource);
  const opportunityFile = pageOpportunityFileSchema.parse(
    options.opportunityFile ?? (await readJson(opportunityPath)),
  );
  const opportunity = review.opportunities.find((item) =>
    seoOpportunityIdsMatch(item.id, options.opportunityId),
  );
  if (!opportunity) {
    throw new Error(`Ranked opportunity ${options.opportunityId} was not returned by the review.`);
  }
  const matchingPageOpportunities = opportunityFile.opportunities.filter((item) =>
    seoOpportunityIdsMatch(item.id, opportunity.id),
  );
  if (matchingPageOpportunities.length > 1) {
    throw new Error(`Multiple source opportunities matched ${options.opportunityId}.`);
  }
  const pageOpportunity = matchingPageOpportunities[0];
  if (!pageOpportunity) {
    throw new Error(
      `Approved opportunity ${options.opportunityId} was not found in the source file.`,
    );
  }
  const notBeforeDays = options.notBeforeDaysAfterPublication ?? 14;
  const expiresDays = options.expiresDaysAfterPublication ?? 28;
  positiveWindow(notBeforeDays, expiresDays);
  const packet = prepareSeoImplementationPacket({
    projectId: review.projectId,
    environmentId: review.environmentId,
    preparedAt: (options.preparedAt ?? new Date()).toISOString(),
    opportunityReviewObservedAt: review.observedAt,
    opportunitySource: path.relative(cwd, opportunityPath),
    opportunity,
    pageOpportunity,
    evidence: review.evidence,
    researchPlan: review.researchPlan,
    ...(options.audience ? { audience: options.audience } : {}),
    notBeforeDaysAfterPublication: notBeforeDays,
    expiresDaysAfterPublication: expiresDays,
  });
  const outputDir = resolvePath(cwd, options.outputDir);
  const slug = pageOpportunity.slug;
  const jsonPath = path.join(outputDir, `${slug}.implementation.json`);
  const markdownPath = path.join(outputDir, `${slug}.implementation.md`);
  if (!options.dryRun) {
    await writeJson(jsonPath, packet);
    await writeText(markdownPath, renderSeoImplementationPacket(packet));
  }
  return {
    packet,
    jsonPath: path.relative(cwd, jsonPath),
    markdownPath: path.relative(cwd, markdownPath),
    dryRun: options.dryRun === true,
  };
}
