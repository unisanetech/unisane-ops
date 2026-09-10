import { z } from 'zod';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { selectGrowthEnvironment } from './environment.js';
export const metaConnectionRoutingSchema = z
  .object({
    environment: z.string().trim().min(1).optional(),
    connection: z.string().trim().min(1).optional(),
  })
  .strict();

export async function resolveMetaConnectionRecord(cwd: string, input: unknown) {
  const provider = await import('@unisane/provider-meta');
  const loaded = await loadUnisaneOpsConfig(cwd);
  const growth = loaded.config.capabilities.growth;
  if (!growth) {
    throw new Error(
      '[GROWTH_CAPABILITY_NOT_SELECTED] Run `unisane-ops add growth` before using Meta.',
    );
  }
  const routing = metaConnectionRoutingSchema.parse(input);
  const environmentId = selectGrowthEnvironment(growth.environments, routing.environment);
  const environment = growth.environments[environmentId];
  const connectionId = routing.connection ?? environment.connections.meta;
  if (!connectionId) {
    throw new Error(
      `[META_CONNECTION_REQUIRED] No Meta connection is selected for '${environmentId}'.`,
    );
  }
  if (environment.connections.meta !== connectionId) {
    throw new Error(
      `[META_CONNECTION_SELECTION_MISMATCH] '${connectionId}' is not the selected Meta connection for '${environmentId}'.`,
    );
  }
  const reference = loaded.config.connections[connectionId];
  if (!reference || reference.provider !== 'meta' || !('recordPath' in reference)) {
    throw new Error(
      `[META_CONNECTION_UNKNOWN] '${connectionId}' is not a canonical Meta connection.`,
    );
  }
  const connection = provider.readMetaConnectionRecord({
    projectRoot: loaded.projectRoot,
    recordPath: reference.recordPath,
  });
  if (!connection) {
    throw new Error(
      `[META_CONNECTION_RECORD_MISSING] Connection record '${reference.recordPath}' does not exist.`,
    );
  }
  if (
    connection.projectId !== loaded.config.project.id ||
    connection.environmentId !== environmentId ||
    connection.connectionId !== connectionId
  ) {
    throw new Error(
      '[META_CONNECTION_CONTEXT_MISMATCH] The canonical Meta record does not belong to the selected project and environment.',
    );
  }
  return { connection, environment, environmentId, provider };
}

export function resolveSelectedMetaAdsAccount(input: {
  connection: Awaited<ReturnType<typeof resolveMetaConnectionRecord>>['connection'];
  environment: Awaited<ReturnType<typeof resolveMetaConnectionRecord>>['environment'];
  requestedAccountId: string;
}): string {
  const configured = input.environment.resources.filter(
    (resource) =>
      resource.provider === 'meta' &&
      resource.connection === input.connection.connectionId &&
      resource.service === 'ads-insights' &&
      resource.resourceType === 'ad-account',
  );
  if (configured.length !== 1) {
    throw new Error(
      configured.length === 0
        ? '[META_ADS_ACCOUNT_SELECTION_MISSING] Select exactly one Meta ads-insights ad account in the Growth environment.'
        : '[META_ADS_ACCOUNT_SELECTION_AMBIGUOUS] More than one Meta ads-insights ad account is selected in the Growth environment.',
    );
  }
  const observed = input.connection.resources.filter(
    (resource) =>
      resource.service === 'ads-insights' &&
      resource.resourceType === 'ad-account' &&
      resource.state === 'selected',
  );
  if (observed.length !== 1) {
    throw new Error(
      observed.length === 0
        ? '[META_ADS_ACCOUNT_EVIDENCE_MISSING] The canonical Meta connection has no selected ad-account evidence.'
        : '[META_ADS_ACCOUNT_EVIDENCE_AMBIGUOUS] The canonical Meta connection has multiple selected ad accounts.',
    );
  }
  const accountId = configured[0]!.resourceId;
  if (observed[0]!.resourceId !== accountId || input.requestedAccountId !== accountId) {
    throw new Error(
      '[META_ADS_ACCOUNT_SELECTION_MISMATCH] The report request, Growth selection, and canonical Meta evidence do not identify the same ad account.',
    );
  }
  const grant = input.connection.grants.find((candidate) => candidate.service === 'ads-insights');
  if (!grant || grant.state !== 'granted' || !grant.scopes.includes('ads_read')) {
    throw new Error(
      '[META_ADS_READ_GRANT_REQUIRED] The canonical Meta connection does not have a current ads_read grant.',
    );
  }
  return accountId;
}
