import { createHash } from 'node:crypto';
import { z } from 'zod';
import { stableJson } from './stable-json.js';
import type { GoogleTagManagerContainerManifest, GoogleTagManagerJsonObject } from './contracts.js';

const id = z.string().regex(/^[a-zA-Z0-9_-]+$/);
const target = z.object({
  appId: z.string().min(1),
  environment: z.string().min(1),
  accountId: id,
  containerId: id,
  containerPath: z.string().min(1),
  compilerError: z.literal(false),
});
export const googleTagManagerPreviewEvidenceSchema = target.extend({
  workspacePath: z.string().min(1),
  previewedAt: z.string().datetime(),
  contentDigest: z.string().regex(/^[a-f0-9]{64}$/),
  containerVersion: z.record(z.unknown()),
});
export const googleTagManagerVersionEvidenceSchema = target.extend({
  versionId: id,
  versionPath: z.string().min(1),
  versionedAt: z.string().datetime(),
  containerVersion: z.record(z.unknown()),
});
export function googleTagManagerVersionContentDigest(version: GoogleTagManagerJsonObject): string {
  const keys = [
    'tag',
    'trigger',
    'variable',
    'folder',
    'builtInVariable',
    'customTemplate',
    'client',
    'transformation',
    'zone',
    'gtagConfig',
  ];
  const content = Object.fromEntries(
    keys.map((key) => {
      const entries = version[key] ?? [];
      if (!Array.isArray(entries))
        throw new Error('[GTM_VERSION_CONTENT_INVALID] Invalid compiled resource collection.');
      return [key, entries.map((entry) => stableJson(entry)).sort()];
    }),
  );
  return createHash('sha256').update(stableJson(content)).digest('hex');
}
export function assertGoogleTagManagerEvidenceTarget(
  value: {
    appId: string;
    environment: string;
    accountId: string;
    containerId: string;
    containerPath: string;
  },
  manifest: GoogleTagManagerContainerManifest,
  environment: string,
) {
  if (
    value.appId !== manifest.appId ||
    value.environment !== environment ||
    value.accountId !== manifest.accountId ||
    value.containerId !== manifest.containerId ||
    value.containerPath !== `accounts/${manifest.accountId}/containers/${manifest.containerId}`
  )
    throw new Error(
      '[GTM_RECEIPT_TARGET_MISMATCH] Receipt does not match the selected app, environment and container.',
    );
}
export function assertGoogleTagManagerVersionIdentity(
  version: GoogleTagManagerJsonObject,
  accountId: string,
  containerId: string,
  versionId?: string,
) {
  if (
    version.accountId !== accountId ||
    version.containerId !== containerId ||
    (versionId !== undefined && version.containerVersionId !== versionId) ||
    (version.path !== undefined &&
      versionId !== undefined &&
      version.path !== `accounts/${accountId}/containers/${containerId}/versions/${versionId}`)
  )
    throw new Error(
      '[GTM_VERSION_TARGET_MISMATCH] Provider version does not match the requested container and version.',
    );
}
