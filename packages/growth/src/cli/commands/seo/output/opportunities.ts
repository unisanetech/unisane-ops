import { log } from '../../../log.js';
import type {
  PlanPageOpportunityFileResult,
  UpdateOpportunityStatusFileResult,
} from '@unisane/growth/seo';

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
