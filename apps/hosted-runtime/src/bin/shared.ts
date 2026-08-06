import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { OpsReadActionDefinition } from '@unisane/ops-engine/actions';
import type { HostedRoleObserver } from '../observability.js';

export function createJsonLineObserver(): HostedRoleObserver {
  return {
    emit(event) {
      process.stdout.write(`${JSON.stringify(event)}\n`);
    },
  };
}

export function processAbortSignal(): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();
  process.once('SIGINT', abort);
  process.once('SIGTERM', abort);
  return controller.signal;
}

function isOpsReadActionDefinition(value: unknown): value is OpsReadActionDefinition {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof value.id === 'string' &&
    'schemaVersion' in value &&
    typeof value.schemaVersion === 'number' &&
    'inputSchema' in value &&
    typeof value.inputSchema === 'object' &&
    'outputSchema' in value &&
    typeof value.outputSchema === 'object' &&
    'execute' in value &&
    typeof value.execute === 'function',
  );
}

export async function loadHostedActions(
  modulePath: string,
): Promise<readonly OpsReadActionDefinition[]> {
  const loaded = (await import(pathToFileURL(resolve(modulePath)).href)) as {
    createHostedWorkerActions?: () =>
      | readonly OpsReadActionDefinition[]
      | Promise<readonly OpsReadActionDefinition[]>;
  };
  if (typeof loaded.createHostedWorkerActions !== 'function') {
    throw new Error('Hosted action module must export createHostedWorkerActions().');
  }
  const actions = await loaded.createHostedWorkerActions();
  if (!Array.isArray(actions)) throw new Error('Hosted action module returned invalid actions.');
  const normalized: OpsReadActionDefinition[] = [];
  for (const action of actions as unknown[]) {
    if (!isOpsReadActionDefinition(action)) {
      throw new Error('Hosted action module returned invalid actions.');
    }
    normalized.push(action);
  }
  return normalized;
}

async function withinShutdownDeadline<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error('Hosted role exceeded its shutdown deadline.')),
          milliseconds,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function awaitRoleShutdown<T>(
  operation: Promise<T>,
  signal: AbortSignal,
  milliseconds: number,
): Promise<T> {
  const aborted = signal.aborted
    ? Promise.resolve()
    : new Promise<void>((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true }),
      );
  return Promise.race([
    operation,
    aborted.then(async () => withinShutdownDeadline(operation, milliseconds)),
  ]);
}
