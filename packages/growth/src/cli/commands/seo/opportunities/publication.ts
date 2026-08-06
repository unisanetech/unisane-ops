import {
  loadSeoPublicationRecord,
  recordSeoPublicationArtifacts,
  verifySeoPublicationArtifacts,
} from '../../../../workflows/seo-publication-verification.js';
import { executeGrowthSeoOpportunityResearch } from '../../../../workflows/seo-opportunity-execution.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../../project-context.js';
import {
  printRecordSeoPublicationArtifactsResult,
  printVerifySeoPublicationArtifactsResult,
} from '../format-output.js';
import type { SeoPublicationRecordCliOptions, SeoPublicationVerifyCliOptions } from '../options.js';

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

function reportError(error: unknown, json?: boolean): number {
  const message = error instanceof Error ? error.message : 'Unknown publication workflow error';
  if (json) process.stdout.write(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
  else console.error(message);
  return 1;
}

export async function seoOpportunityRecordPublication(
  options: SeoPublicationRecordCliOptions,
): Promise<number> {
  try {
    const context = await loadGrowthProjectContext();
    const environmentId = selectGrowthEnvironment(context, options.environment);
    const result = await recordSeoPublicationArtifacts({
      cwd: options.cwd ?? context.projectRoot,
      packetPath: required(options.packet, '--packet'),
      outputPath: required(options.out, '--out'),
      publishedUrl: required(options.publishedUrl, '--published-url'),
      publishedAt: required(options.publishedAt, '--published-at'),
      recordedBy: required(options.recordedBy, '--recorded-by'),
      confirmedReviewed: options.confirmReviewed === true,
      expectedProjectId: context.projectId,
      expectedEnvironmentId: environmentId,
      dryRun: options.dryRun,
    });
    printRecordSeoPublicationArtifactsResult(result, options);
    return 0;
  } catch (error) {
    return reportError(error, options.json);
  }
}

export async function seoOpportunityVerifyPublication(
  options: SeoPublicationVerifyCliOptions,
): Promise<number> {
  try {
    const context = await loadGrowthProjectContext();
    const cwd = options.cwd ?? context.projectRoot;
    const environmentId = selectGrowthEnvironment(context, options.environment);
    const publicationPath = required(options.publication, '--publication');
    const publication = await loadSeoPublicationRecord(cwd, publicationPath);
    if (
      publication.projectId !== context.projectId ||
      publication.environmentId !== environmentId
    ) {
      throw new Error(
        'The publication record does not match the selected project and environment.',
      );
    }
    const review = await executeGrowthSeoOpportunityResearch({
      cwd,
      researchRoot: context.growth.manifests.research,
      projectId: context.projectId,
      environmentId,
      principal: { kind: 'user', id: 'user.local-cli', displayName: 'Local CLI user' },
      opportunityId: publication.opportunity.id,
      ...(publication.opportunity.market ? { market: publication.opportunity.market } : {}),
      opportunityLimit: 1,
      maxAgeDays: positiveInteger(options.maxAgeDays, 30, '--max-age-days'),
    });
    const result = await verifySeoPublicationArtifacts({
      cwd,
      publicationPath,
      publication,
      outputPath: required(options.out, '--out'),
      review,
      dryRun: options.dryRun,
    });
    printVerifySeoPublicationArtifactsResult(result, options);
    return result.verification.outcome === 'not-measurable' ? 1 : 0;
  } catch (error) {
    return reportError(error, options.json);
  }
}
