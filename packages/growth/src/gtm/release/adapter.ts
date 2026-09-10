import { hashOpsValue } from '@unisane/ops-engine';
import type { GoogleTagManagerProvider } from '../provider.js';
import type { GoogleTagManagerJsonObject } from '../contracts.js';
import {
  googleTagManagerPreviewEvidenceSchema,
  assertGoogleTagManagerEvidenceTarget,
  assertGoogleTagManagerVersionIdentity,
  googleTagManagerVersionContentDigest,
} from '../evidence.js';
import type { GtmReleaseDependencies } from './workflow.js';
import type { GtmReleaseParameters, GtmReleaseReview } from './contracts.js';
export function createGtmReleaseProviderBridge(
  provider: GoogleTagManagerProvider,
  environment: string,
): Pick<GtmReleaseDependencies, 'inspect' | 'execute' | 'observe'> {
  function identity(
    version: GoogleTagManagerJsonObject,
    p: GtmReleaseParameters,
    versionId?: string,
  ) {
    assertGoogleTagManagerVersionIdentity(
      version,
      p.manifest.accountId,
      p.manifest.containerId,
      versionId,
    );
    return googleTagManagerVersionContentDigest(version);
  }
  async function getVersion(p: GtmReleaseParameters, versionId: string) {
    const version = await provider.readVersion(
      p.manifest.accountId,
      p.manifest.containerId,
      versionId,
    );
    identity(version, p, versionId);
    return version;
  }
  async function getLive(p: GtmReleaseParameters) {
    const version = await provider.readLiveVersion(p.manifest.accountId, p.manifest.containerId);
    if (version) identity(version, p);
    return version;
  }
  return {
    async inspect(p) {
      if (p.kind === 'version') {
        const result = googleTagManagerPreviewEvidenceSchema.parse(
          await provider.preview({ manifest: p.manifest, environment, workspaceId: p.workspaceId }),
        );
        assertGoogleTagManagerEvidenceTarget(result, p.manifest, environment);
        if (
          result.workspacePath !==
            `accounts/${p.manifest.accountId}/containers/${p.manifest.containerId}/workspaces/${p.workspaceId}` ||
          identity(result.containerVersion, p) !== result.contentDigest
        )
          throw new Error('[GTM_PREVIEW_TARGET_MISMATCH] Preview content or target changed.');
        return {
          contentDigest: result.contentDigest,
          fingerprint: null,
          liveRevision: null,
          versionId: null,
        };
      }
      const version = await getVersion(p, p.versionId);
      if (typeof version.fingerprint !== 'string' || !version.fingerprint)
        throw new Error('[GTM_VERSION_FINGERPRINT_REQUIRED] Version fingerprint is missing.');
      const live = await getLive(p);
      return {
        contentDigest: identity(version, p, p.versionId),
        fingerprint: version.fingerprint,
        liveRevision: live ? hashOpsValue(live) : null,
        versionId: p.versionId,
      };
    },
    async execute(review, beforeWrite) {
      const p = review.parameters;
      const result =
        p.kind === 'version'
          ? await provider.createVersion({
              manifest: p.manifest,
              environment,
              workspaceId: p.workspaceId,
              name: p.name,
              expectedPreviewDigest: review.evidence.contentDigest,
              beforeWrite,
            })
          : await provider.publish({
              manifest: p.manifest,
              environment,
              versionId: p.versionId,
              fingerprint: review.evidence.fingerprint!,
              expectedLiveRevision: review.evidence.liveRevision,
              beforeWrite,
            });
      assertGoogleTagManagerEvidenceTarget(result, p.manifest, environment);
      if (
        result.compilerError ||
        !result.versionId ||
        !result.containerVersion ||
        identity(result.containerVersion, p, result.versionId) !== review.evidence.contentDigest
      )
        throw new Error(
          '[GTM_VERSION_OUTCOME_UNCERTAIN] Returned version does not match reviewed content.',
        );
      return { versionId: result.versionId };
    },
    async observe(review: GtmReleaseReview, recordedVersionId) {
      const p = review.parameters;
      if (p.kind === 'publish') {
        const live = await getLive(p);
        return {
          status:
            live?.containerVersionId === p.versionId &&
            identity(live, p, p.versionId) === review.evidence.contentDigest
              ? 'verified'
              : 'not-matched',
          versionId:
            live && typeof live.containerVersionId === 'string' ? live.containerVersionId : null,
        };
      }
      let versionId = recordedVersionId;
      if (!versionId) {
        const headers = await provider.listVersionHeaders(
          p.manifest.accountId,
          p.manifest.containerId,
        );
        const matches = headers.filter(
          (header) => header.name === p.name && header.deleted !== true,
        );
        if (matches.length !== 1 || typeof matches[0]!.containerVersionId !== 'string')
          return { status: 'unavailable', versionId: null };
        versionId = matches[0]!.containerVersionId as string;
      }
      const version = await getVersion(p, versionId);
      return {
        status:
          version.name === p.name &&
          identity(version, p, versionId) === review.evidence.contentDigest
            ? 'verified'
            : 'unavailable',
        versionId,
      };
    },
  };
}
