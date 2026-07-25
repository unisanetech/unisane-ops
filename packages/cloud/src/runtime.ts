import type { OpsExecutionState, SecretResolver } from '@unisane/ops-engine';
import type {
  CloudflareMutationProvider,
  CloudflareReadProvider,
  CloudflareResourceFocus,
  CloudflareResourceTarget,
} from './cloudflare-resources.js';
import type { CloudDnsProvider, CloudDnsTargetContext } from './contracts.js';

export const CLOUD_DNS_CONTEXT_BINDING = 'cloud.dns.context';
export const CLOUDFLARE_DNS_PROVIDER_BINDING = 'cloud.dns.cloudflare';
export const CLOUD_RESOURCE_CONTEXT_BINDING = 'cloud.resource.context';
export const CLOUDFLARE_RESOURCE_PROVIDER_BINDING = 'cloud.resource.cloudflare';

export interface CloudDnsArtifactRef {
  path: string;
  relativePath: string;
}

export interface CloudDnsArtifactAccess {
  readJson(relativePath: string, label: 'inventory' | 'plan'): unknown;
  writeJson(args: {
    class: 'inventory' | 'import' | 'plan' | 'receipt';
    outputPath?: string;
    value: unknown;
  }): CloudDnsArtifactRef;
}

export interface CloudDnsRuntimeBinding {
  target: CloudDnsTargetContext;
  artifacts: CloudDnsArtifactAccess;
  provider?: CloudDnsProvider;
  state?: OpsExecutionState;
  actor?: 'developer' | 'automation';
  actorId?: string;
  multiProcess?: boolean;
  lockOwner?: string;
  now?: Date;
}

export interface CloudDnsBindingRequest {
  command: 'inventory' | 'import' | 'plan' | 'apply';
  cwd?: string;
  target?: string;
  environment?: string;
}

export interface CloudflareResourceArtifactAccess {
  readJson(relativePath: string, label: 'inventory' | 'plan'): unknown;
  writeJson(args: {
    class: 'inventory' | 'plan' | 'report' | 'receipt';
    focus: CloudflareResourceFocus | 'environment' | 'readiness';
    outputPath?: string;
    value: unknown;
  }): CloudDnsArtifactRef;
}

export interface CloudflareResourceSourceAccess {
  readText(relativePath: string): string;
}

export interface CloudflareResourceRuntimeBinding {
  target: CloudflareResourceTarget;
  artifacts: CloudflareResourceArtifactAccess;
  provider?: CloudflareReadProvider | CloudflareMutationProvider;
  state?: OpsExecutionState;
  secrets?: SecretResolver;
  sources?: CloudflareResourceSourceAccess;
  actor?: 'developer' | 'automation';
  actorId?: string;
  multiProcess?: boolean;
  lockOwner?: string;
  now?: Date;
}

export interface CloudflareResourceBindingRequest {
  command: 'inventory' | 'plan' | 'apply' | 'env' | 'check';
  focus: CloudflareResourceFocus;
  cwd?: string;
  target?: string;
  environment?: string;
}

export function requireCloudDnsRuntimeBinding(input: unknown): CloudDnsRuntimeBinding {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('target' in input) ||
    !('artifacts' in input)
  ) {
    throw new Error('[CLOUD_DNS_RUNTIME_BINDING_INVALID] Invalid Cloud DNS runtime binding.');
  }
  return input as CloudDnsRuntimeBinding;
}

export function requireCloudDnsProvider(binding: CloudDnsRuntimeBinding): CloudDnsProvider {
  if (!binding.provider) {
    throw new Error('[CLOUD_DNS_PROVIDER_REQUIRED] Cloud DNS provider binding is required.');
  }
  return binding.provider;
}

export function requireCloudDnsExecutionState(binding: CloudDnsRuntimeBinding): OpsExecutionState {
  if (!binding.state) {
    throw new Error('[CLOUD_DNS_EXECUTION_STATE_REQUIRED] Cloud DNS execution state is required.');
  }
  return binding.state;
}

export function requireCloudflareResourceRuntimeBinding(
  input: unknown,
): CloudflareResourceRuntimeBinding {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('target' in input) ||
    !('artifacts' in input)
  ) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_RUNTIME_BINDING_INVALID] Invalid Cloudflare resource runtime binding.',
    );
  }
  return input as CloudflareResourceRuntimeBinding;
}

export function requireCloudflareResourceProvider(
  binding: CloudflareResourceRuntimeBinding,
): CloudflareReadProvider {
  if (!binding.provider) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_PROVIDER_REQUIRED] Cloudflare resource provider binding is required.',
    );
  }
  return binding.provider;
}

export function requireCloudflareMutationProvider(
  binding: CloudflareResourceRuntimeBinding,
): CloudflareMutationProvider {
  if (
    !binding.provider ||
    !('createQueue' in binding.provider) ||
    !('putWorkerScript' in binding.provider)
  ) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_MUTATION_PROVIDER_REQUIRED] Cloudflare mutation provider binding is required.',
    );
  }
  return binding.provider;
}

export function requireCloudflareResourceExecutionState(
  binding: CloudflareResourceRuntimeBinding,
): OpsExecutionState {
  if (!binding.state) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_EXECUTION_STATE_REQUIRED] Cloudflare execution state is required.',
    );
  }
  return binding.state;
}

export function requireCloudflareResourceSecrets(
  binding: CloudflareResourceRuntimeBinding,
): SecretResolver {
  if (!binding.secrets) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_SECRET_RESOLVER_REQUIRED] Cloudflare secret resolver is required.',
    );
  }
  return binding.secrets;
}

export function requireCloudflareResourceSources(
  binding: CloudflareResourceRuntimeBinding,
): CloudflareResourceSourceAccess {
  if (!binding.sources) {
    throw new Error(
      '[CLOUDFLARE_RESOURCE_SOURCE_ACCESS_REQUIRED] Cloudflare source access is required.',
    );
  }
  return binding.sources;
}
