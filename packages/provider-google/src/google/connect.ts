import {
  defineOpsLifecycleContributionResult,
  type OpsLifecycleContributionContext,
  type OpsLifecycleContributionResult,
} from '@unisane/ops-engine/lifecycle';
import {
  exchangeAuthorizationCode,
  parsePort,
  parseTimeoutMs,
  waitForAuthorizationCode,
} from './auth/oauth.js';
import {
  defineGoogleConnectionRecord,
  googleConnectionServiceSchema,
  type GoogleConnectionGrant,
  type GoogleConnectionRecord,
  type GoogleConnectionService,
  type GoogleResourceSelection,
} from './connection.js';
import {
  discoverGoogleConnectionResources,
  type GoogleResourceDiscoveryIssue,
} from './connection-discovery.js';
import { writeGoogleConnectionKeychainSecret } from './connection-keychain.js';
import { writeGoogleConnectionRecord } from './connection-store.js';

const SCOPES_BY_SERVICE: Record<GoogleConnectionService, readonly string[]> = {
  'project-administration': ['https://www.googleapis.com/auth/cloud-platform'],
  'search-console': ['https://www.googleapis.com/auth/webmasters.readonly'],
  analytics: ['https://www.googleapis.com/auth/analytics.readonly'],
  'tag-manager': ['https://www.googleapis.com/auth/tagmanager.readonly'],
  ads: ['https://www.googleapis.com/auth/adwords'],
};

interface GoogleConnectRequest {
  context: OpsLifecycleContributionContext;
  projectId: string;
  environmentId: string;
  recordPath: string;
  requiredServices: readonly string[];
}

interface ParsedGoogleConnectArguments {
  connectionId: string;
  displayName: string;
  clientId?: string;
  clientSecretEnvironment: string;
  developerTokenEnvironment: string;
  externalSecretReference?: string;
  port?: string;
  timeoutMs?: string;
  resources: GoogleResourceSelection[];
}

function option(argv: readonly string[], name: string): string | undefined {
  const indexes = argv
    .map((argument, index) => (argument === name ? index : -1))
    .filter((index) => index >= 0);
  if (indexes.length > 1) {
    throw new Error(`[GOOGLE_CONNECT_ARGUMENT_DUPLICATE] ${name} may be passed only once.`);
  }
  const index = indexes[0];
  if (index === undefined) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`[GOOGLE_CONNECT_ARGUMENT_REQUIRED] ${name} requires a value.`);
  }
  return value;
}

function resourceSelections(
  argv: readonly string[],
  observedAt: string,
): GoogleResourceSelection[] {
  const descriptors = [
    ['--search-console-site', 'search-console', 'site'],
    ['--analytics-property', 'analytics', 'property'],
    ['--tag-manager-container', 'tag-manager', 'container'],
    ['--ads-customer', 'ads', 'customer'],
    ['--ads-manager-customer', 'ads', 'manager-customer'],
  ] as const;
  return descriptors.flatMap(([flag, service, resourceType]) => {
    const values = argv.flatMap((argument, index) =>
      argument === flag && argv[index + 1] ? [argv[index + 1]!] : [],
    );
    return values.map((resourceId) => ({
      service,
      resourceType,
      resourceId,
      displayName: resourceId,
      state: 'selected' as const,
      observedAt,
    }));
  });
}

function parseArguments(argv: readonly string[], observedAt: string): ParsedGoogleConnectArguments {
  const allowed = new Set([
    '--connection',
    '--display-name',
    '--client-id',
    '--client-secret-env',
    '--ads-developer-token-env',
    '--secret-reference',
    '--port',
    '--timeout-ms',
    '--environment',
    '--service',
    '--search-console-site',
    '--analytics-property',
    '--tag-manager-container',
    '--ads-customer',
    '--ads-manager-customer',
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (!argument.startsWith('--') || !allowed.has(argument)) {
      throw new Error(`[GOOGLE_CONNECT_ARGUMENT_UNKNOWN] Unknown argument '${argument}'.`);
    }
    if (!argv[index + 1] || argv[index + 1]!.startsWith('--')) {
      throw new Error(`[GOOGLE_CONNECT_ARGUMENT_REQUIRED] ${argument} requires a value.`);
    }
    index += 1;
  }
  const connectionId = option(argv, '--connection') ?? 'google-primary';
  return {
    connectionId,
    displayName: option(argv, '--display-name') ?? 'Google',
    clientId: option(argv, '--client-id') ?? process.env.GOOGLE_OAUTH_CLIENT_ID?.trim(),
    clientSecretEnvironment: option(argv, '--client-secret-env') ?? 'GOOGLE_OAUTH_CLIENT_SECRET',
    developerTokenEnvironment:
      option(argv, '--ads-developer-token-env') ?? 'GOOGLE_ADS_DEVELOPER_TOKEN',
    externalSecretReference: option(argv, '--secret-reference'),
    port: option(argv, '--port'),
    timeoutMs: option(argv, '--timeout-ms'),
    resources: resourceSelections(argv, observedAt),
  };
}

function services(input: readonly string[]): GoogleConnectionService[] {
  return [...new Set(input.map((service) => googleConnectionServiceSchema.parse(service)))];
}

function grants(
  selectedServices: readonly GoogleConnectionService[],
  state: GoogleConnectionGrant['state'],
  observedAt: string,
): GoogleConnectionGrant[] {
  return selectedServices.map((service) => ({
    service,
    scopes: [...SCOPES_BY_SERVICE[service]],
    state,
    observedAt,
  }));
}

function recordFromExternalReference(args: {
  request: GoogleConnectRequest;
  parsed: ParsedGoogleConnectArguments;
  observedAt: string;
  selectedServices: readonly GoogleConnectionService[];
}): { connection: GoogleConnectionRecord; issues: GoogleResourceDiscoveryIssue[] } {
  return {
    connection: defineGoogleConnectionRecord({
      schemaVersion: 1,
      provider: 'google',
      connectionId: args.parsed.connectionId,
      displayName: args.parsed.displayName,
      projectId: args.request.projectId,
      environmentId: args.request.environmentId,
      secretReference: args.parsed.externalSecretReference!,
      credentialState: 'missing',
      grants: grants(args.selectedServices, 'missing', args.observedAt),
      resources: args.parsed.resources,
      createdAt: args.observedAt,
      updatedAt: args.observedAt,
    }),
    issues: [],
  };
}

async function recordFromOAuth(args: {
  request: GoogleConnectRequest;
  parsed: ParsedGoogleConnectArguments;
  observedAt: string;
  selectedServices: readonly GoogleConnectionService[];
}): Promise<{ connection: GoogleConnectionRecord; issues: GoogleResourceDiscoveryIssue[] }> {
  if (!args.parsed.clientId) {
    throw new Error(
      '[GOOGLE_CONNECTION_CLIENT_ID_REQUIRED] Pass --client-id or set GOOGLE_OAUTH_CLIENT_ID for the OAuth bootstrap.',
    );
  }
  const scopes = [
    ...new Set(args.selectedServices.flatMap((service) => SCOPES_BY_SERVICE[service])),
  ];
  const auth = await waitForAuthorizationCode({
    clientId: args.parsed.clientId,
    scopes,
    port: parsePort(args.parsed.port),
    timeoutMs: parseTimeoutMs(args.parsed.timeoutMs),
    json: args.request.context.json,
  });
  const clientSecret = process.env[args.parsed.clientSecretEnvironment]?.trim();
  const token = await exchangeAuthorizationCode({
    clientId: args.parsed.clientId,
    ...(clientSecret ? { clientSecret } : {}),
    code: auth.code,
    codeVerifier: auth.codeVerifier,
    redirectUri: auth.redirectUri,
  });
  if (typeof token.refresh_token !== 'string' || !token.refresh_token.trim()) {
    throw new Error(
      '[GOOGLE_CONNECTION_REFRESH_TOKEN_MISSING] Google did not return a refresh token. Re-run the connection with consent.',
    );
  }
  writeGoogleConnectionKeychainSecret({
    connectionId: args.parsed.connectionId,
    field: 'refresh-token',
    value: token.refresh_token,
  });
  if (clientSecret) {
    writeGoogleConnectionKeychainSecret({
      connectionId: args.parsed.connectionId,
      field: 'client-secret',
      value: clientSecret,
    });
  }
  const developerToken = process.env[args.parsed.developerTokenEnvironment]?.trim();
  if (developerToken) {
    writeGoogleConnectionKeychainSecret({
      connectionId: args.parsed.connectionId,
      field: 'ads-developer-token',
      value: developerToken,
    });
  }
  if (typeof token.access_token !== 'string' || !token.access_token.trim()) {
    throw new Error(
      '[GOOGLE_CONNECTION_ACCESS_TOKEN_MISSING] Google did not return temporary access for resource discovery.',
    );
  }
  const discovery = await discoverGoogleConnectionResources({
    accessToken: token.access_token,
    services: args.selectedServices,
    explicitResources: args.parsed.resources,
    ...(developerToken ? { developerToken } : {}),
    observedAt: args.observedAt,
  });
  const secretReference = `${args.parsed.connectionId}-oauth`;
  const inaccessibleServices = new Set(
    discovery.issues
      .filter((issue) => issue.state === 'inaccessible')
      .map((issue) => issue.service),
  );
  return {
    connection: defineGoogleConnectionRecord({
      schemaVersion: 1,
      provider: 'google',
      connectionId: args.parsed.connectionId,
      displayName: args.parsed.displayName,
      projectId: args.request.projectId,
      environmentId: args.request.environmentId,
      secretReference,
      oauth: {
        clientId: args.parsed.clientId,
        ...(clientSecret
          ? { clientSecretReference: `${args.parsed.connectionId}-client-secret` }
          : {}),
      },
      credentialState: 'active',
      grants: grants(args.selectedServices, 'granted', args.observedAt).map((grant) =>
        inaccessibleServices.has(grant.service)
          ? {
              ...grant,
              state: 'partial',
              issueCode: `google.grant.${grant.service}.discovery-inaccessible`,
            }
          : grant,
      ),
      resources: discovery.resources,
      createdAt: args.observedAt,
      updatedAt: args.observedAt,
      lastVerifiedAt: args.observedAt,
    }),
    issues: discovery.issues,
  };
}

export async function connectGoogle(
  request: GoogleConnectRequest,
): Promise<OpsLifecycleContributionResult> {
  const observedAt = new Date().toISOString();
  const parsed = parseArguments(request.context.argv, observedAt);
  const selectedServices = services([
    ...request.requiredServices,
    ...request.context.argv.flatMap((argument, index) =>
      argument === '--service' && request.context.argv[index + 1]
        ? [request.context.argv[index + 1]!]
        : [],
    ),
  ]);
  const outcome = parsed.externalSecretReference
    ? recordFromExternalReference({
        request,
        parsed,
        observedAt,
        selectedServices,
      })
    : await recordFromOAuth({
        request,
        parsed,
        observedAt,
        selectedServices,
      });
  const connection = outcome.connection;
  const artifact = writeGoogleConnectionRecord({
    projectRoot: request.context.cwd,
    recordPath: request.recordPath,
    connection,
  });
  return defineOpsLifecycleContributionResult({
    schemaVersion: 1,
    status:
      connection.credentialState === 'active' && outcome.issues.length === 0 ? 'ok' : 'attention',
    actualEffect: 'write',
    writeTargets:
      connection.credentialState === 'active' ? ['project', 'secret-store'] : ['project'],
    result: {
      provider: 'google',
      connectionId: connection.connectionId,
      environmentId: connection.environmentId,
      recordPath: request.recordPath,
      credentialState: connection.credentialState,
      resources: connection.resources,
    },
    diagnostics: outcome.issues.map((issue) => `[${issue.code}] ${issue.message}`),
    artifacts: [artifact],
    nextActions:
      connection.credentialState === 'active' && outcome.issues.length === 0
        ? ['Run `unisane-ops check` to review resource and data readiness.']
        : outcome.issues.length > 0
          ? [
              'Choose ambiguous resources with the matching `unisane-ops connect google --<resource> <id>` option, or resolve the named access blocker.',
            ]
          : [
              'Bind and verify the external Google secret, then run `unisane-ops connect google` again.',
            ],
  });
}
