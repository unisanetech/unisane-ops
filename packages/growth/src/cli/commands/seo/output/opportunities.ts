import { log } from '../../../log.js';
import type {
  PlanPageOpportunityFileResult,
  UpdateOpportunityStatusFileResult,
} from '@unisane/growth/seo';
import type { PrepareSeoOpportunityArtifactsResult } from '../../../../workflows/seo-opportunity-preparation.js';
import type {
  RecordSeoPublicationArtifactsResult,
  VerifySeoPublicationArtifactsResult,
} from '../../../../workflows/seo-publication-verification.js';

export function printRecordSeoPublicationArtifactsResult(
  result: RecordSeoPublicationArtifactsResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  log.success(
    result.dryRun
      ? `Publication record previewed (${result.publication.opportunity.id})`
      : `Publication recorded (${result.publication.opportunity.id})`,
  );
  log.kv('Published URL', result.publication.publishedUrl);
  log.kv('Verification starts', result.publication.verification.notBeforeAt);
  log.kv('Verification expires', result.publication.verification.expiresAt);
  log.kv('Output', result.outputPath);
  log.info('This records an external publication; it does not publish or mutate a provider.');
}

export function printVerifySeoPublicationArtifactsResult(
  result: VerifySeoPublicationArtifactsResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  log.success(`Publication verification: ${result.verification.outcome}`);
  log.kv('Window', result.verification.windowState);
  log.kv('Summary', result.verification.summary);
  for (const metric of result.verification.metrics) {
    log.kv(metric.metric, `${metric.baseline} -> ${metric.current} (${metric.direction})`);
  }
  log.kv('Output', result.outputPath);
  log.info('Observed association is recorded; causation is not established.');
}

export function printPrepareSeoOpportunityArtifactsResult(
  result: PrepareSeoOpportunityArtifactsResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Implementation packet previewed (${result.packet.selection.opportunityId})`
      : `Implementation packet written (${result.packet.selection.opportunityId})`,
  );
  log.kv('JSON', result.jsonPath);
  log.kv('Markdown', result.markdownPath);
  log.kv('Audience', result.packet.delivery.audience);
  log.kv('Approval', result.packet.selection.implementationApproval);
  log.info('Preparation does not authorize repository edits, publication, or deployment.');
}

export function printUpdateOpportunityStatusFileResult(
  result: UpdateOpportunityStatusFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Opportunity status previewed (${result.updatedSlug} -> ${result.status})`
      : `Opportunity status written (${result.updatedSlug} -> ${result.status})`,
  );
  log.kv('Opportunities', result.opportunities);
  log.kv('Output', result.output);
  log.kv('Route', result.updatedRoutePath);
}

export function printPlanPageOpportunityFileResult(
  result: PlanPageOpportunityFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Page opportunities previewed (${result.opportunityCount} opportunities)`
      : `Page opportunities written (${result.opportunityCount} opportunities)`,
  );
  log.kv('Clusters', result.clusters);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Pattern pack', result.sourcePatternPack);
  log.kv('Base path', result.basePath);
}
