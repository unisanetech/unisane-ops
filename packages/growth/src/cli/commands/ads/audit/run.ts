import { log } from '../../../log.js';
import { writeMarketingAdsAuditReport } from '@unisane/growth/marketing';
import { loadMarketingExecutionContext } from '../../../project-context.js';
import type { AdsCliOptions } from '../options.js';
import { printAdsAuditResult } from '../output/audit.js';

function parseMaxAgeDays(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('[ADS_AUDIT_MAX_AGE_INVALID] --max-age-days must be a non-negative integer.');
  }
  return parsed;
}

export async function adsAudit(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingExecutionContext();
    const result = await writeMarketingAdsAuditReport(loaded.config, {
      cwd: options.cwd,
      configPath: loaded.path,
      maxAgeDays: parseMaxAgeDays(options.maxAgeDays),
      planPath: options.plan,
      sourceRoot: options.sourceRoot,
      out: options.out,
      dryRun: options.dryRun,
    });
    printAdsAuditResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ads audit error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
