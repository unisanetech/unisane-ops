import { META_GRAPH_API_VERSION } from '../api-version.js';
import type { ProviderApiPullContext, ProviderApiPullPayload } from '@unisane/growth/contracts';
import { z } from 'zod';
import { asArray, asRecord, optionalString } from './graph-utils.js';
import { metaReadPolicySchema, readMetaGraphJson, type MetaReadSleep } from '../read-transport.js';

type MetaAdsReportType = 'account' | 'campaign' | 'adSet' | 'ad' | 'creative' | 'device';

const metaAdsReportRequestSchema = z
  .object({
    accountId: z
      .string()
      .trim()
      .regex(/^(?:act_)?\d+$/),
    accessToken: z.string().trim().min(1).max(16_384),
    options: z
      .object({
        startDate: z.string().date(),
        endDate: z.string().date(),
        timeZone: z.string().trim().min(1).max(100).optional(),
        apiVersion: z
          .string()
          .regex(/^v\d{1,2}\.\d+$/)
          .optional(),
        maxPages: z.number().int().min(1).max(20).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
        reportType: z.enum(['account', 'campaign', 'adSet', 'ad', 'creative', 'device']).optional(),
        timeoutMs: metaReadPolicySchema.shape.timeoutMs.optional(),
        maxRetries: metaReadPolicySchema.shape.maxRetries.optional(),
        maxRetryAfterSeconds: metaReadPolicySchema.shape.maxRetryAfterSeconds.optional(),
      })
      .strict(),
  })
  .strict()
  .refine((value) => value.options.startDate <= value.options.endDate, {
    path: ['options', 'endDate'],
    message: 'endDate must be on or after startDate',
  });

export type MetaAdsReportRequest = z.infer<typeof metaAdsReportRequestSchema> & {
  fetch: typeof fetch;
  sleep?: MetaReadSleep;
};

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

function trustedNextPageUrl(value: unknown, apiVersion: string): string | undefined {
  const next = nextPageUrl(value);
  if (!next) return undefined;
  let url: URL;
  try {
    url = new URL(next);
  } catch {
    throw new Error(
      '[MARKETING_META_ADS_PAGINATION_UNTRUSTED] Meta returned an invalid pagination URL.',
    );
  }
  if (
    url.protocol !== 'https:' ||
    url.origin !== 'https://graph.facebook.com' ||
    !url.pathname.startsWith(`/${apiVersion}/`) ||
    url.username ||
    url.password
  ) {
    throw new Error(
      '[MARKETING_META_ADS_PAGINATION_UNTRUSTED] Meta pagination left the configured Graph API boundary.',
    );
  }
  url.searchParams.delete('access_token');
  url.searchParams.delete('appsecret_proof');
  return url.toString();
}

export async function pullMetaAdsReportRequest(
  input: MetaAdsReportRequest,
): Promise<ProviderApiPullPayload<'meta-ads'>> {
  if (typeof input.fetch !== 'function') {
    throw new Error(
      '[MARKETING_META_ADS_FETCH_REQUIRED] Meta Ads report transport is unavailable.',
    );
  }
  const request = metaAdsReportRequestSchema.parse({
    accountId: input.accountId,
    accessToken: input.accessToken,
    options: input.options,
  });
  const version = request.options.apiVersion ?? META_GRAPH_API_VERSION;
  const maxPages = request.options.maxPages ?? 10;
  const reportType = resolveMetaAdsReportType({
    options: request.options,
  } as ProviderApiPullContext);
  const accountPath = request.accountId.startsWith('act_')
    ? request.accountId
    : `act_${request.accountId}`;
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
      JSON.stringify({ since: request.options.startDate, until: request.options.endDate }),
    );
  }
  if (request.options.pageSize) url.searchParams.set('limit', String(request.options.pageSize));

  const rows: unknown[] = [];
  let next: string | undefined = url.toString();
  let page = 0;
  while (next && page < maxPages) {
    page += 1;
    const value = await readMetaGraphJson({
      url: next,
      accessToken: request.accessToken,
      fetch: input.fetch,
      policy: {
        ...(request.options.timeoutMs !== undefined
          ? { timeoutMs: request.options.timeoutMs }
          : {}),
        ...(request.options.maxRetries !== undefined
          ? { maxRetries: request.options.maxRetries }
          : {}),
        ...(request.options.maxRetryAfterSeconds !== undefined
          ? { maxRetryAfterSeconds: request.options.maxRetryAfterSeconds }
          : {}),
      },
      ...(input.sleep ? { sleep: input.sleep } : {}),
    });
    if (!Array.isArray(asRecord(value).data)) {
      throw new Error(
        '[MARKETING_META_ADS_RESPONSE_INVALID] Meta returned an invalid report page.',
      );
    }
    rows.push(...asArray(asRecord(value).data));
    next = trustedNextPageUrl(value, version);
  }

  return {
    accountId: request.accountId,
    inputFormat: 'meta-ads',
    reportType: request.options.reportType ? reportType : undefined,
    value: {
      data: rows,
      partial: Boolean(next),
      reportType,
      window: {
        startDate: request.options.startDate,
        endDate: request.options.endDate,
        timeZone: request.options.timeZone,
      },
    },
  };
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
  return pullMetaAdsReportRequest({
    accountId,
    accessToken,
    options: {
      startDate: input.options.startDate,
      endDate: input.options.endDate,
      ...(input.options.timeZone ? { timeZone: input.options.timeZone } : {}),
      ...(input.options.apiVersion ? { apiVersion: input.options.apiVersion } : {}),
      ...(input.options.maxPages !== undefined ? { maxPages: input.options.maxPages } : {}),
      ...(input.options.pageSize !== undefined ? { pageSize: input.options.pageSize } : {}),
      ...(input.options.reportType ? { reportType: resolveMetaAdsReportType(input) } : {}),
    },
    fetch: input.fetch,
  });
}
