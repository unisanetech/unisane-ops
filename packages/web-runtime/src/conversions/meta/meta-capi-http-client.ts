import {
  normalizeMetaCapiApiVersion,
  normalizeMetaCapiPixelId,
  validateMetaCapiWebConversionTransportConfig,
} from './config';
import type {
  MetaCapiEventsRequest,
  MetaCapiEventsResponse,
  MetaCapiHttpClient,
  MetaCapiWebConversionTransportConfig,
} from './types';

export class MetaCapiWebConversionUploadError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor(message: string, args: { status: number; responseBody: unknown }) {
    super(message);
    this.name = 'MetaCapiWebConversionUploadError';
    this.status = args.status;
    this.responseBody = args.responseBody;
  }
}

const defaultHttpClient: MetaCapiHttpClient = async (url, init) => {
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

export async function uploadMetaCapiEvents(args: {
  config: MetaCapiWebConversionTransportConfig;
  request: MetaCapiEventsRequest;
}): Promise<MetaCapiEventsResponse> {
  validateMetaCapiWebConversionTransportConfig(args.config);
  const pixelId = normalizeMetaCapiPixelId(args.config.pixelId);
  const apiVersion = normalizeMetaCapiApiVersion(args.config.apiVersion);
  const accessToken = await args.config.accessTokenProvider();
  const httpClient = args.config.httpClient ?? defaultHttpClient;
  const response = await httpClient(`https://graph.facebook.com/${apiVersion}/${pixelId}/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      ...args.request,
      access_token: accessToken,
    }),
  });
  const responseBody = await readResponseBody(response);

  if (!response.ok) {
    throw new MetaCapiWebConversionUploadError('Meta CAPI event upload failed.', {
      status: response.status,
      responseBody,
    });
  }

  return (responseBody ?? {}) as MetaCapiEventsResponse;
}
