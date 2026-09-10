import path from 'node:path';
import { log } from '../../../log.js';
import {
  applyMarketingGoogleAdsGoals,
  buildMarketingGoogleAdsGoalPlan,
  loadMarketingRegistries,
  writeMarketingGoogleAdsGoalPlan,
  type MarketingGoogleAdsGoalPlan,
} from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';
import {
  loadGrowthProjectContext,
  loadMarketingExecutionContext,
  resolveGrowthResource,
} from '../../../project-context.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function defaultOutPath(cwd: string, validateOnly: boolean): string {
  const file = validateOnly
    ? 'google-ads-goals-validate-preview.json'
    : 'google-ads-goals-plan.json';
  return path.join(cwd, '.unisane', 'marketing', 'test', file);
}

function resolveOutPath(cwd: string, outPath: string | undefined, validateOnly: boolean): string {
  if (!outPath) return defaultOutPath(cwd, validateOnly);
  return path.isAbsolute(outPath) ? outPath : path.join(cwd, outPath);
}

function requiredAccountConfirmation(options: AdsCliOptions, customerId: string): void {
  const expected = `test:googleAds:${customerId}:conversion-goals`;
  const confirmations = (options.accountConfirm ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!confirmations.includes(expected)) {
    throw new Error(
      `[ADS_GOALS_CONFIRM_REQUIRED] Pass --account-confirm ${expected} before creating Google Ads conversion actions.`,
    );
  }
}

function printPlan(plan: MarketingGoogleAdsGoalPlan, outPath?: string): void {
  log.section('Google Ads Goals');
  log.info(
    `${plan.operations.length} conversion action operation(s) for customer ${plan.customerId}.`,
  );
  if (plan.loginCustomerId) log.info(`Login customer: ${plan.loginCustomerId}`);
  for (const operation of plan.operations) {
    log.info(
      `${operation.status}: ${operation.actionName} (${operation.category}, primary=${String(
        operation.primaryForGoal,
      )})`,
    );
  }
  if (outPath) log.info(`Wrote: ${outPath}`);
  log.info(`Next: ${plan.nextWorkflowStep}`);
}

export async function adsGoalsGoogle(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingExecutionContext();
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const registries = await loadMarketingRegistries(loaded.config, { cwd });
    const selectedCustomer = resolveGrowthResource({
      context: await loadGrowthProjectContext(),
      environment: options.environment,
      provider: 'google',
      service: 'ads',
      resourceType: 'customer',
    });
    if (options.accountId && options.accountId !== selectedCustomer.resourceId) {
      throw new Error(
        `[GROWTH_RESOURCE_OVERRIDE_REJECTED] '${options.accountId}' is not the selected Google Ads customer.`,
      );
    }
    const planned = buildMarketingGoogleAdsGoalPlan({
      registry: registries.conversions.value,
      accountId: selectedCustomer.resourceId,
      managerCustomerId: options.managerCustomerId,
    });

    if (!options.dryRun && !options.yes) {
      const outPath = writeMarketingGoogleAdsGoalPlan(
        planned,
        resolveOutPath(cwd, options.out, false),
      );
      if (options.json) printJson({ ...planned, outPath });
      else printPlan(planned, outPath);
      return 0;
    }

    if (options.yes) {
      if (options.liveExecutor !== 'api') {
        throw new Error(
          '[ADS_GOALS_LIVE_EXECUTOR_REQUIRED] Pass --live-executor api for live setup.',
        );
      }
      requiredAccountConfirmation(options, planned.customerId);
    }

    const result = await applyMarketingGoogleAdsGoals(registries.conversions.value, {
      accountId: selectedCustomer.resourceId,
      managerCustomerId: options.managerCustomerId,
      provider: {
        apply: (plan, validateOnly) =>
          executeGrowthProviderCommand('google.marketing.apply-goals', {
            plan,
            validateOnly,
            connection: options.connection,
            environment: options.environment,
            apiVersion: options.apiVersion,
            accountConfirm: options.accountConfirm,
          }),
      },
      validateOnly: Boolean(options.dryRun),
      live: Boolean(options.yes),
    });
    const outPath = writeMarketingGoogleAdsGoalPlan(
      result,
      resolveOutPath(cwd, options.out, Boolean(options.dryRun)),
    );
    if (options.json) printJson({ ...result, outPath });
    else printPlan(result, outPath);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google Ads goals error.';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
