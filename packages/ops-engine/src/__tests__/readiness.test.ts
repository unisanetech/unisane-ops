import { describe, expect, it } from 'vitest';
import {
  aggregateOpsReadiness,
  defineOpsReadinessFinding,
  opsNextActionSchema,
  type OpsReadinessFinding,
} from '../readiness.js';

const readyFinding: OpsReadinessFinding = {
  schemaVersion: 1,
  code: 'growth.project.ready',
  dimension: 'project',
  state: 'ready',
  severity: 'info',
  projectId: 'product-site',
  environmentId: 'production',
  summary: 'Growth is selected through canonical project intent.',
  blocking: false,
  observedAt: '2026-07-30T00:00:00.000Z',
  evidence: [
    {
      kind: 'project-config',
      source: 'unisane.config.ts',
      observedAt: '2026-07-30T00:00:00.000Z',
      freshness: 'fresh',
      summary: 'Canonical project intent parsed successfully.',
    },
  ],
};

describe('Ops readiness contracts', () => {
  it('preserves one stable finding shape across human, JSON, CI, and agent consumers', () => {
    expect(defineOpsReadinessFinding(readyFinding)).toEqual(readyFinding);
  });

  it('requires one exact recovery action for every blocking finding', () => {
    expect(() =>
      defineOpsReadinessFinding({
        ...readyFinding,
        code: 'google.connection.expired',
        dimension: 'connection',
        state: 'expired-access',
        severity: 'error',
        blocking: true,
      }),
    ).toThrow('blocking Ops readiness finding');

    expect(
      defineOpsReadinessFinding({
        ...readyFinding,
        code: 'google.connection.expired',
        dimension: 'connection',
        state: 'expired-access',
        severity: 'error',
        blocking: true,
        nextAction: {
          id: 'google.connection.reconnect',
          label: 'Reconnect Google',
          description: 'Restore the selected Google connection and required grants.',
          command: {
            path: ['connect', 'google'],
            args: ['--environment', 'production'],
            json: false,
            maximumEffect: 'write',
          },
          requiresConfirmation: true,
          requiresApproval: false,
        },
      }).nextAction?.id,
    ).toBe('google.connection.reconnect');
  });

  it('rejects vague next actions without an exact command or file', () => {
    expect(() =>
      opsNextActionSchema.parse({
        id: 'growth.fix',
        label: 'Fix setup',
        description: 'Fix the setup issue.',
        requiresConfirmation: false,
        requiresApproval: false,
      }),
    ).toThrow('exact command or file');
  });

  it('derives aggregate readiness without collapsing underlying findings', () => {
    expect(aggregateOpsReadiness([readyFinding])).toEqual({
      status: 'ready',
      blockingCount: 0,
      attentionCount: 0,
    });
    expect(
      aggregateOpsReadiness([
        readyFinding,
        {
          ...readyFinding,
          code: 'growth.data.warming',
          dimension: 'data',
          state: 'warming',
          severity: 'info',
        },
      ]),
    ).toEqual({
      status: 'attention',
      blockingCount: 0,
      attentionCount: 1,
    });
  });
});
