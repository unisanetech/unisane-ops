import { describe, expect, it } from 'vitest';
import { resumeOpsWorkflowHandoff } from '@unisane/ops-engine/workflows';
import { createGrowthHealthReviewAction } from '../actions/health-review.js';
import { defineOpsReadinessFinding } from '@unisane/ops-engine/readiness';
import {
  createGrowthHealthReviewWorkflowProjection,
  growthHealthReviewGoal,
  growthHealthReviewPlaybook,
  projectGrowthHealthReviewPresentation,
} from './health-review.js';
import { validateGrowthPlaybookActionReferences } from './contracts.js';

const context = {
  requestId: 'request.health-review',
  scopeId: 'scope.true-resume',
  projectId: 'true-resume',
  environmentId: 'production',
  principal: { kind: 'agent' as const, id: 'agent.codex' },
  requestedAt: '2026-08-02T00:00:00.000Z',
};

describe('Growth health-review playbook', () => {
  it('owns a versioned goal and references the registered action without executing an adapter', () => {
    const action = createGrowthHealthReviewAction({
      loadConfig: () => ({ schemaVersion: 1 }) as never,
    });

    expect(growthHealthReviewPlaybook.goal).toEqual({
      id: growthHealthReviewGoal.id,
      version: growthHealthReviewGoal.version,
    });
    expect(() =>
      validateGrowthPlaybookActionReferences({
        playbook: growthHealthReviewPlaybook,
        actions: [action],
      }),
    ).not.toThrow();
    expect(() =>
      validateGrowthPlaybookActionReferences({
        playbook: growthHealthReviewPlaybook,
        actions: [],
      }),
    ).toThrow('[GROWTH_PLAYBOOK_ACTION_UNAVAILABLE]');
  });

  it('projects the same plain-language state into headless context and a resumable handoff', () => {
    const snapshot = {
      schemaVersion: 1 as const,
      projectId: 'true-resume',
      environmentId: 'production',
      observedAt: '2026-08-02T01:00:00.000Z',
      status: 'ready' as const,
      blockingCount: 0,
      attentionCount: 0,
      totalFindingCount: 0,
      returnedFindingCount: 0,
      truncated: false,
      findings: [],
    };
    const projection = createGrowthHealthReviewWorkflowProjection({
      runId: 'workflow.health-review',
      briefId: 'brief.health-review',
      handoffId: 'handoff.health-review',
      context,
      snapshot,
    });

    expect(projection.presentation).toEqual(projectGrowthHealthReviewPresentation(snapshot));
    expect(projection.contextBrief.presentation).toEqual(projection.presentation);
    expect(projection.handoff.nextStep).toEqual(projection.presentation.nextStep);
    expect(
      resumeOpsWorkflowHandoff({ handoff: projection.handoff, run: projection.run }),
    ).toMatchObject({
      status: 'resumable',
      nextStep: projection.presentation.nextStep,
    });
  });

  it('gives blocked and stale evidence an understandable recovery step', () => {
    const blockedFinding = defineOpsReadinessFinding({
      schemaVersion: 1,
      code: 'growth.connection.missing',
      dimension: 'connection',
      state: 'not-connected',
      severity: 'error',
      projectId: 'true-resume',
      environmentId: 'production',
      summary: 'Analytics is not connected.',
      blocking: true,
      observedAt: '2026-08-02T01:00:00.000Z',
      evidence: [],
      nextAction: {
        id: 'growth.connect.analytics',
        label: 'Connect Analytics',
        description: 'Connect the Analytics property used by this project.',
        command: {
          path: ['connect', 'google'],
          args: [],
          json: false,
          maximumEffect: 'read-network',
        },
        requiresConfirmation: false,
        requiresApproval: false,
      },
    });
    const staleFinding = defineOpsReadinessFinding({
      schemaVersion: 1,
      code: 'growth.analytics.stale',
      dimension: 'data',
      state: 'stale',
      severity: 'warning',
      projectId: 'true-resume',
      environmentId: 'production',
      summary: 'Analytics data is 12 days old.',
      blocking: false,
      observedAt: '2026-08-02T01:00:00.000Z',
      evidence: [
        {
          kind: 'analytics-report',
          source: 'Google Analytics',
          observedAt: '2026-07-21T01:00:00.000Z',
          freshness: 'stale',
          summary: 'The latest Analytics report is 12 days old.',
        },
      ],
    });

    const blocked = projectGrowthHealthReviewPresentation({
      schemaVersion: 1,
      projectId: 'true-resume',
      environmentId: 'production',
      observedAt: '2026-08-02T01:00:00.000Z',
      status: 'blocked',
      blockingCount: 1,
      attentionCount: 0,
      totalFindingCount: 1,
      returnedFindingCount: 1,
      truncated: false,
      findings: [blockedFinding],
    });
    const stale = projectGrowthHealthReviewPresentation({
      schemaVersion: 1,
      projectId: 'true-resume',
      environmentId: 'production',
      observedAt: '2026-08-02T01:00:00.000Z',
      status: 'attention',
      blockingCount: 0,
      attentionCount: 1,
      totalFindingCount: 1,
      returnedFindingCount: 1,
      truncated: false,
      findings: [staleFinding],
    });

    expect(blocked).toMatchObject({
      headline: 'Growth guidance is blocked for now.',
      nextStep: { label: 'Connect Analytics', deepLink: '/connections' },
    });
    expect(stale).toMatchObject({
      headline: 'Some Growth evidence needs attention.',
      nextStep: { deepLink: '/analytics' },
    });
  });

  it('changes the evidence revision when the recorded finding changes', () => {
    const finding = (summary: string) =>
      defineOpsReadinessFinding({
        schemaVersion: 1,
        code: 'growth.analytics.stale',
        dimension: 'data',
        state: 'stale',
        severity: 'warning',
        projectId: 'true-resume',
        environmentId: 'production',
        summary,
        blocking: false,
        observedAt: '2026-08-02T01:00:00.000Z',
        evidence: [
          {
            kind: 'analytics-report',
            source: 'Google Analytics',
            observedAt: '2026-07-21T01:00:00.000Z',
            freshness: 'stale',
            summary,
          },
        ],
      });
    const projection = (summary: string) =>
      createGrowthHealthReviewWorkflowProjection({
        runId: 'workflow.health-review',
        briefId: 'brief.health-review',
        handoffId: 'handoff.health-review',
        context,
        snapshot: {
          schemaVersion: 1,
          projectId: 'true-resume',
          environmentId: 'production',
          observedAt: '2026-08-02T01:00:00.000Z',
          status: 'attention',
          blockingCount: 0,
          attentionCount: 1,
          totalFindingCount: 1,
          returnedFindingCount: 1,
          truncated: false,
          findings: [finding(summary)],
        },
      });
    const previous = projection('Analytics data is 12 days old.');
    const current = projection('Analytics data is 13 days old.');

    expect(current.run.evidence[0]?.revision).not.toBe(previous.run.evidence[0]?.revision);
    expect(resumeOpsWorkflowHandoff({ handoff: previous.handoff, run: current.run })).toMatchObject(
      {
        status: 'evidence-changed',
        changedEvidenceIds: ['growth.analytics.stale.1'],
      },
    );
  });

  it('keeps the evidence revision stable when only the review timestamp changes', () => {
    const finding = (observedAt: string) =>
      defineOpsReadinessFinding({
        schemaVersion: 1,
        code: 'growth.connection.missing',
        dimension: 'connection',
        state: 'not-connected',
        severity: 'error',
        projectId: 'true-resume',
        environmentId: 'production',
        summary: 'Analytics is not connected.',
        blocking: true,
        observedAt,
        evidence: [
          {
            kind: 'project-config',
            source: 'unisane.config.ts',
            observedAt,
            freshness: 'fresh',
            summary: 'No Analytics connection is selected.',
          },
        ],
        nextAction: {
          id: 'growth.connect.analytics',
          label: 'Connect Analytics',
          description: 'Connect the Analytics property used by this project.',
          command: {
            path: ['connect', 'google'],
            args: [],
            json: false,
            maximumEffect: 'read-network',
          },
          requiresConfirmation: false,
          requiresApproval: false,
        },
      });
    const projection = (observedAt: string) =>
      createGrowthHealthReviewWorkflowProjection({
        runId: 'workflow.health-review',
        briefId: 'brief.health-review',
        handoffId: 'handoff.health-review',
        context,
        snapshot: {
          schemaVersion: 1,
          projectId: 'true-resume',
          environmentId: 'production',
          observedAt,
          status: 'blocked',
          blockingCount: 1,
          attentionCount: 0,
          totalFindingCount: 1,
          returnedFindingCount: 1,
          truncated: false,
          findings: [finding(observedAt)],
        },
      });
    const previous = projection('2026-08-02T01:00:00.000Z');
    const current = projection('2026-08-02T01:05:00.000Z');

    expect(current.run.evidence[0]?.revision).toBe(previous.run.evidence[0]?.revision);
    expect(resumeOpsWorkflowHandoff({ handoff: previous.handoff, run: current.run })).toMatchObject(
      { status: 'resumable', changedEvidenceIds: [] },
    );
  });
});
