import { log } from '../../../log.js';
import type { ImportTrendSignalFileResult } from '@unisane/growth/seo';

export function printImportTrendSignalFileResult(
  result: ImportTrendSignalFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Trend signal import previewed (${result.signalCount} signals)`
      : `Trend signals imported (${result.signalCount} signals)`,
  );
  log.kv('Input', result.input);
  log.kv('Output', result.output);
  log.kv('Platform', result.platformId);
  log.kv('Provider', result.provider);
  log.kv('Terms', String(result.termCount));
  log.kv('Related queries', String(result.relatedQueryCount));
}
