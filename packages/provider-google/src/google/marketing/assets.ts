import {
  googleCampaignAssetLinkRequestSchema,
  type GoogleCampaignAssetLinker,
  type MarketingAdsAssetProviderUploader,
  type FetchLike,
} from '@unisane/growth/contracts';

const GOOGLE_ADS_ASSET_API_VERSION = 'v24';
export type GoogleAdsAssetClientOptions = {
  accessToken: string;
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
  apiVersion?: string;
  fetch: FetchLike;
};

export function createGoogleAdsAssetProvider(options: GoogleAdsAssetClientOptions): {
  upload: MarketingAdsAssetProviderUploader;
  link: GoogleCampaignAssetLinker;
} {
  const customerId = options.customerId.replaceAll('-', '').trim();
  const loginCustomerId = options.loginCustomerId?.replaceAll('-', '').trim();
  const version = options.apiVersion ?? GOOGLE_ADS_ASSET_API_VERSION;
  if (
    !/^\d+$/.test(customerId) ||
    (loginCustomerId && !/^\d+$/.test(loginCustomerId)) ||
    !/^v\d+$/.test(version)
  )
    throw new Error('[ADS_ASSET_GOOGLE_TARGET_INVALID] Select valid customer IDs and API version.');
  if (!options.accessToken || !options.developerToken)
    throw new Error(
      '[ADS_ASSET_GOOGLE_CREDENTIALS_REQUIRED] Canonical Google credentials are required.',
    );
  async function mutate(
    collection: 'assets' | 'campaignAssets',
    operations: unknown[],
  ): Promise<string[]> {
    let response: Response;
    try {
      response = await options.fetch(
        `https://googleads.googleapis.com/${version}/customers/${customerId}/${collection}:mutate`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.accessToken}`,
            'developer-token': options.developerToken,
            'content-type': 'application/json',
            ...(loginCustomerId ? { 'login-customer-id': loginCustomerId } : {}),
          },
          body: JSON.stringify({ partialFailure: false, operations }),
        },
      );
    } catch {
      throw new Error(
        '[ADS_ASSET_GOOGLE_OUTCOME_UNKNOWN] Transport failed. Reconcile provider state before retrying.',
      );
    }
    if (!response.ok)
      throw new Error(
        `[ADS_ASSET_GOOGLE_REQUEST_FAILED] Google returned HTTP ${response.status}. Reconcile state before retrying.`,
      );
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new Error(
        '[ADS_ASSET_GOOGLE_OUTCOME_UNKNOWN] Unreadable provider receipt. Reconcile before retrying.',
      );
    }
    const root =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
    const results = Array.isArray(root.results) ? root.results : [];
    const names = results.map((entry) =>
      entry && typeof entry === 'object'
        ? (entry as Record<string, unknown>).resourceName
        : undefined,
    );
    const resourcePattern = new RegExp(
      `^customers/${customerId}/${collection}/${collection === 'assets' ? '[0-9]+' : '[0-9]+~[0-9]+~[A-Z0-9_]+'}$`,
    );
    if (
      root.partialFailureError ||
      names.length !== operations.length ||
      names.some((name) => typeof name !== 'string' || !resourcePattern.test(name)) ||
      new Set(names).size !== names.length
    )
      throw new Error(
        '[ADS_ASSET_GOOGLE_OUTCOME_UNKNOWN] Incomplete, ambiguous or foreign receipt. Reconcile before retrying.',
      );
    return names as string[];
  }
  return {
    async upload(input) {
      if (
        input.operation.provider !== 'googleAds' ||
        !['image', 'logo'].includes(input.operation.assetType)
      )
        throw new Error(
          '[ADS_ASSET_GOOGLE_TYPE_UNSUPPORTED] Google asset upload supports image/logo operations.',
        );
      if (!/\.(jpe?g|png|gif)$/i.test(input.source.fileName) || input.source.bytes.length === 0)
        throw new Error(
          '[ADS_ASSET_GOOGLE_IMAGE_TYPE_UNSUPPORTED] Supply nonempty jpg, png or gif bytes.',
        );
      const names = await mutate('assets', [
        {
          create: {
            name: input.operation.assetId,
            type: 'IMAGE',
            imageAsset: { data: Buffer.from(input.source.bytes).toString('base64') },
          },
        },
      ]);
      return {
        providerAssetId: names[0]!,
        message: 'Google image upload acknowledged; verify provider state.',
      };
    },
    async link(input) {
      const request = googleCampaignAssetLinkRequestSchema.parse(input);
      if (request.customerId !== customerId || request.loginCustomerId !== loginCustomerId)
        throw new Error(
          '[ADS_ASSET_GOOGLE_TARGET_MISMATCH] Link request does not match the bound customer.',
        );
      const providerResourceNames = await mutate(
        'campaignAssets',
        request.providerAssetIds.map((asset) => ({
          create: {
            campaign: request.campaignResourceName,
            asset,
            fieldType: request.fieldType,
          },
        })),
      );
      const campaignId = request.campaignResourceName.split('/').at(-1)!;
      if (
        providerResourceNames.some(
          (name, index) =>
            !name.startsWith(
              `customers/${customerId}/campaignAssets/${campaignId}~${request.providerAssetIds[index]!.split('/').at(-1)!}~`,
            ),
        )
      )
        throw new Error(
          '[ADS_ASSET_GOOGLE_OUTCOME_UNKNOWN] Receipt targets differ from the requested links. Reconcile before retrying.',
        );
      return { providerResourceNames };
    },
  };
}
