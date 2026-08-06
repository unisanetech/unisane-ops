import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { createOidcWorkloadIdentityAuthorizer } from './identity.js';

describe('hosted OIDC workload identity', () => {
  it('binds verified issuer, audience, principal, expiry, and allowed scopes', async () => {
    const { privateKey, publicKey } = await generateKeyPair('ES256');
    const key = await exportJWK(publicKey);
    key.kid = 'hosted-test-key';
    const authorizer = createOidcWorkloadIdentityAuthorizer({
      issuer: 'https://identity.example.com',
      audience: 'unisane.ops',
      key: createLocalJWKSet({ keys: [key] }),
    });
    const token = await new SignJWT({
      scope_ids: ['workspace.acme'],
      project_ids: ['project.acme'],
    })
      .setProtectedHeader({ alg: 'ES256', kid: key.kid })
      .setIssuer('https://identity.example.com')
      .setAudience('unisane.ops')
      .setSubject('service.gateway')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    await expect(authorizer.authorize({ scheme: 'bearer', token })).resolves.toEqual({
      authenticated: true,
      audience: 'unisane.ops',
      principalId: 'service.gateway',
      allowedScopeIds: ['workspace.acme'],
      allowedProjectIds: ['project.acme'],
    });
  });

  it('returns one safe error for unverifiable identity', async () => {
    const { publicKey } = await generateKeyPair('ES256');
    const key = await exportJWK(publicKey);
    key.kid = 'other-key';
    const authorizer = createOidcWorkloadIdentityAuthorizer({
      issuer: 'https://identity.example.com',
      audience: 'unisane.ops',
      key: createLocalJWKSet({ keys: [key] }),
    });

    await expect(
      authorizer.authorize({ scheme: 'bearer', token: 'not-a-token' }),
    ).rejects.toMatchObject({
      code: 'authentication-invalid',
      safeMessage: 'Authentication could not be verified.',
      retryable: false,
    });
  });
});
