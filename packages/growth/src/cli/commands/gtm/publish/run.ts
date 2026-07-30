import { log } from '../../../log.js';
import type { GoogleTagManagerPublishReceipt } from '../../../../contracts.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';
import { GOOGLE_TAG_MANAGER_PUBLISH_SCOPE } from '../shared.js';
import { assertPublishAllowed, requiredVersion } from '../publish-policy.js';
import { assertVersionReceipt } from '../receipts.js';
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

export async function publishGoogleTagManagerCommand(
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
    const versionId = requiredVersion(options);
    assertPublishAllowed({ context, options, versionId, action: 'publish' });
    assertVersionReceipt({ context, receiptPath: options.versionReceipt, versionId });

    const receipt = await executeGrowthProviderCommand<GoogleTagManagerPublishReceipt>(
      'gtm.provider.publish',
      {
        accessToken: await accessToken(options, GOOGLE_TAG_MANAGER_PUBLISH_SCOPE),
        rateLimitMs: rateLimitMs(options),
        options: {
          manifest: context.manifest,
          environment: context.environment,
          versionId,
          fingerprint: options.fingerprint,
        },
      },
    );
    const outputPath =
      options.output ??
      defaultArtifactPath({
        cwd: context.cwd,
        appId: context.manifest.appId,
        environment: context.environment,
        kind: 'publishes',
        extension: 'json',
      });
    const artifact: GoogleTagManagerPublishReceipt & {
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
      log.section('Google Tag Manager Publish');
      log.info(`Published version: ${receipt.versionId}`);
      log.info(`Wrote ${outputPath}`);
    }
    return 0;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
