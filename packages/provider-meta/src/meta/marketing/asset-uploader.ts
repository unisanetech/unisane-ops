import { readMetaMutationResponse } from './mutation-response.js';
import { META_GRAPH_API_VERSION } from '../api-version.js';
import type {
  MarketingAdsAssetProviderUploadOptions,
  MarketingAdsAssetProviderUploadResult,
} from '@unisane/growth/contracts';
import { asRecord } from './graph-utils.js';

function accountPath(accountId: string): string {
  return accountId.startsWith('act_') ? accountId : `act_${accountId}`;
}

function imageHash(value: unknown, fileName: string): string | undefined {
  const root = asRecord(value);
  const directHash = typeof root.hash === 'string' ? root.hash : undefined;
  if (directHash) return directHash;
  const images = asRecord(root.images);
  const candidates = Object.values(images);
  const selected = images[fileName] ?? (candidates.length === 1 ? candidates[0] : undefined);
  const hash = asRecord(selected).hash;
  return typeof hash === 'string' ? hash : undefined;
}

function videoId(value: unknown): string | undefined {
  const root = asRecord(value);
  const id = root.id ?? root.video_id;
  return typeof id === 'string' ? id : undefined;
}

export async function uploadMetaAdsAsset(
  options: MarketingAdsAssetProviderUploadOptions,
): Promise<MarketingAdsAssetProviderUploadResult> {
  if (options.operation.provider !== 'metaAds') {
    throw new Error(
      '[ADS_ASSET_META_PROVIDER_INVALID] Meta asset uploader received a non-Meta operation.',
    );
  }
  const accountId = options.credentials?.accountId;
  const accessToken = options.credentials?.accessToken;
  if (!accountId || !accessToken) {
    throw new Error(
      '[ADS_ASSET_META_CONNECTION_INCOMPLETE] Meta asset upload requires a selected ad account and canonical connection credential.',
    );
  }
  const apiVersion = options.apiVersion ?? META_GRAPH_API_VERSION;
  if (options.operation.assetType === 'video') {
    const sourceBytes = new Uint8Array(options.source.bytes.byteLength);
    sourceBytes.set(options.source.bytes);
    const body = new FormData();
    body.set('access_token', accessToken);
    body.set(
      'source',
      new Blob([sourceBytes], {
        type: options.source.mimeType ?? 'application/octet-stream',
      }),
      options.source.fileName,
    );
    const response = await options.fetch(
      `https://graph.facebook.com/${apiVersion}/${accountPath(accountId)}/advideos`,
      { method: 'POST', body },
    );
    const value = await readMetaMutationResponse(
      response,
      'ADS_ASSET_META_VIDEO_UPLOAD_FAILED',
      'Meta video upload',
    );
    const providerAssetId = videoId(value);
    if (!providerAssetId) {
      throw new Error(
        '[ADS_ASSET_META_VIDEO_ID_MISSING] Meta video upload did not return a video id.',
      );
    }
    return { providerAssetId, message: 'Meta video asset upload sent.' };
  }
  if (options.operation.assetType !== 'image' && options.operation.assetType !== 'logo') {
    throw new Error(
      '[ADS_ASSET_META_TYPE_UNSUPPORTED] Meta asset upload supports image, logo, and video assets only.',
    );
  }
  const body = new URLSearchParams();
  body.set('access_token', accessToken);
  body.set('bytes', Buffer.from(options.source.bytes).toString('base64'));
  const response = await options.fetch(
    `https://graph.facebook.com/${apiVersion}/${accountPath(accountId)}/adimages`,
    { method: 'POST', body },
  );
  const value = await readMetaMutationResponse(
    response,
    'ADS_ASSET_META_UPLOAD_FAILED',
    'Meta image upload',
  );
  const providerAssetId = imageHash(value, options.source.fileName);
  if (!providerAssetId) {
    throw new Error(
      '[ADS_ASSET_META_UPLOAD_HASH_MISSING] Meta image upload did not return an image hash.',
    );
  }
  return { providerAssetId, message: 'Meta image asset upload sent.' };
}
