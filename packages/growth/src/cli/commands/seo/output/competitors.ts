import { log } from '../../../log.js';
import type {
  FetchCompetitorResearchFileResult,
  GenerateCompetitorResearchReportFileResult,
  ImportCompetitorResearchFileResult,
} from '@unisane/growth/seo';

export function printImportCompetitorResearchFileResult(
  result: ImportCompetitorResearchFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Competitor research import previewed (${result.pageCount} pages)`
      : `Competitor research imported (${result.pageCount} pages)`,
  );
  log.kv('Input', result.input);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Source', result.source);
  log.kv('Domains', String(result.domainCount));
  log.kv('Keywords', String(result.keywordCount));
}

export function printFetchCompetitorResearchFileResult(
  result: FetchCompetitorResearchFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Competitor URL fetch previewed (${result.pageCount} pages)`
      : `Competitor URL metadata fetched (${result.pageCount} pages)`,
  );
  log.kv('Input', result.input);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Requested', String(result.requestedCount));
  log.kv('Failed', String(result.failedCount));
  log.kv('Domains', String(result.domainCount));
  log.kv('Keywords', String(result.keywordCount));
}

export function printGenerateCompetitorResearchReportFileResult(
  result: GenerateCompetitorResearchReportFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Competitor research report previewed (${result.pageCount} pages)`
      : `Competitor research report written (${result.pageCount} pages)`,
  );
  log.kv('Competitors', result.competitors);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Domains', String(result.domainCount));
}
