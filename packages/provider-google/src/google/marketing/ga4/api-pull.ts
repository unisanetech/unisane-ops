import type { ProviderApiPullContext, ProviderApiPullPayload } from '@unisane/growth/contracts';
import {
  asArray,
  asRecord,
  optionalNumber,
  readJsonResponse,
  resolveEnv,
} from '../transport-utils.js';

type Ga4ReportType = 'event' | 'landingPage' | 'channel' | 'sourceMedium' | 'ecommerce';

function resolveGa4ReportType(input: ProviderApiPullContext): Ga4ReportType {
  const reportType = input.options.reportType ?? 'event';
  if (
    reportType === 'event' ||
    reportType === 'landingPage' ||
    reportType === 'channel' ||
    reportType === 'sourceMedium' ||
    reportType === 'ecommerce'
  ) {
    return reportType;
  }
  throw new Error(`[MARKETING_GA4_REPORT_UNSUPPORTED] GA4 report is not supported: ${reportType}.`);
}

function ga4Dimensions(reportType: Ga4ReportType): Array<{ name: string }> {
  if (reportType === 'landingPage') return [{ name: 'landingPagePlusQueryString' }];
  if (reportType === 'channel') return [{ name: 'sessionDefaultChannelGroup' }];
  if (reportType === 'sourceMedium') return [{ name: 'sessionSourceMedium' }];
  if (reportType === 'ecommerce') return [{ name: 'itemName' }];
  return [{ name: 'eventName' }];
}

function ga4Metrics(reportType: Ga4ReportType): Array<{ name: string }> {
  if (reportType === 'ecommerce') {
    return [
      { name: 'sessions' },
      { name: 'ecommercePurchases' },
      { name: 'purchaseRevenue' },
      { name: 'totalRevenue' },
    ];
  }
  return [
    { name: 'sessions' },
    { name: 'activeUsers' },
    { name: 'keyEvents' },
    { name: 'totalRevenue' },
  ];
}

export async function pullGa4Report(
  input: ProviderApiPullContext,
): Promise<ProviderApiPullPayload<'ga4'>> {
  const provider = input.config.providers.ga4;
  const propertyId =
    input.options.accountId ??
    resolveEnv(
      input.env,
      provider.accountIdEnv,
      'MARKETING_GA4_PROPERTY_ID_REQUIRED',
      'GA4 property id',
    );
  const accessToken = resolveEnv(
    input.env,
    provider.accessTokenEnv,
    'MARKETING_GA4_ACCESS_TOKEN_REQUIRED',
    'GA4 access token',
  );
  const normalizedProperty = propertyId.replace(/^properties\//, '');
  const pageSize = input.options.pageSize ?? 10_000;
  const maxPages = input.options.maxPages ?? 10;
  const reportType = resolveGa4ReportType(input);
  const rows: unknown[] = [];
  let firstResponse: Record<string, unknown> | undefined;
  let offset = 0;
  for (let page = 0; page < maxPages; page += 1) {
    const value = asRecord(
      await readJsonResponse(
        await input.fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${normalizedProperty}:runReport`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${accessToken}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [{ startDate: input.options.startDate, endDate: input.options.endDate }],
              dimensions: ga4Dimensions(reportType),
              metrics: ga4Metrics(reportType),
              limit: String(pageSize),
              offset: String(offset),
            }),
          },
        ),
        'ga4',
      ),
    );
    firstResponse ??= value;
    const pageRows = asArray(value.rows);
    rows.push(...pageRows);
    offset += pageRows.length;
    const rowCount = optionalNumber(value.rowCount);
    if (pageRows.length === 0 || (rowCount !== undefined && offset >= rowCount)) break;
  }

  return {
    accountId: propertyId,
    inputFormat: 'ga4',
    reportType: input.options.reportType ? reportType : undefined,
    value: {
      ...firstResponse,
      rows,
      reportType,
      partial:
        optionalNumber(firstResponse?.rowCount) !== undefined &&
        rows.length < (optionalNumber(firstResponse?.rowCount) ?? 0),
      dateRanges: [{ startDate: input.options.startDate, endDate: input.options.endDate }],
    },
  };
}
