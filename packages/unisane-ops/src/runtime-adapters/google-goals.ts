import { z } from 'zod';
import { marketingGoogleAdsGoalPlanSchema } from '@unisane/growth/contracts';
import { createGoogleAdsGoalProvider } from '@unisane/provider-google/marketing';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { selectGrowthEnvironment } from './environment.js';
const requestSchema = z
  .object({
    plan: marketingGoogleAdsGoalPlanSchema,
    validateOnly: z.boolean(),
    connection: z.string().min(1).optional(),
    environment: z.string().min(1).optional(),
    apiVersion: z
      .string()
      .regex(/^v\d+$/)
      .optional(),
    accountConfirm: z.string().optional(),
  })
  .strict();
const credentialsSchema = z.object({
  accessToken: z.string().min(1),
  developerToken: z.string().min(1),
});
export async function executeGoogleGoalOperation(
  cwd: string,
  input: unknown,
  resolveCredentials: (input: unknown) => Promise<unknown>,
) {
  const request = requestSchema.parse(input);
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) throw new Error('[GROWTH_CAPABILITY_NOT_SELECTED] Configure Growth first.');
  const environment = selectGrowthEnvironment(growth.environments, request.environment);
  const selected = growth.environments[environment]!;
  const connection = request.connection ?? selected.connections.google;
  const resources = selected.resources.filter(
    (r) =>
      r.provider === 'google' &&
      r.connection === connection &&
      r.service === 'ads' &&
      r.resourceType === 'customer',
  );
  if (
    !connection ||
    resources.length !== 1 ||
    resources[0]!.resourceId.replaceAll('-', '') !== request.plan.customerId
  )
    throw new Error('[GOOGLE_ADS_GOALS_TARGET_MISMATCH] Use the one selected Google Ads customer.');
  if (!request.validateOnly) {
    if (environment !== 'test' || loaded.config.environments[environment]?.production)
      throw new Error(
        '[GOOGLE_ADS_GOALS_SHARED_APPROVAL_REQUIRED] Live goals outside the test environment require the shared engine approval workflow.',
      );
    if (
      !request.accountConfirm
        ?.split(',')
        .map((s) => s.trim())
        .includes(`test:googleAds:${request.plan.customerId}:conversion-goals`)
    )
      throw new Error(
        '[ADS_GOALS_CONFIRM_REQUIRED] Confirm the exact test customer before applying.',
      );
  }
  const credentials = credentialsSchema.parse(
    await resolveCredentials({
      service: 'ads',
      connection,
      environment,
      requiredScope: 'https://www.googleapis.com/auth/adwords',
    }),
  );
  return createGoogleAdsGoalProvider({
    ...credentials,
    apiVersion: request.apiVersion,
    fetch,
  }).apply(request.plan, request.validateOnly);
}
