import { log } from '../../../log.js';
import type { GoogleTagManagerCreateVersionReceipt } from '../../../../contracts.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';
import { assertPreviewReceipt } from '../receipts.js';
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

export async function createVersionGoogleTagManagerCommand(
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
    if (!options.yes) {
      throw new Error(
        '[GTM_CREATE_VERSION_CONFIRMATION_REQUIRED] Re-run with --yes to create a GTM container version.',
      );
    }
    assertPreviewReceipt({ context, receiptPath: options.previewReceipt });

    const receipt = await executeGrowthProviderCommand<GoogleTagManagerCreateVersionReceipt>(
      'gtm.provider.create-version',
      {
        accessToken: await accessToken(options, 'tagmanager.edit.containerversions'),
        rateLimitMs: rateLimitMs(options),
        options: {
          manifest: context.manifest,
          environment: context.environment,
          workspaceId: options.workspaceId,
          workspaceName: options.workspaceName,
          name:
            options.name ??
            `${context.manifest.appId}/${context.environment} ${new Date().toISOString()}`,
          notes: options.notes,
        },
      },
    );
    const outputPath =
      options.output ??
      defaultArtifactPath({
        cwd: context.cwd,
        appId: context.manifest.appId,
        environment: context.environment,
        kind: 'versions',
        extension: 'json',
      });
    const artifact: GoogleTagManagerCreateVersionReceipt & {
      manifestPath: string;
      validation: ValidationSummary;
    } = {
      ...receipt,
      manifestPath: context.manifestPath,
      validation,
    };

    writeJsonArtifact({ outputPath, value: artifact });

    if (options.json) {
      printJson({ ok: true, outputPath, artifact });
    } else {
      log.section('Google Tag Manager Create Version');
      log.info(`Version: ${receipt.versionId ?? receipt.versionPath ?? '<unknown>'}`);
      log.info(`Wrote ${outputPath}`);
    }
    return 0;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
