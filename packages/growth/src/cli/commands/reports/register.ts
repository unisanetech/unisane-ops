import {
  growthReportEvidenceSchema,
  growthReportHistoryInputSchema,
  growthReportHistoryResultSchema,
} from '../../../reports/history.js';
import type { Command } from 'commander';
import {
  growthReportReadInputSchema,
  growthReportReadOutputSchema,
} from '../../../reports/contracts.js';
import { executeGrowthProviderCommand } from '../../provider-runtime.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../project-context.js';
export function registerReportCommands(parent: Command) {
  const reports = parent
    .command('reports')
    .description('Read and save bounded provider report evidence');
  for (const mode of ['read', 'collect'] as const)
    reports
      .command(mode)
      .requiredOption('--start-date <date>')
      .requiredOption('--end-date <date>')
      .option('--report-type <type>', 'account, campaign, adSet or ad')
      .option('--environment <id>')
      .option('--time-zone <zone>')
      .option('--max-pages <count>', 'Maximum pages', Number)
      .option('--page-size <count>', 'Rows per page', Number)
      .option('--row-limit <count>', 'Returned rows', Number)
      .option('--json')
      .action(
        async (options: {
          startDate: string;
          endDate: string;
          reportType?: string;
          environment?: string;
          timeZone?: string;
          maxPages?: number;
          pageSize?: number;
          rowLimit?: number;
          json?: boolean;
        }) => {
          const context = await loadGrowthProjectContext();
          const environmentId = selectGrowthEnvironment(context, options.environment);
          const { environment: _, json: asJson, ...reportOptions } = options;
          void _;
          const report = growthReportReadInputSchema.parse(reportOptions);
          const raw = await executeGrowthProviderCommand(
            mode === 'read' ? 'growth.reports.read' : 'growth.reports.collect',
            {
              projectId: context.projectId,
              environmentId,
              principal: { kind: 'user', id: 'user.local-cli' },
              report,
            },
          );
          const evidence = mode === 'collect' ? growthReportEvidenceSchema.parse(raw) : undefined;
          const output = growthReportReadOutputSchema.parse(evidence?.report ?? raw);
          if (output.projectId !== context.projectId || output.environmentId !== environmentId)
            throw new Error(
              '[GROWTH_REPORT_TARGET_MISMATCH] Report belongs to another project or environment.',
            );
          console.log(
            asJson
              ? JSON.stringify(evidence ?? output, null, 2)
              : [
                  ...(evidence ? [`Saved evidence: ${evidence.evidenceId}`] : []),
                  output.presentation.headline,
                  `Account: ${output.accountId}; ${output.startDate} to ${output.endDate}`,
                  evidence
                    ? 'Saved snapshot; action types are not additive conversions. Timezone and attribution are unverified.'
                    : output.presentation.whyItMatters,
                  `Showing ${output.rows.length} of ${output.observedRowCount} collected rows${output.rowsTruncated ? '; output truncated' : ''}.`,
                  ...output.rows.map(
                    (row) =>
                      `${row.name ?? row.id} (${row.id}): spend ${row.spend ?? 'unknown'} ${row.currency ?? 'currency unavailable'}; clicks ${row.clicks ?? 'unknown'}; impressions ${row.impressions ?? 'unknown'}; ${row.actions.map((action) => `${action.type}: count ${action.count ?? 'unavailable'}, value ${action.value ?? 'unavailable'}`).join('; ')}`,
                  ),
                ].join('\n'),
          );
        },
      );
  reports
    .command('history')
    .option('--environment <id>')
    .option('--evidence-id <id>')
    .option('--report-type <type>')
    .option('--limit <count>', 'Maximum entries', Number)
    .option('--json')
    .action(async (options) => {
      const context = await loadGrowthProjectContext();
      const environmentId = selectGrowthEnvironment(context, options.environment);
      const query = growthReportHistoryInputSchema.parse({
        evidenceId: options.evidenceId,
        reportType: options.reportType,
        limit: options.limit,
      });
      const result = growthReportHistoryResultSchema.parse(
        await executeGrowthProviderCommand('growth.reports.history', {
          projectId: context.projectId,
          environmentId,
          principal: { kind: 'user', id: 'user.local-cli' },
          query,
        }),
      );
      if (result.projectId !== context.projectId || result.environmentId !== environmentId)
        throw new Error('Report history target mismatch.');
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : [
              `${result.entries.length} saved reports${result.truncated ? ' (history truncated)' : ''}`,
              ...result.entries.map(
                (entry) =>
                  `${entry.evidenceId} ${entry.reportType} ${entry.startDate} to ${entry.endDate}; ${entry.storedRowCount} stored rows${entry.partial ? '; partial' : ''}`,
              ),
              ...(result.selected ? [JSON.stringify(result.selected, null, 2)] : []),
            ].join('\n'),
      );
    });
}
