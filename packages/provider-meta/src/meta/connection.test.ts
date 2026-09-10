import { mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildMetaConnectionReadiness,
  createMetaConnectionRecord,
  defineMetaConnectionRecord,
  projectMetaConnectionStatus,
  type MetaConnectionObservation,
  type MetaConnectionRecord,
} from './connection.js';
import {
  disconnectMetaConnectionRecord,
  refreshMetaConnectionRecord,
  revokeMetaConnectionRecord,
  rotateMetaConnectionRecord,
} from './connection-lifecycle.js';
import { readMetaConnectionRecord, writeMetaConnectionRecord } from './connection-store.js';

function observation(
  overrides: Partial<MetaConnectionObservation> = {},
): MetaConnectionObservation {
  return {
    scopeId: 'workspace',
    projectId: 'commerce-site',
    environmentId: 'production',
    connectionId: 'meta-primary',
    identity: {
      kind: 'system-user',
      subject: 'system-user-123',
      displayName: 'Measurement system user',
    },
    credential: {
      secretReference: 'meta-primary-graph',
      secretKind: 'meta-graph-access',
      version: 1,
      state: 'active',
      observedAt: '2026-09-02T00:00:00.000Z',
      expiresAt: '2026-10-02T00:00:00.000Z',
    },
    grants: [
      {
        service: 'ads-insights',
        scopes: ['ads_read'],
        state: 'granted',
        observedAt: '2026-09-02T00:00:00.000Z',
      },
      {
        service: 'event-measurement',
        scopes: ['ads_read'],
        state: 'granted',
        observedAt: '2026-09-02T00:00:00.000Z',
      },
    ],
    resources: [
      {
        service: 'ads-insights',
        resourceType: 'ad-account',
        resourceId: 'act_123',
        displayName: 'Primary ad account',
        state: 'selected',
        observedAt: '2026-09-02T00:00:00.000Z',
      },
      {
        service: 'event-measurement',
        resourceType: 'pixel',
        resourceId: 'pixel_456',
        displayName: 'Commerce Pixel',
        state: 'selected',
        observedAt: '2026-09-02T00:00:00.000Z',
      },
    ],
    observedAt: '2026-09-02T00:00:00.000Z',
    ...overrides,
  };
}

function connection(): MetaConnectionRecord {
  return createMetaConnectionRecord({
    displayName: 'Primary Meta measurement',
    observation: observation(),
  });
}

describe('Meta connection record lifecycle', () => {
  it('binds safe host metadata without accepting or persisting token material', () => {
    const record = connection();

    expect(record).toMatchObject({
      provider: 'meta',
      scopeId: 'workspace',
      projectId: 'commerce-site',
      environmentId: 'production',
      connectionId: 'meta-primary',
      identity: { kind: 'system-user', subject: 'system-user-123' },
      credential: {
        secretReference: 'meta-primary-graph',
        version: 1,
        state: 'active',
      },
    });
    expect(JSON.stringify(record)).not.toMatch(/access.?token|bearer|secretValue/i);
    expect(() =>
      defineMetaConnectionRecord({
        ...record,
        accessToken: 'must-never-be-stored',
      } as MetaConnectionRecord),
    ).toThrow();
  });

  it('requires verified identity evidence before marking a credential active', () => {
    expect(() =>
      createMetaConnectionRecord({
        displayName: 'Unverified Meta',
        observation: observation({ identity: undefined }),
      }),
    ).toThrow('host-verified identity');
  });

  it('projects only normalized token-free status into Growth', () => {
    expect(projectMetaConnectionStatus(connection())).toEqual({
      schemaVersion: 1,
      connectionId: 'meta-primary',
      connected: true,
      scopes: ['ads_read'],
      credentialAvailable: true,
      credentialState: 'active',
      expiresAt: '2026-10-02T00:00:00.000Z',
      updatedAt: '2026-09-02T00:00:00.000Z',
      lastVerifiedAt: '2026-09-02T00:00:00.000Z',
      grants: observation().grants,
      resources: observation().resources,
    });
  });

  it('projects offline readiness without exposing the host secret reference', () => {
    const findings = buildMetaConnectionReadiness(connection());
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'meta.connection.ready', state: 'ready' }),
        expect.objectContaining({
          code: 'meta.service.ads-insights.ready',
          state: 'ready',
        }),
        expect.objectContaining({
          code: 'meta.service.event-measurement.ready',
          state: 'ready',
        }),
      ]),
    );
    expect(JSON.stringify(findings)).not.toMatch(
      /meta-primary-graph|secretReference|credentialId/i,
    );
  });

  it('refreshes only the same host binding and credential version', () => {
    const refreshed = refreshMetaConnectionRecord(
      connection(),
      observation({
        observedAt: '2026-09-03T00:00:00.000Z',
        credential: {
          ...observation().credential,
          observedAt: '2026-09-03T00:00:00.000Z',
        },
      }),
    );
    expect(refreshed.updatedAt).toBe('2026-09-03T00:00:00.000Z');

    expect(() =>
      refreshMetaConnectionRecord(
        connection(),
        observation({
          credential: {
            ...observation().credential,
            secretReference: 'another-secret-reference',
          },
        }),
      ),
    ).toThrow('[META_CONNECTION_SECRET_REFERENCE_CONFLICT]');
  });

  it('rotates by exactly one version and refuses identity replacement', () => {
    const rotated = rotateMetaConnectionRecord(
      connection(),
      observation({
        observedAt: '2026-09-03T00:00:00.000Z',
        credential: {
          ...observation().credential,
          secretReference: 'meta-primary-graph-rotated',
          version: 2,
          observedAt: '2026-09-03T00:00:00.000Z',
        },
      }),
    );
    expect(rotated.credential).toMatchObject({
      secretReference: 'meta-primary-graph-rotated',
      version: 2,
      state: 'active',
    });

    expect(() =>
      rotateMetaConnectionRecord(
        connection(),
        observation({ credential: { ...observation().credential, version: 3 } }),
      ),
    ).toThrow('[META_CONNECTION_VERSION_CONFLICT]');
    expect(() =>
      rotateMetaConnectionRecord(
        connection(),
        observation({
          identity: { kind: 'user', subject: 'different-user' },
          credential: { ...observation().credential, version: 2 },
        }),
      ),
    ).toThrow('[META_CONNECTION_IDENTITY_MISMATCH]');
  });

  it('revokes idempotently only for the active credential version', () => {
    const revoked = revokeMetaConnectionRecord(connection(), {
      scopeId: 'workspace',
      projectId: 'commerce-site',
      environmentId: 'production',
      connectionId: 'meta-primary',
      credentialVersion: 1,
      observedAt: '2026-09-03T00:00:00.000Z',
    });
    expect(revoked.credential.state).toBe('revoked');
    expect(revoked.grants.every((grant) => grant.state === 'revoked')).toBe(true);
    expect(projectMetaConnectionStatus(revoked)).toMatchObject({
      connected: false,
      credentialAvailable: false,
      credentialState: 'revoked',
    });
    expect(
      revokeMetaConnectionRecord(revoked, {
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
        credentialVersion: 1,
        observedAt: '2026-09-03T00:00:00.000Z',
      }),
    ).toEqual(revoked);

    expect(() =>
      revokeMetaConnectionRecord(connection(), {
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
        credentialVersion: 2,
        observedAt: '2026-09-03T00:00:00.000Z',
      }),
    ).toThrow('[META_CONNECTION_VERSION_CONFLICT]');
  });

  it('writes atomically with private permissions and rejects paths outside the project', () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-connection-'));
    const recordPath = '.unisane/ops/connections/meta-primary.json';
    const absolute = writeMetaConnectionRecord({
      projectRoot,
      recordPath,
      connection: connection(),
    });

    expect(readMetaConnectionRecord({ projectRoot, recordPath })).toEqual(connection());
    expect(statSync(absolute).mode & 0o777).toBe(0o600);
    expect(readFileSync(absolute, 'utf8')).not.toMatch(/access.?token|bearer|secretValue/i);
    expect(() =>
      writeMetaConnectionRecord({
        projectRoot,
        recordPath: '../outside.json',
        connection: connection(),
      }),
    ).toThrow('[META_CONNECTION_PATH_OUTSIDE_PROJECT]');
  });

  it('disconnects local status without deleting history or changing provider resources', () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-disconnect-'));
    const recordPath = '.unisane/ops/connections/meta-primary.json';
    writeMetaConnectionRecord({ projectRoot, recordPath, connection: connection() });

    expect(
      disconnectMetaConnectionRecord({
        projectRoot,
        recordPath,
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
      }),
    ).toEqual({
      disconnected: true,
      recordMissing: false,
      historicalDataRetained: true,
      providerResourcesChanged: false,
      hostCredentialRevocationRequired: true,
    });
    expect(readMetaConnectionRecord({ projectRoot, recordPath })).toBeNull();
  });
});
