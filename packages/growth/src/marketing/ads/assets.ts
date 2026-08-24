import { createHash } from 'node:crypto';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingAdsAssetRegistrySchema,
  marketingAdsAssetSchema,
  marketingAdsAssetCreativePlanSchema,
  marketingMetaAdsPlacementSchema,
  marketingAdsAssetUploadPlanSchema,
  marketingAdsAssetUploadReceiptSchema,
  marketingAdsAssetLiveUploadReceiptSchema,
  type MarketingAdsAsset,
  type MarketingAdsAssetCreativePlan,
  type MarketingAdsAssetRegistry,
  type MarketingAdsAssetType,
  type MarketingMetaAdsPlacement,
  type MarketingMetaAdsPlacementTargeting,
  type MarketingAdsAssetUploadConfirmation,
  type MarketingAdsAssetUploadReceipt,
  type MarketingAdsAssetLiveUploadReceipt,
  type MarketingAdsAssetUploadPlan,
} from '../schema/ads-asset.js';
import type { MarketingAdsPlanProvider } from '../schema/ads-plan.js';
import { ensurePathWithinCwd } from '../reports/paths.js';
import type { FetchLike } from '../providers/api-pull-types.js';

export const MARKETING_ADS_ASSET_REGISTRY_PATH = path.join(
  'docs',
  'marketing',
  'ads',
  'assets',
  'registry.json',
);
export const MARKETING_ADS_ASSET_PLAN_ROOT = path.join(
  'docs',
  'marketing',
  'ads',
  'assets',
  'plans',
);
export const MARKETING_ADS_ASSET_PRIVATE_ROOT = path.join('.unisane', 'marketing', 'assets');
export const MARKETING_ADS_ASSET_SOURCE_ROOT = path.join(
  MARKETING_ADS_ASSET_PRIVATE_ROOT,
  'source',
);
export const MARKETING_ADS_ASSET_PROVIDER_REFS_ROOT = path.join(
  MARKETING_ADS_ASSET_PRIVATE_ROOT,
  'provider-refs',
);
export const MARKETING_ADS_ASSET_RECEIPTS_ROOT = path.join(
  MARKETING_ADS_ASSET_PRIVATE_ROOT,
  'receipts',
);

export type MarketingAdsAssetCheckStatus = 'pass' | 'warn' | 'error';

export type MarketingAdsAssetCheck = {
  id: string;
  status: MarketingAdsAssetCheckStatus;
  message: string;
  assetId?: string;
  path?: string;
};

export type MarketingAdsAssetImportOptions = {
  cwd?: string;
  assetId: string;
  filePath: string;
  assetType: MarketingAdsAssetType;
  owner: string;
  name?: string;
  providers: MarketingAdsPlanProvider[];
  placements?: string[];
  strategyObjectIds?: string[];
  license?: string;
  sourceNotes?: string;
  now?: Date;
};

export type MarketingAdsAssetImportResult = {
  ok: boolean;
  registryPath: string;
  sourcePath: string;
  asset: MarketingAdsAsset;
};

export type MarketingAdsAssetReport = {
  ok: boolean;
  cwd: string;
  registryPath: string;
  registry: MarketingAdsAssetRegistry;
  checks: MarketingAdsAssetCheck[];
  nextWorkflowStep: string;
};

export type MarketingAdsAssetUploadPlanOptions = {
  cwd?: string;
  provider?: MarketingAdsPlanProvider | 'all';
  assetIds?: string[];
  out?: string;
  dryRun?: boolean;
  now?: Date;
};

export type MarketingAdsAssetUploadPlanResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  plan: MarketingAdsAssetUploadPlan;
};

export type MarketingAdsAssetCreativePlanOptions = {
  cwd?: string;
  provider?: MarketingAdsPlanProvider | 'all';
  assetIds?: string[];
  placements?: string[];
  out?: string;
  dryRun?: boolean;
  now?: Date;
};

export type MarketingAdsAssetCreativePlanResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  plan: MarketingAdsAssetCreativePlan;
};

export type MarketingAdsAssetUpdateOptions = {
  cwd?: string;
  assetId: string;
  approvalRef?: string;
  policyNotes?: string;
  now?: Date;
};

export type MarketingAdsAssetUploadOptions = {
  cwd?: string;
  planPath: string;
  dryRun?: boolean;
  yes?: boolean;
  receiptPath?: string;
  approvalRef?: string;
  accountConfirm?: string;
  productionConfirm?: string;
  operationConfirm?: string;
  liveExecutorMode?: 'disabled' | 'api';
  out?: string;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  now?: Date;
  apiVersion?: string;
  providerUploaders?: MarketingAdsAssetProviderUploaders;
  providerCredentials?: Partial<
    Record<
      MarketingAdsPlanProvider,
      {
        accessToken?: string;
        developerToken?: string;
        accountId?: string;
        loginCustomerId?: string;
        pageId?: string;
        instagramActorId?: string;
        pixelId?: string;
        datasetId?: string;
      }
    >
  >;
};

export type MarketingAdsAssetProviderUploadOperation =
  MarketingAdsAssetUploadPlan['operations'][number];

export type MarketingAdsAssetProviderUploadSource = {
  fileName: string;
  mimeType?: string;
  bytes: Uint8Array;
};

export type MarketingAdsAssetProviderUploadOptions = {
  config: MarketingExecutionContext;
  operation: MarketingAdsAssetProviderUploadOperation;
  source: MarketingAdsAssetProviderUploadSource;
  env: Record<string, string | undefined>;
  credentials?: NonNullable<
    MarketingAdsAssetUploadOptions['providerCredentials']
  >[MarketingAdsPlanProvider];
  fetch: FetchLike;
  apiVersion?: string;
};

export type MarketingAdsAssetProviderUploadResult = {
  providerAssetId: string;
  message: string;
};

export type MarketingAdsAssetProviderUploader = (
  options: MarketingAdsAssetProviderUploadOptions,
) => Promise<MarketingAdsAssetProviderUploadResult>;

export type MarketingAdsAssetProviderUploaders = Partial<
  Record<MarketingAdsPlanProvider, MarketingAdsAssetProviderUploader>
>;

export type MarketingAdsAssetUploadResult =
  | {
      ok: boolean;
      dryRun: true;
      path?: string;
      receipt: MarketingAdsAssetUploadReceipt;
    }
  | {
      ok: boolean;
      dryRun: false;
      path?: string;
      receipt: MarketingAdsAssetLiveUploadReceipt;
    };

export type MarketingGoogleAdsCampaignAssetLinkOperation = {
  assetId: string;
  providerAssetId: string;
  campaignResourceName: string;
  fieldType: 'MARKETING_IMAGE' | 'AD_IMAGE';
  status: 'previewed' | 'sent' | 'failed';
  liveMutationSent: boolean;
  providerResourceName?: string;
  message: string;
};

export type MarketingGoogleAdsCampaignAssetLinkResult = {
  ok: boolean;
  dryRun: boolean;
  path?: string;
  receipt: {
    kind: 'unisane.marketing.ads.google-ads-campaign-asset-link-receipt';
    version: 1;
    generatedAt: string;
    status: 'previewed' | 'executed' | 'failed';
    dryRun: boolean;
    platformId: string;
    appId: string;
    environment: string;
    customerId: string;
    loginCustomerId?: string;
    campaignResourceName: string;
    fieldType: 'MARKETING_IMAGE' | 'AD_IMAGE';
    operationResults: MarketingGoogleAdsCampaignAssetLinkOperation[];
  };
};

export type MarketingGoogleAdsCampaignAssetLinkOptions = {
  cwd?: string;
  campaignResourceName: string;
  assetIds: string[];
  fieldType?: 'MARKETING_IMAGE' | 'AD_IMAGE';
  yes?: boolean;
  out?: string;
  env?: Record<string, string | undefined>;
  credentials?: {
    accessToken?: string;
    developerToken?: string;
    accountId?: string;
    loginCustomerId?: string;
  };
  fetch?: FetchLike;
  now?: Date;
  apiVersion?: string;
};

const extensionMimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.zip': 'application/zip',
  '.html': 'text/html',
};

function timestampForPath(date: Date): string {
  return date.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

function writeJsonFile(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function dimensionsFromPng(buffer: Buffer): { width: number; height: number } | undefined {
  if (buffer.length < 24) return undefined;
  if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return undefined;
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function dimensionsFromJpeg(buffer: Buffer): { width: number; height: number } | undefined {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return undefined;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) return undefined;
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf
    ) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return undefined;
}

function imageDimensions(filePath: string): { width: number; height: number } | undefined {
  const buffer = readFileSync(filePath);
  return dimensionsFromPng(buffer) ?? dimensionsFromJpeg(buffer);
}

function resolveRegistryPath(cwd: string): string {
  const resolved = path.resolve(cwd, MARKETING_ADS_ASSET_REGISTRY_PATH);
  ensurePathWithinCwd(cwd, resolved);
  return resolved;
}

function emptyRegistry(config: MarketingExecutionContext, now: Date): MarketingAdsAssetRegistry {
  return {
    version: 1,
    platformId: config.platformId,
    appId: config.appId,
    updatedAt: now.toISOString(),
    assets: [],
  };
}

export function readMarketingAdsAssetRegistry(
  config: MarketingExecutionContext,
  options: { cwd?: string; now?: Date } = {},
): { path: string; registry: MarketingAdsAssetRegistry } {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const registryPath = resolveRegistryPath(cwd);
  if (!existsSync(registryPath)) {
    return { path: registryPath, registry: emptyRegistry(config, options.now ?? new Date()) };
  }
  return {
    path: registryPath,
    registry: marketingAdsAssetRegistrySchema.parse(readJsonFile(registryPath)),
  };
}

function sourceDestination(args: { cwd: string; assetId: string; filePath: string }): {
  absolutePath: string;
  relativePath: string;
} {
  const basename = path.basename(args.filePath);
  const absolutePath = path.resolve(
    args.cwd,
    MARKETING_ADS_ASSET_SOURCE_ROOT,
    args.assetId,
    basename,
  );
  ensurePathWithinCwd(args.cwd, absolutePath);
  return {
    absolutePath,
    relativePath: path.relative(args.cwd, absolutePath),
  };
}

export function importMarketingAdsAsset(
  config: MarketingExecutionContext,
  options: MarketingAdsAssetImportOptions,
): MarketingAdsAssetImportResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const inputPath = path.resolve(cwd, options.filePath);
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    throw new Error(`[ADS_ASSET_FILE_NOT_FOUND] Asset source file was not found: ${inputPath}`);
  }
  const destination = sourceDestination({
    cwd,
    assetId: options.assetId,
    filePath: inputPath,
  });
  mkdirSync(path.dirname(destination.absolutePath), { recursive: true });
  copyFileSync(inputPath, destination.absolutePath);

  const stat = statSync(destination.absolutePath);
  const extension = path.extname(destination.absolutePath).toLowerCase();
  const dimensions =
    options.assetType === 'image' || options.assetType === 'logo'
      ? imageDimensions(destination.absolutePath)
      : undefined;
  const asset = marketingAdsAssetSchema.parse({
    id: options.assetId,
    name: options.name ?? path.basename(inputPath, path.extname(inputPath)),
    assetType: options.assetType,
    lifecycleStatus: 'draft',
    owner: options.owner,
    allowedProviders: options.providers,
    allowedPlacements: options.placements ?? [],
    strategyObjectIds: options.strategyObjectIds ?? [],
    license: options.license,
    sourceNotes: options.sourceNotes,
    sourceFile: {
      localPath: destination.relativePath,
      sha256: sha256File(destination.absolutePath),
      sizeBytes: stat.size,
      extension: extension.replace(/^\./, ''),
      mimeType: extensionMimeTypes[extension],
      width: dimensions?.width,
      height: dimensions?.height,
    },
  });
  const current = readMarketingAdsAssetRegistry(config, { cwd, now });
  const assets = current.registry.assets.filter((entry) => entry.id !== asset.id);
  const registry = marketingAdsAssetRegistrySchema.parse({
    ...current.registry,
    platformId: config.platformId,
    appId: config.appId,
    updatedAt: now.toISOString(),
    assets: [...assets, asset].sort((left, right) => left.id.localeCompare(right.id)),
  });
  writeJsonFile(current.path, registry);
  return {
    ok: true,
    registryPath: current.path,
    sourcePath: destination.absolutePath,
    asset,
  };
}

function updateMarketingAdsAsset(
  config: MarketingExecutionContext,
  options: MarketingAdsAssetUpdateOptions & {
    lifecycleStatus: MarketingAdsAsset['lifecycleStatus'];
  },
): MarketingAdsAssetImportResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const current = readMarketingAdsAssetRegistry(config, { cwd, now });
  const existing = current.registry.assets.find((asset) => asset.id === options.assetId);
  if (!existing) {
    throw new Error(`[ADS_ASSET_NOT_FOUND] Asset was not found: ${options.assetId}`);
  }
  const updated = marketingAdsAssetSchema.parse({
    ...existing,
    lifecycleStatus: options.lifecycleStatus,
    approvalRef: options.approvalRef ?? existing.approvalRef,
    policyNotes: options.policyNotes ?? existing.policyNotes,
  });
  const registry = marketingAdsAssetRegistrySchema.parse({
    ...current.registry,
    updatedAt: now.toISOString(),
    assets: current.registry.assets
      .map((asset) => (asset.id === updated.id ? updated : asset))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
  writeJsonFile(current.path, registry);
  return {
    ok: true,
    registryPath: current.path,
    sourcePath: updated.sourceFile ? path.resolve(cwd, updated.sourceFile.localPath) : current.path,
    asset: updated,
  };
}

export function approveMarketingAdsAsset(
  config: MarketingExecutionContext,
  options: MarketingAdsAssetUpdateOptions,
): MarketingAdsAssetImportResult {
  if (!options.approvalRef) {
    throw new Error('[ADS_ASSET_APPROVAL_REF_REQUIRED] Pass --approval-ref for asset approval.');
  }
  return updateMarketingAdsAsset(config, { ...options, lifecycleStatus: 'approved' });
}

export function archiveMarketingAdsAsset(
  config: MarketingExecutionContext,
  options: MarketingAdsAssetUpdateOptions,
): MarketingAdsAssetImportResult {
  return updateMarketingAdsAsset(config, { ...options, lifecycleStatus: 'archived' });
}

function validateAssetFile(cwd: string, asset: MarketingAdsAsset): MarketingAdsAssetCheck[] {
  const checks: MarketingAdsAssetCheck[] = [];
  const source = asset.sourceFile;
  if (!source) {
    return [
      {
        id: `assets.${asset.id}.sourceFile`,
        status:
          asset.assetType === 'text' || asset.assetType === 'landing_page_variant'
            ? 'warn'
            : 'error',
        message: `${asset.id} has no source file metadata.`,
        assetId: asset.id,
      },
    ];
  }
  if (path.isAbsolute(source.localPath)) {
    checks.push({
      id: `assets.${asset.id}.sourceFile.path`,
      status: 'error',
      message: `${asset.id} source file path must be relative, not absolute.`,
      assetId: asset.id,
    });
  }
  const absolutePath = path.resolve(cwd, source.localPath);
  ensurePathWithinCwd(cwd, absolutePath);
  if (!existsSync(absolutePath)) {
    checks.push({
      id: `assets.${asset.id}.sourceFile.exists`,
      status: 'error',
      message: `${asset.id} source file is missing from the private asset store.`,
      assetId: asset.id,
      path: absolutePath,
    });
    return checks;
  }
  const actualHash = sha256File(absolutePath);
  checks.push({
    id: `assets.${asset.id}.sourceFile.sha256`,
    status: actualHash === source.sha256 ? 'pass' : 'error',
    message:
      actualHash === source.sha256
        ? `${asset.id} source hash matches registry metadata.`
        : `${asset.id} source hash changed; re-import or update registry intentionally.`,
    assetId: asset.id,
    path: absolutePath,
  });
  const actualSize = statSync(absolutePath).size;
  checks.push({
    id: `assets.${asset.id}.sourceFile.size`,
    status: actualSize === source.sizeBytes ? 'pass' : 'error',
    message:
      actualSize === source.sizeBytes
        ? `${asset.id} source size matches registry metadata.`
        : `${asset.id} source size changed; re-import or update registry intentionally.`,
    assetId: asset.id,
    path: absolutePath,
  });
  return checks;
}

function validateAssetMetadata(asset: MarketingAdsAsset): MarketingAdsAssetCheck[] {
  const checks: MarketingAdsAssetCheck[] = [
    {
      id: `assets.${asset.id}.providers`,
      status: asset.allowedProviders.length > 0 ? 'pass' : 'error',
      message:
        asset.allowedProviders.length > 0
          ? `${asset.id} has allowed provider metadata.`
          : `${asset.id} must declare at least one allowed provider.`,
      assetId: asset.id,
    },
    {
      id: `assets.${asset.id}.approval`,
      status:
        asset.lifecycleStatus === 'rejected'
          ? 'error'
          : asset.lifecycleStatus === 'approved' ||
              asset.lifecycleStatus === 'uploaded' ||
              asset.lifecycleStatus === 'attached'
            ? 'pass'
            : 'warn',
      message:
        asset.lifecycleStatus === 'rejected'
          ? `${asset.id} is rejected and must not be uploaded.`
          : asset.lifecycleStatus === 'approved' ||
              asset.lifecycleStatus === 'uploaded' ||
              asset.lifecycleStatus === 'attached'
            ? `${asset.id} is approved for provider workflow.`
            : `${asset.id} is ${asset.lifecycleStatus}; approval is required before live upload.`,
      assetId: asset.id,
    },
  ];
  if ((asset.assetType === 'image' || asset.assetType === 'logo') && asset.sourceFile) {
    checks.push({
      id: `assets.${asset.id}.dimensions`,
      status: asset.sourceFile.width && asset.sourceFile.height ? 'pass' : 'warn',
      message:
        asset.sourceFile.width && asset.sourceFile.height
          ? `${asset.id} has image dimensions.`
          : `${asset.id} should record image dimensions before provider upload.`,
      assetId: asset.id,
    });
  }
  if (asset.assetType === 'video' && asset.sourceFile) {
    checks.push({
      id: `assets.${asset.id}.duration`,
      status: asset.sourceFile.durationSeconds ? 'pass' : 'warn',
      message: asset.sourceFile.durationSeconds
        ? `${asset.id} has video duration metadata.`
        : `${asset.id} should record duration before provider upload.`,
      assetId: asset.id,
    });
  }
  return checks;
}

function resolveNextWorkflowStep(
  report: Omit<MarketingAdsAssetReport, 'nextWorkflowStep'>,
): string {
  if (report.checks.some((check) => check.status === 'error')) {
    return 'Fix asset registry errors before upload planning.';
  }
  if (report.registry.assets.length === 0) {
    return 'Import first media with `unisane-ops growth ads assets import --file <path> --asset-id <id> --type image --provider metaAds --owner <owner>`.';
  }
  if (report.checks.some((check) => check.status === 'warn')) {
    return 'Complete asset metadata and approvals, then rerun `unisane-ops growth ads assets validate`.';
  }
  return 'Generate a non-mutating upload plan with `unisane-ops growth ads assets upload-plan`.';
}

export function buildMarketingAdsAssetReport(
  config: MarketingExecutionContext,
  options: { cwd?: string; now?: Date } = {},
): MarketingAdsAssetReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const current = readMarketingAdsAssetRegistry(config, { cwd, now: options.now });
  const checks: MarketingAdsAssetCheck[] = [
    {
      id: 'registry.path',
      status: existsSync(current.path) ? 'pass' : 'warn',
      message: existsSync(current.path)
        ? `Asset registry exists at ${current.path}.`
        : `Asset registry does not exist yet at ${current.path}.`,
      path: current.path,
    },
    {
      id: 'privateRoot.gitignored',
      status: 'pass',
      message: '`**/.unisane/` is gitignored; raw assets and provider refs stay private.',
    },
  ];
  const seen = new Set<string>();
  const hashOwners = new Map<string, string[]>();
  for (const asset of current.registry.assets) {
    checks.push({
      id: `assets.${asset.id}.unique`,
      status: seen.has(asset.id) ? 'error' : 'pass',
      message: seen.has(asset.id)
        ? `Duplicate asset id found: ${asset.id}.`
        : `${asset.id} is unique.`,
      assetId: asset.id,
    });
    seen.add(asset.id);
    if (asset.sourceFile?.sha256) {
      hashOwners.set(asset.sourceFile.sha256, [
        ...(hashOwners.get(asset.sourceFile.sha256) ?? []),
        asset.id,
      ]);
    }
    checks.push(...validateAssetMetadata(asset), ...validateAssetFile(cwd, asset));
  }
  for (const [hash, assetIds] of hashOwners) {
    if (assetIds.length <= 1) continue;
    for (const assetId of assetIds) {
      checks.push({
        id: `assets.${assetId}.duplicateHash`,
        status: 'warn',
        message: `${assetId} shares source hash ${hash} with ${assetIds
          .filter((entry) => entry !== assetId)
          .join(', ')}.`,
        assetId,
      });
    }
  }
  const reportWithoutNext = {
    ok: checks.every((check) => check.status !== 'error'),
    cwd,
    registryPath: current.path,
    registry: current.registry,
    checks,
  };
  return {
    ...reportWithoutNext,
    nextWorkflowStep: resolveNextWorkflowStep(reportWithoutNext),
  };
}

function providersFor(provider: MarketingAdsPlanProvider | 'all'): MarketingAdsPlanProvider[] {
  return provider === 'all' ? ['googleAds', 'metaAds'] : [provider];
}

export function writeMarketingAdsAssetUploadPlan(
  config: MarketingExecutionContext,
  options: MarketingAdsAssetUploadPlanOptions = {},
): MarketingAdsAssetUploadPlanResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const provider = options.provider ?? 'all';
  const allowedProviders = providersFor(provider);
  const report = buildMarketingAdsAssetReport(config, { cwd, now });
  const selectedAssetIds = new Set(options.assetIds ?? []);
  const eligibleAssets = report.registry.assets.filter((asset) => {
    if (selectedAssetIds.size > 0 && !selectedAssetIds.has(asset.id)) return false;
    return asset.allowedProviders.some((entry) => allowedProviders.includes(entry));
  });
  const assetHasBlockingCheck = (assetId: string): boolean =>
    report.checks.some((check) => check.assetId === assetId && check.status !== 'pass');
  const operations = eligibleAssets.flatMap((asset) => {
    if (!asset.sourceFile) return [];
    if (asset.lifecycleStatus !== 'approved') return [];
    if (assetHasBlockingCheck(asset.id)) return [];
    return asset.allowedProviders
      .filter((entry) => allowedProviders.includes(entry))
      .map((entry) => ({
        id: `upload:${entry}:${asset.id}`,
        assetId: asset.id,
        provider: entry,
        assetType: asset.assetType,
        sourceSha256: asset.sourceFile?.sha256 ?? '',
        sourceLocalPath: asset.sourceFile?.localPath ?? '',
        requiresApproval: true,
        mutation: 'upload_asset' as const,
      }));
  });
  const checks: MarketingAdsAssetUploadPlan['checks'] = [
    ...report.checks.map((check) => ({
      id: check.id,
      status: check.status,
      message: check.message,
      assetId: check.assetId,
    })),
    {
      id: 'uploadPlan.operations',
      status: operations.length > 0 ? 'pass' : 'warn',
      message:
        operations.length > 0
          ? `Prepared ${operations.length} non-mutating asset upload operation(s).`
          : 'No approved assets are ready for upload planning.',
    },
  ];
  const plan = marketingAdsAssetUploadPlanSchema.parse({
    kind: 'unisane.marketing.ads.asset-upload-plan',
    version: 1,
    platformId: config.platformId,
    appId: config.appId,
    generatedAt: now.toISOString(),
    nonMutating: true,
    provider,
    registryPath: path.relative(cwd, report.registryPath),
    operations,
    checks,
  });
  const ok = checks.every((check) => check.status !== 'error');
  if (options.dryRun) return { ok, dryRun: true, plan };
  const outputPath = path.resolve(
    cwd,
    options.out ?? path.join(MARKETING_ADS_ASSET_PLAN_ROOT, `${timestampForPath(now)}.json`),
  );
  ensurePathWithinCwd(cwd, outputPath);
  writeJsonFile(outputPath, plan);
  return { ok, dryRun: false, path: outputPath, plan };
}

function readProviderRef(args: {
  cwd: string;
  environment: string;
  provider: MarketingAdsPlanProvider;
  assetId: string;
}): {
  path: string;
  providerAssetId?: string;
  sourceSha256?: string;
} {
  const refPath = providerRefPath(args);
  if (!existsSync(refPath)) return { path: refPath };
  const value = readJsonFile(refPath);
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    path: refPath,
    providerAssetId:
      typeof record.providerAssetId === 'string' && record.providerAssetId.trim()
        ? record.providerAssetId
        : undefined,
    sourceSha256:
      typeof record.sourceSha256 === 'string' && /^[a-f0-9]{64}$/.test(record.sourceSha256)
        ? record.sourceSha256
        : undefined,
  };
}

function creativeMutationForAsset(args: {
  provider: MarketingAdsPlanProvider;
  assetType: MarketingAdsAssetType;
}): MarketingAdsAssetCreativePlan['operations'][number]['mutation'] | undefined {
  if (args.provider === 'googleAds') {
    return args.assetType === 'image' || args.assetType === 'logo'
      ? 'create_google_asset_creative'
      : undefined;
  }
  if (args.provider === 'metaAds' && (args.assetType === 'image' || args.assetType === 'logo')) {
    return 'create_meta_image_creative';
  }
  if (args.provider === 'metaAds' && args.assetType === 'video') {
    return 'create_meta_video_creative';
  }
  return undefined;
}

const defaultMetaPlacements: MarketingMetaAdsPlacement[] = ['facebook_feed', 'instagram_feed'];

function isMetaPlacement(value: string): value is MarketingMetaAdsPlacement {
  return marketingMetaAdsPlacementSchema.safeParse(value).success;
}

function placementLabel(placement: MarketingMetaAdsPlacement): string {
  return placement.replaceAll('_', ' ');
}

function placementsForAsset(args: { asset: MarketingAdsAsset; optionPlacements?: string[] }): {
  placements: MarketingMetaAdsPlacement[];
  checks: MarketingAdsAssetCreativePlan['checks'];
} {
  const checks: MarketingAdsAssetCreativePlan['checks'] = [];
  const rawPlacements =
    args.optionPlacements && args.optionPlacements.length > 0
      ? args.optionPlacements
      : args.asset.allowedPlacements;
  const parsed = rawPlacements.filter(isMetaPlacement);
  for (const placement of rawPlacements) {
    if (!isMetaPlacement(placement)) {
      checks.push({
        id: `creativePlan.${args.asset.id}.placements.${placement}`,
        status: 'warn',
        message: `${args.asset.id} declares unsupported Meta placement ${placement}.`,
        assetId: args.asset.id,
      });
    }
  }
  return {
    placements: parsed.length > 0 ? [...new Set(parsed)] : defaultMetaPlacements,
    checks,
  };
}

function metaPlacementTargeting(
  placements: MarketingMetaAdsPlacement[],
): MarketingMetaAdsPlacementTargeting {
  const publisherPlatforms = new Set<'facebook' | 'instagram'>();
  const facebookPositions = new Set<'feed' | 'story' | 'facebook_reels'>();
  const instagramPositions = new Set<'stream' | 'story' | 'reels'>();
  for (const placement of placements) {
    if (placement === 'facebook_feed') {
      publisherPlatforms.add('facebook');
      facebookPositions.add('feed');
    }
    if (placement === 'instagram_feed') {
      publisherPlatforms.add('instagram');
      instagramPositions.add('stream');
    }
    if (placement === 'facebook_stories') {
      publisherPlatforms.add('facebook');
      facebookPositions.add('story');
    }
    if (placement === 'instagram_stories') {
      publisherPlatforms.add('instagram');
      instagramPositions.add('story');
    }
    if (placement === 'facebook_reels') {
      publisherPlatforms.add('facebook');
      facebookPositions.add('facebook_reels');
    }
    if (placement === 'instagram_reels') {
      publisherPlatforms.add('instagram');
      instagramPositions.add('reels');
    }
  }
  return {
    publisherPlatforms: [...publisherPlatforms],
    facebookPositions: [...facebookPositions],
    instagramPositions: [...instagramPositions],
  };
}

function placementRequiresVertical(placement: MarketingMetaAdsPlacement): boolean {
  return placement.endsWith('_stories') || placement.endsWith('_reels');
}

function placementValidationChecks(args: {
  config: MarketingExecutionContext;
  asset: MarketingAdsAsset;
  placements: MarketingMetaAdsPlacement[];
}): MarketingAdsAssetCreativePlan['checks'] {
  const checks: MarketingAdsAssetCreativePlan['checks'] = [];
  const source = args.asset.sourceFile;
  const hasInstagram = args.placements.some((placement) => placement.startsWith('instagram_'));
  if (hasInstagram && !args.config.providers.metaAds.instagramActorIdEnv) {
    checks.push({
      id: `creativePlan.${args.asset.id}.meta.instagramActor`,
      status: 'error',
      message: `${args.asset.id} targets Instagram placements but metaAds.instagramActorIdEnv is not configured.`,
      assetId: args.asset.id,
    });
  }
  if (!args.config.providers.metaAds.pageIdEnv) {
    checks.push({
      id: `creativePlan.${args.asset.id}.meta.page`,
      status: 'error',
      message: `${args.asset.id} needs metaAds.pageIdEnv so object_story_spec can be created safely.`,
      assetId: args.asset.id,
    });
  }
  if (!source) return checks;
  const verticalPlacements = args.placements.filter(placementRequiresVertical);
  const feedPlacements = args.placements.filter(
    (placement) => !placementRequiresVertical(placement),
  );
  if (args.asset.assetType === 'image' || args.asset.assetType === 'logo') {
    if (!source.width || !source.height) {
      checks.push({
        id: `creativePlan.${args.asset.id}.placementDimensions`,
        status: 'error',
        message: `${args.asset.id} needs image dimensions before placement-aware Meta creative planning.`,
        assetId: args.asset.id,
      });
      return checks;
    }
    const ratio = source.width / source.height;
    if (feedPlacements.length > 0) {
      checks.push({
        id: `creativePlan.${args.asset.id}.feedRatio`,
        status: ratio >= 0.8 && ratio <= 1.92 ? 'pass' : 'error',
        message:
          ratio >= 0.8 && ratio <= 1.92
            ? `${args.asset.id} fits feed placement ratio requirements.`
            : `${args.asset.id} ratio ${ratio.toFixed(2)} does not fit feed placements: ${feedPlacements.map(placementLabel).join(', ')}.`,
        assetId: args.asset.id,
      });
    }
    if (verticalPlacements.length > 0) {
      checks.push({
        id: `creativePlan.${args.asset.id}.verticalRatio`,
        status: ratio >= 0.5 && ratio <= 0.75 ? 'pass' : 'error',
        message:
          ratio >= 0.5 && ratio <= 0.75
            ? `${args.asset.id} fits vertical Stories/Reels placement ratio requirements.`
            : `${args.asset.id} ratio ${ratio.toFixed(2)} does not fit vertical placements: ${verticalPlacements.map(placementLabel).join(', ')}.`,
        assetId: args.asset.id,
      });
    }
  }
  if (args.asset.assetType === 'video') {
    if (!source.durationSeconds) {
      checks.push({
        id: `creativePlan.${args.asset.id}.videoDuration`,
        status: 'error',
        message: `${args.asset.id} needs video duration before Meta placement planning.`,
        assetId: args.asset.id,
      });
      return checks;
    }
    if (verticalPlacements.length > 0 && source.durationSeconds > 90) {
      checks.push({
        id: `creativePlan.${args.asset.id}.verticalVideoDuration`,
        status: 'error',
        message: `${args.asset.id} duration ${source.durationSeconds}s is too long for first-class Stories/Reels planning.`,
        assetId: args.asset.id,
      });
    } else {
      checks.push({
        id: `creativePlan.${args.asset.id}.videoDuration`,
        status: 'pass',
        message: `${args.asset.id} has duration metadata for Meta placement planning.`,
        assetId: args.asset.id,
      });
    }
  }
  return checks;
}

export function writeMarketingAdsAssetCreativePlan(
  config: MarketingExecutionContext,
  options: MarketingAdsAssetCreativePlanOptions = {},
): MarketingAdsAssetCreativePlanResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const provider = options.provider ?? 'all';
  const allowedProviders = providersFor(provider);
  const current = readMarketingAdsAssetRegistry(config, { cwd, now });
  const selectedAssetIds = new Set(options.assetIds ?? []);
  const checks: MarketingAdsAssetCreativePlan['checks'] = [];
  const operations: MarketingAdsAssetCreativePlan['operations'] = [];
  const assets = current.registry.assets.filter((asset) => {
    if (selectedAssetIds.size > 0 && !selectedAssetIds.has(asset.id)) return false;
    return asset.allowedProviders.some((entry) => allowedProviders.includes(entry));
  });
  for (const asset of assets) {
    if (!asset.sourceFile) {
      checks.push({
        id: `creativePlan.${asset.id}.sourceFile`,
        status: 'error',
        message: `${asset.id} cannot become a creative without source metadata.`,
        assetId: asset.id,
      });
      continue;
    }
    for (const assetProvider of asset.allowedProviders.filter((entry) =>
      allowedProviders.includes(entry),
    )) {
      const mutation = creativeMutationForAsset({
        provider: assetProvider,
        assetType: asset.assetType,
      });
      if (!mutation) {
        checks.push({
          id: `creativePlan.${asset.id}.${assetProvider}.type`,
          status: 'warn',
          message: `${assetProvider} creative creation is not supported yet for ${asset.assetType} assets.`,
          assetId: asset.id,
        });
        continue;
      }
      const providerRef = readProviderRef({
        cwd,
        environment: config.defaultEnvironment,
        provider: assetProvider,
        assetId: asset.id,
      });
      if (!providerRef.providerAssetId) {
        checks.push({
          id: `creativePlan.${asset.id}.${assetProvider}.providerRef`,
          status: 'warn',
          message: `${asset.id} has no uploaded ${assetProvider} provider ref yet.`,
          assetId: asset.id,
        });
        continue;
      }
      if (providerRef.sourceSha256 && providerRef.sourceSha256 !== asset.sourceFile.sha256) {
        checks.push({
          id: `creativePlan.${asset.id}.${assetProvider}.sourceSha256`,
          status: 'error',
          message: `${asset.id} ${assetProvider} provider ref does not match current source hash.`,
          assetId: asset.id,
        });
        continue;
      }
      const placementResult =
        assetProvider === 'metaAds'
          ? placementsForAsset({ asset, optionPlacements: options.placements })
          : { placements: [] as MarketingMetaAdsPlacement[], checks: [] };
      checks.push(...placementResult.checks);
      const validationChecks =
        assetProvider === 'metaAds'
          ? placementValidationChecks({
              config,
              asset,
              placements: placementResult.placements,
            })
          : [];
      checks.push(...validationChecks);
      if (validationChecks.some((check) => check.status === 'error')) continue;
      checks.push({
        id: `creativePlan.${asset.id}.${assetProvider}.providerRef`,
        status: 'pass',
        message: `${asset.id} has an uploaded ${assetProvider} provider ref.`,
        assetId: asset.id,
      });
      operations.push({
        id: `creative:${assetProvider}:${asset.id}`,
        assetId: asset.id,
        provider: assetProvider,
        assetType: asset.assetType,
        providerAssetId: providerRef.providerAssetId,
        sourceSha256: asset.sourceFile.sha256,
        providerRefPath: path.relative(cwd, providerRef.path),
        destinationUrl: asset.landingPageUrls[0],
        placements: placementResult.placements,
        placementTargeting:
          assetProvider === 'metaAds'
            ? metaPlacementTargeting(placementResult.placements)
            : undefined,
        mutation,
        requiresApproval: true,
      });
    }
  }
  checks.push({
    id: 'creativePlan.operations',
    status: operations.length > 0 ? 'pass' : 'warn',
    message:
      operations.length > 0
        ? `Prepared ${operations.length} non-mutating creative operation(s) from uploaded provider refs.`
        : 'No uploaded provider refs are ready for creative planning.',
  });
  const plan = marketingAdsAssetCreativePlanSchema.parse({
    kind: 'unisane.marketing.ads.asset-creative-plan',
    version: 1,
    platformId: config.platformId,
    appId: config.appId,
    generatedAt: now.toISOString(),
    nonMutating: true,
    provider,
    registryPath: path.relative(cwd, current.path),
    operations,
    checks,
    nextWorkflowStep:
      operations.length > 0
        ? 'Review creative operations, attach required copy/destination policy context, then create a guarded creative apply receipt.'
        : 'Upload approved assets to providers, then rerun the creative plan.',
  });
  const ok = checks.every((check) => check.status !== 'error');
  if (options.dryRun) return { ok, dryRun: true, plan };
  const outputPath = path.resolve(
    cwd,
    options.out ??
      path.join(MARKETING_ADS_ASSET_PLAN_ROOT, `${timestampForPath(now)}-creative.json`),
  );
  ensurePathWithinCwd(cwd, outputPath);
  writeJsonFile(outputPath, plan);
  return { ok, dryRun: false, path: outputPath, plan };
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function readUploadPlan(
  cwd: string,
  planPath: string,
): { path: string; plan: MarketingAdsAssetUploadPlan } {
  const resolved = path.resolve(cwd, planPath);
  ensurePathWithinCwd(cwd, resolved);
  if (!existsSync(resolved)) {
    throw new Error(`[ADS_ASSET_UPLOAD_PLAN_NOT_FOUND] Upload plan was not found: ${resolved}`);
  }
  return {
    path: resolved,
    plan: marketingAdsAssetUploadPlanSchema.parse(readJsonFile(resolved)),
  };
}

function readUploadReceipt(
  cwd: string,
  receiptPath: string,
): { path: string; receipt: MarketingAdsAssetUploadReceipt } {
  const resolved = path.resolve(cwd, receiptPath);
  ensurePathWithinCwd(cwd, resolved);
  if (!existsSync(resolved)) {
    throw new Error(
      `[ADS_ASSET_UPLOAD_RECEIPT_NOT_FOUND] Upload receipt was not found: ${resolved}`,
    );
  }
  return {
    path: resolved,
    receipt: marketingAdsAssetUploadReceiptSchema.parse(readJsonFile(resolved)),
  };
}

function confirmationValues(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function uploadAccountConfirmation(args: {
  config: MarketingExecutionContext;
  provider: MarketingAdsPlanProvider;
  accountId?: string;
  provided: Set<string>;
}): MarketingAdsAssetUploadConfirmation {
  const accountRef = args.accountId ?? `${args.provider}.resource`;
  const expected = `${args.config.defaultEnvironment}:${args.provider}:${accountRef}:ads-assets-upload`;
  const confirmed = args.provided.has(expected);
  return {
    type: 'account',
    provider: args.provider,
    expected,
    provided: confirmed,
    status: confirmed ? 'confirmed' : 'missing',
  };
}

function uploadProductionConfirmation(args: {
  config: MarketingExecutionContext;
  provided: string | undefined;
}): MarketingAdsAssetUploadConfirmation | undefined {
  const environment = args.config.environments[args.config.defaultEnvironment];
  if (!environment?.production) return undefined;
  const expected = `${args.config.defaultEnvironment}:${args.config.platformId}:${args.config.appId}:ads-assets-upload`;
  const confirmed = args.provided === expected;
  return {
    type: 'production',
    expected,
    provided: confirmed,
    status: confirmed ? 'confirmed' : 'missing',
  };
}

function defaultAssetReceiptPath(cwd: string, generatedAt: string, live: boolean): string {
  return path.resolve(
    cwd,
    MARKETING_ADS_ASSET_RECEIPTS_ROOT,
    `${live ? 'asset-live-upload' : 'asset-upload'}-${timestampForPath(new Date(generatedAt))}.json`,
  );
}

function operationConfirmation(args: {
  environment: string;
  operationId: string;
  approvalRef: string;
}): string {
  return `live-assets:${args.environment}:${args.operationId}:${args.approvalRef}`;
}

function normalizeGoogleAdsCustomerId(value: string): string {
  return value.replaceAll('-', '').trim();
}

function googleAdsImageMimeType(asset: MarketingAdsAssetUploadPlan['operations'][number]): string {
  const extension = path.extname(asset.sourceLocalPath).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'IMAGE_JPEG';
  if (extension === '.png') return 'IMAGE_PNG';
  if (extension === '.gif') return 'IMAGE_GIF';
  throw new Error(
    '[ADS_ASSET_GOOGLE_IMAGE_TYPE_UNSUPPORTED] Google Ads image upload supports jpg, png, and gif image assets.',
  );
}

async function parseProviderResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function googleAdsAssetResourceName(value: unknown): string | undefined {
  const root = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const direct = root.resourceName;
  if (typeof direct === 'string') return direct;
  const rawResults = root.results;
  const results: readonly unknown[] = Array.isArray(rawResults) ? rawResults : [];
  const first = results[0];
  if (first && typeof first === 'object') {
    const resourceName = (first as Record<string, unknown>).resourceName;
    return typeof resourceName === 'string' ? resourceName : undefined;
  }
  return undefined;
}

function googleAdsResultResourceNames(value: unknown): string[] {
  const root = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const results = Array.isArray(root.results) ? root.results : [];
  return results
    .map((entry) =>
      entry && typeof entry === 'object'
        ? (entry as Record<string, unknown>).resourceName
        : undefined,
    )
    .filter((resourceName): resourceName is string => typeof resourceName === 'string');
}

function readGoogleAdsProviderAssetRef(args: {
  cwd: string;
  config: MarketingExecutionContext;
  assetId: string;
}): { providerAssetId: string; path: string } {
  const refPath = providerRefPath({
    cwd: args.cwd,
    environment: args.config.defaultEnvironment,
    provider: 'googleAds',
    assetId: args.assetId,
  });
  if (!existsSync(refPath)) {
    throw new Error(
      `[ADS_ASSET_GOOGLE_REF_MISSING] Google Ads provider ref is missing for asset ${args.assetId}. Upload the asset first.`,
    );
  }
  const value = JSON.parse(readFileSync(refPath, 'utf8')) as unknown;
  const root = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const providerAssetId = root.providerAssetId;
  if (typeof providerAssetId !== 'string' || !providerAssetId.trim()) {
    throw new Error(
      `[ADS_ASSET_GOOGLE_REF_INVALID] Google Ads provider ref has no providerAssetId for asset ${args.assetId}.`,
    );
  }
  return { providerAssetId, path: refPath };
}

function providerRefPath(args: {
  cwd: string;
  environment: string;
  provider: MarketingAdsPlanProvider;
  assetId: string;
}): string {
  const resolved = path.resolve(
    args.cwd,
    MARKETING_ADS_ASSET_PROVIDER_REFS_ROOT,
    args.environment,
    args.provider,
    `${args.assetId}.json`,
  );
  ensurePathWithinCwd(args.cwd, resolved);
  return resolved;
}

async function uploadGoogleImageAsset(args: {
  cwd: string;
  config: MarketingExecutionContext;
  operation: MarketingAdsAssetUploadPlan['operations'][number];
  env: Record<string, string | undefined>;
  credentials?: NonNullable<
    MarketingAdsAssetUploadOptions['providerCredentials']
  >[MarketingAdsPlanProvider];
  fetcher: FetchLike;
  apiVersion?: string;
  attemptedAt: string;
}): Promise<{ providerAssetId: string; providerRefPath: string; message: string }> {
  const accountId = args.credentials?.accountId;
  const developerToken = args.credentials?.developerToken;
  const accessToken = args.credentials?.accessToken;
  const loginCustomerId = args.credentials?.loginCustomerId;
  if (!accountId || !developerToken || !accessToken) {
    throw new Error(
      '[ADS_ASSET_GOOGLE_CONNECTION_INCOMPLETE] Google Ads image upload requires a selected customer, OAuth access, and approved developer access.',
    );
  }
  if (args.operation.assetType !== 'image' && args.operation.assetType !== 'logo') {
    throw new Error(
      '[ADS_ASSET_GOOGLE_TYPE_UNSUPPORTED] First Google Ads asset upload supports image/logo assets only.',
    );
  }
  const sourcePath = path.resolve(args.cwd, args.operation.sourceLocalPath);
  ensurePathWithinCwd(args.cwd, sourcePath);
  googleAdsImageMimeType(args.operation);
  const customerId = normalizeGoogleAdsCustomerId(accountId);
  const headers: Record<string, string> = {
    authorization: `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'content-type': 'application/json',
  };
  if (loginCustomerId) headers['login-customer-id'] = normalizeGoogleAdsCustomerId(loginCustomerId);
  const response = await args.fetcher(
    `https://googleads.googleapis.com/${args.apiVersion ?? 'v24'}/customers/${customerId}/assets:mutate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        operations: [
          {
            create: {
              name: args.operation.assetId,
              type: 'IMAGE',
              imageAsset: {
                data: readFileSync(sourcePath).toString('base64'),
              },
            },
          },
        ],
      }),
    },
  );
  const value = await parseProviderResponse(response);
  if (!response.ok) {
    throw new Error(
      `[ADS_ASSET_GOOGLE_UPLOAD_FAILED] Google Ads image upload failed: ${JSON.stringify(value)}`,
    );
  }
  const providerAssetId = googleAdsAssetResourceName(value);
  if (!providerAssetId) {
    throw new Error(
      '[ADS_ASSET_GOOGLE_UPLOAD_RESOURCE_MISSING] Google Ads image upload did not return an asset resource name.',
    );
  }
  const refPath = providerRefPath({
    cwd: args.cwd,
    environment: args.config.defaultEnvironment,
    provider: 'googleAds',
    assetId: args.operation.assetId,
  });
  writeJsonFile(refPath, {
    version: 1,
    platformId: args.config.platformId,
    appId: args.config.appId,
    environment: args.config.defaultEnvironment,
    provider: 'googleAds',
    assetId: args.operation.assetId,
    providerAssetId,
    sourceSha256: args.operation.sourceSha256,
    uploadedAt: args.attemptedAt,
    accountId,
  });
  return {
    providerAssetId,
    providerRefPath: refPath,
    message: 'Google Ads image asset upload sent.',
  };
}

function dryRunReceipt(args: {
  config: MarketingExecutionContext;
  planPath: string;
  plan: MarketingAdsAssetUploadPlan;
  planHash: string;
  confirmations: MarketingAdsAssetUploadConfirmation[];
  blockers: string[];
  generatedAt: string;
}): MarketingAdsAssetUploadReceipt {
  return marketingAdsAssetUploadReceiptSchema.parse({
    kind: 'unisane.marketing.ads.asset-upload-receipt',
    version: 1,
    generatedAt: args.generatedAt,
    status: args.blockers.length > 0 ? 'blocked' : 'previewed',
    dryRun: true,
    liveMutationAllowed: false,
    platformId: args.config.platformId,
    appId: args.config.appId,
    environment: args.config.defaultEnvironment,
    planPath: args.planPath,
    planHash: args.planHash,
    actor: { kind: 'devtools-cli', actorRef: 'redacted', secretValues: 'redacted' },
    confirmations: args.confirmations,
    blockers: args.blockers,
    operationResults: args.plan.operations.map((operation) => ({
      operationId: operation.id,
      assetId: operation.assetId,
      provider: operation.provider,
      assetType: operation.assetType,
      sourceSha256: operation.sourceSha256,
      attemptedAt: args.generatedAt,
      status: args.blockers.length > 0 ? 'blocked' : 'previewed',
      message:
        args.blockers.length > 0
          ? 'Asset upload preview blocked.'
          : 'Asset upload previewed; live upload requires separate approval.',
    })),
  });
}

function uploadBlockers(args: {
  plan: MarketingAdsAssetUploadPlan;
  confirmations: MarketingAdsAssetUploadConfirmation[];
}): string[] {
  const blockers = new Set<string>();
  if (args.plan.checks.some((check) => check.status === 'error')) blockers.add('plan_has_errors');
  if (args.plan.operations.length === 0) blockers.add('no_upload_operations');
  for (const confirmation of args.confirmations) {
    if (confirmation.status === 'missing') {
      blockers.add(
        confirmation.type === 'account'
          ? `missing_account_confirmation:${confirmation.provider}`
          : 'missing_production_confirmation',
      );
    }
  }
  return [...blockers].sort();
}

export async function writeMarketingAdsAssetUploadReceipt(
  config: MarketingExecutionContext,
  options: MarketingAdsAssetUploadOptions,
): Promise<MarketingAdsAssetUploadResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const generatedAt = now.toISOString();
  const loadedPlan = readUploadPlan(cwd, options.planPath);
  const planHash = hashJson(loadedPlan.plan);
  const accountConfirmations = loadedPlan.plan.operations.map((operation) =>
    uploadAccountConfirmation({
      config,
      provider: operation.provider,
      accountId: options.providerCredentials?.[operation.provider]?.accountId,
      provided: confirmationValues(options.accountConfirm),
    }),
  );
  const productionConfirmation = uploadProductionConfirmation({
    config,
    provided: options.productionConfirm,
  });
  const confirmations = [
    ...accountConfirmations,
    ...(productionConfirmation ? [productionConfirmation] : []),
  ];

  if (!options.yes) {
    const blockers = uploadBlockers({ plan: loadedPlan.plan, confirmations });
    const receipt = dryRunReceipt({
      config,
      planPath: path.relative(cwd, loadedPlan.path),
      plan: loadedPlan.plan,
      planHash,
      confirmations,
      blockers,
      generatedAt,
    });
    const outputPath = path.resolve(
      cwd,
      options.out ?? defaultAssetReceiptPath(cwd, generatedAt, false),
    );
    ensurePathWithinCwd(cwd, outputPath);
    if (!options.dryRun) writeJsonFile(outputPath, receipt);
    return {
      ok: receipt.status === 'previewed',
      dryRun: true,
      path: options.dryRun ? undefined : outputPath,
      receipt,
    };
  }

  if (!options.receiptPath) {
    throw new Error(
      '[ADS_ASSET_UPLOAD_RECEIPT_REQUIRED] Live asset upload requires --receipt <dry-run-receipt>.',
    );
  }
  const dryRun = readUploadReceipt(cwd, options.receiptPath);
  const operationConfirmations = confirmationValues(options.operationConfirm);
  const blockers = new Set<string>();
  if (dryRun.receipt.status !== 'previewed') blockers.add('dry_run_receipt_not_ready');
  if (dryRun.receipt.planHash !== planHash) blockers.add('plan_hash_mismatch');
  if (!options.approvalRef) blockers.add('approval_ref_required');
  if ((options.liveExecutorMode ?? 'disabled') !== 'api') blockers.add('live_executor_disabled');
  for (const confirmation of confirmations) {
    if (confirmation.status === 'missing') {
      blockers.add(
        confirmation.type === 'account'
          ? `missing_account_confirmation:${confirmation.provider}`
          : 'missing_production_confirmation',
      );
    }
  }
  for (const operation of loadedPlan.plan.operations) {
    if (
      options.approvalRef &&
      !operationConfirmations.has(
        operationConfirmation({
          environment: config.defaultEnvironment,
          operationId: operation.id,
          approvalRef: options.approvalRef,
        }),
      )
    ) {
      blockers.add(`missing_operation_confirmation:${operation.id}`);
    }
  }
  const env = options.env ?? process.env;
  const fetcher = options.fetch ?? fetch;
  const operationResults: MarketingAdsAssetLiveUploadReceipt['operationResults'] = [];
  for (const operation of loadedPlan.plan.operations) {
    if (blockers.size > 0) {
      operationResults.push({
        operationId: operation.id,
        assetId: operation.assetId,
        provider: operation.provider,
        assetType: operation.assetType,
        sourceSha256: operation.sourceSha256,
        attemptedAt: generatedAt,
        status: 'blocked',
        liveMutationSent: false,
        message: 'Asset upload blocked before provider mutation.',
      });
      continue;
    }
    try {
      const providerUploader = options.providerUploaders?.[operation.provider];
      let result: {
        providerAssetId: string;
        providerRefPath: string;
        message: string;
      };
      if (providerUploader) {
        const sourcePath = path.resolve(cwd, operation.sourceLocalPath);
        ensurePathWithinCwd(cwd, sourcePath);
        const uploaded = await providerUploader({
          config,
          operation,
          source: {
            fileName: path.basename(sourcePath),
            mimeType: extensionMimeTypes[path.extname(sourcePath).toLowerCase()],
            bytes: readFileSync(sourcePath),
          },
          env,
          credentials: options.providerCredentials?.[operation.provider],
          fetch: fetcher,
          apiVersion: options.apiVersion,
        });
        const refPath = providerRefPath({
          cwd,
          environment: config.defaultEnvironment,
          provider: operation.provider,
          assetId: operation.assetId,
        });
        writeJsonFile(refPath, {
          version: 1,
          platformId: config.platformId,
          appId: config.appId,
          environment: config.defaultEnvironment,
          provider: operation.provider,
          assetId: operation.assetId,
          providerAssetId: uploaded.providerAssetId,
          sourceSha256: operation.sourceSha256,
          uploadedAt: generatedAt,
          accountId: options.providerCredentials?.[operation.provider]?.accountId,
        });
        result = {
          ...uploaded,
          providerRefPath: refPath,
        };
      } else if (operation.provider === 'googleAds') {
        result = await uploadGoogleImageAsset({
          cwd,
          config,
          operation,
          env,
          credentials: options.providerCredentials?.googleAds,
          fetcher,
          apiVersion: options.apiVersion,
          attemptedAt: generatedAt,
        });
      } else {
        throw new Error(
          `[ADS_ASSET_PROVIDER_UPLOADER_MISSING] No asset uploader was injected for ${operation.provider}.`,
        );
      }
      operationResults.push({
        operationId: operation.id,
        assetId: operation.assetId,
        provider: operation.provider,
        assetType: operation.assetType,
        sourceSha256: operation.sourceSha256,
        attemptedAt: generatedAt,
        status: 'sent',
        liveMutationSent: true,
        providerAssetId: result.providerAssetId,
        providerRefPath: result.providerRefPath,
        message: result.message,
      });
    } catch (error) {
      operationResults.push({
        operationId: operation.id,
        assetId: operation.assetId,
        provider: operation.provider,
        assetType: operation.assetType,
        sourceSha256: operation.sourceSha256,
        attemptedAt: generatedAt,
        status: 'failed',
        liveMutationSent: false,
        message: error instanceof Error ? error.message : 'Asset upload failed.',
      });
    }
  }
  const receipt = marketingAdsAssetLiveUploadReceiptSchema.parse({
    kind: 'unisane.marketing.ads.asset-live-upload-receipt',
    version: 1,
    generatedAt,
    status:
      blockers.size > 0
        ? 'blocked'
        : operationResults.some((operation) => operation.status === 'failed')
          ? 'failed'
          : operationResults.some((operation) => operation.status === 'sent')
            ? 'executed'
            : 'blocked',
    dryRun: false,
    liveMutationAllowed: true,
    liveExecutorMode: options.liveExecutorMode ?? 'disabled',
    platformId: config.platformId,
    appId: config.appId,
    environment: config.defaultEnvironment,
    planPath: path.relative(cwd, loadedPlan.path),
    planHash,
    dryRunReceiptPath: path.relative(cwd, dryRun.path),
    approvalRef: options.approvalRef ?? 'missing',
    actor: { kind: 'devtools-cli', actorRef: 'redacted', secretValues: 'redacted' },
    confirmations,
    blockers: [...blockers].sort(),
    operationResults,
    nextWorkflowStep:
      blockers.size > 0
        ? 'Resolve live upload blockers and create a new dry-run receipt if the plan changed.'
        : 'Pull provider creative inventory and use provider asset refs in the creative plan.',
  });
  const outputPath = path.resolve(
    cwd,
    options.out ?? defaultAssetReceiptPath(cwd, generatedAt, true),
  );
  ensurePathWithinCwd(cwd, outputPath);
  writeJsonFile(outputPath, receipt);
  return {
    ok: receipt.status === 'executed',
    dryRun: false,
    path: outputPath,
    receipt,
  };
}

export async function writeMarketingGoogleAdsCampaignAssetLinkReceipt(
  config: MarketingExecutionContext,
  options: MarketingGoogleAdsCampaignAssetLinkOptions,
): Promise<MarketingGoogleAdsCampaignAssetLinkResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const generatedAt = now.toISOString();
  const customerId = options.credentials?.accountId;
  const loginCustomerId = options.credentials?.loginCustomerId;
  const developerToken = options.credentials?.developerToken;
  const accessToken = options.credentials?.accessToken;
  if (!customerId || !developerToken || !accessToken) {
    throw new Error(
      '[ADS_ASSET_GOOGLE_LINK_CONNECTION_INCOMPLETE] Google Ads campaign asset linking requires a selected customer, OAuth access, and approved developer access.',
    );
  }
  if (
    options.fieldType &&
    options.fieldType !== 'MARKETING_IMAGE' &&
    options.fieldType !== 'AD_IMAGE'
  ) {
    throw new Error(
      '[ADS_ASSET_GOOGLE_LINK_FIELD_UNSUPPORTED] Google Ads asset linking supports MARKETING_IMAGE or AD_IMAGE only.',
    );
  }
  const assetRefs = options.assetIds.map((assetId) => ({
    assetId,
    ...readGoogleAdsProviderAssetRef({ cwd, config, assetId }),
  }));
  const normalizedCustomerId = normalizeGoogleAdsCustomerId(customerId);
  const normalizedLoginCustomerId = loginCustomerId
    ? normalizeGoogleAdsCustomerId(loginCustomerId)
    : undefined;
  const campaignResourceName = options.campaignResourceName.trim();
  const fieldType = options.fieldType ?? 'MARKETING_IMAGE';
  const operationResults: MarketingGoogleAdsCampaignAssetLinkOperation[] = assetRefs.map(
    (assetRef) => ({
      assetId: assetRef.assetId,
      providerAssetId: assetRef.providerAssetId,
      campaignResourceName,
      fieldType,
      status: 'previewed',
      liveMutationSent: false,
      message: 'Google Ads campaign image asset link previewed.',
    }),
  );

  if (options.yes) {
    const headers: Record<string, string> = {
      authorization: `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'content-type': 'application/json',
    };
    if (normalizedLoginCustomerId) headers['login-customer-id'] = normalizedLoginCustomerId;
    const response = await (options.fetch ?? fetch)(
      `https://googleads.googleapis.com/${options.apiVersion ?? 'v24'}/customers/${normalizedCustomerId}/campaignAssets:mutate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          operations: assetRefs.map((assetRef) => ({
            create: {
              campaign: campaignResourceName,
              asset: assetRef.providerAssetId,
              fieldType,
            },
          })),
        }),
      },
    );
    const value = await parseProviderResponse(response);
    if (!response.ok) {
      operationResults.forEach((operation) => {
        operation.status = 'failed';
        operation.liveMutationSent = false;
        operation.message = `Google Ads campaign image asset link failed: ${JSON.stringify(value)}`;
      });
    } else {
      const providerResourceNames = googleAdsResultResourceNames(value);
      operationResults.forEach((operation, index) => {
        operation.status = 'sent';
        operation.liveMutationSent = true;
        operation.providerResourceName = providerResourceNames[index];
        operation.message = 'Google Ads campaign image asset link sent.';
      });
    }
  }

  const receipt = {
    kind: 'unisane.marketing.ads.google-ads-campaign-asset-link-receipt' as const,
    version: 1 as const,
    generatedAt,
    status: options.yes
      ? operationResults.some((operation) => operation.status === 'failed')
        ? ('failed' as const)
        : ('executed' as const)
      : ('previewed' as const),
    dryRun: !options.yes,
    platformId: config.platformId,
    appId: config.appId,
    environment: config.defaultEnvironment,
    customerId: normalizedCustomerId,
    ...(normalizedLoginCustomerId ? { loginCustomerId: normalizedLoginCustomerId } : {}),
    campaignResourceName,
    fieldType,
    operationResults,
  };
  const outputPath = path.resolve(
    cwd,
    options.out ??
      path.join(
        MARKETING_ADS_ASSET_RECEIPTS_ROOT,
        `google-ads-campaign-assets-${generatedAt.replace(/[:.]/g, '-')}.json`,
      ),
  );
  ensurePathWithinCwd(cwd, outputPath);
  writeJsonFile(outputPath, receipt);
  return {
    ok: receipt.status !== 'failed',
    dryRun: receipt.dryRun,
    path: outputPath,
    receipt,
  };
}
