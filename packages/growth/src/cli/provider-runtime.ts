import { AsyncLocalStorage } from 'node:async_hooks';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';

export const GROWTH_PROVIDER_COMMAND_BINDING = 'growth.provider.command';

export type GrowthProviderCommandOperation =
  | 'growth.connections.context'
  | 'growth.project.context'
  | 'google.connection.resolve-credentials'
  | 'google.marketing.execute-live'
  | 'google.marketing.pause-campaign'
  | 'google.marketing.read-campaign-status'
  | 'google.marketing.pull-ga4'
  | 'google.marketing.pull-report'
  | 'google.marketing.pull-search-console'
  | 'google.seo.fetch-ga4'
  | 'google.seo.fetch-keyword-metrics'
  | 'google.seo.fetch-search-console'
  | 'gtm.provider.apply'
  | 'gtm.provider.create-version'
  | 'gtm.provider.normalize-snapshot'
  | 'gtm.provider.preview'
  | 'gtm.provider.publish'
  | 'gtm.provider.read-snapshot'
  | 'gtm.provider.rollback'
  | 'meta.connection.resolve-token'
  | 'meta.marketing.execute-live'
  | 'meta.marketing.pause-campaign'
  | 'meta.marketing.read-campaign-status'
  | 'meta.marketing.pull-report'
  | 'meta.marketing.upload-asset';

export interface GrowthProviderCommandRequest {
  operation: GrowthProviderCommandOperation;
  cwd: string;
  input: unknown;
}

interface GrowthCommandRuntimeContext {
  runtime: PackCommandRuntime;
  cwd: string;
}

const commandRuntime = new AsyncLocalStorage<GrowthCommandRuntimeContext>();

export function runWithGrowthProviderRuntime<T>(
  runtime: PackCommandRuntime,
  cwd: string,
  run: () => T,
): T {
  return commandRuntime.run({ runtime, cwd }, run);
}

export async function executeGrowthProviderCommand<TResult>(
  operation: GrowthProviderCommandOperation,
  input: unknown,
): Promise<TResult> {
  const context = commandRuntime.getStore();
  if (!context) {
    throw new Error(
      '[GROWTH_PROVIDER_RUNTIME_MISSING] Provider-backed Growth commands require the canonical host runtime.',
    );
  }
  return context.runtime.resolveBinding(GROWTH_PROVIDER_COMMAND_BINDING, {
    operation,
    cwd: context.cwd,
    input,
  } satisfies GrowthProviderCommandRequest) as Promise<TResult>;
}
