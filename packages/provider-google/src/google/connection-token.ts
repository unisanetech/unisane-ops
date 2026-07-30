import { assertRequiredScope, refreshAccessToken } from './auth/oauth.js';
import {
  googleConnectionRecordSchema,
  type GoogleConnectionRecord,
  type GoogleConnectionService,
} from './connection.js';
import { readGoogleConnectionKeychainSecret } from './connection-keychain.js';

export type GoogleConnectionCredentials = {
  accessToken: string;
  developerToken?: string;
};

export async function resolveGoogleConnectionCredentials(args: {
  connection: GoogleConnectionRecord;
  service: GoogleConnectionService;
  requiredScope?: string;
}): Promise<GoogleConnectionCredentials> {
  const connection = googleConnectionRecordSchema.parse(args.connection);
  if (connection.credentialState !== 'active' || !connection.oauth) {
    throw new Error(
      `[GOOGLE_CONNECTION_NOT_ACTIVE] Google connection '${connection.connectionId}' is not locally active.`,
    );
  }
  const grant = connection.grants.find((candidate) => candidate.service === args.service);
  if (!grant || grant.state !== 'granted') {
    throw new Error(
      `[GOOGLE_CONNECTION_GRANT_MISSING] Google connection '${connection.connectionId}' does not grant ${args.service}.`,
    );
  }
  if (args.requiredScope) {
    assertRequiredScope({
      profileScopes: grant.scopes,
      requiredScope: args.requiredScope,
    });
  }
  const refreshToken = readGoogleConnectionKeychainSecret({
    connectionId: connection.connectionId,
    field: 'refresh-token',
  });
  if (!refreshToken) {
    throw new Error(
      `[GOOGLE_CONNECTION_SECRET_MISSING] Refresh credential for '${connection.connectionId}' is unavailable.`,
    );
  }
  const clientSecret = connection.oauth.clientSecretReference
    ? readGoogleConnectionKeychainSecret({
        connectionId: connection.connectionId,
        field: 'client-secret',
      })
    : null;
  const token = await refreshAccessToken({
    clientId: connection.oauth.clientId,
    ...(clientSecret ? { clientSecret } : {}),
    refreshToken,
  });
  if (args.requiredScope) {
    assertRequiredScope({
      grantedScope: token.scope,
      profileScopes: grant.scopes,
      requiredScope: args.requiredScope,
    });
  }
  const developerToken =
    args.service === 'ads'
      ? readGoogleConnectionKeychainSecret({
          connectionId: connection.connectionId,
          field: 'ads-developer-token',
        })
      : null;
  return {
    accessToken: token.accessToken,
    ...(developerToken ? { developerToken } : {}),
  };
}

export async function resolveGoogleConnectionAccessToken(args: {
  connection: GoogleConnectionRecord;
  service: GoogleConnectionService;
  requiredScope?: string;
}): Promise<string> {
  return (await resolveGoogleConnectionCredentials(args)).accessToken;
}
