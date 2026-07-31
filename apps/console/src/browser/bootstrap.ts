import type { MarketingConsoleState } from '@unisane/growth/console';
import type { ConsoleShellModel } from './contracts.js';

export function readConsoleBootData(): {
  state: MarketingConsoleState;
  shell: ConsoleShellModel;
} {
  return {
    state: readJson<MarketingConsoleState>('unisane-ops-state'),
    shell: readJson<ConsoleShellModel>('unisane-ops-shell'),
  };
}

function readJson<T>(id: string): T {
  const node = document.getElementById(id);
  if (!node?.textContent) {
    throw new Error(`[UNISANE_OPS_BOOT_DATA_MISSING] ${id}`);
  }
  return JSON.parse(node.textContent) as T;
}
