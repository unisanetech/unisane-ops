import { log } from '../../../log.js';
import type {
  ClusterKeywordFileResult,
  ExpandKeywordSeedFileResult,
  ImportCsvKeywordMetricsResult,
  InitSeoResearchWorkspaceResult,
} from '@unisane/growth/seo';
import type { FetchGoogleAdsKeywordMetricsFileResult } from '../../../provider-adapters.js';

export function printInitSeoResearchWorkspaceResult(
  result: InitSeoResearchWorkspaceResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `SEO research workspace previewed for ${result.platformId}`
      : `SEO research workspace ready for ${result.platformId}`,
  );
  log.kv('Root', result.root);

  if (result.created.length > 0) {
    log.newline();
    log.section(result.dryRun ? 'Would create' : 'Created');
    for (const item of result.created) {
      log.info(item);
    }
  }

  if (result.skipped.length > 0) {
    log.newline();
    log.section('Skipped');
    for (const item of result.skipped) {
      log.info(item);
    }
  }
}

export function printExpandKeywordSeedFileResult(
  result: ExpandKeywordSeedFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Keyword expansion previewed (${result.candidateCount} candidates)`
      : `Keyword expansion written (${result.candidateCount} candidates)`,
  );
  log.kv('Input', result.input);
  log.kv('Output', result.output);
  log.kv('Pattern pack', result.patternPack);
}

export function printImportCsvKeywordMetricsResult(
  result: ImportCsvKeywordMetricsResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Keyword metrics import previewed (${result.metricCount} metrics)`
      : `Keyword metrics imported (${result.metricCount} metrics)`,
  );
  log.kv('Input', result.input);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Country', result.country);
  log.kv('Language', result.language);
  log.kv('Provider', result.provider);
}

export function printFetchGoogleAdsKeywordMetricsFileResult(
  result: FetchGoogleAdsKeywordMetricsFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Google Ads keyword metrics previewed (${result.metricCount} metrics)`
      : `Google Ads keyword metrics written (${result.metricCount} metrics)`,
  );
  if (result.candidates) {
    log.kv('Candidates', result.candidates);
  }
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Country', result.country);
  log.kv('Language', result.language);
  log.kv('Location ids', result.locationIds.join(','));
  log.kv('Language id', result.languageId);
  if (result.requireTermGroups.length > 0 || result.excludeTerms.length > 0) {
    if (result.requireTermGroups.length > 0) {
      log.kv(
        'Require term groups',
        result.requireTermGroups.map((group) => group.join('|')).join(';'),
      );
    }
    if (result.excludeTerms.length > 0) {
      log.kv('Exclude terms', result.excludeTerms.join(','));
    }
    log.kv('Dropped by keyword filter', String(result.droppedMetricCount));
  }
  if (result.currencyCode) {
    log.kv('Currency', result.currencyCode);
  }
  if (result.runId) {
    log.kv('Run id', result.runId);
  }
}

export function printClusterKeywordFileResult(
  result: ClusterKeywordFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Keyword clustering previewed (${result.clusterCount} clusters)`
      : `Keyword clusters written (${result.clusterCount} clusters)`,
  );
  log.kv('Candidates', result.candidates);
  if (result.metrics) {
    log.kv('Metrics', result.metrics);
  }
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Pattern pack', result.sourcePatternPack);
}
