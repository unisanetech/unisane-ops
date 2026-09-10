import { expect, it, vi } from 'vitest';
import { googleTagManagerVersionContentDigest } from '@unisane/growth/gtm';
import {
  createGoogleTagManagerContainerVersion,
  publishGoogleTagManagerContainerVersion,
} from './versioning.js';
import type { GoogleTagManagerApiClient } from './api-client.js';
const manifest = {
  appId: 'shop',
  accountId: '1',
  containerId: '2',
  namespace: 'shop',
  environments: { test: { workspacePrefix: 'test' } },
};
const version = () => ({
  accountId: '1',
  containerId: '2',
  containerVersionId: '7',
  path: 'accounts/1/containers/2/versions/7',
  fingerprint: 'reviewed',
  tag: [{ tagId: '1', name: 'Purchase' }],
});
function fixture() {
  return {
    resolveWorkspace: vi.fn(async () => ({
      workspaceId: '3',
      path: 'accounts/1/containers/2/workspaces/3',
    })),
    quickPreviewWorkspace: vi.fn(async () => ({ containerVersion: version() })),
    createContainerVersion: vi.fn(async () => ({ containerVersion: version() })),
    getContainerVersion: vi.fn(async () => version()),
    publishContainerVersion: vi.fn(async () => ({ containerVersion: version() })),
    getLiveVersion: vi.fn(async () => version()),
  };
}
it('rejects preview drift before version creation', async () => {
  const client = fixture();
  await expect(
    createGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: {
        manifest,
        environment: 'test',
        workspaceId: '3',
        name: 'reviewed',
        expectedPreviewDigest: '0'.repeat(64),
      },
    }),
  ).rejects.toThrow('GTM_PREVIEW_DRIFT');
  expect(client.createContainerVersion).not.toHaveBeenCalled();
});
it('creates the exact previewed content and rejects incomplete provider results', async () => {
  const client = fixture();
  const options = {
    manifest,
    environment: 'test',
    workspaceId: '3',
    name: 'reviewed',
    expectedPreviewDigest: googleTagManagerVersionContentDigest(version()),
  };
  expect(
    (
      await createGoogleTagManagerContainerVersion({
        client: client as unknown as GoogleTagManagerApiClient,
        options,
      })
    ).versionId,
  ).toBe('7');
  client.createContainerVersion.mockResolvedValueOnce({} as never);
  await expect(
    createGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options,
    }),
  ).rejects.toThrow('OUTCOME_UNCERTAIN');
});
it('publishes with reviewed fingerprint and verifies live identity', async () => {
  const client = fixture();
  const receipt = await publishGoogleTagManagerContainerVersion({
    client: client as unknown as GoogleTagManagerApiClient,
    options: { manifest, environment: 'test', versionId: '7', fingerprint: 'reviewed' },
  });
  expect(receipt.verification).toBe('verified');
  expect(client.getLiveVersion).toHaveBeenCalledTimes(2);
  expect(client.publishContainerVersion).toHaveBeenCalledWith({
    accountId: '1',
    containerId: '2',
    versionId: '7',
    fingerprint: 'reviewed',
  });
});
it('rejects fingerprint drift before publication and live mismatch afterward', async () => {
  const client = fixture();
  await expect(
    publishGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: { manifest, environment: 'test', versionId: '7', fingerprint: 'old' },
    }),
  ).rejects.toThrow('GTM_VERSION_DRIFT');
  expect(client.publishContainerVersion).not.toHaveBeenCalled();
  client.getLiveVersion
    .mockResolvedValueOnce(version())
    .mockResolvedValueOnce({ ...version(), containerVersionId: '8' });
  await expect(
    publishGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: { manifest, environment: 'test', versionId: '7' },
    }),
  ).rejects.toThrow('TARGET_MISMATCH');
});

it('does not report success when live content differs from the published target', async () => {
  const client = fixture();
  client.getLiveVersion
    .mockResolvedValueOnce(version())
    .mockResolvedValueOnce({ ...version(), tag: [{ tagId: '1', name: 'Unexpected' }] });
  await expect(
    publishGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: { manifest, environment: 'test', versionId: '7' },
    }),
  ).rejects.toThrow('GTM_PUBLISH_CONTENT_MISMATCH');
});
it('rejects a foreign workspace before preview or version writes', async () => {
  const client = fixture();
  client.resolveWorkspace.mockResolvedValueOnce({
    workspaceId: '3',
    path: 'accounts/other/containers/2/workspaces/3',
  });
  await expect(
    createGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: {
        manifest,
        environment: 'test',
        workspaceId: '3',
        name: 'reviewed',
        expectedPreviewDigest: googleTagManagerVersionContentDigest(version()),
      },
    }),
  ).rejects.toThrow('WORKSPACE_TARGET_MISMATCH');
  expect(client.quickPreviewWorkspace).not.toHaveBeenCalled();
  expect(client.createContainerVersion).not.toHaveBeenCalled();
});

it('checks the live baseline and lease immediately before release writes', async () => {
  const client = fixture();
  const beforeWrite = vi.fn(async () => {
    throw new Error('lease expired');
  });
  await expect(
    createGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: {
        manifest,
        environment: 'test',
        workspaceId: '3',
        name: 'reviewed',
        expectedPreviewDigest: googleTagManagerVersionContentDigest(version()),
        beforeWrite,
      },
    }),
  ).rejects.toThrow('lease expired');
  expect(client.createContainerVersion).not.toHaveBeenCalled();
  await expect(
    publishGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: {
        manifest,
        environment: 'test',
        versionId: '7',
        fingerprint: 'reviewed',
        expectedLiveRevision: null,
        beforeWrite,
      },
    }),
  ).rejects.toThrow('GTM_LIVE_VERSION_DRIFT');
  expect(client.publishContainerVersion).not.toHaveBeenCalled();
  await expect(
    publishGoogleTagManagerContainerVersion({
      client: client as unknown as GoogleTagManagerApiClient,
      options: {
        manifest,
        environment: 'test',
        versionId: '7',
        fingerprint: 'reviewed',
        beforeWrite,
      },
    }),
  ).rejects.toThrow('lease expired');
  expect(client.publishContainerVersion).not.toHaveBeenCalled();
});
