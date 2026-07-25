import { AsyncLocalStorage } from 'node:async_hooks';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';

export const GROWTH_PROVIDER_COMMAND_BINDING = 'growth.provider.command';

export type GrowthProviderCommandOperation =
  | 'google.auth.delete'
  | 'google.auth.login'
  | 'google.auth.refresh'
  | 'google.auth.resolve-token'
  | 'google.auth.save'
  | 'google.auth.status'
  | 'google.auth.status-command'
  | 'google.auth.token-command'
  | 'google.auth.logout-command'
  | 'google.marketing.discover'
  | 'google.marketing.execute-live'
  | 'google.marketing.pull-ga4'
  | 'google.marketing.pull-report'
  | 'google.marketing.pull-search-console'
  | 'google.marketing.setup-status'
  | 'google.seo.fetch-ga4'
  | 'google.seo.fetch-keyword-metrics'
  | 'google.seo.fetch-search-console'
  | 'gtm.auth.delete'
  | 'gtm.auth.login-command'
  | 'gtm.auth.logout-command'
  | 'gtm.auth.refresh'
  | 'gtm.auth.resolve-token'
  | 'gtm.auth.save'
  | 'gtm.auth.status'
  | 'gtm.auth.status-command'
  | 'gtm.auth.token-command'
  | 'gtm.provider.apply'
  | 'gtm.provider.create-version'
  | 'gtm.provider.normalize-snapshot'
  | 'gtm.provider.preview'
  | 'gtm.provider.publish'
  | 'gtm.provider.read-snapshot'
  | 'gtm.provider.rollback'
  | 'meta.auth.delete'
  | 'meta.auth.resolve-token'
  | 'meta.auth.save'
  | 'meta.auth.status'
  | 'meta.marketing.discover'
  | 'meta.marketing.execute-live'
  | 'meta.marketing.pull-report'
  | 'meta.marketing.setup-status'
  | 'meta.marketing.upload-asset';

export interface GrowthProviderCommandRequest {
  operation: GrowthProviderCommandOperation;
  input: unknown;
}

const commandRuntime = new AsyncLocalStorage<PackCommandRuntime>();

export function runWithGrowthProviderRuntime<T>(runtime: PackCommandRuntime, run: () => T): T {
  return commandRuntime.run(runtime, run);
}

export async function executeGrowthProviderCommand<TResult>(
  operation: GrowthProviderCommandOperation,
  input: unknown,
): Promise<TResult> {
  const runtime = commandRuntime.getStore();
  if (!runtime) {
    throw new Error(
      '[GROWTH_PROVIDER_RUNTIME_MISSING] Provider-backed Growth commands require the canonical host runtime.',
    );
  }
  return runtime.resolveBinding(GROWTH_PROVIDER_COMMAND_BINDING, {
    operation,
    input,
  } satisfies GrowthProviderCommandRequest) as Promise<TResult>;
}
