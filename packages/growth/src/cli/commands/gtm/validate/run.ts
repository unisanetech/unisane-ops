import { log } from '../../../log.js';
import {
  handleCommandError,
  loadCommandContext,
  printIssues,
  printJson,
  validationSummary,
  type GoogleTagManagerCliOptions,
} from '../shared.js';

export async function validateGoogleTagManagerCommand(
  options: GoogleTagManagerCliOptions,
): Promise<number> {
  try {
    const context = await loadCommandContext(options);
    const validation = validationSummary(context.manifest, context.environment);
    if (options.json) {
      printJson({
        ok: validation.ok,
        appId: context.manifest.appId,
        environment: context.environment,
        manifestPath: context.manifestPath,
        validation,
      });
    } else {
      log.section('Google Tag Manager Validation');
      log.info(`Manifest: ${context.manifestPath}`);
      log.info(`App: ${context.manifest.appId}`);
      log.info(`Environment: ${context.environment}`);
      printIssues(validation.issues);
    }
    return validation.ok ? 0 : 1;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
