import type { HostedGatewayRole } from './gateway.js';
import { silentHostedRoleObserver, type HostedRoleObserver } from './observability.js';

export interface HostedGatewayTransport {
  serve(input: { gateway: HostedGatewayRole; signal: AbortSignal }): Promise<void>;
}

export function createHostedGatewayProcess(input: {
  gateway: HostedGatewayRole;
  transport: HostedGatewayTransport;
  probe(): Promise<void>;
  observer?: HostedRoleObserver;
  now?: () => Date;
}) {
  const observer = input.observer ?? silentHostedRoleObserver;
  const now = input.now ?? (() => new Date());
  let ready = false;

  return {
    health() {
      return { role: 'gateway' as const, ready };
    },
    async run(signal: AbortSignal): Promise<void> {
      try {
        await input.probe();
        ready = true;
        await observer.emit({
          kind: 'role.ready',
          role: 'gateway',
          occurredAt: now().toISOString(),
        });
        await input.transport.serve({ gateway: input.gateway, signal });
      } catch (error) {
        ready = false;
        await observer.emit({
          kind: 'role.failure',
          role: 'gateway',
          occurredAt: now().toISOString(),
          code: error instanceof Error ? error.name : 'unknown-error',
        });
        throw error;
      } finally {
        ready = false;
        await observer.emit({
          kind: 'role.stopped',
          role: 'gateway',
          occurredAt: now().toISOString(),
        });
      }
    },
  };
}
