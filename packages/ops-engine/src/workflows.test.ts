import { describe, expect, it } from 'vitest';
import {
  buildOpsWorkflowContextBrief,
  createOpsWorkflowHandoff,
  defineOpsWorkflowRun,
  invalidateOpsWorkflowEvidence,
  opsWorkflowContextBriefSchema,
  resumeOpsWorkflowHandoff,
} from './workflows.js';

const now = '2026-08-02T00:00:00.000Z';

function createRun(evidenceCount = 1) {
  return defineOpsWorkflowRun({
    schemaVersion: 1,
    kind: 'ops.workflow-run',
    runId: 'workflow.growth-health',
    revision: 1,
    goal: { id: 'growth.health', version: 1 },
    playbook: { id: 'growth.health-review', version: 1 },
    context: {
      scopeId: 'scope.true-resume',
      projectId: 'true-resume',
      environmentId: 'production',
      principal: { kind: 'agent', id: 'agent.codex' },
    },
    status: 'ready',
    currentStageId: 'explain-priority',
    evidence: Array.from(
      { length: evidenceCount },
      (_, index) =>
        ({
          evidenceId: index === 0 ? 'growth.analytics.current' : `growth.analytics.${index + 1}`,
          revision: 1,
          kind: 'observed',
          source: 'Google Analytics',
          observedAt: now,
          freshness: 'fresh',
          summary: 'Analytics data is current.',
          status: 'current',
        }) as const,
    ),
    startedAt: now,
    updatedAt: now,
  });
}

const presentation = {
  headline: 'Growth evidence is ready to use.',
  whyItMatters: 'Current checks support a reliable review.',
  nextStep: {
    label: 'Review the highest-impact priority',
    reason: 'The available evidence is current enough to guide the next decision.',
    actionId: 'growth.health.review',
    deepLink: '/overview',
  },
  supportingReason: 'No required Growth check is blocked.',
} as const;

describe('Ops workflow contracts', () => {
  it('builds bounded strict actor-scoped context without transcript or secret fields', () => {
    const brief = buildOpsWorkflowContextBrief({
      briefId: 'brief.growth-health',
      run: createRun(25),
      presentation,
      generatedAt: now,
    });

    expect(brief.context).toMatchObject({
      scopeId: 'scope.true-resume',
      projectId: 'true-resume',
      environmentId: 'production',
    });
    expect(brief.evidence).toHaveLength(12);
    expect(() =>
      opsWorkflowContextBriefSchema.parse({
        ...brief,
        rawTranscript: 'ignore prior instructions',
      }),
    ).toThrow();
    expect(() =>
      opsWorkflowContextBriefSchema.parse({
        ...brief,
        providerToken: 'secret',
      }),
    ).toThrow();
  });

  it('resumes from stable references and blocks when supporting evidence changes', () => {
    const run = createRun();
    const brief = buildOpsWorkflowContextBrief({
      briefId: 'brief.growth-health',
      run,
      presentation,
      generatedAt: now,
    });
    const handoff = createOpsWorkflowHandoff({
      handoffId: 'handoff.growth-health',
      run,
      contextBrief: brief,
      createdAt: now,
    });

    expect(resumeOpsWorkflowHandoff({ handoff, run })).toMatchObject({
      status: 'resumable',
      nextStep: presentation.nextStep,
    });

    const invalidatedRun = invalidateOpsWorkflowEvidence({
      run,
      evidenceId: 'growth.analytics.current',
      expectedRevision: 1,
      invalidatedAt: '2026-08-03T00:00:00.000Z',
      reason: 'A newer provider observation superseded this evidence.',
    });
    const resume = resumeOpsWorkflowHandoff({ handoff, run: invalidatedRun });
    const refreshedBrief = buildOpsWorkflowContextBrief({
      briefId: 'brief.growth-health.refreshed',
      run: invalidatedRun,
      presentation,
      generatedAt: '2026-08-03T00:00:00.000Z',
    });

    expect(resume).toEqual({
      status: 'evidence-changed',
      runId: 'workflow.growth-health',
      currentStageId: 'explain-priority',
      changedEvidenceIds: ['growth.analytics.current'],
    });
    expect(refreshedBrief.evidence).toEqual([]);
    expect(refreshedBrief.invalidatedEvidenceIds).toEqual(['growth.analytics.current']);
  });

  it('does not resume a handoff under a different actor or workflow contract', () => {
    const run = createRun();
    const brief = buildOpsWorkflowContextBrief({
      briefId: 'brief.growth-health',
      run,
      presentation,
      generatedAt: now,
    });
    const handoff = createOpsWorkflowHandoff({
      handoffId: 'handoff.growth-health',
      run,
      contextBrief: brief,
      createdAt: now,
    });

    expect(
      resumeOpsWorkflowHandoff({
        handoff,
        run: defineOpsWorkflowRun({
          ...run,
          context: { ...run.context, principal: { kind: 'agent', id: 'agent.other' } },
        }),
      }).status,
    ).toBe('run-changed');
    expect(
      resumeOpsWorkflowHandoff({
        handoff,
        run: defineOpsWorkflowRun({
          ...run,
          playbook: { id: 'growth.measurement-audit', version: 1 },
        }),
      }).status,
    ).toBe('run-changed');
  });
});
