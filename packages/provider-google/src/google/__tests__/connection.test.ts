import { describe, expect, it } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildGoogleConnectionReadiness,
  defineGoogleConnectionRecord,
  type GoogleConnectionRecord,
} from '../connection.js';
import { discoverGoogleConnectionResources } from '../connection-discovery.js';
import { connectGoogle } from '../connect.js';
import { readGoogleConnectionRecord } from '../connection-store.js';

const connection: GoogleConnectionRecord = {
  schemaVersion: 1,
  provider: 'google',
  connectionId: 'google-primary',
  displayName: 'Primary Google connection',
  projectId: 'product-site',
  environmentId: 'production',
  secretReference: 'google-primary-oauth',
  googleCloudProjectId: 'cloud-project-1',
  identity: {
    subject: 'google-subject-1',
    email: 'operator@example.test',
  },
  credentialState: 'active',
  grants: [
    {
      service: 'analytics',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
      state: 'granted',
      observedAt: '2026-07-30T00:00:00.000Z',
    },
  ],
  resources: [
    {
      service: 'analytics',
      resourceType: 'property',
      resourceId: 'properties/123',
      displayName: 'Product analytics',
      state: 'selected',
      observedAt: '2026-07-30T00:00:00.000Z',
    },
  ],
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:00.000Z',
  lastVerifiedAt: '2026-07-30T00:00:00.000Z',
};

describe('Google connection contract', () => {
  it('stores one provider identity, grants, and resources without tokens', () => {
    const parsed = defineGoogleConnectionRecord(connection);
    expect(parsed.connectionId).toBe('google-primary');
    expect(parsed.grants).toHaveLength(1);
    expect(parsed.resources).toHaveLength(1);
    expect(JSON.stringify(parsed)).not.toMatch(/accessToken|refreshToken|clientSecret/);
  });

  it('rejects duplicate service grants and resource selections', () => {
    expect(() =>
      defineGoogleConnectionRecord({
        ...connection,
        grants: [...connection.grants, connection.grants[0]!],
      }),
    ).toThrow('one grant record per service');
    expect(() =>
      defineGoogleConnectionRecord({
        ...connection,
        resources: [...connection.resources, connection.resources[0]!],
      }),
    ).toThrow('duplicate resource selections');
  });

  it('projects connection and grant health into shared Ops readiness findings', () => {
    expect(buildGoogleConnectionReadiness(connection)).toEqual([
      expect.objectContaining({
        code: 'google.connection.ready',
        dimension: 'connection',
        state: 'ready',
        blocking: false,
      }),
      expect.objectContaining({
        code: 'google.grant.analytics.granted',
        state: 'ready',
        blocking: false,
      }),
    ]);
  });

  it('fails closed with one exact reconnect action for revoked credentials', () => {
    expect(
      buildGoogleConnectionReadiness({
        ...connection,
        credentialState: 'revoked',
      })[0],
    ).toEqual(
      expect.objectContaining({
        code: 'google.connection.revoked',
        state: 'permission-blocked',
        blocking: true,
        nextAction: expect.objectContaining({
          id: 'google.connection.reconnect',
          command: expect.objectContaining({
            path: ['connect', 'google'],
          }),
        }),
      }),
    );
  });

  it('keeps partial grants visible with one incremental grant action', () => {
    const finding = buildGoogleConnectionReadiness({
      ...connection,
      grants: [
        {
          ...connection.grants[0]!,
          state: 'partial',
        },
      ],
    })[1];
    expect(finding).toEqual(
      expect.objectContaining({
        code: 'google.grant.analytics.partial',
        state: 'partial',
        blocking: true,
        nextAction: expect.objectContaining({
          id: 'google.grant.analytics.request',
          command: expect.objectContaining({
            path: ['connect', 'google'],
            args: expect.arrayContaining(['--service', 'analytics']),
          }),
        }),
      }),
    );
  });

  it('binds an external secret reference without treating it as verified access', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'google-connection-'));
    const result = await connectGoogle({
      context: {
        cwd: projectRoot,
        argv: [
          '--connection',
          'google-ci',
          '--secret-reference',
          'google-ci-oauth',
          '--analytics-property',
          'properties/123',
        ],
        json: true,
      },
      projectId: 'product-site',
      environmentId: 'production',
      recordPath: '.unisane/ops/connections/google-ci.json',
      requiredServices: ['analytics'],
    });
    expect(result).toMatchObject({
      status: 'attention',
      actualEffect: 'write',
      writeTargets: ['project'],
      result: {
        connectionId: 'google-ci',
        credentialState: 'missing',
      },
    });
    expect(
      readGoogleConnectionRecord({
        projectRoot,
        recordPath: '.unisane/ops/connections/google-ci.json',
      }),
    ).toMatchObject({
      connectionId: 'google-ci',
      credentialState: 'missing',
      grants: [{ service: 'analytics', state: 'missing' }],
    });
  });

  it('keeps zero discovered resources unselected with an exact missing finding', async () => {
    const result = await discoverGoogleConnectionResources({
      accessToken: 'temporary-token',
      services: ['analytics'],
      observedAt: '2026-07-30T00:00:00.000Z',
      fetch: async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ accountSummaries: [] }),
      }),
    });
    expect(result.resources).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        service: 'analytics',
        state: 'missing',
        code: 'google.resource.analytics.missing',
      }),
    ]);
  });

  it('automatically selects one uniquely discovered resource', async () => {
    const result = await discoverGoogleConnectionResources({
      accessToken: 'temporary-token',
      services: ['analytics'],
      observedAt: '2026-07-30T00:00:00.000Z',
      fetch: async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            accountSummaries: [
              {
                account: 'accounts/1',
                propertySummaries: [
                  {
                    property: 'properties/123',
                    displayName: 'Product',
                  },
                ],
              },
            ],
          }),
      }),
    });
    expect(result.issues).toEqual([]);
    expect(result.resources).toEqual([
      expect.objectContaining({
        service: 'analytics',
        resourceId: '123',
        state: 'selected',
      }),
    ]);
  });

  it('returns every ambiguous candidate without selecting the first one', async () => {
    const result = await discoverGoogleConnectionResources({
      accessToken: 'temporary-token',
      services: ['analytics'],
      observedAt: '2026-07-30T00:00:00.000Z',
      fetch: async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            accountSummaries: [
              {
                account: 'accounts/1',
                propertySummaries: [
                  { property: 'properties/123', displayName: 'Product' },
                  { property: 'properties/456', displayName: 'Staging' },
                ],
              },
            ],
          }),
      }),
    });
    expect(result.resources.map((resource) => resource.state)).toEqual(['ambiguous', 'ambiguous']);
    expect(result.resources.map((resource) => resource.resourceId)).toEqual(['123', '456']);
    expect(result.issues).toEqual([
      expect.objectContaining({
        service: 'analytics',
        state: 'ambiguous',
        code: 'google.resource.analytics.ambiguous',
      }),
    ]);
  });

  it('reports provider access failures without manufacturing a resource', async () => {
    const result = await discoverGoogleConnectionResources({
      accessToken: 'temporary-token',
      services: ['search-console'],
      observedAt: '2026-07-30T00:00:00.000Z',
      fetch: async () => ({
        ok: false,
        status: 403,
        text: async () => JSON.stringify({ error: { message: 'permission denied' } }),
      }),
    });
    expect(result.resources).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        service: 'search-console',
        state: 'inaccessible',
        code: 'google.resource.search-console.inaccessible',
      }),
    ]);
  });
});
