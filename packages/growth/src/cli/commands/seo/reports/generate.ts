import { log } from '../../../log.js';
import { generateSeoReportFile } from '@unisane/growth/seo';
import { printGenerateSeoReportFileResult } from '../format-output.js';
import type { SeoReportGenerateCliOptions } from '../options.js';

export async function seoReportsGenerate(options: SeoReportGenerateCliOptions): Promise<number> {
  try {
    if (!options.opportunities) {
      throw new Error('Missing required --opportunities path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const result = await generateSeoReportFile({
      cwd: options.cwd,
      opportunities: options.opportunities,
      internalLinks: options.internalLinks,
      output: options.out,
      dryRun: options.dryRun,
    });
    printGenerateSeoReportFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO report generation error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
