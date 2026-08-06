import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import { OpsActionExecutionError } from '@unisane/ops-engine/actions';
import type { HostedReadAuthorization } from '@unisane/ops-engine/hosted';

export interface HostedGatewayAuthentication {
  scheme: 'bearer';
  token: string;
}

export interface HostedGatewayAuthorization extends HostedReadAuthorization {
  allowedProjectIds: readonly string[];
}

export interface HostedWorkloadIdentityAuthorizer {
  authorize(authentication: HostedGatewayAuthentication): Promise<HostedGatewayAuthorization>;
}

const claimsSchema = z.object({
  sub: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
  scope_ids: z.array(z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)).min(1),
  project_ids: z.array(z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/)).min(1),
});

export function createOidcWorkloadIdentityAuthorizer(input: {
  issuer: string;
  audience: string;
  key: JWTVerifyGetKey;
}): HostedWorkloadIdentityAuthorizer {
  return {
    async authorize(authentication) {
      if (authentication.scheme !== 'bearer' || !authentication.token) {
        throw new OpsActionExecutionError('authentication-required', 'Authentication is required.');
      }
      try {
        const verified = await jwtVerify(authentication.token, input.key, {
          issuer: input.issuer,
          audience: input.audience,
          algorithms: ['ES256', 'RS256'],
        });
        const claims = claimsSchema.parse(verified.payload);
        return {
          authenticated: true,
          audience: 'unisane.ops',
          principalId: claims.sub,
          allowedScopeIds: claims.scope_ids,
          allowedProjectIds: claims.project_ids,
        };
      } catch {
        throw new OpsActionExecutionError(
          'authentication-invalid',
          'Authentication could not be verified.',
        );
      }
    },
  };
}

export function createRemoteOidcWorkloadIdentityAuthorizer(input: {
  issuer: string;
  audience: string;
  jwksUrl: string;
}): HostedWorkloadIdentityAuthorizer {
  return createOidcWorkloadIdentityAuthorizer({
    issuer: input.issuer,
    audience: input.audience,
    key: createRemoteJWKSet(new URL(input.jwksUrl)),
  });
}
