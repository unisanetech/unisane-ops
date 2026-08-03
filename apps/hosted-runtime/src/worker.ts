import {
  createHostedReadWorker,
  type HostedReadJob,
  type HostedReadJobStore,
  type HostedReadResultStore,
} from '@unisane/ops-engine/hosted';
import type { OpsReadActionDefinition } from '@unisane/ops-engine/actions';

export interface HostedWorkerRole {
  execute(jobId: string): Promise<HostedReadJob>;
  recover(jobId: string): Promise<HostedReadJob>;
}

export function createHostedWorkerRole(input: {
  owner: string;
  leaseMs: number;
  maximumResultBytes: number;
  store: HostedReadJobStore;
  results: HostedReadResultStore;
  actions: readonly OpsReadActionDefinition[];
  now?: () => Date;
}): HostedWorkerRole {
  return createHostedReadWorker(input);
}
