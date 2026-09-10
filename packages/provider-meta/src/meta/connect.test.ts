import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  connectMeta,
  createDefaultMetaCredentialIngress,
  type MetaCredentialIngress,
} from './connect.js';
import { disconnectMeta } from './disconnect.js';
import type { MetaHostCredentialResolver } from './credential-execution.js';
import { metaKeychainAccount } from './local-credential-resolver.js';
import type { MetaLocalCredentialStore } from './local-credential-store.js';
import type { MetaCredentialPrompt } from './terminal-credential-prompt.js';
import { readMetaConnectionRecord } from './connection-store.js';

function json(value: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function successfulFetcher(identity = 'system-user-123') {
  return vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(json({ id: identity, name: 'Measurement system user' }))
    .mockResolvedValueOnce(json({ id: identity, name: 'Measurement system user' }))
    .mockResolvedValueOnce(
      json({
        data: [
          { permission: 'ads_read', status: 'granted' },
          { permission: 'pages_show_list', status: 'granted' },
        ],
      }),
    )
    .mockResolvedValueOnce(json({ data: [{ id: 'business-1', name: 'Commerce Business' }] }))
    .mockResolvedValueOnce(
      json({ data: [{ id: 'act_123', name: 'Primary ad account', account_status: 1 }] }),
    )
    .mockResolvedValueOnce(
      json({
        data: [
          {
            id: 'page-1',
            name: 'Commerce Page',
            instagram_business_account: { id: 'instagram-1', username: 'commerce' },
          },
        ],
      }),
    )
    .mockResolvedValueOnce(json({ data: [{ id: 'pixel-1', name: 'Commerce Pixel' }] }))
    .mockResolvedValueOnce(json({ data: [{ id: 'dataset-1', name: 'Commerce Dataset' }] }))
    .mockResolvedValueOnce(json({ data: [{ id: 'pixel-1', name: 'Commerce Pixel' }] }));
}

function request(projectRoot: string, argv: readonly string[]) {
  return {
    context: { cwd: projectRoot, argv, json: true },
    scopeId: 'workspace',
    projectId: 'commerce-site',
    environmentId: 'production',
    recordPath: '.unisane/ops/connections/meta-primary.json',
    requiredServices: ['ads-insights', 'event-measurement'],
  } as const;
}

function fakeCustody(token = 'fixture-meta-token') {
  const values = new Map<string, Uint8Array>();
  const removed: string[] = [];
  let ingressBuffer: Uint8Array | undefined;
  const store: MetaLocalCredentialStore = {
    write({ reference, context, credential }) {
      values.set(metaKeychainAccount({ reference, context }), credential.slice());
    },
    remove({ reference, context }) {
      const account = metaKeychainAccount({ reference, context });
      removed.push(account);
      return values.delete(account);
    },
  };
  const ingress: MetaCredentialIngress = {
    async withCredential({ use }) {
      const credential = new TextEncoder().encode(token);
      ingressBuffer = credential;
      try {
        return await use(credential);
      } finally {
        credential.fill(0);
      }
    },
  };
  const resolver: MetaHostCredentialResolver = {
    async withCredential({ reference, context, use }) {
      const stored = values.get(metaKeychainAccount({ reference, context }));
      if (!stored) throw new Error('[TEST_CREDENTIAL_MISSING]');
      const credential = stored.slice();
      try {
        return await use(credential);
      } finally {
        credential.fill(0);
      }
    },
  };
  return { values, removed, store, ingress, resolver, ingressBuffer: () => ingressBuffer };
}

describe('Meta ordinary connection lifecycle', () => {
  it('prefers environment ingress and fails closed when secure prompting is unavailable', async () => {
    const environment: NodeJS.ProcessEnv = { META_GRAPH_ACCESS_TOKEN: 'fixture-environment-token' };
    let promptCalls = 0;
    const prompt: MetaCredentialPrompt = {
      isAvailable: () => true,
      async readCredential() {
        promptCalls += 1;
        return new TextEncoder().encode('fixture-prompt-token');
      },
    };
    const ingress = createDefaultMetaCredentialIngress({
      environment,
      prompt,
      interactive: false,
    });
    let observed = '';
    await ingress.withCredential({
      environmentVariable: 'META_GRAPH_ACCESS_TOKEN',
      async use(credential) {
        observed = new TextDecoder().decode(credential);
      },
    });
    expect(observed).toBe('fixture-environment-token');
    expect(environment.META_GRAPH_ACCESS_TOKEN).toBeUndefined();
    expect(promptCalls).toBe(0);

    await expect(
      ingress.withCredential({
        environmentVariable: 'META_GRAPH_ACCESS_TOKEN',
        async use() {},
      }),
    ).rejects.toThrow('[META_CONNECT_CREDENTIAL_UNAVAILABLE]');
  });

  it('uses the hidden interactive prompt once and clears its returned bytes', async () => {
    const prompted = new TextEncoder().encode('fixture-prompt-token');
    const prompt: MetaCredentialPrompt = {
      isAvailable: () => true,
      async readCredential() {
        return prompted;
      },
    };
    const ingress = createDefaultMetaCredentialIngress({
      environment: {},
      prompt,
      interactive: true,
    });
    let observed = '';
    await ingress.withCredential({
      environmentVariable: 'META_GRAPH_ACCESS_TOKEN',
      async use(credential) {
        observed = new TextDecoder().decode(credential);
      },
    });
    expect(observed).toBe('fixture-prompt-token');
    expect([...prompted]).toEqual(new Array(prompted.byteLength).fill(0));
  });

  it('composes the hidden prompt with verification and Keychain persistence', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-prompt-connect-'));
    const custody = fakeCustody();
    const prompted = new TextEncoder().encode('fixture-prompt-token');
    const prompt: MetaCredentialPrompt = {
      isAvailable: () => true,
      async readCredential() {
        return prompted;
      },
    };
    const baseRequest = request(projectRoot, ['--ad-account', 'act_123', '--pixel', 'pixel-1']);

    const result = await connectMeta(
      {
        ...baseRequest,
        context: { ...baseRequest.context, json: false },
      },
      {
        fetch: successfulFetcher(),
        now: () => new Date('2026-09-03T00:00:00.000Z'),
        environment: {},
        credentialPrompt: prompt,
        credentialStore: custody.store,
      },
    );

    expect(result.status).toBe('ok');
    expect(
      custody.values.has('workspace:commerce-site:production:meta-primary:meta-primary-graph:v1'),
    ).toBe(true);
    expect([...prompted]).toEqual(new Array(prompted.byteLength).fill(0));
    expect(JSON.stringify(result)).not.toContain('fixture-prompt-token');
  });

  it('fails safely when the interactive prompt is cancelled', async () => {
    const prompt: MetaCredentialPrompt = {
      isAvailable: () => true,
      async readCredential() {
        return null;
      },
    };
    const ingress = createDefaultMetaCredentialIngress({
      environment: {},
      prompt,
      interactive: true,
    });

    await expect(
      ingress.withCredential({
        environmentVariable: 'META_GRAPH_ACCESS_TOKEN',
        async use() {},
      }),
    ).rejects.toThrow('[META_CONNECT_CREDENTIAL_CANCELLED]');
  });

  it('verifies and stores a system-user connection with explicit measurement resources', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-connect-'));
    const custody = fakeCustody();
    const fetcher = successfulFetcher();

    const result = await connectMeta(
      request(projectRoot, [
        '--connection',
        'meta-primary',
        '--ad-account',
        'act_123',
        '--pixel',
        'pixel-1',
      ]),
      {
        fetch: fetcher,
        now: () => new Date('2026-09-02T10:00:00.000Z'),
        credentialIngress: custody.ingress,
        credentialStore: custody.store,
      },
    );

    expect(result.status).toBe('ok');
    expect(result.writeTargets).toEqual(['project', 'secret-store']);
    expect(result.result).toMatchObject({
      provider: 'meta',
      connectionId: 'meta-primary',
      credentialState: 'active',
      resources: [
        expect.objectContaining({ resourceType: 'ad-account', state: 'selected' }),
        expect.objectContaining({ resourceType: 'pixel', state: 'selected' }),
      ],
    });
    expect(
      custody.values.has('workspace:commerce-site:production:meta-primary:meta-primary-graph:v1'),
    ).toBe(true);
    expect([...(custody.ingressBuffer() ?? [])]).toEqual(
      new Array(custody.ingressBuffer()?.byteLength ?? 0).fill(0),
    );
    expect(fetcher).toHaveBeenCalledTimes(9);
    expect(JSON.stringify(result)).not.toContain('fixture-meta-token');
    const recordText = readFileSync(
      path.join(projectRoot, '.unisane/ops/connections/meta-primary.json'),
      'utf8',
    );
    expect(recordText).not.toMatch(/fixture-meta-token|access.?token|bearer/i);
  });

  it('never auto-selects ambiguous candidates and rejects token-shaped CLI input', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-connect-ambiguous-'));
    const custody = fakeCustody();
    const result = await connectMeta(request(projectRoot, []), {
      fetch: successfulFetcher(),
      now: () => new Date('2026-09-02T10:00:00.000Z'),
      credentialIngress: custody.ingress,
      credentialStore: custody.store,
    });
    expect(result.status).toBe('attention');
    expect(result.result).toMatchObject({
      resources: expect.arrayContaining([
        expect.objectContaining({ resourceType: 'ad-account', state: 'ambiguous' }),
        expect.objectContaining({ resourceType: 'pixel', state: 'ambiguous' }),
      ]),
    });

    await expect(
      connectMeta(
        request(mkdtempSync(path.join(tmpdir(), 'meta-token-arg-')), [
          '--access-token',
          'forbidden',
        ]),
      ),
    ).rejects.toThrow('[META_CONNECT_ARGUMENT_UNKNOWN]');
  });

  it('refreshes the same version, rotates by one, and rejects identity replacement', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-refresh-rotate-'));
    const custody = fakeCustody();
    const selected = ['--ad-account', 'act_123', '--pixel', 'pixel-1'] as const;
    await connectMeta(request(projectRoot, selected), {
      fetch: successfulFetcher(),
      now: () => new Date('2026-09-02T10:00:00.000Z'),
      credentialIngress: custody.ingress,
      credentialStore: custody.store,
    });

    await connectMeta(request(projectRoot, ['--refresh']), {
      fetch: successfulFetcher(),
      now: () => new Date('2026-09-02T11:00:00.000Z'),
      credentialResolver: custody.resolver,
      credentialStore: custody.store,
    });
    expect(
      readMetaConnectionRecord({
        projectRoot,
        recordPath: '.unisane/ops/connections/meta-primary.json',
      })?.credential.version,
    ).toBe(1);

    await connectMeta(request(projectRoot, ['--rotate']), {
      fetch: successfulFetcher(),
      now: () => new Date('2026-09-02T12:00:00.000Z'),
      credentialIngress: custody.ingress,
      credentialStore: custody.store,
    });
    expect(
      readMetaConnectionRecord({
        projectRoot,
        recordPath: '.unisane/ops/connections/meta-primary.json',
      })?.credential.version,
    ).toBe(2);
    expect(custody.removed).toContain(
      'workspace:commerce-site:production:meta-primary:meta-primary-graph:v1',
    );
    expect(
      custody.values.has('workspace:commerce-site:production:meta-primary:meta-primary-graph:v2'),
    ).toBe(true);

    await expect(
      connectMeta(request(projectRoot, ['--rotate']), {
        fetch: successfulFetcher('another-system-user'),
        now: () => new Date('2026-09-02T13:00:00.000Z'),
        credentialIngress: custody.ingress,
        credentialStore: custody.store,
      }),
    ).rejects.toThrow('[META_CONNECTION_IDENTITY_MISMATCH]');
    expect(
      custody.values.has('workspace:commerce-site:production:meta-primary:meta-primary-graph:v2'),
    ).toBe(true);
  });

  it('disconnects exact local custody while retaining historical/provider state by contract', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-disconnect-'));
    const custody = fakeCustody();
    await connectMeta(request(projectRoot, ['--ad-account', 'act_123', '--dataset', 'dataset-1']), {
      fetch: successfulFetcher(),
      now: () => new Date('2026-09-02T10:00:00.000Z'),
      credentialIngress: custody.ingress,
      credentialStore: custody.store,
    });

    const result = await disconnectMeta(
      {
        context: { cwd: projectRoot, argv: [], json: true },
        scopeId: 'workspace',
        projectId: 'commerce-site',
        environmentId: 'production',
        connectionId: 'meta-primary',
        recordPath: '.unisane/ops/connections/meta-primary.json',
      },
      { credentialStore: custody.store },
    );

    expect(result.result).toMatchObject({
      disconnected: true,
      credentialRemoved: true,
      historicalDataRetained: true,
      providerResourcesChanged: false,
    });
    expect(existsSync(path.join(projectRoot, '.unisane/ops/connections/meta-primary.json'))).toBe(
      false,
    );
    expect(custody.values.size).toBe(0);
  });
});

describe('Meta guided connection persistence', () => {
  it('saves guided selections through the existing record and does not re-prompt on refresh', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-guided-'));
    const custody = fakeCustody();
    const base = request(projectRoot, []);
    const choose = vi.fn(
      async (input: import('./connection-resource-selection.js').MetaResourcePromptInput) =>
        input.candidates[0]!,
    );
    const prompt = { isAvailable: () => true, choose };
    const result = await connectMeta(
      { ...base, context: { ...base.context, json: false } },
      {
        fetch: successfulFetcher(),
        credentialIngress: custody.ingress,
        credentialStore: custody.store,
        resourcePrompt: prompt,
      },
    );
    expect(result.status).toBe('ok');
    expect(choose).toHaveBeenCalledTimes(2);
    expect(result.result).toMatchObject({
      resources: expect.arrayContaining([
        expect.objectContaining({
          resourceId: 'act_123',
          displayName: 'Primary ad account',
          state: 'selected',
        }),
        expect.objectContaining({ resourceId: 'pixel-1', state: 'selected' }),
      ]),
    });
    choose.mockClear();
    await connectMeta(
      { ...base, context: { ...base.context, argv: ['--refresh'], json: false } },
      {
        fetch: successfulFetcher(),
        credentialResolver: custody.resolver,
        credentialStore: custody.store,
        resourcePrompt: prompt,
      },
    );
    expect(choose).not.toHaveBeenCalled();
  });
  it.each(['cancel', 'invalid'] as const)(
    'does not persist credentials or records after %s',
    async (mode) => {
      const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-guided-cancel-'));
      const custody = fakeCustody();
      const base = request(projectRoot, []);
      const choose = vi.fn(async () =>
        mode === 'cancel'
          ? null
          : { resourceType: 'ad-account' as const, resourceId: 'not-offered' },
      );
      await expect(
        connectMeta(
          { ...base, context: { ...base.context, json: false } },
          {
            fetch: successfulFetcher(),
            credentialIngress: custody.ingress,
            credentialStore: custody.store,
            resourcePrompt: { isAvailable: () => true, choose },
          },
        ),
      ).rejects.toThrow(mode === 'cancel' ? 'SELECTION_CANCELLED' : 'SELECTION_INVALID');
      expect(custody.values.size).toBe(0);
      expect(readMetaConnectionRecord({ projectRoot, recordPath: base.recordPath })).toBeNull();
      expect([...(custody.ingressBuffer() ?? [])].every((byte) => byte === 0)).toBe(true);
    },
  );
  it('never calls a resource prompt in JSON mode', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-guided-json-'));
    const custody = fakeCustody();
    const choose = vi.fn(async () => null);
    const result = await connectMeta(request(projectRoot, []), {
      fetch: successfulFetcher(),
      credentialIngress: custody.ingress,
      credentialStore: custody.store,
      resourcePrompt: { isAvailable: () => true, choose },
    });
    expect(result.status).toBe('attention');
    expect(choose).not.toHaveBeenCalled();
  });
  it('leaves an existing record and credential unchanged if refresh selection is cancelled', async () => {
    const projectRoot = mkdtempSync(path.join(tmpdir(), 'meta-guided-refresh-cancel-'));
    const custody = fakeCustody();
    const base = request(projectRoot, []);
    await connectMeta(base, {
      fetch: successfulFetcher(),
      credentialIngress: custody.ingress,
      credentialStore: custody.store,
    });
    const before = readFileSync(path.join(projectRoot, base.recordPath), 'utf8');
    await expect(
      connectMeta(
        { ...base, context: { ...base.context, argv: ['--refresh'], json: false } },
        {
          fetch: successfulFetcher(),
          credentialResolver: custody.resolver,
          credentialStore: custody.store,
          resourcePrompt: { isAvailable: () => true, choose: async () => null },
        },
      ),
    ).rejects.toThrow('SELECTION_CANCELLED');
    expect(readFileSync(path.join(projectRoot, base.recordPath), 'utf8')).toBe(before);
    expect(custody.values.size).toBe(1);
    expect(custody.removed).toEqual([]);
  });
});
