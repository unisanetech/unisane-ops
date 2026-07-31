import type {
  MarketingConsoleAutomation,
  MarketingConsoleAutomations,
  MarketingConsoleConnection,
  MarketingConsoleFreshnessCell,
} from './contracts.js';
import type {
  MarketingProviderReportType,
  MarketingReportProvider,
} from '@unisane/growth/marketing';

type ScheduleJob = {
  id: string;
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
  cadence: 'daily' | 'weekly';
  windowDays: number;
  status?: 'ready' | 'blocked';
  blocker?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function scheduleJobs(schedule: Record<string, unknown> | undefined): ScheduleJob[] {
  if (!Array.isArray(schedule?.jobs)) return [];
  return schedule.jobs.flatMap((value) => {
    if (!isRecord(value)) return [];
    const provider = value.provider;
    const reportType = value.reportType;
    const cadence = value.cadence;
    const windowDays = value.windowDays;
    if (
      !['googleAds', 'metaAds', 'ga4', 'searchConsole'].includes(String(provider)) ||
      typeof reportType !== 'string' ||
      !['daily', 'weekly'].includes(String(cadence)) ||
      typeof windowDays !== 'number'
    ) {
      return [];
    }
    return [
      {
        id: typeof value.id === 'string' ? value.id : `${provider}.${reportType}.${cadence}`,
        provider: provider as MarketingReportProvider,
        reportType: reportType as MarketingProviderReportType,
        cadence: cadence as ScheduleJob['cadence'],
        windowDays,
        ...(value.status === 'ready' || value.status === 'blocked' ? { status: value.status } : {}),
        ...(typeof value.blocker === 'string' ? { blocker: value.blocker } : {}),
      },
    ];
  });
}

function providerService(provider: MarketingReportProvider): string {
  if (provider === 'googleAds') return 'ads';
  if (provider === 'ga4') return 'analytics';
  if (provider === 'searchConsole') return 'search-console';
  return 'ads';
}

function selectedConnection(
  provider: MarketingReportProvider,
  connections: readonly MarketingConsoleConnection[],
): MarketingConsoleConnection | undefined {
  const connection = connections.find(
    (item) => item.connected && item.provider === (provider === 'metaAds' ? 'meta' : 'google'),
  );
  if (!connection) return undefined;
  return connection.services.some((service) => service.id === providerService(provider))
    ? connection
    : undefined;
}

function providerLabel(provider: MarketingReportProvider): string {
  if (provider === 'googleAds') return 'Google Ads';
  if (provider === 'ga4') return 'Google Analytics';
  if (provider === 'searchConsole') return 'Search Console';
  return 'Meta Ads';
}

function reportLabel(reportType: MarketingProviderReportType): string {
  return reportType
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function purpose(
  provider: MarketingReportProvider,
  reportType: MarketingProviderReportType,
): string {
  if (provider === 'googleAds' && reportType === 'campaign') {
    return 'Keep campaign delivery, budgets, bidding, and performance current.';
  }
  if (provider === 'googleAds' && reportType === 'keyword') {
    return 'Keep paid keyword performance available for targeting decisions.';
  }
  if (provider === 'googleAds' && reportType === 'conversion') {
    return 'Keep configured advertising conversion actions current.';
  }
  if (provider === 'googleAds' && reportType === 'auctionInsight') {
    return 'Monitor visible competitor pressure when Google permits the metrics.';
  }
  if (provider === 'ga4') return `Keep ${reportLabel(reportType).toLowerCase()} analytics current.`;
  if (provider === 'searchConsole') {
    return `Keep ${reportLabel(reportType).toLowerCase()} search visibility current.`;
  }
  return `Keep ${reportLabel(reportType).toLowerCase()} advertising evidence current.`;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function runWindow(now: Date, windowDays: number): { startDate: string; endDate: string } {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - windowDays);
  return { startDate: isoDate(start), endDate: isoDate(now) };
}

function blockerMessage(blocker: string | undefined): string | undefined {
  if (!blocker) return undefined;
  if (blocker.includes('conversion-pull')) {
    return 'Refresh Unisane-confirmed conversion truth before activating scheduled reporting.';
  }
  return 'Resolve the recorded reporting-plan dependency before activating this automation.';
}

function automationFor(input: {
  job: ScheduleJob;
  connection: MarketingConsoleConnection;
  freshness: readonly MarketingConsoleFreshnessCell[];
  now: Date;
  schedulePath?: string;
}): MarketingConsoleAutomation {
  const latest = input.freshness.find(
    (cell) => cell.provider === input.job.provider && cell.reportType === input.job.reportType,
  );
  const window = runWindow(input.now, input.job.windowDays);
  const connectionFlag = input.connection.connectionId
    ? ` --connection ${input.connection.connectionId}`
    : '';
  const runCommand = `unisane growth marketing pull-api --cwd . --provider ${input.job.provider} --report ${input.job.reportType} --start-date ${window.startDate} --end-date ${window.endDate}${connectionFlag}`;
  const editCommand = `unisane growth marketing schedule reporting --cwd . --cadence ${input.job.cadence} --window-days ${input.job.windowDays}${connectionFlag}`;
  const scheduleBlocker = blockerMessage(input.job.blocker);
  return {
    id: input.job.id,
    name: `${providerLabel(input.job.provider)} ${reportLabel(input.job.reportType)}`,
    purpose: purpose(input.job.provider, input.job.reportType),
    providerLabel: providerLabel(input.job.provider),
    status:
      input.job.status === 'blocked' || latest?.status === 'blocked'
        ? 'blocked'
        : latest
          ? 'warn'
          : 'missing',
    statusLabel:
      input.job.status === 'blocked'
        ? 'Blocked'
        : latest?.status === 'blocked'
          ? 'Data update failed'
          : 'Setup required',
    frequencyLabel: input.job.cadence === 'daily' ? 'Daily' : 'Weekly',
    timezoneLabel: 'Not recorded',
    ...(latest?.pulledAt ? { lastSuccessAt: latest.pulledAt } : {}),
    lastSuccessLabel:
      latest?.status === 'ready'
        ? latest.ageDays === 0
          ? 'Updated today'
          : `Updated ${latest.ageDays ?? 0} days ago`
        : 'No successful update recorded',
    nextRunLabel: 'Not scheduled',
    ...(scheduleBlocker
      ? { issue: scheduleBlocker }
      : !latest || latest.status !== 'ready'
        ? { issue: latest?.message ?? 'No report evidence exists yet.' }
        : {}),
    runNow: {
      id: `automation.run.${input.job.id}`,
      label: `Run ${reportLabel(input.job.reportType)} update`,
      description: 'Copy the current read-only provider update command.',
      command: runCommand,
    },
    edit: {
      id: `automation.edit.${input.job.id}`,
      label: 'Edit automation setup',
      description: 'Regenerate the local automation plan with the selected cadence and window.',
      command: editCommand,
    },
    technical: {
      reportType: input.job.reportType,
      ...(input.schedulePath ? { schedulePath: input.schedulePath } : {}),
    },
  };
}

export function buildMarketingConsoleAutomations(input: {
  schedule?: Record<string, unknown>;
  schedulePath?: string;
  connections: readonly MarketingConsoleConnection[];
  freshness: readonly MarketingConsoleFreshnessCell[];
  now: Date;
}): MarketingConsoleAutomations {
  const items = scheduleJobs(input.schedule).flatMap((job) => {
    const connection = selectedConnection(job.provider, input.connections);
    return connection
      ? [
          automationFor({
            job,
            connection,
            freshness: input.freshness,
            now: input.now,
            schedulePath: input.schedulePath,
          }),
        ]
      : [];
  });
  const blockedCount = items.filter((item) => item.status === 'blocked').length;
  const firstIssue = items[0]?.issue;
  const sharedIssue =
    firstIssue && items.every((item) => item.issue === firstIssue) ? firstIssue : undefined;
  return {
    status: blockedCount > 0 ? 'blocked' : items.length > 0 ? 'warn' : 'missing',
    headline:
      blockedCount > 0
        ? `${items.length} reporting ${items.length === 1 ? 'automation has' : 'automations have'} a shared activation dependency.`
        : items.length > 0
          ? `${items.length} reporting ${items.length === 1 ? 'automation is' : 'automations are'} planned but not scheduled.`
          : 'No reporting automations are configured.',
    summary: sharedIssue
      ? `${sharedIssue} Current provider updates can still run manually.`
      : items.length > 0
        ? 'The local plan describes safe read-only updates, but no scheduler activation or next-run evidence is recorded.'
        : 'Create a reporting plan after selecting the provider data that should stay current.',
    ...(sharedIssue ? { sharedIssue } : {}),
    items,
  };
}
