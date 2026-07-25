import { log } from '../../../log.js';
import {
  getGoogleTagManagerDesiredResources,
  planGoogleTagManagerChanges,
  type GoogleTagManagerApplyReceipt,
} from '../../../../gtm/index.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';
import {
  accessToken,
  defaultArtifactPath,
  handleCommandError,
  loadCommandContext,
  printIssues,
  printJson,
  printPlan,
  rateLimitMs,
  readRemoteSnapshot,
  validationSummary,
  writeJsonArtifact,
  type GoogleTagManagerCliOptions,
  type ValidationSummary,
} from '../shared.js';

export async function applyGoogleTagManagerCommand(
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

    if (options.dryRun) {
      if (!options.workspaceId && !options.workspaceName && !options.snapshot) {
        throw new Error(
          '[GTM_APPLY_DRY_RUN_WORKSPACE_REQUIRED] Pass --workspace-id, --workspace-name, or --snapshot for gtm apply --dry-run.',
        );
      }
      const remote = await readRemoteSnapshot({ context, options });
      const plan = planGoogleTagManagerChanges({ manifest: context.manifest, remote });
      if (options.json) {
        printJson({
          ok: true,
          dryRun: true,
          operationCount: plan.operations.length,
          plan,
        });
      } else {
        log.section('Google Tag Manager Apply Dry Run');
        printPlan(plan);
      }
      return 0;
    }

    if (options.snapshot) {
      throw new Error('[GTM_APPLY_SNAPSHOT_NOT_ALLOWED] Live apply cannot use --snapshot.');
    }

    if (!options.yes) {
      throw new Error(
        '[GTM_APPLY_CONFIRMATION_REQUIRED] Re-run with --yes to mutate the GTM workspace.',
      );
    }

    const receipt = await executeGrowthProviderCommand<GoogleTagManagerApplyReceipt>(
      'gtm.provider.apply',
      {
        accessToken: await accessToken(options, 'tagmanager.edit.containers'),
        rateLimitMs: rateLimitMs(options),
        options: {
          manifest: context.manifest,
          environment: context.environment,
          workspaceId: options.workspaceId,
          workspaceName: options.workspaceName,
          desiredResources: getGoogleTagManagerDesiredResources(context.manifest),
          plan: (remote: Parameters<typeof planGoogleTagManagerChanges>[0]['remote']) =>
            planGoogleTagManagerChanges({
              manifest: context.manifest,
              remote,
            }),
        },
      },
    );
    const outputPath =
      options.output ??
      defaultArtifactPath({
        cwd: context.cwd,
        appId: context.manifest.appId,
        environment: context.environment,
        kind: 'receipts',
        extension: 'json',
      });
    const artifact: GoogleTagManagerApplyReceipt & {
      manifestPath: string;
      validation: ValidationSummary;
    } = {
      ...receipt,
      manifestPath: context.manifestPath,
      validation,
    };

    writeJsonArtifact({ outputPath, value: artifact });

    if (options.json) {
      printJson({
        ok: true,
        outputPath,
        artifact,
      });
    } else {
      log.section('Google Tag Manager Apply');
      log.info(`Workspace: ${receipt.workspacePath}`);
      log.info(`Applied ${receipt.appliedOperations.length} operation(s).`);
      if (receipt.skippedOperations.length > 0) {
        log.info(`Skipped ${receipt.skippedOperations.length} unmanaged/no-op operation(s).`);
      }
      log.info(`Wrote ${outputPath}`);
    }
    return 0;
  } catch (error) {
    return handleCommandError(error, options);
  }
}
