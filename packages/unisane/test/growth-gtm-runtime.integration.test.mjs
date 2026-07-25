import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { after, before, test } from 'node:test';
import { URL, URLSearchParams } from 'node:url';
import {
  GOOGLE_TAG_MANAGER_AUTH_SCOPES,
  saveGoogleTagManagerAuthProfile,
} from '@unisane/provider-google/gtm-auth';
import { runCanonicalCli } from '../dist/host.js';

const originalFetch = globalThis.fetch;
const originalAuthHome = process.env.UNISANE_GTM_AUTH_HOME;
const originalPlaintextStore = process.env.UNISANE_GTM_AUTH_ALLOW_PLAINTEXT_STORE;

before(() => {
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    if (init.body instanceof URLSearchParams) {
      return globalThis.Response.json({
        access_token: 'access-test',
        expires_in: 3600,
        scope: GOOGLE_TAG_MANAGER_AUTH_SCOPES.join(' '),
        token_type: 'Bearer',
      });
    }
    if ((init.method ?? 'GET') === 'GET' && url.pathname.endsWith('/versions:live')) {
      return globalThis.Response.json({
        path: 'accounts/123456/containers/GTM-DEMO/versions/4',
        containerVersionId: '4',
      });
    }
    if ((init.method ?? 'GET') === 'GET' && url.pathname.endsWith('/versions/5')) {
      return globalThis.Response.json({
        path: 'accounts/123456/containers/GTM-DEMO/versions/5',
        containerVersionId: '5',
      });
    }
    if ((init.method ?? 'GET') === 'POST' && url.pathname.endsWith('/versions/5:publish')) {
      return globalThis.Response.json({
        compilerError: false,
        containerVersion: {
          path: 'accounts/123456/containers/GTM-DEMO/versions/5',
          containerVersionId: '5',
        },
      });
    }
    return globalThis.Response.json(
      { error: { message: `Unexpected GTM request: ${url.pathname}` } },
      { status: 500 },
    );
  };
});

after(() => {
  globalThis.fetch = originalFetch;
  if (originalAuthHome === undefined) delete process.env.UNISANE_GTM_AUTH_HOME;
  else process.env.UNISANE_GTM_AUTH_HOME = originalAuthHome;
  if (originalPlaintextStore === undefined) {
    delete process.env.UNISANE_GTM_AUTH_ALLOW_PLAINTEXT_STORE;
  } else {
    process.env.UNISANE_GTM_AUTH_ALLOW_PLAINTEXT_STORE = originalPlaintextStore;
  }
});

test('canonical Growth runtime publishes through the Google provider binding', async () => {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-canonical-gtm-'));
  const authHome = mkdtempSync(path.join(tmpdir(), 'unisane-canonical-gtm-auth-'));
  const manifestPath = path.join(cwd, 'gtm.manifest.mjs');
  const versionReceiptPath = path.join(cwd, 'version-receipt.json');
  const outputPath = path.join(cwd, 'publish-receipt.json');
  process.env.UNISANE_GTM_AUTH_HOME = authHome;
  process.env.UNISANE_GTM_AUTH_ALLOW_PLAINTEXT_STORE = '1';

  writeFileSync(
    manifestPath,
    `export default {
      appId: 'demo',
      accountId: '123456',
      containerId: 'GTM-DEMO',
      namespace: 'unisane:demo',
      environments: {
        production: {
          workspacePrefix: 'unisane-prod',
          publishPolicy: 'manual-approval',
          allowedVendorDomains: ['www.google-analytics.com']
        }
      },
      folders: [],
      builtInVariables: [],
      triggers: [],
      tags: []
    };`,
  );
  writeFileSync(
    versionReceiptPath,
    JSON.stringify({
      appId: 'demo',
      environment: 'production',
      accountId: '123456',
      containerId: 'GTM-DEMO',
      versionId: '5',
      compilerError: false,
    }),
  );
  await saveGoogleTagManagerAuthProfile({
    profile: 'ci-publish',
    clientId: 'client-test',
    clientSecret: 'secret-test',
    refreshToken: 'refresh-test',
    scopes: GOOGLE_TAG_MANAGER_AUTH_SCOPES,
    secretStore: 'file',
    runtime: { authHome, allowPlaintextStore: true },
  });

  const code = await runCanonicalCli([
    'growth',
    'gtm',
    'publish',
    '--cwd',
    cwd,
    '--manifest',
    path.basename(manifestPath),
    '--env',
    'production',
    '--app',
    'demo',
    '--version',
    '5',
    '--version-receipt',
    path.basename(versionReceiptPath),
    '--production-confirm',
    'demo:production:5',
    '--auth-profile',
    'ci-publish',
    '--rate-limit-ms',
    '0',
    '--output',
    outputPath,
    '--yes',
    '--json',
  ]);

  assert.equal(code, 0);
  assert.equal(existsSync(outputPath), true);
  const receipt = JSON.parse(readFileSync(outputPath, 'utf8'));
  assert.equal(receipt.versionId, '5');
  assert.equal(receipt.compilerError, false);
});
