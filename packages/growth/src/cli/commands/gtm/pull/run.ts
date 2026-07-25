import { log } from '../../../log.js';
import {
  defaultArtifactPath,
  handleCommandError,
  loadCommandContext,
  printIssues,
  printJson,
  readRemoteSnapshot,
  validationSummary,
  writeJsonArtifact,
  type GoogleTagManagerCliOptions,
} from '../shared.js';

export async function pullGoogleTagManagerCommand(
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
    const snapshot = await readRemoteSnapshot({ context, options });
    const outputPath =
      options.output ??
      defaultArtifactPath({
        cwd: context.cwd,
        appId: context.manifest.appId,
        environment: context.environment,
        kind: 'snapshots',
        extension: 'json',
      });

    writeJsonArtifact({ outputPath, value: snapshot, dryRun: options.dryRun });

    if (options.json) {
      printJson({
        ok: true,
        outputPath,
        dryRun: Boolean(options.dryRun),
        resourceCount: snapshot.resources.length,
        snapshot,
      });
    } else {
      log.section('Google Tag Manager Pull');
      log.info(
        `Read ${snapshot.resources.length} resource(s) from ${snapshot.workspacePath ?? snapshot.containerPath}.`,
      );
      log.info(options.dryRun ? `[dry-run] Would write ${outputPath}` : `Wrote ${outputPath}`);
    }
    return 0;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
