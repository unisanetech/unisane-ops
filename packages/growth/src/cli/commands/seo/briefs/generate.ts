import { log } from '../../../log.js';
import { generateContentBriefFile } from '@unisane/growth/seo';
import { printGenerateContentBriefFileResult } from '../format-output.js';
import type { SeoBriefGenerateCliOptions } from '../options.js';

export async function seoBriefsGenerate(options: SeoBriefGenerateCliOptions): Promise<number> {
  try {
    if (!options.opportunities) {
      throw new Error('Missing required --opportunities path.');
    }
    if (!options.outDir) {
      throw new Error('Missing required --out-dir path.');
    }

    const result = await generateContentBriefFile({
      cwd: options.cwd,
      opportunities: options.opportunities,
      outputDir: options.outDir,
      status: options.status ?? 'all',
      dryRun: options.dryRun,
    });
    printGenerateContentBriefFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO brief generation error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
