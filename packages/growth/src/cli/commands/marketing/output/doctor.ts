import { log } from '../../../log.js';
import type {
  MarketingDoctorReport,
  MarketingProviderPullResult,
  MarketingProviderReportStatusReport,
  MarketingRegistryValidationReport,
  MarketingTrackingAuditReport,
} from '@unisane/growth/marketing';

export function printMarketingDoctorReport(report: MarketingDoctorReport): void {
  log.section('Marketing Control Plane');
  if (report.configPath) log.info(`Config: ${report.configPath}`);
  if (report.appId) log.info(`App: ${report.appId}`);
  if (report.platformId) log.info(`Platform: ${report.platformId}`);
  if (report.providers?.length) {
    log.info(
      `Providers: ${report.providers
        .map((provider) => `${provider.id}=${provider.state}${provider.configured ? ':ready' : ''}`)
        .join(', ')}`,
    );
  }
  if (report.auth?.google) {
    const status = report.auth.google;
    if (status.configured) {
      log.info(`Google auth: profile=${status.profile} scopes=${status.scopes.length}`);
    } else {
      log.info(`Google auth: profile=${status.profile}:not-configured`);
    }
  }
  if (report.auth?.meta) {
    const status = report.auth.meta;
    if (status.configured) {
      log.info(
        `Meta auth: profile=${status.profile} token=${status.accessTokenStored ? 'stored' : 'missing'}`,
      );
    } else {
      log.info(`Meta auth: profile=${status.profile}:not-configured`);
    }
  }
  if (report.artifacts?.length) {
    const staleArtifacts = report.artifacts.filter(
      (artifact) => artifact.exists && artifact.ageDays !== undefined,
    );
    if (staleArtifacts.length) {
      log.info(
        `Artifacts: ${staleArtifacts
          .map((artifact) => `${artifact.id}=${artifact.ageDays}d`)
          .join(', ')}`,
      );
    }
  }
  if (report.nextWorkflowStep) log.info(`Next: ${report.nextWorkflowStep}`);

  for (const check of report.checks) {
    const line = `${check.id}: ${check.message}`;
    if (check.status === 'pass') log.success(line);
    else if (check.status === 'error') log.error(line);
    else if (check.status === 'warn') log.warn(line);
    else log.dim(`SKIP ${line}`);
  }
}

export function printMarketingRegistryReport(report: MarketingRegistryValidationReport): void {
  log.section('Marketing Registries');
  if (report.eventRegistryPath) log.info(`Events: ${report.eventRegistryPath}`);
  if (report.conversionRegistryPath) log.info(`Conversions: ${report.conversionRegistryPath}`);
  log.info(`Events: ${report.eventCount}`);
  log.info(`Conversions: ${report.conversionCount}`);

  for (const check of report.checks) {
    const line = `${check.id}: ${check.message}`;
    if (check.status === 'pass') log.success(line);
    else if (check.status === 'error') log.error(line);
    else log.warn(line);
  }
}

export function printMarketingTrackingAuditReport(report: MarketingTrackingAuditReport): void {
  log.section('Marketing Tracking Audit');
  log.info(`Scanned files: ${report.scannedFileCount}`);

  for (const check of report.checks) {
    const pathSuffix = check.path ? ` (${check.path})` : '';
    const line = `${check.id}: ${check.message}${pathSuffix}`;
    if (check.status === 'pass') log.success(line);
    else if (check.status === 'error') log.error(line);
    else log.warn(line);
  }
}

export function printMarketingProviderPullResult(report: MarketingProviderPullResult): void {
  log.section('Marketing Provider Pull');
  log.info(`Provider: ${report.provider}`);
  if (report.reportType) log.info(`Report: ${report.reportType}`);
  log.info(`Records: ${report.recordCount}`);
  log.info(`Window: ${report.window.startDate} to ${report.window.endDate}`);
  log.success(`Cached: ${report.latestPath}`);
}

export function printMarketingProviderReportStatus(
  report: MarketingProviderReportStatusReport,
): void {
  log.section('Marketing Provider Reports');
  log.info(`Cache: ${report.cacheRoot}`);
  log.info(`Freshness max age: ${report.maxAgeDays}d`);
  log.info(`Next: ${report.nextWorkflowStep}`);

  for (const provider of report.providers) {
    const suffix =
      provider.recordCount === undefined
        ? ''
        : ` records=${provider.recordCount} age=${provider.ageDays ?? 0}d`;
    const label = provider.reportType
      ? `${provider.provider}/${provider.reportType}`
      : provider.provider;
    const line = `${label}: ${provider.message}${suffix}`;
    if (provider.status === 'fresh') log.success(line);
    else if (provider.status === 'error') log.error(line);
    else log.warn(line);
  }
}
