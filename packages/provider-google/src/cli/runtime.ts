import { AsyncLocalStorage } from 'node:async_hooks';
import type { PackCommandRuntime } from '@unisane/ops-engine/pack';
import type { GoogleConnectionService } from '../google/connection.js';

interface GoogleProviderCommandContext {
  cwd: string;
  runtime: PackCommandRuntime;
}

const commandContext = new AsyncLocalStorage<GoogleProviderCommandContext>();

export function runWithGoogleProviderCommandContext<T>(
  context: GoogleProviderCommandContext,
  run: () => T,
): T {
  return commandContext.run(context, run);
}

export async function resolveGoogleProviderConnectionToken(input: {
  service: GoogleConnectionService;
  connection?: string;
  environment?: string;
  requiredScope?: string;
}): Promise<string> {
  const context = commandContext.getStore();
  if (!context) {
    throw new Error(
      '[GOOGLE_PROVIDER_RUNTIME_MISSING] Provider commands require the canonical host runtime.',
    );
  }
  const credentials = (await context.runtime.resolveBinding('growth.provider.command', {
    operation: 'google.connection.resolve-credentials',
    cwd: context.cwd,
    input,
  })) as { accessToken: string };
  return credentials.accessToken;
}
