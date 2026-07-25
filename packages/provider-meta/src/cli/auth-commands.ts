import { log } from '@unisane/cli-core';
import {
  deleteMarketingMetaAuthProfile,
  getMarketingMetaAuthStatus,
  resolveMarketingMetaAccessToken,
  saveMarketingMetaAuthProfile,
  type MarketingMetaAuthRuntimeOptions,
} from '../meta/auth.js';

const DEFAULT_ACCESS_TOKEN_ENV = 'META_ADS_ACCESS_TOKEN';
const PROFILE_ENV = 'UNISANE_MARKETING_META_AUTH_PROFILE';

export type MarketingMetaAuthCliOptions = MarketingMetaAuthRuntimeOptions & {
  profile?: string;
  cwd?: string;
  accessTokenEnv?: string;
  scopes?: string;
  expiresAt?: string;
  print?: boolean;
  json?: boolean;
};

function profileName(value?: string): string {
  return (value ?? process.env[PROFILE_ENV] ?? 'default').trim();
}

function parseScopes(value: string | undefined): readonly string[] {
  return (value ?? '')
    .split(/[,\s]+/g)
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function handleError(error: unknown, options: MarketingMetaAuthCliOptions): number {
  const message = error instanceof Error ? error.message : 'Unknown Meta auth command error';
  if (options.json) printJson({ ok: false, error: message });
  else log.error(message);
  return 1;
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
      log.success(`Saved Meta auth profile '${profile}' using ${status.secretStore} storage.`);
    }
    return 0;
  } catch (error) {
    return handleError(error, options);
  }
}

export async function statusMarketingMetaAuthCommand(
  options: MarketingMetaAuthCliOptions,
): Promise<number> {
  try {
    const status = await getMarketingMetaAuthStatus({ profile: options.profile, runtime: options });
    if (options.json) printJson(status);
    else if (!status.configured)
      log.warn(`Meta auth profile '${status.profile}' is not configured.`);
    else {
      log.section('Meta Auth');
      log.info(`Profile: ${status.profile}`);
      log.info(`Secret store: ${status.secretStore}`);
      log.info(`Access token: ${status.accessTokenStored ? 'stored' : 'missing'}`);
      log.info(`Scopes: ${status.scopes.join(', ')}`);
    }
    return status.configured && status.accessTokenStored ? 0 : 1;
  } catch (error) {
    return handleError(error, options);
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
    else log.success(`Resolved Meta access token for profile '${profile}'.`);
    return 0;
  } catch (error) {
    return handleError(error, options);
  }
}

export async function logoutMarketingMetaAuthCommand(
  options: MarketingMetaAuthCliOptions,
): Promise<number> {
  try {
    const profile = profileName(options.profile);
    await deleteMarketingMetaAuthProfile({ profile, runtime: options });
    if (options.json) printJson({ ok: true, profile, deleted: true });
    else log.success(`Deleted Meta auth profile '${profile}'.`);
    return 0;
  } catch (error) {
    return handleError(error, options);
  }
}
