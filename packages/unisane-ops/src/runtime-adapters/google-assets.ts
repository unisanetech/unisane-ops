import { z } from 'zod';
import {
  deriveMarketingExecutionContext,
  readMarketingAdsAssetUploadPlan,
  writeMarketingAdsAssetUploadReceipt,
  writeMarketingGoogleAdsCampaignAssetLinkReceipt,
} from '@unisane/growth/marketing';
import { createGoogleAdsAssetProvider } from '@unisane/provider-google/marketing';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { selectGrowthEnvironment } from './environment.js';

const common = {
  environment: z.string().min(1).optional(),
  connection: z.string().min(1).optional(),
  yes: z.boolean().optional(),
  out: z.string().min(1).optional(),
  apiVersion: z
    .string()
    .regex(/^v\d+$/)
    .optional(),
  accountConfirm: z.string().optional(),
};
const uploadSchema = z
  .object({
    ...common,
    kind: z.literal('upload'),
    planPath: z.string().min(1),
    dryRun: z.boolean().optional(),
    receiptPath: z.string().min(1).optional(),
    approvalRef: z.string().min(1).optional(),
    productionConfirm: z.string().optional(),
    operationConfirm: z.string().optional(),
    liveExecutorMode: z.enum(['disabled', 'api']).optional(),
  })
  .strict();
const linkSchema = z
  .object({
    ...common,
    kind: z.literal('link'),
    campaignResourceName: z.string().min(1),
    assetIds: z.array(z.string().min(1)).min(1),
    fieldType: z.enum(['MARKETING_IMAGE', 'AD_IMAGE']),
  })
  .strict();
const requestSchema = z.discriminatedUnion('kind', [uploadSchema, linkSchema]);
const credentialsSchema = z.object({
  accessToken: z.string().min(1),
  developerToken: z.string().min(1),
  loginCustomerId: z.string().min(1).optional(),
});

export async function executeGoogleAssetOperation(
  cwd: string,
  input: unknown,
  resolveCredentials: (input: unknown) => Promise<unknown>,
) {
  const request = requestSchema.parse(input);
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) throw new Error('[GROWTH_CAPABILITY_NOT_SELECTED] Configure Growth first.');
  const environment = selectGrowthEnvironment(growth.environments, request.environment);
  const config = {
    ...deriveMarketingExecutionContext({
      projectRoot: loaded.projectRoot,
      configPath: loaded.configPath,
      projectId: loaded.config.project.id,
      environments: loaded.config.environments,
      growth,
    }),
    defaultEnvironment: environment,
  };
  if (
    request.kind === 'upload' &&
    !readMarketingAdsAssetUploadPlan(loaded.projectRoot, request.planPath).plan.operations.some(
      (operation) => operation.provider === 'googleAds',
    )
  ) {
    if (request.yes)
      throw new Error(
        '[META_ASSET_CREDENTIAL_CALLBACK_REQUIRED] Meta asset upload requires its approved host callback.',
      );
    return writeMarketingAdsAssetUploadReceipt(config, { ...request, cwd: loaded.projectRoot });
  }
  const selected = growth.environments[environment]!;
  const connection = request.connection ?? selected.connections.google;
  const customers = selected.resources.filter(
    (resource) =>
      resource.provider === 'google' &&
      resource.connection === connection &&
      resource.service === 'ads' &&
      resource.resourceType === 'customer',
  );
  if (!connection || customers.length !== 1)
    throw new Error('[ADS_ASSET_GOOGLE_TARGET_REQUIRED] Select exactly one Google Ads customer.');
  const customerId = customers[0]!.resourceId.replaceAll('-', '').trim();
  if (!/^\d+$/.test(customerId))
    throw new Error('[ADS_ASSET_GOOGLE_TARGET_INVALID] Invalid customer ID.');
  if (
    request.yes &&
    (environment !== 'test' || loaded.config.environments[environment]?.production)
  )
    throw new Error(
      '[ADS_ASSET_SHARED_APPROVAL_REQUIRED] Live assets outside the test environment require shared engine approval migration.',
    );
  if (request.kind === 'link') {
    if (
      !new RegExp(`^customers/${customerId}/campaigns/[0-9]+$`).test(request.campaignResourceName)
    )
      throw new Error(
        '[ADS_ASSET_GOOGLE_TARGET_MISMATCH] Campaign must belong to the selected customer.',
      );
    if (
      request.yes &&
      !request.accountConfirm
        ?.split(',')
        .map((value) => value.trim())
        .includes(`${environment}:googleAds:${customerId}:ads-assets-link`)
    )
      throw new Error(
        '[ADS_ASSET_LINK_CONFIRM_REQUIRED] Confirm the exact customer with --account-confirm before linking.',
      );
  }
  async function provider() {
    const credentials = credentialsSchema.parse(
      await resolveCredentials({
        service: 'ads',
        connection,
        environment,
        requiredScope: 'https://www.googleapis.com/auth/adwords',
      }),
    );
    return {
      client: createGoogleAdsAssetProvider({
        ...credentials,
        customerId,
        fetch,
        apiVersion: request.apiVersion,
      }),
      credentials,
    };
  }
  if (request.kind === 'link') {
    return writeMarketingGoogleAdsCampaignAssetLinkReceipt(config, {
      cwd: loaded.projectRoot,
      campaignResourceName: request.campaignResourceName,
      assetIds: request.assetIds,
      fieldType: request.fieldType,
      yes: request.yes,
      out: request.out,
      customerId,
      provider: async (input) => {
        const { client, credentials } = await provider();
        return client.link({
          ...input,
          loginCustomerId: credentials.loginCustomerId?.replaceAll('-', '').trim(),
        });
      },
    });
  }
  return writeMarketingAdsAssetUploadReceipt(config, {
    cwd: loaded.projectRoot,
    planPath: request.planPath,
    dryRun: request.dryRun,
    yes: request.yes,
    out: request.out,
    receiptPath: request.receiptPath,
    approvalRef: request.approvalRef,
    accountConfirm: request.accountConfirm,
    productionConfirm: request.productionConfirm,
    operationConfirm: request.operationConfirm,
    liveExecutorMode: request.liveExecutorMode,
    providerCredentials: { googleAds: { accountId: customerId } },
    providerUploaders: { googleAds: async (input) => (await provider()).client.upload(input) },
  });
}
