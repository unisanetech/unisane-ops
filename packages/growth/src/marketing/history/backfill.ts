import type { MarketingProviderReportType, MarketingReportProvider } from '../schema/report.js';

const DAY_MS = 86_400_000;
const MAX_BACKFILL_DAYS = 366;

export type MarketingHistoryBackfillTarget = {
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
  accountId?: string;
};

export type MarketingHistoryBackfillWindow = {
  startDate: string;
  endDate: string;
};

export type MarketingHistoryBackfillPlan = {
  target: MarketingHistoryBackfillTarget;
  requestedStartDate: string;
  requestedEndDate: string;
  afterDate?: string;
  windows: MarketingHistoryBackfillWindow[];
  complete: boolean;
  nextAfterDate?: string;
};

export type MarketingHistoryBackfillResult = {
  status: 'complete' | 'continuation-required' | 'failed';
  plan: MarketingHistoryBackfillPlan;
  completedDates: string[];
  observationIds: string[];
  resumeAfterDate?: string;
  failure?: { date: string; message: string };
};

function parseDate(value: string, field: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`[MARKETING_HISTORY_BACKFILL_DATE_INVALID] ${field} must use YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (date.toISOString().slice(0, 10) !== value) {
    throw new Error(`[MARKETING_HISTORY_BACKFILL_DATE_INVALID] ${field} is not a valid date.`);
  }
  return date;
}

function dateText(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function nextDay(value: Date): Date {
  return new Date(value.getTime() + DAY_MS);
}

export function planMarketingHistoryBackfill(input: {
  target: MarketingHistoryBackfillTarget;
  startDate: string;
  endDate: string;
  afterDate?: string;
  maxDays?: number;
}): MarketingHistoryBackfillPlan {
  const requestedStart = parseDate(input.startDate, 'startDate');
  const requestedEnd = parseDate(input.endDate, 'endDate');
  if (requestedStart > requestedEnd) {
    throw new Error(
      '[MARKETING_HISTORY_BACKFILL_RANGE_INVALID] startDate must be before or equal to endDate.',
    );
  }
  const maxDays = Math.min(Math.max(Math.trunc(input.maxDays ?? 90), 1), MAX_BACKFILL_DAYS);
  const after = input.afterDate ? parseDate(input.afterDate, 'afterDate') : undefined;
  let cursor = after && after >= requestedStart ? nextDay(after) : requestedStart;
  const windows: MarketingHistoryBackfillWindow[] = [];
  while (cursor <= requestedEnd && windows.length < maxDays) {
    const date = dateText(cursor);
    windows.push({ startDate: date, endDate: date });
    cursor = nextDay(cursor);
  }
  const complete = cursor > requestedEnd;
  return {
    target: input.target,
    requestedStartDate: input.startDate,
    requestedEndDate: input.endDate,
    ...(input.afterDate ? { afterDate: input.afterDate } : {}),
    windows,
    complete,
    ...(!complete && windows.length > 0 ? { nextAfterDate: windows.at(-1)!.endDate } : {}),
  };
}

export async function executeMarketingHistoryBackfill(input: {
  plan: MarketingHistoryBackfillPlan;
  pullDay: (
    target: MarketingHistoryBackfillTarget,
    window: MarketingHistoryBackfillWindow,
  ) => Promise<{ historyObservationId: string }>;
}): Promise<MarketingHistoryBackfillResult> {
  const completedDates: string[] = [];
  const observationIds: string[] = [];
  for (const window of input.plan.windows) {
    try {
      const result = await input.pullDay(input.plan.target, window);
      completedDates.push(window.startDate);
      observationIds.push(result.historyObservationId);
    } catch (error) {
      return {
        status: 'failed',
        plan: input.plan,
        completedDates,
        observationIds,
        ...(completedDates.length > 0
          ? { resumeAfterDate: completedDates.at(-1) }
          : input.plan.afterDate
            ? { resumeAfterDate: input.plan.afterDate }
            : {}),
        failure: {
          date: window.startDate,
          message: error instanceof Error ? error.message : 'The provider pull failed.',
        },
      };
    }
  }
  return {
    status: input.plan.complete ? 'complete' : 'continuation-required',
    plan: input.plan,
    completedDates,
    observationIds,
    ...(!input.plan.complete && completedDates.length > 0
      ? { resumeAfterDate: completedDates.at(-1) }
      : {}),
  };
}
