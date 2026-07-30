import type {
  MarketingAdsApplyOperation,
  MarketingAdsApplyPreview,
  MarketingAdsLiveExecutorMode,
  MarketingAdsLiveOperationReceipt,
} from '../schema/ads-apply.js';
import type {
  MarketingAdsPlanArtifact,
  MarketingAdsPlanCandidate,
  MarketingAdsPlanProvider,
} from '../schema/ads-plan.js';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import type { FetchLike } from '../providers/api-pull-types.js';

export type MarketingAdsExecutorMode = 'dry-run' | 'live-disabled' | 'live-api';

export type MarketingAdsProviderExecutorResult = {
  providerOperationId?: string;
  dryRun: true;
  liveMutationSent: false;
  message: string;
};

export type MarketingAdsProviderExecutor = {
  provider: MarketingAdsPlanProvider;
  mode: MarketingAdsExecutorMode;
  executeDryRun: (
    operation: MarketingAdsApplyOperation,
    preview: MarketingAdsApplyPreview,
  ) => Promise<MarketingAdsProviderExecutorResult>;
};

export function assertLiveAdsExecutorDisabled(mode: MarketingAdsExecutorMode): void {
  if (mode !== 'dry-run' && mode !== 'live-disabled' && mode !== 'live-api') {
    throw new Error('[ADS_EXECUTOR_MODE_INVALID] Unsupported ads executor mode.');
  }
}

export type MarketingAdsLiveProviderExecutionOptions = {
  config: MarketingExecutionContext;
  plan: MarketingAdsPlanArtifact;
  operation: MarketingAdsApplyOperation;
  candidate?: MarketingAdsPlanCandidate;
  env: Record<string, string | undefined>;
  credentials?: {
    accessToken?: string;
    developerToken?: string;
    accountId?: string;
    loginCustomerId?: string;
    pageId?: string;
    instagramActorId?: string;
    pixelId?: string;
    datasetId?: string;
  };
  fetch: FetchLike;
  apiVersion?: string;
};

export type MarketingAdsLiveProviderExecutionResult = {
  providerOperationId?: string;
  message: string;
};

export type MarketingAdsLiveProviderExecutor = (
  options: MarketingAdsLiveProviderExecutionOptions,
) => Promise<MarketingAdsLiveProviderExecutionResult>;

export type MarketingAdsLiveProviderExecutors = Partial<
  Record<MarketingAdsPlanProvider, MarketingAdsLiveProviderExecutor>
>;

export type MarketingAdsLiveExecutorOptions = {
  config: MarketingExecutionContext;
  plan: MarketingAdsPlanArtifact;
  operation: MarketingAdsApplyOperation;
  mode: MarketingAdsLiveExecutorMode;
  providerExecutors?: MarketingAdsLiveProviderExecutors;
  providerCredentials?: Partial<
    Record<MarketingAdsPlanProvider, MarketingAdsLiveProviderExecutionOptions['credentials']>
  >;
  env?: Record<string, string | undefined>;
  fetch?: FetchLike;
  now?: Date;
  apiVersion?: string;
};

function liveOperationResult(
  operation: MarketingAdsApplyOperation,
  options: {
    attemptedAt: string;
    environment: string;
    status: 'sent' | 'blocked' | 'failed';
    liveMutationSent: boolean;
    message: string;
    providerOperationId?: string;
  },
): MarketingAdsLiveOperationReceipt {
  return {
    operationId: operation.id,
    provider: operation.provider,
    strategyObjectId: operation.strategyObjectId,
    actionType: operation.actionType,
    attemptedAt: options.attemptedAt,
    environment: options.environment,
    safety: operation.safety,
    mutationIntent: operation.mutationIntent,
    approvalTier: operation.approvalTier,
    status: options.status,
    liveMutationSent: options.liveMutationSent,
    message: options.message,
    ...(options.providerOperationId ? { providerOperationId: options.providerOperationId } : {}),
  };
}

function candidateFor(
  plan: MarketingAdsPlanArtifact,
  operation: MarketingAdsApplyOperation,
): MarketingAdsPlanCandidate | undefined {
  return plan.candidates.find(
    (candidate) =>
      candidate.provider === operation.provider &&
      candidate.strategyObjectId === operation.strategyObjectId,
  );
}

export async function executeMarketingAdsLiveOperation(
  options: MarketingAdsLiveExecutorOptions,
): Promise<MarketingAdsLiveOperationReceipt> {
  const attemptedAt = (options.now ?? new Date()).toISOString();
  const environment = options.config.defaultEnvironment;
  if (options.mode === 'disabled') {
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'blocked',
      liveMutationSent: false,
      message: 'Live executor mode is disabled; no provider mutation was sent.',
    });
  }
  if (options.env?.UNISANE_MARKETING_ADS_LIVE_MUTATION !== 'enabled') {
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'blocked',
      liveMutationSent: false,
      message:
        'UNISANE_MARKETING_ADS_LIVE_MUTATION=enabled is required for live provider mutation.',
    });
  }
  if (
    options.operation.actionType !== 'pause_campaign' &&
    options.operation.actionType !== 'create_campaign'
  ) {
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'blocked',
      liveMutationSent: false,
      message: `${options.operation.actionType} is not supported by the live executor.`,
    });
  }
  const candidate = candidateFor(options.plan, options.operation);
  if (options.operation.actionType === 'create_campaign' && !candidate) {
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'blocked',
      liveMutationSent: false,
      message: 'Live campaign creation requires a reviewed ads plan candidate.',
    });
  }
  if (options.operation.actionType === 'pause_campaign' && !candidate?.campaignIds[0]) {
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'blocked',
      liveMutationSent: false,
      message:
        'Live pause requires the reviewed ads plan candidate to include a provider campaign id.',
    });
  }
  const providerExecutor = options.providerExecutors?.[options.operation.provider];
  if (!providerExecutor) {
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'blocked',
      liveMutationSent: false,
      message: `[ADS_LIVE_PROVIDER_EXECUTOR_MISSING] No live executor was injected for ${options.operation.provider}.`,
    });
  }
  try {
    const result = await providerExecutor({
      config: options.config,
      plan: options.plan,
      operation: options.operation,
      candidate,
      env: options.env ?? process.env,
      credentials: options.providerCredentials?.[options.operation.provider],
      fetch: options.fetch ?? fetch,
      apiVersion: options.apiVersion,
    });
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'sent',
      liveMutationSent: true,
      providerOperationId: result.providerOperationId,
      message: result.message,
    });
  } catch (error) {
    return liveOperationResult(options.operation, {
      attemptedAt,
      environment,
      status: 'failed',
      liveMutationSent: false,
      message: error instanceof Error ? error.message : 'Unknown live ads executor error.',
    });
  }
}
