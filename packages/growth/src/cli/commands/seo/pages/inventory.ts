import { generateSeoPageEvidenceFile } from '@unisane/growth/seo';
import { log } from '../../../log.js';
import { printGenerateSeoPageEvidenceFileResult } from '../format-output.js';
import type { SeoPagesInventoryCliOptions } from '../options.js';

export async function seoPagesInventory(options: SeoPagesInventoryCliOptions): Promise<number> {
  try {
    const result = await generateSeoPageEvidenceFile({
      cwd: options.cwd,
      platformId: options.platform,
      crawl: options.crawl,
      render: options.render,
      searchConsole: options.searchConsole,
      ga4: options.ga4,
      output: options.out,
      dryRun: options.dryRun,
    });
    printGenerateSeoPageEvidenceFileResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown page evidence error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
