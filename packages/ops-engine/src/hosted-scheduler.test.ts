import { describe, expect, it } from 'vitest';
import {
  createHostedReadSchedule,
  createHostedReadScheduleMaterialization,
} from './hosted-scheduler.js';

function schedule() {
  return {
    schemaVersion: 1 as const,
    kind: 'ops.hosted-read-schedule' as const,
    scheduleId: 'schedule.health.hourly',
    revision: 1,
    enabled: true,
    evidenceRevision: 'evidence.42',
    action: {
      schemaVersion: 1 as const,
      actionId: 'growth.health.review',
      actionSchemaVersion: 1,
      context: {
        scopeId: 'workspace.acme',
        projectId: 'project.acme',
        environmentId: 'production',
        principal: { kind: 'service' as const, id: 'scheduler.acme' },
      },
      input: { project: 'acme' },
    },
    cadence: { kind: 'interval' as const, milliseconds: 3_600_000 },
    nextDueAt: '2026-08-04T00:00:00.000Z',
    lease: null,
    createdAt: '2026-08-03T00:00:00.000Z',
    updatedAt: '2026-08-03T00:00:00.000Z',
  };
}

describe('hosted read schedule contract', () => {
  it('materializes one exact occurrence and advances by the frozen cadence', () => {
    const materialized = createHostedReadScheduleMaterialization(
      createHostedReadSchedule(schedule()),
      '2026-08-04T00:00:00.000Z',
    );
    expect(materialized.occurrenceId).toBe('schedule.health.hourly.1785801600000');
    expect(materialized.nextDueAt).toBe('2026-08-04T01:00:00.000Z');
    expect(materialized.request.action.context).toMatchObject({
      requestId: materialized.occurrenceId,
      requestedAt: materialized.dueAt,
      principal: { kind: 'service', id: 'scheduler.acme' },
    });
    expect(materialized.request.evidenceRevision).toBe('evidence.42');
  });

  it('rejects credential material and sub-minute cadences', () => {
    expect(() =>
      createHostedReadSchedule({
        ...schedule(),
        action: { ...schedule().action, input: { accessToken: 'forbidden' } },
      }),
    ).toThrow(/Credential material/);
    expect(() =>
      createHostedReadSchedule({
        ...schedule(),
        cadence: { kind: 'interval', milliseconds: 1_000 },
      }),
    ).toThrow();
  });
});
