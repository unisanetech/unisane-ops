import type {
  MarketingProviderReportArtifact,
  MarketingProviderReportType,
  MarketingReportMetrics,
} from '../schema/report.js';

export type ReportWindowInput = {
  startDate?: string;
  endDate?: string;
  timeZone?: string;
};

export type ProviderReportNormalizeOptions = {
  platformId: string;
  appId: string;
  accountId?: string;
  pulledAt: string;
  source: MarketingProviderReportArtifact['source'];
  reportType?: MarketingProviderReportType;
  window?: ReportWindowInput;
};

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseFloat(value.replaceAll(',', ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function microsToCurrency(value: unknown): number | undefined {
  const parsed = optionalNumber(value);
  return parsed === undefined ? undefined : parsed / 1_000_000;
}

export function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = optionalString(record[key]);
    if (value) return value;
  }
  return undefined;
}

export function pickNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = optionalNumber(record[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

export function resolveWindow(
  value: unknown,
  options: ProviderReportNormalizeOptions,
): MarketingProviderReportArtifact['window'] {
  const root = asRecord(value);
  const rawWindow = asRecord(root.window);
  const dateRange = asRecord(root.dateRange);
  const firstDateRange = asRecord(asArray(root.dateRanges)[0]);
  const startDate =
    options.window?.startDate ??
    optionalString(rawWindow.startDate) ??
    optionalString(dateRange.startDate) ??
    optionalString(firstDateRange.startDate);
  const endDate =
    options.window?.endDate ??
    optionalString(rawWindow.endDate) ??
    optionalString(dateRange.endDate) ??
    optionalString(firstDateRange.endDate);

  if (!startDate || !endDate) {
    throw new Error(
      '[MARKETING_PROVIDER_REPORT_WINDOW_REQUIRED] Provider report input must include window.startDate/window.endDate or pass --start-date and --end-date.',
    );
  }

  return {
    startDate,
    endDate,
    timeZone:
      options.window?.timeZone ??
      optionalString(rawWindow.timeZone) ??
      optionalString(root.timeZone),
  };
}

export function compactMetrics(metrics: MarketingReportMetrics): MarketingReportMetrics {
  const compacted: MarketingReportMetrics = {};
  for (const [key, value] of Object.entries(metrics)) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      compacted[key as keyof MarketingReportMetrics] = value;
    }
  }
  return compacted;
}
