import { loadMarketingConfig, validateMarketingRegistries } from '@unisane/growth/marketing';
import type { MarketingCliOptions } from '../options.js';
import { printMarketingRegistryReport } from '../output/doctor.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function marketingValidate(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const registryReport = await validateMarketingRegistries(loaded.config, {
      cwd: options.cwd,
      missingStatus: 'error',
    });
    const result = {
      ok: registryReport.ok,
      configPath: loaded.path,
      appId: loaded.config.appId,
      platformId: loaded.config.platformId,
      environmentCount: Object.keys(loaded.config.environments).length,
      registry: registryReport,
    };
    if (options.json) printJson(result);
    else {
      console.log(`Marketing config is valid: ${loaded.path}`);
      console.log(`App: ${loaded.config.appId}`);
      console.log(`Platform: ${loaded.config.platformId}`);
      printMarketingRegistryReport(registryReport);
    }
    return registryReport.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing validate error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
