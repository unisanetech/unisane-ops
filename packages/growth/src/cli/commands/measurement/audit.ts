import {
  executeGrowthMeasurementAudit,
  formatGrowthMeasurementAudit,
} from '../../../workflows/measurement-audit-execution.js';
import { loadMarketingExecutionContext } from '../../project-context.js';

export type MeasurementAuditCliOptions = {
  cwd?: string;
  startDate?: string;
  endDate?: string;
  maxAgeDays?: string;
  comparisonLimit?: string;
  json?: boolean;
};

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`[GROWTH_MEASUREMENT_OPTION_INVALID] ${name} must be a positive integer.`);
  }
  return parsed;
}

export async function measurementAudit(options: MeasurementAuditCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingExecutionContext();
    const output = await executeGrowthMeasurementAudit({
      cwd: options.cwd ?? process.cwd(),
      config: loaded.config,
      principal: { kind: 'user', id: 'user.local-cli', displayName: 'Local CLI user' },
      ...(options.startDate ? { startDate: options.startDate } : {}),
      ...(options.endDate ? { endDate: options.endDate } : {}),
      maxAgeDays: positiveInteger(options.maxAgeDays, 3, '--max-age-days'),
      comparisonLimit: positiveInteger(options.comparisonLimit, 20, '--comparison-limit'),
    });
    if (options.json) console.log(JSON.stringify(output, null, 2));
    else console.log(formatGrowthMeasurementAudit(output));
    return output.status === 'blocked' ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown measurement audit error';
    if (options.json) console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    else console.error(message);
    return 1;
  }
}
