import { describe, expect, it } from 'vitest';
import { createOpsReadActionRequest } from '@unisane/ops-engine/actions';
import { createOpsReadActionRuntime } from '@unisane/ops-engine/execution';
import { InMemoryActionJobStore } from '@unisane/ops-engine/testing';
import type { SeoOpportunityCandidate } from '../playbooks/seo-opportunity-research.js';
import {
  createGrowthSeoOpportunityResearchAction,
  growthSeoOpportunityResearchOutputSchema,
} from './seo-opportunity-research.js';

const observedAt = '2026-08-03T00:00:00.000Z';

function candidate(index: number, freshness: 'fresh' | 'stale' = 'fresh'): SeoOpportunityCandidate {
  return {
    id: `opportunity-${index}`,
    title: `Opportunity ${index}`,
    market: index % 2 === 0 ? 'US / en' : 'IN / en',
    rationale: `Recorded research supports opportunity ${index}.`,
    signals: {
      estimatedMonthlySearches: 1_000 - index,
      competitionIndex: 20 + index,
      marketFit: 'strong',
    },
    evidence: [
      {
        evidenceId: `opportunity-${index}.keyword`,
        revision: 1,
        kind: 'keyword',
        source: 'Keyword Planner',
        observedAt,
        freshness,
        summary: 'Recorded keyword estimate.',
        status: 'current',
      },
      {
        evidenceId: `opportunity-${index}.serp`,
        revision: 1,
        kind: 'serp',
        source: 'Recorded search result',
        observedAt,
        freshness,
        summary: 'Recorded search-result pattern.',
        status: 'current',
      },
    ],
  };
}

function request(action: { id: string; schemaVersion: number }, input: unknown = {}) {
  return createOpsReadActionRequest({
    schemaVersion: 1,
    actionId: action.id,
    actionSchemaVersion: action.schemaVersion,
    idempotencyKey: 'seo-opportunity-research.production',
    context: {
      requestId: 'request.seo-opportunity-research',
      scopeId: 'scope.true-resume',
      projectId: 'true-resume',
      environmentId: 'production',
      principal: { kind: 'agent', id: 'agent.codex' },
      requestedAt: observedAt,
    },
    input,
  });
}

describe('SEO opportunity research action', () => {
  it('bounds ranked results, preserves the selected market, and shares one projection', async () => {
    const action = createGrowthSeoOpportunityResearchAction({
      loadCandidates: () => Array.from({ length: 12 }, (_, index) => candidate(index + 1)),
      now: () => new Date(observedAt),
    });
    const runtime = createOpsReadActionRuntime({
      store: new InMemoryActionJobStore('durable'),
      actions: [action],
      now: () => new Date(observedAt),
      createJobId: () => 'job.seo-opportunities',
    });
    await runtime.admit(request(action, { market: 'US / en', opportunityLimit: 3 }));
    const completed = await runtime.runNext('worker.growth');
    const output = growthSeoOpportunityResearchOutputSchema.parse(completed?.result?.output);

    expect(output).toMatchObject({
      status: 'ready',
      totalCandidateCount: 6,
      returnedOpportunityCount: 3,
      truncated: true,
    });
    expect(output.opportunities.every((item) => item.market === 'US / en')).toBe(true);
    expect(output.evidence).toHaveLength(6);
    expect(output.workflow.contextBrief.presentation).toEqual(output.workflow.presentation);
    expect(output.workflow.run.evidence).toEqual(
      output.evidence.map((item) =>
        expect.objectContaining({ evidenceId: item.evidenceId, revision: item.revision }),
      ),
    );
  });

  it('blocks honestly when no recorded candidate is available', async () => {
    const action = createGrowthSeoOpportunityResearchAction({
      loadCandidates: () => [],
      now: () => new Date(observedAt),
    });
    const runtime = createOpsReadActionRuntime({
      store: new InMemoryActionJobStore('durable'),
      actions: [action],
      now: () => new Date(observedAt),
      createJobId: () => 'job.empty-seo-opportunities',
    });
    await runtime.admit(request(action));
    const completed = await runtime.runNext('worker.growth');
    const output = growthSeoOpportunityResearchOutputSchema.parse(completed?.result?.output);

    expect(output).toMatchObject({ status: 'blocked', opportunities: [] });
    expect(output.workflow.presentation).toMatchObject({
      headline: 'SEO opportunity guidance needs recorded research.',
      nextStep: { deepLink: '/seo/research' },
    });
  });

  it('surfaces stale evidence as attention instead of a confident recommendation', async () => {
    const action = createGrowthSeoOpportunityResearchAction({
      loadCandidates: () => [candidate(1, 'stale')],
      now: () => new Date(observedAt),
    });
    const runtime = createOpsReadActionRuntime({
      store: new InMemoryActionJobStore('durable'),
      actions: [action],
      now: () => new Date(observedAt),
      createJobId: () => 'job.stale-seo-opportunities',
    });
    await runtime.admit(request(action));
    const completed = await runtime.runNext('worker.growth');
    const output = growthSeoOpportunityResearchOutputSchema.parse(completed?.result?.output);

    expect(output.status).toBe('attention');
    expect(output.opportunities[0]).toMatchObject({ confidence: 'low' });
    expect(output.opportunities[0]?.limitations).toContain('Some supporting research is stale.');
  });
});
