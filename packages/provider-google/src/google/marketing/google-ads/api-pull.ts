import type { ProviderApiPullContext, ProviderApiPullPayload } from '@unisane/growth/contracts';
import { asArray, asRecord, readJsonResponse, resolveEnv } from '../transport-utils.js';

type GoogleAdsReportType =
  | 'account'
  | 'campaign'
  | 'adGroup'
  | 'keyword'
  | 'conversion'
  | 'device'
  | 'query'
  | 'auctionInsight';

function resolveGoogleAdsReportType(input: ProviderApiPullContext): GoogleAdsReportType {
  const reportType = input.options.reportType ?? 'campaign';
  if (
    reportType === 'account' ||
    reportType === 'campaign' ||
    reportType === 'adGroup' ||
    reportType === 'keyword' ||
    reportType === 'conversion' ||
    reportType === 'device' ||
    reportType === 'query' ||
    reportType === 'auctionInsight'
  ) {
    return reportType;
  }
  throw new Error(
    `[MARKETING_GOOGLE_ADS_REPORT_UNSUPPORTED] Google Ads report is not supported: ${reportType}.`,
  );
}

function googleAdsQuery(
  reportType: GoogleAdsReportType,
  startDate: string,
  endDate: string,
): string {
  const metrics =
    'metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value';
  const customerFields = 'customer.currency_code';
  const dateFilter = `segments.date BETWEEN '${startDate}' AND '${endDate}'`;
  if (reportType === 'account') {
    return `SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.auto_tagging_enabled, customer.tracking_url_template, customer.final_url_suffix, customer.conversion_tracking_setting.conversion_tracking_status, ${metrics} FROM customer WHERE ${dateFilter}`;
  }
  if (reportType === 'adGroup') {
    return `SELECT ${customerFields}, campaign.id, campaign.name, ad_group.id, ad_group.name, ${metrics} FROM ad_group WHERE ${dateFilter}`;
  }
  if (reportType === 'keyword') {
    return `SELECT ${customerFields}, campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ${metrics} FROM keyword_view WHERE ${dateFilter}`;
  }
  if (reportType === 'conversion') {
    return 'SELECT conversion_action.resource_name, conversion_action.name, conversion_action.category, conversion_action.status, conversion_action.primary_for_goal FROM conversion_action';
  }
  if (reportType === 'device') {
    return `SELECT ${customerFields}, campaign.id, campaign.name, segments.device, ${metrics} FROM campaign WHERE ${dateFilter}`;
  }
  if (reportType === 'query') {
    return `SELECT ${customerFields}, campaign.id, campaign.name, ad_group.id, ad_group.name, search_term_view.search_term, ${metrics} FROM search_term_view WHERE ${dateFilter}`;
  }
  if (reportType === 'auctionInsight') {
    return `SELECT ${customerFields}, campaign.id, campaign.name, segments.auction_insight_domain, metrics.auction_insight_search_impression_share, metrics.auction_insight_search_overlap_rate, metrics.auction_insight_search_position_above_rate, metrics.auction_insight_search_outranking_share, metrics.auction_insight_search_top_impression_percentage, metrics.auction_insight_search_absolute_top_impression_percentage FROM campaign WHERE ${dateFilter}`;
  }
  return `SELECT ${customerFields}, campaign.id, campaign.name, ${metrics} FROM campaign WHERE ${dateFilter}`;
}

function normalizeGoogleAdsCustomerId(value: string): string {
  return value.replaceAll('-', '');
}

export async function pullGoogleAdsReport(
  input: ProviderApiPullContext,
): Promise<ProviderApiPullPayload<'google-ads'>> {
  const provider = input.config.providers.googleAds;
  const customerId =
    input.options.accountId ??
    resolveEnv(
      input.env,
      provider.accountIdEnv,
      'MARKETING_GOOGLE_ADS_CUSTOMER_ID_REQUIRED',
      'Google Ads customer id',
    );
  const accessToken = resolveEnv(
    input.env,
    provider.accessTokenEnv,
    'MARKETING_GOOGLE_ADS_ACCESS_TOKEN_REQUIRED',
    'Google Ads access token',
  );
  const developerToken = resolveEnv(
    input.env,
    provider.developerTokenEnv,
    'MARKETING_GOOGLE_ADS_DEVELOPER_TOKEN_REQUIRED',
    'Google Ads developer token',
  );
  const loginCustomerId = provider.loginCustomerIdEnv
    ? input.env[provider.loginCustomerIdEnv]?.trim()
    : undefined;
  const version = input.options.apiVersion ?? 'v22';
  const reportType = resolveGoogleAdsReportType(input);
  const query = googleAdsQuery(reportType, input.options.startDate, input.options.endDate);
  const response = await input.fetch(
    `https://googleads.googleapis.com/${version}/customers/${normalizeGoogleAdsCustomerId(customerId)}/googleAds:searchStream`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'developer-token': developerToken,
        ...(loginCustomerId
          ? { 'login-customer-id': normalizeGoogleAdsCustomerId(loginCustomerId) }
          : {}),
      },
      body: JSON.stringify({ query }),
    },
  );
  const value = await readJsonResponse(response, 'googleAds');
  return {
    accountId: customerId,
    inputFormat: 'google-ads',
    reportType: input.options.reportType ? reportType : undefined,
    value: {
      reportType,
      window: {
        startDate: input.options.startDate,
        endDate: input.options.endDate,
        timeZone: input.options.timeZone,
      },
      results: asArray(value).flatMap((entry) => asArray(asRecord(entry).results)),
    },
  };
}
