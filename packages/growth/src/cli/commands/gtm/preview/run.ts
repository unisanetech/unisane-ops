import { log } from '../../../log.js';
import type { GoogleTagManagerPreviewReceipt } from '../../../../contracts.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';
import {
  accessToken,
  defaultArtifactPath,
  handleCommandError,
  loadCommandContext,
  printIssues,
  printJson,
  rateLimitMs,
  validationSummary,
  writeJsonArtifact,
  type GoogleTagManagerCliOptions,
  type ValidationSummary,
} from '../shared.js';

export async function previewGoogleTagManagerCommand(
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

    const receipt = await executeGrowthProviderCommand<GoogleTagManagerPreviewReceipt>(
      'gtm.provider.preview',
      {
        accessToken: await accessToken(options, 'tagmanager.edit.containerversions'),
        rateLimitMs: rateLimitMs(options),
        options: {
          manifest: context.manifest,
          environment: context.environment,
          workspaceId: options.workspaceId,
          workspaceName: options.workspaceName,
        },
      },
    );
    const outputPath =
      options.output ??
      defaultArtifactPath({
        cwd: context.cwd,
        appId: context.manifest.appId,
        environment: context.environment,
        kind: 'previews',
        extension: 'json',
      });
    const artifact: GoogleTagManagerPreviewReceipt & {
      manifestPath: string;
      validation: ValidationSummary;
    } = {
      ...receipt,
      manifestPath: context.manifestPath,
      validation,
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
      log.section('Google Tag Manager Preview');
      log.info(`Workspace: ${receipt.workspacePath}`);
      log.info(options.dryRun ? `[dry-run] Would write ${outputPath}` : `Wrote ${outputPath}`);
    }
    return 0;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
