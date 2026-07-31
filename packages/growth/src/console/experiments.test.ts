import { describe, expect, it } from 'vitest';
import { buildMarketingConsoleExperiments } from './experiments.js';

describe('Growth console Experiments projection', () => {
  it('keeps planned metadata ideas out of running tests and results', () => {
    const result = buildMarketingConsoleExperiments([
      {
        id: 'homepage-title',
        routePath: '/',
        status: 'ready',
        priority: 'high',
        primaryKeyword: 'resume builder',
        proposedTitle: 'Build a better resume',
        proposedDescription: 'Create a focused resume.',
        rationale: 'The current title does not express the main intent.',
        expectedImpact: 'Improve qualified search visits.',
      },
    ]);

    expect(result).toMatchObject({
      status: 'warn',
      running: [],
      results: [],
      ideas: [
        {
          title: 'Build a better resume',
          kind: 'metadata',
        },
      ],
    });
    expect(result.detail).toMatch(/not running tests or measured results/i);
  });
});
