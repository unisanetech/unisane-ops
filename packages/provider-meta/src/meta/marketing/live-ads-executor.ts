import type {
  FetchLike,
  MarketingAdsLiveProviderExecutionOptions,
  MarketingAdsLiveProviderExecutionResult,
  MarketingAdsPlanCandidate,
  MarketingMetaAdsBuildout,
} from '@unisane/growth/contracts';

function absoluteFinalUrl(origin: string | undefined, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = origin?.trim() || 'https://trueresume.io';
  return new URL(value.startsWith('/') ? value : `/${value}`, base).toString();
}

function metaAccountPath(accountId: string): string {
  const normalized = accountId.trim();
  if (normalized.startsWith('act_')) return normalized;
  return `act_${normalized}`;
}

function minorUnitsFromDailyBudgetAmount(value: number | undefined): number {
  const amount = value && Number.isFinite(value) ? value : 1;
  return Math.max(1, Math.round(amount * 100));
}

function metaAdsName(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 255);
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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

async function readProviderResponse(
  response: Response,
  code: string,
  label: string,
): Promise<unknown> {
  const body = await parseProviderResponse(response);
  if (!response.ok) {
    throw new Error(`[${code}] ${label} failed: ${JSON.stringify(body)}`);
  }
  return body;
}

async function pauseMetaCampaign(args: {
  campaignId: string;
  accessToken: string;
  fetcher: FetchLike;
  apiVersion?: string;
}): Promise<{ providerOperationId?: string; message: string }> {
  const apiVersion = args.apiVersion ?? 'v23.0';
  const body = new URLSearchParams();
  body.set('status', 'PAUSED');
  body.set('access_token', args.accessToken);
  const response = await args.fetcher(
    `https://graph.facebook.com/${apiVersion}/${args.campaignId}`,
    {
      method: 'POST',
      body,
    },
  );
  const parsed = await parseProviderResponse(response);
  if (!response.ok) {
    throw new Error(
      `[ADS_LIVE_META_PAUSE_FAILED] Meta Ads pause failed: ${JSON.stringify(parsed)}`,
    );
  }
  return {
    providerOperationId: args.campaignId,
    message: 'Meta Ads campaign pause mutation sent.',
  };
}

async function mutateMetaAds(args: {
  fetcher: FetchLike;
  apiVersion: string;
  path: string;
  body: Record<string, unknown>;
  accessToken: string;
  errorCode: string;
  label: string;
}): Promise<Record<string, unknown>> {
  const payload = new URLSearchParams();
  for (const [key, value] of Object.entries(args.body)) {
    if (value === undefined) continue;
    payload.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  payload.set('access_token', args.accessToken);
  const response = await args.fetcher(
    `https://graph.facebook.com/${args.apiVersion}/${args.path}`,
    {
      method: 'POST',
      body: payload,
    },
  );
  return asRecord(await readProviderResponse(response, args.errorCode, args.label));
}

function metaResultId(body: Record<string, unknown>, errorCode: string): string {
  const id = body.id;
  if (typeof id === 'string' && id.trim()) return id;
  throw new Error(`[${errorCode}] Meta Ads mutation returned no id.`);
}

function metaAdSetTargeting(buildout: MarketingMetaAdsBuildout): Record<string, unknown> {
  return {
    geo_locations: {
      countries: buildout.countryCodes,
    },
    ...(buildout.ageMin ? { age_min: buildout.ageMin } : {}),
    ...(buildout.ageMax ? { age_max: buildout.ageMax } : {}),
    ...(buildout.placementTargeting.publisherPlatforms.length > 0
      ? { publisher_platforms: buildout.placementTargeting.publisherPlatforms }
      : {}),
    ...(buildout.placementTargeting.facebookPositions.length > 0
      ? { facebook_positions: buildout.placementTargeting.facebookPositions }
      : {}),
    ...(buildout.placementTargeting.instagramPositions.length > 0
      ? { instagram_positions: buildout.placementTargeting.instagramPositions }
      : {}),
  };
}

function metaObjectStorySpec(args: {
  buildout: MarketingMetaAdsBuildout;
  pageId: string;
  instagramActorId?: string;
  destinationUrl: string;
}): Record<string, unknown> {
  const linkData: Record<string, unknown> = {
    link: args.destinationUrl,
    message: args.buildout.creative.primaryText,
    name: args.buildout.creative.headline,
    call_to_action: {
      type: args.buildout.creative.callToActionType,
      value: {
        link: args.destinationUrl,
      },
    },
  };
  if (args.buildout.creative.description) {
    linkData.description = args.buildout.creative.description;
  }
  if (args.buildout.creative.assetType === 'image') {
    linkData.image_hash = args.buildout.creative.providerAssetId;
  }
  if (args.buildout.creative.assetType === 'video') {
    linkData.video_id = args.buildout.creative.providerAssetId;
  }
  return {
    page_id: args.pageId,
    ...(args.instagramActorId ? { instagram_actor_id: args.instagramActorId } : {}),
    link_data: linkData,
  };
}

function isMetaReviewPlaceholder(value: string | undefined): boolean {
  return !value?.trim() || value.trim().startsWith('REVIEW_REQUIRED_');
}

function assertReviewedMetaBuildout(buildout: MarketingMetaAdsBuildout): void {
  const placeholders = [
    ['creative.providerAssetId', buildout.creative.providerAssetId],
    ['creative.primaryText', buildout.creative.primaryText],
    ['creative.headline', buildout.creative.headline],
  ].filter(([, value]) => isMetaReviewPlaceholder(value));
  if (placeholders.length > 0) {
    throw new Error(
      `[ADS_LIVE_META_BUILDOUT_UNREVIEWED] Meta live create requires reviewed values for ${placeholders
        .map(([field]) => field)
        .join(', ')}.`,
    );
  }
}

async function createPausedMetaAdsCampaign(args: {
  candidate: MarketingAdsPlanCandidate;
  credentials: NonNullable<MarketingAdsLiveProviderExecutionOptions['credentials']>;
  fetcher: FetchLike;
  apiVersion?: string;
}): Promise<{ providerOperationId?: string; message: string }> {
  const accountId = args.credentials.accountId;
  const accessToken = args.credentials.accessToken;
  const pageId = args.credentials.pageId;
  const instagramActorId = args.credentials.instagramActorId;
  const pixelId = args.credentials.pixelId;
  const datasetId = args.credentials.datasetId;
  const buildout = args.candidate.metaAdsBuildout;
  if (!accountId || !accessToken || !pageId || (!pixelId && !datasetId)) {
    throw new Error(
      '[ADS_LIVE_META_CONNECTION_INCOMPLETE] Meta live create requires selected account, page, and pixel or dataset resources plus a canonical connection credential.',
    );
  }
  if (!buildout) {
    throw new Error(
      '[ADS_LIVE_META_BUILDOUT_MISSING] Meta live create requires candidate.metaAdsBuildout with reviewed creative and targeting.',
    );
  }
  assertReviewedMetaBuildout(buildout);
  const apiVersion = args.apiVersion ?? 'v25.0';
  const accountPath = metaAccountPath(accountId);
  const destinationUrl = absoluteFinalUrl(
    buildout.finalUrlOrigin,
    buildout.destinationUrl || args.candidate.utm.finalUrl || args.candidate.landingPageUrl || '/',
  );
  const campaignBody = await mutateMetaAds({
    fetcher: args.fetcher,
    apiVersion,
    path: `${accountPath}/campaigns`,
    accessToken,
    errorCode: 'ADS_LIVE_META_CAMPAIGN_CREATE_FAILED',
    label: 'Meta Ads campaign create',
    body: {
      name: metaAdsName(buildout.campaignName ?? args.candidate.name),
      objective: buildout.objective,
      status: buildout.status,
      special_ad_categories: buildout.specialAdCategories,
    },
  });
  const campaignId = metaResultId(campaignBody, 'ADS_LIVE_META_CAMPAIGN_CREATE_INVALID');
  const promotedObject = {
    ...(pixelId ? { pixel_id: pixelId } : {}),
    ...(datasetId ? { dataset_id: datasetId } : {}),
    custom_event_type: buildout.promotedObjectCustomEventType,
  };
  const adSetBody = await mutateMetaAds({
    fetcher: args.fetcher,
    apiVersion,
    path: `${accountPath}/adsets`,
    accessToken,
    errorCode: 'ADS_LIVE_META_ADSET_CREATE_FAILED',
    label: 'Meta Ads ad set create',
    body: {
      name: metaAdsName(buildout.adSetName),
      campaign_id: campaignId,
      status: buildout.status,
      daily_budget: minorUnitsFromDailyBudgetAmount(
        args.candidate.budgetGuardrail.dailyBudgetAmount,
      ),
      billing_event: buildout.billingEvent,
      optimization_goal: buildout.optimizationGoal,
      bid_strategy: buildout.bidStrategy,
      promoted_object: promotedObject,
      targeting: metaAdSetTargeting(buildout),
    },
  });
  const adSetId = metaResultId(adSetBody, 'ADS_LIVE_META_ADSET_CREATE_INVALID');
  const creativeBody = await mutateMetaAds({
    fetcher: args.fetcher,
    apiVersion,
    path: `${accountPath}/adcreatives`,
    accessToken,
    errorCode: 'ADS_LIVE_META_CREATIVE_CREATE_FAILED',
    label: 'Meta Ads creative create',
    body: {
      name: metaAdsName(buildout.creative.name),
      object_story_spec: metaObjectStorySpec({
        buildout,
        pageId,
        instagramActorId,
        destinationUrl,
      }),
      ...(buildout.creative.urlTags ? { url_tags: buildout.creative.urlTags } : {}),
    },
  });
  const creativeId = metaResultId(creativeBody, 'ADS_LIVE_META_CREATIVE_CREATE_INVALID');
  const adBody = await mutateMetaAds({
    fetcher: args.fetcher,
    apiVersion,
    path: `${accountPath}/ads`,
    accessToken,
    errorCode: 'ADS_LIVE_META_AD_CREATE_FAILED',
    label: 'Meta Ads ad create',
    body: {
      name: metaAdsName(buildout.adName),
      adset_id: adSetId,
      creative: { creative_id: creativeId },
      status: buildout.status,
    },
  });
  const adId = metaResultId(adBody, 'ADS_LIVE_META_AD_CREATE_INVALID');
  return {
    providerOperationId: campaignId,
    message: `Meta Ads paused campaign created with ad set ${adSetId}, creative ${creativeId}, and ad ${adId}.`,
  };
}

export async function executeMetaAdsLiveOperation(
  options: MarketingAdsLiveProviderExecutionOptions,
): Promise<MarketingAdsLiveProviderExecutionResult> {
  if (options.operation.provider !== 'metaAds') {
    throw new Error(
      '[ADS_LIVE_META_PROVIDER_INVALID] Meta Ads executor received a non-Meta operation.',
    );
  }
  if (options.operation.actionType === 'create_campaign') {
    if (!options.candidate) {
      throw new Error(
        '[ADS_LIVE_META_CANDIDATE_REQUIRED] Meta Ads campaign creation requires a reviewed candidate.',
      );
    }
    return createPausedMetaAdsCampaign({
      candidate: options.candidate,
      credentials: options.credentials ?? {},
      fetcher: options.fetch,
      apiVersion: options.apiVersion,
    });
  }
  if (options.operation.actionType !== 'pause_campaign') {
    throw new Error(
      `[ADS_LIVE_META_ACTION_UNSUPPORTED] Meta Ads live executor does not support ${options.operation.actionType}.`,
    );
  }
  const campaignId = options.candidate?.campaignIds[0];
  if (!campaignId) {
    throw new Error(
      '[ADS_LIVE_META_CAMPAIGN_ID_REQUIRED] Meta Ads pause requires a reviewed provider campaign id.',
    );
  }
  const accessToken = options.credentials?.accessToken;
  if (!accessToken) {
    throw new Error(
      '[ADS_LIVE_META_CONNECTION_INCOMPLETE] Meta Ads pause requires a canonical connection credential.',
    );
  }
  return pauseMetaCampaign({
    campaignId,
    accessToken,
    fetcher: options.fetch,
    apiVersion: options.apiVersion,
  });
}
