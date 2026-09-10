import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Command } from 'commander';
import { gtmTrackingSetupAction } from '../../../gtm/setup/generate.js';
import { loadGrowthProjectContext, selectGrowthEnvironment } from '../../project-context.js';
export function registerGtmSetupCommand(parent: Command) {
  parent
    .command('generate-setup')
    .description('Generate a separate consent-aware tracking manifest proposal')
    .requiredOption('--input <path>', 'Explicit setup JSON')
    .option('--output <path>', 'Write a new manifest module; never overwrite an existing file')
    .option('--environment <id>')
    .option('--json')
    .action(async (options) => {
      const context = await loadGrowthProjectContext();
      const environmentId = selectGrowthEnvironment(context, options.environment);
      const result = await gtmTrackingSetupAction.execute(
        JSON.parse(await readFile(path.resolve(context.projectRoot, options.input), 'utf8')),
        {
          requestId: 'gtm-setup',
          scopeId: context.projectId,
          projectId: context.projectId,
          environmentId,
          principal: { kind: 'user', id: 'local-cli' },
          requestedAt: new Date().toISOString(),
        },
      );
      if (options.output)
        await writeFile(
          path.resolve(context.projectRoot, options.output),
          `export default JSON.parse(${JSON.stringify(JSON.stringify(result.manifest, null, 2))});\n`,
          { encoding: 'utf8', flag: 'wx', mode: 0o600 },
        );
      console.log(JSON.stringify(result, null, 2));
    });
}
