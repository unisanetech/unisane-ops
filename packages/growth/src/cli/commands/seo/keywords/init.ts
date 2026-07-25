import { log } from '../../../log.js';
import { initSeoResearchWorkspace } from '@unisane/growth/seo';
import { printInitSeoResearchWorkspaceResult } from '../format-output.js';
import type { SeoCliOptions } from '../options.js';

export async function seoKeywordsInit(options: SeoCliOptions): Promise<number> {
  try {
    const result = await initSeoResearchWorkspace({
      cwd: options.cwd,
      platformId: options.platform,
      force: options.force,
      dryRun: options.dryRun,
    });
    printInitSeoResearchWorkspaceResult(result, { json: options.json });
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown SEO research init error';
    if (options.json) {
      process.stdout.write(`${JSON.stringify({ ok: false, error: { message } }, null, 2)}\n`);
    } else {
      log.error(message);
    }
    return 1;
  }
}
