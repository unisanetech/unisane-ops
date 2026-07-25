import { log } from '../../../log.js';
import { planGoogleTagManagerChanges } from '../../../../gtm/index.js';
import {
  handleCommandError,
  loadCommandContext,
  printIssues,
  printJson,
  printPlan,
  readRemoteSnapshot,
  validationSummary,
  type GoogleTagManagerCliOptions,
} from '../shared.js';

export async function diffGoogleTagManagerCommand(
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
    if (options.json) {
      printJson({
        ok: true,
        operationCount: plan.operations.length,
        plan,
      });
    } else {
      log.section('Google Tag Manager Diff');
      printPlan(plan);
    }
    return plan.operations.length === 0 ? 0 : 2;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
