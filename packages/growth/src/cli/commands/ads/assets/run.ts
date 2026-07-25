import {
  approveMarketingAdsAsset,
  archiveMarketingAdsAsset,
  buildMarketingAdsAssetReport,
  importMarketingAdsAsset,
  loadMarketingConfig,
  MARKETING_GOOGLE_ADS_SCOPE,
  marketingAdsAssetTypeSchema,
  marketingAdsPlanProviderSchema,
  writeMarketingAdsAssetCreativePlan,
  writeMarketingAdsAssetUploadReceipt,
  writeMarketingAdsAssetUploadPlan,
  writeMarketingGoogleAdsCampaignAssetLinkReceipt,
  type MarketingConfig,
  type MarketingAdsPlanProvider,
} from '@unisane/growth/marketing';
import type { AdsCliOptions } from '../options.js';
import {
  printAdsAssetImportResult,
  printAdsAssetCreativePlanResult,
  printAdsAssetReport,
  printAdsAssetUploadResult,
  printAdsAssetUploadPlanResult,
} from '../output/assets.js';
import { resolveMarketingGoogleAccessToken } from '../../marketing/auth/google.js';
import { resolveMarketingMetaAccessToken } from '../../marketing/auth/meta.js';
import { uploadMetaAdsAsset } from '../../../provider-adapters.js';

type AdsAssetMode =
  | 'import'
  | 'approve'
  | 'archive'
  | 'validate'
  | 'report'
  | 'upload-plan'
  | 'creative-plan'
  | 'upload'
  | 'link-google-campaign';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function parseProviders(value: string | undefined): MarketingAdsPlanProvider[] {
  if (!value) throw new Error('[ADS_ASSET_PROVIDER_REQUIRED] Pass --provider <provider>.');
  return value.split(',').map((entry) => marketingAdsPlanProviderSchema.parse(entry.trim()));
}

function parseProviderFilter(value: AdsCliOptions['provider']): MarketingAdsPlanProvider | 'all' {
  if (!value || value === 'all') return 'all';
  return marketingAdsPlanProviderSchema.parse(value);
}

function parseCsv(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : undefined;
}

function parseGoogleCampaignImageFieldType(
  value: string | undefined,
): 'MARKETING_IMAGE' | 'AD_IMAGE' {
  if (!value || value === 'MARKETING_IMAGE') return 'MARKETING_IMAGE';
  if (value === 'AD_IMAGE') return 'AD_IMAGE';
  throw new Error(
    '[ADS_ASSET_GOOGLE_LINK_FIELD_UNSUPPORTED] Google Ads campaign image field type must be MARKETING_IMAGE or AD_IMAGE.',
  );
}

async function resolveAdsAssetLiveEnv(
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

export async function adsAssets(
  options: AdsCliOptions & { assetMode: AdsAssetMode },
): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    if (options.assetMode === 'import') {
      if (!options.file) throw new Error('[ADS_ASSET_FILE_REQUIRED] Pass --file <path>.');
      if (!options.assetId) {
        throw new Error('[ADS_ASSET_ID_REQUIRED] Pass --asset-id <stable-id>.');
      }
      if (!options.type) throw new Error('[ADS_ASSET_TYPE_REQUIRED] Pass --type <type>.');
      if (!options.owner) throw new Error('[ADS_ASSET_OWNER_REQUIRED] Pass --owner <owner>.');
      const result = importMarketingAdsAsset(loaded.config, {
        cwd: options.cwd,
        assetId: options.assetId,
        filePath: options.file,
        assetType: marketingAdsAssetTypeSchema.parse(options.type),
        owner: options.owner,
        name: options.name,
        providers: parseProviders(options.provider),
        placements: parseCsv(options.placement),
        strategyObjectIds: parseCsv(options.strategyObjectId),
        license: options.license,
        sourceNotes: options.sourceNotes,
      });
      printAdsAssetImportResult(result, { json: options.json });
      return result.ok ? 0 : 1;
    }

    if (options.assetMode === 'approve' || options.assetMode === 'archive') {
      if (!options.assetId) {
        throw new Error('[ADS_ASSET_ID_REQUIRED] Pass --asset-id <stable-id>.');
      }
      const result =
        options.assetMode === 'approve'
          ? approveMarketingAdsAsset(loaded.config, {
              cwd: options.cwd,
              assetId: options.assetId,
              approvalRef: options.approvalRef,
              policyNotes: options.policyNotes,
            })
          : archiveMarketingAdsAsset(loaded.config, {
              cwd: options.cwd,
              assetId: options.assetId,
              policyNotes: options.policyNotes,
            });
      printAdsAssetImportResult(result, { json: options.json });
      return result.ok ? 0 : 1;
    }

    if (options.assetMode === 'upload-plan') {
      const result = writeMarketingAdsAssetUploadPlan(loaded.config, {
        cwd: options.cwd,
        provider: parseProviderFilter(options.provider),
        assetIds: parseCsv(options.assetId),
        out: options.out,
        dryRun: options.dryRun,
      });
      printAdsAssetUploadPlanResult(result, { json: options.json });
      return result.ok ? 0 : 1;
    }

    if (options.assetMode === 'creative-plan') {
      const result = writeMarketingAdsAssetCreativePlan(loaded.config, {
        cwd: options.cwd,
        provider: parseProviderFilter(options.provider),
        assetIds: parseCsv(options.assetId),
        placements: parseCsv(options.placement),
        out: options.out,
        dryRun: options.dryRun,
      });
      printAdsAssetCreativePlanResult(result, { json: options.json });
      return result.ok ? 0 : 1;
    }

    if (options.assetMode === 'upload') {
      if (!options.plan) {
        throw new Error('[ADS_ASSET_UPLOAD_PLAN_REQUIRED] Pass --plan <upload-plan.json>.');
      }
      const providers = parseProviderFilter(options.provider);
      const selectedProviders =
        providers === 'all'
          ? new Set<MarketingAdsPlanProvider>(['googleAds', 'metaAds'])
          : new Set([providers]);
      const env = options.yes
        ? await resolveAdsAssetLiveEnv(loaded.config, options, selectedProviders)
        : undefined;
      const result = await writeMarketingAdsAssetUploadReceipt(loaded.config, {
        cwd: options.cwd,
        planPath: options.plan,
        dryRun: options.dryRun,
        yes: options.yes,
        receiptPath: options.receipt,
        approvalRef: options.approvalRef,
        accountConfirm: options.accountConfirm,
        productionConfirm: options.productionConfirm,
        operationConfirm: options.operationConfirm,
        liveExecutorMode: options.liveExecutor ?? 'disabled',
        providerUploaders: {
          metaAds: uploadMetaAdsAsset,
        },
        out: options.out,
        env,
        apiVersion: options.apiVersion,
      });
      printAdsAssetUploadResult(result, { json: options.json });
      return result.ok ? 0 : 1;
    }

    if (options.assetMode === 'link-google-campaign') {
      if (!options.campaignResource) {
        throw new Error(
          '[ADS_ASSET_CAMPAIGN_RESOURCE_REQUIRED] Pass --campaign-resource <resource-name>.',
        );
      }
      const assetIds = parseCsv(options.assetId);
      if (!assetIds) throw new Error('[ADS_ASSET_ID_REQUIRED] Pass --asset-id <id[,id]>.');
      const env = options.yes
        ? await resolveAdsAssetLiveEnv(loaded.config, options, new Set(['googleAds']))
        : { ...process.env };
      const result = await writeMarketingGoogleAdsCampaignAssetLinkReceipt(loaded.config, {
        cwd: options.cwd,
        campaignResourceName: options.campaignResource,
        assetIds,
        fieldType: parseGoogleCampaignImageFieldType(options.fieldType),
        yes: options.yes,
        out: options.out,
        env,
        apiVersion: options.apiVersion,
      });
      printJson(result.receipt);
      return result.ok ? 0 : 1;
    }

    const report = buildMarketingAdsAssetReport(loaded.config, { cwd: options.cwd });
    printAdsAssetReport(report, { json: options.json });
    return options.assetMode === 'validate' && !report.ok ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ads assets error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
