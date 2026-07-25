import { log } from '../../../log.js';
import type { GenerateContentBriefFileResult } from '@unisane/growth/seo';

export function printGenerateContentBriefFileResult(
  result: GenerateContentBriefFileResult,
  options: { json?: boolean },
): void {
  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  log.success(
    result.dryRun
      ? `Content briefs previewed (${result.briefCount} briefs)`
      : `Content briefs written (${result.briefCount} briefs)`,
  );
  log.kv('Opportunities', result.opportunities);
  log.kv('Output directory', result.outputDir);
  log.kv('Index', result.indexPath);
  log.kv('Platform', result.platformId);
  log.kv('Pattern pack', result.sourcePatternPack);
}
