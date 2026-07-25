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

export class GoogleAdsWebConversionUploadError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor(message: string, args: { status: number; responseBody: unknown }) {
    super(message);
    this.name = 'GoogleAdsWebConversionUploadError';
    this.status = args.status;
    this.responseBody = args.responseBody;
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
}): Promise<GoogleAdsUploadClickConversionsResponse> {
  validateGoogleAdsWebConversionTransportConfig(args.config);
  const customerId = normalizeGoogleAdsCustomerId(args.config.customerId);
  const apiVersion = normalizeGoogleAdsApiVersion(args.config.apiVersion);
  const accessToken = await args.config.accessTokenProvider();
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
    },
  );
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new GoogleAdsWebConversionUploadError('Google Ads click conversion upload failed.', {
      status: response.status,
      responseBody,
    });
  }

  const result = (responseBody ?? {}) as GoogleAdsUploadClickConversionsResponse;
  if (result.partialFailureError) {
    throw new GoogleAdsWebConversionUploadError(
      'Google Ads click conversion upload returned partial failures.',
      {
        status: response.status,
        responseBody: result,
      },
    );
  }

  return result;
}
