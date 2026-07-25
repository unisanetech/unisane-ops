import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { log } from '../../../log.js';
import {
  createMarketingGoogleAdsTestClient,
  loadMarketingConfig,
  MARKETING_GOOGLE_ADS_SCOPE,
  verifyMarketingGoogleAdsApiSetup,
  type MarketingGoogleAdsTestClientCreateResult,
  type MarketingGoogleAdsApiSetupReport,
} from '@unisane/growth/marketing';
import { resolveMarketingGoogleAccessToken } from '../../marketing/auth/google.js';
import { resolveMarketingGoogleProfile } from '../../marketing/profile-defaults.js';
import type { AdsCliOptions } from '../options.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printReport(report: MarketingGoogleAdsApiSetupReport): void {
  log.section('Google Ads API Setup');
  log.info(report.message);
  if (report.configuredCustomerId) log.info(`Configured customer: ${report.configuredCustomerId}`);
  if (report.loginCustomerId) log.info(`Login customer: ${report.loginCustomerId}`);
  if (report.accessibleCustomerIds.length > 0) {
    log.info(`Accessible customers: ${report.accessibleCustomerIds.join(', ')}`);
  }
  for (const customer of report.customers) {
    const flags = [
      customer.testAccount ? 'test' : undefined,
      customer.manager ? 'manager' : undefined,
      customer.status,
    ].filter((entry): entry is string => Boolean(entry));
    const name = customer.descriptiveName ? ` ${customer.descriptiveName}` : '';
    log.info(
      `Customer ${customer.id}${name}: ${customer.apiStatus}${flags.length > 0 ? ` (${flags.join(', ')})` : ''}`,
    );
  }
  for (const action of report.nextActions) {
    log.info(`Next: ${action}`);
  }
}

function printCreateResult(
  result: MarketingGoogleAdsTestClientCreateResult,
  envPath?: string,
): void {
  log.section('Google Ads Test Client');
  log.info(result.message);
  if (result.customerId) log.info(`Customer id: ${result.customerId}`);
  if (result.resourceName) log.info(`Resource: ${result.resourceName}`);
  if (envPath) log.info(`Updated env: ${envPath}`);
}

function updateEnvValue(args: { cwd?: string; name: string; value: string }): string {
  const cwd = path.resolve(args.cwd ?? process.cwd());
  const envPath = path.join(cwd, '.env.local');
  const line = `${args.name}=${args.value}`;
  const text = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const lines = text ? text.split('\n') : [];
  let replaced = false;
  const updated = lines.map((entry) => {
    if (entry.trimStart().startsWith(`${args.name}=`)) {
      replaced = true;
      return line;
    }
    return entry;
  });
  if (!replaced) {
    if (updated.length > 0 && updated[updated.length - 1] !== '') updated.push('');
    updated.push(line);
  }
  writeFileSync(envPath, `${updated.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
  process.env[args.name] = args.value;
  return envPath;
}

export async function adsSetupGoogle(options: AdsCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const authProfile = resolveMarketingGoogleProfile(loaded.config, options);
    const accessToken = await resolveMarketingGoogleAccessToken({
      authProfile,
      requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
    });
    const report = await verifyMarketingGoogleAdsApiSetup(loaded.config, {
      accessToken,
      accountId: options.accountId,
      managerCustomerId: options.managerCustomerId,
      apiVersion: options.apiVersion,
    });
    if (options.json) printJson(report);
    else printReport(report);
    return report.ok ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google Ads setup error.';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}

export async function adsSetupGoogleTestClient(options: AdsCliOptions): Promise<number> {
  try {
    if (!options.managerCustomerId) {
      throw new Error('[ADS_SETUP_GOOGLE_MANAGER_REQUIRED] Pass --manager-customer-id <id>.');
    }
    if (!options.yes && !options.dryRun) {
      throw new Error(
        '[ADS_SETUP_GOOGLE_CONFIRM_REQUIRED] Pass --dry-run to validate or --yes to create a Google Ads client customer.',
      );
    }
    const loaded = await loadMarketingConfig({
      cwd: options.cwd,
      configPath: options.config,
    });
    const authProfile = resolveMarketingGoogleProfile(loaded.config, options);
    const accessToken = await resolveMarketingGoogleAccessToken({
      authProfile,
      requiredScope: MARKETING_GOOGLE_ADS_SCOPE,
    });
    const result = await createMarketingGoogleAdsTestClient(loaded.config, {
      accessToken,
      managerCustomerId: options.managerCustomerId,
      descriptiveName: options.name ?? `Unisane TrueResume API Test ${new Date().toISOString()}`,
      currencyCode: options.currency ?? 'USD',
      timeZone: options.timeZone ?? 'Asia/Kolkata',
      validateOnly: Boolean(options.dryRun),
      apiVersion: options.apiVersion,
    });
    const providerAccountEnv = loaded.config.providers.googleAds.accountIdEnv;
    const envPath =
      options.updateEnv && result.customerId && providerAccountEnv
        ? updateEnvValue({ cwd: options.cwd, name: providerAccountEnv, value: result.customerId })
        : undefined;
    if (options.json) printJson({ ...result, envPath });
    else printCreateResult(result, envPath);
    return result.ok ? 0 : 1;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Google Ads test client error.';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
