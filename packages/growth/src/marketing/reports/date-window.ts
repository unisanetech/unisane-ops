import { marketingReportWindowSchema } from '../schema/report.js';

export type MarketingReportWindowInput = {
  startDate?: string;
  endDate?: string;
  timeZone?: string;
};

export function parseMarketingReportWindow(input: MarketingReportWindowInput): {
  startDate: string;
  endDate: string;
  timeZone?: string;
} {
  const window = marketingReportWindowSchema.parse(input);
  if (window.startDate > window.endDate) {
    throw new Error(
      '[MARKETING_REPORT_DATE_RANGE_INVALID] startDate must be before or equal to endDate.',
    );
  }
  return window;
}
