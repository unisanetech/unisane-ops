import { GOOGLE_PROVIDER_DEFAULT_REQUIRED_APIS, type GoogleProviderRequiredApi } from './types.js';

export function resolveGoogleProjectId(args: {
  project?: string;
  env?: Record<string, string | undefined>;
}): string | null {
  const env = args.env ?? process.env;
  const value =
    args.project ??
    env.GOOGLE_CLOUD_PROJECT ??
    env.GOOGLE_PROJECT_ID ??
    env.GCLOUD_PROJECT ??
    env.CLOUDSDK_CORE_PROJECT;
  return value?.trim() || null;
}

function normalizeApiName(value: string): string {
  const trimmed = value.trim();
  if (!/^[a-z0-9.-]+\.googleapis\.com$/i.test(trimmed)) {
    throw new Error(`[GOOGLE_API_NAME_INVALID] Google API service name is invalid: ${value}`);
  }
  return trimmed.toLowerCase();
}

export function resolveGoogleRequiredApis(api?: readonly string[]): GoogleProviderRequiredApi[] {
  const defaults = GOOGLE_PROVIDER_DEFAULT_REQUIRED_APIS.map((entry) => ({ ...entry }));
  const custom = (api ?? []).map((serviceName) => ({
    serviceName: normalizeApiName(serviceName),
    title: serviceName,
    reason: 'Requested by --api.',
  }));
  const byName = new Map<string, GoogleProviderRequiredApi>();
  for (const entry of [...defaults, ...custom]) {
    byName.set(entry.serviceName, entry);
  }
  return [...byName.values()];
}
