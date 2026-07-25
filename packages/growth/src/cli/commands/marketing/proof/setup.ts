import { loadMarketingConfig, writeMarketingProofSetup } from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingProofSetup } from '../output/proof-setup.js';

export async function marketingProofSetup(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const result = writeMarketingProofSetup(loaded.config, {
      cwd: options.cwd,
      out: options.out,
      force: options.force,
    });
    printMarketingProofSetup(result, { json: options.json });
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing proof setup error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
