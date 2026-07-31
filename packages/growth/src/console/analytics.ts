import type {
  MarketingProviderReportRecord,
  MarketingTrackingAuditReport,
} from '@unisane/growth/marketing';
import type {
  MarketingConsoleAnalytics,
  MarketingConsoleConnection,
  MarketingConsoleFreshnessCell,
  MarketingConsoleMetric,
  MarketingConsoleStatus,
  MarketingConsoleTagManager,
} from './contracts.js';

export type BuildMarketingConsoleAnalyticsInput = {
  metrics: MarketingConsoleMetric[];
  traffic: MarketingProviderReportRecord[];
  visitors: MarketingProviderReportRecord[];
  conversions: MarketingProviderReportRecord[];
  freshness: MarketingConsoleFreshnessCell[];
  connections: MarketingConsoleConnection[];
  tagManager: MarketingConsoleTagManager;
  trackingAudit: MarketingTrackingAuditReport;
};

const analyticsMetricIds = new Set(['sessions', 'users', 'analytics-conversions', 'revenue']);

export function buildMarketingConsoleAnalytics(
  input: BuildMarketingConsoleAnalyticsInput,
): MarketingConsoleAnalytics {
  const sources = input.freshness.filter((cell) => cell.provider === 'ga4');
  const primarySource =
    sources.find((cell) => cell.reportType === 'channel') ??
    sources.find((cell) => cell.reportType === 'landingPage') ??
    sources[0];
  const traffic = projectRows(input.traffic, (record) => record.channel ?? record.name);
  const visitors = projectRows(input.visitors, (record) => record.pageUrl ?? record.name);
  const conversions = projectRows(
    input.conversions,
    (record) => record.sourceMedium ?? record.channel ?? record.name,
  ).filter((row) => row.conversions !== undefined);
  const available = traffic.length > 0 || visitors.length > 0 || conversions.length > 0;
  const google = input.connections.find((connection) => connection.provider === 'google');
  const analyticsService = google?.services.find((service) => service.id === 'analytics');
  const checks = [
    {
      id: 'instrumentation-audit',
      label: 'Instrumentation audit',
      status: auditStatus(input.trackingAudit),
      detail: input.trackingAudit.readiness.summary,
    },
    {
      id: 'analytics-access',
      label: 'Google Analytics access',
      status: connectionStatus(analyticsService?.state),
      detail:
        analyticsService?.issue ??
        analyticsService?.dataLabel ??
        'Connect Google Analytics and select the property used by this site.',
    },
    {
      id: 'analytics-reports',
      label: 'Analytics reports',
      status: reportStatus(sources),
      detail: reportDetail(sources),
    },
    {
      id: 'tag-manager',
      label: 'Tag Manager configuration',
      status: input.tagManager.status,
      detail: input.tagManager.headline,
    },
  ];
  const trackingStatus = combineStatuses(checks.map((check) => check.status));

  return {
    source: {
      status: primarySource?.status ?? 'missing',
      label: 'Google Analytics',
      freshnessLabel: freshnessLabel(primarySource),
      detail:
        primarySource?.message ??
        'Connect Google Analytics and pull reports before evaluating visitor behavior.',
      available,
    },
    headline: available
      ? primarySource?.status === 'ready'
        ? 'Analytics has usable visitor and traffic evidence.'
        : 'Historical analytics evidence needs an update.'
      : 'Analytics does not have usable visitor data yet.',
    detail: available
      ? 'Use these reports to understand acquisition and outcomes; comparison appears only when a prior period exists.'
      : 'Empty provider reports are not treated as zero traffic. Refresh the selected Analytics property to populate this section.',
    metrics: input.metrics.filter(
      (metric) => analyticsMetricIds.has(metric.id) && metric.sourceLabel === 'Google Analytics',
    ),
    traffic,
    visitors,
    conversions,
    trackingHealth: {
      status: trackingStatus,
      headline:
        input.trackingAudit.summary.status === 'ready'
          ? 'Tracking evidence matches the expected measurement plan.'
          : input.trackingAudit.summary.status === 'blocked'
            ? 'Tracking conflicts make conversion evidence unreliable.'
            : 'Tracking evidence is incomplete and needs review.',
      detail: input.trackingAudit.observationArtifactPath
        ? 'Source, tag configuration, and observed browser/server events were reconciled without changing the site or any provider.'
        : 'Source and tag configuration were inspected, but browser/server observations are not available yet.',
      checks,
      audit: {
        mode: input.trackingAudit.mode,
        generatedAt: input.trackingAudit.generatedAt,
        status: auditStatus(input.trackingAudit),
        evidenceLabel: input.trackingAudit.observationArtifactPath
          ? `${input.trackingAudit.coverage.observationCount} observed event${input.trackingAudit.coverage.observationCount === 1 ? '' : 's'}`
          : 'Source and manifest evidence only',
        expectedEventCount: input.trackingAudit.coverage.expectedEventCount,
        observedEventCount: input.trackingAudit.coverage.observedEventCount,
        expectedConversionCount: input.trackingAudit.coverage.expectedConversionCount,
        observedConversionCount: input.trackingAudit.coverage.observedConversionCount,
        emitters: input.trackingAudit.emitters.map((emitter) => ({
          id: emitter.id,
          label: emitter.label,
          status: emitter.direct ? 'warn' : 'ready',
          detail: `${emitter.channels.join(' and ')} evidence detected through ${emitter.detectedBy.join(', ')}.`,
        })),
        findings: input.trackingAudit.findings.map((finding) => ({
          id: finding.id,
          category: finding.category,
          status: finding.severity === 'error' ? 'blocked' : 'warn',
          title: finding.title,
          detail: finding.detail,
        })),
      },
    },
  };
}

function auditStatus(report: MarketingTrackingAuditReport): MarketingConsoleStatus {
  if (report.summary.status === 'blocked') return 'blocked';
  if (report.summary.status === 'attention') return 'warn';
  return 'ready';
}

function projectRows(
  records: MarketingProviderReportRecord[],
  label: (record: MarketingProviderReportRecord) => string | undefined,
): MarketingConsoleAnalytics['traffic'] {
  return records
    .map((record) => {
      const conversions =
        record.metrics.keyEvents ?? record.metrics.conversions ?? record.metrics.purchases;
      return {
        id: record.id,
        label: label(record) ?? 'Unlabelled',
        ...(record.metrics.sessions !== undefined ? { sessions: record.metrics.sessions } : {}),
        ...(record.metrics.users !== undefined ? { visitors: record.metrics.users } : {}),
        ...(conversions !== undefined ? { conversions } : {}),
        ...(record.metrics.revenue !== undefined ? { revenue: record.metrics.revenue } : {}),
        ...(record.currency ? { currencyCode: record.currency } : {}),
      };
    })
    .filter(
      (row) =>
        row.sessions !== undefined ||
        row.visitors !== undefined ||
        row.conversions !== undefined ||
        row.revenue !== undefined,
    )
    .sort(
      (left, right) =>
        (right.sessions ?? 0) - (left.sessions ?? 0) ||
        (right.visitors ?? 0) - (left.visitors ?? 0),
    );
}

function connectionStatus(
  state: MarketingConsoleConnection['services'][number]['state'] | undefined,
): MarketingConsoleStatus {
  if (state === 'current') return 'ready';
  if (state === 'expired-access' || state === 'failed') return 'blocked';
  if (state) return 'warn';
  return 'missing';
}

function reportStatus(sources: MarketingConsoleFreshnessCell[]): MarketingConsoleStatus {
  if (!sources.length) return 'missing';
  if (sources.some((source) => source.status === 'blocked')) return 'blocked';
  if (sources.some((source) => source.status !== 'ready')) return 'warn';
  return 'ready';
}

function reportDetail(sources: MarketingConsoleFreshnessCell[]): string {
  if (!sources.length) return 'No Analytics report evidence is available.';
  const usable = sources.filter((source) => (source.recordCount ?? 0) > 0);
  if (!usable.length) {
    return 'The cached Analytics reports contain no rows; this is unavailable data, not confirmed zero traffic.';
  }
  const oldest = Math.max(...usable.map((source) => source.ageDays ?? 0));
  return oldest === 0
    ? `${usable.length} Analytics report${usable.length === 1 ? '' : 's'} updated today.`
    : `${usable.length} usable Analytics report${usable.length === 1 ? '' : 's'}; the oldest is ${oldest} days old.`;
}

function freshnessLabel(cell: MarketingConsoleFreshnessCell | undefined): string {
  if (!cell) return 'No usable Analytics report';
  if ((cell.recordCount ?? 0) === 0) return 'No rows in latest report';
  if (cell.ageDays === 0) return 'Updated today';
  if (cell.ageDays !== undefined) return `${cell.ageDays} days old`;
  return cell.status === 'ready' ? 'Current' : 'Update needed';
}

function combineStatuses(statuses: MarketingConsoleStatus[]): MarketingConsoleStatus {
  if (statuses.some((status) => status === 'blocked')) return 'blocked';
  if (statuses.some((status) => status === 'missing')) return 'missing';
  if (statuses.some((status) => status === 'warn')) return 'warn';
  return 'ready';
}
