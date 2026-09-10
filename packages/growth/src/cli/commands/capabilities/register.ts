import type { Command } from 'commander';
import { growthCapabilityReviewOutputSchema } from '../../../capabilities/contracts.js';
import { executeGrowthProviderCommand } from '../../provider-runtime.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../project-context.js';

export function registerCapabilityCommands(parent: Command): void {
  parent
    .command('capabilities')
    .description('Review supported operations and account prerequisites')
    .command('review')
    .description('Review Meta capabilities without provider requests')
    .option('--environment <id>', 'Exact configured environment')
    .option('--json', 'Return the shared typed result')
    .action(async (options: { environment?: string; json?: boolean }) => {
      const context = await loadGrowthProjectContext();
      const environmentId = selectGrowthEnvironment(context, options.environment);
      const output = growthCapabilityReviewOutputSchema.parse(
        await executeGrowthProviderCommand('growth.capabilities.review', {
          projectId: context.projectId,
          environmentId,
          principal: { kind: 'user', id: 'user.local-cli' },
        }),
      );
      if (output.projectId !== context.projectId || output.environmentId !== environmentId) {
        throw new Error(
          '[GROWTH_CAPABILITIES_TARGET_MISMATCH] Capability review does not match the CLI project and environment.',
        );
      }
      console.log(
        options.json
          ? JSON.stringify(output, null, 2)
          : [
              output.presentation.headline,
              output.presentation.whyItMatters,
              ...output.capabilities.map(
                (item) =>
                  `\n${item.title}: ${item.status}\n${item.reasons.join(' ')}\nNext: ${item.nextStep}`,
              ),
            ].join('\n'),
      );
    });
}
