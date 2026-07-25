import { log } from '../../../log.js';
import { generateCompetitorResearchReportFile } from '@unisane/growth/seo';
import { printGenerateCompetitorResearchReportFileResult } from '../format-output.js';
import type { SeoCompetitorReportCliOptions } from '../options.js';

export async function seoCompetitorsReport(
  options: SeoCompetitorReportCliOptions,
): Promise<number> {
  try {
    if (!options.competitors) {
      throw new Error('Missing required --competitors path.');
    }
    if (!options.out) {
      throw new Error('Missing required --out path.');
    }

    const result = await generateCompetitorResearchReportFile({
      cwd: options.cwd,
      competitors: options.competitors,
      output: options.out,
      dryRun: options.dryRun,
    });
    printGenerateCompetitorResearchReportFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown competitor research report error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
