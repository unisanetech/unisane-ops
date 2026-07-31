import { log } from '../../../log.js';
import type {
  MarketingProviderPullResult,
  MarketingProviderReportStatusReport,
  MarketingRegistryValidationReport,
  MarketingTrackingAuditReport,
} from '@unisane/growth/marketing';

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
  log.info(`Mode: ${report.mode}`);
  log.info(`Environment: ${report.environment}`);
  log.info(`Scanned files: ${report.scannedFileCount}`);
  log.info(
    `Observed events: ${report.coverage.observedEventCount}/${report.coverage.expectedEventCount}`,
  );
  log.info(
    `Observed conversions: ${report.coverage.observedConversionCount}/${report.coverage.expectedConversionCount}`,
  );
  log.info(`Emitters: ${report.emitters.map((emitter) => emitter.label).join(', ') || 'None'}`);

  for (const finding of report.findings) {
    const line = `${finding.title}: ${finding.detail}`;
    if (finding.severity === 'error') log.error(line);
    else log.warn(line);
  }

  log.section('Technical Checks');
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
