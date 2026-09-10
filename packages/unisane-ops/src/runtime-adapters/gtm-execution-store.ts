import { openScopedExecutionStore } from './execution-store.js';
export function openGtmExecutionStore(projectRoot: string, backend: 'local' | 'sqlite') {
  return openScopedExecutionStore(projectRoot, backend, {
    segments: ['.unisane', 'ops', 'gtm'],
    prefix: 'GTM',
  });
}
