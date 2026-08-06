import { z } from 'zod';
import { defineOpsReadAction } from '@unisane/ops-engine/actions';

export function createHostedWorkerActions() {
  return [
    defineOpsReadAction({
      id: 'growth.health.review',
      schemaVersion: 1,
      maximumEffect: 'offline',
      inputSchema: z.object({ project: z.string() }).strict(),
      outputSchema: z.object({ status: z.literal('healthy'), project: z.string() }).strict(),
      execute: async (input) => ({ status: 'healthy', project: input.project }),
    }),
  ];
}
