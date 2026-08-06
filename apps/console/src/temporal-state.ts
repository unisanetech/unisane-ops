import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  buildMarketingConsoleState,
  type MarketingConsoleTemporalQuery,
} from '@unisane/growth/console';
import type {
  MarketingGoogleConnectionStatus,
  MarketingMetaConnectionStatus,
} from '@unisane/growth/marketing';
import type { MarketingConsoleCampaignPauseReview } from '@unisane/growth/console';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type TemporalStateHandlerOptions = {
  cwd?: string;
  maxAgeDays?: number;
  googleAuth?: MarketingGoogleConnectionStatus;
  metaAuth?: MarketingMetaConnectionStatus;
  campaignPauseApprovalAvailable?: boolean;
  campaignPauseReviews?: readonly MarketingConsoleCampaignPauseReview[];
};

function parseTemporalQuery(url: URL): MarketingConsoleTemporalQuery {
  const startDate = url.searchParams.get('from') ?? '';
  const endDate = url.searchParams.get('to') ?? '';
  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
    throw new Error('Both from and to must use YYYY-MM-DD.');
  }
  if (startDate > endDate) throw new Error('The start date must not be after the end date.');
  return { startDate, endDate };
}

export async function handleTemporalStateRequest(
  request: IncomingMessage,
  response: ServerResponse,
  requestUrl: URL,
  options: TemporalStateHandlerOptions,
): Promise<boolean> {
  if (requestUrl.pathname !== '/api/console/state') return false;
  if (request.method !== 'GET') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET');
    response.end();
    return true;
  }
  try {
    const state = await buildMarketingConsoleState({
      ...options,
      temporalQuery: parseTemporalQuery(requestUrl),
    });
    response.statusCode = 200;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.end(JSON.stringify(state));
  } catch (error) {
    response.statusCode = 400;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unable to query the selected period.',
      }),
    );
  }
  return true;
}
