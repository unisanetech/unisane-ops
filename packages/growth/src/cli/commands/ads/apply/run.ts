import { readFileSync } from 'node:fs';
import path from 'node:path';
import { log } from '../../../log.js';
import {
  MARKETING_GOOGLE_ADS_SCOPE,
  marketingAdsPlanArtifactSchema,
  writeMarketingAdsLiveApplyReceipt,
  writeMarketingAdsApplyPreview,
  type MarketingExecutionContext,
  type MarketingAdsPlanProvider,
} from '@unisane/growth/marketing';
import { executeGoogleAdsLiveOperation } from '../../../provider-adapters.js';
import type { AdsCliOptions } from '../options.js';
import { printAdsApplyResult, printAdsLiveApplyResult } from '../output/apply.js';
import { resolveGrowthGoogleConnectionCredentials } from '../../../connections/google.js';
import {
  loadGrowthProjectContext,
  loadMarketingExecutionContext,
  resolveGrowthResource,
} from '../../../project-context.js';

async function resolveAdsLiveEnv(
  config: MarketingExecutionContext,
  options: AdsCliOptions,
  providers: Set<MarketingAdsPlanProvider>,
): Promise<{
  env: Record<string, string | undefined>;
  providerCredentials: Parameters<
    typeof writeMarketingAdsLiveApplyReceipt
  >[1]['providerCredentials'];
}> {
  void config;
  if (providers.has('metaAds')) {
    throw new Error(
      '[META_ADS_LIVE_CREDENTIAL_CALLBACK_REQUIRED] Meta live apply is unavailable until its separately approved host credential callback is composed.',
    );
  }
  const env = { ...process.env };
  const google = providers.has('googleAds')
    ? {
        resource: resolveGrowthResource({
          context: await loadGrowthProjectContext(),
          environment: options.environment,
          provider: 'google',
          service: 'ads',
          resourceType: 'customer',
        }),
        credentials: await resolveGrowthGoogleConnectionCredentials({
          service: 'ads',
          connection: options.connection,
          environment: options.environment,
          requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
        }),
      }
    : undefined;
  return {
    env,
    providerCredentials: {
      ...(google
        ? {
            googleAds: {
              accountId: google.resource.resourceId,
              ...google.credentials,
            },
          }
        : {}),
    },
  };
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
    const loaded = await loadMarketingExecutionContext();
    if (options.yes && options.receipt) {
      const providerContext = await resolveAdsLiveEnv(
        loaded.config,
        options,
        adsPlanProviders(options),
      );
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
        },
        out: options.out,
        env: providerContext.env,
        providerCredentials: providerContext.providerCredentials,
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
