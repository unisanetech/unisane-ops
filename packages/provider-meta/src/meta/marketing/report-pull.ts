import type { ProviderApiPullContext, ProviderApiPullPayload } from '@unisane/growth/contracts';
import { asArray, asRecord, optionalString } from './graph-utils.js';

type MetaAdsReportType = 'account' | 'campaign' | 'adSet' | 'ad' | 'creative' | 'device';

async function readJsonResponse(response: Response): Promise<unknown> {
  if (response.ok) return response.json();
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  throw new Error(
    `[MARKETING_PROVIDER_API_PULL_FAILED] metaAds API request failed with ${response.status} ${response.statusText}.${body ? ` Body: ${body.slice(0, 500)}` : ''}`,
  );
}

function nextPageUrl(value: unknown): string | undefined {
  return optionalString(asRecord(asRecord(value).paging).next);
}

function resolveMetaAdsReportType(input: ProviderApiPullContext): MetaAdsReportType {
  const reportType = input.options.reportType ?? 'campaign';
  if (
    reportType === 'account' ||
    reportType === 'campaign' ||
    reportType === 'adSet' ||
    reportType === 'ad' ||
    reportType === 'creative' ||
    reportType === 'device'
  ) {
    return reportType;
  }
  throw new Error(
    `[MARKETING_META_ADS_REPORT_UNSUPPORTED] Meta Ads report is not supported: ${reportType}.`,
  );
}

export async function pullMetaAdsReport(
  input: ProviderApiPullContext,
): Promise<ProviderApiPullPayload<'meta-ads'>> {
  const accountId = input.options.accountId ?? input.credentials?.accountId;
  const accessToken = input.credentials?.accessToken;
  if (!accountId || !accessToken) {
    throw new Error(
      '[MARKETING_META_ADS_CONNECTION_INCOMPLETE] Meta Ads report pulls require a selected ad account and canonical connection credential.',
    );
  }
  const version = input.options.apiVersion ?? 'v25.0';
  const maxPages = input.options.maxPages ?? 10;
  const reportType = resolveMetaAdsReportType(input);
  const accountPath = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  const url = new URL(
    `https://graph.facebook.com/${version}/${accountPath}/${reportType === 'creative' ? 'adcreatives' : 'insights'}`,
  );
  if (reportType === 'creative') {
    url.searchParams.set(
      'fields',
      'id,name,account_id,status,object_type,object_story_spec,asset_feed_spec,body,title,image_url,thumbnail_url,video_id,call_to_action_type,url_tags',
    );
  } else {
    url.searchParams.set(
      'level',
      reportType === 'adSet' ? 'adset' : reportType === 'device' ? 'campaign' : reportType,
    );
    url.searchParams.set(
      'fields',
      'account_id,account_name,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,clicks,spend,actions,action_values,account_currency',
    );
    if (reportType === 'device') url.searchParams.set('breakdowns', 'impression_device');
    url.searchParams.set(
      'time_range',
      JSON.stringify({ since: input.options.startDate, until: input.options.endDate }),
    );
  }
  if (input.options.pageSize) url.searchParams.set('limit', String(input.options.pageSize));

  const rows: unknown[] = [];
  let next: string | undefined = url.toString();
  let page = 0;
  while (next && page < maxPages) {
    page += 1;
    const value = await readJsonResponse(
      await input.fetch(next, { headers: { authorization: `Bearer ${accessToken}` } }),
    );
    rows.push(...asArray(asRecord(value).data));
    next = nextPageUrl(value);
  }

  return {
    accountId,
    inputFormat: 'meta-ads',
    reportType: input.options.reportType ? reportType : undefined,
    value: {
      data: rows,
      partial: Boolean(next),
      reportType,
      window: {
        startDate: input.options.startDate,
        endDate: input.options.endDate,
        timeZone: input.options.timeZone,
      },
    },
  };
}
