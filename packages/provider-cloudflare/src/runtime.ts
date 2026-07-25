import type { CloudflareConnectionProvider, CloudflareConnectionVerification } from './index.js';

export const CLOUDFLARE_CONNECTION_BINDING = 'provider.cloudflare.connection';

export interface CloudflareConnectionArtifactRef {
  path: string;
  relativePath: string;
}

export interface CloudflareConnectionArtifactAccess {
  writeJson(args: { outputPath?: string; value: unknown }): CloudflareConnectionArtifactRef;
}

export interface CloudflareConnectionRuntimeBinding {
  projectId: string;
  connectionId: string;
  configuredAccountId: string | null;
  provider: CloudflareConnectionProvider;
  artifacts: CloudflareConnectionArtifactAccess;
  now?: Date;
}

export interface CloudflareConnectionBindingRequest {
  command: 'connection.check';
  cwd?: string;
  connection?: string;
}

export interface CloudflareConnectionReport {
  schemaVersion: 1;
  kind: 'provider.cloudflare.connection-report';
  provider: 'cloudflare';
  projectId: string;
  connectionId: string;
  generatedAt: string;
  configuredAccountId: string | null;
  verification: CloudflareConnectionVerification;
  accounts: Array<{ id: string; name: string | null }>;
  zones: Array<{
    id: string;
    name: string;
    status: string | null;
    accountId: string | null;
    accountName: string | null;
  }>;
  configuredAccountObserved: boolean;
}

export function requireCloudflareConnectionBinding(
  input: unknown,
): CloudflareConnectionRuntimeBinding {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('projectId' in input) ||
    !('connectionId' in input) ||
    !('provider' in input) ||
    !('artifacts' in input)
  ) {
    throw new Error(
      '[CLOUDFLARE_CONNECTION_BINDING_INVALID] Invalid Cloudflare connection binding.',
    );
  }
  return input as CloudflareConnectionRuntimeBinding;
}
