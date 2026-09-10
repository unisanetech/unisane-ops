import type { Command } from 'commander';
import { readFile, stat } from 'node:fs/promises';
import {
  metaDiagnosticObservationSchema,
  metaDiagnosticImportResultSchema,
  metaDiagnosticReviewInputSchema,
  metaDiagnosticReviewResultSchema,
} from '../../../measurement/meta-diagnostics/contracts.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../project-context.js';
import { executeGrowthProviderCommand } from '../../provider-runtime.js';
export function registerDiagnosticCommands(parent: Command) {
  const commands = parent
    .command('diagnostics')
    .description('Import and investigate Meta event evidence without provider access');
  commands
    .command('import')
    .requiredOption('--file <path>')
    .option('--environment <id>')
    .option('--json')
    .action(async (options) => {
      if ((await stat(options.file)).size > 256 * 1024)
        throw new Error('Diagnostic input exceeds 256 KiB.');
      const observation = metaDiagnosticObservationSchema.parse(
        JSON.parse(await readFile(options.file, 'utf8')),
      );
      const context = await loadGrowthProjectContext();
      const environmentId = selectGrowthEnvironment(context, options.environment);
      const result = metaDiagnosticImportResultSchema.parse(
        await executeGrowthProviderCommand('growth.meta.diagnostics.import', {
          projectId: context.projectId,
          environmentId,
          principal: { kind: 'user', id: 'user.local-cli' },
          observation,
        }),
      );
      if (
        result.projectId !== context.projectId ||
        result.environmentId !== environmentId ||
        result.datasetId !== observation.datasetId ||
        result.connectionId !== observation.connectionId
      )
        throw new Error('Diagnostic target mismatch.');
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : `Imported ${result.eventCount} events as ${result.evidenceId}. This is historical evidence, not live verification.`,
      );
    });
  commands
    .command('review')
    .option('--environment <id>')
    .option('--event <name>')
    .option('--limit <count>', 'Returned events', Number)
    .option('--max-age-hours <count>', 'Freshness limit', Number)
    .option('--json')
    .action(async (options) => {
      const context = await loadGrowthProjectContext();
      const environmentId = selectGrowthEnvironment(context, options.environment);
      const query = metaDiagnosticReviewInputSchema.parse({
        eventName: options.event,
        limit: options.limit,
        maxAgeHours: options.maxAgeHours,
      });
      const result = metaDiagnosticReviewResultSchema.parse(
        await executeGrowthProviderCommand('growth.meta.diagnostics.review', {
          projectId: context.projectId,
          environmentId,
          principal: { kind: 'user', id: 'user.local-cli' },
          query,
        }),
      );
      if (result.projectId !== context.projectId || result.environmentId !== environmentId)
        throw new Error('Diagnostic target mismatch.');
      console.log(
        options.json
          ? JSON.stringify(result, null, 2)
          : [
              result.message,
              `Dataset ${result.datasetId}; evidence ${result.freshness}${result.truncated ? '; results truncated' : ''}`,
              ...result.events.flatMap((event) => [
                `${event.name}: total ${event.total ?? 'unknown'}; match quality ${event.matchQuality ?? 'unknown'}`,
                ...event.issues.map(
                  (issue) =>
                    `${issue.severity} ${issue.code} (${issue.state}): ${issue.explanation}`,
                ),
              ]),
              ...result.handoffs.map(
                (handoff) => `${handoff.owner}: ${handoff.proposal} (${handoff.basis}; unverified)`,
              ),
            ].join('\n'),
      );
    });
}
