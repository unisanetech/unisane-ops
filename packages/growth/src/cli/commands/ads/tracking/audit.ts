import { auditMarketingTrackingSource } from '@unisane/growth/marketing';
import { loadMarketingExecutionContext } from '../../../project-context.js';
import type { AdsCliOptions } from '../options.js';
import { printMarketingTrackingAuditReport } from '../../marketing/output/doctor.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function adsTrackingAudit(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingExecutionContext();
    const report = await auditMarketingTrackingSource(loaded.config, {
      cwd: options.cwd,
      sourceRoots: options.sourceRoot,
    });
    if (options.json) printJson(report);
    else printMarketingTrackingAuditReport(report);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads tracking audit error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
