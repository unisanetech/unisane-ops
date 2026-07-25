import {
  createControlPlaneAuthProfile,
  publicControlPlaneEnvEntry,
  type ControlPlaneAuthProfile,
  type ControlPlaneEnvEntry,
} from '@unisane/ops-engine';
import {
  marketingMetaAuthReady,
  type MarketingMetaAuthProfileStatus,
} from '@unisane/growth/marketing';
import { log } from '../../../log.js';
import { executeGrowthProviderCommand } from '../../../provider-runtime.js';

const DEFAULT_ACCESS_TOKEN_ENV = 'META_ADS_ACCESS_TOKEN';
const PROFILE_ENV = 'UNISANE_MARKETING_META_AUTH_PROFILE';

export type MarketingMetaAuthRuntimeOptions = {
  authHome?: string;
  store?: 'keychain' | 'file';
  allowPlaintextStore?: boolean;
};

export type MarketingMetaAuthCliOptions = MarketingMetaAuthRuntimeOptions & {
  profile?: string;
  cwd?: string;
  accessTokenEnv?: string;
  scopes?: string;
  expiresAt?: string;
  print?: boolean;
  json?: boolean;
};

export function marketingMetaAuthStatusToControlPlaneProfile(args: {
  status: MarketingMetaAuthProfileStatus;
  requiredScopes?: readonly string[];
}): ControlPlaneAuthProfile {
  return createControlPlaneAuthProfile({
    provider: 'meta',
    profile: args.status.profile,
    configured: args.status.configured,
    credentialStored: args.status.accessTokenStored,
    scopes: args.status.scopes,
    requiredScopes: args.requiredScopes,
    expiresAt: args.status.expiresAt,
    secretStore: args.status.secretStore,
    expired: args.status.configured && !marketingMetaAuthReady(args.status),
    missingMessage:
      'Meta token profile is not ready. Save a token once and keep raw token env as fallback only.',
  });
}

export function marketingMetaAuthEnvEntries(
  args: { env?: Record<string, string | undefined> } = {},
): ControlPlaneEnvEntry[] {
  const env = args.env ?? process.env;
  return [
    publicControlPlaneEnvEntry({
      name: DEFAULT_ACCESS_TOKEN_ENV,
      kind: 'fallback-debug',
      required: false,
      secret: true,
      value: env[DEFAULT_ACCESS_TOKEN_ENV],
      description: 'One-time or troubleshooting Meta access-token fallback.',
      example: '<SECRET>',
    }),
    publicControlPlaneEnvEntry({
      name: PROFILE_ENV,
      kind: 'local-devtool-config',
      required: false,
      secret: false,
      value: env[PROFILE_ENV],
      description: 'Optional saved Meta token profile override.',
      example: 'default',
    }),
  ];
}

export function saveMarketingMetaAuthProfile(args: {
  profile?: string;
  accessToken: string;
  scopes?: readonly string[];
  expiresAt?: string;
  secretStore?: 'keychain' | 'file';
  runtime?: MarketingMetaAuthRuntimeOptions;
}): Promise<void> {
  return executeGrowthProviderCommand('meta.auth.save', args);
}

export function getMarketingMetaAuthStatus(
  args: { profile?: string; runtime?: MarketingMetaAuthRuntimeOptions } = {},
): Promise<MarketingMetaAuthProfileStatus> {
  return executeGrowthProviderCommand('meta.auth.status', args);
}

export function resolveMarketingMetaAccessToken(args: {
  accessTokenEnv?: string;
  authProfile?: string;
  runtime?: MarketingMetaAuthRuntimeOptions;
}): Promise<string> {
  return executeGrowthProviderCommand('meta.auth.resolve-token', args);
}

export function deleteMarketingMetaAuthProfile(
  args: { profile?: string; runtime?: MarketingMetaAuthRuntimeOptions } = {},
): Promise<void> {
  return executeGrowthProviderCommand('meta.auth.delete', args);
}

function profileName(value?: string): string {
  return (value ?? process.env[PROFILE_ENV] ?? 'default').trim();
}

function parseScopes(value: string | undefined): readonly string[] {
  return (value ?? '')
    .split(/[,\s]+/g)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export async function saveMarketingMetaAuthCommand(
  options: MarketingMetaAuthCliOptions,
): Promise<number> {
  try {
    const profile = profileName(options.profile);
    const accessTokenEnv = options.accessTokenEnv ?? DEFAULT_ACCESS_TOKEN_ENV;
    const accessToken = process.env[accessTokenEnv]?.trim();
    if (!accessToken) {
      throw new Error(`[MARKETING_META_AUTH_ACCESS_TOKEN_REQUIRED] ${accessTokenEnv} is not set.`);
    }
    await saveMarketingMetaAuthProfile({
      profile,
      accessToken,
      scopes: parseScopes(options.scopes),
      expiresAt: options.expiresAt,
      secretStore: options.store,
      runtime: options,
    });
    const status = await getMarketingMetaAuthStatus({ profile, runtime: options });
    if (options.json) {
      printJson({
        ok: true,
        profile,
        authHome: status.authHome,
        secretStore: status.secretStore,
      });
    } else {
      log.success(
        `Saved Marketing Meta auth profile '${profile}' using ${status.secretStore} secret storage.`,
      );
    }
    return 0;
  } catch (error) {
    return handleMetaAuthError(error, options);
  }
}

export async function statusMarketingMetaAuthCommand(
  options: MarketingMetaAuthCliOptions,
): Promise<number> {
  try {
    const status = await getMarketingMetaAuthStatus({ profile: options.profile, runtime: options });
    if (options.json) printJson(status);
    else if (!status.configured)
      log.warn(`Marketing Meta auth profile '${status.profile}' is not configured.`);
    else {
      log.section('Marketing Meta Auth');
      log.info(`Profile: ${status.profile}`);
      log.info(`Secret store: ${status.secretStore}`);
      log.info(`Access token: ${status.accessTokenStored ? 'stored' : 'missing'}`);
      log.info(`Scopes: ${status.scopes.join(', ')}`);
    }
    return marketingMetaAuthReady(status) ? 0 : 1;
  } catch (error) {
    return handleMetaAuthError(error, options);
  }
}

export async function tokenMarketingMetaAuthCommand(
  options: MarketingMetaAuthCliOptions,
): Promise<number> {
  try {
    const profile = profileName(options.profile);
    const accessToken = await resolveMarketingMetaAccessToken({
      authProfile: profile,
      runtime: options,
    });
    if (options.print) {
      if (options.json) printJson({ ok: true, profile, accessToken });
      else console.log(accessToken);
    } else if (options.json) printJson({ ok: true, profile });
    else log.success(`Resolved Marketing Meta access token for profile '${profile}'.`);
    return 0;
  } catch (error) {
    return handleMetaAuthError(error, options);
  }
}

export async function logoutMarketingMetaAuthCommand(
  options: MarketingMetaAuthCliOptions,
): Promise<number> {
  try {
    const profile = profileName(options.profile);
    await deleteMarketingMetaAuthProfile({ profile, runtime: options });
    if (options.json) printJson({ ok: true, profile, deleted: true });
    else log.success(`Deleted Marketing Meta auth profile '${profile}'.`);
    return 0;
  } catch (error) {
    return handleMetaAuthError(error, options);
  }
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function handleMetaAuthError(error: unknown, options: MarketingMetaAuthCliOptions): number {
  const message =
    error instanceof Error ? error.message : 'Unknown Marketing Meta auth command error';
  if (options.json) printJson({ ok: false, error: message });
  else log.error(message);
  return 1;
}
