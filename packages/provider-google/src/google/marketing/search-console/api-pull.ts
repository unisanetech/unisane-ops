import type { ProviderApiPullContext, ProviderApiPullPayload } from '@unisane/growth/contracts';
import { asArray, asRecord, readJsonResponse } from '../transport-utils.js';

type SearchConsoleReportType =
  | 'queryPage'
  | 'page'
  | 'query'
  | 'country'
  | 'device'
  | 'searchAppearance';

function resolveSearchConsoleReportType(input: ProviderApiPullContext): SearchConsoleReportType {
  const reportType = input.options.reportType ?? 'queryPage';
  if (
    reportType === 'queryPage' ||
    reportType === 'page' ||
    reportType === 'query' ||
    reportType === 'country' ||
    reportType === 'device' ||
    reportType === 'searchAppearance'
  ) {
    return reportType;
  }
  throw new Error(
    `[MARKETING_SEARCH_CONSOLE_REPORT_UNSUPPORTED] Search Console report is not supported: ${reportType}.`,
  );
}

function searchConsoleDimensions(reportType: SearchConsoleReportType): string[] {
  if (reportType === 'queryPage') return ['query', 'page'];
  return [reportType];
}

export async function pullSearchConsoleReport(
  input: ProviderApiPullContext,
): Promise<ProviderApiPullPayload<'search-console'>> {
  const siteUrl = input.options.accountId;
  if (!siteUrl) {
    throw new Error('[MARKETING_SEARCH_CONSOLE_SITE_REQUIRED] Select a Search Console site.');
  }
  const accessToken = input.credentials?.accessToken;
  if (!accessToken) {
    throw new Error(
      '[MARKETING_SEARCH_CONSOLE_CONNECTION_REQUIRED] Search Console requires a canonical Google connection.',
    );
  }
  const rowLimit = input.options.pageSize ?? 25_000;
  const maxPages = input.options.maxPages ?? 2;
  const reportType = resolveSearchConsoleReportType(input);
  const dimensions = searchConsoleDimensions(reportType);
  const rows: unknown[] = [];
  let startRow = 0;
  for (let page = 0; page < maxPages; page += 1) {
    const value = asRecord(
      await readJsonResponse(
        await input.fetch(
          `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${accessToken}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              startDate: input.options.startDate,
              endDate: input.options.endDate,
              dimensions,
              rowLimit,
              startRow,
            }),
          },
        ),
        'searchConsole',
      ),
    );
    const pageRows = asArray(value.rows);
    rows.push(...pageRows);
    if (pageRows.length < rowLimit) {
      return {
        accountId: siteUrl,
        inputFormat: 'search-console',
        reportType: input.options.reportType ? reportType : undefined,
        value: {
          rows,
          partial: false,
          window: {
            startDate: input.options.startDate,
            endDate: input.options.endDate,
            timeZone: input.options.timeZone,
          },
          siteUrl,
          reportType,
          dimensions,
        },
      };
    }
    startRow += pageRows.length;
  }

  return {
    accountId: siteUrl,
    inputFormat: 'search-console',
    reportType: input.options.reportType ? reportType : undefined,
    value: {
      rows,
      partial: true,
      window: {
        startDate: input.options.startDate,
        endDate: input.options.endDate,
        timeZone: input.options.timeZone,
      },
      siteUrl,
      reportType,
      dimensions,
    },
  };
}
