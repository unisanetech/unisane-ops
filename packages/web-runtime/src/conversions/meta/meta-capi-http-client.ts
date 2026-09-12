import { parseConversionRetryAfter } from '../delivery/retry';
import { WebConversionDeliveryError, withConversionDeadline } from '../delivery/error';
import {
  normalizeMetaCapiApiVersion,
  normalizeMetaCapiPixelId,
  validateMetaCapiWebConversionTransportConfig,
} from './config';
import type {
  MetaCapiEventsRequest,
  MetaCapiEventsResponse,
  MetaCapiWebConversionTransportConfig,
} from './types';

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

export class MetaCapiWebConversionUploadError extends WebConversionDeliveryError {
  readonly status: number;
  readonly responseBody: { code?: number; subcode?: number };
  constructor(
    message: string,
    args: { status: number; responseBody: unknown; retryAfterMs?: number },
  ) {
    const error = record(record(args.responseBody).error);
    const retryable = args.status === 429 || args.status >= 500 || error.is_transient === true;
    super(
      'meta_upload_rejected',
      retryable ? 'retryable' : 'permanent',
      message,
      args.retryAfterMs,
    );
    this.name = 'MetaCapiWebConversionUploadError';
    this.status = args.status;
    this.responseBody = {
      ...(typeof error.code === 'number' ? { code: error.code } : {}),
      ...(typeof error.error_subcode === 'number' ? { subcode: error.error_subcode } : {}),
    };
  }
}

export async function uploadMetaCapiEvents(args: {
  config: MetaCapiWebConversionTransportConfig;
  request: MetaCapiEventsRequest;
  signal?: AbortSignal;
}): Promise<MetaCapiEventsResponse> {
  try {
    validateMetaCapiWebConversionTransportConfig(args.config);
  } catch {
    throw new WebConversionDeliveryError(
      'meta_config_invalid',
      'permanent',
      'Meta conversion configuration is invalid.',
    );
  }
  const pixelId = normalizeMetaCapiPixelId(args.config.pixelId);
  const apiVersion = normalizeMetaCapiApiVersion(args.config.apiVersion);
  if (!/^[A-Za-z0-9_-]+$/.test(pixelId) || !/^v\d+\.\d+$/.test(apiVersion)) {
    throw new WebConversionDeliveryError(
      'meta_destination_invalid',
      'permanent',
      'Meta destination or API version is invalid.',
    );
  }
  if (!args.request.data.length)
    throw new WebConversionDeliveryError(
      'meta_events_empty',
      'permanent',
      'Meta upload requires events.',
    );
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
        if (!accessToken.trim())
          throw new WebConversionDeliveryError(
            'meta_credentials_missing',
            'permanent',
            'Meta credentials are missing.',
          );
        const httpClient = args.config.httpClient ?? fetch;
        const response = await httpClient(
          `https://graph.facebook.com/${apiVersion}/${pixelId}/events`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
            body: JSON.stringify(args.request),
            signal,
          },
        );
        let body: Record<string, unknown> = {};
        try {
          body = record(await response.json?.());
        } catch {
          /* Ambiguous response below. */
        }
        if (!response.ok || body.error) {
          throw new MetaCapiWebConversionUploadError('Meta CAPI event upload failed.', {
            status: response.status,
            responseBody: body,
            retryAfterMs: parseConversionRetryAfter(response.headers?.get('retry-after')),
          });
        }
        if (body.events_received !== args.request.data.length) {
          throw new WebConversionDeliveryError(
            'meta_acceptance_unconfirmed',
            'uncertain',
            'Meta did not confirm acceptance of every submitted event.',
          );
        }
        return {
          events_received: body.events_received as number,
          ...(typeof body.fbtrace_id === 'string' && /^[A-Za-z0-9_-]{1,160}$/.test(body.fbtrace_id)
            ? { fbtrace_id: body.fbtrace_id }
            : {}),
        };
      },
      args.config.timeoutMs ?? 10000,
      args.signal,
    );
  } catch (error) {
    if (error instanceof WebConversionDeliveryError) throw error;
    throw new WebConversionDeliveryError(
      'meta_transport_unavailable',
      'uncertain',
      'Meta delivery could not be confirmed.',
    );
  }
}
