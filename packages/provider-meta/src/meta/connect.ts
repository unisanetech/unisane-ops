import type { FetchLike } from '@unisane/growth/contracts';
import { assessMarketingMetaConnection } from '@unisane/growth/marketing';
import {
  discoverMetaConnection,
  probeMetaConnectionIdentity,
  type MetaConnectionDiscoveryOptions,
  type MetaConnectionDiscoveryResult,
} from './connection-discovery.js';
import {
  createMetaConnectionRecord,
  projectMetaConnectionStatus,
  type MetaConnectionObservation,
  type MetaConnectionRecord,
} from './connection.js';
import { refreshMetaConnectionRecord, rotateMetaConnectionRecord } from './connection-lifecycle.js';
import { readMetaConnectionRecord, writeMetaConnectionRecord } from './connection-store.js';
import type { MetaHostCredentialResolver } from './credential-execution.js';
import {
  createMacOsMetaCredentialResolver,
  type MetaCredentialContext,
  type MetaCredentialReference,
} from './local-credential-resolver.js';
import {
  createMacOsMetaKeychainCredentialStore,
  type MetaLocalCredentialStore,
} from './local-credential-store.js';
import type { MetaReadSleep } from './read-transport.js';
import {
  createTerminalMetaCredentialPrompt,
  type MetaCredentialPrompt,
} from './terminal-credential-prompt.js';

import {
  guideMetaResourceSelection,
  selectionResources,
  type MarketingMetaResourceType,
  type MetaResourcePrompt,
} from './connection-resource-selection.js';
import { createTerminalMetaResourcePrompt } from './terminal-resource-prompt.js';

export interface MetaCredentialIngress {
  withCredential<T>(input: {
    environmentVariable: string;
    use(credential: Uint8Array): Promise<T>;
  }): Promise<T>;
}

export interface MetaConnectDependencies {
  fetch?: FetchLike;
  now?: () => Date;
  sleep?: MetaReadSleep;
  credentialIngress?: MetaCredentialIngress;
  credentialStore?: MetaLocalCredentialStore;
  credentialResolver?: MetaHostCredentialResolver;
  credentialPrompt?: MetaCredentialPrompt;
  resourcePrompt?: MetaResourcePrompt;
  environment?: NodeJS.ProcessEnv;
}

export interface MetaLifecycleContributionContext {
  cwd: string;
  argv: readonly string[];
  json: boolean;
}

export interface MetaLifecycleContributionResult {
  schemaVersion: 1;
  status: 'ok' | 'failed' | 'invalid' | 'attention' | 'blocked' | 'approval-required';
  actualEffect: 'offline' | 'read-network' | 'write' | 'spend-impact';
  writeTargets: Array<'project' | 'secret-store' | 'remote'>;
  result: unknown;
  diagnostics: string[];
  artifacts: string[];
  nextActions: string[];
}

export function defineMetaLifecycleContributionResult(
  input: MetaLifecycleContributionResult,
): MetaLifecycleContributionResult {
  return input;
}

export interface MetaConnectRequest {
  context: MetaLifecycleContributionContext;
  scopeId: string;
  projectId: string;
  environmentId: string;
  recordPath: string;
  requiredServices: readonly string[];
}

interface ParsedArguments {
  connectionId: string;
  displayName?: string;
  credentialEnvironment: string;
  identityKind: 'user' | 'system-user';
  refresh: boolean;
  rotate: boolean;
  selections: Map<MarketingMetaResourceType, string>;
  discovery: MetaConnectionDiscoveryOptions;
}

const RESOURCE_FLAGS: ReadonlyArray<readonly [string, MarketingMetaResourceType]> = [
  ['--business', 'business'],
  ['--ad-account', 'ad-account'],
  ['--pixel', 'pixel'],
  ['--dataset', 'dataset'],
  ['--page', 'page'],
  ['--instagram-account', 'instagram-account'],
];

function option(argv: readonly string[], name: string): string | undefined {
  const values = argv.flatMap((argument, index) =>
    argument === name && argv[index + 1] ? [argv[index + 1]!] : [],
  );
  if (values.length > 1) {
    throw new Error(`[META_CONNECT_ARGUMENT_DUPLICATE] ${name} may be passed only once.`);
  }
  return values[0];
}

function integerOption(
  argv: readonly string[],
  name: string,
  bounds: { minimum: number; maximum: number },
): number | undefined {
  const raw = option(argv, name);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < bounds.minimum || value > bounds.maximum) {
    throw new Error(
      `[META_CONNECT_ARGUMENT_INVALID] ${name} must be an integer from ${bounds.minimum} to ${bounds.maximum}.`,
    );
  }
  return value;
}

function parseArguments(argv: readonly string[]): ParsedArguments {
  const valueFlags = new Set([
    '--connection',
    '--display-name',
    '--credential-env',
    '--identity-kind',
    '--environment',
    '--service',
    '--api-version',
    '--page-size',
    '--max-pages',
    '--max-businesses',
    '--timeout-ms',
    '--max-retries',
    '--max-retry-after-seconds',
    ...RESOURCE_FLAGS.map(([flag]) => flag),
  ]);
  const booleanFlags = new Set(['--refresh', '--rotate']);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (booleanFlags.has(argument)) continue;
    if (!valueFlags.has(argument)) {
      throw new Error(`[META_CONNECT_ARGUMENT_UNKNOWN] Unknown argument '${argument}'.`);
    }
    if (!argv[index + 1] || argv[index + 1]!.startsWith('--')) {
      throw new Error(`[META_CONNECT_ARGUMENT_REQUIRED] ${argument} requires a value.`);
    }
    index += 1;
  }
  const refresh = argv.includes('--refresh');
  const rotate = argv.includes('--rotate');
  if (refresh && rotate) {
    throw new Error('[META_CONNECT_MODE_CONFLICT] Refresh and rotation are mutually exclusive.');
  }
  const identityKind = option(argv, '--identity-kind') ?? 'system-user';
  if (identityKind !== 'user' && identityKind !== 'system-user') {
    throw new Error(
      '[META_CONNECT_IDENTITY_KIND_INVALID] Identity kind must be user or system-user.',
    );
  }
  const credentialEnvironment = option(argv, '--credential-env') ?? 'META_GRAPH_ACCESS_TOKEN';
  if (!/^[A-Z][A-Z0-9_]{0,99}$/.test(credentialEnvironment)) {
    throw new Error(
      '[META_CONNECT_CREDENTIAL_ENV_INVALID] The credential environment variable name is invalid.',
    );
  }
  const selections = new Map<MarketingMetaResourceType, string>();
  for (const [flag, resourceType] of RESOURCE_FLAGS) {
    const value = option(argv, flag)?.trim();
    if (value) selections.set(resourceType, value);
  }
  return {
    connectionId: option(argv, '--connection') ?? 'meta-primary',
    ...(option(argv, '--display-name') ? { displayName: option(argv, '--display-name') } : {}),
    credentialEnvironment,
    identityKind,
    refresh,
    rotate,
    selections,
    discovery: {
      ...(option(argv, '--api-version') ? { apiVersion: option(argv, '--api-version') } : {}),
      ...(integerOption(argv, '--page-size', { minimum: 1, maximum: 100 }) !== undefined
        ? { pageSize: integerOption(argv, '--page-size', { minimum: 1, maximum: 100 }) }
        : {}),
      ...(integerOption(argv, '--max-pages', { minimum: 1, maximum: 20 }) !== undefined
        ? { maxPages: integerOption(argv, '--max-pages', { minimum: 1, maximum: 20 }) }
        : {}),
      ...(integerOption(argv, '--max-businesses', { minimum: 1, maximum: 25 }) !== undefined
        ? {
            maxBusinesses: integerOption(argv, '--max-businesses', {
              minimum: 1,
              maximum: 25,
            }),
          }
        : {}),
      ...(integerOption(argv, '--timeout-ms', { minimum: 250, maximum: 30_000 }) !== undefined
        ? {
            timeoutMs: integerOption(argv, '--timeout-ms', {
              minimum: 250,
              maximum: 30_000,
            }),
          }
        : {}),
      ...(integerOption(argv, '--max-retries', { minimum: 0, maximum: 3 }) !== undefined
        ? { maxRetries: integerOption(argv, '--max-retries', { minimum: 0, maximum: 3 }) }
        : {}),
      ...(integerOption(argv, '--max-retry-after-seconds', { minimum: 0, maximum: 60 }) !==
      undefined
        ? {
            maxRetryAfterSeconds: integerOption(argv, '--max-retry-after-seconds', {
              minimum: 0,
              maximum: 60,
            }),
          }
        : {}),
    },
  };
}

export function createDefaultMetaCredentialIngress(input: {
  environment: NodeJS.ProcessEnv;
  prompt: MetaCredentialPrompt;
  interactive: boolean;
}): MetaCredentialIngress {
  return {
    async withCredential({ environmentVariable, use }) {
      const value = input.environment[environmentVariable];
      if (value?.trim()) {
        delete input.environment[environmentVariable];
        const credential = new TextEncoder().encode(value.trim());
        try {
          return await use(credential);
        } finally {
          credential.fill(0);
        }
      }
      if (!input.interactive || !input.prompt.isAvailable()) {
        throw new Error(
          `[META_CONNECT_CREDENTIAL_UNAVAILABLE] Use an interactive terminal, provide ${environmentVariable} through the process environment for non-interactive execution, or use --refresh with an existing Keychain binding.`,
        );
      }
      const credential = await input.prompt.readCredential({
        message: 'Meta access token (stored securely in macOS Keychain): ',
      });
      if (!credential) {
        throw new Error('[META_CONNECT_CREDENTIAL_CANCELLED] Meta connection was cancelled.');
      }
      try {
        return await use(credential);
      } finally {
        credential.fill(0);
      }
    },
  };
}

function credentialText(credential: Uint8Array): string {
  let value: string;
  try {
    value = new TextDecoder('utf-8', { fatal: true }).decode(credential).trim();
  } catch {
    throw new Error('[META_CONNECTION_CREDENTIAL_INVALID] The Meta credential is not valid UTF-8.');
  }
  if (!value || value.length > 16_384) {
    throw new Error(
      '[META_CONNECTION_CREDENTIAL_INVALID] The Meta credential is empty or exceeds the supported bound.',
    );
  }
  return value;
}

function binding(input: {
  request: MetaConnectRequest;
  connectionId: string;
  credentialId: string;
  version: number;
}): { reference: MetaCredentialReference; context: MetaCredentialContext } {
  return {
    reference: { credentialId: input.credentialId, version: input.version },
    context: {
      scopeId: input.request.scopeId,
      projectId: input.request.projectId,
      environmentId: input.request.environmentId,
      connectionId: input.connectionId,
      provider: 'meta',
      secretKind: 'meta-graph-access',
    },
  };
}

async function observeConnection(input: {
  request: MetaConnectRequest;
  parsed: ParsedArguments;
  current: MetaConnectionRecord | null;
  credential: Uint8Array;
  credentialId: string;
  version: number;
  fetch: FetchLike;
  now: Date;
  sleep?: MetaReadSleep;
  resourcePrompt: MetaResourcePrompt;
}): Promise<{ connection: MetaConnectionRecord; discovery: MetaConnectionDiscoveryResult }> {
  const accessToken = credentialText(input.credential);
  const identity = await probeMetaConnectionIdentity({
    connectionId: input.parsed.connectionId,
    identityKind: input.current?.identity?.kind ?? input.parsed.identityKind,
    accessToken,
    fetch: input.fetch,
    options: input.parsed.discovery,
    ...(input.sleep ? { sleep: input.sleep } : {}),
  });
  const observedAt = input.now.toISOString();
  const provisional = createMetaConnectionRecord({
    displayName: input.parsed.displayName ?? input.current?.displayName ?? 'Meta',
    observation: {
      scopeId: input.request.scopeId,
      projectId: input.request.projectId,
      environmentId: input.request.environmentId,
      connectionId: input.parsed.connectionId,
      identity,
      credential: {
        secretReference: input.credentialId,
        secretKind: 'meta-graph-access',
        version: input.version,
        state: 'active',
        observedAt,
      },
      grants: [],
      resources: [],
      observedAt,
    },
  });
  const discovery = await discoverMetaConnection({
    connection: provisional,
    accessToken,
    fetch: input.fetch,
    options: input.parsed.discovery,
    now: input.now,
    ...(input.sleep ? { sleep: input.sleep } : {}),
  });
  const selections = await guideMetaResourceSelection({
    projectId: input.request.projectId,
    environmentId: input.request.environmentId,
    requiredServices: input.request.requiredServices,
    discovery,
    previous: input.current?.resources ?? [],
    selections: input.parsed.selections,
    interactive: !input.request.context.json,
    prompt: input.resourcePrompt,
  });
  const observation: MetaConnectionObservation = {
    scopeId: input.request.scopeId,
    projectId: input.request.projectId,
    environmentId: input.request.environmentId,
    connectionId: input.parsed.connectionId,
    identity: discovery.identity,
    credential: provisional.credential,
    grants: discovery.grants,
    resources: selectionResources({
      selections,
      discovery,
      previous: input.current?.resources ?? [],
    }),
    observedAt,
  };
  const connection = !input.current
    ? createMetaConnectionRecord({ displayName: provisional.displayName, observation })
    : input.parsed.rotate
      ? rotateMetaConnectionRecord(input.current, observation)
      : refreshMetaConnectionRecord(input.current, observation);
  return { connection, discovery };
}

function assertCurrentContext(
  request: MetaConnectRequest,
  connectionId: string,
  current: MetaConnectionRecord,
): void {
  if (
    current.scopeId !== request.scopeId ||
    current.projectId !== request.projectId ||
    current.environmentId !== request.environmentId ||
    current.connectionId !== connectionId
  ) {
    throw new Error(
      '[META_CONNECT_CONTEXT_MISMATCH] The existing connection belongs to another scope, project, environment, or connection.',
    );
  }
}

export async function connectMeta(
  request: MetaConnectRequest,
  dependencies: MetaConnectDependencies = {},
): Promise<MetaLifecycleContributionResult> {
  const parsed = parseArguments(request.context.argv);
  const current = readMetaConnectionRecord({
    projectRoot: request.context.cwd,
    recordPath: request.recordPath,
  });
  if (current) assertCurrentContext(request, parsed.connectionId, current);
  if (current && !parsed.refresh && !parsed.rotate) {
    throw new Error(
      '[META_CONNECT_MODE_REQUIRED] An existing connection requires --refresh or --rotate.',
    );
  }
  if (!current && (parsed.refresh || parsed.rotate)) {
    throw new Error(
      '[META_CONNECT_RECORD_REQUIRED] Refresh or rotation requires an existing Meta connection.',
    );
  }
  const now = (dependencies.now ?? (() => new Date()))();
  const fetcher = dependencies.fetch ?? fetch;
  const credentialId = current?.credential.secretReference ?? `${parsed.connectionId}-graph`;
  const version = current ? current.credential.version + (parsed.rotate ? 1 : 0) : 1;
  const currentBinding = current
    ? binding({
        request,
        connectionId: parsed.connectionId,
        credentialId: current.credential.secretReference,
        version: current.credential.version,
      })
    : null;
  const nextBinding = binding({
    request,
    connectionId: parsed.connectionId,
    credentialId,
    version,
  });
  const store = dependencies.credentialStore ?? createMacOsMetaKeychainCredentialStore();
  const runWithCredential = async <T>(use: (credential: Uint8Array) => Promise<T>): Promise<T> => {
    if (parsed.refresh) {
      const resolver = dependencies.credentialResolver ?? createMacOsMetaCredentialResolver();
      return resolver.withCredential({ ...nextBinding, use });
    }
    const ingress =
      dependencies.credentialIngress ??
      createDefaultMetaCredentialIngress({
        environment: dependencies.environment ?? process.env,
        prompt: dependencies.credentialPrompt ?? createTerminalMetaCredentialPrompt(),
        interactive: !request.context.json,
      });
    return ingress.withCredential({
      environmentVariable: parsed.credentialEnvironment,
      use,
    });
  };

  let storedNext = false;
  const outcome = await runWithCredential(async (credential) => {
    const observed = await observeConnection({
      request,
      parsed,
      current,
      credential,
      credentialId,
      version,
      fetch: fetcher,
      now,
      resourcePrompt: dependencies.resourcePrompt ?? createTerminalMetaResourcePrompt(),
      ...(dependencies.sleep ? { sleep: dependencies.sleep } : {}),
    });
    if (!parsed.refresh) {
      store.write({ ...nextBinding, credential });
      storedNext = true;
    }
    return observed;
  });

  let artifact: string;
  try {
    artifact = writeMetaConnectionRecord({
      projectRoot: request.context.cwd,
      recordPath: request.recordPath,
      connection: outcome.connection,
    });
  } catch (error) {
    if (storedNext) store.remove(nextBinding);
    throw error;
  }
  if (parsed.rotate && currentBinding) store.remove(currentBinding);

  const status = projectMetaConnectionStatus(outcome.connection);
  const assessment = assessMarketingMetaConnection(status, {
    requiredServices: request.requiredServices.filter(
      (service): service is 'ads-insights' | 'event-measurement' =>
        service === 'ads-insights' || service === 'event-measurement',
    ),
    now,
  });
  const diagnostics = outcome.discovery.areas.flatMap((area) =>
    area.state === 'ready'
      ? []
      : [`[META_DISCOVERY_${area.state.toUpperCase()}] ${area.area} is ${area.state}.`],
  );
  return defineMetaLifecycleContributionResult({
    schemaVersion: 1,
    status: assessment.ready ? 'ok' : 'attention',
    actualEffect: 'write',
    writeTargets: parsed.refresh ? ['project'] : ['project', 'secret-store'],
    result: {
      provider: 'meta',
      connectionId: outcome.connection.connectionId,
      environmentId: outcome.connection.environmentId,
      recordPath: request.recordPath,
      credentialState: outcome.connection.credential.state,
      resources: outcome.connection.resources,
    },
    diagnostics,
    artifacts: [artifact],
    nextActions: assessment.ready
      ? ['Run `unisane-ops check` and then perform controlled non-production Meta verification.']
      : [
          'Review the returned candidate IDs, then re-run `unisane-ops connect meta --refresh` with one exact --ad-account and at least one --pixel or --dataset selection.',
        ],
  });
}
