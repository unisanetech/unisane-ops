import path from 'node:path';
import { log } from '../../../log.js';
import {
  applyMarketingGoogleAdsGoals,
  buildMarketingGoogleAdsGoalPlan,
  loadMarketingConfig,
  loadMarketingRegistries,
  MARKETING_GOOGLE_ADS_SCOPE,
  writeMarketingGoogleAdsGoalPlan,
  type MarketingGoogleAdsGoalPlan,
} from '@unisane/growth/marketing';
import { resolveMarketingGoogleAccessToken } from '../../marketing/auth/google.js';
import { resolveMarketingGoogleProfile } from '../../marketing/profile-defaults.js';
import type { AdsCliOptions } from '../options.js';

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
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const cwd = path.resolve(options.cwd ?? process.cwd());
    const registries = await loadMarketingRegistries(loaded.config, { cwd });
    const planned = buildMarketingGoogleAdsGoalPlan({
      config: loaded.config,
      registry: registries.conversions.value,
      accountId: options.accountId,
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

    const authProfile = resolveMarketingGoogleProfile(loaded.config, options);
    const accessToken = await resolveMarketingGoogleAccessToken({
      authProfile,
      requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
    });
    const result = await applyMarketingGoogleAdsGoals(loaded.config, registries.conversions.value, {
      accessToken,
      accountId: options.accountId,
      managerCustomerId: options.managerCustomerId,
      apiVersion: options.apiVersion,
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
