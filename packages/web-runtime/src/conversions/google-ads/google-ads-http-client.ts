import { parseConversionRetryAfter } from '../delivery/retry';
import { classifyGoogleAdsUploadFailure } from './upload-failure';
import { WebConversionDeliveryError, withConversionDeadline } from '../delivery/error';
import {
  normalizeGoogleAdsApiVersion,
  normalizeGoogleAdsCustomerId,
  validateGoogleAdsWebConversionTransportConfig,
} from './config';
import type {
  GoogleAdsHttpClient,
  GoogleAdsUploadClickConversionsRequest,
  GoogleAdsUploadClickConversionsResponse,
  GoogleAdsWebConversionTransportConfig,
} from './types';

export class GoogleAdsWebConversionUploadError extends WebConversionDeliveryError {
  readonly status: number;
  readonly responseBody: unknown;

  constructor(
    message: string,
    args: { status: number; responseBody: unknown; retryAfterMs?: number },
  ) {
    const classification = classifyGoogleAdsUploadFailure(args.responseBody, args.status === 200);
    const kind =
      args.status === 429 || args.status >= 500 || classification.kind === 'retryable'
        ? 'retryable'
        : args.status === 200
          ? classification.kind
          : 'permanent';
    super(
      'google_ads_upload_rejected',
      kind,
      message,
      kind === 'permanent'
        ? undefined
        : Math.max(args.retryAfterMs ?? 0, classification.retryAfterMs ?? 0) || undefined,
    );

    this.name = 'GoogleAdsWebConversionUploadError';
    this.status = args.status;
    this.responseBody = {};
  }
}

const defaultHttpClient: GoogleAdsHttpClient = async (url, init) => {
  const response = await fetch(url, init);
  return response;
};

async function readResponseBody(response: {
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
}): Promise<unknown> {
  if (response.json) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }
  if (response.text) {
    return response.text();
  }
  return undefined;
}

export async function uploadGoogleAdsClickConversions(args: {
  config: GoogleAdsWebConversionTransportConfig;
  request: GoogleAdsUploadClickConversionsRequest;
  signal?: AbortSignal;
}): Promise<GoogleAdsUploadClickConversionsResponse> {
  validateGoogleAdsWebConversionTransportConfig(args.config);
  const customerId = normalizeGoogleAdsCustomerId(args.config.customerId);
  const apiVersion = normalizeGoogleAdsApiVersion(args.config.apiVersion);
  const timeoutMs = args.config.timeoutMs ?? 10000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000)
    throw new Error('Google Ads timeoutMs must be between 1 and 60000.');
  try {
    return await withConversionDeadline(
      async (signal) => {
        const accessToken = await args.config.accessTokenProvider();
        if (signal.aborted)
          throw new WebConversionDeliveryError(
            'delivery_aborted',
            'uncertain',
            'Conversion delivery was aborted.',
          );
        const httpClient = args.config.httpClient ?? defaultHttpClient;
        const headers = {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
          'developer-token': args.config.developerToken,
          ...(args.config.loginCustomerId
            ? { 'login-customer-id': normalizeGoogleAdsCustomerId(args.config.loginCustomerId) }
            : {}),
        };
        const response = await httpClient(
          `https://googleads.googleapis.com/${apiVersion}/customers/${customerId}:uploadClickConversions`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(args.request),
            signal,
          },
        );
        const responseBody = await readResponseBody(response);

        if (!response.ok) {
          throw new GoogleAdsWebConversionUploadError(
            'Google Ads click conversion upload failed.',
            {
              status: response.status,
              responseBody,
              retryAfterMs: parseConversionRetryAfter(response.headers?.get('retry-after')),
            },
          );
        }

        const result = (responseBody ?? {}) as GoogleAdsUploadClickConversionsResponse;
        if (result.partialFailureError) {
          throw new GoogleAdsWebConversionUploadError(
            'Google Ads click conversion upload returned partial failures.',
            {
              status: response.status,
              responseBody: result,
              retryAfterMs: parseConversionRetryAfter(response.headers?.get('retry-after')),
            },
          );
        }

        if (
          !args.request.validateOnly &&
          (!Array.isArray(result.results) ||
            result.results.length !== args.request.conversions.length ||
            result.results.some(
              (item) => !item || typeof item !== 'object' || Object.keys(item).length === 0,
            ))
        ) {
          throw new WebConversionDeliveryError(
            'google_ads_acceptance_unconfirmed',
            'uncertain',
            'Google Ads did not confirm every conversion.',
          );
        }
        return result;
      },
      timeoutMs,
      args.signal,
    );
  } catch (error) {
    if (error instanceof WebConversionDeliveryError) throw error;
    throw new WebConversionDeliveryError(
      'google_ads_transport_unavailable',
      'uncertain',
      'Google Ads delivery could not be confirmed.',
    );
  }
}
