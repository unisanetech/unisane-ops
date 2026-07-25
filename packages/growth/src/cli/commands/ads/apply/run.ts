import { readFileSync } from 'node:fs';
import path from 'node:path';
import { log } from '../../../log.js';
import {
  loadMarketingConfig,
  MARKETING_GOOGLE_ADS_SCOPE,
  marketingAdsPlanArtifactSchema,
  writeMarketingAdsLiveApplyReceipt,
  writeMarketingAdsApplyPreview,
  type MarketingConfig,
  type MarketingAdsPlanProvider,
} from '@unisane/growth/marketing';
import {
  executeGoogleAdsLiveOperation,
  executeMetaAdsLiveOperation,
} from '../../../provider-adapters.js';
import { resolveMarketingGoogleAccessToken } from '../../marketing/auth/google.js';
import { resolveMarketingMetaAccessToken } from '../../marketing/auth/meta.js';
import type { AdsCliOptions } from '../options.js';
import { printAdsApplyResult, printAdsLiveApplyResult } from '../output/apply.js';

async function resolveAdsLiveEnv(
  config: MarketingConfig,
  options: AdsCliOptions,
  providers: Set<MarketingAdsPlanProvider>,
): Promise<Record<string, string | undefined>> {
  const env = { ...process.env };
  const googleProvider = config.providers.googleAds;
  if (
    providers.has('googleAds') &&
    googleProvider.accessTokenEnv &&
    !env[googleProvider.accessTokenEnv]?.trim()
  ) {
    env[googleProvider.accessTokenEnv] = await resolveMarketingGoogleAccessToken({
      accessTokenEnv: googleProvider.accessTokenEnv,
      authProfile: options.authProfile,
      requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
    });
  }
  const metaProvider = config.providers.metaAds;
  if (
    providers.has('metaAds') &&
    metaProvider.accessTokenEnv &&
    !env[metaProvider.accessTokenEnv]?.trim()
  ) {
    env[metaProvider.accessTokenEnv] = await resolveMarketingMetaAccessToken({
      accessTokenEnv: metaProvider.accessTokenEnv,
      authProfile: options.metaAuthProfile,
    });
  }
  return env;
}

function adsPlanProviders(options: AdsCliOptions): Set<MarketingAdsPlanProvider> {
  if (!options.plan) return new Set();
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const planPath = path.resolve(cwd, options.plan);
  const plan = marketingAdsPlanArtifactSchema.parse(JSON.parse(readFileSync(planPath, 'utf8')));
  return new Set(plan.candidates.map((candidate) => candidate.provider));
}

export async function adsApply(options: AdsCliOptions): Promise<number> {
  try {
    if (!options.plan) {
      throw new Error('[ADS_APPLY_PLAN_REQUIRED] ads apply requires --plan <path>.');
    }
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    if (options.yes && options.receipt) {
      const env = await resolveAdsLiveEnv(loaded.config, options, adsPlanProviders(options));
      const result = await writeMarketingAdsLiveApplyReceipt(loaded.config, {
        cwd: options.cwd,
        planPath: options.plan,
        receiptPath: options.receipt,
        yes: options.yes,
        accountConfirm: options.accountConfirm,
        productionConfirm: options.productionConfirm,
        operationConfirm: options.operationConfirm,
        approvalRef: options.approvalRef,
        liveExecutorMode: options.liveExecutor ?? 'disabled',
        providerExecutors: {
          googleAds: executeGoogleAdsLiveOperation,
          metaAds: executeMetaAdsLiveOperation,
        },
        out: options.out,
        env,
        apiVersion: options.apiVersion,
      });
      printAdsLiveApplyResult(result, { json: options.json });
      return result.ok ? 0 : 1;
    }
    const result = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd: options.cwd,
      planPath: options.plan,
      dryRun: options.dryRun,
      yes: options.yes,
      accountConfirm: options.accountConfirm,
      productionConfirm: options.productionConfirm,
      out: options.out,
    });
    printAdsApplyResult(result, { json: options.json });
    return result.ok ? 0 : 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown ads apply error';
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      log.error(message);
    }
    return 1;
  }
}
