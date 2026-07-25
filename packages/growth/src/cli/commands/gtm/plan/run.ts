import { log } from '../../../log.js';
import { planGoogleTagManagerChanges } from '../../../../gtm/index.js';
import {
  defaultArtifactPath,
  handleCommandError,
  loadCommandContext,
  printIssues,
  printJson,
  printPlan,
  readRemoteSnapshot,
  validationSummary,
  writeJsonArtifact,
  type GoogleTagManagerCliOptions,
} from '../shared.js';

export async function planGoogleTagManagerCommand(
  options: GoogleTagManagerCliOptions,
): Promise<number> {
  try {
    const context = await loadCommandContext(options);
    const validation = validationSummary(context.manifest, context.environment);
    if (!validation.ok) {
      if (options.json) printJson({ ok: false, validation });
      else printIssues(validation.issues);
      return 1;
    }
    const remote = await readRemoteSnapshot({ context, options });
    const plan = planGoogleTagManagerChanges({ manifest: context.manifest, remote });
    const outputPath =
      options.output ??
      defaultArtifactPath({
        cwd: context.cwd,
        appId: context.manifest.appId,
        environment: context.environment,
        kind: 'plans',
        extension: 'json',
      });
    const artifact = {
      appId: context.manifest.appId,
      environment: context.environment,
      manifestPath: context.manifestPath,
      containerPath: remote.containerPath,
      workspacePath: remote.workspacePath,
      operationCount: plan.operations.length,
      validation,
      plan,
    };

    writeJsonArtifact({ outputPath, value: artifact, dryRun: options.dryRun });

    if (options.json) {
      printJson({
        ok: true,
        outputPath,
        dryRun: Boolean(options.dryRun),
        artifact,
      });
    } else {
      log.section('Google Tag Manager Plan');
      printPlan(plan);
      log.info(options.dryRun ? `[dry-run] Would write ${outputPath}` : `Wrote ${outputPath}`);
    }
    return 0;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
