import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  cloudflareResourceTargetSchema,
  type CloudflareResolvedScriptSource,
  type CloudflareResourceTarget,
} from '@unisane/cloud/cloudflare-resources';
import { cloudDnsTargetContextSchema, type CloudDnsTargetContext } from '@unisane/cloud/contracts';
import {
  CLOUD_DNS_CONTEXT_BINDING,
  CLOUD_RESOURCE_CONTEXT_BINDING,
  CLOUDFLARE_DNS_PROVIDER_BINDING,
  CLOUDFLARE_RESOURCE_PROVIDER_BINDING,
  type CloudDnsArtifactAccess,
  type CloudDnsBindingRequest,
  type CloudDnsRuntimeBinding,
  type CloudflareResourceArtifactAccess,
  type CloudflareResourceBindingRequest,
  type CloudflareResourceRuntimeBinding,
} from '@unisane/cloud/runtime';
import {
  controlPlaneSafeArtifactStamp,
  resolveControlPlaneArtifactPath,
  type SecretResolver,
} from '@unisane/ops-engine';
import {
  createLocalOpsExecutionState,
  writeControlPlaneJsonArtifact,
} from '@unisane/ops-engine/local';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import type { OpsLifecycleContributionContext } from '@unisane/ops-engine/lifecycle';
import type {
  CloudflareConnectionArtifactAccess,
  CloudflareConnectionBindingRequest,
  CloudflareConnectionRuntimeBinding,
} from '@unisane/provider-cloudflare/runtime';
import { loadUnisaneOpsConfig } from '../config/loader.js';
import { isGrowthProviderBinding, resolveGrowthProviderBinding } from './growth.js';

const CLOUDFLARE_CONNECTION_BINDING = 'provider.cloudflare.connection';
const OPS_LIFECYCLE_ADD_BINDING = 'ops.lifecycle.add';
const OPS_LIFECYCLE_CONNECT_BINDING = 'ops.lifecycle.connect';
const OPS_LIFECYCLE_DISCONNECT_BINDING = 'ops.lifecycle.disconnect';
const OPS_LIFECYCLE_READINESS_BINDING = 'ops.lifecycle.readiness';

function isStringArray(input: unknown): input is string[] {
  return Array.isArray(input) && input.every((value) => typeof value === 'string');
}

function parseLifecycleAddRequest(input: unknown): {
  packId: string;
  itemType: string;
  context: OpsLifecycleContributionContext;
} {
  if (typeof input !== 'object' || input === null) {
    throw new Error('[OPS_LIFECYCLE_ADD_REQUEST_INVALID] Invalid add contribution request.');
  }
  const record = input as Record<string, unknown>;
  const context =
    typeof record.context === 'object' && record.context !== null
      ? (record.context as Record<string, unknown>)
      : null;
  if (
    typeof record.packId !== 'string' ||
    typeof record.itemType !== 'string' ||
    !context ||
    typeof context.cwd !== 'string' ||
    !isStringArray(context.argv) ||
    typeof context.json !== 'boolean'
  ) {
    throw new Error('[OPS_LIFECYCLE_ADD_REQUEST_INVALID] Invalid add contribution request.');
  }
  return {
    packId: record.packId,
    itemType: record.itemType,
    context: {
      cwd: context.cwd,
      argv: context.argv,
      json: context.json,
    },
  };
}

function parseLifecycleReadinessRequest(input: unknown): {
  provider: string;
  projectRoot: string;
  recordPath: string;
} {
  if (typeof input !== 'object' || input === null) {
    throw new Error(
      '[OPS_LIFECYCLE_READINESS_REQUEST_INVALID] Invalid readiness contribution request.',
    );
  }
  const record = input as Record<string, unknown>;
  if (
    typeof record.provider !== 'string' ||
    typeof record.projectRoot !== 'string' ||
    typeof record.recordPath !== 'string'
  ) {
    throw new Error(
      '[OPS_LIFECYCLE_READINESS_REQUEST_INVALID] Invalid readiness contribution request.',
    );
  }
  return {
    provider: record.provider,
    projectRoot: record.projectRoot,
    recordPath: record.recordPath,
  };
}

function parseLifecycleConnectRequest(input: unknown): {
  provider: string;
  packId: string;
  projectId: string;
  environmentId: string;
  recordPath: string;
  requiredServices: readonly string[];
  context: OpsLifecycleContributionContext;
} {
  if (typeof input !== 'object' || input === null) {
    throw new Error(
      '[OPS_LIFECYCLE_CONNECT_REQUEST_INVALID] Invalid connection contribution request.',
    );
  }
  const record = input as Record<string, unknown>;
  const context =
    typeof record.context === 'object' && record.context !== null
      ? (record.context as Record<string, unknown>)
      : null;
  if (
    typeof record.provider !== 'string' ||
    typeof record.packId !== 'string' ||
    typeof record.projectId !== 'string' ||
    typeof record.environmentId !== 'string' ||
    typeof record.recordPath !== 'string' ||
    !isStringArray(record.requiredServices) ||
    !context ||
    typeof context.cwd !== 'string' ||
    !isStringArray(context.argv) ||
    typeof context.json !== 'boolean'
  ) {
    throw new Error(
      '[OPS_LIFECYCLE_CONNECT_REQUEST_INVALID] Invalid connection contribution request.',
    );
  }
  return {
    provider: record.provider,
    packId: record.packId,
    projectId: record.projectId,
    environmentId: record.environmentId,
    recordPath: record.recordPath,
    requiredServices: record.requiredServices,
    context: {
      cwd: context.cwd,
      argv: context.argv,
      json: context.json,
    },
  };
}

function parseLifecycleDisconnectRequest(input: unknown): {
  provider: string;
  packId: string;
  projectId: string;
  environmentId: string;
  connectionId: string;
  recordPath: string;
  context: OpsLifecycleContributionContext;
} {
  if (typeof input !== 'object' || input === null) {
    throw new Error(
      '[OPS_LIFECYCLE_DISCONNECT_REQUEST_INVALID] Invalid disconnect contribution request.',
    );
  }
  const record = input as Record<string, unknown>;
  const context =
    typeof record.context === 'object' && record.context !== null
      ? (record.context as Record<string, unknown>)
      : null;
  if (
    typeof record.provider !== 'string' ||
    typeof record.packId !== 'string' ||
    typeof record.projectId !== 'string' ||
    typeof record.environmentId !== 'string' ||
    typeof record.connectionId !== 'string' ||
    typeof record.recordPath !== 'string' ||
    !context ||
    typeof context.cwd !== 'string' ||
    !isStringArray(context.argv) ||
    typeof context.json !== 'boolean'
  ) {
    throw new Error(
      '[OPS_LIFECYCLE_DISCONNECT_REQUEST_INVALID] Invalid disconnect contribution request.',
    );
  }
  return {
    provider: record.provider,
    packId: record.packId,
    projectId: record.projectId,
    environmentId: record.environmentId,
    connectionId: record.connectionId,
    recordPath: record.recordPath,
    context: {
      cwd: context.cwd,
      argv: context.argv,
      json: context.json,
    },
  };
}

function parseCloudDnsRequest(input: unknown): CloudDnsBindingRequest {
  if (typeof input !== 'object' || input === null || !('command' in input)) {
    throw new Error('[CLOUD_DNS_BINDING_REQUEST_INVALID] Invalid Cloud DNS binding request.');
  }
  const request = input as Partial<CloudDnsBindingRequest>;
  if (!request.command || !['inventory', 'import', 'plan', 'apply'].includes(request.command)) {
    throw new Error('[CLOUD_DNS_BINDING_REQUEST_INVALID] Invalid Cloud DNS command binding.');
  }
  return request as CloudDnsBindingRequest;
}

function parseCloudflareResourceRequest(input: unknown): CloudflareResourceBindingRequest {
  if (typeof input !== 'object' || input === null || !('command' in input) || !('focus' in input)) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_BINDING_REQUEST_INVALID] Invalid Cloudflare resource binding request.',
    );
  }
  const request = input as Partial<CloudflareResourceBindingRequest>;
  if (
    !request.command ||
    !['inventory', 'plan', 'apply', 'env', 'check'].includes(request.command) ||
    !request.focus ||
    !['zones', 'queues', 'workers', 'cron'].includes(request.focus)
  ) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_BINDING_REQUEST_INVALID] Invalid Cloudflare resource command binding.',
    );
  }
  return request as CloudflareResourceBindingRequest;
}

function parseCloudflareConnectionRequest(input: unknown): CloudflareConnectionBindingRequest {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('command' in input) ||
    input.command !== 'connection.check'
  ) {
    throw new Error(
      '[CLOUDFLARE_CONNECTION_BINDING_REQUEST_INVALID] Invalid Cloudflare connection request.',
    );
  }
  return input as CloudflareConnectionBindingRequest;
}

function selectId(args: {
  requested?: string;
  values: readonly string[];
  preferred?: string;
  label: 'connection' | 'target' | 'environment';
}): string {
  if (args.requested) {
    if (!args.values.includes(args.requested)) {
      throw new Error(
        `[UNISANE_OPS_${args.label.toUpperCase()}_UNKNOWN] Unknown ${args.label} '${args.requested}'.`,
      );
    }
    return args.requested;
  }
  if (args.preferred && args.values.includes(args.preferred)) return args.preferred;
  if (args.values.length === 1) return args.values[0];
  throw new Error(
    `[UNISANE_OPS_${args.label.toUpperCase()}_REQUIRED] Select a ${args.label} from: ${args.values.join(', ')}`,
  );
}

function createCloudflareConnectionArtifactAccess(args: {
  projectRoot: string;
  connectionId: string;
}): CloudflareConnectionArtifactAccess {
  return {
    writeJson({ outputPath, value }) {
      return writeControlPlaneJsonArtifact({
        cwd: args.projectRoot,
        outputPath,
        defaultRelativePath: path.join(
          '.unisane',
          'ops',
          'connections',
          args.connectionId,
          'inventory',
          `cloudflare-connection-${controlPlaneSafeArtifactStamp()}.json`,
        ),
        value,
        errorCode: 'UNISANE_OPS_ARTIFACT_PATH_OUTSIDE_PROJECT',
        label: 'Cloudflare connection report',
      });
    },
  };
}

function createArtifactAccess(args: {
  projectRoot: string;
  targetId: string;
  environment: string;
}): CloudDnsArtifactAccess {
  const base = path.join('.unisane', 'ops', args.targetId, args.environment);
  return {
    readJson(relativePath, label) {
      const artifact = resolveControlPlaneArtifactPath({
        cwd: args.projectRoot,
        outputPath: relativePath,
        defaultRelativePath: relativePath,
        errorCode: 'UNISANE_OPS_ARTIFACT_PATH_OUTSIDE_PROJECT',
        label: `Cloud DNS ${label}`,
      });
      try {
        return JSON.parse(readFileSync(artifact.path, 'utf8')) as unknown;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(
            `[UNISANE_OPS_ARTIFACT_NOT_FOUND] Cloud DNS ${label} was not found: ${artifact.relativePath}`,
          );
        }
        throw error;
      }
    },
    writeJson({ class: artifactClass, outputPath, value }) {
      const lane =
        artifactClass === 'inventory'
          ? 'inventory'
          : artifactClass === 'import'
            ? 'imports'
            : artifactClass === 'plan'
              ? 'plans'
              : 'receipts';
      return writeControlPlaneJsonArtifact({
        cwd: args.projectRoot,
        outputPath,
        defaultRelativePath: path.join(
          base,
          lane,
          `cloud-dns-${controlPlaneSafeArtifactStamp()}.json`,
        ),
        value,
        errorCode: 'UNISANE_OPS_ARTIFACT_PATH_OUTSIDE_PROJECT',
        label: `Cloud DNS ${artifactClass}`,
      });
    },
  };
}

function createResourceArtifactAccess(args: {
  projectRoot: string;
  targetId: string;
  environment: string;
}): CloudflareResourceArtifactAccess {
  const base = path.join('.unisane', 'ops', args.targetId, args.environment);
  return {
    readJson(relativePath, label) {
      const artifact = resolveControlPlaneArtifactPath({
        cwd: args.projectRoot,
        outputPath: relativePath,
        defaultRelativePath: relativePath,
        errorCode: 'UNISANE_OPS_ARTIFACT_PATH_OUTSIDE_PROJECT',
        label: `Cloudflare ${label}`,
      });
      try {
        return JSON.parse(readFileSync(artifact.path, 'utf8')) as unknown;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(
            `[UNISANE_OPS_ARTIFACT_NOT_FOUND] Cloudflare ${label} was not found: ${artifact.relativePath}`,
          );
        }
        throw error;
      }
    },
    writeJson({ class: artifactClass, focus, outputPath, value }) {
      const lane =
        artifactClass === 'inventory'
          ? 'inventory'
          : artifactClass === 'plan'
            ? 'plans'
            : artifactClass === 'receipt'
              ? 'receipts'
              : 'reports';
      return writeControlPlaneJsonArtifact({
        cwd: args.projectRoot,
        outputPath,
        defaultRelativePath: path.join(
          base,
          lane,
          `cloudflare-${focus}-${artifactClass}-${controlPlaneSafeArtifactStamp()}.json`,
        ),
        value,
        errorCode: 'UNISANE_OPS_ARTIFACT_PATH_OUTSIDE_PROJECT',
        label: `Cloudflare ${focus} ${artifactClass}`,
      });
    },
  };
}

function createResourceSourceAccess(projectRoot: string) {
  return {
    readText(relativePath: string): string {
      const absolute = path.resolve(projectRoot, relativePath);
      const relative = path.relative(projectRoot, absolute);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(
          `[UNISANE_OPS_SCRIPT_PATH_OUTSIDE_PROJECT] Worker script must stay inside the project: ${relativePath}`,
        );
      }
      return readFileSync(absolute, 'utf8');
    },
  };
}

function createEnvironmentSecretResolver(): SecretResolver {
  return {
    writable: false,
    async resolve(reference) {
      const value = process.env[reference.name];
      return value ? { value, expiresAt: null } : null;
    },
  };
}

function resolveTargetContext(args: {
  loaded: Awaited<ReturnType<typeof loadUnisaneOpsConfig>>;
  requestedTarget?: string;
  requestedEnvironment?: string;
}): {
  context: CloudDnsTargetContext;
  credentialEnvironmentVariable: string;
} {
  const targetId = selectId({
    requested: args.requestedTarget,
    values: Object.keys(args.loaded.config.targets),
    label: 'target',
  });
  const target = args.loaded.config.targets[targetId];
  const environment = selectId({
    requested: args.requestedEnvironment,
    values: Object.keys(target.environments),
    preferred: 'dev',
    label: 'environment',
  });
  const connection = args.loaded.config.connections[target.connection];
  if (!connection || connection.provider !== target.provider || !('credential' in connection)) {
    throw new Error(
      `[UNISANE_OPS_CONNECTION_INVALID] Target '${targetId}' has no matching Cloudflare connection.`,
    );
  }
  if (!connection.accountId) {
    throw new Error(
      `[UNISANE_OPS_ACCOUNT_REQUIRED] Target '${targetId}' requires an accountId on connection '${target.connection}'.`,
    );
  }
  const desired = target.environments[environment].dns;
  if (!desired) {
    throw new Error(
      `[UNISANE_OPS_DNS_REQUIRED] Target '${targetId}' environment '${environment}' does not configure DNS.`,
    );
  }
  const context = cloudDnsTargetContextSchema.parse({
    projectId: args.loaded.config.project.id,
    targetId,
    environment,
    connectionId: target.connection,
    provider: target.provider,
    accountId: connection.accountId,
    production: args.loaded.config.environments[environment].production,
    configPath: args.loaded.configPath,
    desired,
  });
  return {
    context,
    credentialEnvironmentVariable: connection.credential.name,
  };
}

function resolveScriptSource(args: {
  projectRoot: string;
  workerKey: string;
  script: {
    path: string;
    mainModule?: string;
    compatibilityDate?: string;
    compatibilityFlags?: string[];
  };
}): CloudflareResolvedScriptSource {
  const absolute = path.resolve(args.projectRoot, args.script.path);
  const relative = path.relative(args.projectRoot, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `[UNISANE_OPS_SCRIPT_PATH_OUTSIDE_PROJECT] Worker '${args.workerKey}' script must stay inside the project.`,
    );
  }
  let content: string;
  try {
    content = readFileSync(absolute, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `[UNISANE_OPS_SCRIPT_NOT_FOUND] Worker '${args.workerKey}' script was not found: ${relative}`,
      );
    }
    throw error;
  }
  return {
    relativePath: relative,
    mainModule: args.script.mainModule ?? path.basename(relative),
    contentHash: createHash('sha256').update(content).digest('hex'),
    ...(args.script.compatibilityDate ? { compatibilityDate: args.script.compatibilityDate } : {}),
    ...(args.script.compatibilityFlags
      ? { compatibilityFlags: args.script.compatibilityFlags }
      : {}),
  };
}

function resolveResourceTarget(args: {
  loaded: Awaited<ReturnType<typeof loadUnisaneOpsConfig>>;
  requestedTarget?: string;
  requestedEnvironment?: string;
}): {
  context: CloudflareResourceTarget;
  credentialEnvironmentVariable: string;
} {
  const targetId = selectId({
    requested: args.requestedTarget,
    values: Object.keys(args.loaded.config.targets),
    label: 'target',
  });
  const target = args.loaded.config.targets[targetId];
  const environment = selectId({
    requested: args.requestedEnvironment,
    values: Object.keys(target.environments),
    preferred: 'dev',
    label: 'environment',
  });
  const connection = args.loaded.config.connections[target.connection];
  if (!connection || connection.provider !== target.provider || !('credential' in connection)) {
    throw new Error(
      `[UNISANE_OPS_CONNECTION_INVALID] Target '${targetId}' has no matching Cloudflare connection.`,
    );
  }
  if (!connection.accountId) {
    throw new Error(
      `[UNISANE_OPS_ACCOUNT_REQUIRED] Target '${targetId}' requires an accountId on connection '${target.connection}'.`,
    );
  }
  const configured = target.environments[environment];
  const scriptSources: Record<string, CloudflareResolvedScriptSource> = {};
  for (const [workerKey, worker] of Object.entries(configured.workers)) {
    if (worker.script) {
      scriptSources[workerKey] = resolveScriptSource({
        projectRoot: args.loaded.projectRoot,
        workerKey,
        script: worker.script,
      });
    }
  }
  const context = cloudflareResourceTargetSchema.parse({
    projectId: args.loaded.config.project.id,
    targetId,
    environment,
    connectionId: target.connection,
    provider: target.provider,
    accountId: connection.accountId,
    production: args.loaded.config.environments[environment].production,
    configPath: args.loaded.configPath,
    desired: {
      zones: configured.dns?.zones ?? {},
      queues: configured.queues,
      workers: configured.workers,
    },
    scriptSources,
  });
  return {
    context,
    credentialEnvironmentVariable: connection.credential.name,
  };
}

export class CanonicalPackRuntime implements PackCommandRuntime {
  async resolveBinding(bindingId: string, input: unknown): Promise<unknown> {
    if (bindingId === OPS_LIFECYCLE_ADD_BINDING) {
      const request = parseLifecycleAddRequest(input);
      if (
        request.packId !== 'framework' ||
        !['capability', 'feature', 'integration', 'module', 'plugin'].includes(request.itemType)
      ) {
        throw new Error(
          `[OPS_LIFECYCLE_ADD_CONTRIBUTOR_UNSUPPORTED] Pack '${request.packId}' cannot add '${request.itemType}'.`,
        );
      }
      const framework = await import('@unisane/framework-ops/contributions/add');
      return framework.addFrameworkItem(request.context);
    }
    if (bindingId === OPS_LIFECYCLE_READINESS_BINDING) {
      const request = parseLifecycleReadinessRequest(input);
      if (request.provider !== 'google') {
        throw new Error(
          `[OPS_LIFECYCLE_READINESS_CONTRIBUTOR_UNSUPPORTED] Provider '${request.provider}' does not contribute readiness.`,
        );
      }
      const google = await import('@unisane/provider-google');
      const connection = google.readGoogleConnectionRecord(request);
      return connection ? google.buildGoogleConnectionReadiness(connection) : null;
    }
    if (bindingId === OPS_LIFECYCLE_CONNECT_BINDING) {
      const request = parseLifecycleConnectRequest(input);
      if (request.provider !== 'google' || request.packId !== 'provider-google') {
        throw new Error(
          `[OPS_LIFECYCLE_CONNECT_CONTRIBUTOR_UNSUPPORTED] Pack '${request.packId}' cannot connect '${request.provider}'.`,
        );
      }
      const google = await import('@unisane/provider-google');
      return google.connectGoogle({
        context: request.context,
        projectId: request.projectId,
        environmentId: request.environmentId,
        recordPath: request.recordPath,
        requiredServices: request.requiredServices,
      });
    }
    if (bindingId === OPS_LIFECYCLE_DISCONNECT_BINDING) {
      const request = parseLifecycleDisconnectRequest(input);
      if (request.provider !== 'google' || request.packId !== 'provider-google') {
        throw new Error(
          `[OPS_LIFECYCLE_DISCONNECT_CONTRIBUTOR_UNSUPPORTED] Pack '${request.packId}' cannot disconnect '${request.provider}'.`,
        );
      }
      const google = await import('@unisane/provider-google');
      return google.disconnectGoogle({
        context: request.context,
        projectId: request.projectId,
        environmentId: request.environmentId,
        connectionId: request.connectionId,
        recordPath: request.recordPath,
      });
    }
    if (isGrowthProviderBinding(bindingId)) {
      return resolveGrowthProviderBinding(this, input);
    }
    if (bindingId === CLOUDFLARE_CONNECTION_BINDING) {
      const request = parseCloudflareConnectionRequest(input);
      const loaded = await loadUnisaneOpsConfig(request.cwd ?? process.cwd());
      const connectionId = selectId({
        requested: request.connection,
        values: Object.keys(loaded.config.connections),
        label: 'connection',
      });
      const connection = loaded.config.connections[connectionId];
      if (connection.provider !== 'cloudflare' || !('credential' in connection)) {
        throw new Error(
          `[UNISANE_OPS_CONNECTION_INVALID] Connection '${connectionId}' is not a Cloudflare connection.`,
        );
      }
      const { createCloudflareConnectionProvider } = await import('@unisane/provider-cloudflare');
      const binding: CloudflareConnectionRuntimeBinding = {
        projectId: loaded.config.project.id,
        connectionId,
        configuredAccountId: connection.accountId ?? null,
        provider: createCloudflareConnectionProvider({
          apiToken: process.env[connection.credential.name],
        }),
        artifacts: createCloudflareConnectionArtifactAccess({
          projectRoot: loaded.projectRoot,
          connectionId,
        }),
      };
      return binding;
    }

    if (
      bindingId === CLOUD_RESOURCE_CONTEXT_BINDING ||
      bindingId === CLOUDFLARE_RESOURCE_PROVIDER_BINDING
    ) {
      const request = parseCloudflareResourceRequest(input);
      const loaded = await loadUnisaneOpsConfig(request.cwd ?? process.cwd());
      const resolved = resolveResourceTarget({
        loaded,
        requestedTarget: request.target,
        requestedEnvironment: request.environment,
      });
      const binding: CloudflareResourceRuntimeBinding = {
        target: resolved.context,
        artifacts: createResourceArtifactAccess({
          projectRoot: loaded.projectRoot,
          targetId: resolved.context.targetId,
          environment: resolved.context.environment,
        }),
      };
      if (bindingId === CLOUD_RESOURCE_CONTEXT_BINDING) {
        if (!['plan', 'env', 'check'].includes(request.command)) {
          throw new Error(
            '[CLOUDFLARE_RESOURCE_CONTEXT_BINDING_INVALID] Context-only binding supports plan, env, and check.',
          );
        }
        return binding;
      }
      if (request.command !== 'inventory' && request.command !== 'apply') {
        throw new Error(
          '[CLOUDFLARE_RESOURCE_PROVIDER_BINDING_INVALID] Provider binding supports inventory and apply.',
        );
      }
      const { createCloudflareResourceProvider } = await import('@unisane/provider-cloudflare');
      binding.provider = createCloudflareResourceProvider({
        apiToken: process.env[resolved.credentialEnvironmentVariable],
      });
      if (request.command === 'apply') {
        binding.state = createLocalOpsExecutionState(
          path.join(
            loaded.projectRoot,
            '.unisane',
            'ops',
            resolved.context.targetId,
            resolved.context.environment,
            'state',
          ),
        );
        binding.secrets = createEnvironmentSecretResolver();
        binding.sources = createResourceSourceAccess(loaded.projectRoot);
        binding.actor = 'developer';
        binding.multiProcess = false;
      }
      return binding;
    }

    const request = parseCloudDnsRequest(input);
    const loaded = await loadUnisaneOpsConfig(request.cwd ?? process.cwd());
    const resolved = resolveTargetContext({
      loaded,
      requestedTarget: request.target,
      requestedEnvironment: request.environment,
    });
    const artifacts = createArtifactAccess({
      projectRoot: loaded.projectRoot,
      targetId: resolved.context.targetId,
      environment: resolved.context.environment,
    });
    const binding: CloudDnsRuntimeBinding = {
      target: resolved.context,
      artifacts,
      actor: 'developer',
      multiProcess: false,
    };
    if (bindingId === CLOUD_DNS_CONTEXT_BINDING) {
      if (request.command !== 'import' && request.command !== 'plan') {
        throw new Error(
          '[CLOUD_DNS_CONTEXT_BINDING_INVALID] Context-only binding supports import and plan.',
        );
      }
      return binding;
    }
    if (bindingId !== CLOUDFLARE_DNS_PROVIDER_BINDING || request.command === 'plan') {
      throw new Error(`[OPS_PACK_BINDING_UNKNOWN] Unsupported binding '${bindingId}'.`);
    }
    const token = process.env[resolved.credentialEnvironmentVariable];
    const { createCloudflareDnsProvider } = await import('@unisane/provider-cloudflare');
    binding.provider = createCloudflareDnsProvider({ apiToken: token });
    if (request.command === 'apply') {
      binding.state = createLocalOpsExecutionState(
        path.join(
          loaded.projectRoot,
          '.unisane',
          'ops',
          resolved.context.targetId,
          resolved.context.environment,
          'state',
        ),
      );
    }
    return binding;
  }
}

export function createCanonicalPackRuntime(): PackCommandRuntime {
  return new CanonicalPackRuntime();
}
