import { log } from '../../../log.js';
import type { GoogleTagManagerRollbackReceipt } from '../../../../contracts.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';
import { GOOGLE_TAG_MANAGER_PUBLISH_SCOPE } from '../auth.js';
import { assertPublishAllowed, requiredVersion } from '../publish-policy.js';
import { assertRollbackSource } from '../receipts.js';
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

export async function rollbackGoogleTagManagerCommand(
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
    assertPublishAllowed({ context, options, versionId, action: 'rollback' });
    const rollbackSource = assertRollbackSource({ context, options, versionId });

    const receipt = await executeGrowthProviderCommand<GoogleTagManagerRollbackReceipt>(
      'gtm.provider.rollback',
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
        kind: 'rollbacks',
        extension: 'json',
      });
    const artifact: GoogleTagManagerRollbackReceipt & {
      manifestPath: string;
      validation: ValidationSummary;
      rollbackSource: typeof rollbackSource;
    } = {
      ...receipt,
      manifestPath: context.manifestPath,
      validation,
      rollbackSource,
    };

    writeJsonArtifact({ outputPath, value: artifact });

    if (options.json) {
      printJson({ ok: true, outputPath, artifact });
    } else {
      log.section('Google Tag Manager Rollback');
      log.info(`Rolled back to version: ${receipt.versionId}`);
      log.info(`Wrote ${outputPath}`);
    }
    return 0;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
